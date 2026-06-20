import type { AgentDecisionContext, OpenRouterAgent } from './agents.js';
import { loadLocalEnv } from './env.js';
import { findLegalAction, type LegalAction } from './legal-actions.js';
import { buildLlmBattleObservation } from './llm-observation.js';

export interface OpenRouterUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface OpenRouterDecisionTrace {
  provider: 'openrouter';
  model: string;
  responseModel?: string;
  generationId?: string;
  requestedActionId: string;
  acceptedActionId: string;
  invalidActionId?: string;
  rationale?: string;
  parseError?: string;
  usage?: OpenRouterUsage;
  latencyMs: number;
  structuredOutput: boolean;
  repairedJson: boolean;
}

export interface OpenRouterActionSelection {
  requestedActionId: string;
  acceptedAction: LegalAction;
  trace: OpenRouterDecisionTrace;
}

interface OpenRouterDecisionJson {
  actionId: string;
  rationale?: string;
}

export async function chooseOpenRouterAction(
  agent: OpenRouterAgent,
  context: AgentDecisionContext,
): Promise<OpenRouterActionSelection> {
  loadLocalEnv();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing. Put it in .env.local.');
  }

  const observation = buildLlmBattleObservation(context.state, context.activeCreature, context.catalogue);
  const startedAt = Date.now();
  const first = await sendOpenRouterRequestWithRetry({
    apiKey,
    model: agent.model,
    observation,
    structuredOutput: true,
  });
  let response = first.ok ? first : await sendOpenRouterRequestWithRetry({
    apiKey,
    model: agent.model,
    observation,
    structuredOutput: false,
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed (${response.status}): ${response.bodyText.slice(0, 500)}`);
  }

  let decision: OpenRouterDecisionJson;
  let parseError: string | undefined;
  try {
    decision = parseDecisionJson(extractDecisionContent(response.body?.choices?.[0]?.message));
  } catch (error) {
    if (response.structuredOutput) {
      response = await sendOpenRouterRequestWithRetry({
        apiKey,
        model: agent.model,
        observation,
        structuredOutput: false,
      });
      if (!response.ok) {
        throw new Error(`OpenRouter fallback request failed (${response.status}): ${response.bodyText.slice(0, 500)}`);
      }
      try {
        decision = parseDecisionJson(extractDecisionContent(response.body?.choices?.[0]?.message));
      } catch (fallbackError) {
        parseError = formatParseError(agent.model, response.body?.choices?.[0]?.message, fallbackError);
        decision = {
          actionId: 'end_turn',
          rationale: 'Fallback: model did not return parseable action JSON.',
        };
      }
    } else {
      parseError = formatParseError(agent.model, response.body?.choices?.[0]?.message, error);
      decision = {
        actionId: 'end_turn',
        rationale: 'Fallback: model did not return parseable action JSON.',
      };
    }
  }
  const requestedActionId = decision.actionId;
  const acceptedAction = findLegalAction(context.catalogue, requestedActionId) ?? { id: 'end_turn', type: 'end_turn' };

  return {
    requestedActionId,
    acceptedAction,
    trace: {
      provider: 'openrouter',
      model: agent.model,
      responseModel: response.body?.model,
      generationId: response.body?.id,
      requestedActionId,
      acceptedActionId: acceptedAction.id,
      invalidActionId: acceptedAction.id === requestedActionId ? undefined : requestedActionId,
      rationale: decision.rationale,
      parseError,
      usage: normalizeUsage(response.body?.usage),
      latencyMs: Date.now() - startedAt,
      structuredOutput: response.structuredOutput,
      repairedJson: response.repairedJson,
    },
  };
}

async function sendOpenRouterRequestWithRetry(input: {
  apiKey: string;
  model: string;
  observation: unknown;
  structuredOutput: boolean;
}): Promise<{
  ok: boolean;
  status: number;
  bodyText: string;
  body?: any;
  structuredOutput: boolean;
  repairedJson: boolean;
}> {
  const maxAttempts = 4;
  let lastResponse: Awaited<ReturnType<typeof sendOpenRouterRequest>> | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await sendOpenRouterRequest(input);
      if (response.ok || !isRetryableOpenRouterStatus(response.status) || attempt === maxAttempts) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
    }

    await sleep(1000 * attempt * attempt);
  }

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function sendOpenRouterRequest(input: {
  apiKey: string;
  model: string;
  observation: unknown;
  structuredOutput: boolean;
}): Promise<{
  ok: boolean;
  status: number;
  bodyText: string;
  body?: any;
  structuredOutput: boolean;
  repairedJson: boolean;
}> {
  const body = {
    model: input.model,
    temperature: 0,
    max_completion_tokens: 800,
    messages: [
      {
        role: 'system',
        content: [
          'You are controlling one creature in a deterministic D20bench tactical combat benchmark.',
          'Choose exactly one action id from the provided legalActions list.',
          'Do not invent actions. Do not explain rules. The engine handles all rules, dice, movement, and damage.',
          'When legalActions include battlecast_tactic ids, those are full-turn delegates that may move, cast spells, heal, buff, use AoE, and attack through the copied Battlecast engine.',
          'Return concise JSON with actionId and rationale only.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify(input.observation),
      },
    ],
    ...(input.structuredOutput ? {
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'd20bench_action_choice',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              actionId: {
                type: 'string',
                description: 'One exact id from legalActions.',
              },
              rationale: {
                type: 'string',
                description: 'One short sentence explaining the choice.',
              },
            },
            required: ['actionId', 'rationale'],
          },
        },
      },
    } : {}),
  };

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/opengandalf/d20bench',
      'X-Title': 'D20bench',
    },
    body: JSON.stringify(body),
  });
  const bodyText = await res.text();
  let parsedBody: any;
  try {
    parsedBody = JSON.parse(bodyText);
  } catch {
    parsedBody = undefined;
  }

  return {
    ok: res.ok,
    status: res.status,
    bodyText,
    body: parsedBody,
    structuredOutput: input.structuredOutput,
    repairedJson: false,
  };
}

function isRetryableOpenRouterStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function parseDecisionJson(content: unknown): OpenRouterDecisionJson {
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const parsed = content as Partial<OpenRouterDecisionJson>;
    if (typeof parsed.actionId === 'string' && parsed.actionId.length > 0) {
      return {
        actionId: parsed.actionId,
        rationale: typeof parsed.rationale === 'string' ? parsed.rationale : undefined,
      };
    }
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') return part.text;
        if (part && typeof part === 'object' && 'content' in part && typeof part.content === 'string') return part.content;
        return '';
      })
      .join('\n')
      .trim();
    if (text.length > 0) return parseDecisionJson(text);
  }

  if (typeof content !== 'string') {
    throw new Error('OpenRouter response did not include string content.');
  }

  const candidates = [
    content,
    content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''),
    content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1),
  ].filter((candidate) => candidate.trim().length > 0);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<OpenRouterDecisionJson>;
      if (typeof parsed.actionId === 'string' && parsed.actionId.length > 0) {
        return {
          actionId: parsed.actionId,
          rationale: typeof parsed.rationale === 'string' ? parsed.rationale : undefined,
        };
      }
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(`OpenRouter response was not valid action JSON: ${content.slice(0, 500)}`);
}

function extractDecisionContent(message: any): unknown {
  if (!message || typeof message !== 'object') return undefined;
  return message.content ?? message.parsed ?? message.reasoning ?? message;
}

function formatParseError(model: string, message: unknown, error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  const sample = (JSON.stringify(message) ?? String(message)).slice(0, 700);
  return `OpenRouter response for ${model} did not include parseable action JSON. Message: ${sample}. Error: ${detail}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUsage(usage: any): OpenRouterUsage | undefined {
  if (!usage || typeof usage !== 'object') return undefined;
  return {
    promptTokens: numberOrUndefined(usage.prompt_tokens),
    completionTokens: numberOrUndefined(usage.completion_tokens),
    totalTokens: numberOrUndefined(usage.total_tokens),
  };
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}
