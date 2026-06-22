export type RandomSeed = string | number;

export interface RandomSource {
  next(): number;
}

const UINT32_RANGE = 0x100000000;
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export class SeededRng implements RandomSource {
  private state: number;

  constructor(seed: RandomSeed) {
    this.state = normalizeSeed(seed);
  }

  next(): number {
    return this.nextUint32() / UINT32_RANGE;
  }

  nextUint32(): number {
    let t = (this.state += 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(`maxExclusive must be a positive integer, got ${maxExclusive}`);
    }

    return Math.floor(this.next() * maxExclusive);
  }

  nextIntInclusive(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new Error(`invalid inclusive range: ${min}..${max}`);
    }

    return min + this.nextInt(max - min + 1);
  }

  snapshot(): number {
    return this.state >>> 0;
  }

  restore(snapshot: number): void {
    this.state = snapshot >>> 0;
  }
}

export function createRng(seed: RandomSeed): SeededRng {
  return new SeededRng(seed);
}

export function normalizeSeed(seed: RandomSeed): number {
  if (typeof seed === 'number') {
    if (!Number.isFinite(seed)) {
      throw new Error(`seed must be finite, got ${seed}`);
    }

    return Math.trunc(seed) >>> 0;
  }

  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
}
