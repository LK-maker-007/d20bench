import { describe, expect, it } from 'vitest';

import {
  buildLlmBattleObservation,
  battlecastFullTurnTactics,
  generateLegalActions,
  goblinDuelScenario,
  isAgentId,
  listAgentIds,
  runAgentMatch,
  runAgentMatchAsync,
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

  it('supports OpenRouter agent ids on the async harness path', async () => {
    expect(isAgentId('openrouter:openai/gpt-4o-mini')).toBe(true);
    expect(() => runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'openrouter:openai/gpt-4o-mini',
      blueAgent: 'baseline.random-legal',
    })).toThrow(/requires runAgentMatchAsync/);

    const sync = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'baseline.focus-fire',
      blueAgent: 'baseline.random-legal',
    });
    const asyncResult = await runAgentMatchAsync({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'baseline.focus-fire',
      blueAgent: 'baseline.random-legal',
    });

    expect(asyncResult.finalStateHash).toBe(sync.finalStateHash);
    expect(asyncResult.replay).toEqual(sync.replay);
  });

  it('builds a compact LLM observation from legal actions and combat state', () => {
    const match = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'baseline.focus-fire',
      blueAgent: 'baseline.random-legal',
      maxRounds: 1,
    });
    const active = match.state.creatures.find((creature) => creature.isAlive);
    if (!active) throw new Error('expected an active creature');

    const catalogue = generateLegalActions(match.state, active);
    const observation = buildLlmBattleObservation(match.state, active, catalogue);

    expect(observation.schemaVersion).toBe('d20bench.llm_observation.v1');
    expect(observation.actionSpace).toBe('primitive');
    expect(observation.activeCreatureId).toBe(active.id);
    expect(observation.grid.movementBlocked).toEqual(expect.any(Array));
    expect(observation.creatures.some((creature) => creature.relation === 'enemy')).toBe(true);
    expect(observation.legalActions.map((action) => action.id)).toEqual(
      catalogue.actions.map((action) => action.id),
    );
  });

  it('can expose copied Battlecast full-turn delegates to LLM observations', () => {
    const match = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'baseline.focus-fire',
      blueAgent: 'baseline.random-legal',
      maxRounds: 1,
    });
    const active = match.state.creatures.find((creature) => creature.isAlive);
    if (!active) throw new Error('expected an active creature');

    const catalogue = generateLegalActions(match.state, active, {
      includeBattlecastFullTurnActions: true,
    });
    const observation = buildLlmBattleObservation(match.state, active, catalogue);
    const tacticActions = observation.legalActions.filter((action) => action.type === 'battlecast_tactic');

    expect(observation.actionSpace).toBe('battlecast-full-turn');
    expect(tacticActions.map((action) => action.id).sort()).toEqual(
      battlecastFullTurnTactics.map((tactic) => `battlecast_tactic:${tactic}`).sort(),
    );
    expect(tacticActions.every((action) => action.fullTurnDelegate)).toBe(true);
    expect(tacticActions.every((action) => action.description?.includes('copied Battlecast engine'))).toBe(true);
  });

  it('uses distinct match ids for full-turn LLM action-space matches', () => {
    const primitive = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'baseline.focus-fire',
      blueAgent: 'baseline.random-legal',
    });
    const fullTurn = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'baseline.focus-fire',
      blueAgent: 'baseline.random-legal',
      llmActionSpace: 'battlecast-full-turn',
    });

    expect(fullTurn.matchId).not.toBe(primitive.matchId);
    expect(fullTurn.matchId).toContain('battlecast-full-turn');
  });

  it('runs copied Battlecast tactic options as agents', () => {
    expect(listAgentIds()).toEqual(expect.arrayContaining([
      'battlecast.aggressive',
      'battlecast.smart',
      'battlecast.kiting',
      'battlecast.defensive',
    ]));

    const first = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'battlecast.smart',
      blueAgent: 'battlecast.aggressive',
    });
    const second = runAgentMatch({
      scenario: goblinDuelScenario,
      seed: 1,
      redAgent: 'battlecast.smart',
      blueAgent: 'battlecast.aggressive',
    });
    const tacticResolution = first.replay.find((event) =>
      event.type === 'action_resolved' && event.acceptedAction.type === 'battlecast_tactic'
    );
    const tacticTurn = first.replay.find((event) =>
      event.type === 'turn_started' && event.controller?.mode === 'battlecast-tactic'
    );

    expect(second.finalStateHash).toBe(first.finalStateHash);
    expect(second.replay).toEqual(first.replay);
    expect(verifyReplayStructure(first.replay).ok).toBe(true);
    expect(tacticResolution?.type).toBe('action_resolved');
    expect(tacticTurn?.type).toBe('turn_started');
    expect(tacticTurn?.legalActions).toHaveLength(1);
    const tacticAction = tacticTurn?.legalActions[0];
    expect(tacticAction?.type).toBe('battlecast_tactic');
    if (tacticAction?.type !== 'battlecast_tactic') throw new Error('expected a Battlecast tactic action');
    expect(['smart', 'aggressive']).toContain(tacticAction.tactic);
  });
});
