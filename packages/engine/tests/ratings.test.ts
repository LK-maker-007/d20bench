import { describe, expect, it } from 'vitest';

import {
  goblinDuelScenario,
  goblinWarbandMirrorScenario,
  renderEloSeasonMarkdown,
  runEloSeason,
  smokeSeason,
  type EloSeasonConfig,
} from '../src/index.js';

describe('Elo ratings', () => {
  it('produces standings from baseline agent fights', () => {
    const result = runEloSeason(smokeSeason, '2026-06-20T00:00:00.000Z');

    expect(result.seasonId).toBe('smoke-v0');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.standings).toHaveLength(smokeSeason.agents.length);
    expect(result.standings[0].matches).toBeGreaterThan(0);
    expect(new Set(result.standings.map((standing) => standing.rating)).size).toBeGreaterThan(1);
    expect(result.battleTypeStandings).toHaveLength(1);
    expect(renderEloSeasonMarkdown(result)).toContain('## Blended Overall Standings');
    expect(renderEloSeasonMarkdown(result)).toContain('## Battle-Type Standings');
  });

  it('tracks independent Elo standings per battle type', () => {
    const config: EloSeasonConfig = {
      id: 'test-battle-types',
      description: 'Tiny rating test season with multiple battle types.',
      agents: ['baseline.nearest', 'baseline.focus-fire'],
      scenarios: [goblinDuelScenario, goblinWarbandMirrorScenario],
      seeds: [1],
      initialRating: 1000,
      kFactor: 32,
    };

    const result = runEloSeason(config, '2026-06-20T00:00:00.000Z');
    const battleTypes = result.battleTypeStandings.map((entry) => entry.battleType);

    expect(battleTypes).toEqual(['duel-smoke', 'goblin-warband']);
    expect(result.matches.every((match) => battleTypes.includes(match.battleType))).toBe(true);
    expect(result.battleTypeStandings).toHaveLength(2);
    for (const entry of result.battleTypeStandings) {
      expect(entry.standings).toHaveLength(config.agents.length);
      expect(entry.standings[0].matches).toBeGreaterThan(0);
    }
  });
});
