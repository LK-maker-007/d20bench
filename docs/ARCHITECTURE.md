# D20bench Architecture And Design

## Design Goal

D20bench is a reproducible tactical benchmark for LLM-controlled D&D combat. The system should answer which model, prompt, and tactical policy performs best under the same rules, scenarios, teams, and random seeds.

The project has two major surfaces:

- **Benchmark engine**: deterministic match execution, replay logs, metrics, eval suites, ratings, and model adapters.
- **Public website**: LMArena-inspired presentation of published benchmark results, Elo-style head-to-head records, model pages, season pages, and replay inspection.

The benchmark engine is the source of truth. The website renders generated artifacts and should not compute ratings or mutate historical results.

## Source-Of-Truth Principles

- Battle outcomes come from deterministic CLI runs.
- Every match has a scenario id, ruleset id, data pack id, agent ids, model metadata, seed, replay log, and final state hash.
- Published seasons are immutable once archived.
- Hidden eval suites and private arena scenario details can remain unpublished, while archived summary results can still be published.
- Agents choose from engine-generated legal actions; they never directly mutate game state.

## Repository Shape

```text
D20bench
  packages/
    engine/
      src/
        battlecast/
          copied Battlecast rules, types, data, and AI orchestration
        dice.ts
        random.ts
      tests/
        deterministic primitive and compatibility tests
  docs/
    ARCHITECTURE.md
    PROJECT_PLAN.md
    ROADMAP.md
    BATTLECAST_EXTRACTION.md
    legal-and-attribution.md
    provenance/
      copied-source provenance notes
```

Future packages/apps:

```text
  packages/
    agents/       baseline agents and LLM provider adapters
    evals/        suites, match runner, report generation
    ratings/      Elo/Glicko seasons and pairing logic
    replays/      replay writer, verifier, and compact indexes
  apps/
    cli/          d20bench command
    site/         public results website
```

## Battlecast Extraction Strategy

Battlecast is the rules reference. D20bench should reuse Battlecast implementation by copying or transforming material into this repo, never by editing `../battlecast`.

The copied Battlecast layer lives under:

```text
packages/engine/src/battlecast/
```

This layer is intentionally close to Battlecast so future upstream syncs stay understandable. D20bench-specific behavior should usually sit outside this copied layer unless a tiny compatibility patch is necessary.

Current copied layer:

- `data/heroes.ts`
- `data/maps.ts`
- `data/monsters.ts`
- `data/presets.ts`
- `data/spells.ts`
- `engine/ai.ts`
- `engine/ai-loop.ts`
- `engine/ai-movement.ts`
- `engine/ai-movement-evaluator.ts`
- `engine/ai-spellcasting.ts`
- `engine/ai-targeting.ts`
- `engine/ai-turn.ts`
- `types/monster.ts`
- `types/animation.ts`
- `types/terrain.ts`
- `engine/dice.ts`
- `engine/combat.ts`
- `engine/combat-aoe.ts`
- `engine/combat-buffs.ts`
- `engine/combat-geometry.ts`
- `engine/combat-spellcasting.ts`

The copied Battlecast dice module has one intentional adaptation: it can use a seeded D20bench RNG through `setBattlecastRng`, `seedBattlecastRng`, or `withBattlecastRng` while preserving Battlecast-style call sites. Remaining Battlecast randomness sites in the copied layer should call `battlecastRandom()` so seeded D20bench runs cover ids, initiative tie-breaks, recharges, placements, and random tactic choices.

The first D20bench wrapper around the copied layer is:

```text
packages/engine/src/battlecast-runner.ts
```

It exposes:

- `runSeededBattlecastBattle(spec)`
- `createBattlecastCreatures(specs, fixedHp)`
- `resolveMonsterData(monster)`
- `summarizeBattlecastBattle(state)`

This wrapper is intentionally thin. It exists to seed the copied Battlecast layer, construct creatures from names or `MonsterData`, apply map terrain when requested, and return the original Battlecast `BattleState`.

The first benchmark-native scenario layer is:

```text
packages/engine/src/scenario.ts
packages/engine/src/scenarios/
```

It defines:

- `D20benchScenario`
- `runD20benchScenario(scenario, seed)`
- `snapshotBattlecastState(state)`
- `hashBattlecastState(state)`
- `hashStableJson(value)`

The first public scenario fixture is `public.goblin-duel.v1`.

## Layering

### 1. Battlecast-Compatible Rules Layer

Purpose: preserve Battlecast SRD combat behavior.

Responsibilities:

- Monster and creature runtime types.
- Terrain, footprints, distances, line of sight, and area geometry.
- Attack, damage, saves, conditions, buffs, resources, healing, spell execution, and AoE resolution.
- Battlecast AI orchestration and tactical heuristics once extracted.

Design constraint: keep this layer easy to diff against Battlecast.

### 2. Deterministic Harness Layer

Purpose: make Battlecast behavior reproducible and benchmarkable.

Responsibilities:

- Seeded RNG injection.
- Canonical state snapshots and state hashing.
- Scenario loading and validation.
- Match runner boundaries.
- Replay event emission.
- Determinism checks.

This layer wraps the copied Battlecast layer rather than replacing it. `battlecast-runner.ts` is the first concrete harness entrypoint, and `scenario.ts` is the first benchmark-native scenario/hash boundary.

### 3. Legal-Action Layer

Purpose: make LLM control safe and auditable.

Responsibilities:

- Generate legal actions for the active creature.
- Represent actions as stable JSON ids and small parameter sets.
- Reject illegal actions before state mutation.
- Provide retry/error messages to LLM agents.
- Translate accepted D20bench actions into Battlecast-compatible rule calls.

The legal-action catalogue is the central contract between the engine and agents.

### 4. Agent Layer

Purpose: compare policies under the same rules.

Responsibilities:

- Baseline agents: random legal, nearest target, focus fire, expected damage, kiter, objective-first.
- OpenRouter LLM adapter with structured output, retry policy, token/cost/latency logging, and budget caps.
- Agent identity: model slug, provider routing, prompt template version, parameters, agent code version, ruleset id, and data pack id.

### 5. Eval And Rating Layer

Purpose: turn matches into credible benchmark results.

Responsibilities:

- Public practice suites.
- Hidden eval suites.
- Private Elo arena seasons.
- Batch scheduling with concurrency and budget limits.
- Metrics, reports, Elo/Glicko snapshots, and immutable season artifacts.

### 6. Public Website Layer

Purpose: publish results without changing them.

Responsibilities:

- Static leaderboard from generated season artifacts.
- Head-to-head model matchup pages.
- Model profile pages.
- Season archive pages.
- Replay viewer backed by replay logs and compact replay indexes.

The website should be built in the Battlecast ecosystem: TypeScript, React, Vite, Vitest, and Playwright where useful.

## Determinism Model

All randomness must flow through seeded RNGs. Battlecast code that historically used `Math.random` should be adapted at the copied D20bench boundary, not by editing Battlecast.

Deterministic outputs should include:

- Initiative order.
- Attack rolls, saving throws, damage rolls, recharges, and tie-breaks.
- Replay event order.
- Final state hash.

The same scenario, seed, teams, ruleset, data pack, and agent decisions should produce the same replay and final hash.

Current hashing status:

- Final state hashes are SHA-256 hashes of stable JSON snapshots.
- The initial snapshot includes battle clock, initiative, creature runtime state, logs, and animation events.
- Future replay hashing should add per-turn hashes after each accepted action, not only a final hash.

## Near-Term Build Plan

1. Add replay JSONL logging with per-turn hashes.
2. Add legal-action catalogue generation for one active creature.
3. Add baseline agents.
4. Add CLI commands for `scenario list`, `scenario run`, and `scenario verify`.
5. Add OpenRouter only after deterministic local matches and replays are reliable.

## Non-Goals For The First Engine Slice

- Rewriting SRD rules from scratch.
- Building the website before benchmark artifacts exist.
- Letting LLMs submit arbitrary state mutations.
- Publishing hidden eval scenario details.
