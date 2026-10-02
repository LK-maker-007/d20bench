const dist = new URL('../../packages/engine/dist/', import.meta.url);
const { runAgentMatchAsync, lk47Simulator } = await import(new URL('agent-match.js', dist));
const { lk47Policies } = await import(new URL('lk-47/variants.js', dist));
const { getScenarioById } = await import(new URL('scenarios/index.js', dist));

const [agent, opponent, scenarioId, firstSeedArg, countArg] = process.argv.slice(2);
const firstSeed = Number(firstSeedArg);
const count = Number(countArg);
const policy = lk47Policies[agent];
if (!policy || !opponent || !scenarioId || !Number.isInteger(firstSeed) || !Number.isInteger(count) || count < 1) {
  console.error('usage: node planner-budget.mjs <lk-47-agent> <opponent> <scenario-id> <first-seed> <seed-count>');
  process.exit(2);
}

// A rollout ends the planning creature's turn once, and each simulated greedy turn that starts ends once more,
// so rollouts are finishTurn calls less the greedy turns begun.
let rollouts = 0;
const finishTurn = lk47Simulator.finishTurn;
lk47Simulator.finishTurn = (...args) => {
  rollouts += 1;
  return finishTurn(...args);
};
const beginTurn = lk47Simulator.beginTurn;
lk47Simulator.beginTurn = (...args) => {
  const turn = beginTurn(...args);
  if (turn) rollouts -= 1;
  return turn;
};
let decision = { count: 0, planned: 0, rollouts: 0, ms: 0 };
const chooseAction = policy.chooseAction;
policy.chooseAction = async (context) => {
  const before = rollouts;
  const started = performance.now();
  const action = await chooseAction.call(policy, context);
  decision.ms += performance.now() - started;
  decision.count += 1;
  decision.planned += rollouts > before;
  decision.rollouts += rollouts - before;
  return action;
};

const scenario = getScenarioById(scenarioId);
const totals = { decisions: 0, planned: 0, rollouts: 0, ms: 0 };
for (let seed = firstSeed; seed < firstSeed + count; seed += 1) {
  for (const [red, blue] of [[agent, opponent], [opponent, agent]]) {
    decision = { count: 0, planned: 0, rollouts: 0, ms: 0 };
    const result = await runAgentMatchAsync({ scenario, seed, redAgent: red, blueAgent: blue, maxRounds: 50, llmActionSpace: 'actual-actions-v1' });
    totals.decisions += decision.count;
    totals.planned += decision.planned;
    totals.rollouts += decision.rollouts;
    totals.ms += decision.ms;
    console.log(JSON.stringify({
      agent,
      side: red === agent ? 'red' : 'blue',
      scenario: scenarioId,
      seed,
      winner: result.winner,
      decisions: decision.count,
      plannedDecisions: decision.planned,
      rolloutsPerPlanned: Number((decision.rollouts / decision.planned).toFixed(1)),
      msPerDecision: Math.round(decision.ms / decision.count),
    }));
  }
}
console.log(`${agent} on ${scenarioId}: ${totals.decisions} decisions, ${totals.planned} planned, ` +
  `${(totals.rollouts / totals.planned).toFixed(1)} rollouts per planned decision, ${Math.round(totals.ms / totals.decisions)} ms per decision`);
