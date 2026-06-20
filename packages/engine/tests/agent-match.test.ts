import { describe, expect, it } from 'vitest';

import {
  goblinDuelScenario,
  runAgentMatch,
  verifyReplayStructure,
} from '../src/index.js';

describe('agent matches', () => {
  it('runs deterministic baseline-vs-baseline matches with replay events', () => {
    const first = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'baseline.focus-fire',
      blueAgent: 'baseline.random-legal',
    });
    const second = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'baseline.focus-fire',
      blueAgent: 'baseline.random-legal',
    });

    expect(second.finalStateHash).toBe(first.finalStateHash);
    expect(second.replay).toEqual(first.replay);
    expect(first.winner).toBe('red');
    expect(verifyReplayStructure(first.replay).ok).toBe(true);
  });

  it('records attack and end-turn legal actions in the opening replay turn', () => {
    const match = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'baseline.focus-fire',
      blueAgent: 'baseline.random-legal',
    });
    const firstTurn = match.replay.find((event) => event.type === 'turn_started');

    expect(firstTurn?.type).toBe('turn_started');
    expect(firstTurn?.legalActions.some((action) => action.type === 'attack')).toBe(true);
    expect(firstTurn?.legalActions.some((action) => action.type === 'end_turn')).toBe(true);
  });
});
