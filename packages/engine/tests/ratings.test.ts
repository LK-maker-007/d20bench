import { describe, expect, it } from 'vitest';

import { renderEloSeasonMarkdown, runEloSeason, smokeSeason } from '../src/index.js';

describe('Elo ratings', () => {
  it('produces standings from baseline agent fights', () => {
    const result = runEloSeason(smokeSeason, '2026-06-20T00:00:00.000Z');

    expect(result.seasonId).toBe('smoke-v0');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.standings).toHaveLength(smokeSeason.agents.length);
    expect(result.standings[0].matches).toBeGreaterThan(0);
    expect(new Set(result.standings.map((standing) => standing.rating)).size).toBeGreaterThan(1);
    expect(renderEloSeasonMarkdown(result)).toContain('| Rank | Agent | Elo |');
  });
});
