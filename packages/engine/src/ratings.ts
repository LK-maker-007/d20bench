import type { AgentId } from './agents.js';
import { type AgentMatchResult, runAgentMatch } from './agent-match.js';
import type { BattleType, D20benchScenario } from './scenario.js';

export interface EloSeasonConfig {
  id: string;
  description: string;
  agents: AgentId[];
  scenarios: D20benchScenario[];
  seeds: Array<string | number>;
  initialRating?: number;
  kFactor?: number;
}

export interface EloStanding {
  agentId: AgentId;
  rating: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  score: number;
}

export interface EloSeasonResult {
  seasonId: string;
  description: string;
  generatedAt: string;
  initialRating: number;
  kFactor: number;
  standings: EloStanding[];
  battleTypeStandings: Array<{
    battleType: BattleType;
    standings: EloStanding[];
  }>;
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
  }>;
}

export function runEloSeason(config: EloSeasonConfig, generatedAt = new Date().toISOString()): EloSeasonResult {
  const initialRating = config.initialRating ?? 1000;
  const kFactor = config.kFactor ?? 32;
  const overallPool = createRatingPool(config.agents, initialRating);
  const battleTypePools = new Map<BattleType, RatingPool>();
  const matches: EloSeasonResult['matches'] = [];

  for (const scenario of config.scenarios) {
    const battleTypePool = getBattleTypePool(battleTypePools, scenario.battleType, config.agents, initialRating);
    for (const seed of config.seeds) {
      for (const redAgent of config.agents) {
        for (const blueAgent of config.agents) {
          if (redAgent === blueAgent) continue;
          const match = runAgentMatch({ scenario, seed, redAgent, blueAgent });
          const overallRatings = applyMatchRating({
            pool: overallPool,
            redAgent,
            blueAgent,
            redScore: match.redScore,
            blueScore: match.blueScore,
            initialRating,
            kFactor,
          });
          const battleTypeRatings = applyMatchRating({
            pool: battleTypePool,
            redAgent,
            blueAgent,
            redScore: match.redScore,
            blueScore: match.blueScore,
            initialRating,
            kFactor,
          });
          matches.push({
            matchId: match.matchId,
            scenarioId: match.scenarioId,
            battleType: scenario.battleType,
            seed: match.seed,
            redAgent,
            blueAgent,
            winner: match.winner,
            redScore: match.redScore,
            blueScore: match.blueScore,
            redRatingBefore: overallRatings.redBefore,
            blueRatingBefore: overallRatings.blueBefore,
            redRatingAfter: overallRatings.redAfter,
            blueRatingAfter: overallRatings.blueAfter,
            redBattleTypeRatingBefore: battleTypeRatings.redBefore,
            blueBattleTypeRatingBefore: battleTypeRatings.blueBefore,
            redBattleTypeRatingAfter: battleTypeRatings.redAfter,
            blueBattleTypeRatingAfter: battleTypeRatings.blueAfter,
            finalStateHash: match.finalStateHash,
          });
        }
      }
    }
  }

  return {
    seasonId: config.id,
    description: config.description,
    generatedAt,
    initialRating,
    kFactor,
    standings: finalizeStandings(overallPool),
    battleTypeStandings: [...battleTypePools.entries()].map(([battleType, pool]) => ({
      battleType,
      standings: finalizeStandings(pool),
    })),
    matches,
  };
}

export function renderEloSeasonMarkdown(result: EloSeasonResult): string {
  const lines = [
    `# ${result.seasonId} Elo Standings`,
    '',
    result.description,
    '',
    `Generated: ${result.generatedAt}`,
    `Initial rating: ${result.initialRating}`,
    `K-factor: ${result.kFactor}`,
    '',
    '## Blended Overall Standings',
    '',
    ...renderStandingsTable(result.standings),
    '',
    '## Battle-Type Standings',
    '',
    ...result.battleTypeStandings.flatMap(({ battleType, standings }) => [
      `### ${battleType}`,
      '',
      ...renderStandingsTable(standings),
      '',
    ]),
    '## Matches',
    '',
    '| Match | Battle Type | Scenario | Seed | Red | Blue | Winner | Overall Change | Battle-Type Change | Hash |',
    '| --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |',
    ...result.matches.map((match) => {
      const redDelta = match.redRatingAfter - match.redRatingBefore;
      const blueDelta = match.blueRatingAfter - match.blueRatingBefore;
      const redTypeDelta = match.redBattleTypeRatingAfter - match.redBattleTypeRatingBefore;
      const blueTypeDelta = match.blueBattleTypeRatingAfter - match.blueBattleTypeRatingBefore;
      return `| ${match.matchId} | ${match.battleType} | ${match.scenarioId} | ${match.seed} | ${match.redAgent} | ${match.blueAgent} | ${match.winner ?? 'null'} | R ${formatDelta(redDelta)} / B ${formatDelta(blueDelta)} | R ${formatDelta(redTypeDelta)} / B ${formatDelta(blueTypeDelta)} | \`${match.finalStateHash.slice(0, 12)}\` |`;
    }),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

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
  const redExpected = expectedScore(redBefore, blueBefore);
  const blueExpected = expectedScore(blueBefore, redBefore);
  const redAfter = redBefore + input.kFactor * (input.redScore - redExpected);
  const blueAfter = blueBefore + input.kFactor * (input.blueScore - blueExpected);
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

function renderStandingsTable(standings: EloStanding[]): string[] {
  return [
    '| Rank | Agent | Elo | Matches | W-L-D | Score |',
    '| ---: | --- | ---: | ---: | ---: | ---: |',
    ...standings.map((standing, index) =>
      `| ${index + 1} | ${standing.agentId} | ${standing.rating.toFixed(1)} | ${standing.matches} | ${standing.wins}-${standing.losses}-${standing.draws} | ${standing.score.toFixed(1)} |`
    ),
  ];
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

function formatDelta(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`;
}
