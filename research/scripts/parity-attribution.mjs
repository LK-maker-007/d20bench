// Stage 1 diagnostic: wraps an imitator policy at runtime to compare each turn's bot plan with the menus offered.
// Plans are regenerated under a fixed seed, not the policy's own, so counts are approximate.
const dist = new URL('../../packages/engine/dist/', import.meta.url).href;
const { runAgentMatchAsync } = await import(dist + 'agent-match.js');
const { getScenarioById } = await import(dist + 'scenarios/index.js');
const { lk47Policies } = await import(dist + 'lk-47/variants.js');
const { planBotTurn } = await import(dist + 'lk-47/imitator.js');

const [tactic, scenarioId, firstSeedArg, countArg] = process.argv.slice(2);
const id = `lk-47.imitate-${tactic}`;
const policy = lk47Policies[id];
const original = policy.chooseAction.bind(policy);
const turns = new Map();
policy.chooseAction = async (context) => {
  const { state, activeCreature, catalogue } = context;
  const prompt = catalogue.actions.some((a) => a.type === 'reaction' || a.type === 'smite');
  const chosen = await original(context);
  if (prompt) return chosen;
  const key = `${state.round}:${state.turnIndex}:${activeCreature.id}`;
  let turn = turns.get(key);
  if (!turn) {
    turn = { who: activeCreature.monsterData.heroClass, plan: planBotTurn(state, activeCreature.id, tactic, 424242), menuNames: new Set(), chosen: [] };
    turns.set(key, turn);
  }
  for (const action of catalogue.actions) turn.menuNames.add(action.actionName ?? action.label ?? action.type);
  turn.chosen.push(chosen.type === 'spell' || chosen.type === 'attack' ? `${chosen.type}:${chosen.actionName}` : chosen.type);
  return chosen;
};

const counts = { turns: 0, idleWithPlan: 0, planSpellsNeverOffered: {}, idleByFirstStep: {}, idleByClass: {} };
let wins = 0;
const first = Number(firstSeedArg);
for (let seed = first; seed < first + Number(countArg); seed += 1) {
  for (const [red, blue] of [[id, `battlecast.${tactic}`], [`battlecast.${tactic}`, id]]) {
    turns.clear();
    const match = await runAgentMatchAsync({ scenario: getScenarioById(scenarioId), seed, redAgent: red, blueAgent: blue, maxRounds: 50, llmActionSpace: 'actual-actions-v1' });
    if (match.winner === (red === id ? 'red' : 'blue')) wins += 1;
    for (const turn of turns.values()) {
      counts.turns += 1;
      for (const step of turn.plan) {
        if ((step.kind === 'area' || step.kind === 'heal' || step.kind === 'named') && !turn.menuNames.has(step.actionName)) {
          counts.planSpellsNeverOffered[`${turn.who}:${step.actionName}`] = (counts.planSpellsNeverOffered[`${turn.who}:${step.actionName}`] ?? 0) + 1;
        }
      }
      if (turn.plan.length > 0 && turn.chosen.every((c) => c === 'end_turn')) {
        counts.idleWithPlan += 1;
        const firstStep = turn.plan[0];
        const label = `${firstStep.kind}:${firstStep.actionName ?? firstStep.beastName ?? ''}`;
        counts.idleByFirstStep[label] = (counts.idleByFirstStep[label] ?? 0) + 1;
        counts.idleByClass[turn.who] = (counts.idleByClass[turn.who] ?? 0) + 1;
      }
    }
  }
}
console.log(`${tactic} on ${scenarioId}, seeds ${first}..${first + Number(countArg) - 1}, both sides: imitator won ${wins} of ${2 * Number(countArg)}`);
console.log(`imitator turns: ${counts.turns}; turns with a non-empty plan where the imitator only ended its turn: ${counts.idleWithPlan}`);
console.log('idle turns by class:', JSON.stringify(counts.idleByClass));
console.log('idle turns by the plan\'s first step:', JSON.stringify(counts.idleByFirstStep));
console.log('planned spell/feature names never offered in that turn\'s menus (class:name -> turns):', JSON.stringify(counts.planSpellsNeverOffered, null, 1));
