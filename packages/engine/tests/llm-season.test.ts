import { describe, expect, it } from 'vitest';

import {
  isFatalSeasonError,
  llmActualCheapVerifyModelAgents,
  llmActualCheapVerifySeason,
  llmActualCheapVerifyV2Season,
  llmActualCheapVerifyV3Season,
  llmActualCheapVerifyV4Season,
  llmActualCheapVerifyV5Season,
  llmActualCheapVerifyV6Season,
  llmActualCheapVerifyV7Season,
  llmActualCheapVerifyV8Season,
  llmActualCheapVerifyV9Season,
  llmActualCuttingWordsVerifySeason,
  llmActualDeflectVerifySeason,
  llmActualMitigationVerifySeason,
  llmActualReactionVerifySeason,
  llmActualRetaliationVerifySeason,
  llmFrontierModelAgents,
  llmFrontierSmartGlmTenXSeason,
  llmFrontierSmartSeason,
  llmFrontierSmartTop3TenXSeason,
  llmSmartGlmModelAgents,
  llmSmartTop3ModelAgents,
  llmToolcallCheapVerifySeason,
  llmToolcallFrontierSmartSixteenSeason,
  llmToolcallFrontierVerifyModelAgents,
  llmToolcallGlmSmartTwentySeason,
  llmToolcallVerifyModelAgents,
  sanitizeBenchmarkErrorForArtifacts,
} from '../src/index.js';

describe('LLM seasons', () => {
  it('defines the frontier benchmark as smart-only with 8 matches per model', () => {
    const pairings = llmFrontierSmartSeason.pairings ?? [];
    const modelAgents = new Set(llmFrontierModelAgents);
    const matchesByModel = new Map(llmFrontierModelAgents.map((agent) => [agent, 0]));

    expect(llmFrontierSmartSeason.llmActionSpace).toBe('battlecast-full-turn');
    expect(llmFrontierSmartSeason.seeds).toEqual([1, 2]);
    expect(llmFrontierSmartSeason.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(llmFrontierSmartSeason.agents).toContain('battlecast.smart');
    expect(llmFrontierSmartSeason.agents).not.toContain('baseline.random-legal');
    expect(llmFrontierSmartSeason.agents).not.toContain('battlecast.aggressive');
    expect(llmFrontierSmartSeason.agents).not.toContain('battlecast.kiting');
    expect(llmFrontierSmartSeason.agents).not.toContain('battlecast.defensive');

    for (const pairing of pairings) {
      const agents = [pairing.redAgent, pairing.blueAgent];
      expect(agents).toContain('battlecast.smart');
      const model = agents.find((agent) => modelAgents.has(agent));
      expect(model).toBeDefined();
      matchesByModel.set(
        model!,
        matchesByModel.get(model!)! + llmFrontierSmartSeason.scenarios.length * llmFrontierSmartSeason.seeds.length,
      );
    }

    expect(pairings).toHaveLength(llmFrontierModelAgents.length * 2);
    expect([...matchesByModel.values()]).toEqual(llmFrontierModelAgents.map(() => 8));
  });

  it('defines the top-three replication benchmark as a separate 10x season', () => {
    const pairings = llmFrontierSmartTop3TenXSeason.pairings ?? [];
    const modelAgents = new Set(llmSmartTop3ModelAgents);
    const matchesByModel = new Map(llmSmartTop3ModelAgents.map((agent) => [agent, 0]));

    expect(llmFrontierSmartTop3TenXSeason.id).toBe('llm-frontier-smart-top3-10x-v1');
    expect(llmFrontierSmartTop3TenXSeason.llmActionSpace).toBe('battlecast-full-turn');
    expect(llmFrontierSmartTop3TenXSeason.seeds).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
    expect(llmFrontierSmartTop3TenXSeason.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(llmFrontierSmartTop3TenXSeason.agents).toEqual(expect.arrayContaining([
      'openrouter:mistralai/ministral-8b-2512',
      'openrouter:meta-llama/llama-3.1-8b-instruct',
      'openrouter:qwen/qwen3.5-flash-02-23',
      'battlecast.smart',
    ]));
    expect(llmFrontierSmartTop3TenXSeason.agents).not.toContain('openrouter:openai/gpt-5.5');

    for (const pairing of pairings) {
      const agents = [pairing.redAgent, pairing.blueAgent];
      expect(agents).toContain('battlecast.smart');
      const model = agents.find((agent) => modelAgents.has(agent));
      expect(model).toBeDefined();
      matchesByModel.set(
        model!,
        matchesByModel.get(model!)! + llmFrontierSmartTop3TenXSeason.scenarios.length * llmFrontierSmartTop3TenXSeason.seeds.length,
      );
    }

    expect(pairings).toHaveLength(llmSmartTop3ModelAgents.length * 2);
    expect([...matchesByModel.values()]).toEqual(llmSmartTop3ModelAgents.map(() => 80));
  });

  it('defines the GLM replication benchmark as a separate 10x season', () => {
    const pairings = llmFrontierSmartGlmTenXSeason.pairings ?? [];
    const modelAgents = new Set(llmSmartGlmModelAgents);
    const matchesByModel = new Map(llmSmartGlmModelAgents.map((agent) => [agent, 0]));

    expect(llmFrontierSmartGlmTenXSeason.id).toBe('llm-frontier-smart-glm-10x-v1');
    expect(llmFrontierSmartGlmTenXSeason.llmActionSpace).toBe('battlecast-full-turn');
    expect(llmFrontierSmartGlmTenXSeason.seeds).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
    expect(llmFrontierSmartGlmTenXSeason.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(llmFrontierSmartGlmTenXSeason.agents).toEqual(expect.arrayContaining([
      'openrouter:z-ai/glm-5.2',
      'battlecast.smart',
    ]));
    expect(llmFrontierSmartGlmTenXSeason.agents).not.toContain('openrouter:openai/gpt-5.5');
    expect(llmFrontierSmartGlmTenXSeason.agents).not.toContain('openrouter:qwen/qwen3.5-flash-02-23');

    for (const pairing of pairings) {
      const agents = [pairing.redAgent, pairing.blueAgent];
      expect(agents).toContain('battlecast.smart');
      const model = agents.find((agent) => modelAgents.has(agent));
      expect(model).toBeDefined();
      matchesByModel.set(
        model!,
        matchesByModel.get(model!)! + llmFrontierSmartGlmTenXSeason.scenarios.length * llmFrontierSmartGlmTenXSeason.seeds.length,
      );
    }

    expect(pairings).toHaveLength(llmSmartGlmModelAgents.length * 2);
    expect([...matchesByModel.values()]).toEqual(llmSmartGlmModelAgents.map(() => 80));
  });

  it('treats OpenRouter monthly key limits as fatal season errors', () => {
    expect(isFatalSeasonError(
      'OpenRouter request failed (403): {"error":{"message":"Key limit exceeded (monthly limit)."}}',
    )).toBe(true);
  });

  it('redacts OpenRouter key-management URLs from benchmark artifacts', () => {
    expect(sanitizeBenchmarkErrorForArtifacts(
      'Manage it using https://openrouter.ai/workspaces/default/keys/example-key-id-123',
    )).toBe('Manage it using https://openrouter.ai/workspaces/<workspace>/keys/<key>');
  });

  it('defines a cheap-model tool-call verification season', () => {
    const pairings = llmToolcallCheapVerifySeason.pairings ?? [];
    const modelAgents = new Set(llmToolcallVerifyModelAgents);
    const matchesByModel = new Map(llmToolcallVerifyModelAgents.map((agent) => [agent, 0]));

    expect(llmToolcallCheapVerifySeason.id).toBe('llm-toolcall-cheap-verify-v3');
    expect(llmToolcallCheapVerifySeason.llmActionSpace).toBe('battlecast-full-turn');
    expect(llmToolcallCheapVerifySeason.seeds).toEqual([1]);
    expect(llmToolcallCheapVerifySeason.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(llmToolcallCheapVerifySeason.agents).toEqual(expect.arrayContaining([
      'openrouter:mistralai/ministral-8b-2512',
      'openrouter:meta-llama/llama-3.1-8b-instruct',
      'openrouter:qwen/qwen3.5-flash-02-23',
      'battlecast.smart',
    ]));

    for (const pairing of pairings) {
      const agents = [pairing.redAgent, pairing.blueAgent];
      expect(agents).toContain('battlecast.smart');
      const model = agents.find((agent) => modelAgents.has(agent));
      expect(model).toBeDefined();
      matchesByModel.set(
        model!,
        matchesByModel.get(model!)! + llmToolcallCheapVerifySeason.scenarios.length * llmToolcallCheapVerifySeason.seeds.length,
      );
    }

    expect(pairings).toHaveLength(llmToolcallVerifyModelAgents.length * 2);
    expect([...matchesByModel.values()]).toEqual(llmToolcallVerifyModelAgents.map(() => 4));
  });

  it('defines a cheap-model actual-action verification season', () => {
    const pairings = llmActualCheapVerifySeason.pairings ?? [];
    const modelAgents = new Set(llmActualCheapVerifyModelAgents);
    const matchesByModel = new Map(llmActualCheapVerifyModelAgents.map((agent) => [agent, 0]));

    expect(llmActualCheapVerifySeason.id).toBe('llm-actual-cheap-verify-v1');
    expect(llmActualCheapVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifySeason.seeds).toEqual([1]);
    expect(llmActualCheapVerifySeason.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(llmActualCheapVerifySeason.agents).toEqual(expect.arrayContaining([
      'openrouter:deepseek/deepseek-v4-flash',
      'openrouter:mistralai/ministral-8b-2512',
      'openrouter:meta-llama/llama-3.1-8b-instruct',
      'openrouter:qwen/qwen3.5-flash-02-23',
      'battlecast.smart',
    ]));

    for (const pairing of pairings) {
      const agents = [pairing.redAgent, pairing.blueAgent];
      expect(agents).toContain('battlecast.smart');
      const model = agents.find((agent) => modelAgents.has(agent));
      expect(model).toBeDefined();
      matchesByModel.set(
        model!,
        matchesByModel.get(model!)! + llmActualCheapVerifySeason.scenarios.length * llmActualCheapVerifySeason.seeds.length,
      );
    }

    expect(pairings).toHaveLength(llmActualCheapVerifyModelAgents.length * 2);
    expect([...matchesByModel.values()]).toEqual(llmActualCheapVerifyModelAgents.map(() => 4));
    expect(llmActualCheapVerifyV2Season.id).toBe('llm-actual-cheap-verify-v2');
    expect(llmActualCheapVerifyV2Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV2Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualCheapVerifyV3Season.id).toBe('llm-actual-cheap-verify-v3');
    expect(llmActualCheapVerifyV3Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV3Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualCheapVerifyV4Season.id).toBe('llm-actual-cheap-verify-v4');
    expect(llmActualCheapVerifyV4Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV4Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualCheapVerifyV5Season.id).toBe('llm-actual-cheap-verify-v5');
    expect(llmActualCheapVerifyV5Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV5Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualCheapVerifyV6Season.id).toBe('llm-actual-cheap-verify-v6');
    expect(llmActualCheapVerifyV6Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV6Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualCheapVerifyV7Season.id).toBe('llm-actual-cheap-verify-v7');
    expect(llmActualCheapVerifyV7Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV7Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualCheapVerifyV8Season.id).toBe('llm-actual-cheap-verify-v8');
    expect(llmActualCheapVerifyV8Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV8Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualCheapVerifyV9Season.id).toBe('llm-actual-cheap-verify-v9');
    expect(llmActualCheapVerifyV9Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV9Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualReactionVerifySeason.id).toBe('llm-actual-reaction-verify-v1');
    expect(llmActualReactionVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualReactionVerifySeason.scenarios.map((scenario) => scenario.battleType)).toEqual(['reaction-smoke']);
    expect(llmActualReactionVerifySeason.pairings).toHaveLength(4);
    expect(llmActualReactionVerifySeason.pairings?.every((pairing) =>
      pairing.redAgent === 'battlecast.kiting' &&
      pairing.blueAgent.startsWith('openrouter:')
    )).toBe(true);
    expect(llmActualMitigationVerifySeason.id).toBe('llm-actual-mitigation-verify-v3');
    expect(llmActualMitigationVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualMitigationVerifySeason.scenarios.map((scenario) => scenario.battleType)).toEqual(['mitigation-smoke']);
    expect(llmActualMitigationVerifySeason.pairings).toHaveLength(4);
    expect(llmActualMitigationVerifySeason.pairings?.every((pairing) =>
      pairing.redAgent === 'battlecast.aggressive' &&
      pairing.blueAgent.startsWith('openrouter:')
    )).toBe(true);
    expect(llmActualDeflectVerifySeason.id).toBe('llm-actual-deflect-verify-v3');
    expect(llmActualDeflectVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualDeflectVerifySeason.scenarios.map((scenario) => scenario.id)).toEqual([
      'hidden.llm-mitigation-monk-duel.v1',
      'hidden.llm-mitigation-ranger-duel.v1',
    ]);
    expect(llmActualDeflectVerifySeason.pairings).toHaveLength(4);
    expect(llmActualDeflectVerifySeason.pairings?.every((pairing) =>
      pairing.redAgent === 'battlecast.aggressive' &&
      pairing.blueAgent.startsWith('openrouter:')
    )).toBe(true);
    expect(llmActualRetaliationVerifySeason.id).toBe('llm-actual-retaliation-verify-v1');
    expect(llmActualRetaliationVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualRetaliationVerifySeason.scenarios.map((scenario) => scenario.battleType)).toEqual(['retaliation-smoke']);
    expect(llmActualRetaliationVerifySeason.pairings).toHaveLength(4);
    expect(llmActualRetaliationVerifySeason.pairings?.every((pairing) =>
      pairing.redAgent === 'battlecast.aggressive' &&
      pairing.blueAgent.startsWith('openrouter:')
    )).toBe(true);
    expect(llmActualCuttingWordsVerifySeason.id).toBe('llm-actual-cutting-words-verify-v1');
    expect(llmActualCuttingWordsVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCuttingWordsVerifySeason.scenarios.map((scenario) => scenario.id)).toEqual([
      'hidden.llm-cutting-words-attack-party.v1',
      'hidden.llm-cutting-words-damage-party.v1',
    ]);
    expect(llmActualCuttingWordsVerifySeason.pairings).toHaveLength(4);
    expect(llmActualCuttingWordsVerifySeason.pairings?.every((pairing) =>
      pairing.redAgent === 'battlecast.aggressive' &&
      pairing.blueAgent.startsWith('openrouter:')
    )).toBe(true);
  });

  it('defines a twenty-match GLM post-toolcall verification season', () => {
    const pairings = llmToolcallGlmSmartTwentySeason.pairings ?? [];
    const modelAgents = new Set(llmSmartGlmModelAgents);
    const matchesByModel = new Map(llmSmartGlmModelAgents.map((agent) => [agent, 0]));

    expect(llmToolcallGlmSmartTwentySeason.id).toBe('llm-toolcall-glm-smart-20-v2');
    expect(llmToolcallGlmSmartTwentySeason.llmActionSpace).toBe('battlecast-full-turn');
    expect(llmToolcallGlmSmartTwentySeason.seeds).toEqual(
      Array.from({ length: 5 }, (_, index) => index + 1),
    );
    expect(llmToolcallGlmSmartTwentySeason.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(llmToolcallGlmSmartTwentySeason.agents).toEqual(expect.arrayContaining([
      'openrouter:z-ai/glm-5.2',
      'battlecast.smart',
    ]));

    for (const pairing of pairings) {
      const agents = [pairing.redAgent, pairing.blueAgent];
      expect(agents).toContain('battlecast.smart');
      const model = agents.find((agent) => modelAgents.has(agent));
      expect(model).toBeDefined();
      matchesByModel.set(
        model!,
        matchesByModel.get(model!)! + llmToolcallGlmSmartTwentySeason.scenarios.length * llmToolcallGlmSmartTwentySeason.seeds.length,
      );
    }

    expect(pairings).toHaveLength(llmSmartGlmModelAgents.length * 2);
    expect([...matchesByModel.values()]).toEqual(llmSmartGlmModelAgents.map(() => 20));
  });

  it('defines a sixteen-match-per-model frontier tool-call verification season', () => {
    const pairings = llmToolcallFrontierSmartSixteenSeason.pairings ?? [];
    const modelAgents = new Set(llmToolcallFrontierVerifyModelAgents);
    const matchesByModel = new Map(llmToolcallFrontierVerifyModelAgents.map((agent) => [agent, 0]));

    expect(llmToolcallFrontierSmartSixteenSeason.id).toBe('llm-toolcall-frontier-smart-16-v2');
    expect(llmToolcallFrontierSmartSixteenSeason.llmActionSpace).toBe('battlecast-full-turn');
    expect(llmToolcallFrontierSmartSixteenSeason.seeds).toEqual([1, 2, 3, 4]);
    expect(llmToolcallFrontierSmartSixteenSeason.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(llmToolcallFrontierSmartSixteenSeason.agents).toEqual(expect.arrayContaining([
      'openrouter:anthropic/claude-opus-4.8',
      'openrouter:openai/gpt-5.5',
      'battlecast.smart',
    ]));

    for (const pairing of pairings) {
      const agents = [pairing.redAgent, pairing.blueAgent];
      expect(agents).toContain('battlecast.smart');
      const model = agents.find((agent) => modelAgents.has(agent));
      expect(model).toBeDefined();
      matchesByModel.set(
        model!,
        matchesByModel.get(model!)! + llmToolcallFrontierSmartSixteenSeason.scenarios.length * llmToolcallFrontierSmartSixteenSeason.seeds.length,
      );
    }

    expect(pairings).toHaveLength(llmToolcallFrontierVerifyModelAgents.length * 2);
    expect([...matchesByModel.values()]).toEqual(llmToolcallFrontierVerifyModelAgents.map(() => 16));
  });
});
