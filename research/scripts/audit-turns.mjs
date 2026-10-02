import { readFileSync } from 'node:fs';

const dist = new URL('../../packages/engine/dist/', import.meta.url);
const { runAgentMatchAsync } = await import(new URL('agent-match.js', dist));
const { getScenarioById } = await import(new URL('scenarios/index.js', dist));

const [agent, opponent, scenarioId, firstSeedArg, countArg, evaluationPath] = process.argv.slice(2);
const firstSeed = Number(firstSeedArg);
const count = Number(countArg);
if (!agent || !opponent || !scenarioId || !Number.isInteger(firstSeed) || !Number.isInteger(count) || count < 1) {
  console.error('usage: node audit-turns.mjs <lk-47-agent> <opponent> <scenario-id> <first-seed> <seed-count> [evaluation.jsonl]');
  process.exit(2);
}

// The audited games must be the evaluated ones: each replay's final hash is checked against the evaluation file.
const evaluated = new Map();
if (evaluationPath) {
  for (const line of readFileSync(evaluationPath, 'utf8').split('\n').filter(Boolean)) {
    const row = JSON.parse(line);
    evaluated.set(`${row.red}|${row.blue}|${row.scenario}|${row.seed}`, row.finalStateHash);
  }
}

const isInvalidActionLog = (log) => log.action === 'Invalid Action' || /could not be applied|unavailable|requested .* but/i.test(log.details ?? '');
const isActionSurge = (action) => action.type === 'class_feature' && action.feature === 'action_surge';
const totals = {
  matches: 0, hashesMatched: 0, ownTurns: 0, steps: 0, maxStepsInTurn: 0,
  delegateExposures: 0, delegateSelections: 0, invalidApplications: 0, silentMoves: 0, reactions: 0,
  // The engine checks opportunity attacks against reactionsUsed, which every turn start sets to 0, so a reaction that
  // only sets reactionUsed (Cutting Words, Uncanny Dodge and the like) does not block a later opportunity attack
  // (battlecast/engine/ai-turn.ts:384 and :693, agent-match.ts:1911 upstream). Any player gets these; they are counted apart.
  opportunityAttacksAfterAnotherReaction: 0,
};
const violations = [];
const restores = new Map();
const attacksPerTurn = new Map();

const scenario = getScenarioById(scenarioId);
for (let seed = firstSeed; seed < firstSeed + count; seed += 1) {
  for (const [red, blue] of [[agent, opponent], [opponent, agent]]) {
    const result = await runAgentMatchAsync({ scenario, seed, redAgent: red, blueAgent: blue, maxRounds: 50, llmActionSpace: 'actual-actions-v1' });
    const where = `${red} vs ${blue} seed ${seed}`;
    totals.matches += 1;
    const expected = evaluated.get(`${red}|${blue}|${scenarioId}|${seed}`);
    if (evaluationPath && expected !== result.finalStateHash) violations.push(`${where}: final hash ${result.finalStateHash} is not the evaluated ${expected}`);
    if (expected === result.finalStateHash) totals.hashesMatched += 1;

    const creatures = new Map(result.state.creatures.map((creature) => [creature.id, creature]));
    const order = result.state.initiativeOrder;
    // Menus open and close like brackets per creature: a reaction prompt can open inside another creature's step.
    const open = new Map();
    const turns = new Map();
    const reactionsSinceOwnTurn = new Map();
    for (const event of result.replay) {
      if (event.type === 'turn_started') {
        if (event.controller?.mode !== 'lk-47') continue;
        if (event.legalActions.some((action) => action.type === 'battlecast_tactic')) totals.delegateExposures += 1;
        const stack = open.get(event.activeCreatureId) ?? [];
        stack.push(event);
        open.set(event.activeCreatureId, stack);
        continue;
      }
      if (event.type !== 'action_resolved' || event.agentId !== agent) continue;
      const menu = open.get(event.activeCreatureId)?.pop();
      const action = event.acceptedAction;
      totals.steps += 1;
      if (action.type === 'battlecast_tactic') totals.delegateSelections += 1;
      if (event.logs.some(isInvalidActionLog)) totals.invalidApplications += 1;
      if ((action.type === 'move_to' || action.type === 'move_toward') && event.logs.length === 0) totals.silentMoves += 1;

      const id = event.activeCreatureId;
      // A reaction prompt can open during the creature's own turn, so reactions are told apart by type, not by turn.
      if (action.type === 'reaction') {
        if (action.reaction === 'decline') continue;
        totals.reactions += 1;
        const earlier = reactionsSinceOwnTurn.get(id) ?? [];
        reactionsSinceOwnTurn.set(id, [...earlier, action.reaction]);
        if (earlier.length === 0) continue;
        if (action.reaction === 'opportunity_attack' && !earlier.includes('opportunity_attack')) {
          totals.opportunityAttacksAfterAnotherReaction += 1;
        } else {
          violations.push(`${where} round ${event.round}: ${id} took ${[...earlier, action.reaction].join(', ')} since its own turn (${action.id})`);
        }
        continue;
      }
      if (order[event.turnIndex] !== id) {
        violations.push(`${where} round ${event.round}: ${id} acted outside its turn with ${action.id}`);
        continue;
      }
      const key = `${event.round}:${event.turnIndex}:${id}`;
      if (!turns.has(key)) {
        turns.set(key, []);
        reactionsSinceOwnTurn.set(id, []);
      }
      turns.get(key).push({ economy: menu?.actionEconomy, action, attacks: event.events.filter((item) => item.kind === 'attack' && item.attackerId === id && item.cause !== 'opportunity').length });
    }

    for (const [key, steps] of turns) {
      totals.ownTurns += 1;
      totals.maxStepsInTurn = Math.max(totals.maxStepsInTurn, steps.length);
      const creature = creatures.get(key.split(':')[2]);
      const role = creature.monsterData.heroClass ?? creature.name;
      const perRole = attacksPerTurn.get(role) ?? new Map();
      const attacks = steps.reduce((sum, step) => sum + step.attacks, 0);
      perRole.set(attacks, (perRole.get(attacks) ?? 0) + 1);
      attacksPerTurn.set(role, perRole);
      // Within a turn a spent resource may come back only through a rule that restores it.
      for (let i = 0; i + 1 < steps.length; i += 1) {
        const before = steps[i].economy;
        const after = steps[i + 1].economy;
        const action = steps[i].action;
        if (!before || !after) {
          violations.push(`${where} turn ${key}: step ${i} has no action economy`);
          continue;
        }
        const restored = [];
        if (!before.hasMainAction && after.hasMainAction) restored.push('main action');
        if (!before.hasBonusAction && after.hasBonusAction) restored.push('bonus action');
        if (after.attackRollsRemaining > before.attackRollsRemaining) restored.push('attack rolls');
        if (after.movementRemaining > before.movementRemaining) restored.push('movement');
        for (const what of restored) {
          const allowed = (what === 'movement' && action.type === 'dash') || (what !== 'bonus action' && isActionSurge(action));
          const label = `${what} after ${action.type === 'class_feature' ? action.feature : action.type}`;
          if (allowed) restores.set(label, (restores.get(label) ?? 0) + 1);
          else violations.push(`${where} turn ${key}: ${label} (${action.id})`);
        }
      }
    }
    console.log(`${where}: ${result.winner} won, ${turns.size} LK-47 turns audited, hash ${expected === result.finalStateHash ? 'matches the evaluation' : 'not checked against an evaluation'}`);
  }
}

console.log(JSON.stringify(totals));
console.log('restores allowed by a rule:', JSON.stringify(Object.fromEntries(restores)));
for (const [role, counts] of [...attacksPerTurn].sort()) {
  console.log(`attack rolls per own turn, ${role}:`, JSON.stringify(Object.fromEntries([...counts].sort((left, right) => left[0] - right[0]))));
}
console.log(`${violations.length} violations`);
for (const violation of violations) console.log(`VIOLATION ${violation}`);
