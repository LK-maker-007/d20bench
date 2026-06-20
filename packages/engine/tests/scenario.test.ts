import { describe, expect, it } from 'vitest';

import {
  goblinDuelScenario,
  hashStableJson,
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
});
