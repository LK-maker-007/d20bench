const dist = new URL('../../packages/engine/dist/', import.meta.url);
const { runAgentMatchAsync } = await import(new URL('agent-match.js', dist));
const { getScenarioById } = await import(new URL('scenarios/index.js', dist));

// Run under `node --cpu-prof --cpu-prof-dir=<dir>`; summarise with summarize-cpu-profile.mjs.
const scenario = getScenarioById(process.argv[2] ?? 'public.hero-mirror-status-l5.v1');
const matches = Number(process.argv[3] ?? 10);
for (let seed = 1; seed <= matches; seed += 1) {
  await runAgentMatchAsync({ scenario, seed, redAgent: 'battlecast.smart', blueAgent: 'battlecast.smart', maxRounds: 50, llmActionSpace: 'actual-actions-v1' });
}
