export * from './public/goblin-duel.js';

import { goblinDuelScenario } from './public/goblin-duel.js';
import type { D20benchScenario, ScenarioVisibility } from '../scenario.js';

export const scenarios: D20benchScenario[] = [
  goblinDuelScenario,
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
