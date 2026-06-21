import {
  DEFAULT_TACTICS,
  checkBattleComplete,
  creatureDistance,
  executeSpell,
  getEffectiveMoveSpeed,
  getAoETargets,
  initBattle,
  processHydraEndOfTurn,
  processTargetTurnEndOngoingEffects,
  pushLog,
  resolveAttack,
  resolveAoE,
  resolveSingleTargetSave,
  checkAuraEntry,
  type TacticType,
  type BattleState,
} from './battlecast/engine/combat.js';
import type { Creature } from './battlecast/types/monster.js';
import { BASE_DURATIONS } from './battlecast/types/animation.js';
import { moveToDestination, moveToward } from './battlecast/engine/ai-movement.js';
import { beginBattlecastControlledTurn, executeTurn, runOpportunityAttacks } from './battlecast/engine/ai-turn.js';
import { getActiveActions } from './battlecast/engine/ai-targeting.js';
import { withBattlecastRng, withBattlecastRngAsync } from './battlecast/engine/dice.js';
import { maps } from './battlecast/data/maps.js';
import { buildMovementBlockedSet, buildSightBlockedSet } from './battlecast/types/terrain.js';
import { createBattlecastCreatures, summarizeBattlecastBattle, type BattlecastBattleSummary } from './battlecast-runner.js';
import { getAgent, type Agent, type AgentId } from './agents.js';
import {
  createBattlecastTacticAction,
  estimateAttackRollBudget,
  findLegalAction,
  generateLegalActions,
  type LegalAction,
  type LegalActionCatalogue,
} from './legal-actions.js';
import { chooseOpenRouterAction, type OpenRouterDecisionTrace, type OpenRouterRawDecisionTrace } from './openrouter-agent.js';
import { createRng, type RandomSeed } from './random.js';
import { hashBattlecastState, type D20benchScenario } from './scenario.js';
import type { ReplayEvent, ReplayEventController } from './replay.js';

export interface AgentMatchSpec {
  scenario: D20benchScenario;
  seed: RandomSeed;
  redAgent: AgentId;
  blueAgent: AgentId;
  maxRounds?: number;
  llmActionSpace?: LlmActionSpace;
  llmDecisionTraceSink?: (trace: OpenRouterRawDecisionTrace) => void | Promise<void>;
}

export type LlmActionSpace = 'primitive' | 'battlecast-full-turn' | 'actual-actions-v1';

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
        const turnStart = agent.kind === 'battlecast-tactic'
          ? { canAct: true, logsBefore: state.logs.length, eventsBefore: state.events.length, turnStartAlreadyProcessed: false }
          : processManualAgentTurnStart({ state, active, agent, replay, matchId });
        if (!turnStart.canAct) continue;

        const catalogue = createActionCatalogueForAgent(state, active, agent, spec.llmActionSpace ?? 'primitive');
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

        const logsBefore = turnStart.logsBefore;
        const eventsBefore = turnStart.eventsBefore;
        const { requestedActionId, acceptedAction, llmTrace } = applyAgentTurn({
          state,
          active,
          agent,
          catalogue,
          agentRng,
          turnStartAlreadyProcessed: turnStart.turnStartAlreadyProcessed,
        });
        checkBattleComplete(state);

        replay.push({
          type: 'action_resolved',
          matchId,
          round: state.round,
          turnIndex: state.turnIndex,
          activeCreatureId: active.id,
          agentId: agent.id,
          requestedActionId,
          acceptedAction,
          llmTrace,
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

export async function runAgentMatchAsync(spec: AgentMatchSpec): Promise<AgentMatchResult> {
  const maxRounds = spec.maxRounds ?? 100;
  const matchId = createMatchId(spec);
  const red = getAgent(spec.redAgent);
  const blue = getAgent(spec.blueAgent);
  const agentRng = createRng(`${spec.seed}:agents:${spec.redAgent}:${spec.blueAgent}`);

  return withBattlecastRngAsync(spec.seed, async () => {
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
        const turnStart = agent.kind === 'battlecast-tactic'
          ? { canAct: true, logsBefore: state.logs.length, eventsBefore: state.events.length, turnStartAlreadyProcessed: false }
          : processManualAgentTurnStart({ state, active, agent, replay, matchId });
        if (!turnStart.canAct) continue;

        if (agent.kind === 'openrouter-llm' && (spec.llmActionSpace ?? 'primitive') === 'actual-actions-v1') {
          await runStepwiseOpenRouterTurn({
            state,
            active,
            agent,
            agentRng,
            turnStart,
            replay,
            matchId,
            traceSink: spec.llmDecisionTraceSink,
          });
          checkBattleComplete(state);
          continue;
        }

        const catalogue = createActionCatalogueForAgent(state, active, agent, spec.llmActionSpace ?? 'primitive');
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

        const logsBefore = turnStart.logsBefore;
        const eventsBefore = turnStart.eventsBefore;
        const { requestedActionId, acceptedAction, llmTrace } = await applyAgentTurnAsync({
          state,
          active,
          agent,
          catalogue,
          agentRng,
          turnStartAlreadyProcessed: turnStart.turnStartAlreadyProcessed,
          matchId,
          round: state.round,
          turnIndex: state.turnIndex,
          traceSink: spec.llmDecisionTraceSink,
        });
        checkBattleComplete(state);

        replay.push({
          type: 'action_resolved',
          matchId,
          round: state.round,
          turnIndex: state.turnIndex,
          activeCreatureId: active.id,
          agentId: agent.id,
          requestedActionId,
          acceptedAction,
          llmTrace,
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

  if (agent.kind === 'openrouter-llm') {
    return {
      mode: 'openrouter-llm',
      agentId: agent.id,
      model: agent.model,
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
  catalogue: LegalActionCatalogue;
  agentRng: ReturnType<typeof createRng>;
  turnStartAlreadyProcessed: boolean;
  matchId?: string;
  round?: number;
  turnIndex?: number;
  turnStep?: number;
  traceSink?: (trace: OpenRouterRawDecisionTrace) => void | Promise<void>;
}

interface AgentTurnResult {
  requestedActionId: string;
  acceptedAction: LegalAction;
  llmTrace?: OpenRouterDecisionTrace;
}

interface ManualTurnStartResult {
  canAct: boolean;
  logsBefore: number;
  eventsBefore: number;
  turnStartAlreadyProcessed: boolean;
}

interface ActualTurnContext {
  attackRollsRemaining: number;
  attackActionStarted: boolean;
  disengaged: boolean;
  ended: boolean;
}

interface ActualActionApplyResult {
  ended: boolean;
}

function processManualAgentTurnStart(input: {
  state: BattleState;
  active: Creature;
  agent: Agent;
  replay: ReplayEvent[];
  matchId: string;
}): ManualTurnStartResult {
  const logsBefore = input.state.logs.length;
  const eventsBefore = input.state.events.length;
  const canAct = beginBattlecastControlledTurn(input.state, input.active);
  checkBattleComplete(input.state);

  if (canAct && !input.state.isComplete) {
    return {
      canAct: true,
      logsBefore,
      eventsBefore,
      turnStartAlreadyProcessed: true,
    };
  }

  const acceptedAction: LegalAction = { id: 'end_turn', type: 'end_turn' };
  input.replay.push({
    type: 'turn_started',
    matchId: input.matchId,
    round: input.state.round,
    turnIndex: input.state.turnIndex,
    activeCreatureId: input.active.id,
    activeCreatureName: input.active.displayName,
    controller: describeAgentController(input.agent),
    legalActions: [acceptedAction],
    stateHash: hashBattlecastState(input.state),
  });
  input.replay.push({
    type: 'action_resolved',
    matchId: input.matchId,
    round: input.state.round,
    turnIndex: input.state.turnIndex,
    activeCreatureId: input.active.id,
    agentId: input.agent.id,
    requestedActionId: 'automatic:turn_start',
    acceptedAction,
    logs: input.state.logs.slice(logsBefore),
    events: input.state.events.slice(eventsBefore),
    stateHash: hashBattlecastState(input.state),
  });

  return {
    canAct: false,
    logsBefore,
    eventsBefore,
    turnStartAlreadyProcessed: true,
  };
}

function applyAgentTurn(input: AgentTurnInput): AgentTurnResult {
  if (input.agent.kind === 'battlecast-tactic') {
    const acceptedAction = createBattlecastTacticAction(input.agent.tactic);
    applyBattlecastTacticTurn(input.state, input.active, input.agent.tactic);
    return { requestedActionId: acceptedAction.id, acceptedAction };
  }

  if (input.agent.kind === 'openrouter-llm') {
    throw new Error(`${input.agent.id} requires runAgentMatchAsync`);
  }

  const requested = input.agent.chooseAction({
    state: input.state,
    activeCreature: input.active,
    catalogue: input.catalogue,
    rng: input.agentRng,
  });
  const acceptedAction = findLegalAction(input.catalogue, requested.id) ?? ({ id: 'end_turn', type: 'end_turn' } satisfies LegalAction);
  applyLegalAction(input.state, input.active, acceptedAction, input.agent, input.turnStartAlreadyProcessed);
  return { requestedActionId: requested.id, acceptedAction };
}

async function applyAgentTurnAsync(input: AgentTurnInput): Promise<AgentTurnResult> {
  if (input.agent.kind === 'openrouter-llm') {
    const selection = await chooseOpenRouterAction(input.agent, {
      state: input.state,
      activeCreature: input.active,
      catalogue: input.catalogue,
      rng: input.agentRng,
      traceMeta: input.matchId && input.round !== undefined && input.turnIndex !== undefined ? {
        matchId: input.matchId,
        round: input.round,
        turnIndex: input.turnIndex,
        turnStep: input.turnStep,
        activeCreatureId: input.active.id,
        activeCreatureName: input.active.displayName,
        agentId: input.agent.id,
      } : undefined,
      traceSink: input.traceSink,
    });
    applyLegalAction(input.state, input.active, selection.acceptedAction, input.agent, input.turnStartAlreadyProcessed);
    return {
      requestedActionId: selection.requestedActionId,
      acceptedAction: selection.acceptedAction,
      llmTrace: selection.trace,
    };
  }

  return applyAgentTurn(input);
}

async function runStepwiseOpenRouterTurn(input: {
  state: BattleState;
  active: Creature;
  agent: Extract<Agent, { kind: 'openrouter-llm' }>;
  agentRng: ReturnType<typeof createRng>;
  turnStart: ManualTurnStartResult;
  replay: ReplayEvent[];
  matchId: string;
  traceSink?: (trace: OpenRouterRawDecisionTrace) => void | Promise<void>;
}): Promise<void> {
  const actualTurn: ActualTurnContext = {
    attackRollsRemaining: estimateAttackRollBudget(input.active),
    attackActionStarted: false,
    disengaged: false,
    ended: false,
  };
  const maxSteps = 8;
  let step = 0;

  while (!input.state.isComplete && input.active.isAlive && !actualTurn.ended && step < maxSteps) {
    const catalogue = createActionCatalogueForAgent(
      input.state,
      input.active,
      input.agent,
      'actual-actions-v1',
      actualTurn,
    );
    const nonEndActions = catalogue.actions.filter((action) => action.type !== 'end_turn');
    input.replay.push({
      type: 'turn_started',
      matchId: input.matchId,
      round: input.state.round,
      turnIndex: input.state.turnIndex,
      turnStep: step,
      activeCreatureId: input.active.id,
      activeCreatureName: input.active.displayName,
      controller: describeAgentController(input.agent),
      legalActions: catalogue.actions,
      stateHash: hashBattlecastState(input.state),
    });

    if (nonEndActions.length === 0) {
      const acceptedAction: LegalAction = { id: 'end_turn', type: 'end_turn' };
      const logsBefore = step === 0 ? input.turnStart.logsBefore : input.state.logs.length;
      const eventsBefore = step === 0 ? input.turnStart.eventsBefore : input.state.events.length;
      applyActualLegalAction(input.state, input.active, acceptedAction, input.agent, actualTurn);
      input.replay.push({
        type: 'action_resolved',
        matchId: input.matchId,
        round: input.state.round,
        turnIndex: input.state.turnIndex,
        turnStep: step,
        activeCreatureId: input.active.id,
        agentId: input.agent.id,
        requestedActionId: 'automatic:no_legal_actions',
        acceptedAction,
        logs: input.state.logs.slice(logsBefore),
        events: input.state.events.slice(eventsBefore),
        stateHash: hashBattlecastState(input.state),
      });
      actualTurn.ended = true;
      break;
    }

    const logsBefore = step === 0 ? input.turnStart.logsBefore : input.state.logs.length;
    const eventsBefore = step === 0 ? input.turnStart.eventsBefore : input.state.events.length;
    const selection = await chooseOpenRouterAction(input.agent, {
      state: input.state,
      activeCreature: input.active,
      catalogue,
      rng: input.agentRng,
      traceMeta: {
        matchId: input.matchId,
        round: input.state.round,
        turnIndex: input.state.turnIndex,
        turnStep: step,
        activeCreatureId: input.active.id,
        activeCreatureName: input.active.displayName,
        agentId: input.agent.id,
      },
      traceSink: input.traceSink,
    });
    const applyResult = applyActualLegalAction(input.state, input.active, selection.acceptedAction, input.agent, actualTurn);
    checkBattleComplete(input.state);
    input.replay.push({
      type: 'action_resolved',
      matchId: input.matchId,
      round: input.state.round,
      turnIndex: input.state.turnIndex,
      turnStep: step,
      activeCreatureId: input.active.id,
      agentId: input.agent.id,
      requestedActionId: selection.requestedActionId,
      acceptedAction: selection.acceptedAction,
      llmTrace: selection.trace,
      logs: input.state.logs.slice(logsBefore),
      events: input.state.events.slice(eventsBefore),
      stateHash: hashBattlecastState(input.state),
    });
    actualTurn.ended = applyResult.ended;
    step += 1;
  }

  if (!actualTurn.ended && !input.state.isComplete && input.active.isAlive) {
    pushLog(input.state, {
      round: input.state.round,
      turn: input.state.turnIndex,
      actor: input.active.displayName,
      action: 'End Turn',
      details: `${input.active.displayName} ends their turn after reaching the step limit.`,
      type: 'info',
    });
  }
  finishManualTurnEnd(input.state, input.active);
  checkBattleComplete(input.state);
}

function applyBattlecastTacticTurn(
  state: BattleState,
  active: Creature,
  tactic: TacticType,
  turnStartAlreadyProcessed = false,
): void {
  state.teamTactics = {
    ...state.teamTactics,
    [active.team]: tactic,
  };
  active.stats.roundsSurvived = state.round;
  executeTurn(state, active, { turnStartAlreadyProcessed });
}

function createActionCatalogueForAgent(
  state: BattleState,
  active: Creature,
  agent: Agent,
  llmActionSpace: LlmActionSpace,
  actualTurnContext?: ActualTurnContext,
): LegalActionCatalogue {
  return agent.kind === 'battlecast-tactic'
    ? {
        activeCreatureId: active.id,
        activeCreatureName: active.displayName,
        actionSpace: 'battlecast-full-turn',
        actions: [createBattlecastTacticAction(agent.tactic)],
      }
    : generateLegalActions(state, active, {
        includeBattlecastFullTurnActions: agent.kind === 'openrouter-llm' && llmActionSpace === 'battlecast-full-turn',
        includeActualActions: agent.kind === 'openrouter-llm' && llmActionSpace === 'actual-actions-v1',
        actualTurnContext,
      });
}

function applyActualLegalAction(
  state: BattleState,
  active: Creature,
  action: LegalAction,
  agent: Agent,
  actualTurn: ActualTurnContext,
): ActualActionApplyResult {
  if (action.type === 'end_turn') {
    applyLegalAction(state, active, action, agent, true);
    actualTurn.ended = true;
    return { ended: true };
  }

  if (action.type === 'move_toward') {
    const before = { ...active.position };
    applyLegalAction(state, active, action, agent, true);
    processPostMoveEffects(state, active, before, actualTurn);
    return { ended: false };
  }

  if (action.type === 'move_to') {
    const before = { ...active.position };
    moveToDestination(active, action.destination, state);
    if (before.x !== active.position.x || before.y !== active.position.y) {
      active.hasMovedThisTurn = true;
      pushLog(state, {
        round: state.round,
        turn: state.turnIndex,
        actor: active.displayName,
        action: 'Move',
        details: `${active.displayName} moves to (${active.position.x},${active.position.y}).`,
        type: 'move',
      });
    }
    processPostMoveEffects(state, active, before, actualTurn);
    return { ended: false };
  }

  if (action.type === 'dash') {
    applyDashAction(state, active, action, actualTurn);
    return { ended: shouldEndActualTurn(active, actualTurn) };
  }

  if (action.type === 'disengage') {
    applyDisengageAction(state, active, action, actualTurn);
    return { ended: shouldEndActualTurn(active, actualTurn) };
  }

  if (action.type === 'class_feature') {
    applyClassFeatureAction(state, active, action);
    return { ended: shouldEndActualTurn(active, actualTurn) };
  }

  if (action.type === 'attack') {
    applyAttackAction(state, active, action, agent, actualTurn);
    return { ended: shouldEndActualTurn(active, actualTurn) };
  }

  if (action.type === 'spell') {
    applySpellAction(state, active, action, agent, actualTurn);
    return { ended: shouldEndActualTurn(active, actualTurn) };
  }

  applyLegalAction(state, active, action, agent, true);
  actualTurn.ended = true;
  return { ended: true };
}

function applyAttackAction(
  state: BattleState,
  active: Creature,
  action: Extract<LegalAction, { type: 'attack' }>,
  agent: Agent,
  actualTurn: ActualTurnContext,
): void {
  const target = state.creatures.find((creature) => creature.id === action.targetId);
  const battlecastAction = getActiveActions(active).find((candidate) => candidate.name === action.actionName);
  if (!target || !battlecastAction) {
    pushInvalidActionLog(state, active, agent, action.id);
    return;
  }

  resolveAttack(state, active, target, battlecastAction);
  actualTurn.attackActionStarted = true;
  actualTurn.attackRollsRemaining = Math.max(0, actualTurn.attackRollsRemaining - 1);
  if (actualTurn.attackRollsRemaining === 0) {
    active.hasActed = true;
  }
}

function processPostMoveEffects(
  state: BattleState,
  active: Creature,
  before: { x: number; y: number },
  actualTurn: ActualTurnContext,
): void {
  if (before.x === active.position.x && before.y === active.position.y) return;
  if (!actualTurn.disengaged) {
    runOpportunityAttacks(state, active, before);
  }
  if (active.isAlive && !state.isComplete) {
    checkAuraEntry(state, active, before);
  }
}

function applySpellAction(
  state: BattleState,
  active: Creature,
  action: Extract<LegalAction, { type: 'spell' }>,
  agent: Agent,
  actualTurn: ActualTurnContext,
): void {
  const battlecastAction = getActiveActions(active).find((candidate) => candidate.name === action.actionName);
  if (!battlecastAction) {
    pushInvalidActionLog(state, active, agent, action.id);
    return;
  }

  const targetIds = action.targetIds?.length ? action.targetIds : action.targetId ? [action.targetId] : [];
  const targets = targetIds
    .map((targetId) => state.creatures.find((creature) => creature.id === targetId))
    .filter((target): target is Creature => !!target);
  const primaryTarget = action.targetId
    ? state.creatures.find((creature) => creature.id === action.targetId) ?? targets[0] ?? null
    : targets[0] ?? null;
  let applied = false;

  if (battlecastAction.autoDarts) {
    applied = executeSpell(state, active, battlecastAction, primaryTarget, targets);
  } else if (battlecastAction.spellLevel !== undefined || battlecastAction.resourceCost || battlecastAction.heal || battlecastAction.temporaryHp || battlecastAction.buff || battlecastAction.powerWord) {
    const aoeTargets = battlecastAction.savingThrow?.area
      ? targets.length > 0 ? targets : getAoETargets(state, active, battlecastAction)
      : undefined;
    applied = executeSpell(state, active, battlecastAction, primaryTarget, aoeTargets, action.center);
  } else if (battlecastAction.savingThrow?.area) {
    const aoeTargets = targets.length > 0 ? targets : getAoETargets(state, active, battlecastAction);
    resolveAoE(state, active, battlecastAction, aoeTargets, action.center);
    if (battlecastAction.recharge) active.recharges[battlecastAction.name] = false;
    applied = true;
  } else if (battlecastAction.savingThrow && primaryTarget) {
    resolveSingleTargetSave(state, active, primaryTarget, battlecastAction);
    if (battlecastAction.recharge) active.recharges[battlecastAction.name] = false;
    applied = true;
  } else if (battlecastAction.attackBonus !== undefined && primaryTarget) {
    resolveAttack(state, active, primaryTarget, battlecastAction);
    applied = true;
  }

  if (!applied) {
    pushInvalidActionLog(state, active, agent, action.id);
    return;
  }

  if (battlecastAction.isBonusAction) {
    active.bonusActionUsed = true;
  } else {
    active.hasActed = true;
    actualTurn.attackRollsRemaining = 0;
  }
}

function applyDashAction(
  state: BattleState,
  active: Creature,
  action: Extract<LegalAction, { type: 'dash' }>,
  actualTurn: ActualTurnContext,
): void {
  const extraMovement = Math.max(0, action.extraMovement || movementAllowance(active, state));
  active.movementRemaining += extraMovement;
  active.hasActed = true;
  actualTurn.attackRollsRemaining = 0;
  pushLog(state, {
    round: state.round,
    turn: state.turnIndex,
    actor: active.displayName,
    action: 'Dash',
    details: `${active.displayName} dashes, gaining ${extraMovement} ft of movement for this turn.`,
    type: 'move',
  });
}

function applyDisengageAction(
  state: BattleState,
  active: Creature,
  action: Extract<LegalAction, { type: 'disengage' }>,
  actualTurn: ActualTurnContext,
): void {
  actualTurn.disengaged = true;
  if (action.isBonusAction) {
    active.bonusActionUsed = true;
  } else {
    active.hasActed = true;
    actualTurn.attackRollsRemaining = 0;
  }
  pushLog(state, {
    round: state.round,
    turn: state.turnIndex,
    actor: active.displayName,
    action: action.isBonusAction ? 'Bonus Action Disengage' : 'Disengage',
    details: `${active.displayName} avoids opportunity attacks from movement this turn.`,
    type: 'move',
  });
  for (const enemy of opportunityThreats(state, active)) {
    state.events.push({
      kind: 'oaAvoided',
      moverId: active.id,
      enemyId: enemy.id,
      reason: action.isBonusAction ? bonusDisengageReason(active) : 'disengage',
      durationMs: BASE_DURATIONS.oaAvoided,
    });
  }
}

function applyClassFeatureAction(
  state: BattleState,
  active: Creature,
  action: Extract<LegalAction, { type: 'class_feature' }>,
): void {
  if (action.feature === 'steady_aim') {
    active.turnFlags = {
      ...active.turnFlags,
      steadyAim: true,
    };
    active.bonusActionUsed = true;
    active.movementRemaining = 0;
    active.stats.actionUsage['Steady Aim'] = (active.stats.actionUsage['Steady Aim'] || 0) + 1;
    pushLog(state, {
      round: state.round,
      turn: state.turnIndex,
      actor: active.displayName,
      action: 'Steady Aim',
      details: `${active.displayName} holds position and gains Advantage on the next attack.`,
      type: 'special',
    });
    state.events.push({
      kind: 'effect',
      creatureId: active.id,
      label: 'Steady Aim',
      tone: 'success',
      durationMs: BASE_DURATIONS.effect,
    });
  }
}

function shouldEndActualTurn(active: Creature, actualTurn: ActualTurnContext): boolean {
  if (actualTurn.ended) return true;
  const hasMainAction = !active.hasActed || (actualTurn.attackActionStarted && actualTurn.attackRollsRemaining > 0);
  const hasBonusAction = active.bonusActionUsed !== true;
  const hasMovement = active.movementRemaining > 0;
  return !hasMainAction && !hasBonusAction && !hasMovement;
}

function movementAllowance(active: Creature, state: BattleState): number {
  if (active.conditions.includes('restrained') || active.conditions.includes('grappled')) return 0;
  return Math.max(0, getEffectiveMoveSpeed(active, state) - activeSpeedPenalty(active));
}

function activeSpeedPenalty(active: Creature): number {
  return Math.max(0, ...((active.activeBuffs ?? []).map((buff) => buff.speedPenalty ?? 0)));
}

function bonusDisengageReason(active: Creature): 'cunning' | 'nimble' {
  return active.monsterData.heroClass === 'Rogue' ? 'cunning' : 'nimble';
}

function opportunityThreats(state: BattleState, active: Creature): Creature[] {
  return state.creatures.filter((enemy) => {
    if (enemy.team === active.team || !enemy.isAlive || enemy.reactionUsed) return false;
    if (enemy.conditions.includes('incapacitated') || enemy.conditions.includes('stunned') ||
      enemy.conditions.includes('paralyzed') || enemy.conditions.includes('unconscious')) return false;
    const reach = getActiveActions(enemy)
      .filter((enemyAction) => enemyAction.type === 'melee')
      .reduce((max, enemyAction) => Math.max(max, enemyAction.reach ?? 5), 5);
    return creatureDistance(enemy, active) <= reach;
  });
}

function pushInvalidActionLog(state: BattleState, active: Creature, agent: Agent, actionId: string): void {
  pushLog(state, {
    round: state.round,
    turn: state.turnIndex,
    actor: active.displayName,
    action: 'Invalid Action',
    details: `${agent.id} requested ${actionId}, but the action could not be applied.`,
    type: 'info',
  });
}

function finishManualTurnEnd(state: BattleState, active: Creature): void {
  processHydraEndOfTurn(state, active);
  processTargetTurnEndOngoingEffects(state, active);
}

function applyLegalAction(
  state: BattleState,
  active: Creature,
  action: LegalAction,
  agent: Agent,
  turnStartAlreadyProcessed = false,
): void {
  if (action.type === 'battlecast_tactic') {
    applyBattlecastTacticTurn(state, active, action.tactic, turnStartAlreadyProcessed);
    return;
  }

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
    ...(spec.llmActionSpace && spec.llmActionSpace !== 'primitive' ? [spec.llmActionSpace] : []),
    String(spec.seed),
    spec.redAgent,
    spec.blueAgent,
  ].join('__').replace(/[^a-zA-Z0-9_.-]+/g, '_');
}
