import { TACTIC_LABELS, type BattleState } from './battlecast/engine/combat.js';
import type { Creature } from './battlecast/types/monster.js';
import type { LegalActionCatalogue, LegalAction } from './legal-actions.js';

export interface LlmCreatureView {
  id: string;
  name: string;
  team: 'red' | 'blue';
  relation: 'self' | 'ally' | 'enemy';
  hp: number;
  maxHp: number;
  temporaryHp: number;
  ac: number;
  position: { x: number; y: number };
  speedRemaining: number;
  alive: boolean;
  dying: boolean;
  conditions: string[];
  resources: Record<string, number>;
  role?: string;
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
  expectedDamage?: number;
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
  schemaVersion: 'd20bench.llm_observation.v1';
  objective: string;
  actionSpace: 'primitive' | 'battlecast-full-turn';
  round: number;
  turnIndex: number;
  activeCreatureId: string;
  activeCreatureName: string;
  activeTeam: 'red' | 'blue';
  activeCreature: LlmCreatureView;
  creatures: LlmCreatureView[];
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
    .map((creature) => creatureView(creature, activeCreature))
    .sort((left, right) =>
      relationOrder(left.relation) - relationOrder(right.relation) ||
      left.team.localeCompare(right.team) ||
      left.name.localeCompare(right.name) ||
      left.id.localeCompare(right.id)
    );
  const creatureById = new Map(creatures.map((creature) => [creature.id, creature]));
  const actionSpace = catalogue.actions.some((action) => action.type === 'battlecast_tactic')
    ? 'battlecast-full-turn'
    : 'primitive';

  return {
    schemaVersion: 'd20bench.llm_observation.v1',
    objective: 'Choose exactly one legal action id for the active creature. Full-turn Battlecast delegate actions execute movement, spells, healing, buffs, AoE, and attacks through the copied Battlecast rules.',
    actionSpace,
    round: state.round,
    turnIndex: state.turnIndex,
    activeCreatureId: activeCreature.id,
    activeCreatureName: activeCreature.displayName,
    activeTeam: activeCreature.team,
    activeCreature: creatureView(activeCreature, activeCreature),
    creatures,
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

function creatureView(creature: Creature, activeCreature: Creature): LlmCreatureView {
  const relation = creature.id === activeCreature.id
    ? 'self'
    : creature.team === activeCreature.team ? 'ally' : 'enemy';
  return {
    id: creature.id,
    name: creature.displayName,
    team: creature.team,
    relation,
    hp: creature.currentHp,
    maxHp: creature.maxHp,
    temporaryHp: creature.temporaryHp ?? 0,
    ac: creature.monsterData.ac,
    position: creature.position,
    speedRemaining: creature.movementRemaining,
    alive: creature.isAlive,
    dying: creature.dying ?? false,
    conditions: [...creature.conditions].sort(),
    resources: Object.fromEntries(
      Object.entries(creature.resources ?? {})
        .filter(([, value]) => typeof value === 'number')
        .sort(([left], [right]) => left.localeCompare(right))
    ),
    role: creature.monsterData.heroClass ?? creature.monsterData.type,
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

  if (action.type === 'battlecast_tactic') {
    const tactic = TACTIC_LABELS[action.tactic];
    return {
      id: action.id,
      type: action.type,
      label: `Full Battlecast turn using ${tactic.name} tactic`,
      tactic: action.tactic,
      fullTurnDelegate: true,
      description: `${tactic.description}. The copied Battlecast engine may move, cast spells, heal, buff, use AoE, attack, and spend resources for this creature.`,
    };
  }

  return {
    id: action.id,
    type: action.type,
    label: 'End turn',
  };
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
