import type { BattleState } from './battlecast/engine/combat.js';
import { creatureDistance } from './battlecast/engine/combat.js';
import type { Creature } from './battlecast/types/monster.js';
import type { LegalAction, LegalActionCatalogue } from './legal-actions.js';
import type { RandomSource } from './random.js';

export type AgentId =
  | 'baseline.random-legal'
  | 'baseline.nearest'
  | 'baseline.focus-fire'
  | 'baseline.expected-damage';

export interface AgentDecisionContext {
  state: BattleState;
  activeCreature: Creature;
  catalogue: LegalActionCatalogue;
  rng: RandomSource;
}

export interface Agent {
  id: AgentId;
  chooseAction(context: AgentDecisionContext): LegalAction;
}

export const baselineAgents: Record<AgentId, Agent> = {
  'baseline.random-legal': {
    id: 'baseline.random-legal',
    chooseAction({ catalogue, rng }) {
      return catalogue.actions[Math.floor(rng.next() * catalogue.actions.length)] ?? { id: 'end_turn', type: 'end_turn' };
    },
  },
  'baseline.nearest': {
    id: 'baseline.nearest',
    chooseAction(context) {
      return pickNearestAction(context) ?? endTurn();
    },
  },
  'baseline.focus-fire': {
    id: 'baseline.focus-fire',
    chooseAction(context) {
      return pickFocusFireAction(context) ?? pickNearestAction(context) ?? endTurn();
    },
  },
  'baseline.expected-damage': {
    id: 'baseline.expected-damage',
    chooseAction(context) {
      return pickExpectedDamageAction(context) ?? pickFocusFireAction(context) ?? pickNearestAction(context) ?? endTurn();
    },
  },
};

export function getAgent(agentId: AgentId): Agent {
  const agent = baselineAgents[agentId];
  if (!agent) {
    throw new Error(`unknown agent: ${agentId}`);
  }
  return agent;
}

export function isAgentId(value: string): value is AgentId {
  return value in baselineAgents;
}

export function listAgentIds(): AgentId[] {
  return Object.keys(baselineAgents) as AgentId[];
}

function pickNearestAction({ state, activeCreature, catalogue }: AgentDecisionContext): LegalAction | undefined {
  const enemiesByDistance = state.creatures
    .filter((creature) => creature.team !== activeCreature.team && creature.isAlive && !creature.dying)
    .sort((left, right) =>
      creatureDistance(activeCreature, left) - creatureDistance(activeCreature, right) ||
      left.displayName.localeCompare(right.displayName)
    );
  const nearest = enemiesByDistance[0];
  if (!nearest) return undefined;

  return catalogue.actions.find((action) => action.type === 'attack' && action.targetId === nearest.id)
    ?? catalogue.actions.find((action) => action.type === 'move_toward' && action.targetId === nearest.id);
}

function pickFocusFireAction({ state, catalogue }: AgentDecisionContext): LegalAction | undefined {
  const weakestReachable = state.creatures
    .filter((creature) => creature.isAlive && !creature.dying)
    .filter((creature) => catalogue.actions.some((action) =>
      action.type === 'attack' && action.targetId === creature.id
    ))
    .sort((left, right) =>
      left.currentHp - right.currentHp ||
      left.maxHp - right.maxHp ||
      left.displayName.localeCompare(right.displayName)
    )[0];

  if (!weakestReachable) return undefined;
  return catalogue.actions.find((action) => action.type === 'attack' && action.targetId === weakestReachable.id);
}

function pickExpectedDamageAction({ catalogue }: AgentDecisionContext): LegalAction | undefined {
  return catalogue.actions
    .filter((action): action is Extract<LegalAction, { type: 'attack' }> => action.type === 'attack')
    .sort((left, right) =>
      right.expectedDamage - left.expectedDamage ||
      left.targetName.localeCompare(right.targetName) ||
      left.actionName.localeCompare(right.actionName)
    )[0];
}

function endTurn(): LegalAction {
  return { id: 'end_turn', type: 'end_turn' };
}
