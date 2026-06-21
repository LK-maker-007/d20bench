import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildLlmBattleObservation,
  battlecastFullTurnTactics,
  balancedHeroMirrorScenario,
  generateLegalActions,
  goblinDuelScenario,
  isAgentId,
  listAgentIds,
  runAgentMatch,
  runAgentMatchAsync,
  verifyReplayStructure,
  type D20benchScenario,
} from '../src/index.js';
import { buildHero } from '../src/battlecast/data/heroes.js';
import { initBattle } from '../src/battlecast/engine/combat.js';
import { createBattlecastCreatures } from '../src/battlecast-runner.js';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENROUTER_API_KEY;

describe('agent matches', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalApiKey;
    }
    vi.restoreAllMocks();
  });

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

    expect(observation.schemaVersion).toBe('d20bench.llm_observation.v2');
    expect(observation.actionSpace).toBe('primitive');
    expect(observation.teamTactics.red).toEqual(expect.any(String));
    expect(observation.teamTactics.blue).toEqual(expect.any(String));
    expect(observation.activeCreatureId).toBe(active.id);
    expect(observation.grid.movementBlocked).toEqual(expect.any(Array));
    expect(observation.tacticReference).toEqual([]);
    expect(observation.activeCreature.abilities.str).toEqual(expect.objectContaining({
      score: expect.any(Number),
      modifier: expect.any(Number),
    }));
    expect(observation.activeCreature.actions.length).toBeGreaterThan(0);
    expect(observation.activeCreature.actions[0]).toEqual(expect.objectContaining({
      name: expect.any(String),
      type: expect.any(String),
    }));
    expect(observation.activeCreature.runtime.recharges).toEqual(expect.any(Object));
    expect(observation.activeCreature.defenses.conditionImmunities).toEqual(expect.any(Array));
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

  it('exposes delegate-free concrete spell actions in the actual action space', () => {
    const state = initBattle(createBattlecastCreatures(balancedHeroMirrorScenario.combatants, true), balancedHeroMirrorScenario.gridSize);
    const wizard = state.creatures.find((creature) => creature.monsterData.heroClass === 'Wizard' && creature.team === 'red');
    if (!wizard) throw new Error('expected red Wizard');

    const catalogue = generateLegalActions(state, wizard, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: false,
      },
    });
    const observation = buildLlmBattleObservation(state, wizard, catalogue);

    expect(catalogue.actionSpace).toBe('actual-actions-v1');
    expect(catalogue.actions.some((action) => action.type === 'battlecast_tactic')).toBe(false);
    expect(catalogue.actions.some((action) => action.type === 'spell')).toBe(true);
    expect(observation.actionSpace).toBe('actual-actions-v1');
    expect(observation.tacticReference).toEqual([]);
    expect(observation.objective).toContain('Delegates and strategy labels are not available');
  });

  it('exposes Dash and Disengage as concrete actual actions when relevant', () => {
    const state = initBattle(createBattlecastCreatures(adjacentFighterDuelScenario().combatants, true), 8);
    const active = state.creatures.find((creature) => creature.team === 'red');
    if (!active) throw new Error('expected red fighter');

    const catalogue = generateLegalActions(state, active, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    const dash = catalogue.actions.find((action) => action.type === 'dash');
    const disengage = catalogue.actions.find((action) => action.type === 'disengage');
    const moveTo = catalogue.actions.find((action) => action.type === 'move_to');

    expect(dash).toEqual(expect.objectContaining({ id: 'dash', type: 'dash', extraMovement: 30 }));
    expect(disengage).toEqual(expect.objectContaining({ id: 'disengage', type: 'disengage', isBonusAction: false }));
    expect(moveTo).toEqual(expect.objectContaining({ type: 'move_to', destination: expect.any(Object), distanceFt: expect.any(Number) }));

    active.movementRemaining = 0;
    const exhaustedMovementCatalogue = generateLegalActions(state, active, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    expect(exhaustedMovementCatalogue.actions.some((action) => action.type === 'move_toward')).toBe(false);
    expect(exhaustedMovementCatalogue.actions.some((action) => action.type === 'move_to')).toBe(false);
    expect(exhaustedMovementCatalogue.actions.some((action) => action.type === 'dash')).toBe(true);

    active.hasActed = true;
    active.movementRemaining = 30;
    const spentActionCatalogue = generateLegalActions(state, active, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    expect(spentActionCatalogue.actions.some((action) => action.type === 'attack')).toBe(false);
    expect(spentActionCatalogue.actions.some((action) => action.type === 'dash')).toBe(false);
  });

  it('exposes Eldritch Blast beams as stepwise attack actions', () => {
    const state = initBattle(createBattlecastCreatures(warlockBeamScenario().combatants, true), 12);
    const warlock = state.creatures.find((creature) => creature.team === 'red');
    if (!warlock) throw new Error('expected red warlock');

    const catalogue = generateLegalActions(state, warlock, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });

    expect(catalogue.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'attack', actionName: 'Eldritch Blast' }),
    ]));
    expect(catalogue.actions.some((action) => action.type === 'spell' && action.actionName === 'Eldritch Blast')).toBe(false);
  });

  it('asks an OpenRouter actual-action agent again after the first Extra Attack swing', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const actionId = actionIds.find((id) => id.startsWith('attack:')) ?? 'end_turn';
      return jsonResponse({
        id: `gen-${body.messages.length}-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Take the concrete legal action.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: adjacentFighterDuelScenario(),
      seed: 1,
      redAgent: 'openrouter:test/tool-model',
      blueAgent: 'battlecast.smart',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const llmActions = match.replay.filter((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.llmTrace
    );
    const llmTurnStarts = match.replay.filter((event) =>
      event.type === 'turn_started' &&
      event.controller?.mode === 'openrouter-llm'
    );

    expect(llmTurnStarts.some((event) => event.legalActions.some((action) => action.type === 'battlecast_tactic'))).toBe(false);
    expect(llmActions.filter((event) => event.acceptedAction.type === 'attack')).toHaveLength(2);
    expect(llmActions.filter((event) => event.acceptedAction.type === 'attack').map((event) => event.turnStep)).toEqual([0, 1]);
    expect(llmActions.some((event) => (event.turnStep ?? 0) > 1)).toBe(true);
  });

  it('asks an OpenRouter Warlock again after the first Eldritch Blast beam', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const actionId = actionIds.find((id) => id.startsWith('attack:eldritch-blast:')) ?? 'end_turn';
      return jsonResponse({
        id: `gen-${body.messages.length}-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Fire the next beam.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: warlockBeamScenario(),
      seed: 1,
      redAgent: 'openrouter:test/tool-model',
      blueAgent: 'battlecast.smart',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const beamActions = match.replay.filter((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.acceptedAction.type === 'attack' &&
      event.acceptedAction.actionName === 'Eldritch Blast'
    );

    expect(beamActions).toHaveLength(2);
    expect(beamActions.map((event) => event.turnStep)).toEqual([0, 1]);
  });

  it('lets an actual-action LLM disengage before moving without provoking opportunity attacks', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let callIndex = 0;
    let secondStepActionIds: string[] = [];
    let chosenMoveTo: string | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      if (callIndex === 1) secondStepActionIds = [...actionIds];
      const preferred = callIndex === 0
        ? 'disengage'
        : callIndex === 1
          ? actionIds.find((id) => id.startsWith('move_to:'))
          : 'end_turn';
      callIndex += 1;
      const actionId = preferred && actionIds.includes(preferred) ? preferred : 'end_turn';
      if (actionId.startsWith('move_to:')) chosenMoveTo = actionId;
      return jsonResponse({
        id: `gen-${callIndex}-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Take the concrete legal action.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: adjacentThreatWithFarTargetScenario(),
      seed: 1,
      redAgent: 'openrouter:test/tool-model',
      blueAgent: 'battlecast.smart',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const llmActions = match.replay.filter((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.llmTrace
    );
    const disengageResolution = llmActions.find((event) => event.acceptedAction.type === 'disengage');

    expect(disengageResolution?.acceptedAction).toEqual(expect.objectContaining({ id: 'disengage' }));
    expect(disengageResolution?.events.some((event) => event.kind === 'oaAvoided')).toBe(true);
    expect(chosenMoveTo).toEqual(expect.stringMatching(/^move_to:/));
    expect(llmActions.some((event) => event.acceptedAction.type === 'move_to')).toBe(true);
    expect(secondStepActionIds.some((id) => id.startsWith('attack:'))).toBe(false);
    expect(match.state.logs.some((log) => log.action === 'Opportunity Attack')).toBe(false);
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

function adjacentFighterDuelScenario(): D20benchScenario {
  return {
    id: 'test.adjacent-fighter-duel.v1',
    name: 'Adjacent Fighter Duel',
    description: 'Two adjacent level-5 fighters for actual-action Extra Attack tests.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Fighter', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function adjacentThreatWithFarTargetScenario(): D20benchScenario {
  return {
    id: 'test.adjacent-threat-far-target.v1',
    name: 'Adjacent Threat With Far Target',
    description: 'A red fighter can disengage from one adjacent fighter before moving toward another target.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 10,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Fighter', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 8, y: 8 } },
    ],
  };
}

function warlockBeamScenario(): D20benchScenario {
  return {
    id: 'test.warlock-beam.v1',
    name: 'Warlock Beam Test',
    description: 'A level-5 Warlock should fire Eldritch Blast as two stepwise beams.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 12,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Warlock', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 8, y: 8 } },
    ],
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
