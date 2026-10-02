const dist = new URL('../../packages/engine/dist/', import.meta.url);
const { getScenarioById } = await import(new URL('scenarios/index.js', dist));
const { initBattle } = await import(new URL('battlecast/engine/combat.js', dist));
const { withBattlecastRng } = await import(new URL('battlecast/engine/dice.js', dist));
const { createBattlecastCreatures } = await import(new URL('battlecast-runner.js', dist));
const { maps } = await import(new URL('battlecast/data/maps.js', dist));
const { buildMovementBlockedSet, buildSightBlockedSet } = await import(new URL('battlecast/types/terrain.js', dist));
const { createRng } = await import(new URL('random.js', dist));
const { generateLegalActions, estimateAttackRollBudget } = await import(new URL('legal-actions.js', dist));

const scenarioIds = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['public.hero-mirror-balanced-l5.v1', 'public.hero-mirror-chokepoint-l5.v1', 'public.hero-mirror-status-l5.v1'];

// First-step menu each red creature would see under actual-actions-v1, before anyone has moved.
for (const scenarioId of scenarioIds) {
  const scenario = getScenarioById(scenarioId);
  const state = withBattlecastRng(createRng(1), () => initBattle(createBattlecastCreatures(scenario.combatants, true), scenario.gridSize));
  const map = maps.find((candidate) => candidate.id === scenario.mapId);
  state.terrainBlocked = buildMovementBlockedSet(map?.terrain);
  state.terrainSightBlocked = buildSightBlockedSet(map?.terrain);
  console.log(`\n${scenarioId}`);
  console.log('| creature | legal actions | by type |');
  console.log('|---|---:|---|');
  for (const creature of state.creatures.filter((candidate) => candidate.team === 'red')) {
    const turn = { attackRollsRemaining: estimateAttackRollBudget(creature), attackActionStarted: false, flurryStrikesRemaining: 0, disengaged: false, ended: false };
    const catalogue = generateLegalActions(state, creature, { includeActualActions: true, actualTurnContext: turn });
    const counts = {};
    for (const action of catalogue.actions) counts[action.type] = (counts[action.type] ?? 0) + 1;
    const byType = Object.entries(counts).map(([type, count]) => `${type} ${count}`).join(', ');
    console.log(`| ${creature.displayName} | ${catalogue.actions.length} | ${byType} |`);
  }
}
