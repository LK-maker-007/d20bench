const dist = new URL('../../packages/engine/dist/', import.meta.url);
const { runAgentMatchAsync } = await import(new URL('agent-match.js', dist));
const { getScenarioById } = await import(new URL('scenarios/index.js', dist));

const [red, blue, scenarioId, firstSeedArg, countArg] = process.argv.slice(2);
const firstSeed = Number(firstSeedArg);
const count = Number(countArg);
if (!red || !blue || !scenarioId || !Number.isInteger(firstSeed) || !Number.isInteger(count) || count < 1) {
  console.error('usage: node run-matches.mjs <red-agent> <blue-agent> <scenario-id> <first-seed> <seed-count>');
  process.exit(2);
}

const scenario = getScenarioById(scenarioId);
// Fairfix protocol: actual-action menus, trigger-time reactions, 50-round cap. One JSON line per match.
for (let seed = firstSeed; seed < firstSeed + count; seed += 1) {
  const started = performance.now();
  const result = await runAgentMatchAsync({
    scenario,
    seed,
    redAgent: red,
    blueAgent: blue,
    maxRounds: 50,
    llmActionSpace: 'actual-actions-v1',
  });
  const teamOf = new Map(result.state.creatures.map((creature) => [creature.id, creature.team]));
  const decisions = { red: 0, blue: 0 };
  for (const event of result.replay) {
    if (event.type !== 'action_resolved') continue;
    const team = teamOf.get(event.activeCreatureId);
    if (!team) throw new Error(`seed ${seed}: decision by unknown creature ${event.activeCreatureId}`);
    decisions[team] += 1;
  }
  console.log(JSON.stringify({
    red,
    blue,
    scenario: scenarioId,
    seed,
    winner: result.winner,
    roundsPlayed: result.replay.filter((event) => event.type === 'round_started').length,
    decisions,
    finalStateHash: result.finalStateHash,
    ms: Math.round(performance.now() - started),
  }));
}
