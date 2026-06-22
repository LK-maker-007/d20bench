import { describe, expect, it } from 'vitest';

import {
  auditLlmSeasonResult,
  isFatalSeasonError,
  llmActualActionSurgeVerifySeason,
  llmActualBestCheapModelAgents,
  llmActualClassFeatureVerifySeason,
  llmActualClassFeatureVerifyV2Season,
  llmActualCheapVerifyModelAgents,
  llmActualCheapRoundRobinV2Season,
  llmActualCheapVerifySeason,
  llmActualCheapVerifyV2Season,
  llmActualCheapVerifyV3Season,
  llmActualCheapVerifyV4Season,
  llmActualCheapVerifyV5Season,
  llmActualCheapVerifyV6Season,
  llmActualCheapVerifyV7Season,
  llmActualCheapVerifyV8Season,
  llmActualCheapVerifyV9Season,
  llmActualCheapVerifyV10Season,
  llmActualCheapVerifyV11Season,
  llmActualCheapVerifyV12Season,
  llmActualCuttingWordsVerifySeason,
  llmActualDeflectVerifySeason,
  llmActualDeepseekSmartCompleteSeason,
  llmActualGlmSmartFourRoundSeason,
  llmActualMitigationVerifySeason,
  llmActualReactionVerifySeason,
  llmActualRecklessVerifySeason,
  llmActualRetaliationVerifySeason,
  llmActualSpellFollowupVerifySeason,
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
  summarizeLlmHarnessAudit,
  type AgentMatchResult,
  type LlmSeasonResult,
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
    expect(llmActualCheapVerifyV10Season.id).toBe('llm-actual-cheap-verify-v10');
    expect(llmActualCheapVerifyV10Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV10Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualCheapVerifyV11Season.id).toBe('llm-actual-cheap-verify-v11');
    expect(llmActualCheapVerifyV11Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV11Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
    expect(llmActualCheapVerifyV12Season.id).toBe('llm-actual-cheap-verify-v12');
    expect(llmActualCheapVerifyV12Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapVerifyV12Season.pairings).toEqual(llmActualCheapVerifySeason.pairings);
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
    expect(llmActualActionSurgeVerifySeason.id).toBe('llm-actual-action-surge-verify-v1');
    expect(llmActualActionSurgeVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualActionSurgeVerifySeason.scenarios.map((scenario) => scenario.id)).toEqual([
      'hidden.llm-action-surge-fighter-duel.v1',
    ]);
    expect(llmActualActionSurgeVerifySeason.pairings).toHaveLength(4);
    expect(llmActualActionSurgeVerifySeason.pairings?.every((pairing) =>
      pairing.redAgent.startsWith('openrouter:') &&
      pairing.blueAgent === 'battlecast.aggressive'
    )).toBe(true);
    expect(llmActualRecklessVerifySeason.id).toBe('llm-actual-reckless-verify-v1');
    expect(llmActualRecklessVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualRecklessVerifySeason.scenarios.map((scenario) => scenario.id)).toEqual([
      'hidden.llm-reckless-barbarian-duel.v1',
    ]);
    expect(llmActualRecklessVerifySeason.pairings).toHaveLength(4);
    expect(llmActualRecklessVerifySeason.pairings?.every((pairing) =>
      pairing.redAgent.startsWith('openrouter:') &&
      pairing.blueAgent === 'battlecast.aggressive'
    )).toBe(true);
    expect(llmActualClassFeatureVerifySeason.id).toBe('llm-actual-class-feature-verify-v1');
    expect(llmActualClassFeatureVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualClassFeatureVerifySeason.scenarios.map((scenario) => scenario.id)).toEqual([
      'hidden.llm-sacred-weapon-paladin-duel.v1',
      'hidden.llm-superior-defense-monk-duel.v1',
    ]);
    expect(llmActualClassFeatureVerifySeason.pairings).toHaveLength(4);
    expect(llmActualClassFeatureVerifySeason.pairings?.every((pairing) =>
      pairing.redAgent.startsWith('openrouter:') &&
      pairing.blueAgent === 'battlecast.aggressive'
    )).toBe(true);
    expect(llmActualClassFeatureVerifyV2Season.id).toBe('llm-actual-class-feature-verify-v2');
    expect(llmActualClassFeatureVerifyV2Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualClassFeatureVerifyV2Season.pairings).toEqual(llmActualClassFeatureVerifySeason.pairings);
    expect(llmActualSpellFollowupVerifySeason.id).toBe('llm-actual-spell-followup-verify-v1');
    expect(llmActualSpellFollowupVerifySeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualSpellFollowupVerifySeason.maxRounds).toBe(2);
    expect(llmActualSpellFollowupVerifySeason.scenarios.map((scenario) => scenario.id)).toEqual([
      'hidden.llm-linked-damage-witch-bolt.v1',
      'hidden.llm-hex-retarget.v1',
      'hidden.llm-swallow-purple-worm.v1',
    ]);
    expect(llmActualSpellFollowupVerifySeason.scenarios.every((scenario) =>
      typeof scenario.setupBattleState === 'function'
    )).toBe(true);
    expect(llmActualSpellFollowupVerifySeason.pairings).toHaveLength(4);
    expect(llmActualSpellFollowupVerifySeason.pairings?.every((pairing) =>
      pairing.redAgent.startsWith('openrouter:') &&
      pairing.blueAgent === 'battlecast.aggressive'
    )).toBe(true);
  });

  it('defines the cheap-model actual-action round robin verification season', () => {
    const agents = llmActualCheapRoundRobinV2Season.agents;
    const pairings = llmActualCheapRoundRobinV2Season.pairings ?? [];
    const orderedPairKeys = new Set(pairings.map((pairing) => `${pairing.redAgent} -> ${pairing.blueAgent}`));
    const matchesPerOrderedPair = llmActualCheapRoundRobinV2Season.scenarios.length *
      llmActualCheapRoundRobinV2Season.seeds.length;
    const matchesPerUnorderedPair = matchesPerOrderedPair * 2;

    expect(llmActualCheapRoundRobinV2Season.id).toBe('llm-actual-cheap-round-robin-v2');
    expect(llmActualCheapRoundRobinV2Season.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualCheapRoundRobinV2Season.maxRounds).toBe(4);
    expect(llmActualCheapRoundRobinV2Season.seeds).toEqual([1]);
    expect(llmActualCheapRoundRobinV2Season.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(agents).toEqual([
      'openrouter:deepseek/deepseek-v4-flash',
      'openrouter:mistralai/ministral-8b-2512',
      'openrouter:meta-llama/llama-3.1-8b-instruct',
      'openrouter:qwen/qwen3.5-flash-02-23',
      'battlecast.smart',
    ]);
    expect(pairings).toHaveLength(agents.length * (agents.length - 1));
    expect(orderedPairKeys.size).toBe(pairings.length);
    expect(matchesPerOrderedPair).toBe(2);
    expect(matchesPerUnorderedPair).toBe(4);
    expect(pairings.length * matchesPerOrderedPair).toBe(40);

    for (const redAgent of agents) {
      for (const blueAgent of agents) {
        if (redAgent === blueAgent) continue;
        expect(orderedPairKeys.has(`${redAgent} -> ${blueAgent}`)).toBe(true);
      }
    }
  });

  it('defines the full-length best-cheap actual-action smart season', () => {
    const pairings = llmActualDeepseekSmartCompleteSeason.pairings ?? [];

    expect(llmActualBestCheapModelAgents).toEqual([
      'openrouter:deepseek/deepseek-v4-flash',
    ]);
    expect(llmActualDeepseekSmartCompleteSeason.id).toBe('llm-actual-deepseek-smart-complete-v1');
    expect(llmActualDeepseekSmartCompleteSeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualDeepseekSmartCompleteSeason.maxRounds).toBe(100);
    expect(llmActualDeepseekSmartCompleteSeason.seeds).toEqual([1]);
    expect(llmActualDeepseekSmartCompleteSeason.agents).toEqual([
      'openrouter:deepseek/deepseek-v4-flash',
      'battlecast.smart',
    ]);
    expect(llmActualDeepseekSmartCompleteSeason.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(pairings).toEqual([
      { redAgent: 'openrouter:deepseek/deepseek-v4-flash', blueAgent: 'battlecast.smart' },
      { redAgent: 'battlecast.smart', blueAgent: 'openrouter:deepseek/deepseek-v4-flash' },
    ]);
    expect(pairings.length * llmActualDeepseekSmartCompleteSeason.scenarios.length * llmActualDeepseekSmartCompleteSeason.seeds.length)
      .toBe(4);
  });

  it('defines the small GLM actual-action smart verification season', () => {
    const pairings = llmActualGlmSmartFourRoundSeason.pairings ?? [];

    expect(llmActualGlmSmartFourRoundSeason.id).toBe('llm-actual-glm-smart-4round-v1');
    expect(llmActualGlmSmartFourRoundSeason.llmActionSpace).toBe('actual-actions-v1');
    expect(llmActualGlmSmartFourRoundSeason.maxRounds).toBe(4);
    expect(llmActualGlmSmartFourRoundSeason.seeds).toEqual([1]);
    expect(llmActualGlmSmartFourRoundSeason.agents).toEqual([
      'openrouter:z-ai/glm-5.2',
      'battlecast.smart',
    ]);
    expect(llmActualGlmSmartFourRoundSeason.scenarios.map((scenario) => scenario.battleType)).toEqual([
      'hero-party-chokepoint',
      'hero-party-status',
    ]);
    expect(pairings).toEqual([
      { redAgent: 'openrouter:z-ai/glm-5.2', blueAgent: 'battlecast.smart' },
      { redAgent: 'battlecast.smart', blueAgent: 'openrouter:z-ai/glm-5.2' },
    ]);
    expect(pairings.length * llmActualGlmSmartFourRoundSeason.scenarios.length * llmActualGlmSmartFourRoundSeason.seeds.length)
      .toBe(4);
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

  it('summarizes model-only harness audit counters from replay events', () => {
    const match = {
      matchId: 'audit-match',
      replay: [
        {
          type: 'turn_started',
          matchId: 'audit-match',
          round: 1,
          turnIndex: 0,
          turnStep: 0,
          activeCreatureId: 'fighter-red',
          activeCreatureName: 'Fighter',
          controller: { mode: 'openrouter-llm', agentId: 'openrouter:test/model', model: 'test/model' },
          actionSpace: 'actual-actions-v1',
          legalActions: [
            { id: 'attack:longsword:goblin-blue', type: 'attack', actionName: 'Longsword', targetId: 'goblin-blue', targetName: 'Goblin', expectedDamage: 7 },
            { id: 'end_turn', type: 'end_turn' },
          ],
          stateHash: 'before-0',
        },
        {
          type: 'action_resolved',
          matchId: 'audit-match',
          round: 1,
          turnIndex: 0,
          turnStep: 0,
          activeCreatureId: 'fighter-red',
          agentId: 'openrouter:test/model',
          requestedActionId: 'attack:longsword:goblin-blue',
          acceptedAction: { id: 'attack:longsword:goblin-blue', type: 'attack', actionName: 'Longsword', targetId: 'goblin-blue', targetName: 'Goblin', expectedDamage: 7 },
          llmTrace: {
            provider: 'openrouter',
            model: 'test/model',
            requestedActionId: 'attack:longsword:goblin-blue',
            acceptedActionId: 'attack:longsword:goblin-blue',
            latencyMs: 10,
            structuredOutput: false,
            repairedJson: false,
            toolCall: true,
            attempts: 2,
            rawTraceIds: ['trace-1'],
          },
          logs: [],
          events: [],
          stateHash: 'after-0',
        },
        {
          type: 'turn_started',
          matchId: 'audit-match',
          round: 1,
          turnIndex: 0,
          turnStep: 1,
          activeCreatureId: 'fighter-red',
          activeCreatureName: 'Fighter',
          controller: { mode: 'openrouter-llm', agentId: 'openrouter:test/model', model: 'test/model' },
          actionSpace: 'battlecast-full-turn',
          legalActions: [
            { id: 'battlecast_tactic:smart', type: 'battlecast_tactic', tactic: 'smart' },
            { id: 'end_turn', type: 'end_turn' },
          ],
          stateHash: 'before-1',
        },
        {
          type: 'action_resolved',
          matchId: 'audit-match',
          round: 1,
          turnIndex: 0,
          turnStep: 1,
          activeCreatureId: 'fighter-red',
          agentId: 'openrouter:test/model',
          requestedActionId: 'battlecast_tactic:smart',
          acceptedAction: { id: 'battlecast_tactic:smart', type: 'battlecast_tactic', tactic: 'smart' },
          llmTrace: {
            provider: 'openrouter',
            model: 'test/model',
            requestedActionId: 'battlecast_tactic:smart',
            acceptedActionId: 'battlecast_tactic:smart',
            latencyMs: 10,
            structuredOutput: false,
            repairedJson: true,
            toolCall: false,
            attempts: 1,
            rawTraceIds: ['trace-2'],
          },
          logs: [],
          events: [],
          stateHash: 'after-1',
        },
        {
          type: 'action_resolved',
          matchId: 'audit-match',
          round: 1,
          turnIndex: 0,
          turnStep: 2,
          activeCreatureId: 'fighter-red',
          agentId: 'openrouter:test/model',
          requestedActionId: 'move_toward:goblin-blue',
          acceptedAction: { id: 'move_toward:goblin-blue', type: 'move_toward', targetId: 'goblin-blue', targetName: 'Goblin' },
          logs: [],
          events: [],
          stateHash: 'after-2',
        },
        {
          type: 'action_resolved',
          matchId: 'audit-match',
          round: 1,
          turnIndex: 0,
          turnStep: 3,
          activeCreatureId: 'fighter-red',
          agentId: 'openrouter:test/model',
          requestedActionId: 'attack:missing:goblin-blue',
          acceptedAction: { id: 'attack:missing:goblin-blue', type: 'attack', actionName: 'Missing', targetId: 'goblin-blue', targetName: 'Goblin', expectedDamage: 1 },
          logs: [{ round: 1, turn: 0, actor: 'Fighter', action: 'Invalid Action', details: 'openrouter:test/model requested attack:missing:goblin-blue, but target or action was unavailable.', type: 'info' }],
          events: [],
          stateHash: 'after-3',
        },
        {
          type: 'action_resolved',
          matchId: 'audit-match',
          round: 1,
          turnIndex: 0,
          turnStep: 1,
          activeCreatureId: 'fighter-red',
          agentId: 'battlecast.smart',
          requestedActionId: 'battlecast_tactic:smart',
          acceptedAction: { id: 'battlecast_tactic:smart', type: 'battlecast_tactic', tactic: 'smart' },
          logs: [],
          events: [],
          stateHash: 'ignored-baseline-action',
        },
      ],
    } as unknown as AgentMatchResult;

    expect(summarizeLlmHarnessAudit([match])).toEqual({
      modelTurnStarts: 2,
      modelActionResolutions: 4,
      modelDelegateLegalActionExposures: 1,
      modelDelegateSelections: 1,
      modelStepwiseTurns: 1,
      modelStepwiseContinuations: 3,
      maxModelActionsInTurn: 4,
      modelToolCallDecisions: 1,
      modelJsonFallbackDecisions: 1,
      modelRepairAttempts: 1,
      modelNoLogMovementActions: 1,
      modelInvalidActionApplications: 1,
      modelActionSpaceTurnStarts: [
        { actionSpace: 'actual-actions-v1', count: 1 },
        { actionSpace: 'battlecast-full-turn', count: 1 },
      ],
      acceptedActionCounts: [
        { actionKey: 'attack:Longsword', count: 1 },
        { actionKey: 'attack:Missing', count: 1 },
        { actionKey: 'battlecast_tactic:smart', count: 1 },
        { actionKey: 'move_toward', count: 1 },
      ],
    });
  });

  it('audits published actual-action season harness counters', () => {
    const harnessAudit = {
      modelTurnStarts: 4,
      modelActionResolutions: 8,
      modelDelegateLegalActionExposures: 0,
      modelDelegateSelections: 0,
      modelStepwiseTurns: 2,
      modelStepwiseContinuations: 4,
      maxModelActionsInTurn: 3,
      modelToolCallDecisions: 8,
      modelJsonFallbackDecisions: 0,
      modelRepairAttempts: 0,
      modelNoLogMovementActions: 0,
      modelInvalidActionApplications: 0,
      modelActionSpaceTurnStarts: [
        { actionSpace: 'actual-actions-v1', count: 4 },
      ],
      acceptedActionCounts: [
        { actionKey: 'attack:Longsword', count: 4 },
      ],
    };
    const result = {
      seasonId: 'llm-actual-audit-test',
      llmActionSpace: 'actual-actions-v1',
      totalMatches: 2,
      completedMatches: 2,
      failedMatches: 0,
      harnessAudit,
    } as Pick<LlmSeasonResult, 'seasonId' | 'llmActionSpace' | 'totalMatches' | 'completedMatches' | 'failedMatches' | 'harnessAudit'>;

    const audit = auditLlmSeasonResult(result, {
      requireComplete: true,
      requireStepwise: true,
      recomputedHarnessAudit: harnessAudit,
      recomputedMatchCount: 2,
    });

    expect(audit.ok).toBe(true);
    expect(audit.checks.map((check) => [check.id, check.ok])).toEqual([
      ['harness-audit-present', true],
      ['all-matches-completed', true],
      ['no-model-delegate-exposures', true],
      ['no-model-delegate-selections', true],
      ['no-invalid-action-applications', true],
      ['no-no-effect-movement-actions', true],
      ['actual-action-space-turn-starts', true],
      ['stepwise-model-turns-present', true],
      ['checkpoint-match-count', true],
      ['harness-audit-matches-checkpoints', true],
    ]);
  });

  it('fails published season audits when checkpoint recomputation disagrees', () => {
    const publishedAudit = {
      modelTurnStarts: 1,
      modelActionResolutions: 1,
      modelDelegateLegalActionExposures: 0,
      modelDelegateSelections: 0,
      modelStepwiseTurns: 1,
      modelStepwiseContinuations: 1,
      maxModelActionsInTurn: 2,
      modelToolCallDecisions: 1,
      modelJsonFallbackDecisions: 0,
      modelRepairAttempts: 0,
      modelNoLogMovementActions: 0,
      modelInvalidActionApplications: 0,
      modelActionSpaceTurnStarts: [
        { actionSpace: 'actual-actions-v1', count: 1 },
      ],
      acceptedActionCounts: [{ actionKey: 'attack:Longsword', count: 1 }],
    };
    const recomputedAudit = {
      ...publishedAudit,
      modelActionResolutions: 2,
      acceptedActionCounts: [{ actionKey: 'attack:Longsword', count: 2 }],
    };
    const result = {
      seasonId: 'llm-actual-audit-test',
      llmActionSpace: 'actual-actions-v1',
      totalMatches: 2,
      completedMatches: 2,
      failedMatches: 0,
      harnessAudit: publishedAudit,
    } as Pick<LlmSeasonResult, 'seasonId' | 'llmActionSpace' | 'totalMatches' | 'completedMatches' | 'failedMatches' | 'harnessAudit'>;

    const audit = auditLlmSeasonResult(result, {
      recomputedHarnessAudit: recomputedAudit,
      recomputedMatchCount: 1,
    });

    expect(audit.ok).toBe(false);
    expect(audit.checks.filter((check) => !check.ok).map((check) => check.id)).toEqual([
      'checkpoint-match-count',
      'harness-audit-matches-checkpoints',
    ]);
  });

  it('fails actual-action season audits when fairness gates regress', () => {
    const result = {
      seasonId: 'llm-actual-audit-test',
      llmActionSpace: 'actual-actions-v1',
      totalMatches: 2,
      completedMatches: 1,
      failedMatches: 1,
      harnessAudit: {
        modelTurnStarts: 2,
        modelActionResolutions: 4,
        modelDelegateLegalActionExposures: 1,
        modelDelegateSelections: 1,
        modelStepwiseTurns: 0,
        modelStepwiseContinuations: 0,
        maxModelActionsInTurn: 1,
        modelToolCallDecisions: 2,
        modelJsonFallbackDecisions: 2,
        modelRepairAttempts: 1,
        modelNoLogMovementActions: 2,
        modelInvalidActionApplications: 1,
        modelActionSpaceTurnStarts: [
          { actionSpace: 'primitive', count: 1 },
        ],
        acceptedActionCounts: [
          { actionKey: 'battlecast_tactic:smart', count: 1 },
        ],
      },
    } as Pick<LlmSeasonResult, 'seasonId' | 'llmActionSpace' | 'totalMatches' | 'completedMatches' | 'failedMatches' | 'harnessAudit'>;

    const audit = auditLlmSeasonResult(result, {
      requireComplete: true,
      requireStepwise: true,
    });

    expect(audit.ok).toBe(false);
    expect(audit.checks.filter((check) => !check.ok).map((check) => check.id)).toEqual([
      'all-matches-completed',
      'no-model-delegate-exposures',
      'no-model-delegate-selections',
      'no-invalid-action-applications',
      'no-no-effect-movement-actions',
      'actual-action-space-turn-starts',
      'stepwise-model-turns-present',
    ]);
  });
});
