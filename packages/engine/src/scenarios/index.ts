export * from './public/goblin-duel.js';
export * from './public/goblin-squad.js';
export * from './public/hero-party-mirrors.js';

import { goblinDuelScenario } from './public/goblin-duel.js';
import { goblinWarbandMirrorScenario } from './public/goblin-squad.js';
import {
  balancedHeroMirrorScenario,
  chokeControlHeroMirrorScenario,
  statusPressureHeroMirrorScenario,
} from './public/hero-party-mirrors.js';
import type { D20benchScenario, ScenarioVisibility } from '../scenario.js';

export const scenarios: D20benchScenario[] = [
  goblinDuelScenario,
  goblinWarbandMirrorScenario,
  balancedHeroMirrorScenario,
  chokeControlHeroMirrorScenario,
  statusPressureHeroMirrorScenario,
];

export function getScenarioById(id: string): D20benchScenario {
  const scenario = scenarios.find((candidate) => candidate.id === id);
  if (!scenario) {
    throw new Error(`unknown scenario: ${id}`);
  }
  return scenario;
}

export function listScenarios(visibility?: ScenarioVisibility): D20benchScenario[] {
  return scenarios.filter((scenario) => !visibility || scenario.visibility === visibility);
}
