import type { EloSeasonConfig } from './ratings.js';
import { goblinDuelScenario } from './scenarios/public/goblin-duel.js';

export const smokeSeason: EloSeasonConfig = {
  id: 'smoke-v0',
  description: 'First local Elo smoke season for baseline D20bench agents on visible public scenarios.',
  agents: [
    'baseline.random-legal',
    'baseline.nearest',
    'baseline.focus-fire',
    'baseline.expected-damage',
  ],
  scenarios: [goblinDuelScenario],
  seeds: [1, 2, 3, 4, 5],
  initialRating: 1000,
  kFactor: 32,
};
