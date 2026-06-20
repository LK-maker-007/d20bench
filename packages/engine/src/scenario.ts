import { createHash } from 'node:crypto';

import {
  runSeededBattlecastBattle,
  summarizeBattlecastBattle,
  type BattlecastBattleSummary,
  type BattlecastCombatantSpec,
} from './battlecast-runner.js';
import type { BattleState, TeamTactics } from './battlecast/engine/combat.js';
import type { RandomSeed } from './random.js';

export type ScenarioVisibility = 'public' | 'hidden' | 'private_arena';

export interface D20benchScenario {
  id: string;
  name: string;
  description: string;
  visibility: ScenarioVisibility;
  rulesetId: string;
  dataPackId: string;
  scenarioVersion: string;
  gridSize: number;
  mapId?: string;
  teamTactics?: TeamTactics;
  combatants: BattlecastCombatantSpec[];
}

export interface D20benchScenarioRun {
  scenario: D20benchScenario;
  seed: RandomSeed;
  state: BattleState;
  summary: BattlecastBattleSummary;
  finalStateHash: string;
}

export function runD20benchScenario(
  scenario: D20benchScenario,
  seed: RandomSeed,
): D20benchScenarioRun {
  const state = runSeededBattlecastBattle({
    seed,
    gridSize: scenario.gridSize,
    mapId: scenario.mapId,
    teamTactics: scenario.teamTactics,
    fixedHp: true,
    combatants: scenario.combatants,
  });

  return {
    scenario,
    seed,
    state,
    summary: summarizeBattlecastBattle(state),
    finalStateHash: hashBattlecastState(state),
  };
}

export function hashBattlecastState(state: BattleState): string {
  return hashStableJson(snapshotBattlecastState(state));
}

export function hashStableJson(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

export function snapshotBattlecastState(state: BattleState): unknown {
  return {
    round: state.round,
    turnIndex: state.turnIndex,
    initiativeOrder: state.initiativeOrder,
    isComplete: state.isComplete,
    winner: state.winner,
    gridSize: state.gridSize,
    creatures: state.creatures.map((creature) => ({
      id: creature.id,
      name: creature.name,
      displayName: creature.displayName,
      team: creature.team,
      currentHp: creature.currentHp,
      maxHp: creature.maxHp,
      temporaryHp: creature.temporaryHp ?? 0,
      position: creature.position,
      initiative: creature.initiative,
      conditions: creature.conditions,
      conditionTimers: creature.conditionTimers,
      isAlive: creature.isAlive,
      dying: creature.dying ?? false,
      deathSaves: creature.deathSaves ?? null,
      hasActed: creature.hasActed,
      hasMovedThisTurn: creature.hasMovedThisTurn,
      movementRemaining: creature.movementRemaining,
      reactionUsed: creature.reactionUsed ?? false,
      recharges: creature.recharges,
      resources: creature.resources,
      activeBuffs: creature.activeBuffs,
      turnFlags: creature.turnFlags,
      stats: creature.stats,
      wildShape: creature.wildShape
        ? {
            beastName: creature.wildShape.beastName,
            tempHp: creature.wildShape.tempHp,
            formHp: creature.wildShape.formHp,
          }
        : null,
      hydraHeads: creature.hydraHeads ?? null,
      ongoingEffects: creature.ongoingEffects ?? [],
      containedBy: creature.containedBy ?? null,
    })),
    logs: state.logs,
    events: state.events,
  };
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortForStableJson(value));
}

function sortForStableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForStableJson);
  }

  if (value instanceof Set) {
    return [...value].sort().map(sortForStableJson);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, sortForStableJson(entryValue)]),
    );
  }

  return value;
}
