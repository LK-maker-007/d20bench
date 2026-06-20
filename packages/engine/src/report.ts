import type { AgentId } from './agents.js';
import type { AgentMatchResult } from './agent-match.js';

export interface AgentRecord {
  agentId: AgentId;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  score: number;
  winRate: number;
}

export interface MatchReport {
  generatedAt: string;
  matches: Array<{
    matchId: string;
    scenarioId: string;
    seed: string | number;
    redAgent: AgentId;
    blueAgent: AgentId;
    winner: AgentMatchResult['winner'];
    redScore: number;
    blueScore: number;
    finalStateHash: string;
  }>;
  records: AgentRecord[];
}

export function buildMatchReport(results: AgentMatchResult[], generatedAt = new Date().toISOString()): MatchReport {
  const records = new Map<AgentId, AgentRecord>();

  for (const result of results) {
    applyRecord(records, result.redAgent, result.redScore);
    applyRecord(records, result.blueAgent, result.blueScore);
  }

  return {
    generatedAt,
    matches: results.map((result) => ({
      matchId: result.matchId,
      scenarioId: result.scenarioId,
      seed: result.seed,
      redAgent: result.redAgent,
      blueAgent: result.blueAgent,
      winner: result.winner,
      redScore: result.redScore,
      blueScore: result.blueScore,
      finalStateHash: result.finalStateHash,
    })),
    records: [...records.values()].sort((left, right) =>
      right.score - left.score ||
      right.winRate - left.winRate ||
      left.agentId.localeCompare(right.agentId)
    ),
  };
}

export function renderMatchReportMarkdown(report: MatchReport): string {
  const lines = [
    '# D20bench Match Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Agent Records',
    '',
    '| Agent | Matches | W-L-D | Score | Win Rate |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...report.records.map((record) =>
      `| ${record.agentId} | ${record.matches} | ${record.wins}-${record.losses}-${record.draws} | ${record.score.toFixed(1)} | ${(record.winRate * 100).toFixed(1)}% |`
    ),
    '',
    '## Matches',
    '',
    '| Match | Scenario | Seed | Red | Blue | Winner | Final Hash |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...report.matches.map((match) =>
      `| ${match.matchId} | ${match.scenarioId} | ${match.seed} | ${match.redAgent} | ${match.blueAgent} | ${match.winner ?? 'null'} | \`${match.finalStateHash.slice(0, 12)}\` |`
    ),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function applyRecord(records: Map<AgentId, AgentRecord>, agentId: AgentId, score: number): void {
  const record = records.get(agentId) ?? {
    agentId,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    score: 0,
    winRate: 0,
  };

  record.matches += 1;
  record.score += score;
  if (score === 1) record.wins += 1;
  else if (score === 0) record.losses += 1;
  else record.draws += 1;
  record.winRate = record.matches === 0 ? 0 : record.score / record.matches;
  records.set(agentId, record);
}
