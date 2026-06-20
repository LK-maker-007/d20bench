import type { AgentId } from './agents.js';
import { type AgentMatchResult, runAgentMatch } from './agent-match.js';
import type { D20benchScenario } from './scenario.js';

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
  matches: Array<{
    matchId: string;
    scenarioId: string;
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
    finalStateHash: string;
  }>;
}

export function runEloSeason(config: EloSeasonConfig, generatedAt = new Date().toISOString()): EloSeasonResult {
  const initialRating = config.initialRating ?? 1000;
  const kFactor = config.kFactor ?? 32;
  const ratings = new Map<AgentId, number>();
  const standings = new Map<AgentId, EloStanding>();
  const matches: EloSeasonResult['matches'] = [];

  for (const agent of config.agents) {
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

  for (const scenario of config.scenarios) {
    for (const seed of config.seeds) {
      for (const redAgent of config.agents) {
        for (const blueAgent of config.agents) {
          if (redAgent === blueAgent) continue;
          const match = runAgentMatch({ scenario, seed, redAgent, blueAgent });
          const redBefore = ratings.get(redAgent) ?? initialRating;
          const blueBefore = ratings.get(blueAgent) ?? initialRating;
          const redExpected = expectedScore(redBefore, blueBefore);
          const blueExpected = expectedScore(blueBefore, redBefore);
          const redAfter = redBefore + kFactor * (match.redScore - redExpected);
          const blueAfter = blueBefore + kFactor * (match.blueScore - blueExpected);
          ratings.set(redAgent, redAfter);
          ratings.set(blueAgent, blueAfter);
          updateStanding(standings.get(redAgent)!, match.redScore, redAfter);
          updateStanding(standings.get(blueAgent)!, match.blueScore, blueAfter);
          matches.push({
            matchId: match.matchId,
            scenarioId: match.scenarioId,
            seed: match.seed,
            redAgent,
            blueAgent,
            winner: match.winner,
            redScore: match.redScore,
            blueScore: match.blueScore,
            redRatingBefore: redBefore,
            blueRatingBefore: blueBefore,
            redRatingAfter: redAfter,
            blueRatingAfter: blueAfter,
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
    standings: [...standings.values()]
      .map((standing) => ({ ...standing, rating: ratings.get(standing.agentId) ?? standing.rating }))
      .sort((left, right) => right.rating - left.rating || left.agentId.localeCompare(right.agentId)),
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
    '## Standings',
    '',
    '| Rank | Agent | Elo | Matches | W-L-D | Score |',
    '| ---: | --- | ---: | ---: | ---: | ---: |',
    ...result.standings.map((standing, index) =>
      `| ${index + 1} | ${standing.agentId} | ${standing.rating.toFixed(1)} | ${standing.matches} | ${standing.wins}-${standing.losses}-${standing.draws} | ${standing.score.toFixed(1)} |`
    ),
    '',
    '## Matches',
    '',
    '| Match | Scenario | Seed | Red | Blue | Winner | Rating Change | Hash |',
    '| --- | --- | --- | --- | --- | --- | ---: | --- |',
    ...result.matches.map((match) => {
      const redDelta = match.redRatingAfter - match.redRatingBefore;
      const blueDelta = match.blueRatingAfter - match.blueRatingBefore;
      return `| ${match.matchId} | ${match.scenarioId} | ${match.seed} | ${match.redAgent} | ${match.blueAgent} | ${match.winner ?? 'null'} | R ${formatDelta(redDelta)} / B ${formatDelta(blueDelta)} | \`${match.finalStateHash.slice(0, 12)}\` |`;
    }),
    '',
  ];
  return `${lines.join('\n')}\n`;
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
