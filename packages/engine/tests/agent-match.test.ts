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

  it('exposes split-target Magic Missile auto-dart actions', () => {
    const state = initBattle(createBattlecastCreatures(magicMissileSplitScenario().combatants, true), 12);
    const wizard = state.creatures.find((creature) => creature.team === 'red');
    if (!wizard) throw new Error('expected red wizard');

    const catalogue = generateLegalActions(state, wizard, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: false,
      },
    });
    const splitMissile = catalogue.actions.find((action) =>
      action.type === 'spell' &&
      action.actionName === 'Magic Missile' &&
      action.targetIds !== undefined &&
      new Set(action.targetIds).size > 1
    );

    expect(splitMissile).toEqual(expect.objectContaining({
      type: 'spell',
      effectKind: 'auto_darts',
      targetIds: expect.arrayContaining([
        expect.stringContaining('fighter-l5-blue'),
      ]),
    }));
  });

  it('exposes Rogue Steady Aim as a concrete class feature action', () => {
    const state = initBattle(createBattlecastCreatures(rogueSteadyAimScenario().combatants, true), 12);
    const rogue = state.creatures.find((creature) => creature.team === 'red');
    if (!rogue) throw new Error('expected red rogue');

    const catalogue = generateLegalActions(state, rogue, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: false,
      },
    });
    const observation = buildLlmBattleObservation(state, rogue, catalogue);
    const steadyAim = catalogue.actions.find((action) => action.id === 'class_feature:steady-aim');

    expect(steadyAim).toEqual(expect.objectContaining({
      type: 'class_feature',
      feature: 'steady_aim',
      isBonusAction: true,
    }));
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:steady-aim',
        type: 'class_feature',
        feature: 'steady_aim',
        isBonusAction: true,
      }),
    ]));

    rogue.hasMovedThisTurn = true;
    const movedCatalogue = generateLegalActions(state, rogue, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: false,
      },
    });
    expect(movedCatalogue.actions.some((action) => action.id === 'class_feature:steady-aim')).toBe(false);
  });

  it('exposes Druid Wild Shape beast forms as concrete class feature actions', () => {
    const state = initBattle(createBattlecastCreatures(druidWildShapeScenario().combatants, true), 8);
    const druid = state.creatures.find((creature) => creature.team === 'red');
    if (!druid) throw new Error('expected red druid');

    const catalogue = generateLegalActions(state, druid, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: false,
      },
    });
    const observation = buildLlmBattleObservation(state, druid, catalogue);
    const wildShape = catalogue.actions.find((action) =>
      action.type === 'class_feature' && action.feature === 'wild_shape'
    );

    expect(wildShape).toEqual(expect.objectContaining({
      type: 'class_feature',
      feature: 'wild_shape',
      isBonusAction: true,
      resourceCost: { key: 'wild-shape', amount: 1 },
      beastName: expect.any(String),
      beastAc: expect.any(Number),
      beastTempHp: 5,
      beastActions: expect.any(Array),
    }));
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: wildShape?.id,
        type: 'class_feature',
        feature: 'wild_shape',
        beastName: wildShape?.beastName,
        beastAc: wildShape?.beastAc,
        beastTempHp: 5,
      }),
    ]));

    druid.concentratingOn = 'Moonbeam';
    const concentratingCatalogue = generateLegalActions(state, druid, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: false,
      },
    });
    expect(concentratingCatalogue.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'wild_shape'
    )).toBe(false);
  });

  it('exposes Monk Martial Arts and Flurry as post-attack concrete class feature actions', () => {
    const state = initBattle(createBattlecastCreatures(monkFlurryScenario().combatants, true), 8);
    const monk = state.creatures.find((creature) => creature.team === 'red');
    if (!monk) throw new Error('expected red monk');

    const beforeAttack = generateLegalActions(state, monk, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    expect(beforeAttack.actions.some((action) => action.type === 'class_feature' && action.feature === 'flurry_of_blows')).toBe(false);
    expect(beforeAttack.actions.some((action) => action.type === 'class_feature' && action.feature === 'martial_arts_strike')).toBe(false);

    const afterAttack = generateLegalActions(state, monk, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: true,
      },
    });
    expect(afterAttack.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'class_feature',
        feature: 'flurry_of_blows',
        resourceCost: { key: 'ki', amount: 1 },
      }),
      expect.objectContaining({
        type: 'class_feature',
        feature: 'martial_arts_strike',
      }),
    ]));

    monk.bonusActionUsed = true;
    const continuingFlurry = generateLegalActions(state, monk, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: true,
        flurryStrikesRemaining: 1,
      },
    });
    const continuingFlurryAction = continuingFlurry.actions.find((action) =>
      action.type === 'class_feature' && action.feature === 'flurry_of_blows'
    );
    expect(continuingFlurryAction).toEqual(expect.objectContaining({
      type: 'class_feature',
      feature: 'flurry_of_blows',
    }));
    expect(continuingFlurryAction).not.toHaveProperty('resourceCost');
    expect(continuingFlurry.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'martial_arts_strike'
    )).toBe(false);
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

  it('executes a split-target Magic Missile selected by an actual-action LLM', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let chosenActionId: string | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const splitMissile = actionIds.find((id) => id.startsWith('spell:magic-missile:targets:') && new Set(id.split(':targets:')[1].split(',')).size > 1);
      const actionId = splitMissile ?? 'end_turn';
      if (splitMissile) chosenActionId = actionId;
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
                arguments: JSON.stringify({ actionId, rationale: 'Split darts across wounded targets.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: magicMissileSplitScenario(),
      seed: 1,
      redAgent: 'openrouter:test/tool-model',
      blueAgent: 'battlecast.smart',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const missileAction = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.acceptedAction.type === 'spell' &&
      event.acceptedAction.actionName === 'Magic Missile'
    );

    expect(chosenActionId).toEqual(expect.stringMatching(/^spell:magic-missile:targets:/));
    expect(missileAction?.type).toBe('action_resolved');
    expect(missileAction?.acceptedAction.type).toBe('spell');
    if (missileAction?.acceptedAction.type !== 'spell') throw new Error('expected Magic Missile spell action');
    expect(new Set(missileAction.acceptedAction.targetIds).size).toBeGreaterThan(1);
    expect(missileAction.logs.filter((log) => log.action === 'Magic Missile')).toHaveLength(3);
  });

  it('lets an actual-action Rogue use Steady Aim before choosing an attack', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let callIndex = 0;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const preferred = callIndex === 0
        ? 'class_feature:steady-aim'
        : callIndex === 1
          ? actionIds.find((id) => id.startsWith('attack:'))
          : 'end_turn';
      callIndex += 1;
      const actionId = preferred && actionIds.includes(preferred) ? preferred : 'end_turn';
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
                arguments: JSON.stringify({ actionId, rationale: 'Use the concrete legal class feature, then attack.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: rogueSteadyAimScenario(),
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
    const steadyAimResolution = llmActions.find((event) => event.acceptedAction.id === 'class_feature:steady-aim');
    const attackResolution = llmActions.find((event) => event.acceptedAction.type === 'attack');

    expect(steadyAimResolution?.turnStep).toBe(0);
    expect(steadyAimResolution?.logs.some((log) => log.action === 'Steady Aim')).toBe(true);
    expect(steadyAimResolution?.events.some((event) => event.kind === 'effect' && event.label === 'Steady Aim')).toBe(true);
    expect(attackResolution?.turnStep).toBe(1);
  });

  it('lets an actual-action Druid choose a Wild Shape form', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let chosenWildShape: string | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const wildShape = actionIds.find((id) => id.startsWith('class_feature:wild-shape:'));
      const actionId = wildShape ?? 'end_turn';
      if (wildShape) chosenWildShape = actionId;
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
                arguments: JSON.stringify({ actionId, rationale: 'Transform into a concrete legal beast form.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: druidWildShapeScenario(),
      seed: 1,
      redAgent: 'openrouter:test/tool-model',
      blueAgent: 'battlecast.smart',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const wildShapeResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.acceptedAction.type === 'class_feature' &&
      event.acceptedAction.feature === 'wild_shape'
    );

    expect(chosenWildShape).toEqual(expect.stringMatching(/^class_feature:wild-shape:/));
    expect(wildShapeResolution?.type).toBe('action_resolved');
    expect(wildShapeResolution?.logs.some((log) => log.action === 'Wild Shape')).toBe(true);
    expect(wildShapeResolution?.events.some((event) => event.kind === 'wildShape' && event.beastName)).toBe(true);
  });

  it('lets an actual-action Monk choose each Flurry of Blows strike after seeing the previous result', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let callIndex = 0;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const preferred = callIndex === 0
        ? actionIds.find((id) => id.startsWith('attack:'))
        : callIndex <= 2
          ? actionIds.find((id) => id.startsWith('class_feature:flurry-of-blows:'))
          : 'end_turn';
      callIndex += 1;
      const actionId = preferred && actionIds.includes(preferred) ? preferred : 'end_turn';
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
                arguments: JSON.stringify({ actionId, rationale: 'Attack, then choose each concrete Flurry strike.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: monkFlurryScenario(),
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
    const flurryResolutions = llmActions.filter((event) =>
      event.acceptedAction.type === 'class_feature' &&
      event.acceptedAction.feature === 'flurry_of_blows'
    );

    expect(flurryResolutions).toHaveLength(2);
    expect(flurryResolutions.map((event) => event.turnStep)).toEqual([1, 2]);
    expect(flurryResolutions[0].logs.some((log) => log.action === 'Flurry of Blows')).toBe(true);
    expect(flurryResolutions.every((event) =>
      event.logs.some((log) => log.action === 'Martial Arts (Unarmed)' || log.action === 'Attack')
    )).toBe(true);
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

function magicMissileSplitScenario(): D20benchScenario {
  return {
    id: 'test.magic-missile-split.v1',
    name: 'Magic Missile Split Test',
    description: 'A level-5 Wizard can split Magic Missile darts across multiple enemies.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 12,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Wizard', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 7, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 8, y: 3 } },
    ],
  };
}

function rogueSteadyAimScenario(): D20benchScenario {
  return {
    id: 'test.rogue-steady-aim.v1',
    name: 'Rogue Steady Aim Test',
    description: 'A level-5 Rogue can spend a bonus action on Steady Aim before making a ranged attack.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 12,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Rogue', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 8, y: 8 } },
    ],
  };
}

function druidWildShapeScenario(): D20benchScenario {
  return {
    id: 'test.druid-wild-shape.v1',
    name: 'Druid Wild Shape Test',
    description: 'A level-5 Druid can spend Wild Shape to transform into a concrete beast form.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Druid', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function monkFlurryScenario(): D20benchScenario {
  return {
    id: 'test.monk-flurry.v1',
    name: 'Monk Flurry Test',
    description: 'A level-5 Monk can attack and then spend ki on stepwise Flurry of Blows strikes.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Monk', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
