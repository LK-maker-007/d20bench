import { describe, expect, it } from 'vitest';

import {
  isFatalSeasonError,
  llmFrontierModelAgents,
  llmFrontierSmartGlmTenXSeason,
  llmFrontierSmartSeason,
  llmFrontierSmartTop3TenXSeason,
  llmSmartGlmModelAgents,
  llmSmartTop3ModelAgents,
  llmToolcallCheapVerifySeason,
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
});
