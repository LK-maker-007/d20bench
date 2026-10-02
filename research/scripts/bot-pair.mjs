const dist = new URL('../../packages/engine/dist/', import.meta.url);
const { runAgentMatchAsync } = await import(new URL('agent-match.js', dist));
const { getScenarioById } = await import(new URL('scenarios/index.js', dist));

const [red, blue, scenarioId, seedCount] = process.argv.slice(2);
if (!red || !blue || !scenarioId || !seedCount) {
  console.error('usage: node bot-pair.mjs <red-agent> <blue-agent> <scenario-id> <seed-count>');
  process.exit(2);
}

const scenario = getScenarioById(scenarioId);
const n = Number(seedCount);
let redWins = 0;
let blueWins = 0;
let draws = 0;
let rounds = 0;
const started = performance.now();
// Same settings as the fairfix seasons: actual-action menus, 50-round cap, seeds 1..n.
for (let seed = 1; seed <= n; seed += 1) {
  const result = await runAgentMatchAsync({
    scenario,
    seed,
    redAgent: red,
    blueAgent: blue,
    maxRounds: 50,
    llmActionSpace: 'actual-actions-v1',
  });
  if (result.winner === 'red') redWins += 1;
  else if (result.winner === 'blue') blueWins += 1;
  else draws += 1;
  rounds += result.state.round;
}

console.log(JSON.stringify({
  red,
  blue,
  scenario: scenarioId,
  n,
  redWins,
  blueWins,
  draws,
  meanRounds: Number((rounds / n).toFixed(2)),
  sec: Number(((performance.now() - started) / 1000).toFixed(1)),
}));
