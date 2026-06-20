# D20bench

D20bench is a planned tactical Dungeons & Dragons tournament harness where language models control combatants, submit legal actions to a deterministic rules engine, and compete in reproducible encounters.

The project goal is to make model combat skill measurable:

- Run seeded tactical matches with replayable logs.
- Compare LLM agents against scripted tactical baselines.
- Track model, prompt, and team variants on an Elo/Glicko-style ladder.
- Publish benchmark results, head-to-head records, and replay links on a public LMArena-inspired website.
- Reuse Battlecast's SRD rules implementation, monster data, tactics, engine ideas, and graphical assets through explicit copied/imported artifacts.

The Battlecast checkout lives beside this repo at `../battlecast` and should remain unmodified. D20bench may copy or transform Battlecast code, data, and assets into this project because both projects share the same author/copyright holder, but imports should still record source paths, source commits, and attribution metadata.

## Development

```bash
npm install
npm test
npm run build
npm run d20bench -- scenario list
npm run d20bench -- ladder run
npm run d20bench -- ladder run --season smoke-v0
npm run d20bench -- match run --scenario public.goblin-duel.v1 --red openrouter:openai/gpt-4o-mini --blue baseline.focus-fire --seed 1 --max-rounds 3
```

The first package is `@d20bench/engine`, which contains deterministic rules primitives such as seeded randomness and Battlecast-compatible dice helpers.

The default ladder season is `public-baseline-v0`, which computes one blended overall Elo table plus independent Elo tables per scenario battle type. It includes the simple `baseline.*` agents and copied Battlecast tactic agents: `battlecast.aggressive`, `battlecast.smart`, `battlecast.kiting`, and `battlecast.defensive`. `smoke-v0` remains available as the fast duel-only deterministic smoke ladder.

## Local Configuration

Put local secrets in `.env.local`. For OpenRouter, set `OPENROUTER_API_KEY`.

## Planning Docs

- [Project plan](docs/PROJECT_PLAN.md)
- [Architecture and design](docs/ARCHITECTURE.md)
- [LLM agent harness](docs/LLM_HARNESS.md)
- [Benchmark scenario design](docs/BENCHMARK_SCENARIOS.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Battlecast extraction plan](docs/BATTLECAST_EXTRACTION.md)
- [Legal and attribution notes](docs/legal-and-attribution.md)
