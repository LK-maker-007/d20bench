import { describe, expect, it } from 'vitest';

import {
  goblinDuelScenario,
  hashStableJson,
  listScenarios,
  runD20benchScenario,
} from '../src/index.js';

describe('D20bench scenarios', () => {
  it('runs a public scenario with a deterministic final state hash', () => {
    const first = runD20benchScenario(goblinDuelScenario, 'scenario-seed-1');
    const second = runD20benchScenario(goblinDuelScenario, 'scenario-seed-1');

    expect(second.finalStateHash).toBe(first.finalStateHash);
    expect(second.summary).toEqual(first.summary);
    expect(first.finalStateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.summary.winner).not.toBeNull();
  });

  it('stable JSON hashing ignores object key insertion order', () => {
    expect(hashStableJson({ b: 2, a: { d: 4, c: 3 } })).toBe(
      hashStableJson({ a: { c: 3, d: 4 }, b: 2 }),
    );
  });

  it('registers complex mirrored public scenarios with design metadata', () => {
    const publicScenarios = listScenarios('public');
    const ids = publicScenarios.map((scenario) => scenario.id);

    expect(ids).toEqual(expect.arrayContaining([
      'public.goblin-warband-6v6.v1',
      'public.hero-mirror-balanced-l5.v1',
      'public.hero-mirror-chokepoint-l5.v1',
      'public.hero-mirror-status-l5.v1',
    ]));
    expect(publicScenarios.every((scenario) => scenario.battleType.length > 0)).toBe(true);

    for (const scenario of publicScenarios.filter((candidate) => candidate.id.includes('mirror') || candidate.id.includes('warband'))) {
      const redCount = scenario.combatants.filter((combatant) => combatant.team === 'red').length;
      const blueCount = scenario.combatants.filter((combatant) => combatant.team === 'blue').length;
      expect(redCount).toBe(blueCount);
      expect(scenario.tacticalTags?.length).toBeGreaterThan(0);
      expect(scenario.designNotes?.length).toBeGreaterThan(0);
    }
  });
});
