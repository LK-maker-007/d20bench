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
- Every scenario has a stable battle type so results can be reported as both blended overall Elo and per-type Elo.
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
- `BattleType`
- `runD20benchScenario(scenario, seed)`
- `snapshotBattlecastState(state)`
- `hashBattlecastState(state)`
- `hashStableJson(value)`

Scenario metadata includes a stable `battleType` aggregation key. Tactical tags can be many-valued and descriptive; battle type is the single rating bucket used for per-type Elo tables and season archives.

The first public scenario fixture is `public.goblin-duel.v1`, with battle type `duel-smoke`.

The first intentionally complex public scenario suite adds mirrored level-5 hero parties and a 6v6 goblin warband:

- `public.hero-mirror-balanced-l5.v1` (`hero-party-balanced`)
- `public.hero-mirror-chokepoint-l5.v1` (`hero-party-chokepoint`)
- `public.hero-mirror-status-l5.v1` (`hero-party-status`)
- `public.goblin-warband-6v6.v1` (`goblin-warband`)

Detailed encounter design notes live in `docs/BENCHMARK_SCENARIOS.md`.

The first CLI entrypoint is:

```text
packages/engine/src/cli.ts
```

Current commands:

- `d20bench scenario list`
- `d20bench scenario run <scenario-id> --seed 1`
- `d20bench scenario verify <replay.jsonl>`
- `d20bench match run --scenario <id> --red <agent> --blue <agent> --seed 1`
- `d20bench ladder run`

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

Current implementation:

```text
packages/engine/src/legal-actions.ts
```

The first catalogue supports `attack`, `move_toward`, and `end_turn`. It is intentionally small but already JSON-safe and validated by action id before mutation.

### 4. Agent Layer

Purpose: compare policies under the same rules.

Responsibilities:

- Baseline agents: random legal, nearest target, focus fire, expected damage, kiter, objective-first.
- OpenRouter LLM adapter with structured output, retry policy, token/cost/latency logging, and budget caps.
- Agent identity: model slug, provider routing, prompt template version, parameters, agent code version, ruleset id, and data pack id.

Current implementation:

```text
packages/engine/src/agents.ts
packages/engine/src/agent-match.ts
```

Baseline agents currently available:

- `baseline.random-legal`
- `baseline.nearest`
- `baseline.focus-fire`
- `baseline.expected-damage`
- `battlecast.aggressive`
- `battlecast.smart`
- `battlecast.kiting`
- `battlecast.defensive`

`runAgentMatch` is the first D20bench-owned match loop. It uses Battlecast creature state and attack/movement resolution, but D20bench owns the active legal-action catalogue, agent selection, replay events, and final hash.

The `baseline.*` agents choose from the D20bench legal-action catalogue. The `battlecast.*` agents expose copied Battlecast tactic options as benchmark agents; their turns delegate to Battlecast `executeTurn`, so they can use the richer copied Battlecast AI for spells, AoE, healing, status, retreating, and special abilities. Replays mark those turns with a `battlecast_tactic:<tactic>` accepted action while preserving the resulting Battlecast logs and animation events.

OpenRouter LLM agents use dynamic ids of the form `openrouter:<model-slug>`. They run through the async match harness, receive structured JSON observations with Battlecast-relevant tactical metadata, and must call the `choose_d20bench_action` tool with a legal action id. The harness preserves raw provider request/response attempts locally, retries malformed or missing tool calls, and fails closed instead of converting bad output into benchmark actions. Detailed design notes live in `docs/LLM_HARNESS.md`.

### 5. Eval And Rating Layer

Purpose: turn matches into credible benchmark results.

Responsibilities:

- Public practice suites.
- Hidden eval suites.
- Private Elo arena seasons.
- Batch scheduling with concurrency and budget limits.
- Metrics, reports, Elo/Glicko snapshots, and immutable season artifacts.

Current implementation:

```text
packages/engine/src/replay.ts
packages/engine/src/report.ts
packages/engine/src/ratings.ts
packages/engine/src/seasons.ts
packages/engine/src/llm-season.ts
```

Elo seasons maintain two rating views:

- **Blended overall Elo**: one rating pool updated by every match in the season.
- **Per-battle-type Elo**: independent rating pools keyed by scenario `battleType`.

The first smoke season is `smoke-v0`: a visible public smoke ladder for baseline agents on `public.goblin-duel.v1`.

The first non-duel public baseline season is `public-baseline-v0`: D20bench simple baselines and Battlecast tactic agents across `goblin-warband`, `hero-party-balanced`, `hero-party-chokepoint`, and `hero-party-status`.

The first LLM smoke season is `llm-smoke-v0`: latest Kimi, GLM 5.2, latest DeepSeek, and several cheaper smaller OpenRouter models against each other and `baseline.focus-fire`.

The first meaningful public LLM season is `llm-frontier-public-v1`: latest available Opus (`anthropic/claude-opus-4.8`), Gemini 3.1 Pro (`google/gemini-3.1-pro-preview`), GPT-5.5 (`openai/gpt-5.5`), and the existing cheap LLM roster. To keep it budget-friendly, it does not run model-vs-model pairings. Instead, each model fights `baseline.random-legal` and every copied Battlecast tactic agent in both side assignments across the 6v6 goblin control and three 4v4 level-5 hero-party mirrors. This first published run used the primitive LLM action space (`attack`, `move_toward`, `end_turn`) and is retained as a historical baseline.

The historical full-turn delegate LLM seasons, including `llm-frontier-fullturn-v1`, expose copied Battlecast full-turn delegate actions to the LLM (`battlecast_tactic:aggressive`, `smart`, `kiting`, `defensive`) alongside primitive actions. Selecting one of those delegates executes the same copied Battlecast `executeTurn` path used by the fixed tactic agents, including movement, spells, healing, buffs, AoE, attacks, and resource spending. These seasons are useful for tool-call and harness verification, but they are not the final fairness target because the model is choosing a Battlecast policy delegate rather than concrete combat actions.

The going-forward LLM control target is `actual-actions-v1`. In this mode OpenRouter agents never see `battlecast_tactic:*` actions. They receive concrete engine-generated actions such as target-directed movement, exact `move_to:x,y` destination movement, Dash, Disengage, Dodge, Help, class features such as Rogue Steady Aim, Druid Wild Shape beast forms, Barbarian Rage/Instinctive Pounce and Frenzy, Paladin Divine Smite post-hit choices, opportunity-attack reaction choices, trigger-time Rogue Uncanny Dodge, Monk Deflect, Superior Hunter's Defense, and Barbarian Retaliation choices, and Monk Martial Arts/Flurry strikes, weapon attacks, attack-roll cantrip beams, spell casts, saving-throw actions, point-origin AoE centers, line/cone AoE directions, healing, buffs, auto-darts, target-level random monster rays, and `end_turn`. The async harness applies one selected action through the copied Battlecast rules, records the logs/events/state hash, then regenerates the legal-action list and asks the model again if the creature still has movement, Extra Attack/multiattack attacks, random ray attacks, Flurry strikes, pending Divine Smite choices, opportunity-attack reaction triggers, damage/retaliation reaction triggers, or a bonus action remaining. This lets a model attack or react, inspect the result, and then decide its next attack, reaction, or end-turn action. For damage and Retaliation reactions during a Battlecast tactic turn, the harness pauses on the trigger, prompts the model with incoming damage and available reaction actions, restores deterministic state/RNG, and replays the turn with the selected reaction cached.

The first cheap validation season for this target is `llm-actual-cheap-verify-v1`: DeepSeek Flash, Ministral 8B, Llama 3.1 8B, and Qwen 3.5 Flash against fixed `battlecast.smart` on the chokepoint and status-pressure hero-party mirrors with one seed and both side assignments. It is intentionally small and should be run with `--max-cost 20` until the actual-action harness is trusted. `llm-actual-cheap-verify-v2` repeats the same scope after adding a legal JSON content fallback for providers that ignore OpenRouter `tool_calls`; accepted fallbacks are marked in traces with `toolCall: false` and `repairedJson: true`. `llm-actual-cheap-verify-v3` repeats the same scope after tightening repair instructions so models must copy exact legal action ids rather than action labels such as `Longbow`. `llm-actual-cheap-verify-v4` adds Rogue Steady Aim. `llm-actual-cheap-verify-v5` is the append-only validation run after widening concrete class features, directional AoE, and target-level random monster rays; it exposed a Qwen repair weakness after action economy changed mid-turn. `llm-actual-cheap-verify-v6` repeats the same scope after repair prompts were changed to list only the exact currently legal action ids. `llm-actual-cheap-verify-v7` adds concrete Dodge and Help actions. `llm-actual-cheap-verify-v8` makes Paladin Divine Smite an explicit post-hit choice with separate free-use and slot actions. `llm-actual-cheap-verify-v9` exposes opportunity attacks as explicit reaction choices and prevents LLM-owned OAs from being auto-spent by Battlecast tactic movement. `llm-actual-reaction-verify-v1` is a four-match hidden smoke season that forces live cheap models to choose an opportunity reaction against a Battlecast Kiting mover. `llm-actual-mitigation-verify-v3` is a four-match hidden smoke season that forces live cheap models to choose Uncanny Dodge mitigation against a Battlecast Aggressive attacker after the incoming damage is known, with per-match async RNG isolation. `llm-actual-deflect-verify-v3` adds live cheap validation for trigger-time Monk Deflect and Superior Hunter's Defense choices, including opportunity-attack damage during model movement. `llm-actual-retaliation-verify-v1` adds live cheap validation for trigger-time Barbarian Retaliation choices.

The previous public frontier benchmark, `llm-frontier-smart-v1`, keeps only fixed `battlecast.smart` as the opponent on the chokepoint and status-pressure hero-party mirrors. It uses the full-turn delegate action space and two seeds, giving each model 8 matches total: two scenarios, two side assignments, and two seeds. It remains archived as a historical full-turn-delegate benchmark rather than the final concrete-action leaderboard.

Replication runs use new season ids rather than overwriting prior artifacts. For example, `llm-frontier-smart-top3-10x-v1` reruns Ministral 8B, Llama 3.1 8B, and Qwen 3.5 Flash against `battlecast.smart` with 20 seeds, giving each model 80 matches while preserving `llm-frontier-smart-v1` unchanged. `llm-frontier-smart-glm-10x-v1` applies the same 80-match replication schedule to GLM 5.2. `llm-toolcall-cheap-verify-v3` is the current cheap-model harness verification season for Ministral 8B, Llama 3.1 8B, and Qwen 3.5 Flash. `llm-toolcall-glm-smart-20-v2` is the post-toolcall-fix GLM 5.2 check with 20 total matches and a GLM-specific completion budget. `llm-toolcall-frontier-smart-16-v2` applies the same post-fix harness check to GPT-5.5 and Claude Opus 4.8 with 16 matches per model.

LLM seasons use a bounded parallel worker pool because model latency is the bottleneck. Completed matches are stored by fixture index, then Elo is applied in deterministic fixture order so rating results do not depend on API response timing.

LLM seasons also checkpoint completed matches incrementally to `results/seasons/<season-id>/completed-matches.jsonl`. Running the CLI with `--resume` restores those completed fixtures, retries failed or unstarted fixtures, and then recomputes blended and per-battle-type Elo from the recovered match set.

OpenRouter decision attempts are additionally written to local `results/seasons/<season-id>/raw-decisions.jsonl` audit logs. These logs include full prompts and provider payloads, so they are ignored by git and are not part of the public result artifact by default.

Live LLM run progress is written to:

```text
results/seasons/<season-id>/progress.json
```

The progress artifact includes status, concurrency, active matches, recent matches, failures, token usage, and estimated cost.

First generated output:

```text
results/seasons/smoke-v0/standings.json
results/seasons/smoke-v0/standings.md
results/seasons/public-baseline-v0/standings.json
results/seasons/public-baseline-v0/standings.md
```

### 6. Public Website Layer

Purpose: publish results without changing them.

Responsibilities:

- Static leaderboard from generated season artifacts.
- Blended overall and per-battle-type Elo tables.
- Head-to-head model matchup pages.
- Model profile pages.
- Season archive pages.
- Live local progress panel that polls `progress.json` while a private runner is active.
- Replay viewer backed by replay logs and compact replay indexes.

The current results site is a lightweight static app under `apps/results-site`, served locally with Vite from the repo root so it can poll `results/seasons/<season-id>/progress.json`. It can publish archived `standings.json` outputs without exposing hidden eval details.

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
- Agent-match replay events include state hashes for match start, round start/end, turn start, action resolution, and match finish.

## Near-Term Build Plan

1. Broaden `actual-actions-v1` to cover any remaining Battlecast special actions not yet exposed as concrete options, then graduate it from verification seasons to the main public LLM benchmark action space.
2. Add more public scenario fixtures and hidden-suite plumbing.
3. Add richer replay verification that replays accepted actions from JSONL and confirms every recorded hash.
4. Add report aggregation across scenario families.
5. Add OpenRouter only after deterministic local matches, legal actions, replays, reports, and ratings are reliable.

## Non-Goals For The First Engine Slice

- Rewriting SRD rules from scratch.
- Building the website before benchmark artifacts exist.
- Letting LLMs submit arbitrary state mutations.
- Publishing hidden eval scenario details.
