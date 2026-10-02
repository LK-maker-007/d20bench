// Stage 1 causal test: give the rangeless spells a range in copies of the hero scenarios, for both teams,
// then replay imitator-vs-bot parity. Only in-memory copies change; the benchmark's data does not.
const dist = new URL('../../packages/engine/dist/', import.meta.url).href;
const { runAgentMatchAsync } = await import(dist + 'agent-match.js');
const { getScenarioById } = await import(dist + 'scenarios/index.js');

// Ranges in feet, entered by hand and not checked against the SRD.
const ranges = {
  Fireball: 150, Shatter: 60, 'Hypnotic Pattern': 120, Entangle: 90, Moonbeam: 120,
  'Call Lightning': 120, Sleep: 60, Web: 60, 'Sacred Flame': 60, 'Vicious Mockery': 60,
};

function withRanges(scenario) {
  const copy = structuredClone(scenario);
  for (const combatant of copy.combatants) {
    for (const action of combatant.monster.actions) {
      if (ranges[action.name] && !action.range) {
        action.range = { normal: ranges[action.name], long: ranges[action.name] };
      }
    }
  }
  return copy;
}

const [tactic, scenarioId, firstSeedArg, countArg] = process.argv.slice(2);
const first = Number(firstSeedArg);
const count = Number(countArg);
const copy = withRanges(getScenarioById(scenarioId));
for (let seed = first; seed < first + count; seed += 1) {
  for (const imitatorSide of ['red', 'blue']) {
    const imitator = `lk-47.imitate-${tactic}`;
    const bot = `battlecast.${tactic}`;
    const match = await runAgentMatchAsync({
      scenario: copy, seed,
      redAgent: imitatorSide === 'red' ? imitator : bot,
      blueAgent: imitatorSide === 'blue' ? imitator : bot,
      maxRounds: 50, llmActionSpace: 'actual-actions-v1',
    });
    console.log(JSON.stringify({ tactic, scenario: scenarioId, seed, imitatorSide, winner: match.winner }));
  }
}
