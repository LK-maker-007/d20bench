import {
  type TacticType,
  type BattleState,
  creatureDistance,
  getFootprintSize,
  getAoETargets,
  getEffectiveMoveSpeed,
  hasResource,
  isInCone,
  isInLine,
  isPositionBlocked,
  pickRangedSphereCenter,
  getEffectiveAbilityScore,
} from './battlecast/engine/combat.js';
import type { Creature, MonsterAction } from './battlecast/types/monster.js';
import {
  canSee,
  estimateActionDamage as estimateBattlecastActionDamage,
  getActiveActions,
  getMultiattack,
} from './battlecast/engine/ai-targeting.js';
import { reachableMovementDestinations } from './battlecast/engine/ai-movement.js';
import { abilityModifier, averageDamage } from './battlecast/engine/dice.js';
import { getEligibleWildShapeBeasts } from './battlecast/data/heroes.js';

export type LegalActionSpace = 'primitive' | 'battlecast-full-turn' | 'actual-actions-v1';

export const battlecastFullTurnTactics = [
  'aggressive',
  'smart',
  'kiting',
  'defensive',
] as const satisfies readonly TacticType[];

export type LegalAction =
  | {
      id: string;
      type: 'attack';
      actionName: string;
      targetId: string;
      targetName: string;
      expectedDamage: number;
    }
  | {
      id: string;
      type: 'random_ray';
      actionName: string;
      targetId: string;
      targetName: string;
      possibleEffects: string[];
      expectedDamage?: number;
    }
  | {
      id: string;
      type: 'move_toward';
      targetId: string;
      targetName: string;
    }
  | {
      id: string;
      type: 'move_to';
      destination: { x: number; y: number };
      distanceFt: number;
    }
  | {
      id: 'dodge';
      type: 'dodge';
    }
  | {
      id: string;
      type: 'help';
      targetId: string;
      targetName: string;
    }
  | {
      id: string;
      type: 'smite';
      smite: 'divine_smite' | 'decline';
      targetId: string;
      targetName: string;
      resourceKey?: string;
      resourceCost?: { key: string; amount: number };
      slotLevel?: number;
      expectedDamage?: number;
      isCritical?: boolean;
    }
  | {
      id: string;
      type: 'reaction';
      reaction:
        | 'opportunity_attack'
        | 'uncanny_dodge'
        | 'monk_deflect'
        | 'superior_hunters_defense'
        | 'retaliation'
        | 'cutting_words_attack'
        | 'cutting_words_damage'
        | 'decline';
      reactionFeature?:
        | 'opportunity_attack'
        | 'uncanny_dodge'
        | 'monk_deflect'
        | 'superior_hunters_defense'
        | 'retaliation'
        | 'cutting_words_attack'
        | 'cutting_words_damage';
      reactionTrigger?: 'opportunity_attack' | 'attack_damage' | 'attack_roll' | 'damage_roll';
      actionName?: string;
      targetId: string;
      targetName: string;
      expectedDamage?: number;
      incomingDamage?: number;
      damageType?: string;
      attackRollTotal?: number;
      targetAc?: number;
      maxRollReduction?: number;
      expectedRollReduction?: number;
      actualRollReduction?: number;
      preventedHit?: boolean;
      expectedDamageReduction?: number;
      actualDamageReduction?: number;
      resourceCost?: { key: string; amount: number };
    }
  | {
      id: 'dash';
      type: 'dash';
      extraMovement: number;
    }
  | {
      id: 'disengage' | 'bonus_disengage';
      type: 'disengage';
      isBonusAction: boolean;
    }
  | {
      id: string;
      type: 'class_feature';
      feature:
        | 'steady_aim'
        | 'action_surge'
        | 'reckless_attack'
        | 'brutal_strike'
        | 'martial_arts_strike'
        | 'flurry_of_blows'
        | 'wild_shape'
        | 'frenzy';
      label: string;
      isBonusAction: boolean;
      targetId?: string;
      targetName?: string;
      expectedDamage?: number;
      resourceCost?: { key: string; amount: number };
      beastName?: string;
      beastCr?: string;
      beastAc?: number;
      beastTempHp?: number;
      beastSpeed?: number;
      beastActions?: string[];
    }
  | {
      id: string;
      type: 'spell';
      actionName: string;
      effectKind: 'attack' | 'save' | 'aoe' | 'heal' | 'buff' | 'auto_darts' | 'special';
      targetId?: string;
      targetName?: string;
      targetIds?: string[];
      targetNames?: string[];
      center?: { x: number; y: number };
      direction?: { x: number; y: number };
      expectedDamage?: number;
      expectedHealing?: number;
      isBonusAction?: boolean;
      spellLevel?: number;
      resourceCost?: { key: string; amount: number };
    }
  | {
      id: 'end_turn';
      type: 'end_turn';
    }
  | {
      id: string;
      type: 'battlecast_tactic';
      tactic: TacticType;
    };

export interface LegalActionCatalogue {
  activeCreatureId: string;
  activeCreatureName: string;
  actionSpace?: LegalActionSpace;
  actions: LegalAction[];
}

export interface GenerateLegalActionsOptions {
  includeBattlecastFullTurnActions?: boolean;
  includeActualActions?: boolean;
  actualTurnContext?: {
    attackRollsRemaining?: number;
    attackActionStarted?: boolean;
    flurryStrikesRemaining?: number;
    pendingSmite?: {
      targetId: string;
      targetName: string;
      actionName: string;
      isCritical: boolean;
    };
  };
}

export function generateLegalActions(
  state: BattleState,
  active: Creature,
  options: GenerateLegalActionsOptions = {},
): LegalActionCatalogue {
  const actions: LegalAction[] = [];
  const actionSpace: LegalActionSpace = options.includeBattlecastFullTurnActions
    ? 'battlecast-full-turn'
    : options.includeActualActions ? 'actual-actions-v1' : 'primitive';
  const enemies = state.creatures.filter((creature) =>
    creature.team !== active.team && creature.isAlive && !creature.dying
  );
  const activeActions = getActiveActions(active).filter((action) =>
    action.type !== 'multiattack' && action.legendaryOnly !== true
  );
  const attackRollsRemaining = options.actualTurnContext?.attackRollsRemaining ?? estimateAttackRollBudget(active);
  const attackActionStarted = options.actualTurnContext?.attackActionStarted ?? false;
  const hasMainAction = options.includeActualActions
    ? !active.hasActed && (!attackActionStarted || attackRollsRemaining > 0)
    : !active.hasActed;
  const hasAttackRoll = options.includeActualActions
    ? hasMainAction && attackRollsRemaining > 0
    : hasMainAction;
  const hasBonusAction = active.bonusActionUsed !== true;
  const flurryStrikesRemaining = options.actualTurnContext?.flurryStrikesRemaining ?? 0;
  const pendingSmite = options.actualTurnContext?.pendingSmite;

  if (options.includeActualActions && pendingSmite) {
    return {
      activeCreatureId: active.id,
      activeCreatureName: active.displayName,
      actionSpace,
      actions: smiteActions(active, pendingSmite),
    };
  }

  for (const action of activeActions) {
    if (isConcreteSpellAction(action) && options.includeActualActions && !isAttackRollCantripAction(action)) continue;
    if (options.includeActualActions && isBeholderIndividualEyeRayAction(active, action)) continue;
    if (!hasAttackRoll || action.attackBonus === undefined) continue;
    for (const target of enemies) {
      if (!isTargetInRange(active, target, action)) continue;
      if (action.type === 'ranged' && !canSee(state, active, target)) continue;
      actions.push({
        id: attackActionId(action.name, target.id),
        type: 'attack',
        actionName: action.name,
        targetId: target.id,
        targetName: target.displayName,
        expectedDamage: estimateActionDamage(action),
      });
    }
  }

  if (options.includeActualActions) {
    actions.push(...randomRayActions(state, active, { hasAttackRoll }));
    actions.push(...coreActualActions(state, active, {
      hasMainAction,
      attackActionStarted,
      hasBonusAction,
      flurryStrikesRemaining,
    }));
    actions.push(...generateConcreteSpellActions(state, active, {
      hasMainAction,
      attackActionStarted,
      hasBonusAction,
    }));
  }

  if (active.movementRemaining > 0) {
    if (options.includeActualActions) {
      actions.push(...generateMoveToActions(state, active));
    }
    for (const target of enemies.filter((target) => creatureDistance(active, target) > 5)) {
      actions.push({
        id: moveTowardActionId(target.id),
        type: 'move_toward',
        targetId: target.id,
        targetName: target.displayName,
      });
    }
  }

  if (options.includeBattlecastFullTurnActions) {
    for (const tactic of battlecastFullTurnTactics) {
      actions.push(createBattlecastTacticAction(tactic));
    }
  }

  actions.push({ id: 'end_turn', type: 'end_turn' });

  return {
    activeCreatureId: active.id,
    activeCreatureName: active.displayName,
    actionSpace,
    actions,
  };
}

export function findLegalAction(catalogue: LegalActionCatalogue, actionId: string): LegalAction | undefined {
  return catalogue.actions.find((action) => action.id === actionId);
}

export function attackActionId(actionName: string, targetId: string): string {
  return `attack:${slugActionName(actionName)}:${targetId}`;
}

export function spellActionId(
  actionName: string,
  targetId: string | undefined,
  center: { x: number; y: number } | undefined,
): string {
  const base = `spell:${slugActionName(actionName)}`;
  if (center) return `${base}:center:${center.x},${center.y}`;
  return targetId ? `${base}:${targetId}` : base;
}

export function directionalSpellActionId(actionName: string, direction: { x: number; y: number }): string {
  return `spell:${slugActionName(actionName)}:direction:${direction.x},${direction.y}`;
}

export function randomRayActionId(actionName: string, targetId: string): string {
  return `random_ray:${slugActionName(actionName)}:${targetId}`;
}

export function autoDartActionId(actionName: string, targetIds: string[]): string {
  return `spell:${slugActionName(actionName)}:targets:${targetIds.join(',')}`;
}

export function moveTowardActionId(targetId: string): string {
  return `move_toward:${targetId}`;
}

export function moveToActionId(destination: { x: number; y: number }): string {
  return `move_to:${destination.x},${destination.y}`;
}

export function helpActionId(targetId: string): string {
  return `help:${targetId}`;
}

export function divineSmiteActionId(resourceKey: string): string {
  return `smite:divine-smite:${resourceKey}`;
}

export function opportunityAttackActionId(actionName: string, targetId: string): string {
  return `reaction:opportunity-attack:${slugActionName(actionName)}:${targetId}`;
}

export function declineOpportunityAttackActionId(targetId: string): string {
  return `reaction:decline-opportunity-attack:${targetId}`;
}

export function uncannyDodgeActionId(attackerId: string): string {
  return `reaction:uncanny-dodge:${attackerId}`;
}

export function declineUncannyDodgeActionId(attackerId: string): string {
  return `reaction:decline-uncanny-dodge:${attackerId}`;
}

export function monkDeflectActionId(attackerId: string): string {
  return `reaction:monk-deflect:${attackerId}`;
}

export function declineMonkDeflectActionId(attackerId: string): string {
  return `reaction:decline-monk-deflect:${attackerId}`;
}

export function superiorHuntersDefenseActionId(attackerId: string): string {
  return `reaction:superior-hunters-defense:${attackerId}`;
}

export function declineSuperiorHuntersDefenseActionId(attackerId: string): string {
  return `reaction:decline-superior-hunters-defense:${attackerId}`;
}

export function retaliationActionId(actionName: string, attackerId: string): string {
  return `reaction:retaliation:${slugActionName(actionName)}:${attackerId}`;
}

export function declineRetaliationActionId(attackerId: string): string {
  return `reaction:decline-retaliation:${attackerId}`;
}

export function cuttingWordsAttackActionId(attackerId: string): string {
  return `reaction:cutting-words-attack:${attackerId}`;
}

export function declineCuttingWordsAttackActionId(attackerId: string): string {
  return `reaction:decline-cutting-words-attack:${attackerId}`;
}

export function cuttingWordsDamageActionId(attackerId: string): string {
  return `reaction:cutting-words-damage:${attackerId}`;
}

export function declineCuttingWordsDamageActionId(attackerId: string): string {
  return `reaction:decline-cutting-words-damage:${attackerId}`;
}

export function battlecastTacticActionId(tactic: TacticType): string {
  return `battlecast_tactic:${tactic}`;
}

export function classFeatureTargetActionId(feature: string, targetId: string): string {
  return `class_feature:${slugActionName(feature)}:${targetId}`;
}

export function wildShapeActionId(beastName: string): string {
  return `class_feature:wild-shape:${slugActionName(beastName)}`;
}

export function createBattlecastTacticAction(tactic: TacticType): LegalAction {
  return {
    id: battlecastTacticActionId(tactic),
    type: 'battlecast_tactic',
    tactic,
  };
}

export function generateOpportunityReactionActions(
  reactor: Creature,
  target: Creature,
): LegalActionCatalogue {
  const actions: LegalAction[] = getActiveActions(reactor)
    .filter((action) =>
      action.type === 'melee' &&
      action.attackBonus !== undefined &&
      action.legendaryOnly !== true
    )
    .map((action) => ({
      id: opportunityAttackActionId(action.name, target.id),
      type: 'reaction' as const,
      reaction: 'opportunity_attack' as const,
      reactionFeature: 'opportunity_attack' as const,
      reactionTrigger: 'opportunity_attack' as const,
      actionName: action.name,
      targetId: target.id,
      targetName: target.displayName,
      expectedDamage: estimateActionDamage(action),
    }));
  actions.push({
    id: declineOpportunityAttackActionId(target.id),
    type: 'reaction',
    reaction: 'decline',
    reactionFeature: 'opportunity_attack',
    reactionTrigger: 'opportunity_attack',
    targetId: target.id,
    targetName: target.displayName,
  });
  return {
    activeCreatureId: reactor.id,
    activeCreatureName: reactor.displayName,
    actionSpace: 'actual-actions-v1',
    actions,
  };
}

export function generateUncannyDodgeReactionActions(
  defender: Creature,
  attacker: Creature,
  trigger?: { incomingDamage: number; damageType: string },
): LegalActionCatalogue {
  return generateDamageReactionActions(defender, attacker, 'uncanny_dodge', trigger);
}

export function generateDamageReactionActions(
  defender: Creature,
  attacker: Creature,
  reaction: 'uncanny_dodge' | 'monk_deflect' | 'superior_hunters_defense' | 'retaliation',
  trigger?: { incomingDamage: number; damageType: string },
): LegalActionCatalogue {
  const expectedDamageReduction = trigger
    ? expectedDamageReactionReduction(defender, reaction, trigger.incomingDamage)
    : undefined;
  const useActionId = damageReactionActionId(reaction, attacker.id);
  const declineActionId = declineDamageReactionActionId(reaction, attacker.id);
  const retaliationAction = reaction === 'retaliation' ? retaliationMeleeAction(defender) : undefined;
  const useAction: LegalAction = reaction === 'retaliation' && retaliationAction ? {
    id: retaliationActionId(retaliationAction.name, attacker.id),
    type: 'reaction',
    reaction,
    reactionFeature: reaction,
    reactionTrigger: 'attack_damage',
    actionName: retaliationAction.name,
    targetId: attacker.id,
    targetName: attacker.displayName,
    expectedDamage: estimateActionDamage(retaliationAction),
    incomingDamage: trigger?.incomingDamage,
    damageType: trigger?.damageType,
  } : {
      id: useActionId,
      type: 'reaction',
      reaction,
      reactionFeature: reaction,
      reactionTrigger: 'attack_damage',
      targetId: attacker.id,
      targetName: attacker.displayName,
      incomingDamage: trigger?.incomingDamage,
      damageType: trigger?.damageType,
      expectedDamageReduction,
    };
  const actions: LegalAction[] = [
    useAction,
    {
      id: declineActionId,
      type: 'reaction',
      reaction: 'decline',
      reactionFeature: reaction,
      reactionTrigger: 'attack_damage',
      targetId: attacker.id,
      targetName: attacker.displayName,
      incomingDamage: trigger?.incomingDamage,
      damageType: trigger?.damageType,
      expectedDamageReduction: 0,
    },
  ];
  return {
    activeCreatureId: defender.id,
    activeCreatureName: defender.displayName,
    actionSpace: 'actual-actions-v1',
    actions,
  };
}

export function generateCuttingWordsReactionActions(
  bard: Creature,
  attacker: Creature,
  mode: 'attack' | 'damage',
  trigger: {
    incomingDamage?: number;
    damageType?: string;
    attackRollTotal?: number;
    targetAc?: number;
    maxRollReduction?: number;
    expectedRollReduction?: number;
  } = {},
): LegalActionCatalogue {
  const die = bardicInspirationDieForLevel(bard.monsterData.heroLevel ?? 1);
  const maxRollReduction = trigger.maxRollReduction ?? maxRollForSingleDie(die);
  const expectedRollReduction = trigger.expectedRollReduction ?? averageDamage(die);
  const reaction = mode === 'attack' ? 'cutting_words_attack' : 'cutting_words_damage';
  const reactionTrigger = mode === 'attack' ? 'attack_roll' : 'damage_roll';
  const useId = mode === 'attack'
    ? cuttingWordsAttackActionId(attacker.id)
    : cuttingWordsDamageActionId(attacker.id);
  const declineId = mode === 'attack'
    ? declineCuttingWordsAttackActionId(attacker.id)
    : declineCuttingWordsDamageActionId(attacker.id);
  const expectedDamageReduction = mode === 'damage' && trigger.incomingDamage !== undefined
    ? Math.min(trigger.incomingDamage, expectedRollReduction)
    : undefined;
  const common = {
    reactionFeature: reaction,
    reactionTrigger,
    targetId: attacker.id,
    targetName: attacker.displayName,
    incomingDamage: mode === 'damage' ? trigger.incomingDamage : undefined,
    damageType: trigger.damageType,
    attackRollTotal: trigger.attackRollTotal,
    targetAc: trigger.targetAc,
    maxRollReduction,
    expectedRollReduction,
    expectedDamageReduction,
  } satisfies Partial<Extract<LegalAction, { type: 'reaction' }>>;

  return {
    activeCreatureId: bard.id,
    activeCreatureName: bard.displayName,
    actionSpace: 'actual-actions-v1',
    actions: [
      {
        id: useId,
        type: 'reaction',
        reaction,
        resourceCost: { key: 'bardic-inspiration', amount: 1 },
        ...common,
      },
      {
        id: declineId,
        type: 'reaction',
        reaction: 'decline',
        ...common,
      },
    ],
  };
}

export function estimateAttackRollBudget(active: Creature): number {
  const multiattack = getMultiattack(active);
  if (!multiattack) return 1;
  const description = multiattack.description.toLowerCase();
  if (active.monsterData.name === 'Hydra' && description.includes('as many bite attacks as it has heads')) {
    return Math.max(1, active.hydraHeads?.living ?? 5);
  }
  const explicit = description.match(/\b(five|5|four|4|three|3|two|2)\b/);
  if (explicit) return countWordToNumber(explicit[1]);
  return 2;
}

function coreActualActions(
  state: BattleState,
  active: Creature,
  economy: {
    hasMainAction: boolean;
    attackActionStarted: boolean;
    hasBonusAction: boolean;
    flurryStrikesRemaining: number;
  },
): LegalAction[] {
  const actions: LegalAction[] = [];
  const hasMainActionAvailable = economy.hasMainAction && !economy.attackActionStarted;
  const dashMovement = movementAllowance(active, state);
  if (hasMainActionAvailable && dashMovement > 0) {
    actions.push({ id: 'dash', type: 'dash', extraMovement: dashMovement });
  }
  if (hasMainActionAvailable && canTakeDefensiveAction(active)) {
    actions.push({ id: 'dodge', type: 'dodge' });
    actions.push(...helpActions(state, active));
  }
  if (canUseSteadyAim(state, active, economy)) {
    actions.push({
      id: 'class_feature:steady-aim',
      type: 'class_feature',
      feature: 'steady_aim',
      label: 'Steady Aim',
      isBonusAction: true,
    });
  }
  if (canUseActionSurge(active, economy)) {
    actions.push({
      id: 'class_feature:action-surge',
      type: 'class_feature',
      feature: 'action_surge',
      label: 'Action Surge',
      isBonusAction: false,
      resourceCost: { key: 'action-surge', amount: 1 },
    });
  }
  if (canUseRecklessAttack(state, active, economy)) {
    actions.push({
      id: 'class_feature:reckless-attack',
      type: 'class_feature',
      feature: 'reckless_attack',
      label: 'Reckless Attack',
      isBonusAction: false,
    });
  }
  if (canUseBrutalStrike(state, active, economy)) {
    actions.push({
      id: 'class_feature:brutal-strike',
      type: 'class_feature',
      feature: 'brutal_strike',
      label: 'Brutal Strike',
      isBonusAction: false,
    });
  }
  actions.push(...wildShapeActions(state, active, economy));
  actions.push(...monkBonusAttackActions(state, active, economy));
  actions.push(...frenzyActions(state, active, economy));

  const threatened = opportunityThreats(state, active).length > 0;
  if (!threatened) return actions;

  if (hasMainActionAvailable) {
    actions.push({ id: 'disengage', type: 'disengage', isBonusAction: false });
  }
  if (economy.hasBonusAction && canBonusDisengage(active)) {
    actions.push({ id: 'bonus_disengage', type: 'disengage', isBonusAction: true });
  }

  return actions;
}

function canTakeDefensiveAction(active: Creature): boolean {
  return !active.conditions.includes('incapacitated') &&
    !active.conditions.includes('unconscious') &&
    !active.conditions.includes('stunned') &&
    !active.conditions.includes('paralyzed');
}

function helpActions(state: BattleState, active: Creature): LegalAction[] {
  return state.creatures
    .filter((target) =>
      target.team !== active.team &&
      target.isAlive &&
      !target.dying &&
      creatureDistance(active, target) <= 5
    )
    .sort((left, right) =>
      left.currentHp - right.currentHp ||
      left.displayName.localeCompare(right.displayName) ||
      left.id.localeCompare(right.id)
    )
    .map((target) => ({
      id: helpActionId(target.id),
      type: 'help' as const,
      targetId: target.id,
      targetName: target.displayName,
    }));
}

function smiteActions(
  active: Creature,
  pending: { targetId: string; targetName: string; actionName: string; isCritical: boolean },
): LegalAction[] {
  const smiteAction = getActiveActions(active).find((action) =>
    action.name === pending.actionName && action.smiteOnHit
  );
  const actions: LegalAction[] = [];
  if (smiteAction?.smiteOnHit && hasResource(active, 'free-divine-smite')) {
    actions.push(smiteActionForResource(smiteAction, pending, 'free-divine-smite', 1));
  }
  if (smiteAction?.smiteOnHit) {
    for (let slotLevel = 1; slotLevel <= 9; slotLevel += 1) {
      const resourceKey = `slot-${slotLevel}`;
      if (hasResource(active, resourceKey)) {
        actions.push(smiteActionForResource(smiteAction, pending, resourceKey, slotLevel));
      }
    }
  }
  actions.push({
    id: 'smite:decline',
    type: 'smite',
    smite: 'decline',
    targetId: pending.targetId,
    targetName: pending.targetName,
    isCritical: pending.isCritical,
  });
  return actions;
}

function smiteActionForResource(
  action: MonsterAction,
  pending: { targetId: string; targetName: string; actionName: string; isCritical: boolean },
  resourceKey: string,
  slotLevel: number,
): Extract<LegalAction, { type: 'smite' }> {
  const diceCount = action.smiteOnHit?.dicePerSlotLevel[slotLevel - 1]
    ?? action.smiteOnHit?.dicePerSlotLevel[0]
    ?? 2;
  const diceExpression = `${pending.isCritical ? diceCount * 2 : diceCount}d${action.smiteOnHit?.die ?? 8}`;
  return {
    id: divineSmiteActionId(resourceKey),
    type: 'smite',
    smite: 'divine_smite',
    targetId: pending.targetId,
    targetName: pending.targetName,
    resourceKey,
    resourceCost: { key: resourceKey, amount: 1 },
    slotLevel,
    expectedDamage: averageDamage(diceExpression),
    isCritical: pending.isCritical,
  };
}

function damageReactionActionId(
  reaction: 'uncanny_dodge' | 'monk_deflect' | 'superior_hunters_defense' | 'retaliation',
  attackerId: string,
): string {
  if (reaction === 'monk_deflect') return monkDeflectActionId(attackerId);
  if (reaction === 'superior_hunters_defense') return superiorHuntersDefenseActionId(attackerId);
  if (reaction === 'retaliation') return retaliationActionId('retaliation', attackerId);
  return uncannyDodgeActionId(attackerId);
}

function declineDamageReactionActionId(
  reaction: 'uncanny_dodge' | 'monk_deflect' | 'superior_hunters_defense' | 'retaliation',
  attackerId: string,
): string {
  if (reaction === 'monk_deflect') return declineMonkDeflectActionId(attackerId);
  if (reaction === 'superior_hunters_defense') return declineSuperiorHuntersDefenseActionId(attackerId);
  if (reaction === 'retaliation') return declineRetaliationActionId(attackerId);
  return declineUncannyDodgeActionId(attackerId);
}

function expectedDamageReactionReduction(
  defender: Creature,
  reaction: 'uncanny_dodge' | 'monk_deflect' | 'superior_hunters_defense' | 'retaliation',
  incomingDamage: number,
): number {
  if (reaction === 'retaliation') return 0;
  if (reaction === 'monk_deflect') {
    const dexMod = abilityModifier(getEffectiveAbilityScore(defender, 'dex'));
    const level = defender.monsterData.heroLevel ?? 0;
    return Math.min(incomingDamage, averageDamage('1d10') + dexMod + level);
  }
  return incomingDamage - Math.floor(incomingDamage / 2);
}

function bardicInspirationDieForLevel(level: number): '1d6' | '1d8' | '1d10' | '1d12' {
  if (level >= 15) return '1d12';
  if (level >= 10) return '1d10';
  if (level >= 5) return '1d8';
  return '1d6';
}

function maxRollForSingleDie(die: string): number {
  const match = /^1d(\d+)$/.exec(die);
  return match ? Number(match[1]) : 0;
}

function retaliationMeleeAction(defender: Creature): MonsterAction | undefined {
  return defender.monsterData.actions
    .filter((action) => action.type === 'melee' && action.damage && action.attackBonus !== undefined && action.legendaryOnly !== true)
    .sort((left, right) =>
      estimateActionDamage(right) - estimateActionDamage(left) ||
      left.name.localeCompare(right.name)
    )[0];
}

function movementAllowance(active: Creature, state: BattleState): number {
  if (active.conditions.includes('restrained') || active.conditions.includes('grappled')) return 0;
  return Math.max(0, getEffectiveMoveSpeed(active, state) - activeSpeedPenalty(active));
}

function activeSpeedPenalty(active: Creature): number {
  return Math.max(0, ...((active.activeBuffs ?? []).map((buff) => buff.speedPenalty ?? 0)));
}

function canBonusDisengage(active: Creature): boolean {
  return active.monsterData.heroClass === 'Rogue' || hasTrait(active, 'Nimble Escape');
}

function canUseSteadyAim(
  state: BattleState,
  active: Creature,
  economy: { hasBonusAction: boolean },
): boolean {
  if (active.monsterData.heroClass !== 'Rogue' || (active.monsterData.heroLevel ?? 0) < 3) return false;
  if (!economy.hasBonusAction || active.hasMovedThisTurn || active.turnFlags?.steadyAim) return false;
  if (active.conditions.includes('incapacitated') || active.conditions.includes('unconscious')) return false;
  return getActiveActions(active).some((action) => {
    if (action.attackBonus === undefined || action.type === 'multiattack' || action.legendaryOnly === true) return false;
    return state.creatures.some((target) =>
      target.team !== active.team &&
      target.isAlive &&
      !target.dying &&
      isTargetInRange(active, target, action) &&
      (action.type !== 'ranged' || canSee(state, active, target))
    );
  });
}

function canUseActionSurge(
  active: Creature,
  economy: { hasMainAction: boolean; attackActionStarted: boolean },
): boolean {
  if (active.monsterData.heroClass !== 'Fighter' || (active.monsterData.heroLevel ?? 0) < 2) return false;
  if (!hasResource(active, 'action-surge')) return false;
  if (active.conditions.includes('incapacitated') || active.conditions.includes('unconscious')) return false;
  if (economy.hasMainAction) return false;
  return active.hasActed || economy.attackActionStarted;
}

function canUseRecklessAttack(
  state: BattleState,
  active: Creature,
  economy: { hasMainAction: boolean; attackActionStarted: boolean },
): boolean {
  if (active.monsterData.heroClass !== 'Barbarian' || (active.monsterData.heroLevel ?? 0) < 2) return false;
  if (!economy.hasMainAction || economy.attackActionStarted) return false;
  if (active.turnFlags?.reckless || active.turnFlags?.brutalStrike) return false;
  if (active.conditions.includes('incapacitated') || active.conditions.includes('unconscious')) return false;

  return getActiveActions(active)
    .filter((action) => action.type === 'melee' && action.attackBonus !== undefined && action.legendaryOnly !== true)
    .some((action) => state.creatures.some((target) =>
      target.team !== active.team &&
      target.isAlive &&
      !target.dying &&
      isTargetInRange(active, target, action)
    ));
}

function canUseBrutalStrike(
  state: BattleState,
  active: Creature,
  economy: { hasMainAction: boolean; attackActionStarted: boolean },
): boolean {
  if (active.monsterData.heroClass !== 'Barbarian' || (active.monsterData.heroLevel ?? 0) < 9) return false;
  if (!economy.hasMainAction || economy.attackActionStarted) return false;
  if (active.turnFlags?.reckless || active.turnFlags?.brutalStrike || active.turnFlags?.brutalStrikeUsed) return false;
  if (active.conditions.includes('incapacitated') || active.conditions.includes('unconscious')) return false;

  return getActiveActions(active)
    .filter((action) => action.type === 'melee' && action.attackBonus !== undefined && action.legendaryOnly !== true)
    .some((action) => state.creatures.some((target) =>
      target.team !== active.team &&
      target.isAlive &&
      !target.dying &&
      isTargetInRange(active, target, action)
    ));
}

function wildShapeActions(
  state: BattleState,
  active: Creature,
  economy: { hasBonusAction: boolean },
): LegalAction[] {
  const level = active.monsterData.heroLevel ?? 0;
  if (active.monsterData.heroClass !== 'Druid' || level < 2) return [];
  if (!economy.hasBonusAction || active.wildShape || active.concentratingOn) return [];
  if (!hasResource(active, 'wild-shape')) return [];
  if (active.conditions.includes('incapacitated') || active.conditions.includes('unconscious')) return [];

  const preferredBeastName = active.monsterData.preferredWildShapeBeast;
  const isMoon = active.monsterData.heroSubclass === 'Circle of the Moon';
  const tempHp = isMoon ? level * 3 : level;
  const gridSize = state.gridSize ?? 20;

  return getEligibleWildShapeBeasts({
    level,
    subclass: active.monsterData.heroSubclass,
  })
    .filter((beast) => !preferredBeastName || beast.name === preferredBeastName)
    .filter((beast) => {
      const footprint = getFootprintSize(beast.size);
      if (active.position.x + footprint > gridSize || active.position.y + footprint > gridSize) return false;
      return !isPositionBlocked(active.position, beast.size, state.creatures, active.id, state.terrainBlocked);
    })
    .map((beast) => ({
      id: wildShapeActionId(beast.name),
      type: 'class_feature' as const,
      feature: 'wild_shape' as const,
      label: `Wild Shape into ${beast.name}`,
      isBonusAction: true,
      resourceCost: { key: 'wild-shape', amount: 1 },
      beastName: beast.name,
      beastCr: beast.cr,
      beastAc: beast.ac,
      beastTempHp: tempHp,
      beastSpeed: Math.max(beast.speed.walk, beast.speed.climb ?? 0, beast.speed.swim ?? 0, beast.speed.fly ?? 0),
      beastActions: beast.actions
        .filter((action) => action.legendaryOnly !== true)
        .map((action) => action.name),
    }));
}

function frenzyActions(
  state: BattleState,
  active: Creature,
  economy: { hasBonusAction: boolean },
): LegalAction[] {
  if (active.monsterData.heroClass !== 'Barbarian' || (active.monsterData.heroLevel ?? 0) < 3) return [];
  if (!economy.hasBonusAction || !hasActiveBuff(active, 'rage')) return [];
  if (active.conditions.includes('incapacitated') || active.conditions.includes('unconscious')) return [];
  const meleeActions = getActiveActions(active)
    .filter((action) => action.type === 'melee' && action.attackBonus !== undefined && action.legendaryOnly !== true);
  if (meleeActions.length === 0) return [];
  const bestAction = (): MonsterAction =>
    meleeActions.reduce((best, action) =>
      estimateActionDamage(action) > estimateActionDamage(best) ? action : best
    );

  return state.creatures
    .filter((target) =>
      target.team !== active.team &&
      target.isAlive &&
      !target.dying
    )
    .map((target) => ({ target, action: bestAction() }))
    .filter(({ target, action }) => isTargetInRange(active, target, action))
    .map(({ target, action }) => ({
      id: classFeatureTargetActionId('frenzy', target.id),
      type: 'class_feature' as const,
      feature: 'frenzy' as const,
      label: `Frenzy attack against ${target.displayName}`,
      isBonusAction: true,
      targetId: target.id,
      targetName: target.displayName,
      expectedDamage: estimateActionDamage(action),
    }));
}

function hasActiveBuff(active: Creature, key: string): boolean {
  return active.activeBuffs?.some((buff) => buff.key === key) ?? false;
}

function monkBonusAttackActions(
  state: BattleState,
  active: Creature,
  economy: {
    attackActionStarted: boolean;
    hasBonusAction: boolean;
    flurryStrikesRemaining: number;
  },
): LegalAction[] {
  if (active.monsterData.heroClass !== 'Monk') return [];
  const level = active.monsterData.heroLevel ?? 0;
  const unarmed = monkUnarmedAction(active);
  if (!unarmed) return [];
  const targets = classFeatureAttackTargets(state, active, unarmed);
  if (targets.length === 0) return [];

  if (economy.flurryStrikesRemaining > 0) {
    return targets.map((target) => ({
      id: classFeatureTargetActionId('flurry-of-blows', target.id),
      type: 'class_feature' as const,
      feature: 'flurry_of_blows' as const,
      label: `Flurry of Blows strike against ${target.displayName}`,
      isBonusAction: true,
      targetId: target.id,
      targetName: target.displayName,
      expectedDamage: estimateActionDamage(unarmed),
    }));
  }

  if (!economy.attackActionStarted || !economy.hasBonusAction) return [];
  const actions: LegalAction[] = [];
  if (level >= 2 && hasResource(active, 'ki')) {
    actions.push(...targets.map((target) => ({
      id: classFeatureTargetActionId('flurry-of-blows', target.id),
      type: 'class_feature' as const,
      feature: 'flurry_of_blows' as const,
      label: `Flurry of Blows against ${target.displayName}`,
      isBonusAction: true,
      targetId: target.id,
      targetName: target.displayName,
      expectedDamage: estimateActionDamage(unarmed),
      resourceCost: { key: 'ki', amount: 1 },
    })));
  }
  if (level >= 1) {
    actions.push(...targets.map((target) => ({
      id: classFeatureTargetActionId('martial-arts', target.id),
      type: 'class_feature' as const,
      feature: 'martial_arts_strike' as const,
      label: `Martial Arts strike against ${target.displayName}`,
      isBonusAction: true,
      targetId: target.id,
      targetName: target.displayName,
      expectedDamage: estimateActionDamage(unarmed),
    })));
  }
  return actions;
}

function classFeatureAttackTargets(state: BattleState, active: Creature, action: MonsterAction): Creature[] {
  return state.creatures
    .filter((target) =>
      target.team !== active.team &&
      target.isAlive &&
      !target.dying &&
      isTargetInRange(active, target, action)
    )
    .sort((left, right) =>
      left.currentHp - right.currentHp ||
      left.displayName.localeCompare(right.displayName) ||
      left.id.localeCompare(right.id)
    );
}

function monkUnarmedAction(active: Creature): MonsterAction | undefined {
  return getActiveActions(active)
    .filter((action) => action.type === 'melee' && action.attackBonus !== undefined && action.legendaryOnly !== true)
    .find((action) => action.name === 'Martial Arts (Unarmed)') ??
    getActiveActions(active).find((action) => action.type === 'melee' && action.attackBonus !== undefined && action.legendaryOnly !== true);
}

function hasTrait(active: Creature, name: string): boolean {
  const lower = name.toLowerCase();
  return [
    ...(active.monsterData.traits ?? []),
    ...(active.wildShape?.traits ?? []),
  ].some((trait) => trait.name.toLowerCase().includes(lower));
}

function opportunityThreats(state: BattleState, active: Creature): Creature[] {
  return state.creatures.filter((enemy) => {
    if (enemy.team === active.team || !enemy.isAlive || enemy.reactionUsed) return false;
    if (enemy.conditions.includes('incapacitated') || enemy.conditions.includes('stunned') ||
      enemy.conditions.includes('paralyzed') || enemy.conditions.includes('unconscious')) return false;
    const reach = getActiveActions(enemy)
      .filter((action) => action.type === 'melee')
      .reduce((max, action) => Math.max(max, action.reach ?? 5), 5);
    return creatureDistance(enemy, active) <= reach;
  });
}

function generateMoveToActions(state: BattleState, active: Creature): LegalAction[] {
  return selectMovementDestinations(state, active, reachableMovementDestinations(active, state))
    .map((destination) => ({
      id: moveToActionId(destination),
      type: 'move_to' as const,
      destination: { x: destination.x, y: destination.y },
      distanceFt: destination.distanceFt,
    }));
}

function selectMovementDestinations(
  state: BattleState,
  active: Creature,
  reachable: Array<{ x: number; y: number; distanceFt: number }>,
): Array<{ x: number; y: number; distanceFt: number }> {
  const byKey = new Map(reachable.map((destination) => [`${destination.x},${destination.y}`, destination]));
  const selected = new Map<string, { x: number; y: number; distanceFt: number }>();
  const add = (destination: { x: number; y: number; distanceFt: number } | undefined) => {
    if (!destination) return;
    selected.set(`${destination.x},${destination.y}`, destination);
  };
  const addByCoord = (coord: { x: number; y: number }) => add(byKey.get(`${coord.x},${coord.y}`));

  const maxDestinations = 16;
  const enemies = state.creatures.filter((creature) =>
    creature.team !== active.team && creature.isAlive && !creature.dying
  );
  for (const enemy of enemies) {
    for (const destination of reachable
      .filter((candidate) => Math.max(Math.abs(candidate.x - enemy.position.x), Math.abs(candidate.y - enemy.position.y)) === 1)
      .sort((left, right) =>
        left.distanceFt - right.distanceFt ||
        left.x - right.x ||
        left.y - right.y
      )
      .slice(0, 2)) {
      add(destination);
    }
  }

  const maxSquares = Math.floor(active.movementRemaining / 5);
  for (const dx of [-1, 0, 1]) {
    for (const dy of [-1, 0, 1]) {
      if (dx === 0 && dy === 0) continue;
      addByCoord({
        x: active.position.x + dx * maxSquares,
        y: active.position.y + dy * maxSquares,
      });
    }
  }

  const nearestEnemy = enemies
    .slice()
    .sort((left, right) =>
      creatureDistance(active, left) - creatureDistance(active, right) ||
      left.id.localeCompare(right.id)
    )[0];
  if (nearestEnemy) {
    for (const destination of reachable
      .slice()
      .sort((left, right) =>
        creatureDistance({ ...active, position: right }, nearestEnemy) -
        creatureDistance({ ...active, position: left }, nearestEnemy) ||
        right.distanceFt - left.distanceFt ||
        left.x - right.x ||
        left.y - right.y
      )
      .slice(0, 4)) {
      add(destination);
    }
  }

  for (const destination of reachable) {
    add(destination);
    if (selected.size >= maxDestinations) break;
  }

  return [...selected.values()]
    .sort((left, right) =>
      right.distanceFt - left.distanceFt ||
      left.x - right.x ||
      left.y - right.y
    )
    .slice(0, maxDestinations);
}

function isTargetInRange(active: Creature, target: Creature, action: MonsterAction): boolean {
  const distance = creatureDistance(active, target);
  if (action.type === 'melee') {
    return distance <= (action.reach ?? 5);
  }

  if (action.range) {
    return distance <= action.range.long;
  }

  return distance <= (action.reach ?? 5);
}

function randomRayActions(
  state: BattleState,
  active: Creature,
  economy: { hasAttackRoll: boolean },
): LegalAction[] {
  if (!economy.hasAttackRoll || !hasBeholderEyeRayMultiattack(active)) return [];
  const rays = beholderEyeRayActions(active);
  if (rays.length === 0) return [];

  const enemies = state.creatures.filter((creature) =>
    creature.team !== active.team &&
    creature.isAlive &&
    !creature.dying &&
    canSee(state, active, creature) &&
    rays.some((ray) => isTargetInRange(active, creature, ray))
  );
  const possibleEffects = rays.map((ray) => ray.name);

  return enemies.map((target) => ({
    id: randomRayActionId('Eye Ray', target.id),
    type: 'random_ray' as const,
    actionName: 'Eye Ray',
    targetId: target.id,
    targetName: target.displayName,
    possibleEffects,
    expectedDamage: rays.reduce((sum, ray) => sum + estimateBattlecastActionDamage(ray, target), 0) / rays.length,
  }));
}

function hasBeholderEyeRayMultiattack(active: Creature): boolean {
  if (active.monsterData.name !== 'Beholder') return false;
  return getMultiattack(active)?.description.toLowerCase().includes('eye ray') ?? false;
}

function isBeholderIndividualEyeRayAction(active: Creature, action: MonsterAction): boolean {
  return hasBeholderEyeRayMultiattack(active) &&
    action.name.includes('Ray') &&
    action.name !== 'Eye Rays';
}

function beholderEyeRayActions(active: Creature): MonsterAction[] {
  return getActiveActions(active).filter((action) =>
    isBeholderIndividualEyeRayAction(active, action)
  );
}

function generateConcreteSpellActions(
  state: BattleState,
  active: Creature,
  economy: {
    hasMainAction: boolean;
    attackActionStarted: boolean;
    hasBonusAction: boolean;
  },
): LegalAction[] {
  const actions: LegalAction[] = [];
  const candidates = getActiveActions(active)
    .filter((action) => action.type !== 'multiattack' && action.legendaryOnly !== true)
    .filter((action) => !isBeholderIndividualEyeRayAction(active, action))
    .filter((action) => isConcreteSpellAction(action) && !isAttackRollCantripAction(action));

  for (const action of candidates) {
    if (!canUseConcreteAction(active, action, economy)) continue;
    if (!canPayForConcreteAction(active, action)) continue;

    if (action.autoDarts) {
      actions.push(...autoDartActions(state, active, action));
      continue;
    }

    if (action.savingThrow?.area) {
      actions.push(...areaActions(state, active, action));
      continue;
    }

    if (action.targetScope === 'all_allies_in_area') {
      const group = groupAllyTargets(state, active, action);
      if ((group.targetIds?.length ?? 0) > 0) actions.push(group);
      continue;
    }

    const targets = targetCandidates(state, active, action);
    for (const target of targets) {
      if (!targetMatchesAction(active, target, action)) continue;
      if (!canReachActionTarget(active, target, action)) continue;
      if (action.type === 'ranged' && target.team !== active.team && !canSee(state, active, target)) continue;
      if (!isWorthTargeting(target, action)) continue;
      actions.push(spellActionForTarget(action, target));
    }
  }

  return dedupeActions(actions);
}

function isConcreteSpellAction(action: MonsterAction): boolean {
  return action.spellLevel !== undefined ||
    action.resourceCost !== undefined ||
    action.savingThrow !== undefined ||
    action.heal !== undefined ||
    action.temporaryHp !== undefined ||
    action.buff !== undefined ||
    action.autoDarts !== undefined ||
    action.powerWord !== undefined;
}

function isAttackRollCantripAction(action: MonsterAction): boolean {
  return action.attackBonus !== undefined && action.spellLevel === 0;
}

function canUseConcreteAction(
  active: Creature,
  action: MonsterAction,
  economy: {
    hasMainAction: boolean;
    attackActionStarted: boolean;
    hasBonusAction: boolean;
  },
): boolean {
  if (action.isBonusAction) {
    if (!economy.hasBonusAction) return false;
    if (active.turnFlags?.bonusActionSpellCast && (action.spellLevel ?? 0) > 0) return false;
    return true;
  }
  if (economy.attackActionStarted) return false;
  if (!economy.hasMainAction) return false;
  if (active.turnFlags?.bonusActionSpellCast && (action.spellLevel ?? 0) > 0) return false;
  return true;
}

function canPayForConcreteAction(active: Creature, action: MonsterAction): boolean {
  if (action.resourceCost && !hasResource(active, action.resourceCost.key, action.resourceCost.amount)) {
    return false;
  }
  if (action.atWill || action.resourceCost) return true;
  const level = action.spellLevel ?? 0;
  if (level <= 0) return true;
  for (let slot = level; slot <= 9; slot += 1) {
    if (hasResource(active, `slot-${slot}`)) return true;
  }
  return false;
}

function autoDartActions(state: BattleState, active: Creature, action: MonsterAction): LegalAction[] {
  const dartCount = Math.max(1, action.autoDarts ?? 1);
  const targets = targetCandidates(state, active, action)
    .filter((target) => target.team !== active.team && canReachActionTarget(active, target, action))
    .sort((left, right) =>
      left.currentHp - right.currentHp ||
      left.displayName.localeCompare(right.displayName) ||
      left.id.localeCompare(right.id)
    )
    .slice(0, 6);

  return autoDartTargetDistributions(targets, dartCount)
    .slice(0, 32)
    .map((targetList) => {
      const targetIds = targetList.map((target) => target.id);
      const targetNames = targetList.map((target) => target.displayName);
      const primary = targetList[0];
      const singleTarget = targetIds.every((targetId) => targetId === primary.id);
      return {
        id: singleTarget ? spellActionId(action.name, primary.id, undefined) : autoDartActionId(action.name, targetIds),
        type: 'spell' as const,
        actionName: action.name,
        effectKind: 'auto_darts' as const,
        targetId: primary.id,
        targetName: primary.displayName,
        targetIds,
        targetNames,
        expectedDamage: averageDamage(action.autoDartDamage ?? '1d4+1') * targetIds.length,
        isBonusAction: action.isBonusAction,
        spellLevel: action.spellLevel,
        resourceCost: action.resourceCost,
      };
    });
}

function autoDartTargetDistributions(targets: Creature[], dartCount: number): Creature[][] {
  const results: Creature[][] = [];
  const counts = Array.from({ length: targets.length }, () => 0);
  const visit = (targetIndex: number, remaining: number) => {
    if (targetIndex === targets.length - 1) {
      counts[targetIndex] = remaining;
      results.push(expandDartTargets(targets, counts));
      counts[targetIndex] = 0;
      return;
    }
    for (let count = remaining; count >= 0; count -= 1) {
      counts[targetIndex] = count;
      visit(targetIndex + 1, remaining - count);
    }
    counts[targetIndex] = 0;
  };
  if (targets.length > 0) visit(0, dartCount);
  return results
    .filter((targetList) => targetList.length === dartCount)
    .sort((left, right) =>
      distinctCreatureCount(left) - distinctCreatureCount(right) ||
      targetListSortKey(left).localeCompare(targetListSortKey(right))
    );
}

function expandDartTargets(targets: Creature[], counts: number[]): Creature[] {
  const expanded: Creature[] = [];
  for (let index = 0; index < targets.length; index += 1) {
    for (let count = 0; count < counts[index]; count += 1) {
      expanded.push(targets[index]);
    }
  }
  return expanded;
}

function distinctCreatureCount(targets: Creature[]): number {
  return new Set(targets.map((target) => target.id)).size;
}

function targetListSortKey(targets: Creature[]): string {
  return targets.map((target) => target.id).join(',');
}

function areaActions(state: BattleState, active: Creature, action: MonsterAction): LegalAction[] {
  const area = action.savingThrow?.area?.toLowerCase() ?? '';
  if (isPointOriginArea(area, action)) {
    return pointAreaActions(state, active, action);
  }
  if (area.includes('cone') || area.includes('line')) {
    return directionalAreaActions(state, active, action, area);
  }
  const targets = getAoETargets(state, active, action);
  const targetIds = targets.map((target) => target.id);
  if (targetIds.length === 0) return [];
  const enemyHitCount = targets.filter((target) => target.team !== active.team).length;
  if (enemyHitCount === 0 && action.targetScope !== 'all_allies_in_area') return [];
  return [spellActionForArea(action, targets, undefined)];
}

function directionalAreaActions(
  state: BattleState,
  active: Creature,
  action: MonsterAction,
  area: string,
): LegalAction[] {
  const range = parseAreaFeet(action.savingThrow?.area) ?? 30;
  const checker = area.includes('cone') ? isInCone : isInLine;
  const alive = state.creatures.filter((creature) => creature.isAlive && creature.id !== active.id);
  const enemies = alive.filter((creature) => creature.team !== active.team && !creature.dying);
  const seenDirections = new Set<string>();

  return enemies
    .map((enemy) => ({ ...enemy.position }))
    .filter((direction) => {
      const key = `${direction.x},${direction.y}`;
      if (seenDirections.has(key)) return false;
      seenDirections.add(key);
      return true;
    })
    .map((direction) => {
      const targets = alive.filter((creature) => checker(active.position, direction, creature.position, range));
      const enemyHitCount = targets.filter((target) => target.team !== active.team).length;
      const allyHitCount = targets.filter((target) => target.team === active.team).length;
      return { direction, targets, enemyHitCount, allyHitCount };
    })
    .filter(({ enemyHitCount }) => enemyHitCount > 0)
    .sort((left, right) =>
      right.enemyHitCount - left.enemyHitCount ||
      left.allyHitCount - right.allyHitCount ||
      left.direction.x - right.direction.x ||
      left.direction.y - right.direction.y
    )
    .slice(0, 8)
    .map(({ direction, targets }) => spellActionForArea(action, targets, undefined, direction));
}

function pointAreaActions(state: BattleState, active: Creature, action: MonsterAction): LegalAction[] {
  const radius = parseAreaFeet(action.savingThrow?.area) ?? 20;
  const enginePick = pickRangedSphereCenter(state, active, action, radius);
  const centers = new Map<string, { x: number; y: number }>();
  centers.set(`${enginePick.center.x},${enginePick.center.y}`, enginePick.center);
  const enemies = state.creatures.filter((creature) => creature.team !== active.team && creature.isAlive && !creature.dying);
  for (const enemy of enemies) {
    if (!canReachCenter(active, enemy.position, action)) continue;
    centers.set(`${enemy.position.x},${enemy.position.y}`, { ...enemy.position });
  }
  for (let i = 0; i < enemies.length; i += 1) {
    for (let j = i + 1; j < enemies.length; j += 1) {
      const center = {
        x: Math.round((enemies[i].position.x + enemies[j].position.x) / 2),
        y: Math.round((enemies[i].position.y + enemies[j].position.y) / 2),
      };
      if (!canReachCenter(active, center, action)) continue;
      centers.set(`${center.x},${center.y}`, center);
    }
  }

  return [...centers.values()]
    .map((center) => {
      const targets = creaturesInPointArea(state, active, center, radius);
      const enemyHitCount = targets.filter((target) => target.team !== active.team).length;
      return { center, targets, enemyHitCount };
    })
    .filter(({ targets, enemyHitCount }) => targets.length > 0 && enemyHitCount > 0)
    .sort((left, right) =>
      right.enemyHitCount - left.enemyHitCount ||
      left.center.x - right.center.x ||
      left.center.y - right.center.y
    )
    .slice(0, 8)
    .map(({ center, targets }) => spellActionForArea(action, targets, center));
}

function groupAllyTargets(state: BattleState, active: Creature, action: MonsterAction): Extract<LegalAction, { type: 'spell' }> {
  const range = action.range?.normal ?? 30;
  const targets = state.creatures
    .filter((creature) => creature.team === active.team && creature.isAlive && creatureDistance(active, creature) <= range)
    .filter((creature) => isWorthTargeting(creature, action))
    .slice(0, 6);
  return {
    id: spellActionId(action.name, undefined, undefined),
    type: 'spell',
    actionName: action.name,
    effectKind: action.heal || action.temporaryHp || action.powerWord?.kind === 'heal' ? 'heal' : 'buff',
    targetId: targets[0]?.id,
    targetName: targets[0]?.displayName,
    targetIds: targets.map((target) => target.id),
    targetNames: targets.map((target) => target.displayName),
    expectedHealing: action.heal ? estimateHealing(action) * targets.length : undefined,
    isBonusAction: action.isBonusAction,
    spellLevel: action.spellLevel,
    resourceCost: action.resourceCost,
  };
}

function spellActionForTarget(action: MonsterAction, target: Creature): Extract<LegalAction, { type: 'spell' }> {
  return {
    id: spellActionId(action.name, target.id, undefined),
    type: 'spell',
    actionName: action.name,
    effectKind: effectKindForAction(action),
    targetId: target.id,
    targetName: target.displayName,
    targetIds: [target.id],
    targetNames: [target.displayName],
    expectedDamage: estimateBattlecastActionDamage(action, target),
    expectedHealing: action.heal || action.temporaryHp || action.powerWord?.kind === 'heal' ? estimateHealing(action) : undefined,
    isBonusAction: action.isBonusAction,
    spellLevel: action.spellLevel,
    resourceCost: action.resourceCost,
  };
}

function spellActionForArea(
  action: MonsterAction,
  targets: Creature[],
  center: { x: number; y: number } | undefined,
  direction?: { x: number; y: number },
): Extract<LegalAction, { type: 'spell' }> {
  return {
    id: direction ? directionalSpellActionId(action.name, direction) : spellActionId(action.name, undefined, center),
    type: 'spell',
    actionName: action.name,
    effectKind: 'aoe',
    targetId: targets[0]?.id,
    targetName: targets[0]?.displayName,
    targetIds: targets.map((target) => target.id),
    targetNames: targets.map((target) => target.displayName),
    center,
    direction,
    expectedDamage: estimateActionDamage(action),
    isBonusAction: action.isBonusAction,
    spellLevel: action.spellLevel,
    resourceCost: action.resourceCost,
  };
}

function targetCandidates(state: BattleState, active: Creature, action: MonsterAction): Creature[] {
  const alive = state.creatures.filter((creature) => creature.isAlive);
  switch (action.targetScope) {
    case 'self':
      return [active];
    case 'one_ally':
      return alive.filter((creature) => creature.team === active.team);
    case 'any_one':
      return alive.filter((creature) => creature.id === active.id || !creature.dying);
    case 'area_enemies':
    case 'one_enemy':
    case undefined:
      return alive.filter((creature) => creature.team !== active.team && !creature.dying);
    case 'all_allies_in_area':
      return alive.filter((creature) => creature.team === active.team);
  }
}

function targetMatchesAction(active: Creature, target: Creature, action: MonsterAction): boolean {
  if (action.targetTypeRestriction) {
    const restriction = action.targetTypeRestriction.toLowerCase();
    if (!target.monsterData.type.toLowerCase().includes(restriction)) return false;
  }
  if (action.targetScope === 'self') return target.id === active.id;
  if (action.targetScope === 'one_ally') return target.team === active.team;
  if (action.targetScope === 'any_one') return true;
  if (action.heal || action.temporaryHp || action.powerWord?.kind === 'heal') return target.team === active.team;
  if (action.buff && action.targetScope !== 'one_enemy') return target.team === active.team;
  return target.team !== active.team;
}

function canReachActionTarget(active: Creature, target: Creature, action: MonsterAction): boolean {
  const distance = creatureDistance(active, target);
  if (action.type === 'melee' && action.spellLevel === undefined && action.resourceCost === undefined) {
    return distance <= (action.reach ?? 5);
  }
  const range = action.range?.long ?? action.range?.normal;
  if (range !== undefined) return distance <= range;
  if (action.targetScope === 'self') return target.id === active.id;
  if (action.heal || action.buff || action.temporaryHp) return distance <= (action.reach ?? 5);
  return distance <= (action.reach ?? 5);
}

function isWorthTargeting(target: Creature, action: MonsterAction): boolean {
  if (action.heal || action.powerWord?.kind === 'heal') {
    return target.currentHp < target.maxHp || target.dying || target.conditions.includes('unconscious');
  }
  if (action.name === "Nature's Veil") return !target.conditions.includes('invisible');
  if (action.temporaryHp) return (target.temporaryHp ?? 0) < estimateHealing(action);
  if (action.buff) return !target.activeBuffs.some((buff) => buff.key === action.buff?.key);
  if (action.savingThrow?.conditionOnFail) {
    return !target.conditions.includes(action.savingThrow.conditionOnFail);
  }
  return true;
}

function effectKindForAction(action: MonsterAction): Extract<LegalAction, { type: 'spell' }>['effectKind'] {
  if (action.autoDarts) return 'auto_darts';
  if (action.savingThrow?.area) return 'aoe';
  if (action.savingThrow) return 'save';
  if (action.heal || action.temporaryHp || action.powerWord?.kind === 'heal') return 'heal';
  if (action.buff) return 'buff';
  if (action.attackBonus !== undefined) return 'attack';
  return 'special';
}

function isPointOriginArea(area: string, action: MonsterAction): boolean {
  if (!action.range) return false;
  return area.includes('radius') || area.includes('sphere') || area.includes('cylinder');
}

function creaturesInPointArea(
  state: BattleState,
  active: Creature,
  center: { x: number; y: number },
  radiusFt: number,
): Creature[] {
  return state.creatures.filter((creature) => {
    if (!creature.isAlive || creature.id === active.id) return false;
    const dx = Math.abs(creature.position.x - center.x);
    const dy = Math.abs(creature.position.y - center.y);
    return Math.max(dx, dy) * 5 <= radiusFt;
  });
}

function canReachCenter(active: Creature, center: { x: number; y: number }, action: MonsterAction): boolean {
  const range = action.range?.normal ?? action.range?.long ?? 9999;
  const dx = Math.abs(active.position.x - center.x);
  const dy = Math.abs(active.position.y - center.y);
  return Math.max(dx, dy) * 5 <= range;
}

function parseAreaFeet(area: string | undefined): number | undefined {
  const match = area?.match(/(\d+)[\s-]?foot/i);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

function estimateHealing(action: MonsterAction): number {
  if (action.powerWord?.kind === 'heal') return 120;
  if (action.heal) return averageDice(action.heal.dice);
  if (action.temporaryHp) return averageDice(action.temporaryHp.dice);
  return 0;
}

function dedupeActions(actions: LegalAction[]): LegalAction[] {
  const seen = new Set<string>();
  const deduped: LegalAction[] = [];
  for (const action of actions) {
    if (seen.has(action.id)) continue;
    seen.add(action.id);
    deduped.push(action);
  }
  return deduped;
}

function estimateActionDamage(action: MonsterAction): number {
  const base = averageDice(action.damage);
  const rider = action.additionalDamage?.split(' ')[0];
  return base + averageDice(rider);
}

function averageDice(expression: string | undefined): number {
  if (!expression) return 0;
  const cleaned = expression.replace(/\s/g, '');
  const parts = cleaned.match(/[+-]?[^+-]+/g) ?? [];
  return parts.reduce((total, part) => {
    const sign = part.startsWith('-') ? -1 : 1;
    const unsigned = part.replace(/^[+-]/, '');
    if (unsigned.includes('d')) {
      const [countText, sidesText] = unsigned.split('d');
      const count = Number.parseInt(countText, 10) || 1;
      const sides = Number.parseInt(sidesText, 10);
      return Number.isFinite(sides) ? total + sign * count * ((sides + 1) / 2) : total;
    }
    const value = Number.parseInt(unsigned, 10);
    return Number.isFinite(value) ? total + sign * value : total;
  }, 0);
}

function countWordToNumber(value: string | undefined): number {
  if (value === 'five' || value === '5') return 5;
  if (value === 'four' || value === '4') return 4;
  if (value === 'three' || value === '3') return 3;
  return 2;
}

function slugActionName(actionName: string): string {
  return actionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
