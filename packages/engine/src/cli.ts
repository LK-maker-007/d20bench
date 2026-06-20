#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { isAgentId, listAgentIds, type AgentId } from './agents.js';
import { runAgentMatch } from './agent-match.js';
import { runD20benchScenario } from './scenario.js';
import { getScenarioById, listScenarios } from './scenarios/index.js';
import { buildMatchReport, renderMatchReportMarkdown } from './report.js';
import { readReplayJsonl, verifyReplayStructure, writeReplayJsonl } from './replay.js';
import { renderEloSeasonMarkdown, runEloSeason } from './ratings.js';
import { smokeSeason } from './seasons.js';

interface ParsedArgs {
  positional: string[];
  options: Record<string, string | boolean>;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const [domain, command, maybeTarget] = args.positional;

  try {
    if (domain === 'scenario' && command === 'list') {
      commandScenarioList();
      return;
    }

    if (domain === 'scenario' && command === 'run') {
      await commandScenarioRun(maybeTarget, args.options);
      return;
    }

    if (domain === 'scenario' && command === 'verify') {
      await commandScenarioVerify(maybeTarget);
      return;
    }

    if (domain === 'match' && command === 'run') {
      await commandMatchRun(args.options);
      return;
    }

    if (domain === 'ladder' && command === 'run') {
      await commandLadderRun(args.options);
      return;
    }

    printHelp();
    process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

function commandScenarioList(): void {
  for (const scenario of listScenarios()) {
    console.log(`${scenario.id}\t${scenario.visibility}\t${scenario.name}`);
  }
}

async function commandScenarioRun(target: string | undefined, options: ParsedArgs['options']): Promise<void> {
  const scenario = getScenarioById(target ?? expectString(options.scenario, '--scenario'));
  const seed = parseSeed(options.seed ?? '1');
  const run = runD20benchScenario(scenario, seed);
  const output = {
    scenarioId: scenario.id,
    seed,
    winner: run.summary.winner,
    rounds: run.summary.rounds,
    finalStateHash: run.finalStateHash,
    summary: run.summary,
  };

  if (typeof options.out === 'string') {
    await writeJson(options.out, output);
  }

  console.log(JSON.stringify(output, null, 2));
}

async function commandScenarioVerify(target: string | undefined): Promise<void> {
  if (!target) throw new Error('scenario verify requires a replay JSONL path');
  const events = await readReplayJsonl(target);
  const result = verifyReplayStructure(events);
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  const first = events[0];
  const last = events[events.length - 1];
  if (first?.type === 'match_started' && last?.type === 'match_finished') {
    const rerun = runAgentMatch({
      scenario: getScenarioById(first.scenario.id),
      seed: first.seed,
      redAgent: first.redAgent,
      blueAgent: first.blueAgent,
    });
    if (rerun.finalStateHash !== last.finalStateHash) {
      console.error(`Replay hash mismatch: expected ${last.finalStateHash}, got ${rerun.finalStateHash}`);
      process.exitCode = 1;
      return;
    }
  }
  console.log(`Replay OK: ${target}`);
}

async function commandMatchRun(options: ParsedArgs['options']): Promise<void> {
  const scenario = getScenarioById(expectString(options.scenario, '--scenario'));
  const redAgent = parseAgent(expectString(options.red, '--red'));
  const blueAgent = parseAgent(expectString(options.blue, '--blue'));
  const seed = parseSeed(options.seed ?? '1');
  const result = runAgentMatch({ scenario, seed, redAgent, blueAgent });
  const report = buildMatchReport([result]);
  const output = {
    matchId: result.matchId,
    scenarioId: result.scenarioId,
    seed,
    redAgent,
    blueAgent,
    winner: result.winner,
    finalStateHash: result.finalStateHash,
  };

  if (typeof options.out === 'string') {
    await mkdir(options.out, { recursive: true });
    await writeReplayJsonl(join(options.out, 'replay.jsonl'), result.replay);
    await writeJson(join(options.out, 'report.json'), report);
    await writeFile(join(options.out, 'report.md'), renderMatchReportMarkdown(report), 'utf8');
  }

  console.log(JSON.stringify(output, null, 2));
}

async function commandLadderRun(options: ParsedArgs['options']): Promise<void> {
  const outDir = typeof options.out === 'string' ? options.out : 'results/seasons/smoke-v0';
  const result = runEloSeason(smokeSeason);
  await mkdir(outDir, { recursive: true });
  await writeJson(join(outDir, 'standings.json'), result);
  await writeFile(join(outDir, 'standings.md'), renderEloSeasonMarkdown(result), 'utf8');
  console.log(JSON.stringify({
    seasonId: result.seasonId,
    outDir,
    standings: result.standings.map((standing) => ({
      agentId: standing.agentId,
      rating: Number(standing.rating.toFixed(1)),
      matches: standing.matches,
      wins: standing.wins,
      losses: standing.losses,
      draws: standing.draws,
    })),
  }, null, 2));
}

function parseArgs(raw: string[]): ParsedArgs {
  const positional: string[] = [];
  const options: ParsedArgs['options'] = {};

  for (let index = 0; index < raw.length; index += 1) {
    const token = raw[index];
    if (token.startsWith('--')) {
      const [key, inlineValue] = token.slice(2).split('=', 2);
      if (inlineValue !== undefined) {
        options[key] = inlineValue;
        continue;
      }
      const next = raw[index + 1];
      if (next && !next.startsWith('--')) {
        options[key] = next;
        index += 1;
      } else {
        options[key] = true;
      }
    } else {
      positional.push(token);
    }
  }

  return { positional, options };
}

function expectString(value: string | boolean | undefined, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`missing required option ${label}`);
  }
  return value;
}

function parseAgent(value: string): AgentId {
  if (!isAgentId(value)) {
    throw new Error(`unknown agent ${value}. Available agents: ${listAgentIds().join(', ')}`);
  }
  return value;
}

function parseSeed(value: string | boolean): string | number {
  if (typeof value !== 'string') return 1;
  const numeric = Number(value);
  return Number.isInteger(numeric) && String(numeric) === value ? numeric : value;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function printHelp(): void {
  console.log(`D20bench CLI

Commands:
  d20bench scenario list
  d20bench scenario run <scenario-id> --seed 1 [--out result.json]
  d20bench scenario verify <replay.jsonl>
  d20bench match run --scenario <id> --red <agent> --blue <agent> --seed 1 [--out dir]
  d20bench ladder run [--out results/seasons/smoke-v0]

Agents:
  ${listAgentIds().join('\n  ')}
`);
}

void main();
