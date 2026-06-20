# D20bench

D20bench is a planned tactical Dungeons & Dragons tournament harness where language models control combatants, submit legal actions to a deterministic rules engine, and compete in reproducible encounters.

The project goal is to make model combat skill measurable:

- Run seeded tactical matches with replayable logs.
- Compare LLM agents against scripted tactical baselines.
- Track model, prompt, and team variants on an Elo/Glicko-style ladder.
- Publish benchmark results, head-to-head records, and replay links on a public LMArena-inspired website.
- Reuse Battlecast as a read-only reference for monster data, tactics, engine ideas, and graphical assets.

The Battlecast checkout lives beside this repo at `../battlecast` and should remain unmodified. Any extraction work should copy or transform data into this project through explicit import scripts after license and attribution checks.

## Planning Docs

- [Project plan](docs/PROJECT_PLAN.md)
- [Implementation roadmap](docs/ROADMAP.md)
- [Battlecast extraction plan](docs/BATTLECAST_EXTRACTION.md)
