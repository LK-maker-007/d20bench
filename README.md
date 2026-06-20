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
```

The first package is `@d20bench/engine`, which contains deterministic rules primitives such as seeded randomness and Battlecast-compatible dice helpers.

## Planning Docs

- [Project plan](docs/PROJECT_PLAN.md)
- [Architecture and design](docs/ARCHITECTURE.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Battlecast extraction plan](docs/BATTLECAST_EXTRACTION.md)
- [Legal and attribution notes](docs/legal-and-attribution.md)
