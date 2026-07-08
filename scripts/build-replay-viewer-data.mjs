#!/usr/bin/env node
// Builds the replay viewer data payloads from results/seasons/*/completed-matches.jsonl.
// Emits apps/replay-viewer/data/index.js plus one data/m<N>.js per match, loaded
// by the viewer through script-tag injection so the app works from file:// too.
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const seasonsDir = join(root, 'results', 'seasons');
const outDir = join(root, 'apps', 'replay-viewer', 'data');

const { maps } = await import(join(root, 'packages/engine/dist/battlecast/data/maps.js'));
const { listScenarios } = await import(join(root, 'packages/engine/dist/scenarios/index.js'));

const scenarioById = new Map(listScenarios().map((scenario) => [scenario.id, scenario]));
const mapById = new Map(maps.map((map) => [map.id, map]));

function slimTrace(trace) {
  if (!trace) return undefined;
  return {
    model: trace.model,
    rationale: trace.rationale,
    latencyMs: trace.latencyMs,
    attempts: trace.attempts,
    totalTokens: trace.usage?.totalTokens,
  };
}

function slimReplay(replay) {
  const slim = [];
  for (const event of replay) {
    if (event.type === 'round_started' || event.type === 'round_ended') {
      slim.push({ type: event.type, round: event.round });
    } else if (event.type === 'match_finished') {
      slim.push({ type: event.type, winner: event.winner, rounds: event.rounds });
    } else if (event.type === 'action_resolved') {
      slim.push({
        type: event.type,
        round: event.round,
        turnIndex: event.turnIndex,
        turnStep: event.turnStep,
        activeCreatureId: event.activeCreatureId,
        agentId: event.agentId,
        requestedActionId: event.requestedActionId,
        acceptedAction: event.acceptedAction,
        llmTrace: slimTrace(event.llmTrace),
        logs: (event.logs ?? []).map((log) => ({
          round: log.round,
          actor: log.actor,
          action: log.action,
          details: log.details,
          type: log.type,
        })),
        events: event.events ?? [],
      });
    }
  }
  return slim;
}

function slimCreature(creature) {
  return {
    id: creature.id,
    displayName: creature.displayName,
    team: creature.team,
    maxHp: creature.maxHp,
    finalHp: creature.currentHp,
    finalPosition: creature.position,
    alive: creature.isAlive,
    heroClass: creature.monsterData?.heroClass ?? null,
    monsterName: creature.monsterData?.name ?? creature.displayName,
    ac: creature.monsterData?.ac,
    size: creature.monsterData?.size ?? 'Medium',
    initiative: creature.initiative,
  };
}

function initialPositions(replay, creatures) {
  const positions = {};
  for (const creature of creatures) {
    positions[creature.id] = { ...creature.finalPosition };
  }
  const seen = new Set();
  for (const event of replay) {
    if (event.type !== 'action_resolved') continue;
    for (const anim of event.events ?? []) {
      if (anim.kind === 'move' && anim.creatureId && !seen.has(anim.creatureId) && anim.from) {
        positions[anim.creatureId] = { ...anim.from };
        seen.add(anim.creatureId);
      }
    }
  }
  return positions;
}

async function readJsonl(path) {
  const records = [];
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch {
      // skip partial trailing lines from in-flight seasons
    }
  }
  return records;
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const seasonIds = existsSync(seasonsDir)
  ? (await readdir(seasonsDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  : [];

const index = [];
let fileCounter = 0;

for (const seasonId of seasonIds.sort()) {
  const jsonlPath = join(seasonsDir, seasonId, 'completed-matches.jsonl');
  if (!existsSync(jsonlPath)) continue;
  const records = await readJsonl(jsonlPath);
  for (const record of records) {
    const match = record.match;
    if (!match?.replay?.length || !match.state?.creatures?.length) continue;
    const scenario = scenarioById.get(match.scenarioId);
    const mapId = scenario?.mapId ?? null;
    const map = mapId ? mapById.get(mapId) : undefined;
    const creatures = match.state.creatures.map(slimCreature);
    const replay = slimReplay(match.replay);
    const key = `m${fileCounter}`;
    fileCounter += 1;

    const payload = {
      key,
      seasonId,
      matchId: match.matchId,
      scenarioId: match.scenarioId,
      scenarioName: scenario?.name ?? match.scenarioId,
      seed: match.seed,
      redAgent: match.redAgent,
      blueAgent: match.blueAgent,
      winner: match.winner,
      gridSize: match.state.gridSize ?? scenario?.gridSize ?? 20,
      mapImage: map?.image ? `assets/maps/${mapId}.webp` : null,
      terrain: map?.terrain ?? [],
      creatures,
      initialPositions: initialPositions(replay, creatures),
      replay,
    };
    const file = `${key}.js`;
    await writeFile(
      join(outDir, file),
      `window.D20BENCH_REPLAY_LOAD(${JSON.stringify(payload)});\n`,
    );
    const decisions = replay.filter((event) => event.type === 'action_resolved' && event.llmTrace).length;
    index.push({
      key,
      file: `data/${file}`,
      seasonId,
      matchId: match.matchId,
      scenarioId: match.scenarioId,
      scenarioName: payload.scenarioName,
      seed: match.seed,
      redAgent: match.redAgent,
      blueAgent: match.blueAgent,
      winner: match.winner,
      rounds: match.state.round,
      decisions,
    });
  }
}

await writeFile(
  join(outDir, 'index.js'),
  `window.D20BENCH_REPLAY_INDEX = ${JSON.stringify({ generatedAt: new Date().toISOString(), matches: index })};\n`,
);

console.log(`replay viewer data: ${index.length} matches from ${seasonIds.length} seasons -> ${outDir}`);
