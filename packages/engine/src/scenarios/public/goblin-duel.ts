import type { D20benchScenario } from '../../scenario.js';

export const goblinDuelScenario: D20benchScenario = {
  id: 'public.goblin-duel.v1',
  name: 'Goblin Duel',
  description: 'A tiny adjacent mirror duel for deterministic engine smoke tests.',
  battleType: 'duel-smoke',
  visibility: 'public',
  rulesetId: 'battlecast-srd-2026-06-20',
  dataPackId: 'battlecast-srd-snapshot-3b5cfc7',
  scenarioVersion: '1.0.0',
  gridSize: 12,
  combatants: [
    {
      monster: 'Goblin Minion',
      team: 'red',
      position: { x: 5, y: 5 },
    },
    {
      monster: 'Goblin Minion',
      team: 'blue',
      position: { x: 6, y: 5 },
    },
  ],
};
