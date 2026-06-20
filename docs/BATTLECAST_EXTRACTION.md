# Battlecast Extraction Plan

Battlecast is a read-only upstream reference for this project. The local checkout is expected at:

```text
../battlecast
```

Do not edit files in that repository for this project. Import work should happen through scripts, copied source files, and generated artifacts inside `D20bench`.

## Current Snapshot

- Repository: `https://github.com/opengandalf/battlecast.git`
- Local path: `../battlecast`
- Pulled commit: `3b5cfc78a009163373311b15b93db2f4907f0202`
- Stack: TypeScript, React, Vite, Vitest, Playwright.
- Package name: `battlecast-init`.

## License Finding

Battlecast's `LICENSE` says the original code, UI, artwork, AI-generated portraits, preset scenarios, and other non-SRD elements are proprietary with no general license grant. It also says included SRD 5.2 content remains under CC-BY-4.0.

Project-specific permission:

- The D20bench and Battlecast author/copyright holder has explicitly permitted D20bench to reuse Battlecast code, assets, and data.
- Reuse should still copy or transform material into this repo rather than importing from or editing the sibling checkout.
- SRD-derived monster or rules data remains subject to CC-BY-4.0 attribution requirements.
- Generated import bundles should record the Battlecast commit and source-file path for auditability.

## What We Want From Battlecast

- Monster and combatant data that can be transformed into a canonical schema.
- Tactical engine concepts we can wrap or port into a deterministic benchmark runner.
- Graphical representations for replay viewing, if the license permits reuse.
- Existing scenario or encounter definitions, if present.
- Any scripted tactics that can become non-LLM baseline agents.

## Extraction Rules

- Record Battlecast source paths and commit SHAs before copying data, code, or graphics.
- Prefer generated canonical data over editing upstream files.
- Keep import scripts deterministic and idempotent.
- Store source commit SHA with every generated import bundle.
- Preserve attribution metadata in generated files.
- Keep compatibility code in `adapters/battlecast/` rather than leaking Battlecast-specific shapes into the engine core.

## First Inspection Checklist

- [x] Identify language, package manager, and app/runtime structure.
- [x] Locate monster/stat-block data.
- [x] Locate tactical engine or combat resolution code.
- [x] Locate map, token, sprite, or graphical asset directories.
- [x] Locate tests or fixtures that explain expected behavior.
- [x] Capture license and attribution requirements.

## Useful Battlecast Paths

- `src/types/monster.ts`
  - Main stat-block and runtime creature types: `MonsterData`, `MonsterAction`, `Creature`, `Condition`, resources, buffs, traits, legendary actions.
- `src/data/monsters.ts`
  - Monster stat blocks as `MonsterData[]`.
- `src/data/heroes.ts`
  - Hero/class combatants represented through the same monster-like schema.
- `src/data/spells.ts`
  - Spell/action metadata used by combat resolution.
- `src/data/maps.ts`
  - Map presets, terrain annotations, image paths, and grid sizes.
- `src/types/terrain.ts`
  - Terrain cells, movement blocking, line-of-sight blocking, and ASCII terrain-mask parsing.
- `src/engine/combat.ts`
  - Battle state, creature construction, initiative, combat logging, action resolution helpers, ongoing effects, damage adjustments, conditions, HP changes.
- `src/engine/ai-loop.ts`
  - Round execution, full battle loop, Monte Carlo runner.
- `src/engine/ai-turn.ts`
  - Per-turn AI execution, tactic handling, movement/combat sequencing, legendary actions, opportunity attacks.
- `src/engine/ai-targeting.ts`
  - Target selection, expected-damage heuristics, ranged preference, AoE targeting.
- `src/engine/ai-movement.ts` and `src/engine/ai-movement-evaluator.ts`
  - Movement pathing and position scoring.
- `src/engine/dice.ts`
  - Dice expression parser, d20 rolls, attack/save rolls, damage averages.
- `public/monsters/`, `public/heroes/`, `public/maps/`
  - Token, portrait, and map assets. These are not reusable without permission unless separate provenance says otherwise.
- `tests/`
  - A large behavior suite for mechanics, movement, conditions, spells, heroes, maps, and replay.

## Suggested First Import Targets

1. Canonical schema draft based on `MonsterData`, but owned by this repo:
   - stable ids
   - source metadata
   - normalized action kinds
   - explicit resource costs
   - benchmark-safe capability flags

2. SRD monster importer:
   - read `../battlecast/src/data/monsters.ts`
   - filter to allowed SRD-derived fields
   - emit generated JSON with attribution and commit SHA
   - reject non-SRD or uncertain provenance records until reviewed

3. Scenario importer:
   - start with maps and blank-grid tactical scenarios
   - avoid copying proprietary presets without permission
   - store only canonical grid, terrain, placement, objective, and source metadata

4. Engine adapter spike:
   - either wrap Battlecast in a private/local-only comparison harness, or reimplement a clean-room deterministic engine using the same public D&D/SRD rules concepts.
   - benchmark engine code should live in this repo and expose legal-action generation for LLM agents.
