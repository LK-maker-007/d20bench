import { describe, expect, it } from 'vitest';

import { SeededRng, normalizeSeed } from '../src/random.js';

describe('SeededRng', () => {
  it('replays the same sequence for the same string seed', () => {
    const left = new SeededRng('match-1');
    const right = new SeededRng('match-1');

    expect(Array.from({ length: 8 }, () => left.nextUint32())).toEqual(
      Array.from({ length: 8 }, () => right.nextUint32()),
    );
  });

  it('produces different sequences for different seeds', () => {
    const left = new SeededRng('match-1');
    const right = new SeededRng('match-2');

    expect(Array.from({ length: 8 }, () => left.nextUint32())).not.toEqual(
      Array.from({ length: 8 }, () => right.nextUint32()),
    );
  });

  it('normalizes string seeds deterministically', () => {
    expect(normalizeSeed('d20bench')).toBe(normalizeSeed('d20bench'));
    expect(normalizeSeed('d20bench')).not.toBe(normalizeSeed('D20bench'));
  });

  it('samples integer ranges', () => {
    const rng = new SeededRng(123);

    for (let i = 0; i < 100; i += 1) {
      const value = rng.nextIntInclusive(3, 8);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(8);
    }
  });
});
