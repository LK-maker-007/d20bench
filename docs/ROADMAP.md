# Implementation Roadmap

This roadmap turns the LLM D&D tactical tournament idea into staged implementation work. The default LLM gateway is OpenRouter so we can run many models through one provider adapter while preserving model-specific metadata for benchmarking.

## Product Slice

The first real milestone is not a fancy UI. It is a reproducible command-line tournament loop:

```text
scenario + seed + red_agent + blue_agent
  -> deterministic match runner
  -> validated turns
  -> replay log
  -> metrics
  -> rating update
```

Everything else should orbit that loop.

The public website is still an important product surface: it should present the generated benchmark results, Elo-style head-to-head records, and replay artifacts in an LMArena-inspired format. The benchmark runner computes results; the website publishes and explains them.

## Technical Choices

- **Language**: TypeScript, because Battlecast is TypeScript and we will likely want compatibility with its schemas and tests.
- **Runtime**: Node.js CLI first, web UI later.
- **LLM gateway**: OpenRouter Chat Completions.
- **LLM contract**: strict JSON Schema action responses through OpenRouter `response_format` where supported.
- **Config**: versioned YAML or JSON scenario, season, and agent configs.
- **Persistence**: JSONL replays and SQLite for ratings/results once local files get noisy.
- **Publication**: static website generated from season artifacts, rating snapshots, match summaries, and replay indexes.
- **Validation**: engine-generated legal actions are the source of truth; agents choose action ids, never mutate state.

## Phase 0: Source, License, And Scope

Goal: make sure the project can evolve safely.

Deliverables:

- Confirm Battlecast remains a sibling read-only checkout at `../battlecast`.
- Record Battlecast commit SHAs in import artifacts.
- Decide which data can be imported under SRD 5.2 / CC-BY-4.0 and which requires permission.
- Create a `docs/legal-and-attribution.md` file before importing any Battlecast-derived data.
- Define `ruleset_id`, `data_pack_id`, and `source_commit` fields that appear in every scenario and replay.

Acceptance criteria:

- No Battlecast source or asset copy happens without provenance notes.
- The repo has one written policy for SRD attribution and proprietary Battlecast material.

## Phase 1: Deterministic Rules Core

Goal: build the smallest tactical engine that can run fair matches without LLMs.

Deliverables:

- Core types for `BattleState`, `Creature`, `Action`, `LegalAction`, `Scenario`, `MatchResult`, and `ReplayEvent`.
- Seeded RNG used by all initiative, attack, save, damage, and tie-break rolls.
- Grid movement with terrain blocking, line of sight, reach, range, and footprints.
- Turn runner for initiative, action economy, movement, attacks, damage, death/removal, and end-of-turn checks.
- State hash after every turn for replay determinism.
- Unit tests for dice, movement, targeting, action validation, and replay hash stability.

Initial rules subset:

- Movement, dash, disengage, dodge, help, attack, ranged attack, opportunity attack.
- AC, HP, attack bonus, damage dice, critical hits, advantage/disadvantage.
- Basic conditions: prone, grappled, restrained, poisoned, unconscious, dead.
- Simple recharge/limited-use actions.

Acceptance criteria:

- `npm test` can run deterministic local matches with no LLM calls.
- Re-running the same match with the same seed produces identical replay events and final hash.

## Phase 2: Data And Scenario Layer

Goal: make combat content configurable and benchmarkable.

Deliverables:

- Canonical monster schema in `data/schema/monster.schema.json`.
- Canonical scenario schema in `data/schema/scenario.schema.json`.
- Starter data pack with 10-20 legally safe monsters or hand-authored tactical units.
- Scenario fixtures for duel, mirror, 3v3 skirmish, ranged-kiting, chokepoint, and focus-fire puzzles.
- Import spike that reads Battlecast shapes but emits our own canonical JSON only for approved/provenance-safe records.

Acceptance criteria:

- `d20bench scenario validate` checks every fixture.
- `d20bench match run --scenario <id> --red baseline.focus-fire --blue baseline.nearest --seed 1` works from the CLI.
- Scenario files do not depend on Battlecast runtime code.

## Phase 3: Baseline Agents

Goal: create non-LLM opponents and eval floors before spending tokens.

Deliverables:

- `baseline.random-legal`
- `baseline.nearest`
- `baseline.focus-fire`
- `baseline.expected-damage`
- `baseline.kiter`
- `baseline.objective-first`
- Agent interface shared by baseline and LLM agents.
- Golden tests for each baseline on small tactical states.

Acceptance criteria:

- Baseline-vs-baseline tournaments produce stable win rates across fixed seed sets.
- Illegal action rate for baseline agents is zero.

## Phase 4: OpenRouter LLM Harness

Goal: let many models control units through one reliable adapter.

Deliverables:

- `agents/openrouter` adapter using `OPENROUTER_API_KEY`.
- Agent config fields:
  - `model`
  - `models` fallback list
  - `temperature`
  - `max_completion_tokens`
  - `reasoning_effort`
  - `provider` routing preferences
  - `response_format` support mode
  - `prompt_template`
  - `timeout_ms`
  - `retry_policy`
- OpenRouter request metadata:
  - `session_id` per match or agent-match pair for observability and provider stickiness.
  - `metadata` with scenario id, match id, agent id, ruleset id, and turn number.
  - optional app attribution headers: `HTTP-Referer`, `X-OpenRouter-Title`, and `X-OpenRouter-Categories`.
- Strict JSON action schema for:
  - intent summary
  - selected legal action ids
  - movement path ids or coordinates
  - target ids
  - optional fallback action
- Response repair flow:
  - first response must satisfy JSON Schema when model supports it
  - schema failure gets one compact repair prompt
  - illegal action gets one legality-error retry
  - final failure becomes `dodge` or `end_turn`
- Token, latency, finish reason, model, provider metadata, retries, and error codes written to replay logs.

Acceptance criteria:

- One OpenRouter model can complete a full duel against a baseline.
- Replay logs include raw prompts and responses behind a redaction flag or private artifact mode.
- The same LLM agent can be swapped from one model slug to another through config only.

## Phase 5: Eval Suites

Goal: turn matches into a benchmark.

Deliverables:

- Public practice suites:
  - `legality-smoke`
  - `micro-tactics`
  - `duel-mirror`
  - `skirmish-small`
  - `cost-latency`
- Private or rotating ladder suites kept outside the public prompt examples.
- Batch runner with concurrency caps and OpenRouter budget guardrails.
- Report generator that emits Markdown and JSON summaries.

Metrics:

- Win rate.
- Illegal action rate.
- Retry/repair rate.
- Timeout rate.
- Average turns to win.
- Damage dealt/taken per round.
- Objective score.
- Token cost per completed match.
- Latency per turn.

Acceptance criteria:

- `d20bench eval run --suite legality-smoke --agent openrouter.<model>` produces a report.
- Public reports identify the exact agent config, scenario versions, seeds, and ruleset version.

## Phase 6: Rating Ladder

Goal: build a durable model-vs-model tournament system.

Deliverables:

- `SeasonConfig` with scenario pool, seed policy, agent roster, concurrency, and rating parameters.
- Elo implementation for 1v1 matches.
- Glicko-2 or TrueSkill design note for later uncertainty/team support.
- Pairing scheduler:
  - baseline calibration round
  - model-vs-model round robin
  - promotion/relegation or Swiss-style expansion when roster grows
- Rating identity:
  - model slug
  - provider routing config
  - prompt template version
  - agent code version
  - ruleset id
  - data pack id
- Leaderboard output as static JSON and Markdown.
- Website-ready artifacts for leaderboard tables, model pages, matchup pages, rating history charts, and replay indexes.

Acceptance criteria:

- `d20bench ladder run --season seasons/s0.json` produces standings and replay links.
- Re-running a completed season with saved responses disabled is blocked unless explicitly requested, so we do not accidentally rewrite historical results.
- Published rating artifacts are immutable for a season and include enough metadata to reproduce each displayed result.

## Phase 7: Public Results Website And Replay Viewer

Goal: make benchmark results public, navigable, and inspectable.

Deliverables:

- Static website generated from season outputs.
- LMArena-style leaderboard with rating, confidence, win rate, legality, cost, latency, ruleset, and benchmark version.
- Head-to-head matchup pages with model-vs-model records, scenario-family splits, seed counts, and representative replays.
- Model pages with rating history, prompt/config identity, provider routing metadata, benchmark strengths, and notable losses.
- Season pages that freeze scenario pools, seeds, rulesets, data packs, rating parameters, and agent rosters.
- Web replay viewer that loads JSONL replay files.
- Grid renderer with terrain, units, HP, conditions, action log, and initiative.
- Turn scrubber and per-turn prompt/response inspector.
- Optional Battlecast-inspired visual import only if permission/provenance allows it.

Acceptance criteria:

- A user can browse the public site and understand which model is leading, why, against whom, and under which benchmark version.
- Every displayed rating or head-to-head claim links back to immutable season artifacts and replay records.
- A user can open a replay, step through every turn, and inspect why an LLM action was accepted or rejected.
- The viewer renders the same final state as the CLI replay verifier.

## Phase 8: Hardening And Research Features

Goal: make the benchmark credible and harder to game.

Deliverables:

- Prompt-injection tests for monster/scenario names and descriptions.
- Observation ablations: exact HP vs HP bands, hidden AC vs known AC, partial information vs full information.
- Prompt robustness suite with harmless wording variations.
- Cost-normalized leaderboard.
- Human-authored tactical puzzle oracle for selected states.
- Shallow-search or rollout oracle for small deterministic scenarios.
- BYOK or workspace budget support if we run many matches.

Acceptance criteria:

- Reports separate tactical skill, legality reliability, cost, latency, and prompt robustness.
- A model cannot win the main ladder while having an unacceptable illegal action or timeout rate.

## OpenRouter Integration Notes

Use the direct Chat Completions API first. It keeps our harness simple and avoids coupling tournament logic to an agent SDK loop.

Recommended request shape:

```json
{
  "model": "<exact_openrouter_model_slug>",
  "messages": [
    { "role": "system", "content": "<tactical policy and output contract>" },
    { "role": "user", "content": "<current observation and legal action catalogue>" }
  ],
  "temperature": 0.2,
  "max_completion_tokens": 800,
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "dnd_turn_action",
      "strict": true,
      "schema": {}
    }
  },
  "provider": {
    "require_parameters": true,
    "allow_fallbacks": true
  },
  "session_id": "match_<id>_agent_red"
}
```

Default routing policy:

- For benchmark fairness, pin exact model slugs and record provider metadata.
- For throughput experiments, use provider sorting by `throughput`.
- For cost experiments, use provider sorting by `price`.
- For strict structured-output runs, set `provider.require_parameters: true`.
- For privacy-sensitive runs, configure data policy preferences explicitly.

## First 10 Implementation Tickets

1. Create TypeScript package skeleton with CLI entrypoint `d20bench`.
2. Add seeded RNG and dice parser.
3. Add canonical engine types and JSON schemas.
4. Implement movement, line of sight, action validation, and state hashing.
5. Add the first six scenario fixtures.
6. Implement baseline agents and deterministic match runner.
7. Add replay JSONL writer and verifier.
8. Add OpenRouter adapter with structured output and retry handling.
9. Add eval suite runner with Markdown/JSON reports.
10. Add Elo season runner and website-ready leaderboard/matchup artifacts.

## Open Questions

- Should the first ruleset target D&D 5e 2014, D&D 2024/SRD 5.2, or a smaller "D&D-like tactical subset" with explicit versioning?
- Should LLMs control one active unit at a time, or should a model control the whole team and submit a tactical plan each round?
- Should private ladder scenarios live in a separate private repo from day one?
- Do we want to pursue permission to reuse Battlecast visual assets, or generate a separate visual identity?

## References

- OpenRouter Quickstart: https://openrouter.ai/docs/quickstart
- OpenRouter Chat Completions: https://openrouter.ai/docs/api-reference/chat-completion
- OpenRouter Structured Outputs: https://openrouter.ai/docs/features/structured-outputs
- OpenRouter Provider Routing: https://openrouter.ai/docs/features/provider-routing
- OpenRouter App Attribution: https://openrouter.ai/docs/features/app-attribution
