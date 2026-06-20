import type { BattleState } from './battlecast/engine/combat.js';
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
}

export interface LlmActionView {
  id: string;
  type: LegalAction['type'];
  label: string;
  targetId?: string;
  targetName?: string;
  expectedDamage?: number;
}

export interface LlmBattleObservation {
  schemaVersion: 'd20bench.llm_observation.v1';
  objective: string;
  round: number;
  turnIndex: number;
  activeCreatureId: string;
  activeCreatureName: string;
  activeTeam: 'red' | 'blue';
  activeCreature: LlmCreatureView;
  creatures: LlmCreatureView[];
  legalActions: LlmActionView[];
  recentLogs: string[];
}

export function buildLlmBattleObservation(
  state: BattleState,
  activeCreature: Creature,
  catalogue: LegalActionCatalogue,
): LlmBattleObservation {
  return {
    schemaVersion: 'd20bench.llm_observation.v1',
    objective: 'Choose exactly one legal action id for the active creature. The engine will reject any action id not listed in legalActions.',
    round: state.round,
    turnIndex: state.turnIndex,
    activeCreatureId: activeCreature.id,
    activeCreatureName: activeCreature.displayName,
    activeTeam: activeCreature.team,
    activeCreature: creatureView(activeCreature, activeCreature),
    creatures: state.creatures
      .map((creature) => creatureView(creature, activeCreature))
      .sort((left, right) =>
        relationOrder(left.relation) - relationOrder(right.relation) ||
        left.team.localeCompare(right.team) ||
        left.name.localeCompare(right.name) ||
        left.id.localeCompare(right.id)
      ),
    legalActions: catalogue.actions.map(actionView),
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
  };
}

function actionView(action: LegalAction): LlmActionView {
  if (action.type === 'attack') {
    return {
      id: action.id,
      type: action.type,
      label: `${action.actionName} against ${action.targetName}`,
      targetId: action.targetId,
      targetName: action.targetName,
      expectedDamage: Number(action.expectedDamage.toFixed(2)),
    };
  }

  if (action.type === 'move_toward') {
    return {
      id: action.id,
      type: action.type,
      label: `Move toward ${action.targetName}`,
      targetId: action.targetId,
      targetName: action.targetName,
    };
  }

  if (action.type === 'battlecast_tactic') {
    return {
      id: action.id,
      type: action.type,
      label: `Delegate to copied Battlecast ${action.tactic} tactic`,
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
