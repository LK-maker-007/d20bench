import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  chooseOpenRouterAction,
  generateLegalActions,
  goblinDuelScenario,
  type OpenRouterRawDecisionTrace,
} from '../src/index.js';
import { createBattlecastCreatures } from '../src/battlecast-runner.js';
import { initBattle } from '../src/battlecast/engine/combat.js';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENROUTER_API_KEY;
const originalMaxCompletionTokens = process.env.D20BENCH_OPENROUTER_MAX_COMPLETION_TOKENS;
const originalGlmMaxCompletionTokens = process.env.D20BENCH_OPENROUTER_GLM_MAX_COMPLETION_TOKENS;

describe('OpenRouter action selection', () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    delete process.env.D20BENCH_OPENROUTER_MAX_COMPLETION_TOKENS;
    delete process.env.D20BENCH_OPENROUTER_GLM_MAX_COMPLETION_TOKENS;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalApiKey;
    }
    if (originalMaxCompletionTokens === undefined) {
      delete process.env.D20BENCH_OPENROUTER_MAX_COMPLETION_TOKENS;
    } else {
      process.env.D20BENCH_OPENROUTER_MAX_COMPLETION_TOKENS = originalMaxCompletionTokens;
    }
    if (originalGlmMaxCompletionTokens === undefined) {
      delete process.env.D20BENCH_OPENROUTER_GLM_MAX_COMPLETION_TOKENS;
    } else {
      process.env.D20BENCH_OPENROUTER_GLM_MAX_COMPLETION_TOKENS = originalGlmMaxCompletionTokens;
    }
    vi.restoreAllMocks();
  });

  it('forces a single tool call whose actionId is constrained to current legal actions', async () => {
    const { context, firstActionId } = createDecisionContext();
    const requests: any[] = [];
    const rawTraces: OpenRouterRawDecisionTrace[] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      requests.push(body);
      return jsonResponse({
        id: 'gen-tool-ok',
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [toolCall({ actionId: firstActionId, rationale: 'Best legal attack.' })],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const selection = await chooseOpenRouterAction(
      { id: 'openrouter:test/tool-model', kind: 'openrouter-llm', model: 'test/tool-model' },
      { ...context, traceSink: (trace) => rawTraces.push(trace) },
    );

    expect(selection.acceptedAction.id).toBe(firstActionId);
    expect(selection.trace.toolCall).toBe(true);
    expect(selection.trace.attempts).toBe(1);
    expect(selection.trace.rawTraceIds).toHaveLength(1);
    expect(rawTraces).toHaveLength(1);
    expect(rawTraces[0].parseStatus).toBe('accepted');
    expect(requests[0].response_format).toBeUndefined();
    expect(requests[0].temperature).toBeUndefined();
    expect(requests[0].tools[0].function.name).toBe('choose_d20bench_action');
    expect(requests[0].tools[0].function.parameters.properties.actionId.enum).toEqual(
      context.catalogue.actions.map((action) => action.id),
    );
    expect(requests[0].tool_choice).toEqual({
      type: 'function',
      function: { name: 'choose_d20bench_action' },
    });
    expect(requests[0].max_tokens).toEqual(expect.any(Number));
    expect(requests[0].max_completion_tokens).toBeUndefined();
    expect(requests[0].parallel_tool_calls).toBeUndefined();
    expect(requests[0].provider.require_parameters).toBe(true);
  });

  it('uses a larger default completion budget for GLM reasoning models', async () => {
    const { context, firstActionId } = createDecisionContext();
    const requests: any[] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      requests.push(body);
      return jsonResponse({
        id: 'gen-glm-tool-ok',
        model: 'z-ai/glm-5.2',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [toolCall({ actionId: firstActionId, rationale: 'GLM tool call.' })],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    await chooseOpenRouterAction(
      { id: 'openrouter:z-ai/glm-5.2', kind: 'openrouter-llm', model: 'z-ai/glm-5.2' },
      context,
    );

    expect(requests[0].max_tokens).toBe(8192);
  });

  it('repairs a missing tool call without converting it to end_turn', async () => {
    const { context, firstActionId } = createDecisionContext();
    const rawTraces: OpenRouterRawDecisionTrace[] = [];
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({
          id: 'gen-no-tool',
          model: 'test/tool-model',
          choices: [{ finish_reason: 'stop', message: { content: '{"actionId":"end_turn"}' } }],
          usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
        });
      }
      return jsonResponse({
        id: 'gen-tool-repair',
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [toolCall({ actionId: firstActionId, rationale: 'Repair with a tool call.' })],
          },
        }],
        usage: { prompt_tokens: 12, completion_tokens: 5, total_tokens: 17 },
      });
    }) as typeof fetch;

    const selection = await chooseOpenRouterAction(
      { id: 'openrouter:test/tool-model', kind: 'openrouter-llm', model: 'test/tool-model' },
      { ...context, traceSink: (trace) => rawTraces.push(trace) },
    );

    expect(selection.acceptedAction.id).toBe(firstActionId);
    expect(selection.trace.attempts).toBe(2);
    expect(rawTraces.map((trace) => trace.parseStatus)).toEqual(['rejected', 'accepted']);
    expect(rawTraces[0].parseError).toContain('did not include tool_calls');
  });

  it('retries forced tool_choice compatibility errors without consuming a repair attempt', async () => {
    const { context, firstActionId } = createDecisionContext();
    const requests: any[] = [];
    const rawTraces: OpenRouterRawDecisionTrace[] = [];
    let calls = 0;
    globalThis.fetch = vi.fn(async (_url, init) => {
      calls += 1;
      const body = JSON.parse(String(init?.body));
      requests.push(body);
      if (calls === 1) {
        return new Response(JSON.stringify({
          error: {
            message: "No endpoints found that support the provided 'tool_choice' value.",
          },
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return jsonResponse({
        id: 'gen-tool-compatible',
        model: 'test/no-forced-tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [toolCall({ actionId: firstActionId, rationale: 'Retry accepted.' })],
          },
        }],
        usage: { prompt_tokens: 12, completion_tokens: 5, total_tokens: 17 },
      });
    }) as typeof fetch;

    const selection = await chooseOpenRouterAction(
      { id: 'openrouter:test/no-forced-tool-model', kind: 'openrouter-llm', model: 'test/no-forced-tool-model' },
      { ...context, traceSink: (trace) => rawTraces.push(trace) },
    );

    expect(selection.acceptedAction.id).toBe(firstActionId);
    expect(selection.trace.attempts).toBe(1);
    expect(selection.trace.rawTraceIds).toHaveLength(2);
    expect(rawTraces.map((trace) => trace.parseStatus)).toEqual(['http_error', 'accepted']);
    expect(requests[0].tool_choice).toEqual({
      type: 'function',
      function: { name: 'choose_d20bench_action' },
    });
    expect(requests[1].tool_choice).toBeUndefined();
    expect(requests[1].tools[0].function.name).toBe('choose_d20bench_action');
  });

  it('rejects repeated malformed tool output instead of falling back to end_turn', async () => {
    const { context } = createDecisionContext();
    const rawTraces: OpenRouterRawDecisionTrace[] = [];
    globalThis.fetch = vi.fn(async () => jsonResponse({
      id: 'gen-bad-tool',
      model: 'test/tool-model',
      choices: [{
        finish_reason: 'tool_calls',
        message: {
          tool_calls: [toolCall({ actionId: 'not-a-legal-action', rationale: 'Bad id.' })],
        },
      }],
      usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
    })) as typeof fetch;

    await expect(chooseOpenRouterAction(
      { id: 'openrouter:test/tool-model', kind: 'openrouter-llm', model: 'test/tool-model' },
      { ...context, traceSink: (trace) => rawTraces.push(trace) },
    )).rejects.toThrow(/did not produce a legal action/);

    expect(rawTraces).toHaveLength(2);
    expect(rawTraces.every((trace) => trace.parseStatus === 'rejected')).toBe(true);
    expect(rawTraces.every((trace) => trace.acceptedActionId === undefined)).toBe(true);
  });
});

function createDecisionContext() {
  const state = initBattle(createBattlecastCreatures(goblinDuelScenario.combatants, true), goblinDuelScenario.gridSize);
  const active = state.creatures.find((creature) => creature.id === state.initiativeOrder[0]);
  if (!active) throw new Error('expected active creature');
  const catalogue = generateLegalActions(state, active);
  const firstActionId = catalogue.actions[0]?.id;
  if (!firstActionId) throw new Error('expected at least one legal action');
  return {
    context: {
      state,
      activeCreature: active,
      catalogue,
      rng: { next: () => 0.5, pick: <T>(items: T[]) => items[0]! },
    },
    firstActionId,
  };
}

function toolCall(args: { actionId: string; rationale: string }) {
  return {
    id: 'call-test',
    type: 'function',
    function: {
      name: 'choose_d20bench_action',
      arguments: JSON.stringify(args),
    },
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
