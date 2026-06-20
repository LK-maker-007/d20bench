import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { runAgentMatchAsync, type AgentMatchResult } from './agent-match.js';
import {
  createOpenRouterAgentId,
  listBattlecastTacticAgentIds,
  type AgentId,
  type OpenRouterAgentId,
} from './agents.js';
import { loadLocalEnv } from './env.js';
import type { EloStanding } from './ratings.js';
import type { BattleType, D20benchScenario } from './scenario.js';
import { goblinDuelScenario } from './scenarios/public/goblin-duel.js';
import { goblinWarbandMirrorScenario } from './scenarios/public/goblin-squad.js';
import {
  balancedHeroMirrorScenario,
  chokeControlHeroMirrorScenario,
  statusPressureHeroMirrorScenario,
} from './scenarios/public/hero-party-mirrors.js';

export interface LlmSeasonConfig {
  id: string;
  description: string;
  agents: AgentId[];
  scenarios: D20benchScenario[];
  seeds: Array<string | number>;
  maxRounds: number;
  initialRating?: number;
  kFactor?: number;
  concurrency?: number;
}

export interface LlmSeasonRunOptions {
  generatedAt?: string;
  outDir?: string;
  concurrency?: number;
  matchLimit?: number;
  maxCostUsd?: number;
  logProgress?: boolean;
  onProgress?: (progress: LlmSeasonProgress) => void | Promise<void>;
}

export interface OpenRouterModelPricing {
  model: string;
  prompt?: number;
  completion?: number;
}

export interface LlmModelCostSummary {
  agentId: AgentId;
  model: string;
  decisions: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface LlmSeasonCostSummary {
  totalDecisions: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  byModel: LlmModelCostSummary[];
}

export type LlmSeasonProgressStatus = 'running' | 'complete' | 'failed' | 'stopped';
export type LlmSeasonMatchProgressStatus = 'running' | 'completed' | 'failed';

export interface LlmSeasonMatchProgress {
  index: number;
  status: LlmSeasonMatchProgressStatus;
  scenarioId: string;
  battleType: BattleType;
  seed: string | number;
  redAgent: AgentId;
  blueAgent: AgentId;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  matchId?: string;
  winner?: AgentMatchResult['winner'];
  llmDecisions?: number;
  estimatedCostUsd?: number;
  finalStateHash?: string;
  error?: string;
}

export interface LlmSeasonFailure {
  index: number;
  scenarioId: string;
  battleType: BattleType;
  seed: string | number;
  redAgent: AgentId;
  blueAgent: AgentId;
  error: string;
}

export interface LlmSeasonProgress {
  seasonId: string;
  description: string;
  status: LlmSeasonProgressStatus;
  startedAt: string;
  updatedAt: string;
  concurrency: number;
  maxRounds: number;
  totalMatches: number;
  completedMatches: number;
  failedMatches: number;
  runningMatches: number;
  stopReason?: string;
  costSummary: LlmSeasonCostSummary;
  activeMatches: LlmSeasonMatchProgress[];
  recentMatches: LlmSeasonMatchProgress[];
  failures: LlmSeasonFailure[];
}

export interface LlmSeasonResult {
  seasonId: string;
  description: string;
  generatedAt: string;
  startedAt: string;
  completedAt: string;
  initialRating: number;
  kFactor: number;
  maxRounds: number;
  concurrency: number;
  totalMatches: number;
  completedMatches: number;
  failedMatches: number;
  stopReason?: string;
  standings: EloStanding[];
  battleTypeStandings: Array<{
    battleType: BattleType;
    standings: EloStanding[];
  }>;
  costSummary: LlmSeasonCostSummary;
  failures: LlmSeasonFailure[];
  matches: Array<{
    matchId: string;
    scenarioId: string;
    battleType: BattleType;
    seed: string | number;
    redAgent: AgentId;
    blueAgent: AgentId;
    winner: AgentMatchResult['winner'];
    redScore: number;
    blueScore: number;
    redRatingBefore: number;
    blueRatingBefore: number;
    redRatingAfter: number;
    blueRatingAfter: number;
    redBattleTypeRatingBefore: number;
    blueBattleTypeRatingBefore: number;
    redBattleTypeRatingAfter: number;
    blueBattleTypeRatingAfter: number;
    finalStateHash: string;
    llmDecisions: number;
    estimatedCostUsd: number;
  }>;
}

export const llmSmokeModelAgents: OpenRouterAgentId[] = [
  createOpenRouterAgentId('moonshotai/kimi-k2.7-code'),
  createOpenRouterAgentId('z-ai/glm-5.2'),
  createOpenRouterAgentId('deepseek/deepseek-v4-pro'),
  createOpenRouterAgentId('deepseek/deepseek-v4-flash'),
  createOpenRouterAgentId('qwen/qwen3.5-flash-02-23'),
  createOpenRouterAgentId('mistralai/ministral-8b-2512'),
  createOpenRouterAgentId('meta-llama/llama-3.1-8b-instruct'),
];

export const llmFrontierModelAgents: OpenRouterAgentId[] = [
  createOpenRouterAgentId('anthropic/claude-opus-4.8'),
  createOpenRouterAgentId('google/gemini-3.1-pro-preview'),
  createOpenRouterAgentId('openai/gpt-5.5'),
  ...llmSmokeModelAgents,
];

export const llmSmokeSeason: LlmSeasonConfig = {
  id: 'llm-smoke-v0',
  description: 'First bounded LLM smoke season on the public goblin duel, using latest Kimi, GLM 5.2, latest DeepSeek, and cheap smaller OpenRouter models.',
  agents: [
    ...llmSmokeModelAgents,
    'baseline.focus-fire',
  ],
  scenarios: [goblinDuelScenario],
  seeds: [1],
  maxRounds: 3,
  initialRating: 1000,
  kFactor: 32,
  concurrency: 3,
};

export const llmFrontierPublicSeason: LlmSeasonConfig = {
  id: 'llm-frontier-public-v1',
  description: 'Public LLM ladder across the 6v6 goblin control and three level-5 4v4 hero-party mirrors, adding latest available Opus, Gemini 3.1 Pro, GPT-5.5, cheap models, random, focus-fire, and copied Battlecast tactic agents.',
  agents: [
    ...llmFrontierModelAgents,
    'baseline.focus-fire',
    'baseline.random-legal',
    ...listBattlecastTacticAgentIds(),
  ],
  scenarios: [
    goblinWarbandMirrorScenario,
    balancedHeroMirrorScenario,
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: [1],
  maxRounds: 4,
  initialRating: 1000,
  kFactor: 32,
  concurrency: 6,
};

export const llmSeasons = [
  llmFrontierPublicSeason,
  llmSmokeSeason,
];

export function getLlmSeasonById(id: string): LlmSeasonConfig {
  const season = llmSeasons.find((candidate) => candidate.id === id);
  if (!season) {
    throw new Error(`unknown LLM season: ${id}. Available LLM seasons: ${llmSeasons.map((candidate) => candidate.id).join(', ')}`);
  }
  return season;
}

export async function runLlmSeason(
  config: LlmSeasonConfig,
  options: LlmSeasonRunOptions | string = {},
): Promise<LlmSeasonResult> {
  const runOptions: LlmSeasonRunOptions = typeof options === 'string' ? { generatedAt: options } : options;
  const generatedAt = runOptions.generatedAt ?? new Date().toISOString();
  const startedAt = new Date().toISOString();
  const initialRating = config.initialRating ?? 1000;
  const kFactor = config.kFactor ?? 32;
  const pricing = await loadOpenRouterPricing();
  const allFixtures = createLlmMatchFixtures(config);
  const fixtures = typeof runOptions.matchLimit === 'number'
    ? allFixtures.slice(0, runOptions.matchLimit)
    : allFixtures;
  const concurrency = normalizeConcurrency(runOptions.concurrency ?? config.concurrency, fixtures.length);
  const progressPath = runOptions.outDir ? join(runOptions.outDir, 'progress.json') : undefined;
  const costAccumulators = new Map<string, LlmModelCostSummary>();
  const outcomes: Array<LlmMatchOutcome | undefined> = Array(fixtures.length).fill(undefined);
  const activeMatches = new Map<number, LlmSeasonMatchProgress>();
  const recentMatches: LlmSeasonMatchProgress[] = [];
  const failures: LlmSeasonFailure[] = [];
  let completedMatches = 0;
  let failedMatches = 0;
  let runningMatches = 0;
  let nextFixtureIndex = 0;
  let progressSequence = 0;
  let progressWriteChain = Promise.resolve();
  let stopReason: string | undefined;

  const emitProgress = async (status: LlmSeasonProgressStatus): Promise<void> => {
    const progress = buildProgress({
      config,
      status,
      startedAt,
      concurrency,
      totalMatches: fixtures.length,
      completedMatches,
      failedMatches,
      runningMatches,
      stopReason,
      costSummary: finalizeCostSummary(costAccumulators),
      activeMatches: [...activeMatches.values()],
      recentMatches,
      failures,
    });
    const sequence = progressSequence;
    progressSequence += 1;
    progressWriteChain = progressWriteChain.then(async () => {
      if (progressPath) {
        await writeJsonAtomic(progressPath, progress, sequence);
      }
      await runOptions.onProgress?.(progress);
    });
    await progressWriteChain;
  };

  await emitProgress('running');

  const runWorker = async (): Promise<void> => {
    while (true) {
      if (runOptions.maxCostUsd !== undefined && finalizeCostSummary(costAccumulators).estimatedCostUsd >= runOptions.maxCostUsd) {
        stopReason = stopReason ?? `estimated cost reached $${runOptions.maxCostUsd.toFixed(2)}`;
        return;
      }
      const fixture = fixtures[nextFixtureIndex];
      nextFixtureIndex += 1;
      if (!fixture) return;

      const matchStartedAt = new Date();
      activeMatches.set(fixture.index, {
        index: fixture.index,
        status: 'running',
        scenarioId: fixture.scenario.id,
        battleType: fixture.scenario.battleType,
        seed: fixture.seed,
        redAgent: fixture.redAgent,
        blueAgent: fixture.blueAgent,
        startedAt: matchStartedAt.toISOString(),
      });
      runningMatches += 1;
      await emitProgress('running');

      try {
        const match = await runAgentMatchAsync({
          scenario: fixture.scenario,
          seed: fixture.seed,
          redAgent: fixture.redAgent,
          blueAgent: fixture.blueAgent,
          maxRounds: config.maxRounds,
        });
        const matchCost = summarizeMatchCost(match, pricing, costAccumulators);
        const completedAt = new Date();
        const progressMatch: LlmSeasonMatchProgress = {
          index: fixture.index,
          status: 'completed',
          scenarioId: fixture.scenario.id,
          battleType: fixture.scenario.battleType,
          seed: match.seed,
          redAgent: fixture.redAgent,
          blueAgent: fixture.blueAgent,
          startedAt: matchStartedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs: completedAt.getTime() - matchStartedAt.getTime(),
          matchId: match.matchId,
          winner: match.winner,
          llmDecisions: matchCost.decisions,
          estimatedCostUsd: matchCost.estimatedCostUsd,
          finalStateHash: match.finalStateHash,
        };
        outcomes[fixture.index] = {
          status: 'completed',
          fixture,
          match,
          matchCost,
        };
        completedMatches += 1;
        pushRecentMatch(recentMatches, progressMatch);
        if (runOptions.logProgress) {
          console.log(formatMatchProgressLine(config.id, completedMatches, failedMatches, fixtures.length, progressMatch, finalizeCostSummary(costAccumulators)));
        }
      } catch (error) {
        const completedAt = new Date();
        const failure: LlmSeasonFailure = {
          index: fixture.index,
          scenarioId: fixture.scenario.id,
          battleType: fixture.scenario.battleType,
          seed: fixture.seed,
          redAgent: fixture.redAgent,
          blueAgent: fixture.blueAgent,
          error: stringifyError(error),
        };
        const progressMatch: LlmSeasonMatchProgress = {
          ...failure,
          status: 'failed',
          startedAt: matchStartedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs: completedAt.getTime() - matchStartedAt.getTime(),
        };
        outcomes[fixture.index] = {
          status: 'failed',
          fixture,
          failure,
        };
        failures.push(failure);
        failedMatches += 1;
        pushRecentMatch(recentMatches, progressMatch);
        if (runOptions.logProgress) {
          console.error(`[${config.id}] match ${completedMatches + failedMatches}/${fixtures.length} failed: ${fixture.redAgent} vs ${fixture.blueAgent}: ${failure.error}`);
        }
      } finally {
        activeMatches.delete(fixture.index);
        runningMatches -= 1;
        await emitProgress('running');
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => runWorker()));

  const overallPool = createRatingPool(config.agents, initialRating);
  const battleTypePools = new Map<BattleType, RatingPool>();
  const matches: LlmSeasonResult['matches'] = [];

  for (const outcome of outcomes) {
    if (!outcome || outcome.status !== 'completed') continue;
    const battleTypePool = getBattleTypePool(battleTypePools, outcome.fixture.scenario.battleType, config.agents, initialRating);
    const overallRatings = applyMatchRating({
      pool: overallPool,
      redAgent: outcome.fixture.redAgent,
      blueAgent: outcome.fixture.blueAgent,
      redScore: outcome.match.redScore,
      blueScore: outcome.match.blueScore,
      initialRating,
      kFactor,
    });
    const battleTypeRatings = applyMatchRating({
      pool: battleTypePool,
      redAgent: outcome.fixture.redAgent,
      blueAgent: outcome.fixture.blueAgent,
      redScore: outcome.match.redScore,
      blueScore: outcome.match.blueScore,
      initialRating,
      kFactor,
    });

    matches.push({
      matchId: outcome.match.matchId,
      scenarioId: outcome.match.scenarioId,
      battleType: outcome.fixture.scenario.battleType,
      seed: outcome.match.seed,
      redAgent: outcome.fixture.redAgent,
      blueAgent: outcome.fixture.blueAgent,
      winner: outcome.match.winner,
      redScore: outcome.match.redScore,
      blueScore: outcome.match.blueScore,
      redRatingBefore: overallRatings.redBefore,
      blueRatingBefore: overallRatings.blueBefore,
      redRatingAfter: overallRatings.redAfter,
      blueRatingAfter: overallRatings.blueAfter,
      redBattleTypeRatingBefore: battleTypeRatings.redBefore,
      blueBattleTypeRatingBefore: battleTypeRatings.blueBefore,
      redBattleTypeRatingAfter: battleTypeRatings.redAfter,
      blueBattleTypeRatingAfter: battleTypeRatings.blueAfter,
      finalStateHash: outcome.match.finalStateHash,
      llmDecisions: outcome.matchCost.decisions,
      estimatedCostUsd: outcome.matchCost.estimatedCostUsd,
    });
  }

  const result: LlmSeasonResult = {
    seasonId: config.id,
    description: config.description,
    generatedAt,
    startedAt,
    completedAt: new Date().toISOString(),
    initialRating,
    kFactor,
    maxRounds: config.maxRounds,
    concurrency,
    totalMatches: fixtures.length,
    completedMatches,
    failedMatches,
    stopReason,
    standings: finalizeStandings(overallPool),
    battleTypeStandings: [...battleTypePools.entries()].map(([battleType, pool]) => ({
      battleType,
      standings: finalizeStandings(pool),
    })),
    costSummary: finalizeCostSummary(costAccumulators),
    failures,
    matches,
  };

  await emitProgress(stopReason ? 'stopped' : 'complete');
  return result;
}

export function renderLlmSeasonMarkdown(result: LlmSeasonResult): string {
  const lines = [
    `# ${result.seasonId} LLM Elo Smoke Season`,
    '',
    result.description,
    '',
    `Generated: ${result.generatedAt}`,
    `Completed: ${result.completedAt}`,
    `Concurrency: ${result.concurrency}`,
    `Max rounds: ${result.maxRounds}`,
    `Initial rating: ${result.initialRating}`,
    `K-factor: ${result.kFactor}`,
    `Matches: ${result.completedMatches}/${result.totalMatches} completed${result.failedMatches ? `, ${result.failedMatches} failed` : ''}`,
    ...(result.stopReason ? [`Stopped: ${result.stopReason}`] : []),
    '',
    '## Standings',
    '',
    '| Rank | Agent | Elo | Matches | W-L-D | Score |',
    '| ---: | --- | ---: | ---: | ---: | ---: |',
    ...result.standings.map((standing, index) =>
      `| ${index + 1} | ${standing.agentId} | ${standing.rating.toFixed(1)} | ${standing.matches} | ${standing.wins}-${standing.losses}-${standing.draws} | ${standing.score.toFixed(1)} |`
    ),
    '',
    '## Cost Summary',
    '',
    `Estimated total cost: $${result.costSummary.estimatedCostUsd.toFixed(6)}`,
    `LLM decisions: ${result.costSummary.totalDecisions}`,
    `Tokens: ${result.costSummary.totalTokens} total (${result.costSummary.promptTokens} prompt, ${result.costSummary.completionTokens} completion)`,
    '',
    '| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...result.costSummary.byModel.map((entry) =>
      `| ${entry.agentId} | ${entry.decisions} | ${entry.promptTokens} | ${entry.completionTokens} | ${entry.totalTokens} | $${entry.estimatedCostUsd.toFixed(6)} |`
    ),
    '',
    ...(result.failures.length ? [
      '## Failed Matches',
      '',
      '| Index | Scenario | Seed | Red | Blue | Error |',
      '| ---: | --- | --- | --- | --- | --- |',
      ...result.failures.map((failure) =>
        `| ${failure.index} | ${failure.scenarioId} | ${failure.seed} | ${failure.redAgent} | ${failure.blueAgent} | ${failure.error.replace(/\|/g, '\\|')} |`
      ),
      '',
    ] : []),
    '## Matches',
    '',
    '| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |',
    '| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |',
    ...result.matches.map((match) =>
      `| ${match.matchId} | ${match.scenarioId} | ${match.seed} | ${match.redAgent} | ${match.blueAgent} | ${match.winner ?? 'null'} | ${match.llmDecisions} | $${match.estimatedCostUsd.toFixed(6)} | \`${match.finalStateHash.slice(0, 12)}\` |`
    ),
    '',
  ];

  return `${lines.join('\n')}\n`;
}

interface LlmMatchFixture {
  index: number;
  scenario: D20benchScenario;
  seed: string | number;
  redAgent: AgentId;
  blueAgent: AgentId;
}

type LlmMatchOutcome =
  | {
      status: 'completed';
      fixture: LlmMatchFixture;
      match: AgentMatchResult;
      matchCost: { decisions: number; estimatedCostUsd: number };
    }
  | {
      status: 'failed';
      fixture: LlmMatchFixture;
      failure: LlmSeasonFailure;
    };

interface RatingPool {
  ratings: Map<AgentId, number>;
  standings: Map<AgentId, EloStanding>;
}

interface MatchRatingInput {
  pool: RatingPool;
  redAgent: AgentId;
  blueAgent: AgentId;
  redScore: number;
  blueScore: number;
  initialRating: number;
  kFactor: number;
}

interface MatchRatingResult {
  redBefore: number;
  blueBefore: number;
  redAfter: number;
  blueAfter: number;
}

function createLlmMatchFixtures(config: LlmSeasonConfig): LlmMatchFixture[] {
  const fixtures: LlmMatchFixture[] = [];
  for (const scenario of config.scenarios) {
    for (const seed of config.seeds) {
      for (const redAgent of config.agents) {
        for (const blueAgent of config.agents) {
          if (redAgent === blueAgent) continue;
          fixtures.push({
            index: fixtures.length,
            scenario,
            seed,
            redAgent,
            blueAgent,
          });
        }
      }
    }
  }
  return fixtures;
}

function buildProgress(input: {
  config: LlmSeasonConfig;
  status: LlmSeasonProgressStatus;
  startedAt: string;
  concurrency: number;
  totalMatches: number;
  completedMatches: number;
  failedMatches: number;
  runningMatches: number;
  stopReason: string | undefined;
  costSummary: LlmSeasonCostSummary;
  activeMatches: LlmSeasonMatchProgress[];
  recentMatches: LlmSeasonMatchProgress[];
  failures: LlmSeasonFailure[];
}): LlmSeasonProgress {
  return {
    seasonId: input.config.id,
    description: input.config.description,
    status: input.status,
    startedAt: input.startedAt,
    updatedAt: new Date().toISOString(),
    concurrency: input.concurrency,
    maxRounds: input.config.maxRounds,
    totalMatches: input.totalMatches,
    completedMatches: input.completedMatches,
    failedMatches: input.failedMatches,
    runningMatches: input.runningMatches,
    stopReason: input.stopReason,
    costSummary: input.costSummary,
    activeMatches: [...input.activeMatches].sort((left, right) => left.index - right.index),
    recentMatches: [...input.recentMatches].slice(-20).reverse(),
    failures: [...input.failures],
  };
}

async function loadOpenRouterPricing(): Promise<Map<string, OpenRouterModelPricing>> {
  loadLocalEnv();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing. Put it in .env.local.');
  }

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`OpenRouter model pricing request failed (${res.status})`);
  }
  const body = await res.json() as { data?: Array<{ id: string; pricing?: Record<string, string> }> };
  return new Map((body.data ?? []).map((model) => [
    model.id,
    {
      model: model.id,
      prompt: numberOrUndefined(model.pricing?.prompt),
      completion: numberOrUndefined(model.pricing?.completion),
    },
  ]));
}

function summarizeMatchCost(
  match: AgentMatchResult,
  pricing: Map<string, OpenRouterModelPricing>,
  accumulators: Map<string, LlmModelCostSummary>,
): { decisions: number; estimatedCostUsd: number } {
  let decisions = 0;
  let estimatedCostUsd = 0;

  for (const event of match.replay) {
    if (event.type !== 'action_resolved' || !event.llmTrace) continue;
    const model = event.llmTrace.model;
    const agentId = event.agentId;
    const usage = event.llmTrace.usage;
    const promptTokens = usage?.promptTokens ?? 0;
    const completionTokens = usage?.completionTokens ?? 0;
    const totalTokens = usage?.totalTokens ?? promptTokens + completionTokens;
    const modelPricing = pricing.get(model) ?? pricing.get(event.llmTrace.responseModel ?? '');
    const cost = estimateCost(promptTokens, completionTokens, modelPricing);
    const current = accumulators.get(agentId) ?? {
      agentId,
      model,
      decisions: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    };

    decisions += 1;
    estimatedCostUsd += cost;
    current.decisions += 1;
    current.promptTokens += promptTokens;
    current.completionTokens += completionTokens;
    current.totalTokens += totalTokens;
    current.estimatedCostUsd += cost;
    accumulators.set(agentId, current);
  }

  return { decisions, estimatedCostUsd };
}

function finalizeCostSummary(accumulators: Map<string, LlmModelCostSummary>): LlmSeasonCostSummary {
  const byModel = [...accumulators.values()].sort((left, right) =>
    right.estimatedCostUsd - left.estimatedCostUsd || left.agentId.localeCompare(right.agentId)
  );
  return {
    totalDecisions: byModel.reduce((sum, entry) => sum + entry.decisions, 0),
    promptTokens: byModel.reduce((sum, entry) => sum + entry.promptTokens, 0),
    completionTokens: byModel.reduce((sum, entry) => sum + entry.completionTokens, 0),
    totalTokens: byModel.reduce((sum, entry) => sum + entry.totalTokens, 0),
    estimatedCostUsd: byModel.reduce((sum, entry) => sum + entry.estimatedCostUsd, 0),
    byModel,
  };
}

function createRatingPool(agents: AgentId[], initialRating: number): RatingPool {
  const ratings = new Map<AgentId, number>();
  const standings = new Map<AgentId, EloStanding>();

  for (const agent of agents) {
    ratings.set(agent, initialRating);
    standings.set(agent, {
      agentId: agent,
      rating: initialRating,
      matches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      score: 0,
    });
  }

  return { ratings, standings };
}

function getBattleTypePool(
  pools: Map<BattleType, RatingPool>,
  battleType: BattleType,
  agents: AgentId[],
  initialRating: number,
): RatingPool {
  let pool = pools.get(battleType);
  if (!pool) {
    pool = createRatingPool(agents, initialRating);
    pools.set(battleType, pool);
  }
  return pool;
}

function applyMatchRating(input: MatchRatingInput): MatchRatingResult {
  const redBefore = input.pool.ratings.get(input.redAgent) ?? input.initialRating;
  const blueBefore = input.pool.ratings.get(input.blueAgent) ?? input.initialRating;
  const redAfter = redBefore + input.kFactor * (input.redScore - expectedScore(redBefore, blueBefore));
  const blueAfter = blueBefore + input.kFactor * (input.blueScore - expectedScore(blueBefore, redBefore));

  input.pool.ratings.set(input.redAgent, redAfter);
  input.pool.ratings.set(input.blueAgent, blueAfter);
  updateStanding(input.pool.standings.get(input.redAgent)!, input.redScore, redAfter);
  updateStanding(input.pool.standings.get(input.blueAgent)!, input.blueScore, blueAfter);

  return { redBefore, blueBefore, redAfter, blueAfter };
}

function finalizeStandings(pool: RatingPool): EloStanding[] {
  return [...pool.standings.values()]
    .map((standing) => ({ ...standing, rating: pool.ratings.get(standing.agentId) ?? standing.rating }))
    .sort((left, right) => right.rating - left.rating || left.agentId.localeCompare(right.agentId));
}

function estimateCost(
  promptTokens: number,
  completionTokens: number,
  pricing: OpenRouterModelPricing | undefined,
): number {
  if (!pricing) return 0;
  return promptTokens * (pricing.prompt ?? 0) + completionTokens * (pricing.completion ?? 0);
}

function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

function updateStanding(standing: EloStanding, score: number, rating: number): void {
  standing.matches += 1;
  standing.score += score;
  standing.rating = rating;
  if (score === 1) standing.wins += 1;
  else if (score === 0) standing.losses += 1;
  else standing.draws += 1;
}

async function writeJsonAtomic(path: string, value: unknown, sequence: number): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmpPath = `${path}.${sequence}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tmpPath, path);
}

function normalizeConcurrency(value: number | undefined, totalMatches: number): number {
  const requested = value ?? 3;
  if (!Number.isFinite(requested)) return 1;
  return Math.max(1, Math.min(Math.floor(requested), Math.max(1, totalMatches)));
}

function pushRecentMatch(recentMatches: LlmSeasonMatchProgress[], match: LlmSeasonMatchProgress): void {
  recentMatches.push(match);
  if (recentMatches.length > 20) {
    recentMatches.splice(0, recentMatches.length - 20);
  }
}

function formatMatchProgressLine(
  seasonId: string,
  completedMatches: number,
  failedMatches: number,
  totalMatches: number,
  match: LlmSeasonMatchProgress,
  costSummary: LlmSeasonCostSummary,
): string {
  const finishedMatches = completedMatches + failedMatches;
  const winner = match.winner ? `winner ${match.winner}` : 'no winner';
  return [
    `[${seasonId}] ${finishedMatches}/${totalMatches}`,
    `${match.redAgent} vs ${match.blueAgent}`,
    winner,
    `${match.llmDecisions ?? 0} LLM decisions`,
    `$${costSummary.estimatedCostUsd.toFixed(6)} total`,
  ].join(' | ');
}

function stringifyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > 1200 ? `${message.slice(0, 1197)}...` : message;
}

function numberOrUndefined(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
