import { afterEach, describe, expect, it } from 'vitest';

import {
  rollAttack,
  rollDamage,
  setBattlecastRng,
  withBattlecastRng,
  withBattlecastRngAsync,
} from '../src/battlecast/engine/dice.js';

describe('Battlecast dice compatibility', () => {
  afterEach(() => {
    setBattlecastRng(null);
  });

  it('replays Battlecast-style dice rolls from a seeded RNG', () => {
    const first = withBattlecastRng('duel-1', () => [
      rollAttack(4, true),
      rollDamage('1d8+2', true),
    ]);
    const second = withBattlecastRng('duel-1', () => [
      rollAttack(4, true),
      rollDamage('1d8+2', true),
    ]);

    expect(second).toEqual(first);
  });

  it('keeps critical damage behavior from Battlecast', () => {
    const result = withBattlecastRng(123, () => rollDamage('1d8+3', true));

    expect(result.expression).toBe('2d8+3');
    expect(result.rolls).toHaveLength(2);
    expect(result.modifier).toBe(3);
  });

  it('isolates seeded dice streams across concurrent async turns', async () => {
    const expectedA = withBattlecastRng('async-a', () => [rollAttack(0), rollAttack(0)]);
    const expectedB = withBattlecastRng('async-b', () => [rollAttack(0), rollAttack(0)]);
    let releaseA!: () => void;
    const aCanContinue = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    const actualA = withBattlecastRngAsync('async-a', async () => {
      const first = rollAttack(0);
      await aCanContinue;
      return [first, rollAttack(0)];
    });
    const actualB = withBattlecastRngAsync('async-b', async () => {
      const first = rollAttack(0);
      releaseA();
      await Promise.resolve();
      return [first, rollAttack(0)];
    });

    await expect(actualA).resolves.toEqual(expectedA);
    await expect(actualB).resolves.toEqual(expectedB);
  });
});
