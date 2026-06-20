import {
  DEFAULT_TACTICS,
  checkBattleComplete,
  creatureDistance,
  initBattle,
  pushLog,
  resolveAttack,
  type BattleState,
} from './battlecast/engine/combat.js';
import type { Creature } from './battlecast/types/monster.js';
import { moveToward } from './battlecast/engine/ai-movement.js';
import { executeTurn } from './battlecast/engine/ai-turn.js';
import { getActiveActions } from './battlecast/engine/ai-targeting.js';
import { withBattlecastRng } from './battlecast/engine/dice.js';
import { maps } from './battlecast/data/maps.js';
import { buildMovementBlockedSet, buildSightBlockedSet } from './battlecast/types/terrain.js';
import { createBattlecastCreatures, summarizeBattlecastBattle, type BattlecastBattleSummary } from './battlecast-runner.js';
import { getAgent, type Agent, type AgentId, type BattlecastTacticAgent } from './agents.js';
import {
  createBattlecastTacticAction,
  findLegalAction,
  generateLegalActions,
  type LegalAction,
} from './legal-actions.js';
import { createRng, type RandomSeed } from './random.js';
import { hashBattlecastState, type D20benchScenario } from './scenario.js';
import type { ReplayEvent, ReplayEventController } from './replay.js';

export interface AgentMatchSpec {
  scenario: D20benchScenario;
  seed: RandomSeed;
  redAgent: AgentId;
  blueAgent: AgentId;
  maxRounds?: number;
}

export interface AgentMatchResult {
  matchId: string;
  scenarioId: string;
  seed: RandomSeed;
  redAgent: AgentId;
  blueAgent: AgentId;
  winner: BattleState['winner'];
  redScore: number;
  blueScore: number;
  finalStateHash: string;
  state: BattleState;
  summary: BattlecastBattleSummary;
  replay: ReplayEvent[];
}

export function runAgentMatch(spec: AgentMatchSpec): AgentMatchResult {
  const maxRounds = spec.maxRounds ?? 100;
  const matchId = createMatchId(spec);
  const red = getAgent(spec.redAgent);
  const blue = getAgent(spec.blueAgent);
  const agentRng = createRng(`${spec.seed}:agents:${spec.redAgent}:${spec.blueAgent}`);

  return withBattlecastRng(spec.seed, () => {
    const state = initAgentBattleState(spec.scenario);
    configureBattlecastTacticsForAgents(state, red, blue);
    const replay: ReplayEvent[] = [];
    replay.push({
      type: 'match_started',
      matchId,
      scenario: {
        id: spec.scenario.id,
        rulesetId: spec.scenario.rulesetId,
        dataPackId: spec.scenario.dataPackId,
        scenarioVersion: spec.scenario.scenarioVersion,
      },
      seed: spec.seed,
      redAgent: spec.redAgent,
      blueAgent: spec.blueAgent,
      stateHash: hashBattlecastState(state),
    });

    while (!state.isComplete && state.round <= maxRounds) {
      replay.push({ type: 'round_started', matchId, round: state.round, stateHash: hashBattlecastState(state) });
      for (let i = 0; i < state.initiativeOrder.length; i += 1) {
        if (state.isComplete) break;
        state.turnIndex = i;
        const active = state.creatures.find((creature) => creature.id === state.initiativeOrder[i]);
        if (!active || !active.isAlive) continue;

        const agent = active.team === 'red' ? red : blue;
        if (active.dying && agent.kind !== 'battlecast-tactic') continue;
        if (agent.kind === 'legal-action') resetSimpleTurn(active);

        const catalogue = agent.kind === 'battlecast-tactic'
          ? {
              activeCreatureId: active.id,
              activeCreatureName: active.displayName,
              actions: [createBattlecastTacticAction(agent.tactic)],
            }
          : generateLegalActions(state, active);
        replay.push({
          type: 'turn_started',
          matchId,
          round: state.round,
          turnIndex: state.turnIndex,
          activeCreatureId: active.id,
          activeCreatureName: active.displayName,
          controller: describeAgentController(agent),
          legalActions: catalogue.actions,
          stateHash: hashBattlecastState(state),
        });

        const logsBefore = state.logs.length;
        const eventsBefore = state.events.length;
        const { requested, accepted } = applyAgentTurn({
          state,
          active,
          agent,
          catalogue,
          agentRng,
        });
        checkBattleComplete(state);

        replay.push({
          type: 'action_resolved',
          matchId,
          round: state.round,
          turnIndex: state.turnIndex,
          activeCreatureId: active.id,
          agentId: agent.id,
          requestedActionId: requested.id,
          acceptedAction: accepted,
          logs: state.logs.slice(logsBefore),
          events: state.events.slice(eventsBefore),
          stateHash: hashBattlecastState(state),
        });
      }

      replay.push({ type: 'round_ended', matchId, round: state.round, stateHash: hashBattlecastState(state) });
      state.round += 1;
    }

    if (!state.isComplete) {
      finishByRemainingHp(state);
    }

    const finalStateHash = hashBattlecastState(state);
    replay.push({
      type: 'match_finished',
      matchId,
      winner: state.winner,
      finalStateHash,
      rounds: state.round,
    });

    return {
      matchId,
      scenarioId: spec.scenario.id,
      seed: spec.seed,
      redAgent: spec.redAgent,
      blueAgent: spec.blueAgent,
      winner: state.winner,
      redScore: scoreForWinner(state.winner, 'red'),
      blueScore: scoreForWinner(state.winner, 'blue'),
      finalStateHash,
      state,
      summary: summarizeBattlecastBattle(state),
      replay,
    };
  });
}

function initAgentBattleState(scenario: D20benchScenario): BattleState {
  const state = initBattle(createBattlecastCreatures(scenario.combatants, true), scenario.gridSize);
  const map = scenario.mapId ? maps.find((candidate) => candidate.id === scenario.mapId) : undefined;
  if (scenario.mapId && !map) {
    throw new Error(`unknown Battlecast map id: ${scenario.mapId}`);
  }
  state.teamTactics = scenario.teamTactics ?? DEFAULT_TACTICS;
  state.terrainBlocked = buildMovementBlockedSet(map?.terrain);
  state.terrainSightBlocked = buildSightBlockedSet(map?.terrain);
  return state;
}

function configureBattlecastTacticsForAgents(state: BattleState, red: Agent, blue: Agent): void {
  state.teamTactics = {
    ...state.teamTactics,
    red: red.kind === 'battlecast-tactic' ? red.tactic : state.teamTactics.red,
    blue: blue.kind === 'battlecast-tactic' ? blue.tactic : state.teamTactics.blue,
  };
}

function describeAgentController(agent: Agent): ReplayEventController {
  if (agent.kind === 'battlecast-tactic') {
    return {
      mode: 'battlecast-tactic',
      agentId: agent.id,
      tactic: agent.tactic,
    };
  }

  return {
    mode: 'legal-action',
    agentId: agent.id,
  };
}

interface AgentTurnInput {
  state: BattleState;
  active: Creature;
  agent: Agent;
  catalogue: ReturnType<typeof generateLegalActions>;
  agentRng: ReturnType<typeof createRng>;
}

interface AgentTurnResult {
  requested: LegalAction;
  accepted: LegalAction;
}

function applyAgentTurn(input: AgentTurnInput): AgentTurnResult {
  if (input.agent.kind === 'battlecast-tactic') {
    const accepted = createBattlecastTacticAction(input.agent.tactic);
    applyBattlecastTacticTurn(input.state, input.active, input.agent);
    return { requested: accepted, accepted };
  }

  const requested = input.agent.chooseAction({
    state: input.state,
    activeCreature: input.active,
    catalogue: input.catalogue,
    rng: input.agentRng,
  });
  const accepted = findLegalAction(input.catalogue, requested.id) ?? ({ id: 'end_turn', type: 'end_turn' } satisfies LegalAction);
  applyLegalAction(input.state, input.active, accepted, input.agent);
  return { requested, accepted };
}

function applyBattlecastTacticTurn(state: BattleState, active: Creature, agent: BattlecastTacticAgent): void {
  state.teamTactics = {
    ...state.teamTactics,
    [active.team]: agent.tactic,
  };
  active.stats.roundsSurvived = state.round;
  executeTurn(state, active);
}

function resetSimpleTurn(active: Creature): void {
  active.hasActed = false;
  active.hasMovedThisTurn = false;
  active.movementRemaining = Math.max(active.monsterData.speed.walk, active.monsterData.speed.fly ?? 0);
}

function applyLegalAction(state: BattleState, active: Creature, action: LegalAction, agent: Agent): void {
  if (action.type === 'attack') {
    const target = state.creatures.find((creature) => creature.id === action.targetId);
    const battlecastAction = getActiveActions(active).find((candidate) => candidate.name === action.actionName);
    if (!target || !battlecastAction) {
      pushLog(state, {
        round: state.round,
        turn: state.turnIndex,
        actor: active.displayName,
        action: 'Invalid Action',
        details: `${agent.id} requested ${action.id}, but target or action was unavailable.`,
        type: 'info',
      });
      return;
    }
    resolveAttack(state, active, target, battlecastAction);
    active.hasActed = true;
    return;
  }

  if (action.type === 'move_toward') {
    const target = state.creatures.find((creature) => creature.id === action.targetId);
    if (!target) return;
    const from = { ...active.position };
    const destination = moveToward(active, target.position, state);
    active.position = destination;
    active.hasMovedThisTurn = creatureDistance({ ...active, position: from }, active) > 0;
    if (from.x !== destination.x || from.y !== destination.y) {
      pushLog(state, {
        round: state.round,
        turn: state.turnIndex,
        actor: active.displayName,
        action: 'Move',
        details: `${active.displayName} moves toward ${target.displayName} (${from.x},${from.y} -> ${destination.x},${destination.y}).`,
        type: 'move',
      });
    }
    return;
  }

  pushLog(state, {
    round: state.round,
    turn: state.turnIndex,
    actor: active.displayName,
    action: 'End Turn',
    details: `${active.displayName} ends their turn.`,
    type: 'info',
  });
}

function finishByRemainingHp(state: BattleState): void {
  const redHp = remainingHp(state, 'red');
  const blueHp = remainingHp(state, 'blue');
  state.isComplete = true;
  state.winner = redHp > blueHp ? 'red' : blueHp > redHp ? 'blue' : 'draw';
  pushLog(state, {
    round: state.round,
    turn: state.turnIndex,
    actor: 'System',
    action: 'Round Limit',
    details: `Round limit reached. ${state.winner === 'draw' ? 'Draw' : `${state.winner} wins`} by remaining HP (${redHp} red vs ${blueHp} blue).`,
    type: 'info',
  });
}

function remainingHp(state: BattleState, team: 'red' | 'blue'): number {
  return state.creatures
    .filter((creature) => creature.team === team && creature.isAlive)
    .reduce((sum, creature) => sum + Math.max(0, creature.currentHp), 0);
}

function scoreForWinner(winner: BattleState['winner'], team: 'red' | 'blue'): number {
  if (winner === 'draw' || winner === null) return 0.5;
  return winner === team ? 1 : 0;
}

function createMatchId(spec: AgentMatchSpec): string {
  return [
    spec.scenario.id,
    String(spec.seed),
    spec.redAgent,
    spec.blueAgent,
  ].join('__').replace(/[^a-zA-Z0-9_.-]+/g, '_');
}
