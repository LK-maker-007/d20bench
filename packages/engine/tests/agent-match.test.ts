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
import { initBattle, resolveAttack, resolveDivineSmite } from '../src/battlecast/engine/combat.js';
import { withBattlecastRng } from '../src/battlecast/engine/dice.js';
import { getActiveActions } from '../src/battlecast/engine/ai-targeting.js';
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
    const dodge = catalogue.actions.find((action) => action.type === 'dodge');
    const help = catalogue.actions.find((action) => action.type === 'help');
    const disengage = catalogue.actions.find((action) => action.type === 'disengage');
    const moveTo = catalogue.actions.find((action) => action.type === 'move_to');

    expect(dash).toEqual(expect.objectContaining({ id: 'dash', type: 'dash', extraMovement: 30 }));
    expect(dodge).toEqual(expect.objectContaining({ id: 'dodge', type: 'dodge' }));
    expect(help).toEqual(expect.objectContaining({
      id: expect.stringMatching(/^help:/),
      type: 'help',
      targetId: expect.stringContaining('fighter-l5-blue'),
    }));
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
    expect(spentActionCatalogue.actions.some((action) => action.type === 'dodge')).toBe(false);
    expect(spentActionCatalogue.actions.some((action) => action.type === 'help')).toBe(false);
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

  it('exposes multiple directional Lightning Bolt actions', () => {
    const state = initBattle(createBattlecastCreatures(lightningBoltDirectionScenario().combatants, true), 12);
    const wizard = state.creatures.find((creature) => creature.team === 'red');
    if (!wizard) throw new Error('expected red wizard');

    const catalogue = generateLegalActions(state, wizard, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: false,
      },
    });
    const observation = buildLlmBattleObservation(state, wizard, catalogue);
    const lightningActions = catalogue.actions.filter((action) =>
      action.type === 'spell' &&
      action.actionName === 'Lightning Bolt' &&
      action.direction
    );

    expect(lightningActions.length).toBeGreaterThanOrEqual(2);
    expect(lightningActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'spell:lightning-bolt:direction:6,2',
        type: 'spell',
        direction: { x: 6, y: 2 },
        targetIds: expect.arrayContaining([
          expect.stringContaining('fighter-l5-blue'),
        ]),
      }),
      expect.objectContaining({
        id: 'spell:lightning-bolt:direction:2,8',
        type: 'spell',
        direction: { x: 2, y: 8 },
      }),
    ]));
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'spell:lightning-bolt:direction:6,2',
        direction: { x: 6, y: 2 },
      }),
    ]));
  });

  it('exposes Beholder Eye Rays as target-level random ray actions', () => {
    const state = initBattle(createBattlecastCreatures(beholderRandomRayScenario().combatants, true), 20);
    const beholder = state.creatures.find((creature) => creature.monsterData.name === 'Beholder');
    if (!beholder) throw new Error('expected Beholder');

    const catalogue = generateLegalActions(state, beholder, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 3,
        attackActionStarted: false,
      },
    });
    const observation = buildLlmBattleObservation(state, beholder, catalogue);
    const randomRayActions = catalogue.actions.filter((action) => action.type === 'random_ray');
    const individualRayNames = new Set([
      'Charm Ray',
      'Paralyzing Ray',
      'Fear Ray',
      'Enervation Ray',
      'Disintegration Ray',
      'Death Ray',
      'Sleep Ray',
    ]);

    expect(randomRayActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: expect.stringMatching(/^random_ray:eye-ray:/),
        actionName: 'Eye Ray',
        targetId: expect.stringContaining('storm-giant-blue'),
        possibleEffects: expect.arrayContaining(['Death Ray', 'Disintegration Ray', 'Sleep Ray']),
      }),
    ]));
    expect(catalogue.actions.some((action) =>
      (action.type === 'attack' || action.type === 'spell') &&
      individualRayNames.has(action.actionName)
    )).toBe(false);
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: expect.stringMatching(/^random_ray:eye-ray:/),
        type: 'random_ray',
        possibleEffects: expect.arrayContaining(['Death Ray', 'Disintegration Ray']),
        description: expect.stringContaining('randomly selects'),
      }),
    ]));
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

  it('exposes Fighter Action Surge only after the current action is spent', () => {
    const state = initBattle(createBattlecastCreatures(adjacentFighterDuelScenario().combatants, true), 8);
    const fighter = state.creatures.find((creature) => creature.team === 'red');
    if (!fighter) throw new Error('expected red fighter');

    const beforeAction = generateLegalActions(state, fighter, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    expect(beforeAction.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'action_surge'
    )).toBe(false);

    fighter.hasActed = true;
    const afterAction = generateLegalActions(state, fighter, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 0,
        attackActionStarted: true,
      },
    });
    const actionSurge = afterAction.actions.find((action) =>
      action.type === 'class_feature' && action.feature === 'action_surge'
    );
    const observation = buildLlmBattleObservation(state, fighter, afterAction);

    expect(actionSurge).toEqual(expect.objectContaining({
      id: 'class_feature:action-surge',
      type: 'class_feature',
      feature: 'action_surge',
      isBonusAction: false,
      resourceCost: { key: 'action-surge', amount: 1 },
    }));
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:action-surge',
        feature: 'action_surge',
        description: expect.stringContaining('regain a main action'),
      }),
    ]));

    fighter.resources['action-surge'] = 0;
    const spentCatalogue = generateLegalActions(state, fighter, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 0,
        attackActionStarted: true,
      },
    });
    expect(spentCatalogue.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'action_surge'
    )).toBe(false);
  });

  it('exposes Paladin Sacred Weapon as a concrete class feature action', () => {
    const state = initBattle(createBattlecastCreatures(paladinSacredWeaponScenario().combatants, true), 8);
    const paladin = state.creatures.find((creature) => creature.team === 'red');
    if (!paladin) throw new Error('expected red paladin');

    const catalogue = generateLegalActions(state, paladin, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    const observation = buildLlmBattleObservation(state, paladin, catalogue);

    expect(catalogue.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:sacred-weapon',
        type: 'class_feature',
        feature: 'sacred_weapon',
        resourceCost: { key: 'channel-divinity', amount: 1 },
      }),
    ]));
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:sacred-weapon',
        feature: 'sacred_weapon',
        setupAction: true,
        description: expect.stringContaining('Channel Divinity'),
      }),
    ]));

    paladin.activeBuffs.push({
      name: 'Sacred Weapon',
      key: 'sacred-weapon',
      casterId: paladin.id,
      appliedRound: state.round,
      endRound: state.round + 100,
      attackBonus: 3,
    });
    const alreadyBuffed = generateLegalActions(state, paladin, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    expect(alreadyBuffed.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'sacred_weapon'
    )).toBe(false);
  });

  it('exposes Monk Superior Defense as a concrete class feature action', () => {
    const state = initBattle(createBattlecastCreatures(monkSuperiorDefenseScenario().combatants, true), 8);
    const monk = state.creatures.find((creature) => creature.team === 'red');
    if (!monk) throw new Error('expected red monk');

    const catalogue = generateLegalActions(state, monk, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    const observation = buildLlmBattleObservation(state, monk, catalogue);

    expect(catalogue.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:superior-defense',
        type: 'class_feature',
        feature: 'superior_defense',
        resourceCost: { key: 'ki', amount: 3 },
      }),
    ]));
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:superior-defense',
        feature: 'superior_defense',
        setupAction: true,
        description: expect.stringContaining('resistance to all damage except Force'),
      }),
    ]));

    monk.hasMovedThisTurn = true;
    const afterMove = generateLegalActions(state, monk, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    expect(afterMove.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'superior_defense'
    )).toBe(false);
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

  it('exposes Barbarian Frenzy as a concrete class feature action while raging', () => {
    const state = initBattle(createBattlecastCreatures(barbarianFrenzyScenario().combatants, true), 8);
    const barbarian = state.creatures.find((creature) => creature.team === 'red');
    if (!barbarian) throw new Error('expected red barbarian');
    barbarian.activeBuffs.push({
      name: 'Rage',
      key: 'rage',
      casterId: barbarian.id,
      appliedRound: state.round,
      endRound: state.round + 10,
      rageDamageBonus: 2,
      resistPhysical: true,
    });

    const catalogue = generateLegalActions(state, barbarian, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: false,
      },
    });

    expect(catalogue.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'class_feature',
        feature: 'frenzy',
        isBonusAction: true,
        targetId: expect.stringContaining('fighter-l5-blue'),
      }),
    ]));

    barbarian.bonusActionUsed = true;
    const spentBonusCatalogue = generateLegalActions(state, barbarian, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: false,
      },
    });
    expect(spentBonusCatalogue.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'frenzy'
    )).toBe(false);
  });

  it('exposes Barbarian Reckless Attack as a concrete pre-attack class feature action', () => {
    const state = initBattle(createBattlecastCreatures(barbarianFrenzyScenario().combatants, true), 8);
    const barbarian = state.creatures.find((creature) => creature.team === 'red');
    if (!barbarian) throw new Error('expected red barbarian');

    const catalogue = generateLegalActions(state, barbarian, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    const observation = buildLlmBattleObservation(state, barbarian, catalogue);

    expect(catalogue.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:reckless-attack',
        type: 'class_feature',
        feature: 'reckless_attack',
        isBonusAction: false,
      }),
    ]));
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:reckless-attack',
        feature: 'reckless_attack',
        description: expect.stringContaining('Melee attacks this turn have Advantage'),
      }),
    ]));

    const afterAttack = generateLegalActions(state, barbarian, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: true,
      },
    });
    expect(afterAttack.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'reckless_attack'
    )).toBe(false);

    barbarian.turnFlags = { ...(barbarian.turnFlags ?? {}), reckless: true };
    const alreadyReckless = generateLegalActions(state, barbarian, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    expect(alreadyReckless.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'reckless_attack'
    )).toBe(false);
  });

  it('exposes Barbarian Brutal Strike as a concrete pre-attack class feature action', () => {
    const state = initBattle(createBattlecastCreatures(barbarianBrutalStrikeScenario().combatants, true), 8);
    const barbarian = state.creatures.find((creature) => creature.team === 'red');
    if (!barbarian) throw new Error('expected red barbarian');

    const catalogue = generateLegalActions(state, barbarian, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    const observation = buildLlmBattleObservation(state, barbarian, catalogue);

    expect(catalogue.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:brutal-strike',
        type: 'class_feature',
        feature: 'brutal_strike',
        isBonusAction: false,
      }),
    ]));
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'class_feature:brutal-strike',
        feature: 'brutal_strike',
        description: expect.stringContaining('next melee hit this turn'),
      }),
    ]));

    const afterAttack = generateLegalActions(state, barbarian, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: true,
      },
    });
    expect(afterAttack.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'brutal_strike'
    )).toBe(false);

    barbarian.turnFlags = { ...(barbarian.turnFlags ?? {}), brutalStrike: true };
    const alreadyBrutal = generateLegalActions(state, barbarian, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    expect(alreadyBrutal.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'brutal_strike'
    )).toBe(false);
    expect(alreadyBrutal.actions.some((action) =>
      action.type === 'class_feature' && action.feature === 'reckless_attack'
    )).toBe(false);
  });

  it("exposes Ranger Nature's Veil as a concrete invisible-condition action", () => {
    const state = initBattle(createBattlecastCreatures(rangerNaturesVeilScenario().combatants, true), 8);
    const ranger = state.creatures.find((creature) => creature.team === 'red');
    if (!ranger) throw new Error('expected red ranger');

    const catalogue = generateLegalActions(state, ranger, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    const naturesVeil = catalogue.actions.find((action) =>
      action.type === 'spell' && action.actionName === "Nature's Veil"
    );

    expect(naturesVeil).toEqual(expect.objectContaining({
      id: expect.stringMatching(/^spell:nature-s-veil:/),
      type: 'spell',
      effectKind: 'special',
      isBonusAction: true,
      resourceCost: { key: 'natures-veil', amount: 1 },
    }));

    ranger.conditions.push('invisible');
    const alreadyInvisible = generateLegalActions(state, ranger, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 2,
        attackActionStarted: false,
      },
    });
    expect(alreadyInvisible.actions.some((action) =>
      action.type === 'spell' && action.actionName === "Nature's Veil"
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
    const observedPrompts: Array<{ recentLogs?: string[] }> = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const userMessage = body.messages.find((message: { role: string }) => message.role === 'user');
      observedPrompts.push(JSON.parse(String(userMessage.content)));
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
    const attackResolutions = llmActions.filter((event) => event.acceptedAction.type === 'attack');
    expect(attackResolutions).toHaveLength(2);
    expect(attackResolutions.map((event) => event.turnStep)).toEqual([0, 1]);
    expect(llmActions.some((event) => (event.turnStep ?? 0) > 1)).toBe(true);
    const firstAttackLog = attackResolutions[0]?.logs?.[0];
    expect(firstAttackLog).toBeDefined();
    const formattedFirstAttackLog = firstAttackLog
      ? `R${firstAttackLog.round} T${firstAttackLog.turn} ${firstAttackLog.actor} ${firstAttackLog.action}: ${firstAttackLog.details}`
      : '';
    expect(observedPrompts[1]?.recentLogs).toContain(formattedFirstAttackLog);
  });

  it('lets an actual-action Fighter use Action Surge and then choose more attacks', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let attacksChosen = 0;
    let actionSurged = false;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const attack = actionIds.find((id) => id.startsWith('attack:'));
      let actionId: string;
      if (attack && (attacksChosen < 2 || actionSurged)) {
        actionId = attack;
        attacksChosen += 1;
      } else if (!actionSurged && actionIds.includes('class_feature:action-surge')) {
        actionId = 'class_feature:action-surge';
        actionSurged = true;
      } else {
        actionId = 'end_turn';
      }
      return jsonResponse({
        id: `gen-${attacksChosen}-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Attack, spend Action Surge, then attack again.' }),
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
      event.agentId === 'openrouter:test/tool-model'
    );
    const actionSurgeResolution = llmActions.find((event) =>
      event.acceptedAction.type === 'class_feature' &&
      event.acceptedAction.feature === 'action_surge'
    );
    const attackResolutions = llmActions.filter((event) => event.acceptedAction.type === 'attack');
    const fighter = match.state.creatures.find((creature) => creature.team === 'red');

    expect(actionSurgeResolution?.type).toBe('action_resolved');
    expect(actionSurgeResolution?.turnStep).toBe(2);
    expect(actionSurgeResolution?.logs.some((log) => log.action === 'Action Surge')).toBe(true);
    expect(attackResolutions).toHaveLength(4);
    expect(attackResolutions.map((event) => event.turnStep)).toEqual([0, 1, 3, 4]);
    expect(fighter?.resources['action-surge']).toBe(0);
    expect(fighter?.stats.actionUsage['Action Surge']).toBe(1);
  });

  it('lets an actual-action Paladin use Sacred Weapon before choosing attacks', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let choseSacredWeapon = false;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const reactionDecline = actionIds.find((id) => id.startsWith('reaction:decline-'));
      const smiteDecline = actionIds.find((id) => id === 'smite:decline');
      const attack = actionIds.find((id) => id.startsWith('attack:'));
      let actionId: string;
      if (reactionDecline) {
        actionId = reactionDecline;
      } else if (smiteDecline) {
        actionId = smiteDecline;
      } else if (!choseSacredWeapon && actionIds.includes('class_feature:sacred-weapon')) {
        actionId = 'class_feature:sacred-weapon';
        choseSacredWeapon = true;
      } else if (attack) {
        actionId = attack;
      } else {
        actionId = 'end_turn';
      }
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
                arguments: JSON.stringify({ actionId, rationale: 'Empower weapon, then choose concrete attacks.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: paladinSacredWeaponScenario(),
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
    const sacredWeaponResolution = llmActions.find((event) =>
      event.acceptedAction.type === 'class_feature' &&
      event.acceptedAction.feature === 'sacred_weapon'
    );
    const attackResolution = llmActions.find((event) => event.acceptedAction.type === 'attack');
    const paladin = match.state.creatures.find((creature) => creature.team === 'red');

    expect(sacredWeaponResolution?.turnStep).toBe(0);
    expect(sacredWeaponResolution?.logs.some((log) => log.action === 'Sacred Weapon')).toBe(true);
    expect(sacredWeaponResolution?.events.some((event) => event.kind === 'effect' && event.label === 'Sacred Weapon')).toBe(true);
    expect(attackResolution?.turnStep).toBe(1);
    expect(paladin?.resources['channel-divinity']).toBe(1);
    expect(paladin?.activeBuffs.some((buff) => buff.key === 'sacred-weapon' && buff.attackBonus)).toBe(true);
  });

  it('lets an actual-action Monk use Superior Defense before choosing attacks', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let choseSuperiorDefense = false;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const reactionDecline = actionIds.find((id) => id.startsWith('reaction:decline-'));
      const attack = actionIds.find((id) => id.startsWith('attack:'));
      let actionId: string;
      if (reactionDecline) {
        actionId = reactionDecline;
      } else if (!choseSuperiorDefense && actionIds.includes('class_feature:superior-defense')) {
        actionId = 'class_feature:superior-defense';
        choseSuperiorDefense = true;
      } else if (attack) {
        actionId = attack;
      } else {
        actionId = 'end_turn';
      }
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
                arguments: JSON.stringify({ actionId, rationale: 'Spend Focus Points for Superior Defense, then attack.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: monkSuperiorDefenseScenario(),
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
    const superiorDefenseResolution = llmActions.find((event) =>
      event.acceptedAction.type === 'class_feature' &&
      event.acceptedAction.feature === 'superior_defense'
    );
    const attackResolution = llmActions.find((event) => event.acceptedAction.type === 'attack');
    const monk = match.state.creatures.find((creature) => creature.team === 'red');

    expect(superiorDefenseResolution?.turnStep).toBe(0);
    expect(superiorDefenseResolution?.logs.some((log) => log.action === 'Superior Defense')).toBe(true);
    expect(superiorDefenseResolution?.events.some((event) => event.kind === 'effect' && event.label === 'Superior Defense')).toBe(true);
    expect(attackResolution?.turnStep).toBe(1);
    expect(monk?.resources.ki).toBeLessThanOrEqual(15);
    expect(monk?.stats.actionUsage['Superior Defense']).toBe(1);
    expect(monk?.activeBuffs.some((buff) => buff.key === 'superior-defense' && buff.resistAllDamageExcept?.includes('force'))).toBe(true);
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

  it('executes a selected directional Lightning Bolt with the chosen aim point', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let chosenDirection: { x: number; y: number } | undefined;
    let chosenActionId: string | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const lightning = actionIds.find((id) => id.startsWith('spell:lightning-bolt:direction:'));
      const actionId = lightning ?? 'end_turn';
      if (lightning) {
        chosenActionId = lightning;
        const [x, y] = lightning.split(':direction:')[1].split(',').map(Number);
        chosenDirection = { x, y };
      }
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
                arguments: JSON.stringify({ actionId, rationale: 'Aim the line through clustered enemies.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: lightningBoltDirectionScenario(),
      seed: 1,
      redAgent: 'openrouter:test/tool-model',
      blueAgent: 'battlecast.smart',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const lightningResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.acceptedAction.type === 'spell' &&
      event.acceptedAction.id === chosenActionId
    );

    expect(chosenActionId).toEqual(expect.stringMatching(/^spell:lightning-bolt:direction:/));
    expect(lightningResolution?.type).toBe('action_resolved');
    if (lightningResolution?.acceptedAction.type !== 'spell') throw new Error('expected Lightning Bolt spell action');
    expect(lightningResolution.acceptedAction.direction).toEqual(chosenDirection);
    expect(lightningResolution.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'aoe',
        shape: 'line',
        direction: chosenDirection,
      }),
    ]));
  });

  it('lets an actual-action Beholder choose random Eye Ray targets stepwise', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const actionId = actionIds.find((id) => id.startsWith('random_ray:eye-ray:')) ?? 'end_turn';
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
                arguments: JSON.stringify({ actionId, rationale: 'Choose a legal target for the next random eye ray.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: beholderRandomRayScenario(),
      seed: 1,
      redAgent: 'openrouter:test/tool-model',
      blueAgent: 'battlecast.smart',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const rayResolutions = match.replay.filter((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.acceptedAction.type === 'random_ray'
    );
    const possibleEffects = rayResolutions[0]?.acceptedAction.type === 'random_ray'
      ? rayResolutions[0].acceptedAction.possibleEffects
      : [];

    expect(rayResolutions).toHaveLength(3);
    expect(rayResolutions.map((event) => event.turnStep)).toEqual([0, 1, 2]);
    expect(rayResolutions.every((event) =>
      event.logs.some((log) => possibleEffects.includes(log.action))
    )).toBe(true);
  });

  it('lets an actual-action Rogue use Steady Aim before choosing an attack', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let callIndex = 0;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const reactionDecline = actionIds.find((id) => id.startsWith('reaction:decline-'));
      const preferred = reactionDecline ?? (callIndex === 0
        ? 'class_feature:steady-aim'
        : callIndex === 1
          ? actionIds.find((id) => id.startsWith('attack:'))
          : 'end_turn');
      if (!reactionDecline) callIndex += 1;
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

  it('lets an actual-action Barbarian use Reckless Attack before choosing attacks', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let choseReckless = false;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const reactionDecline = actionIds.find((id) => id.startsWith('reaction:decline-'));
      const attack = actionIds.find((id) => id.startsWith('attack:'));
      let actionId: string;
      if (reactionDecline) {
        actionId = reactionDecline;
      } else if (!choseReckless && actionIds.includes('class_feature:reckless-attack')) {
        actionId = 'class_feature:reckless-attack';
        choseReckless = true;
      } else if (attack) {
        actionId = attack;
      } else {
        actionId = 'end_turn';
      }
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
                arguments: JSON.stringify({ actionId, rationale: 'Declare Reckless Attack, then choose concrete attacks.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: barbarianFrenzyScenario(),
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
    const recklessResolution = llmActions.find((event) =>
      event.acceptedAction.type === 'class_feature' &&
      event.acceptedAction.feature === 'reckless_attack'
    );
    const attackResolution = llmActions.find((event) => event.acceptedAction.type === 'attack');
    const barbarian = match.state.creatures.find((creature) => creature.team === 'red');

    expect(recklessResolution?.turnStep).toBe(0);
    expect(recklessResolution?.logs.some((log) => log.action === 'Reckless Attack')).toBe(true);
    expect(recklessResolution?.events.some((event) => event.kind === 'effect' && event.label === 'Reckless Attack')).toBe(true);
    expect(attackResolution?.turnStep).toBe(1);
    expect(barbarian?.stats.actionUsage['Reckless Attack']).toBe(1);
  });

  it('lets an actual-action Barbarian declare Brutal Strike before choosing attacks', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let choseBrutal = false;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const reactionDecline = actionIds.find((id) => id.startsWith('reaction:decline-'));
      const attack = actionIds.find((id) => id.startsWith('attack:'));
      let actionId: string;
      if (reactionDecline) {
        actionId = reactionDecline;
      } else if (!choseBrutal && actionIds.includes('class_feature:brutal-strike')) {
        actionId = 'class_feature:brutal-strike';
        choseBrutal = true;
      } else if (attack) {
        actionId = attack;
      } else {
        actionId = 'end_turn';
      }
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
                arguments: JSON.stringify({ actionId, rationale: 'Declare Brutal Strike, then choose concrete attacks.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: barbarianBrutalStrikeScenario(),
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
    const brutalResolution = llmActions.find((event) =>
      event.acceptedAction.type === 'class_feature' &&
      event.acceptedAction.feature === 'brutal_strike'
    );
    const attackResolution = llmActions.find((event) => event.acceptedAction.type === 'attack');

    expect(brutalResolution?.turnStep).toBe(0);
    expect(brutalResolution?.logs.some((log) => log.action === 'Brutal Strike Declared')).toBe(true);
    expect(brutalResolution?.events.some((event) => event.kind === 'effect' && event.label === 'Brutal Strike')).toBe(true);
    expect(attackResolution?.turnStep).toBe(1);
  });

  it("lets an actual-action Ranger use Nature's Veil as a real invisible-condition action", async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let choseVeil = false;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const reactionDecline = actionIds.find((id) => id.startsWith('reaction:decline-'));
      const veil = actionIds.find((id) => id.startsWith('spell:nature-s-veil:'));
      const attack = actionIds.find((id) => id.startsWith('attack:'));
      let actionId: string;
      if (reactionDecline) {
        actionId = reactionDecline;
      } else if (!choseVeil && veil) {
        actionId = veil;
        choseVeil = true;
      } else if (attack) {
        actionId = attack;
      } else {
        actionId = 'end_turn';
      }
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
                arguments: JSON.stringify({ actionId, rationale: 'Use Nature Veil, then choose concrete attacks.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: rangerNaturesVeilScenario(),
      seed: 1,
      redAgent: 'openrouter:test/tool-model',
      blueAgent: 'battlecast.smart',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const veilResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.acceptedAction.type === 'spell' &&
      event.acceptedAction.actionName === "Nature's Veil"
    );
    const ranger = match.state.creatures.find((creature) => creature.team === 'red');

    expect(veilResolution?.turnStep).toBe(0);
    expect(veilResolution?.logs.some((log) => log.action === "Nature's Veil")).toBe(true);
    expect(veilResolution?.logs.some((log) => log.details.includes("isn't simulated"))).toBe(false);
    expect(veilResolution?.events.some((event) =>
      event.kind === 'condition' && event.condition === 'invisible' && event.applied
    )).toBe(true);
    expect(ranger?.conditions).toContain('invisible');
    expect(ranger?.resources['natures-veil']).toBe(2);
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

  it('applies Instinctive Pounce after an actual-action Barbarian enters Rage', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let callIndex = 0;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const preferred = callIndex === 0
        ? actionIds.find((id) => id.startsWith('spell:rage'))
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
                arguments: JSON.stringify({ actionId, rationale: 'Enter Rage and use its concrete movement rider.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: barbarianPounceScenario(),
      seed: 1,
      redAgent: 'openrouter:test/tool-model',
      blueAgent: 'battlecast.smart',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const rageResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.acceptedAction.type === 'spell' &&
      event.acceptedAction.actionName === 'Rage'
    );

    expect(rageResolution?.type).toBe('action_resolved');
    expect(rageResolution?.logs.some((log) => log.action === 'Instinctive Pounce')).toBe(true);
    expect(rageResolution?.events.some((event) => event.kind === 'move')).toBe(true);
  });

  it('lets an actual-action Monk choose each Flurry of Blows strike after seeing the previous result', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let callIndex = 0;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const declinedReaction = actionIds.find((id) => id.startsWith('reaction:decline-'));
      if (declinedReaction) {
        return jsonResponse({
          id: `gen-reaction-${declinedReaction}`,
          model: 'test/tool-model',
          choices: [{
            finish_reason: 'tool_calls',
            message: {
              tool_calls: [{
                id: 'call-test',
                type: 'function',
                function: {
                  name: 'choose_d20bench_action',
                  arguments: JSON.stringify({ actionId: declinedReaction, rationale: 'Preserve ki for the flurry test.' }),
                },
              }],
            },
          }],
          usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
        });
      }
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

  it('asks an OpenRouter reactor to choose an opportunity attack after an actual-action move trigger', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    const observedReactionIds: string[][] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const reaction = actionIds.find((id) => id.startsWith('reaction:opportunity-attack:'));
      if (reaction) observedReactionIds.push([...actionIds]);
      const actionId = reaction
        ?? (actionIds.includes('move_to:2,0') ? 'move_to:2,0' : actionIds.find((id) => id.startsWith('move_to:')))
        ?? 'end_turn';
      return jsonResponse({
        id: `gen-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Use the concrete legal action.' }),
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
      blueAgent: 'openrouter:test/tool-model',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const reactionResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.acceptedAction.type === 'reaction' &&
      event.acceptedAction.reaction === 'opportunity_attack'
    );

    expect(observedReactionIds).toHaveLength(1);
    expect(reactionResolution?.type).toBe('action_resolved');
    expect(reactionResolution?.agentId).toBe('openrouter:test/tool-model');
    expect(reactionResolution?.logs.some((log) => log.action === 'Opportunity Attack')).toBe(true);
    expect(reactionResolution?.events.some((event) => event.kind === 'attack' && event.cause === 'opportunity')).toBe(true);
  });

  it('predeclares OpenRouter opportunity reactions during synchronous Battlecast tactic turns', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    const observedReactionIds: string[][] = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const reaction = actionIds.find((id) => id.startsWith('reaction:opportunity-attack:'));
      if (reaction) observedReactionIds.push([...actionIds]);
      const actionId = reaction ?? 'end_turn';
      return jsonResponse({
        id: `gen-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Spend the reaction when the enemy leaves reach.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: adjacentRangerKitesFighterScenario(),
      seed: 1,
      redAgent: 'battlecast.kiting',
      blueAgent: 'openrouter:test/tool-model',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const reactionResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.acceptedAction.type === 'reaction' &&
      event.acceptedAction.reaction === 'opportunity_attack'
    );

    expect(observedReactionIds.length).toBeGreaterThanOrEqual(1);
    expect(reactionResolution?.type).toBe('action_resolved');
    expect(reactionResolution?.agentId).toBe('openrouter:test/tool-model');
    expect(reactionResolution?.logs.some((log) => log.action === 'Opportunity Attack')).toBe(true);
  });

  it('asks OpenRouter for Uncanny Dodge at the damage trigger during Battlecast attack turns', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    const observedReactionIds: string[][] = [];
    const observedReactionPrompts: Array<{ legalActions?: Array<{ id: string; incomingDamage?: number }>; recentLogs?: string[] }> = [];
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const userMessage = body.messages.find((message: { role: string }) => message.role === 'user');
      const observation = JSON.parse(String(userMessage.content));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const uncanny = actionIds.find((id) => id.startsWith('reaction:uncanny-dodge:'));
      if (uncanny) {
        observedReactionIds.push([...actionIds]);
        observedReactionPrompts.push(observation);
      }
      const actionId = uncanny ?? 'end_turn';
      return jsonResponse({
        id: `gen-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Spend the reaction to reduce attack damage.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: fighterThreatensRogueScenario(),
      seed: 1,
      redAgent: 'battlecast.aggressive',
      blueAgent: 'openrouter:test/tool-model',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const reactionResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.acceptedAction.type === 'reaction' &&
      event.acceptedAction.reaction === 'uncanny_dodge'
    );

    expect(observedReactionIds.length).toBeGreaterThanOrEqual(1);
    expect(reactionResolution?.type).toBe('action_resolved');
    expect(reactionResolution?.agentId).toBe('openrouter:test/tool-model');
    expect(reactionResolution?.acceptedAction).toEqual(expect.objectContaining({
      reaction: 'uncanny_dodge',
      incomingDamage: expect.any(Number),
      expectedDamageReduction: expect.any(Number),
    }));
    const promptedUncanny = observedReactionPrompts[0]?.legalActions?.find((action) =>
      action.id.startsWith('reaction:uncanny-dodge:')
    );
    expect(promptedUncanny?.incomingDamage).toBe(reactionResolution?.acceptedAction.incomingDamage);
    expect(observedReactionPrompts[0]?.recentLogs?.some((log) =>
      log.includes('hits Rogue L5') && log.includes('damage')
    )).toBe(true);
    expect(reactionResolution?.logs.some((log) => log.action === 'Uncanny Dodge')).toBe(true);
  });

  it('asks OpenRouter for Monk Deflect at the damage trigger during Battlecast attack turns', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let observedPrompt: { legalActions?: Array<{ id: string; reactionFeature?: string; incomingDamage?: number }> } | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const deflect = actionIds.find((id) => id.startsWith('reaction:monk-deflect:'));
      if (deflect) {
        const userMessage = body.messages.find((message: { role: string }) => message.role === 'user');
        observedPrompt = JSON.parse(String(userMessage.content));
      }
      const actionId = deflect ?? 'end_turn';
      return jsonResponse({
        id: `gen-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Spend the reaction to reduce attack damage.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: fighterThreatensHeroScenario('Monk', 5),
      seed: 1,
      redAgent: 'battlecast.aggressive',
      blueAgent: 'openrouter:test/tool-model',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const reactionResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.acceptedAction.type === 'reaction' &&
      event.acceptedAction.reaction === 'monk_deflect'
    );

    expect(observedPrompt?.legalActions?.some((action) =>
      action.id.startsWith('reaction:monk-deflect:') &&
      action.reactionFeature === 'monk_deflect'
    )).toBe(true);
    expect(reactionResolution?.type).toBe('action_resolved');
    expect(reactionResolution?.acceptedAction).toEqual(expect.objectContaining({
      reaction: 'monk_deflect',
      incomingDamage: expect.any(Number),
      actualDamageReduction: expect.any(Number),
    }));
    expect(reactionResolution?.logs.some((log) => log.action === 'Deflect Attacks')).toBe(true);
  });

  it('asks OpenRouter for Monk Deflect when a Battlecast opportunity attack hits during model movement', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let actionCall = 0;
    let observedDeflectPrompt = false;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const deflect = actionIds.find((id) => id.startsWith('reaction:monk-deflect:'));
      let actionId: string;
      if (deflect) {
        observedDeflectPrompt = true;
        actionId = deflect;
      } else if (actionCall === 0 && actionIds.includes('dash')) {
        actionId = 'dash';
        actionCall += 1;
      } else if (actionCall === 1) {
        actionId = actionIds.find((id) => id.startsWith('move_to:7,0')) ??
          actionIds.find((id) => id.startsWith('move_to:0,0')) ??
          actionIds.find((id) => id.startsWith('move_to:')) ??
          'end_turn';
        actionCall += 1;
      } else {
        actionId = 'end_turn';
      }
      return jsonResponse({
        id: `gen-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Move away, then spend Deflect if hit.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: monkThreatensMonkScenario(),
      seed: 1,
      redAgent: 'battlecast.aggressive',
      blueAgent: 'openrouter:test/tool-model',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const reactionResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.acceptedAction.type === 'reaction' &&
      event.acceptedAction.reaction === 'monk_deflect'
    );

    expect(observedDeflectPrompt).toBe(true);
    expect(reactionResolution?.type).toBe('action_resolved');
    expect(reactionResolution?.logs.some((log) => log.action === 'Deflect Attacks')).toBe(true);
  });

  it("asks OpenRouter for Superior Hunter's Defense at the damage trigger during Battlecast attack turns", async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let observedPrompt: { legalActions?: Array<{ id: string; reactionFeature?: string; incomingDamage?: number }> } | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const defense = actionIds.find((id) => id.startsWith('reaction:superior-hunters-defense:'));
      if (defense) {
        const userMessage = body.messages.find((message: { role: string }) => message.role === 'user');
        observedPrompt = JSON.parse(String(userMessage.content));
      }
      const actionId = defense ?? 'end_turn';
      return jsonResponse({
        id: `gen-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Spend the reaction to resist this damage type.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: fighterThreatensHeroScenario('Ranger', 15),
      seed: 1,
      redAgent: 'battlecast.aggressive',
      blueAgent: 'openrouter:test/tool-model',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const reactionResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.acceptedAction.type === 'reaction' &&
      event.acceptedAction.reaction === 'superior_hunters_defense'
    );

    expect(observedPrompt?.legalActions?.some((action) =>
      action.id.startsWith('reaction:superior-hunters-defense:') &&
      action.reactionFeature === 'superior_hunters_defense'
    )).toBe(true);
    expect(reactionResolution?.type).toBe('action_resolved');
    expect(reactionResolution?.acceptedAction).toEqual(expect.objectContaining({
      reaction: 'superior_hunters_defense',
      incomingDamage: expect.any(Number),
      actualDamageReduction: expect.any(Number),
    }));
    expect(reactionResolution?.logs.some((log) => log.action === "Superior Hunter's Defense")).toBe(true);
  });

  it('asks OpenRouter for Barbarian Retaliation after adjacent Battlecast damage', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let observedPrompt: { legalActions?: Array<{ id: string; reactionFeature?: string; expectedDamage?: number }> } | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const retaliation = actionIds.find((id) => id.startsWith('reaction:retaliation:'));
      if (retaliation) {
        const userMessage = body.messages.find((message: { role: string }) => message.role === 'user');
        observedPrompt = JSON.parse(String(userMessage.content));
      }
      const actionId = retaliation ?? 'end_turn';
      return jsonResponse({
        id: `gen-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Spend the reaction to retaliate.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: fighterThreatensHeroScenario('Barbarian', 10),
      seed: 1,
      redAgent: 'battlecast.aggressive',
      blueAgent: 'openrouter:test/tool-model',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const reactionResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.acceptedAction.type === 'reaction' &&
      event.acceptedAction.reaction === 'retaliation'
    );

    expect(observedPrompt?.legalActions?.some((action) =>
      action.id.startsWith('reaction:retaliation:') &&
      action.reactionFeature === 'retaliation' &&
      typeof action.expectedDamage === 'number'
    )).toBe(true);
    expect(reactionResolution?.type).toBe('action_resolved');
    expect(reactionResolution?.acceptedAction).toEqual(expect.objectContaining({
      reaction: 'retaliation',
      reactionFeature: 'retaliation',
      incomingDamage: expect.any(Number),
    }));
    expect(reactionResolution?.logs.some((log) => log.action === 'Retaliation')).toBe(true);
  });

  it('surfaces Bard Cutting Words attack-roll context through reaction hooks', () => {
    const state = initBattle(createBattlecastCreatures(fighterThreatensBardPartyScenario(5).combatants, true), 8);
    const attacker = state.creatures.find((creature) => creature.team === 'red');
    const target = state.creatures.find((creature) => creature.team === 'blue' && creature.monsterData.heroClass === 'Fighter');
    const bard = state.creatures.find((creature) => creature.team === 'blue' && creature.monsterData.heroClass === 'Bard');
    if (!attacker || !target || !bard) throw new Error('expected Fighter plus Bard party');
    const attack = getActiveActions(attacker).find((action) => action.type === 'melee' && action.attackBonus !== undefined);
    if (!attack) throw new Error('expected melee attack');

    let observedContext: unknown;
    state.damageReactionHooks = {
      chooseDamageReaction: (context) => {
        if (context.reaction === 'cutting_words_attack') observedContext = context;
        return 'decline';
      },
    };

    withBattlecastRng(sequenceRng([0.67, 0.5, 0.5]), () => {
      resolveAttack(state, attacker, target, attack);
    });

    expect(observedContext).toEqual(expect.objectContaining({
      reaction: 'cutting_words_attack',
      target,
      reactor: bard,
      attacker,
      attackRollTotal: expect.any(Number),
      targetAc: expect.any(Number),
      maxRollReduction: 8,
      expectedRollReduction: 4.5,
    }));
    expect(state.logs.some((log) => log.action === 'Cutting Words Declined')).toBe(true);
  });

  it('asks OpenRouter Bard for Cutting Words at the damage-roll trigger during Battlecast attack turns', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let observedPrompt: {
      activeCreature?: { heroClass?: string };
      legalActions?: Array<{
        id: string;
        reactionFeature?: string;
        incomingDamage?: number;
        expectedDamageReduction?: number;
        resourceCost?: { key: string; amount: number };
      }>;
    } | undefined;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const cuttingDamage = actionIds.find((id) => id.startsWith('reaction:cutting-words-damage:'));
      const declineCuttingAttack = actionIds.find((id) => id.startsWith('reaction:decline-cutting-words-attack:'));
      let actionId: string;
      if (cuttingDamage) {
        const userMessage = body.messages.find((message: { role: string }) => message.role === 'user');
        observedPrompt = JSON.parse(String(userMessage.content));
        actionId = cuttingDamage;
      } else {
        actionId = declineCuttingAttack ?? 'end_turn';
      }
      return jsonResponse({
        id: `gen-${actionId}`,
        model: 'test/tool-model',
        choices: [{
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [{
              id: 'call-test',
              type: 'function',
              function: {
                name: 'choose_d20bench_action',
                arguments: JSON.stringify({ actionId, rationale: 'Spend Cutting Words on the damage roll.' }),
              },
            }],
          },
        }],
        usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
      });
    }) as typeof fetch;

    const match = await runAgentMatchAsync({
      scenario: fighterThreatensBardPartyScenario(20),
      seed: 1,
      redAgent: 'battlecast.aggressive',
      blueAgent: 'openrouter:test/tool-model',
      maxRounds: 1,
      llmActionSpace: 'actual-actions-v1',
    });
    const reactionResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.acceptedAction.type === 'reaction' &&
      event.acceptedAction.reaction === 'cutting_words_damage'
    );
    const bard = match.state.creatures.find((creature) => creature.team === 'blue' && creature.monsterData.heroClass === 'Bard');

    expect(observedPrompt?.activeCreature?.heroClass).toBe('Bard');
    expect(observedPrompt?.legalActions?.some((action) =>
      action.id.startsWith('reaction:cutting-words-damage:') &&
      action.reactionFeature === 'cutting_words_damage' &&
      typeof action.incomingDamage === 'number' &&
      typeof action.expectedDamageReduction === 'number' &&
      action.resourceCost?.key === 'bardic-inspiration'
    )).toBe(true);
    expect(reactionResolution?.type).toBe('action_resolved');
    expect(reactionResolution?.activeCreatureId).toBe(bard?.id);
    expect(reactionResolution?.acceptedAction).toEqual(expect.objectContaining({
      reaction: 'cutting_words_damage',
      reactionFeature: 'cutting_words_damage',
      incomingDamage: expect.any(Number),
      actualDamageReduction: expect.any(Number),
    }));
    expect(reactionResolution?.logs.some((log) => log.action === 'Cutting Words')).toBe(true);
  });

  it('lets an actual-action LLM Dodge and keep the defensive flag until its next turn', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let callIndex = 0;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const preferred = callIndex === 0 ? 'dodge' : 'end_turn';
      callIndex += 1;
      const actionId = actionIds.includes(preferred) ? preferred : 'end_turn';
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
                arguments: JSON.stringify({ actionId, rationale: 'Take a concrete defensive action.' }),
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
    const red = match.state.creatures.find((creature) => creature.team === 'red');
    const dodgeResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.acceptedAction.type === 'dodge'
    );

    expect(dodgeResolution?.logs.some((log) => log.action === 'Dodge')).toBe(true);
    expect(dodgeResolution?.events.some((event) => event.kind === 'effect' && event.label === 'Dodge')).toBe(true);
    expect(red?.turnFlags?.dodge).toBe(true);
    expect(red?.stats.actionUsage.Dodge).toBe(1);
  });

  it('lets an actual-action LLM Help against an adjacent target', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    let callIndex = 0;
    globalThis.fetch = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const actionIds = body.tools[0].function.parameters.properties.actionId.enum as string[];
      const help = actionIds.find((id) => id.startsWith('help:'));
      const preferred = callIndex === 0 ? help : 'end_turn';
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
                arguments: JSON.stringify({ actionId, rationale: 'Help an ally attack the adjacent target.' }),
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
    const blue = match.state.creatures.find((creature) => creature.team === 'blue');
    const helpResolution = match.replay.find((event) =>
      event.type === 'action_resolved' &&
      event.agentId === 'openrouter:test/tool-model' &&
      event.acceptedAction.type === 'help'
    );

    expect(helpResolution?.logs.some((log) => log.action === 'Help')).toBe(true);
    expect(helpResolution?.events.some((event) => event.kind === 'effect' && event.label === 'Help')).toBe(true);
    expect(blue?.activeBuffs.some((buff) => buff.key.startsWith('help:') && buff.advantageForAllAttackers)).toBe(true);
  });

  it('applies Dodge as Disadvantage in copied attack resolution', () => {
    const state = initBattle(createBattlecastCreatures(adjacentFighterDuelScenario().combatants, true), 8);
    const target = state.creatures.find((creature) => creature.team === 'red');
    const attacker = state.creatures.find((creature) => creature.team === 'blue');
    if (!target || !attacker) throw new Error('expected adjacent fighters');
    const attack = getActiveActions(attacker).find((action) => action.type === 'melee' && action.attackBonus !== undefined);
    if (!attack) throw new Error('expected melee attack');

    target.turnFlags = { ...target.turnFlags, dodge: true };
    withBattlecastRng(sequenceRng([0.99, 0]), () => {
      resolveAttack(state, attacker, target, attack);
    });

    expect(target.currentHp).toBe(target.maxHp);
    expect(state.logs.some((log) => log.type === 'miss' && log.action === attack.name)).toBe(true);
  });

  it('applies Help as a consumed Advantage opening on the target', () => {
    const state = initBattle(createBattlecastCreatures(helpOpeningScenario().combatants, true), 8);
    const helper = state.creatures.find((creature) => creature.id.includes('red-0'));
    const attacker = state.creatures.find((creature) => creature.id.includes('red-1'));
    const target = state.creatures.find((creature) => creature.team === 'blue');
    if (!helper || !attacker || !target) throw new Error('expected help scenario creatures');
    const attack = getActiveActions(attacker).find((action) => action.type === 'melee' && action.attackBonus !== undefined);
    if (!attack) throw new Error('expected melee attack');
    target.activeBuffs.push({
      name: 'Help',
      key: `help:${helper.id}:${target.id}`,
      casterId: helper.id,
      appliedRound: state.round,
      endRound: state.round + 2,
      advantageForAllAttackers: true,
      expiresOnSourceTurnStart: true,
    });

    withBattlecastRng(sequenceRng([0, 0.99, 0.5, 0.5, 0.5, 0.5]), () => {
      resolveAttack(state, attacker, target, attack);
    });

    expect(target.currentHp).toBeLessThan(target.maxHp);
    expect(target.activeBuffs.some((buff) => buff.key.startsWith('help:'))).toBe(false);
    expect(state.events.some((event) => event.kind === 'hit' && event.targetId === target.id)).toBe(true);
  });

  it('defers Paladin Divine Smite into explicit actual-action choices', () => {
    const state = initBattle(createBattlecastCreatures(paladinSmiteScenario().combatants, true), 8);
    const paladin = state.creatures.find((creature) => creature.monsterData.heroClass === 'Paladin');
    const target = state.creatures.find((creature) => creature.team === 'blue');
    if (!paladin || !target) throw new Error('expected Paladin smite scenario');
    const attack = getActiveActions(paladin).find((action) => action.smiteOnHit);
    if (!attack) throw new Error('expected smite-capable attack');
    const freeBefore = paladin.resources['free-divine-smite'];

    const result = withBattlecastRng(sequenceRng([0.8, 0.5]), () =>
      resolveAttack(state, paladin, target, attack, { deferSmite: true })
    );
    const catalogue = generateLegalActions(state, paladin, {
      includeActualActions: true,
      actualTurnContext: {
        attackRollsRemaining: 1,
        attackActionStarted: true,
        pendingSmite: {
          targetId: target.id,
          targetName: target.displayName,
          actionName: attack.name,
          isCritical: false,
        },
      },
    });
    const observation = buildLlmBattleObservation(state, paladin, catalogue);

    expect(result).toEqual(expect.objectContaining({
      hit: true,
      smiteEligible: true,
      actionName: attack.name,
    }));
    expect(paladin.resources['free-divine-smite']).toBe(freeBefore);
    expect(state.logs.some((log) => log.action === 'Divine Smite')).toBe(false);
    expect(catalogue.actions.map((action) => action.type)).toEqual(
      expect.arrayContaining(['smite']),
    );
    expect(catalogue.actions.every((action) => action.type === 'smite')).toBe(true);
    expect(catalogue.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'smite:divine-smite:free-divine-smite',
        type: 'smite',
        smite: 'divine_smite',
        resourceCost: { key: 'free-divine-smite', amount: 1 },
        expectedDamage: 9,
      }),
      expect.objectContaining({
        id: 'smite:decline',
        type: 'smite',
        smite: 'decline',
      }),
    ]));
    expect(observation.legalActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'smite:divine-smite:free-divine-smite',
        smite: 'divine_smite',
        targetId: target.id,
        description: expect.stringContaining('Spend the listed resource'),
      }),
    ]));
  });

  it('applies a selected deferred Paladin Divine Smite resource', () => {
    const state = initBattle(createBattlecastCreatures(paladinSmiteScenario().combatants, true), 8);
    const paladin = state.creatures.find((creature) => creature.monsterData.heroClass === 'Paladin');
    const target = state.creatures.find((creature) => creature.team === 'blue');
    if (!paladin || !target) throw new Error('expected Paladin smite scenario');
    const attack = getActiveActions(paladin).find((action) => action.smiteOnHit);
    if (!attack) throw new Error('expected smite-capable attack');

    withBattlecastRng(sequenceRng([0.8, 0.5]), () => {
      resolveAttack(state, paladin, target, attack, { deferSmite: true });
    });
    const hpAfterWeapon = target.currentHp;
    const applied = withBattlecastRng(sequenceRng([0.5, 0.5]), () =>
      resolveDivineSmite(
        state,
        paladin,
        target,
        attack,
        { resourceKey: 'free-divine-smite', slotLevel: 1, freeUse: true },
        false,
      )
    );

    expect(applied).toBe(true);
    expect(paladin.resources['free-divine-smite']).toBe(0);
    expect(target.currentHp).toBeLessThan(hpAfterWeapon);
    expect(state.logs.some((log) =>
      log.action === 'Divine Smite' &&
      log.details.includes('free use')
    )).toBe(true);
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

function adjacentRangerKitesFighterScenario(): D20benchScenario {
  return {
    id: 'test.adjacent-ranger-kites-fighter.v1',
    name: 'Adjacent Ranger Kites Fighter',
    description: 'A Battlecast kiting ranger backs away from an OpenRouter-controlled fighter, triggering a model-owned opportunity reaction.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Ranger', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function fighterThreatensRogueScenario(): D20benchScenario {
  return {
    id: 'test.fighter-threatens-rogue.v1',
    name: 'Fighter Threatens Rogue',
    description: 'A Battlecast Fighter attacks an OpenRouter-controlled Rogue that can spend Uncanny Dodge.',
    battleType: 'reaction-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Fighter', 20), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Rogue', 5), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function helpOpeningScenario(): D20benchScenario {
  return {
    id: 'test.help-opening.v1',
    name: 'Help Opening Test',
    description: 'Two allied fighters can set up and consume a Help opening against an adjacent enemy.',
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
      { monster: buildHero('Fighter', 5), team: 'red', position: { x: 2, y: 3 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 4 } },
    ],
  };
}

function paladinSmiteScenario(): D20benchScenario {
  return {
    id: 'test.paladin-smite.v1',
    name: 'Paladin Smite Test',
    description: 'A level-5 Paladin can choose whether to spend Divine Smite after a melee hit.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Paladin', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
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
    gridSize: 20,
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

function lightningBoltDirectionScenario(): D20benchScenario {
  return {
    id: 'test.lightning-bolt-direction.v1',
    name: 'Lightning Bolt Direction Test',
    description: 'A level-5 Wizard can choose among concrete line directions for Lightning Bolt.',
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
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 6, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 10, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 8 } },
    ],
  };
}

function beholderRandomRayScenario(): D20benchScenario {
  return {
    id: 'test.beholder-random-ray.v1',
    name: 'Beholder Random Ray Test',
    description: 'A Beholder chooses targets for random eye rays without choosing individual ray effects.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 20,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: 'Beholder', team: 'red', position: { x: 2, y: 2 } },
      { monster: 'Storm Giant', team: 'blue', position: { x: 10, y: 2 } },
    ],
  };
}

function paladinSacredWeaponScenario(): D20benchScenario {
  return {
    id: 'test.paladin-sacred-weapon.v1',
    name: 'Paladin Sacred Weapon Test',
    description: 'A level-5 Paladin can spend Channel Divinity on Sacred Weapon before making concrete melee attacks.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Paladin', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function monkSuperiorDefenseScenario(): D20benchScenario {
  return {
    id: 'test.monk-superior-defense.v1',
    name: 'Monk Superior Defense Test',
    description: 'A level-18 Monk can spend Focus Points on Superior Defense before making concrete attacks.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Monk', 18), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
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

function barbarianFrenzyScenario(): D20benchScenario {
  return {
    id: 'test.barbarian-frenzy.v1',
    name: 'Barbarian Frenzy Test',
    description: 'A raging level-5 Barbarian can spend a bonus action on a concrete Frenzy attack.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Barbarian', 5), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function barbarianBrutalStrikeScenario(): D20benchScenario {
  return {
    id: 'test.barbarian-brutal-strike.v1',
    name: 'Barbarian Brutal Strike Test',
    description: 'A level-9 Barbarian can declare Brutal Strike before making a concrete melee attack.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Barbarian', 9), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function rangerNaturesVeilScenario(): D20benchScenario {
  return {
    id: 'test.ranger-natures-veil.v1',
    name: "Ranger Nature's Veil Test",
    description: "A level-14 Ranger can spend Nature's Veil to become invisible before attacking.",
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Ranger', 14), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function barbarianPounceScenario(): D20benchScenario {
  return {
    id: 'test.barbarian-pounce.v1',
    name: 'Barbarian Instinctive Pounce Test',
    description: 'A level-7 Barbarian moves up to half speed as part of entering Rage.',
    battleType: 'duel-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 12,
    tacticalTags: ['test'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Barbarian', 7), team: 'red', position: { x: 1, y: 1 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 18, y: 1 } },
    ],
  };
}

function fighterThreatensHeroScenario(heroClass: Parameters<typeof buildHero>[0], level: number): D20benchScenario {
  return {
    id: `test.fighter-threatens-${String(heroClass).toLowerCase()}.v1`,
    name: `Fighter Threatens ${heroClass}`,
    description: `A Battlecast Fighter attacks an OpenRouter-controlled level-${level} ${heroClass}.`,
    battleType: 'reaction-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test', 'reaction'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Fighter', 20), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero(heroClass, level), team: 'blue', position: { x: 2, y: 3 } },
    ],
  };
}

function fighterThreatensBardPartyScenario(redLevel: number): D20benchScenario {
  return {
    id: `test.fighter-threatens-bard-party-l${redLevel}.v1`,
    name: `Fighter L${redLevel} Threatens Bard Party`,
    description: 'A Battlecast Fighter attacks an OpenRouter-controlled party with a Bard ally that can use Cutting Words.',
    battleType: 'reaction-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test', 'reaction'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Fighter', redLevel), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
      { monster: buildHero('Bard', 5), team: 'blue', position: { x: 4, y: 3 } },
    ],
  };
}

function monkThreatensMonkScenario(): D20benchScenario {
  return {
    id: 'test.monk-threatens-monk.v1',
    name: 'Monk Threatens Monk',
    description: 'A high-level Monk threatens an OpenRouter-controlled Monk that can provoke an opportunity attack and Deflect it.',
    battleType: 'reaction-smoke',
    visibility: 'hidden',
    rulesetId: 'test-rules',
    dataPackId: 'test-data',
    scenarioVersion: '1.0.0',
    gridSize: 8,
    tacticalTags: ['test', 'reaction'],
    designNotes: ['test fixture'],
    combatants: [
      { monster: buildHero('Monk', 20), team: 'red', position: { x: 2, y: 2 } },
      { monster: buildHero('Monk', 5), team: 'blue', position: { x: 2, y: 3 } },
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

function sequenceRng(values: number[]) {
  let index = 0;
  return {
    next: () => values[index++] ?? 0.5,
  };
}
