const dist = new URL('../../packages/engine/dist/', import.meta.url);
const { getScenarioById } = await import(new URL('scenarios/index.js', dist));
const { executeTurn } = await import(new URL('battlecast/engine/ai-turn.js', dist));
const { checkBattleComplete, initBattle, DEFAULT_TACTICS } = await import(new URL('battlecast/engine/combat.js', dist));
const { withBattlecastRng } = await import(new URL('battlecast/engine/dice.js', dist));
const { createBattlecastCreatures } = await import(new URL('battlecast-runner.js', dist));
const { maps } = await import(new URL('battlecast/data/maps.js', dist));
const { buildMovementBlockedSet, buildSightBlockedSet } = await import(new URL('battlecast/types/terrain.js', dist));
const { createRng } = await import(new URL('random.js', dist));

// Run under `node --cpu-prof --cpu-prof-dir=<dir>`: bare Smart-vs-Smart playouts to the end, no harness.
const scenario = getScenarioById(process.argv[2] ?? 'public.hero-mirror-chokepoint-l5.v1');
const playouts = Number(process.argv[3] ?? 500);
const map = maps.find((candidate) => candidate.id === scenario.mapId);
for (let k = 0; k < playouts; k += 1) {
  withBattlecastRng(createRng(1000 + k), () => {
    const state = initBattle(createBattlecastCreatures(scenario.combatants, true), scenario.gridSize);
    state.teamTactics = { ...(scenario.teamTactics ?? DEFAULT_TACTICS), red: 'smart', blue: 'smart' };
    state.terrainBlocked = buildMovementBlockedSet(map?.terrain);
    state.terrainSightBlocked = buildSightBlockedSet(map?.terrain);
    scenario.setupBattleState?.(state);
    while (!state.isComplete && state.round <= 50) {
      for (let i = 0; i < state.initiativeOrder.length && !state.isComplete; i += 1) {
        state.turnIndex = i;
        const creature = state.creatures.find((candidate) => candidate.id === state.initiativeOrder[i]);
        if (!creature || !creature.isAlive) continue;
        executeTurn(state, creature);
        checkBattleComplete(state);
      }
      state.round += 1;
    }
  });
}
