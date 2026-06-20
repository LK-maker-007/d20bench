import { listBattlecastTacticAgentIds, type AgentId } from './agents.js';
import type { EloSeasonConfig } from './ratings.js';
import { goblinDuelScenario } from './scenarios/public/goblin-duel.js';
import { goblinWarbandMirrorScenario } from './scenarios/public/goblin-squad.js';
import {
  balancedHeroMirrorScenario,
  chokeControlHeroMirrorScenario,
  statusPressureHeroMirrorScenario,
} from './scenarios/public/hero-party-mirrors.js';

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

const publicBaselineAgents: AgentId[] = [
  'baseline.random-legal',
  'baseline.nearest',
  'baseline.focus-fire',
  'baseline.expected-damage',
  ...listBattlecastTacticAgentIds(),
];

export const publicBaselineSeason: EloSeasonConfig = {
  id: 'public-baseline-v0',
  description: 'Baseline Elo season across non-duel public D20bench battle types, including D20bench simple baselines and copied Battlecast tactic agents.',
  agents: publicBaselineAgents,
  scenarios: [
    goblinWarbandMirrorScenario,
    balancedHeroMirrorScenario,
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: [1, 2],
  initialRating: 1000,
  kFactor: 32,
};

export const seasons = [
  publicBaselineSeason,
  smokeSeason,
];

export function getSeasonById(id: string): EloSeasonConfig {
  const season = seasons.find((candidate) => candidate.id === id);
  if (!season) {
    throw new Error(`unknown season: ${id}. Available seasons: ${seasons.map((candidate) => candidate.id).join(', ')}`);
  }
  return season;
}
