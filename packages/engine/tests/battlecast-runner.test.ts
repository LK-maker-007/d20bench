import { describe, expect, it } from 'vitest';

import {
  runSeededBattlecastBattle,
  summarizeBattlecastBattle,
} from '../src/battlecast-runner.js';

describe('seeded Battlecast battle runner', () => {
  it('runs a reproducible Battlecast-style battle', () => {
    const spec = {
      seed: 'goblin-duel-1',
      gridSize: 12,
      combatants: [
        { monster: 'Goblin Minion', team: 'red' as const, position: { x: 5, y: 5 } },
        { monster: 'Goblin Minion', team: 'blue' as const, position: { x: 6, y: 5 } },
      ],
    };

    const first = summarizeBattlecastBattle(runSeededBattlecastBattle(spec));
    const second = summarizeBattlecastBattle(runSeededBattlecastBattle(spec));

    expect(second).toEqual(first);
    expect(first.winner).not.toBeNull();
    expect(first.logCount).toBeGreaterThan(1);
    expect(first.eventCount).toBeGreaterThan(0);
  });

  it('rejects unknown monster names', () => {
    expect(() => runSeededBattlecastBattle({
      seed: 'bad-monster',
      combatants: [
        { monster: 'Definitely Not A Monster', team: 'red', position: { x: 0, y: 0 } },
        { monster: 'Goblin Minion', team: 'blue', position: { x: 1, y: 0 } },
      ],
    })).toThrow(/unknown Battlecast monster/);
  });
});
