import type { RandomSource } from './random.js';

export interface RollResult {
  total: number;
  rolls: number[];
  modifier: number;
  expression: string;
  isCritical?: boolean;
  isFumble?: boolean;
}

export interface AttackRollResult {
  roll: RollResult;
  naturalRoll: number;
}

type DiceTerm =
  | { kind: 'dice'; sign: 1 | -1; count: number; sides: number }
  | { kind: 'modifier'; sign: 1 | -1; value: number };

export function rollDice(rng: RandomSource, expression: string): RollResult {
  const terms = parseDiceExpression(expression);
  let total = 0;
  const rolls: number[] = [];
  let modifier = 0;

  for (const term of terms) {
    if (term.kind === 'dice') {
      for (let i = 0; i < term.count; i += 1) {
        const roll = rollDie(rng, term.sides);
        const signedRoll = roll * term.sign;
        rolls.push(signedRoll);
        total += signedRoll;
      }
    } else {
      const signedModifier = term.value * term.sign;
      modifier += signedModifier;
      total += signedModifier;
    }
  }

  return {
    total: Math.max(0, total),
    rolls,
    modifier,
    expression,
  };
}

export function rollD20(rng: RandomSource): RollResult {
  const roll = rollDie(rng, 20);
  return {
    total: roll,
    rolls: [roll],
    modifier: 0,
    expression: '1d20',
    isCritical: roll === 20,
    isFumble: roll === 1,
  };
}

export function rollAttack(
  rng: RandomSource,
  modifier: number,
  advantage = false,
  disadvantage = false,
): AttackRollResult {
  const roll1 = rollDie(rng, 20);
  const roll2 = rollDie(rng, 20);

  let naturalRoll: number;
  if (advantage && !disadvantage) {
    naturalRoll = Math.max(roll1, roll2);
  } else if (disadvantage && !advantage) {
    naturalRoll = Math.min(roll1, roll2);
  } else {
    naturalRoll = roll1;
  }

  return {
    roll: {
      total: naturalRoll + modifier,
      rolls: advantage || disadvantage ? [roll1, roll2] : [naturalRoll],
      modifier,
      expression: `1d20${formatSignedModifier(modifier)}`,
      isCritical: naturalRoll === 20,
      isFumble: naturalRoll === 1,
    },
    naturalRoll,
  };
}

export function rollSave(
  rng: RandomSource,
  modifier: number,
  advantage = false,
  disadvantage = false,
): RollResult {
  return rollAttack(rng, modifier, advantage, disadvantage).roll;
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function rollInitiative(rng: RandomSource, dexMod: number): number {
  return rollDie(rng, 20) + dexMod;
}

export function rollDamage(rng: RandomSource, expression: string, critical = false): RollResult {
  if (!critical) {
    return rollDice(rng, expression);
  }

  return rollDice(rng, criticalDamageExpression(expression));
}

export function averageDamage(expression: string): number {
  return parseDiceExpression(expression).reduce((total, term) => {
    if (term.kind === 'dice') {
      return total + term.sign * term.count * ((term.sides + 1) / 2);
    }

    return total + term.sign * term.value;
  }, 0);
}

export function maxDiceTotal(expression: string): number {
  const total = parseDiceExpression(expression).reduce((sum, term) => {
    if (term.kind === 'dice') {
      return sum + term.sign * term.count * term.sides;
    }

    return sum + term.sign * term.value;
  }, 0);

  return Math.max(0, total);
}

export function criticalDamageExpression(expression: string): string {
  return stringifyDiceTerms(parseDiceExpression(expression).map((term) => {
    if (term.kind === 'dice') {
      return { ...term, count: term.count * 2 };
    }

    return term;
  }));
}

export function parseDiceExpression(expression: string): DiceTerm[] {
  const cleaned = expression.replace(/\s/g, '');
  if (cleaned.length === 0) {
    throw new Error('dice expression cannot be empty');
  }

  const parts = cleaned.match(/[+-]?[^+-]+/g);
  if (!parts) {
    throw new Error(`invalid dice expression: ${expression}`);
  }

  return parts.map((part) => parseDiceTerm(expression, part));
}

function parseDiceTerm(expression: string, part: string): DiceTerm {
  const sign: 1 | -1 = part.startsWith('-') ? -1 : 1;
  const unsignedPart = part.replace(/^[+-]/, '');

  if (unsignedPart.includes('d')) {
    const [countPart, sidesPart, extraPart] = unsignedPart.split('d');
    if (extraPart !== undefined) {
      throw new Error(`invalid dice term in expression ${expression}: ${part}`);
    }

    const count = countPart === '' ? 1 : Number.parseInt(countPart, 10);
    const sides = Number.parseInt(sidesPart, 10);
    if (!Number.isInteger(count) || count <= 0 || !Number.isInteger(sides) || sides <= 0) {
      throw new Error(`invalid dice term in expression ${expression}: ${part}`);
    }

    return { kind: 'dice', sign, count, sides };
  }

  const value = Number.parseInt(unsignedPart, 10);
  if (!Number.isInteger(value)) {
    throw new Error(`invalid modifier term in expression ${expression}: ${part}`);
  }

  return { kind: 'modifier', sign, value };
}

function rollDie(rng: RandomSource, sides: number): number {
  if (!Number.isInteger(sides) || sides <= 0) {
    throw new Error(`die sides must be a positive integer, got ${sides}`);
  }

  return Math.floor(rng.next() * sides) + 1;
}

function stringifyDiceTerms(terms: DiceTerm[]): string {
  return terms.map((term, index) => {
    const sign = term.sign < 0 ? '-' : index === 0 ? '' : '+';
    if (term.kind === 'dice') {
      return `${sign}${term.count}d${term.sides}`;
    }

    return `${sign}${term.value}`;
  }).join('');
}

function formatSignedModifier(modifier: number): string {
  if (modifier < 0) {
    return `${modifier}`;
  }

  return `+${modifier}`;
}
