import {
  TACTIC_LABELS,
  getActiveSize,
  getActiveSpeed,
  type BattleState,
} from './battlecast/engine/combat.js';
import { abilityModifier, averageDamage } from './battlecast/engine/dice.js';
import { getActiveActions } from './battlecast/engine/ai-targeting.js';
import type {
  ActiveBuff,
  Abilities,
  BuffTemplate,
  Creature,
  MonsterAction,
  MonsterTrait,
  RuntimeActionEffect,
  RuntimeContainerState,
  RuntimeOngoingEffect,
  RuntimeTraitEffect,
  Speed,
} from './battlecast/types/monster.js';
import type { ActualActionEconomySnapshot, LegalActionCatalogue, LegalAction, LegalActionSpace } from './legal-actions.js';

type AbilityKey = keyof Abilities;

export interface LlmAbilityView {
  score: number;
  modifier: number;
}

export interface LlmDefenseView {
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  nonmagicalResistances: string[];
  nonmagicalImmunities: string[];
  conditionImmunities: string[];
}

export interface LlmConditionTimerView {
  condition: string;
  duration: string;
  appliedRound: number;
  sourceId: string;
  sourceLabel?: string;
  saveDC?: number;
  saveAbility?: AbilityKey;
  stage?: {
    stages: string[];
    currentIndex: number;
    finalDuration?: string;
  };
}

export interface LlmBuffView {
  name: string;
  key: string;
  casterId: string;
  casterLabel?: string;
  appliedRound: number;
  endRound: number | 'infinite';
  requiresConcentration?: boolean;
  attackBonusDice?: string;
  attackBonus?: number;
  saveBonusDice?: string;
  acBonus?: number;
  damageRider?: string;
  reactiveDamage?: string;
  resistPhysical?: boolean;
  resistDamageTypes?: string[];
  resistAllDamageExcept?: string[];
  rageDamageBonus?: number;
  speedPenalty?: number;
  attackDisadvantage?: boolean;
  saveDisadvantage?: boolean;
  preventsOpportunityAttacks?: boolean;
  advantageForAttackerId?: string;
  advantageForAllAttackers?: boolean;
  spellAttackAdvantage?: boolean;
  spellSaveDcBonus?: number;
}

export interface LlmActionProfileView {
  name: string;
  type: MonsterAction['type'];
  attackBonus?: number;
  damage?: string;
  averageDamage?: number;
  damageType?: string;
  additionalDamage?: string;
  reach?: number;
  range?: MonsterAction['range'];
  savingThrow?: MonsterAction['savingThrow'];
  conditionOnHit?: MonsterAction['conditionOnHit'];
  recharge?: string;
  rechargeReady?: boolean;
  isBonusAction?: boolean;
  magical?: boolean;
  weaponMastery?: MonsterAction['weaponMastery'];
  loading?: boolean;
  spellLevel?: number;
  spellSchool?: MonsterAction['spellSchool'];
  atWill?: boolean;
  concentration?: boolean;
  durationRounds?: number;
  targetScope?: MonsterAction['targetScope'];
  targetTypeRestriction?: string;
  resourceCost?: MonsterAction['resourceCost'];
  resourceAvailable?: number;
  heal?: MonsterAction['heal'];
  temporaryHp?: MonsterAction['temporaryHp'];
  buff?: LlmBuffTemplateView;
  buffOnHit?: LlmBuffTemplateView;
  buffOnFailedSave?: LlmBuffTemplateView;
  smiteOnHit?: MonsterAction['smiteOnHit'];
  autoDarts?: number;
  autoDartDamage?: string;
  autoDartDamageType?: string;
  effects?: Array<LlmActionEffectView | LlmTraitEffectView>;
  mechanicsStatus?: string;
}

export interface LlmBuffTemplateView {
  name: string;
  key: string;
  requiresConcentration?: boolean;
  attackBonus?: number;
  attackBonusDice?: string;
  saveBonusDice?: string;
  acBonus?: number;
  damageRider?: string;
  resistPhysical?: boolean;
  resistDamageTypes?: string[];
  resistAllDamageExcept?: string[];
  rageDamageBonus?: number;
  reactiveDamage?: string;
  preventDeath?: boolean;
  attackDisadvantage?: boolean;
  saveDisadvantage?: boolean;
  speedPenalty?: number;
  spellAttackAdvantage?: boolean;
  spellSaveDcBonus?: number;
}

export interface LlmActionEffectView {
  kind: RuntimeActionEffect['kind'];
  summary: Record<string, unknown>;
}

export interface LlmTraitEffectView {
  kind: RuntimeTraitEffect['kind'];
  summary: Record<string, unknown>;
}

export interface LlmTraitView {
  name: string;
  effects?: LlmTraitEffectView[];
  mechanicsStatus?: string;
}

export interface LlmRuntimeView {
  hasActed: boolean;
  hasMovedThisTurn: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
  airborne: boolean;
  recharges: Record<string, boolean>;
  activeBuffs: LlmBuffView[];
  conditionTimers: LlmConditionTimerView[];
  concentratingOn?: string;
  concentrationAura?: Creature['concentrationAura'];
  wildShape?: {
    beastName: string;
    tempHp: number;
    maxTempHp: number;
    formHp: number;
    ac: number;
    speed: Speed;
    actions: LlmActionProfileView[];
  };
  deathSaves?: Creature['deathSaves'];
  ongoingEffects?: LlmOngoingEffectView[];
  containedBy?: LlmContainerView;
  swallowedBy?: Creature['swallowedBy'];
  abilityScoreDamage?: Creature['abilityScoreDamage'];
  hpMaxReduction?: number;
}

export interface LlmOngoingEffectView {
  key: string;
  sourceId: string;
  sourceLabel?: string;
  condition?: string;
  damage?: string;
  damageType?: string;
  tick: RuntimeOngoingEffect['tick'];
  noHealing?: boolean;
  saveEnds?: RuntimeOngoingEffect['saveEnds'];
  appliedRound: number;
  expiresRound?: number;
}

export interface LlmContainerView {
  key: string;
  sourceId: string;
  sourceLabel?: string;
  conditions: string[];
  sourceTurnDamage?: string;
  sourceTurnDamageType?: string;
  targetTurnDamage?: string;
  targetTurnDamageType?: string;
  totalCover?: boolean;
  movesWithSource?: boolean;
  escapeDc?: number;
}

export interface LlmTacticView {
  id: string;
  label: string;
  targetPriority: string;
  movement: string;
  retreat: string;
  spellAndSpecialPriority: string;
}

export interface LlmCreatureView {
  id: string;
  name: string;
  team: 'red' | 'blue';
  relation: 'self' | 'ally' | 'enemy';
  hp: number;
  maxHp: number;
  temporaryHp: number;
  ac: number;
  size: string;
  creatureType: string;
  position: { x: number; y: number };
  speed: Speed;
  speedRemaining: number;
  initiative: number;
  alive: boolean;
  dying: boolean;
  conditions: string[];
  conditionImmunities: string[];
  abilities: Record<AbilityKey, LlmAbilityView>;
  saves: Partial<Record<AbilityKey, number>>;
  defenses: LlmDefenseView;
  resources: Record<string, number>;
  role?: string;
  heroClass?: string;
  heroLevel?: number;
  proficiencyBonus: number;
  senses: string;
  traits: LlmTraitView[];
  actions: LlmActionProfileView[];
  runtime: LlmRuntimeView;
  label: string;
}

export interface LlmActionView {
  id: string;
  type: LegalAction['type'];
  label: string;
  targetId?: string;
  targetName?: string;
  targetLabel?: string;
  targetRelation?: LlmCreatureView['relation'];
  targetTeam?: LlmCreatureView['team'];
  targetIds?: string[];
  targetNames?: string[];
  destination?: { x: number; y: number };
  distanceFt?: number;
  center?: { x: number; y: number };
  direction?: { x: number; y: number };
  effectKind?: Extract<LegalAction, { type: 'spell' }>['effectKind'];
  feature?: Extract<LegalAction, { type: 'class_feature' }>['feature'];
  expectedDamage?: number;
  expectedHealing?: number;
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
  extraMovement?: number;
  isBonusAction?: boolean;
  possibleEffects?: string[];
  smite?: Extract<LegalAction, { type: 'smite' }>['smite'];
  reaction?: Extract<LegalAction, { type: 'reaction' }>['reaction'];
  reactionFeature?: Extract<LegalAction, { type: 'reaction' }>['reactionFeature'];
  reactionTrigger?: Extract<LegalAction, { type: 'reaction' }>['reactionTrigger'];
  isCritical?: boolean;
  spellLevel?: number;
  resourceCost?: { key: string; amount: number };
  setupAction?: boolean;
  beastName?: string;
  beastCr?: string;
  beastAc?: number;
  beastTempHp?: number;
  beastSpeed?: number;
  beastActions?: string[];
  tactic?: string;
  fullTurnDelegate?: boolean;
  description?: string;
}

export interface LlmGridView {
  size?: number;
  movementBlocked: string[];
  sightBlocked: string[];
}

export interface LlmBattleObservation {
  schemaVersion: 'd20bench.llm_observation.v2';
  objective: string;
  actionSpace: LegalActionSpace;
  round: number;
  turnIndex: number;
  actionEconomy?: ActualActionEconomySnapshot;
  teamTactics: BattleState['teamTactics'];
  activeCreatureId: string;
  activeCreatureName: string;
  activeTeam: 'red' | 'blue';
  activeCreature: LlmCreatureView;
  creatures: LlmCreatureView[];
  tacticReference: LlmTacticView[];
  grid: LlmGridView;
  legalActions: LlmActionView[];
  recentLogs: string[];
}

export function buildLlmBattleObservation(
  state: BattleState,
  activeCreature: Creature,
  catalogue: LegalActionCatalogue,
): LlmBattleObservation {
  const creatures = state.creatures
    .map((creature) => creatureView(state, creature, activeCreature))
    .sort((left, right) =>
      relationOrder(left.relation) - relationOrder(right.relation) ||
      left.team.localeCompare(right.team) ||
      left.name.localeCompare(right.name) ||
      left.id.localeCompare(right.id)
    );
  const creatureById = new Map(creatures.map((creature) => [creature.id, creature]));
  const actionSpace = catalogue.actionSpace ?? (
    catalogue.actions.some((action) => action.type === 'battlecast_tactic')
      ? 'battlecast-full-turn'
      : catalogue.actions.some((action) => action.type === 'spell')
        ? 'actual-actions-v1'
        : 'primitive'
  );
  const activeCreatureView = creatureById.get(activeCreature.id) ?? creatureView(state, activeCreature, activeCreature);

  return {
    schemaVersion: 'd20bench.llm_observation.v2',
    objective: objectiveForActionSpace(actionSpace),
    actionSpace,
    round: state.round,
    turnIndex: state.turnIndex,
    actionEconomy: catalogue.actionEconomy,
    teamTactics: state.teamTactics,
    activeCreatureId: activeCreature.id,
    activeCreatureName: activeCreature.displayName,
    activeTeam: activeCreature.team,
    activeCreature: activeCreatureView,
    creatures,
    tacticReference: actionSpace === 'battlecast-full-turn' ? tacticReference() : [],
    grid: {
      size: state.gridSize,
      movementBlocked: sortedCells(state.terrainBlocked),
      sightBlocked: sortedCells(state.terrainSightBlocked),
    },
    legalActions: catalogue.actions.map((action) => actionView(action, creatureById)),
    recentLogs: state.logs.slice(-8).map((log) =>
      `R${log.round} T${log.turn} ${log.actor} ${log.action}: ${log.details}`
    ),
  };
}

function creatureView(state: BattleState, creature: Creature, activeCreature: Creature): LlmCreatureView {
  const relation = creature.id === activeCreature.id
    ? 'self'
    : creature.team === activeCreature.team ? 'ally' : 'enemy';
  const data = creature.monsterData;
  const activeActions = getActiveActions(creature)
    .filter((action) => action.legendaryOnly !== true)
    .map((action) => actionProfileView(creature, action));
  return {
    id: creature.id,
    name: creature.displayName,
    team: creature.team,
    relation,
    hp: creature.currentHp,
    maxHp: creature.maxHp,
    temporaryHp: creature.temporaryHp ?? 0,
    ac: creature.wildShape?.ac ?? data.ac,
    size: getActiveSize(creature),
    creatureType: data.type,
    position: creature.position,
    speed: getActiveSpeed(creature),
    speedRemaining: creature.movementRemaining,
    initiative: creature.initiative,
    alive: creature.isAlive,
    dying: creature.dying ?? false,
    conditions: [...creature.conditions].sort(),
    conditionImmunities: sortedStrings(data.conditionImmunities),
    abilities: abilityView(creature),
    saves: sortNumberRecord(creature.wildShape?.saves ?? data.saves),
    defenses: defenseView(data),
    resources: Object.fromEntries(
      Object.entries(creature.resources ?? {})
        .filter(([, value]) => typeof value === 'number')
        .sort(([left], [right]) => left.localeCompare(right))
    ),
    role: data.heroClass ?? data.type,
    heroClass: data.heroClass,
    heroLevel: data.heroLevel,
    proficiencyBonus: data.proficiencyBonus,
    senses: data.senses,
    traits: traitViews(creature.wildShape?.traits ?? data.traits),
    actions: activeActions,
    runtime: runtimeView(state, creature),
    label: `${relation === 'self' ? 'self' : relation} ${creature.displayName} (${creature.team})`,
  };
}

function actionView(action: LegalAction, creatureById: Map<string, LlmCreatureView>): LlmActionView {
  if (action.type === 'attack') {
    const target = creatureById.get(action.targetId);
    return {
      id: action.id,
      type: action.type,
      label: `${action.actionName} against ${target?.label ?? action.targetName}`,
      targetId: action.targetId,
      targetName: action.targetName,
      targetLabel: target?.label,
      targetRelation: target?.relation,
      targetTeam: target?.team,
      expectedDamage: Number(action.expectedDamage.toFixed(2)),
    };
  }

  if (action.type === 'move_toward') {
    const target = creatureById.get(action.targetId);
    return {
      id: action.id,
      type: action.type,
      label: `Move toward ${target?.label ?? action.targetName}`,
      targetId: action.targetId,
      targetName: action.targetName,
      targetLabel: target?.label,
      targetRelation: target?.relation,
      targetTeam: target?.team,
    };
  }

  if (action.type === 'move_to') {
    return {
      id: action.id,
      type: action.type,
      label: `Move to (${action.destination.x},${action.destination.y})`,
      destination: action.destination,
      distanceFt: action.distanceFt,
    };
  }

  if (action.type === 'dodge') {
    return {
      id: action.id,
      type: action.type,
      label: 'Dodge',
      description: 'Spend the main action to impose Disadvantage on attack rolls against this creature until its next turn.',
    };
  }

  if (action.type === 'help') {
    const target = creatureById.get(action.targetId);
    return {
      id: action.id,
      type: action.type,
      label: `Help against ${target?.label ?? action.targetName}`,
      targetId: action.targetId,
      targetName: action.targetName,
      targetLabel: target?.label,
      targetRelation: target?.relation,
      targetTeam: target?.team,
      description: 'Spend the main action to give the next attack roll against this adjacent target Advantage before this creature next acts.',
    };
  }

  if (action.type === 'stabilise') {
    const target = creatureById.get(action.targetId);
    return {
      id: action.id,
      type: action.type,
      label: `Stabilise ${target?.label ?? action.targetName}`,
      targetId: action.targetId,
      targetName: action.targetName,
      targetLabel: target?.label,
      targetRelation: target?.relation,
      targetTeam: target?.team,
      description: 'Spend the main action to stabilise this adjacent dying hero ally at 0 HP. The ally remains unconscious but stops making death saves.',
    };
  }

  if (action.type === 'smite') {
    const target = creatureById.get(action.targetId);
    return {
      id: action.id,
      type: action.type,
      label: action.smite === 'decline'
        ? `Decline Divine Smite against ${target?.label ?? action.targetName}`
        : `Divine Smite against ${target?.label ?? action.targetName}${action.slotLevel ? ` (slot ${action.slotLevel})` : ''}`,
      targetId: action.targetId,
      targetName: action.targetName,
      targetLabel: target?.label,
      targetRelation: target?.relation,
      targetTeam: target?.team,
      smite: action.smite,
      expectedDamage: action.expectedDamage === undefined ? undefined : Number(action.expectedDamage.toFixed(2)),
      resourceCost: action.resourceCost,
      isCritical: action.isCritical,
      description: action.smite === 'decline'
        ? 'Resolve the hit without spending a Divine Smite resource, then continue the turn if action economy remains.'
        : 'Spend the listed resource now to add Divine Smite radiant damage to the hit that just landed.',
    };
  }

  if (action.type === 'reaction') {
    const target = creatureById.get(action.targetId);
    const isInterruptReaction = action.reactionTrigger === 'attack_damage' ||
      action.reactionTrigger === 'attack_roll' ||
      action.reactionTrigger === 'damage_roll';
    return {
      id: action.id,
      type: action.type,
      label: reactionActionLabel(action, target?.label ?? action.targetName),
      targetId: action.targetId,
      targetName: action.targetName,
      targetLabel: target?.label,
      targetRelation: target?.relation,
      targetTeam: target?.team,
      reaction: action.reaction,
      reactionFeature: action.reactionFeature,
      reactionTrigger: action.reactionTrigger,
      expectedDamage: action.expectedDamage === undefined ? undefined : Number(action.expectedDamage.toFixed(2)),
      incomingDamage: action.incomingDamage,
      damageType: action.damageType,
      attackRollTotal: action.attackRollTotal,
      targetAc: action.targetAc,
      maxRollReduction: action.maxRollReduction,
      expectedRollReduction: action.expectedRollReduction === undefined ? undefined : Number(action.expectedRollReduction.toFixed(2)),
      actualRollReduction: action.actualRollReduction,
      preventedHit: action.preventedHit,
      expectedDamageReduction: action.expectedDamageReduction,
      actualDamageReduction: action.actualDamageReduction,
      resourceCost: action.resourceCost,
      description: isInterruptReaction
        ? damageReactionDescription(action)
        : action.reaction === 'decline'
          ? 'Do not spend this reaction on the opportunity attack trigger.'
          : 'Spend the reaction now to make the listed melee opportunity attack against the creature leaving reach.',
    };
  }

  if (action.type === 'random_ray') {
    const target = creatureById.get(action.targetId);
    return {
      id: action.id,
      type: action.type,
      label: `${action.actionName} against ${target?.label ?? action.targetName} (random effect)`,
      targetId: action.targetId,
      targetName: action.targetName,
      targetLabel: target?.label,
      targetRelation: target?.relation,
      targetTeam: target?.team,
      possibleEffects: action.possibleEffects,
      expectedDamage: action.expectedDamage === undefined ? undefined : Number(action.expectedDamage.toFixed(2)),
      description: 'Choose the target for one random eye ray. The rules engine randomly selects and resolves one of the listed possible effects, then the next action is chosen from a refreshed state.',
    };
  }

  if (action.type === 'spell') {
    const target = action.targetId ? creatureById.get(action.targetId) : undefined;
    const targetLabels = action.targetIds?.map((targetId) => creatureById.get(targetId)?.label ?? targetId);
    return {
      id: action.id,
      type: action.type,
      label: spellActionLabel(action, targetLabels),
      targetId: action.targetId,
      targetName: action.targetName,
      targetLabel: target?.label,
      targetRelation: target?.relation,
      targetTeam: target?.team,
      targetIds: action.targetIds,
      targetNames: action.targetNames,
      center: action.center,
      direction: action.direction,
      effectKind: action.effectKind,
      expectedDamage: action.expectedDamage === undefined ? undefined : Number(action.expectedDamage.toFixed(2)),
      expectedHealing: action.expectedHealing === undefined ? undefined : Number(action.expectedHealing.toFixed(2)),
      isBonusAction: action.isBonusAction,
      spellLevel: action.spellLevel,
      resourceCost: action.resourceCost,
    };
  }

  if (action.type === 'dash') {
    return {
      id: action.id,
      type: action.type,
      label: `Dash for ${action.extraMovement} ft of extra movement`,
      extraMovement: action.extraMovement,
      description: 'Spend the main action to add extra movement for this turn.',
    };
  }

  if (action.type === 'disengage') {
    return {
      id: action.id,
      type: action.type,
      label: action.isBonusAction ? 'Bonus action Disengage' : 'Disengage',
      isBonusAction: action.isBonusAction,
      description: action.isBonusAction
        ? 'Spend a bonus action to prevent opportunity attacks from movement this turn.'
        : 'Spend the main action to prevent opportunity attacks from movement this turn.',
    };
  }

  if (action.type === 'class_feature') {
    const target = action.targetId ? creatureById.get(action.targetId) : undefined;
    return {
      id: action.id,
      type: action.type,
      label: action.label,
      feature: action.feature,
      isBonusAction: action.isBonusAction,
      targetId: action.targetId,
      targetName: action.targetName,
      targetLabel: target?.label,
      targetRelation: target?.relation,
      targetTeam: target?.team,
      expectedDamage: action.expectedDamage === undefined ? undefined : Number(action.expectedDamage.toFixed(2)),
      resourceCost: action.resourceCost,
      setupAction: isSetupClassFeature(action),
      beastName: action.beastName,
      beastCr: action.beastCr,
      beastAc: action.beastAc,
      beastTempHp: action.beastTempHp,
      beastSpeed: action.beastSpeed,
      beastActions: action.beastActions,
      description: classFeatureDescription(action),
    };
  }

  if (action.type === 'battlecast_tactic') {
    const tactic = TACTIC_LABELS[action.tactic];
    return {
      id: action.id,
      type: action.type,
      label: `Full Battlecast turn using ${tactic.name} tactic`,
      tactic: action.tactic,
      fullTurnDelegate: true,
      description: `${tactic.description}. See tacticReference and the active creature action metadata. The copied Battlecast engine may move, cast spells, heal, buff, use AoE, attack, and spend resources for this creature.`,
    };
  }

  return {
    id: action.id,
    type: action.type,
    label: 'End turn',
  };
}

function classFeatureDescription(action: Extract<LegalAction, { type: 'class_feature' }>): string {
  if (action.feature === 'steady_aim') {
    return 'Spend a bonus action without moving to gain Advantage on the next weapon attack this turn.';
  }
  if (action.feature === 'action_surge') {
    return 'Spend one Action Surge use to regain a main action this turn. After this resolves, choose the next concrete action from a fresh legal-action list.';
  }
  if (action.feature === 'sacred_weapon') {
    return 'Spend 1 Channel Divinity to empower this Paladin weapon. Melee attack rolls gain the listed Charisma-based attack bonus, then choose the next concrete action from a fresh legal-action list.';
  }
  if (action.feature === 'superior_defense') {
    return 'Spend 3 Focus Points to gain resistance to all damage except Force for 10 rounds, then choose the next concrete action from a fresh legal-action list.';
  }
  if (action.feature === 'reckless_attack') {
    return 'Declare Reckless Attack before attacking. Melee attacks this turn have Advantage, and attacks against this creature have Advantage until its next turn.';
  }
  if (action.feature === 'brutal_strike') {
    return 'Declare Brutal Strike before attacking. The next melee hit this turn forgoes Reckless Attack advantage and adds the Battlecast-modeled Brutal Strike damage and rider.';
  }
  if (action.feature === 'quivering_palm') {
    return 'Use the main action to end the already-seeded Quivering Palm effect on this target. The target makes the copied Battlecast CON save and takes 10d12 force damage, half on success.';
  }
  if (action.feature === 'flurry_of_blows') {
    return action.resourceCost
      ? 'Spend 1 ki and the bonus action to make the first Flurry of Blows unarmed strike. Remaining Flurry strikes are chosen as later concrete actions after seeing results.'
      : 'Make a remaining Flurry of Blows unarmed strike after seeing the previous strike result.';
  }
  if (action.feature === 'wild_shape') {
    return 'Spend a Wild Shape use and the bonus action to transform into the listed beast form. The Druid keeps real HP and gains the listed temporary HP; beast AC, speed, physical abilities, traits, and actions replace the humanoid form.';
  }
  if (action.feature === 'frenzy') {
    return 'Spend the bonus action while raging to make one melee weapon attack against the selected target.';
  }
  return 'Spend the bonus action to make one Martial Arts unarmed strike after attacking.';
}

function isSetupClassFeature(action: Extract<LegalAction, { type: 'class_feature' }>): boolean {
  return action.feature === 'sacred_weapon' ||
    action.feature === 'superior_defense' ||
    action.feature === 'reckless_attack' ||
    action.feature === 'brutal_strike' ||
    action.feature === 'steady_aim';
}

function objectiveForActionSpace(actionSpace: LegalActionSpace): string {
  if (actionSpace === 'battlecast-full-turn') {
    return 'Choose exactly one legal action id for the active creature. Full-turn Battlecast delegate actions execute movement, spells, healing, buffs, AoE, and attacks through the copied Battlecast rules. Use creature actions, defenses, resources, recharges, buffs, condition timers, and tacticReference to choose the best delegate.';
  }
  if (actionSpace === 'actual-actions-v1') {
    return 'Choose exactly one concrete legal action id for the active creature. Delegates and strategy labels are not available. Legal class-feature setup actions marked setupAction resolve first and then return a fresh legal-action list before attacks. The engine applies the chosen action through Battlecast rules, shows the result in logs, and if this creature still has movement, attacks, a bonus action, a reaction trigger, or a post-hit choice remaining, you will be asked to choose the next concrete action from a fresh legal-action list.';
  }
  return 'Choose exactly one legal action id for the active creature. The engine applies the chosen action through Battlecast rules and rejects any action id not present in legalActions.';
}

function spellActionLabel(
  action: Extract<LegalAction, { type: 'spell' }>,
  targetLabels: string[] | undefined,
): string {
  const targetText = targetLabels && targetLabels.length > 1
    ? targetLabels.join(', ')
    : action.targetName ?? targetLabels?.[0];
  const centerText = action.center ? ` at (${action.center.x},${action.center.y})` : '';
  const directionText = action.direction ? ` toward (${action.direction.x},${action.direction.y})` : '';
  const targetSuffix = targetText ? ` targeting ${targetText}` : '';
  const economy = action.isBonusAction ? 'bonus action ' : '';
  return `${economy}${action.actionName}${centerText}${directionText}${targetSuffix}`;
}

function reactionActionLabel(
  action: Extract<LegalAction, { type: 'reaction' }>,
  targetLabel: string,
): string {
  if (action.reactionTrigger === 'attack_damage') {
    const name = damageReactionName(action.reactionFeature ?? action.reaction);
    if (action.reaction === 'decline') return `Decline ${name} against ${targetLabel}`;
    if ((action.reactionFeature ?? action.reaction) === 'retaliation') {
      return `Use Retaliation against ${targetLabel} with ${action.actionName}`;
    }
    return `Use ${name} against ${targetLabel}`;
  }
  if (action.reactionTrigger === 'attack_roll' || action.reactionTrigger === 'damage_roll') {
    const name = damageReactionName(action.reactionFeature ?? action.reaction);
    if (action.reaction === 'decline') return `Decline ${name} against ${targetLabel}`;
    return `Use ${name} against ${targetLabel}`;
  }
  if (action.reaction === 'decline') return `Decline opportunity attack against ${targetLabel}`;
  return `Opportunity attack ${targetLabel} with ${action.actionName}`;
}

function damageReactionName(reaction: Extract<LegalAction, { type: 'reaction' }>['reaction'] | NonNullable<Extract<LegalAction, { type: 'reaction' }>['reactionFeature']>): string {
  if (reaction === 'cutting_words_attack') return 'Cutting Words on attack roll';
  if (reaction === 'cutting_words_damage') return 'Cutting Words on damage roll';
  if (reaction === 'monk_deflect') return 'Deflect Attacks';
  if (reaction === 'superior_hunters_defense') return "Superior Hunter's Defense";
  if (reaction === 'retaliation') return 'Retaliation';
  if (reaction === 'opportunity_attack') return 'opportunity attack';
  return 'Uncanny Dodge';
}

function damageReactionDescription(action: Extract<LegalAction, { type: 'reaction' }>): string {
  const name = damageReactionName(action.reactionFeature ?? action.reaction);
  if (action.reaction === 'decline') {
    if ((action.reactionFeature ?? action.reaction) === 'cutting_words_attack') {
      return 'Do not spend Bardic Inspiration and a reaction to reduce this attack roll.';
    }
    if ((action.reactionFeature ?? action.reaction) === 'cutting_words_damage') {
      return 'Do not spend Bardic Inspiration and a reaction to reduce this damage roll.';
    }
    if ((action.reactionFeature ?? action.reaction) === 'retaliation') {
      return 'Do not spend this reaction on the Retaliation trigger from this adjacent attacker.';
    }
    return `Do not spend this reaction on this ${name} attack-damage mitigation trigger from this attacker.`;
  }
  if ((action.reactionFeature ?? action.reaction) === 'cutting_words_attack') {
    return 'Spend Bardic Inspiration and a reaction now to roll the Bardic Inspiration die and subtract it from the triggering attack roll before hit resolution.';
  }
  if ((action.reactionFeature ?? action.reaction) === 'cutting_words_damage') {
    return 'Spend Bardic Inspiration and a reaction now to roll the Bardic Inspiration die and subtract it from the triggering damage roll.';
  }
  if ((action.reactionFeature ?? action.reaction) === 'retaliation') {
    return 'Spend the reaction to make the listed melee Retaliation attack against the adjacent creature that damaged this Barbarian.';
  }
  if ((action.reactionFeature ?? action.reaction) === 'monk_deflect') {
    return 'Spend the reaction to reduce the incoming attack damage with Deflect Attacks or Deflect Energy. Battlecast redirect behavior is applied if the blow is fully deflected.';
  }
  if ((action.reactionFeature ?? action.reaction) === 'superior_hunters_defense') {
    return "Spend the reaction to gain resistance to this damage type for this damage and the rest of the current turn.";
  }
  return 'Spend the reaction on this eligible attack damage from this attacker to halve the damage with Uncanny Dodge.';
}

function abilityView(creature: Creature): Record<AbilityKey, LlmAbilityView> {
  const base = creature.monsterData.abilities;
  const physical = creature.wildShape?.abilities;
  const effective: Abilities = {
    ...base,
    ...physical,
  };
  return Object.fromEntries(
    (['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((ability) => [
      ability,
      {
        score: effective[ability] - (creature.abilityScoreDamage?.[ability] ?? 0),
        modifier: abilityModifier(effective[ability] - (creature.abilityScoreDamage?.[ability] ?? 0)),
      },
    ])
  ) as Record<AbilityKey, LlmAbilityView>;
}

function defenseView(data: Creature['monsterData']): LlmDefenseView {
  return {
    resistances: sortedStrings(data.resistances),
    immunities: sortedStrings(data.immunities),
    vulnerabilities: sortedStrings(data.vulnerabilities),
    nonmagicalResistances: sortedStrings(data.nonmagicalResistances),
    nonmagicalImmunities: sortedStrings(data.nonmagicalImmunities),
    conditionImmunities: sortedStrings(data.conditionImmunities),
  };
}

function runtimeView(state: BattleState, creature: Creature): LlmRuntimeView {
  const view: LlmRuntimeView = {
    hasActed: creature.hasActed,
    hasMovedThisTurn: creature.hasMovedThisTurn,
    bonusActionUsed: creature.bonusActionUsed ?? false,
    reactionUsed: creature.reactionUsed ?? false,
    airborne: creature.airborne ?? false,
    recharges: sortBooleanRecord(creature.recharges),
    activeBuffs: creature.activeBuffs.map((buff) => activeBuffView(state, buff)),
    conditionTimers: creature.conditionTimers.map((timer) => ({
      condition: timer.condition,
      duration: timer.duration,
      appliedRound: timer.appliedRound,
      sourceId: timer.sourceId,
      sourceLabel: creatureLabelById(state, timer.sourceId),
      saveDC: timer.saveDC,
      saveAbility: timer.saveAbility,
      stage: timer.stageInfo ? {
        stages: [...timer.stageInfo.stages],
        currentIndex: timer.stageInfo.currentIndex,
        finalDuration: timer.stageInfo.finalDuration,
      } : undefined,
    })),
  };

  if (creature.concentratingOn) view.concentratingOn = creature.concentratingOn;
  if (creature.concentrationAura) view.concentrationAura = creature.concentrationAura;
  if (creature.wildShape) {
    view.wildShape = {
      beastName: creature.wildShape.beastName,
      tempHp: creature.wildShape.tempHp,
      maxTempHp: creature.wildShape.maxTempHp,
      formHp: creature.wildShape.formHp,
      ac: creature.wildShape.ac,
      speed: creature.wildShape.speed,
      actions: creature.wildShape.actions
        .filter((action) => action.legendaryOnly !== true)
        .map((action) => actionProfileView(creature, action)),
    };
  }
  if (creature.deathSaves) view.deathSaves = creature.deathSaves;
  if (creature.ongoingEffects?.length) {
    view.ongoingEffects = creature.ongoingEffects.map((effect) => ongoingEffectView(state, effect));
  }
  if (creature.containedBy) view.containedBy = containerView(state, creature.containedBy);
  if (creature.swallowedBy) view.swallowedBy = creature.swallowedBy;
  if (creature.abilityScoreDamage) view.abilityScoreDamage = creature.abilityScoreDamage;
  if (creature.hpMaxReduction) view.hpMaxReduction = creature.hpMaxReduction;

  return view;
}

function actionProfileView(creature: Creature, action: MonsterAction): LlmActionProfileView {
  const resourceCost = action.resourceCost ?? spellSlotCost(action);
  const view: LlmActionProfileView = {
    name: action.name,
    type: action.type,
    attackBonus: action.attackBonus,
    damage: action.damage,
    averageDamage: averageDamageOrUndefined(action.damage),
    damageType: action.damageType,
    additionalDamage: action.additionalDamage,
    reach: action.reach,
    range: action.range,
    savingThrow: action.savingThrow,
    conditionOnHit: action.conditionOnHit,
    recharge: action.recharge,
    rechargeReady: action.recharge ? creature.recharges[action.name] !== false : undefined,
    isBonusAction: action.isBonusAction,
    magical: action.magical,
    weaponMastery: action.weaponMastery,
    loading: action.loading,
    spellLevel: action.spellLevel,
    spellSchool: action.spellSchool,
    atWill: action.atWill,
    concentration: action.concentration,
    durationRounds: action.durationRounds,
    targetScope: action.targetScope,
    targetTypeRestriction: action.targetTypeRestriction,
    resourceCost,
    resourceAvailable: resourceCost ? creature.resources[resourceCost.key] ?? 0 : undefined,
    heal: action.heal,
    temporaryHp: action.temporaryHp,
    buff: action.buff ? buffTemplateView(action.buff) : undefined,
    buffOnHit: action.buffOnHit ? buffTemplateView(action.buffOnHit) : undefined,
    buffOnFailedSave: action.buffOnFailedSave ? buffTemplateView(action.buffOnFailedSave) : undefined,
    smiteOnHit: action.smiteOnHit,
    autoDarts: action.autoDarts,
    autoDartDamage: action.autoDartDamage,
    autoDartDamageType: action.autoDartDamageType,
    effects: action.effects?.map(actionEffectView),
    mechanicsStatus: mechanicsStatusText(action.mechanicsStatus),
  };

  return stripUndefined(view);
}

function spellSlotCost(action: MonsterAction): MonsterAction['resourceCost'] | undefined {
  if (action.atWill || action.spellLevel === undefined || action.spellLevel <= 0) return undefined;
  return { key: `slot-${action.spellLevel}`, amount: 1 };
}

function activeBuffView(state: BattleState, buff: ActiveBuff): LlmBuffView {
  return stripUndefined({
    name: buff.name,
    key: buff.key,
    casterId: buff.casterId,
    casterLabel: creatureLabelById(state, buff.casterId),
    appliedRound: buff.appliedRound,
    endRound: Number.isFinite(buff.endRound) ? buff.endRound : 'infinite' as const,
    requiresConcentration: buff.requiresConcentration,
    attackBonusDice: buff.attackBonusDice,
    attackBonus: buff.attackBonus,
    saveBonusDice: buff.saveBonusDice,
    acBonus: buff.acBonus,
    damageRider: buff.damageRider,
    reactiveDamage: buff.reactiveDamage,
    resistPhysical: buff.resistPhysical,
    resistDamageTypes: sortedStrings(buff.resistDamageTypes),
    resistAllDamageExcept: sortedStrings(buff.resistAllDamageExcept),
    rageDamageBonus: buff.rageDamageBonus,
    speedPenalty: buff.speedPenalty,
    attackDisadvantage: buff.attackDisadvantage,
    saveDisadvantage: buff.saveDisadvantage,
    preventsOpportunityAttacks: buff.preventsOpportunityAttacks,
    advantageForAttackerId: buff.advantageForAttackerId,
    advantageForAllAttackers: buff.advantageForAllAttackers,
    spellAttackAdvantage: buff.spellAttackAdvantage,
    spellSaveDcBonus: buff.spellSaveDcBonus,
  });
}

function buffTemplateView(buff: BuffTemplate): LlmBuffTemplateView {
  return stripUndefined({
    name: buff.name,
    key: buff.key,
    requiresConcentration: buff.requiresConcentration,
    attackBonus: buff.attackBonus,
    attackBonusDice: buff.attackBonusDice,
    saveBonusDice: buff.saveBonusDice,
    acBonus: buff.acBonus,
    damageRider: buff.damageRider,
    resistPhysical: buff.resistPhysical,
    resistDamageTypes: sortedStrings(buff.resistDamageTypes),
    resistAllDamageExcept: sortedStrings(buff.resistAllDamageExcept),
    rageDamageBonus: buff.rageDamageBonus,
    reactiveDamage: buff.reactiveDamage,
    preventDeath: buff.preventDeath,
    attackDisadvantage: buff.attackDisadvantage,
    saveDisadvantage: buff.saveDisadvantage,
    speedPenalty: buff.speedPenalty,
    spellAttackAdvantage: buff.spellAttackAdvantage,
    spellSaveDcBonus: buff.spellSaveDcBonus,
  });
}

function traitViews(traits: MonsterTrait[] | undefined): LlmTraitView[] {
  return (traits ?? [])
    .map((trait) => stripUndefined({
      name: trait.name,
      effects: trait.effects?.map(traitEffectView),
      mechanicsStatus: mechanicsStatusText(trait.mechanicsStatus),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function actionEffectView(effect: RuntimeActionEffect): LlmActionEffectView {
  return {
    kind: effect.kind,
    summary: stripUndefined({ ...effect }),
  };
}

function traitEffectView(effect: RuntimeTraitEffect): LlmTraitEffectView {
  return {
    kind: effect.kind,
    summary: stripUndefined({ ...effect }),
  };
}

function ongoingEffectView(state: BattleState, effect: RuntimeOngoingEffect): LlmOngoingEffectView {
  return stripUndefined({
    key: effect.key,
    sourceId: effect.sourceId,
    sourceLabel: creatureLabelById(state, effect.sourceId),
    condition: effect.condition,
    damage: effect.damage,
    damageType: effect.damageType,
    tick: effect.tick,
    noHealing: effect.noHealing,
    saveEnds: effect.saveEnds,
    appliedRound: effect.appliedRound,
    expiresRound: effect.expiresRound,
  });
}

function containerView(state: BattleState, container: RuntimeContainerState): LlmContainerView {
  return stripUndefined({
    key: container.key,
    sourceId: container.sourceId,
    sourceLabel: creatureLabelById(state, container.sourceId),
    conditions: [...container.conditions].sort(),
    sourceTurnDamage: container.sourceTurnDamage,
    sourceTurnDamageType: container.sourceTurnDamageType,
    targetTurnDamage: container.targetTurnDamage,
    targetTurnDamageType: container.targetTurnDamageType,
    totalCover: container.totalCover,
    movesWithSource: container.movesWithSource,
    escapeDc: container.escapeDc,
  });
}

function tacticReference(): LlmTacticView[] {
  return [
    {
      id: 'battlecast_tactic:aggressive',
      label: TACTIC_LABELS.aggressive.name,
      targetPriority: 'Nearest enemy.',
      movement: 'Always closes distance toward the target; overrides ranged preference and tries to reach melee when possible.',
      retreat: 'Never retreats.',
      spellAndSpecialPriority: 'Before weapon attacks, the copied engine can heal, apply concentration buffs, cast damage/control spells, and use good AoE/special actions when resources and geometry allow.',
    },
    {
      id: 'battlecast_tactic:smart',
      label: TACTIC_LABELS.smart.name,
      targetPriority: 'High-intelligence creatures focus lowest HP percentage targets unless another enemy is much closer; average-intelligence creatures mix nearest and weakest; low-intelligence creatures attack nearest.',
      movement: 'Advances when needed, but ranged-favoring creatures stop in ranged range and may reposition for better firing lines.',
      retreat: 'Can retreat when intelligent and very low HP; retreats only if it has ranged actions and may disengage to avoid dangerous opportunity attacks.',
      spellAndSpecialPriority: 'Before weapon attacks, the copied engine can heal, apply concentration buffs, cast damage/control spells, and use good AoE/special actions when resources and geometry allow.',
    },
    {
      id: 'battlecast_tactic:kiting',
      label: TACTIC_LABELS.kiting.name,
      targetPriority: 'Weakest enemy.',
      movement: 'Ranged creatures try to keep distance: back away if too close, advance only to normal ranged range, otherwise hold and shoot.',
      retreat: 'Retreats earlier at 50% HP or lower when it can still contribute with ranged attacks.',
      spellAndSpecialPriority: 'Before weapon attacks, the copied engine can heal, apply concentration buffs, cast damage/control spells, and use good AoE/special actions when resources and geometry allow.',
    },
    {
      id: 'battlecast_tactic:defensive',
      label: TACTIC_LABELS.defensive.name,
      targetPriority: 'Nearest enemy.',
      movement: 'Holds position and does not advance; attacks only what is reachable after any spell/special handling.',
      retreat: 'Never retreats.',
      spellAndSpecialPriority: 'Before weapon attacks, the copied engine can heal, apply concentration buffs, cast damage/control spells, and use good AoE/special actions when resources and geometry allow.',
    },
  ];
}

function mechanicsStatusText(status: MonsterAction['mechanicsStatus']): string | undefined {
  if (!status) return undefined;
  return status.status === 'implemented'
    ? `implemented${status.note ? `: ${status.note}` : ''}`
    : `deferred: ${status.reason}`;
}

function averageDamageOrUndefined(expression: string | undefined): number | undefined {
  return expression ? Number(averageDamage(expression).toFixed(2)) : undefined;
}

function creatureLabelById(state: BattleState, id: string): string | undefined {
  const creature = state.creatures.find((candidate) => candidate.id === id);
  return creature ? `${creature.displayName} (${creature.team})` : undefined;
}

function sortedStrings(values: string[] | undefined): string[] {
  return [...(values ?? [])].sort((left, right) => left.localeCompare(right));
}

function sortNumberRecord<T extends string>(record: Partial<Record<T, number>> | undefined): Partial<Record<T, number>> {
  return Object.fromEntries(
    Object.entries(record ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
  ) as Partial<Record<T, number>>;
}

function sortBooleanRecord(record: Record<string, boolean> | undefined): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(record ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function stripUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T;
}

function relationOrder(relation: LlmCreatureView['relation']): number {
  if (relation === 'self') return 0;
  if (relation === 'enemy') return 1;
  return 2;
}

function sortedCells(cells: Set<string> | undefined): string[] {
  return [...(cells ?? [])].sort((left, right) => {
    const [leftX, leftY] = left.split(',').map(Number);
    const [rightX, rightY] = right.split(',').map(Number);
    return leftY - rightY || leftX - rightX || left.localeCompare(right);
  });
}
