import {
  type TacticType,
  type BattleState,
  creatureDistance,
} from './battlecast/engine/combat.js';
import type { Creature, MonsterAction } from './battlecast/types/monster.js';
import { getActiveActions } from './battlecast/engine/ai-targeting.js';

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
      type: 'move_toward';
      targetId: string;
      targetName: string;
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
  actions: LegalAction[];
}

export function generateLegalActions(state: BattleState, active: Creature): LegalActionCatalogue {
  const actions: LegalAction[] = [];
  const enemies = state.creatures.filter((creature) =>
    creature.team !== active.team && creature.isAlive && !creature.dying
  );
  const activeActions = getActiveActions(active)
    .filter((action) =>
      action.type !== 'multiattack' &&
      action.attackBonus !== undefined &&
      action.legendaryOnly !== true
    );

  for (const action of activeActions) {
    for (const target of enemies) {
      if (!isTargetInRange(active, target, action)) continue;
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

  for (const target of enemies.filter((target) => creatureDistance(active, target) > 5)) {
    actions.push({
      id: moveTowardActionId(target.id),
      type: 'move_toward',
      targetId: target.id,
      targetName: target.displayName,
    });
  }

  actions.push({ id: 'end_turn', type: 'end_turn' });

  return {
    activeCreatureId: active.id,
    activeCreatureName: active.displayName,
    actions,
  };
}

export function findLegalAction(catalogue: LegalActionCatalogue, actionId: string): LegalAction | undefined {
  return catalogue.actions.find((action) => action.id === actionId);
}

export function attackActionId(actionName: string, targetId: string): string {
  return `attack:${slugActionName(actionName)}:${targetId}`;
}

export function moveTowardActionId(targetId: string): string {
  return `move_toward:${targetId}`;
}

export function battlecastTacticActionId(tactic: TacticType): string {
  return `battlecast_tactic:${tactic}`;
}

export function createBattlecastTacticAction(tactic: TacticType): LegalAction {
  return {
    id: battlecastTacticActionId(tactic),
    type: 'battlecast_tactic',
    tactic,
  };
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

function slugActionName(actionName: string): string {
  return actionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
