import { describe, expect, it } from 'vitest';

import {
  llmFrontierModelAgents,
  llmFrontierSmartSeason,
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
});
