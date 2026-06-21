import { createHash } from 'node:crypto';

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
  finishReason?: string;
  toolCallId?: string;
  requestedActionId: string;
  acceptedActionId: string;
  invalidActionId?: string;
  rationale?: string;
  parseError?: string;
  usage?: OpenRouterUsage;
  latencyMs: number;
  structuredOutput: boolean;
  repairedJson: boolean;
  toolCall: boolean;
  attempts: number;
  rawTraceIds: string[];
}

export interface OpenRouterActionSelection {
  requestedActionId: string;
  acceptedAction: LegalAction;
  trace: OpenRouterDecisionTrace;
}

interface OpenRouterToolDecision {
  actionId: string;
  rationale?: string;
  toolCallId?: string;
}

const openRouterRequestTimeoutMs = 90_000;
const toolName = 'choose_d20bench_action';
const defaultMaxCompletionTokens = 2048;
const defaultDecisionAttempts = 2;
const modelsWithoutForcedToolChoice = new Set<string>();

export interface OpenRouterDecisionTraceMeta {
  matchId: string;
  round: number;
  turnIndex: number;
  activeCreatureId: string;
  activeCreatureName: string;
  agentId: string;
}

export interface OpenRouterRawDecisionTrace {
  traceId: string;
  provider: 'openrouter';
  model: string;
  attempt: number;
  phase: 'tool_call' | 'repair';
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  meta?: OpenRouterDecisionTraceMeta;
  legalActionIds: string[];
  observationHash: string;
  requestBody: unknown;
  responseStatus?: number;
  responseBodyText?: string;
  responseBody?: unknown;
  parseStatus: 'accepted' | 'rejected' | 'http_error' | 'network_error';
  parseError?: string;
  requestedActionId?: string;
  acceptedActionId?: string;
}

export async function chooseOpenRouterAction(
  agent: OpenRouterAgent,
  context: AgentDecisionContext & {
    traceMeta?: OpenRouterDecisionTraceMeta;
    traceSink?: (trace: OpenRouterRawDecisionTrace) => void | Promise<void>;
  },
): Promise<OpenRouterActionSelection> {
  loadLocalEnv();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing. Put it in .env.local.');
  }

  const observation = buildLlmBattleObservation(context.state, context.activeCreature, context.catalogue);
  const observationHash = hashJson(observation);
  const legalActionIds = context.catalogue.actions.map((action) => action.id);
  const startedAt = Date.now();
  const rawTraceIds: string[] = [];
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= openRouterDecisionAttempts(); attempt += 1) {
    const phase = attempt === 1 ? 'tool_call' : 'repair';
    let forceToolChoice = !modelsWithoutForcedToolChoice.has(agent.model);
    let requestBody = buildOpenRouterToolRequest({
      model: agent.model,
      observation,
      legalActionIds,
      repairError: lastError,
      forceToolChoice,
    });

    let response: Awaited<ReturnType<typeof sendOpenRouterRequestWithRetry>>;
    try {
      response = await sendOpenRouterRequestWithRetry({ apiKey, requestBody });
    } catch (error) {
      const trace = buildRawTrace({
        agent,
        attempt,
        phase,
        startedAt,
        requestBody,
        response: undefined,
        parseStatus: 'network_error',
        parseError: error instanceof Error ? error.message : String(error),
        observationHash,
        legalActionIds,
        meta: context.traceMeta,
      });
      rawTraceIds.push(trace.traceId);
      await context.traceSink?.(trace);
      throw error;
    }

    if (!response.ok && forceToolChoice && isForcedToolChoiceCompatibilityError(response)) {
      const error = `OpenRouter tool request failed (${response.status}): ${response.bodyText.slice(0, 500)}`;
      const trace = buildRawTrace({
        agent,
        attempt,
        phase,
        startedAt,
        requestBody,
        response,
        parseStatus: 'http_error',
        parseError: error,
        observationHash,
        legalActionIds,
        meta: context.traceMeta,
      });
      rawTraceIds.push(trace.traceId);
      await context.traceSink?.(trace);
      modelsWithoutForcedToolChoice.add(agent.model);
      forceToolChoice = false;
      requestBody = buildOpenRouterToolRequest({
        model: agent.model,
        observation,
        legalActionIds,
        repairError: lastError,
        forceToolChoice,
      });
      try {
        response = await sendOpenRouterRequestWithRetry({ apiKey, requestBody });
      } catch (retryError) {
        const retryTrace = buildRawTrace({
          agent,
          attempt,
          phase,
          startedAt,
          requestBody,
          response: undefined,
          parseStatus: 'network_error',
          parseError: retryError instanceof Error ? retryError.message : String(retryError),
          observationHash,
          legalActionIds,
          meta: context.traceMeta,
        });
        rawTraceIds.push(retryTrace.traceId);
        await context.traceSink?.(retryTrace);
        throw retryError;
      }
    }

    if (!response.ok) {
      const error = `OpenRouter tool request failed (${response.status}): ${response.bodyText.slice(0, 500)}`;
      const trace = buildRawTrace({
        agent,
        attempt,
        phase,
        startedAt,
        requestBody,
        response,
        parseStatus: 'http_error',
        parseError: error,
        observationHash,
        legalActionIds,
        meta: context.traceMeta,
      });
      rawTraceIds.push(trace.traceId);
      await context.traceSink?.(trace);
      throw new Error(error);
    }

    const message = response.body?.choices?.[0]?.message;
    try {
      const toolDecision = parseToolDecision(message);
      const acceptedAction = findLegalAction(context.catalogue, toolDecision.actionId);
      if (!acceptedAction) {
        throw new Error(`tool call selected non-legal actionId: ${toolDecision.actionId}`);
      }
      const trace = buildRawTrace({
        agent,
        attempt,
        phase,
        startedAt,
        requestBody,
        response,
        parseStatus: 'accepted',
        observationHash,
        legalActionIds,
        meta: context.traceMeta,
        requestedActionId: toolDecision.actionId,
        acceptedActionId: acceptedAction.id,
      });
      rawTraceIds.push(trace.traceId);
      await context.traceSink?.(trace);

      return {
        requestedActionId: toolDecision.actionId,
        acceptedAction,
        trace: {
          provider: 'openrouter',
          model: agent.model,
          responseModel: response.body?.model,
          generationId: response.body?.id,
          finishReason: response.body?.choices?.[0]?.finish_reason,
          toolCallId: toolDecision.toolCallId,
          requestedActionId: toolDecision.actionId,
          acceptedActionId: acceptedAction.id,
          rationale: toolDecision.rationale,
          usage: normalizeUsage(response.body?.usage),
          latencyMs: Date.now() - startedAt,
          structuredOutput: true,
          repairedJson: false,
          toolCall: true,
          attempts: attempt,
          rawTraceIds,
        },
      };
    } catch (error) {
      lastError = formatParseError(agent.model, message, error);
      const trace = buildRawTrace({
        agent,
        attempt,
        phase,
        startedAt,
        requestBody,
        response,
        parseStatus: 'rejected',
        parseError: lastError,
        observationHash,
        legalActionIds,
        meta: context.traceMeta,
      });
      rawTraceIds.push(trace.traceId);
      await context.traceSink?.(trace);
    }
  }

  throw new Error(`OpenRouter tool call did not produce a legal action after ${openRouterDecisionAttempts()} attempt(s): ${lastError ?? 'unknown parse error'}`);
}

async function sendOpenRouterRequestWithRetry(input: {
  apiKey: string;
  requestBody: unknown;
}): Promise<{
  ok: boolean;
  status: number;
  bodyText: string;
  body?: any;
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
  requestBody: unknown;
}): Promise<{
  ok: boolean;
  status: number;
  bodyText: string;
  body?: any;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, openRouterRequestTimeoutMs);
  let res: Response;
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/opengandalf/d20bench',
        'X-Title': 'D20bench',
      },
      body: JSON.stringify(input.requestBody),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`OpenRouter request timed out after ${openRouterRequestTimeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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
  };
}

function isRetryableOpenRouterStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function isForcedToolChoiceCompatibilityError(response: {
  status: number;
  bodyText: string;
}): boolean {
  return response.status === 404
    && /No endpoints found/i.test(response.bodyText)
    && /tool_choice|requested parameters|provided .*tool_choice/i.test(response.bodyText);
}

function buildOpenRouterToolRequest(input: {
  model: string;
  observation: unknown;
  legalActionIds: string[];
  repairError: string | undefined;
  forceToolChoice: boolean;
}): unknown {
  const messages = [
    {
      role: 'system',
      content: [
        'You are controlling one creature in a deterministic D20bench tactical combat benchmark.',
        `You must call the ${toolName} tool exactly once.`,
        'Choose exactly one actionId from the tool enum. Do not answer in text.',
        'The engine handles all rules, dice, movement, spells, healing, buffs, AoE, and damage.',
        'Use the observation metadata: action profiles, defenses, resources, recharges, active buffs, condition timers, and tacticReference.',
      ].join(' '),
    },
    ...(input.repairError ? [{
      role: 'system',
      content: `Your previous response was rejected: ${input.repairError}. Call ${toolName} with one legal actionId from the enum.`,
    }] : []),
    {
      role: 'user',
      content: JSON.stringify(input.observation),
    },
  ];

  return {
    model: input.model,
    temperature: 0,
    max_tokens: openRouterMaxCompletionTokens(),
    provider: {
      require_parameters: true,
    },
    messages,
    tools: [
      {
        type: 'function',
        function: {
          name: toolName,
          description: 'Select exactly one legal D20bench action id for the active creature.',
          parameters: {
            type: 'object',
            additionalProperties: false,
            properties: {
              actionId: {
                type: 'string',
                enum: input.legalActionIds,
                description: 'One exact id from the current legalActions list.',
              },
              rationale: {
                type: 'string',
                description: 'One short sentence explaining the tactical choice.',
              },
            },
            required: ['actionId', 'rationale'],
          },
        },
      },
    ],
    ...(input.forceToolChoice ? { tool_choice: {
      type: 'function',
      function: { name: toolName },
    } } : {}),
  };
}

function parseToolDecision(message: any): OpenRouterToolDecision {
  const toolCalls = message?.tool_calls;
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    throw new Error('OpenRouter response did not include tool_calls.');
  }
  if (toolCalls.length !== 1) {
    throw new Error(`OpenRouter response included ${toolCalls.length} tool calls; expected exactly one.`);
  }

  const toolCall = toolCalls[0];
  const functionCall = toolCall?.function;
  if (!functionCall || functionCall.name !== toolName) {
    throw new Error(`OpenRouter response called ${functionCall?.name ?? '<missing>'}; expected ${toolName}.`);
  }

  const rawArguments = functionCall.arguments;
  const parsed = typeof rawArguments === 'string'
    ? JSON.parse(rawArguments) as Partial<OpenRouterToolDecision>
    : rawArguments as Partial<OpenRouterToolDecision>;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('OpenRouter tool arguments were not an object.');
  }
  if (typeof parsed.actionId !== 'string' || parsed.actionId.length === 0) {
    throw new Error('OpenRouter tool arguments did not include actionId.');
  }

  return {
    actionId: parsed.actionId,
    rationale: typeof parsed.rationale === 'string' ? parsed.rationale : undefined,
    toolCallId: typeof toolCall.id === 'string' ? toolCall.id : undefined,
  };
}

function buildRawTrace(input: {
  agent: OpenRouterAgent;
  attempt: number;
  phase: 'tool_call' | 'repair';
  startedAt: number;
  requestBody: unknown;
  response: Awaited<ReturnType<typeof sendOpenRouterRequestWithRetry>> | undefined;
  parseStatus: OpenRouterRawDecisionTrace['parseStatus'];
  parseError?: string;
  observationHash: string;
  legalActionIds: string[];
  meta?: OpenRouterDecisionTraceMeta;
  requestedActionId?: string;
  acceptedActionId?: string;
}): OpenRouterRawDecisionTrace {
  const completedAt = new Date();
  const latencyMs = completedAt.getTime() - input.startedAt;
  const traceSeed = JSON.stringify({
    model: input.agent.model,
    attempt: input.attempt,
    phase: input.phase,
    meta: input.meta,
    completedAt: completedAt.toISOString(),
    status: input.response?.status,
    requestedActionId: input.requestedActionId,
  });
  return {
    traceId: createHash('sha256').update(traceSeed).digest('hex').slice(0, 16),
    provider: 'openrouter',
    model: input.agent.model,
    attempt: input.attempt,
    phase: input.phase,
    startedAt: new Date(input.startedAt).toISOString(),
    completedAt: completedAt.toISOString(),
    latencyMs,
    meta: input.meta,
    legalActionIds: input.legalActionIds,
    observationHash: input.observationHash,
    requestBody: input.requestBody,
    responseStatus: input.response?.status,
    responseBodyText: input.response?.bodyText,
    responseBody: input.response?.body,
    parseStatus: input.parseStatus,
    parseError: input.parseError,
    requestedActionId: input.requestedActionId,
    acceptedActionId: input.acceptedActionId,
  };
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function openRouterMaxCompletionTokens(): number {
  return numberEnv('D20BENCH_OPENROUTER_MAX_COMPLETION_TOKENS') ?? defaultMaxCompletionTokens;
}

function openRouterDecisionAttempts(): number {
  return numberEnv('D20BENCH_OPENROUTER_TOOL_ATTEMPTS') ?? defaultDecisionAttempts;
}

function numberEnv(key: string): number | undefined {
  const raw = process.env[key];
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
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
