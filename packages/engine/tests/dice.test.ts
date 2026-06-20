import { describe, expect, it } from 'vitest';

import {
  abilityModifier,
  averageDamage,
  criticalDamageExpression,
  maxDiceTotal,
  rollAttack,
  rollD20,
  rollDamage,
  rollDice,
  rollInitiative,
  rollSave,
} from '../src/dice.js';
import type { RandomSource } from '../src/random.js';

describe('dice', () => {
  it('rolls Battlecast-style dice expressions with modifiers', () => {
    const result = rollDice(fixedRng([0, 0.999]), '2d6+3');

    expect(result).toEqual({
      total: 10,
      rolls: [1, 6],
      modifier: 3,
      expression: '2d6+3',
    });
  });

  it('supports multiple dice terms and signed dice', () => {
    const result = rollDice(fixedRng([0, 0.5, 0.999]), '2d8+1d6-2');

    expect(result.total).toBe(10);
    expect(result.rolls).toEqual([1, 5, 6]);
    expect(result.modifier).toBe(-2);
  });

  it('clamps negative totals to zero like Battlecast', () => {
    expect(rollDice(fixedRng([0]), '1d4-10').total).toBe(0);
  });

  it('rolls a d20 with critical and fumble flags', () => {
    expect(rollD20(fixedRng([0]))).toMatchObject({
      total: 1,
      rolls: [1],
      isFumble: true,
      isCritical: false,
    });
    expect(rollD20(fixedRng([0.999]))).toMatchObject({
      total: 20,
      rolls: [20],
      isFumble: false,
      isCritical: true,
    });
  });

  it('rolls attacks with advantage and disadvantage', () => {
    expect(rollAttack(fixedRng([0.1, 0.9]), 5, true).naturalRoll).toBe(19);
    expect(rollAttack(fixedRng([0.1, 0.9]), 5, false, true).naturalRoll).toBe(3);
  });

  it('cancels advantage and disadvantage using the first d20 while still recording both rolls', () => {
    const result = rollAttack(fixedRng([0.1, 0.9]), 5, true, true);

    expect(result.naturalRoll).toBe(3);
    expect(result.roll.rolls).toEqual([3, 19]);
    expect(result.roll.total).toBe(8);
  });

  it('rolls saves through the attack roll path', () => {
    expect(rollSave(fixedRng([0.999, 0]), 2).total).toBe(22);
  });

  it('rolls initiative', () => {
    expect(rollInitiative(fixedRng([0.5]), 3)).toBe(14);
  });

  it('doubles damage dice but not modifiers on critical hits', () => {
    expect(criticalDamageExpression('1d8+3')).toBe('2d8+3');

    const result = rollDamage(fixedRng([0, 0.999]), '1d8+3', true);
    expect(result.total).toBe(12);
    expect(result.rolls).toEqual([1, 8]);
    expect(result.modifier).toBe(3);
    expect(result.expression).toBe('2d8+3');
  });

  it('calculates average and maximum dice totals', () => {
    expect(averageDamage('2d6+3')).toBe(10);
    expect(maxDiceTotal('2d6+3')).toBe(15);
    expect(maxDiceTotal('1d4-10')).toBe(0);
  });

  it('calculates ability modifiers', () => {
    expect(abilityModifier(1)).toBe(-5);
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(18)).toBe(4);
  });
});

function fixedRng(values: number[]): RandomSource {
  let index = 0;
  return {
    next() {
      const value = values[index];
      if (value === undefined) {
        throw new Error(`fixed RNG exhausted at index ${index}`);
      }

      index += 1;
      return value;
    },
  };
}
