import { runBattle } from './battlecast/engine/ai.js';
import {
  DEFAULT_TACTICS,
  createCreature,
  createCreatureWithFixedHp,
  type BattleState,
  type TeamTactics,
} from './battlecast/engine/combat.js';
import { withBattlecastRng } from './battlecast/engine/dice.js';
import { maps } from './battlecast/data/maps.js';
import { getMonsterByName } from './battlecast/data/monsters.js';
import {
  buildMovementBlockedSet,
  buildSightBlockedSet,
} from './battlecast/types/terrain.js';
import type { Creature, MonsterData } from './battlecast/types/monster.js';
import type { RandomSeed } from './random.js';

export type BattlecastTeam = 'red' | 'blue';

export interface BattlecastCombatantSpec {
  monster: string | MonsterData;
  team: BattlecastTeam;
  position: { x: number; y: number };
  index?: number;
}

export interface BattlecastBattleSpec {
  seed: RandomSeed;
  combatants: BattlecastCombatantSpec[];
  gridSize?: number;
  mapId?: string;
  teamTactics?: TeamTactics;
  fixedHp?: boolean;
}

export interface BattlecastBattleSummary {
  winner: BattleState['winner'];
  rounds: number;
  initiativeOrder: string[];
  creatures: Array<{
    id: string;
    name: string;
    team: BattlecastTeam;
    hp: number;
    maxHp: number;
    isAlive: boolean;
    position: { x: number; y: number };
    damageDealt: number;
    damageTaken: number;
    kills: number;
  }>;
  logCount: number;
  eventCount: number;
}

export function runSeededBattlecastBattle(spec: BattlecastBattleSpec): BattleState {
  return withBattlecastRng(spec.seed, () => {
    const creatures = createBattlecastCreatures(spec.combatants, spec.fixedHp ?? true);
    const map = spec.mapId ? maps.find((candidate) => candidate.id === spec.mapId) : undefined;
    if (spec.mapId && !map) {
      throw new Error(`unknown Battlecast map id: ${spec.mapId}`);
    }

    return runBattle(
      creatures,
      spec.gridSize ?? map?.gridSize ?? 20,
      spec.teamTactics ?? DEFAULT_TACTICS,
      buildMovementBlockedSet(map?.terrain),
      buildSightBlockedSet(map?.terrain),
    );
  });
}

export function createBattlecastCreatures(
  specs: BattlecastCombatantSpec[],
  fixedHp = true,
): Creature[] {
  const teamCounts: Record<BattlecastTeam, number> = { red: 0, blue: 0 };

  return specs.map((spec) => {
    const monster = resolveMonsterData(spec.monster);
    const index = spec.index ?? teamCounts[spec.team]++;
    const create = fixedHp ? createCreatureWithFixedHp : createCreature;
    return create(monster, spec.team, { ...spec.position }, index);
  });
}

export function resolveMonsterData(monster: string | MonsterData): MonsterData {
  if (typeof monster !== 'string') {
    return monster;
  }

  const data = getMonsterByName(monster);
  if (!data) {
    throw new Error(`unknown Battlecast monster: ${monster}`);
  }

  return data;
}

export function summarizeBattlecastBattle(state: BattleState): BattlecastBattleSummary {
  return {
    winner: state.winner,
    rounds: state.round,
    initiativeOrder: [...state.initiativeOrder],
    creatures: state.creatures.map((creature) => ({
      id: creature.id,
      name: creature.name,
      team: creature.team,
      hp: creature.currentHp,
      maxHp: creature.maxHp,
      isAlive: creature.isAlive,
      position: { ...creature.position },
      damageDealt: creature.stats.damageDealt,
      damageTaken: creature.stats.damageTaken,
      kills: creature.stats.killCount,
    })),
    logCount: state.logs.length,
    eventCount: state.events.length,
  };
}
