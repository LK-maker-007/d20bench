const dist = new URL('../../packages/engine/dist/', import.meta.url);
const { runAgentMatchAsync } = await import(new URL('agent-match.js', dist));
const { getScenarioById } = await import(new URL('scenarios/index.js', dist));
const { executeTurn } = await import(new URL('battlecast/engine/ai-turn.js', dist));
const { checkBattleComplete, initBattle, DEFAULT_TACTICS } = await import(new URL('battlecast/engine/combat.js', dist));
const { withBattlecastRng } = await import(new URL('battlecast/engine/dice.js', dist));
const { createBattlecastCreatures } = await import(new URL('battlecast-runner.js', dist));
const { maps } = await import(new URL('battlecast/data/maps.js', dist));
const { buildMovementBlockedSet, buildSightBlockedSet } = await import(new URL('battlecast/types/terrain.js', dist));
const { createRng } = await import(new URL('random.js', dist));

const scenarioIds = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['public.hero-mirror-chokepoint-l5.v1', 'public.hero-mirror-status-l5.v1'];

function initialState(scenario) {
  const state = initBattle(createBattlecastCreatures(scenario.combatants, true), scenario.gridSize);
  const map = maps.find((candidate) => candidate.id === scenario.mapId);
  state.teamTactics = { ...(scenario.teamTactics ?? DEFAULT_TACTICS), red: 'smart', blue: 'smart' };
  state.terrainBlocked = buildMovementBlockedSet(map?.terrain);
  state.terrainSightBlocked = buildSightBlockedSet(map?.terrain);
  scenario.setupBattleState?.(state);
  state.matchMaxRounds = 50;
  return state;
}

// Bare playout loop: every creature runs the engine's own Smart turn, no harness or replay hashing.
function playOut(state, extraRounds) {
  const lastRound = Math.min(state.matchMaxRounds, state.round + extraRounds);
  while (!state.isComplete && state.round <= lastRound) {
    for (let i = state.turnIndex; i < state.initiativeOrder.length && !state.isComplete; i += 1) {
      state.turnIndex = i;
      const creature = state.creatures.find((candidate) => candidate.id === state.initiativeOrder[i]);
      if (!creature || !creature.isAlive) continue;
      creature.stats.roundsSurvived = state.round;
      executeTurn(state, creature);
      checkBattleComplete(state);
    }
    state.turnIndex = 0;
    state.round += 1;
  }
}

function leanClone(state) {
  const copy = structuredClone({ ...state, logs: [], events: [], terrainBlocked: undefined, terrainSightBlocked: undefined });
  copy.terrainBlocked = state.terrainBlocked;
  copy.terrainSightBlocked = state.terrainSightBlocked;
  return copy;
}

for (const scenarioId of scenarioIds) {
  const scenario = getScenarioById(scenarioId);

  const harnessMatches = 20;
  let started = performance.now();
  let finalState;
  for (let seed = 1; seed <= harnessMatches; seed += 1) {
    const result = await runAgentMatchAsync({ scenario, seed, redAgent: 'battlecast.smart', blueAgent: 'battlecast.smart', maxRounds: 50, llmActionSpace: 'actual-actions-v1' });
    finalState = result.state;
  }
  console.log(`${scenarioId} harness smart-v-smart: ${((performance.now() - started) / harnessMatches).toFixed(1)} ms/match over ${harnessMatches} seeds`);

  const clones = 500;
  started = performance.now();
  for (let i = 0; i < clones; i += 1) structuredClone(finalState);
  console.log(`  structuredClone, full final state with logs (${finalState.logs.length}) and events (${finalState.events.length}): ${((performance.now() - started) / clones).toFixed(3)} ms`);
  started = performance.now();
  for (let i = 0; i < clones; i += 1) leanClone(finalState);
  console.log(`  structuredClone without logs and events: ${((performance.now() - started) / clones).toFixed(3)} ms`);

  const base = withBattlecastRng(createRng(7), () => initialState(scenario));
  for (const extraRounds of [1, 3, 50]) {
    const playouts = 300;
    let finished = 0;
    started = performance.now();
    for (let k = 0; k < playouts; k += 1) {
      const state = leanClone(base);
      withBattlecastRng(createRng(1000 + k), () => playOut(state, extraRounds));
      if (state.isComplete) finished += 1;
    }
    console.log(`  bare playout from round 1, up to ${extraRounds + 1} rounds: ${((performance.now() - started) / playouts).toFixed(2)} ms each, ${finished}/${playouts} reached a winner`);
  }
}
