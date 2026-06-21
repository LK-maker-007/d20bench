# LLM Agent Harness

## Goal

D20bench LLM agents should control combatants by choosing from engine-generated legal actions. The model never mutates battle state directly, never rolls dice, and never invents rules effects. The engine remains the source of truth for rules, legality, replay logs, scoring, and final state hashes.

## Comparable Benchmark Patterns

- BrowserGym uses a Gym-style loop: reset the environment, observe, choose an action, call `env.step(action)`, and repeat until terminated or truncated. D20bench should follow the same environment boundary for combat turns.
- WebArena separates prompt construction from action extraction: prompts include observation, instruction, action space, and examples; the harness extracts an action from the model output. D20bench should keep prompt construction and action validation explicit.
- Tau-bench evaluates tool-using agents in domain environments with policy constraints and historical trajectories. D20bench should similarly archive trajectories and distinguish model behavior from environment behavior.
- SWE-bench emphasizes reproducible harnesses and evaluator contracts. D20bench should treat accepted actions, replay logs, state hashes, model metadata, and cost metadata as first-class artifacts.

References:

- https://github.com/ServiceNow/BrowserGym
- https://github.com/web-arena-x/webarena
- https://github.com/sierra-research/tau-bench
- https://github.com/SWE-bench/SWE-bench
- https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request
- https://openrouter.ai/docs/guides/features/tool-calling
- https://openrouter.ai/docs/guides/features/structured-outputs

## Control Loop

For each active creature:

1. The deterministic Battlecast-derived engine creates the current battle state.
2. D20bench generates a legal-action catalogue for the active creature.
3. D20bench builds a structured LLM observation:
   - round and turn index
   - active creature
   - allies and enemies with HP, AC, position, speed, initiative, conditions, resources, ability scores, saves, defenses, traits, and active action profiles
   - runtime status such as recharge readiness, active buffs, condition timers, concentration aura, wild shape, death saves, ongoing effects, and containment
   - current Battlecast team tactic flags
   - tactic reference notes only when copied Battlecast full-turn delegates are intentionally exposed
   - recent combat logs
   - exact legal action ids
4. The LLM receives the observation and must call the OpenRouter tool `choose_d20bench_action` exactly once:

```json
{
  "tool": "choose_d20bench_action",
  "arguments": {
    "actionId": "attack:dagger:goblin-minion-blue-0-a4b5",
    "rationale": "Focus the wounded adjacent enemy."
  }
}
```

5. D20bench validates `actionId` against the legal-action catalogue.
6. If valid, D20bench applies the accepted action through the rules engine.
7. In `actual-actions-v1`, if the creature still has action economy remaining after that action, D20bench regenerates the legal-action catalogue from the updated state and asks the model for another concrete action. This is how Extra Attack, multiattack-like attack budgets, movement plus attack, and bonus actions are represented: the model attacks, sees the result in logs/state, and then chooses the next action.
8. If invalid, missing, or unparsable, D20bench records the raw provider response and retries. It does not silently convert malformed model output into `end_turn`.
9. The replay stores:
   - requested action id
   - accepted action
   - LLM model metadata
   - finish reason, tool-call id, retry count, and raw trace ids
   - token usage when available
   - latency
   - logs, animation events, and state hash

## Tool-Call Reliability And Raw Preservation

The OpenRouter adapter uses tools rather than freeform JSON as the primary contract. Each request includes a single `choose_d20bench_action` function whose `actionId` field is constrained to the current legal-action ids. When a model/provider supports forced tool choice, the request forces that tool. If OpenRouter reports that no route supports the forced `tool_choice` value, D20bench records that HTTP error, remembers that provider limitation for the model, and immediately retries the same decision with the tool schema still present but without forced `tool_choice`.

Every raw decision attempt is appended to:

```text
results/seasons/<season-id>/raw-decisions.jsonl
```

Those raw traces include request body, response body text, parsed response body, legal action ids, observation hash, match/turn metadata, parse status, parse error, and accepted action id when one exists. The file is ignored by git because it can contain full prompts and provider payloads, but it remains available locally for audit.

Malformed model output is fail-closed:

- Missing tool call: record `rejected`, retry with a repair instruction.
- Non-legal `actionId`: record `rejected`, retry with a repair instruction.
- Legal JSON content fallback: if a provider ignores the tool-call contract but returns parseable JSON containing a legal `actionId`, D20bench accepts it, records `toolCall: false` and `repairedJson: true`, and preserves the raw response. This keeps providers with partial tool support usable without letting models invent actions.
- Repeated malformed output: fail that match rather than inventing an action.
- Network error: record `network_error` and fail the match.
- OpenRouter forced-tool compatibility error: record `http_error`, then retry the same decision without forced `tool_choice`.

## OpenRouter Agent IDs

OpenRouter agents use dynamic ids:

```text
openrouter:<model-slug>
```

Examples:

```text
openrouter:openai/gpt-4o-mini
openrouter:anthropic/claude-sonnet-4.5
openrouter:deepseek/deepseek-chat
```

The API key is loaded from `.env.local`:

```text
OPENROUTER_API_KEY=...
```

## Parallel Season Runner

LLM seasons can run matches concurrently because the slow part is waiting on model responses. `runLlmSeason` builds the full fixture list first, runs a bounded worker pool, and stores each completed match by fixture index.

Ratings are still deterministic: Elo is applied only after all workers finish, in the original fixture order, not in API completion order. Parallelism changes wall-clock time, not the season math.

The CLI writes live progress to:

```text
results/seasons/<season-id>/progress.json
```

That file contains status, concurrency, completed/failed/running counts, active matches, recent matches, token usage, and estimated OpenRouter cost. Failed matches are recorded and the remaining fixtures continue, so one model/provider failure does not erase the whole run.

Run the current public frontier ladder with:

```bash
npm run build
npm run d20bench -- llm ladder run --season llm-frontier-smart-v1 --concurrency 6
```

Use a cost cap for full frontier runs:

```bash
npm run d20bench -- llm ladder run --season llm-frontier-smart-v1 --concurrency 6 --max-cost 50
```

For a cheap one-model-equivalent shakedown, cap the scheduled fixture list:

```bash
npm run d20bench -- llm ladder run --season llm-frontier-smart-v1 --match-limit 8 --concurrency 6 --out /tmp/d20bench-frontier-shakedown
```

## Current Scope

The first implementation is deliberately narrow:

- LLM agents choose from the existing D20bench legal-action catalogue.
- The historical primitive action space contains `attack`, `move_toward`, and `end_turn`.
- The historical full-turn action space also exposes copied Battlecast delegates: `battlecast_tactic:aggressive`, `battlecast_tactic:smart`, `battlecast_tactic:kiting`, and `battlecast_tactic:defensive`. These seasons verify tool calls and the copied Battlecast executor, but they are not the final fair action-space target.
- `actual-actions-v1` is the current fair-action-space target. It forbids Battlecast tactic delegates for OpenRouter agents and exposes concrete target-directed movement, exact `move_to:x,y` destination movement, Dash, Disengage, attack, spell, save, AoE, healing, buff, auto-dart, and end-turn actions. The async harness calls the model repeatedly within one creature turn when action economy remains.
- The current observation schema is `d20bench.llm_observation.v2`, which includes Battlecast-relevant tactical metadata: action/spell profiles, defenses, resources, recharges, buffs, condition timers, concentration/wild-shape state, team tactic flags, and tactic reference notes.
- Non-Battlecast agents now share Battlecast turn-start processing with the fixed tactic agents, including death saves, start-of-turn condition effects, movement reset, and skip-turn conditions.
- Battlecast tactic agents still delegate to copied Battlecast `executeTurn`.
- LLM replay verification checks structure but skips model reruns.
- `llm-smoke-v0` uses OpenRouter models for Kimi K2.7 Code, GLM 5.2, DeepSeek v4 Pro, DeepSeek v4 Flash, Qwen 3.5 Flash, Ministral 8B, and Llama 3.1 8B, plus `baseline.focus-fire`.
- `llm-frontier-public-v1` adds `anthropic/claude-opus-4.8`, `google/gemini-3.1-pro-preview`, `openai/gpt-5.5`, `baseline.random-legal`, and all copied Battlecast tactic agents.
- `llm-frontier-public-v1` does not run model-vs-model pairings. It matches each OpenRouter model against random and each copied Battlecast tactic agent in both side assignments.
- `llm-frontier-public-v1` runs the 6v6 goblin control plus the three 4v4 level-5 hero-party mirrors, capped at 3 rounds, with concurrency 8 by default.
- `llm-frontier-fullturn-v1` uses the same schedule but sets `llmActionSpace: battlecast-full-turn`, so LLMs can select the same full-turn Battlecast executor modes as the fixed tactic agents.
- `llm-frontier-smart-v1` is the going-forward public frontier benchmark. It keeps only `battlecast.smart` as the fixed opponent, uses the full-turn delegate action space, and runs two seeds across the chokepoint and status-pressure hero-party scenarios in both side assignments for 8 matches per model.
- `llm-frontier-smart-top3-10x-v1` is a separate replication run for Ministral 8B, Llama 3.1 8B, and Qwen 3.5 Flash. It uses the same two battle types and full-turn action space, but runs 20 seeds for 80 matches per model.
- `llm-frontier-smart-glm-10x-v1` is a separate GLM 5.2 replication run with the same two battle types, full-turn action space, and 20 seeds for 80 matches.
- `llm-toolcall-cheap-verify-v3` verifies the tool-call harness with Ministral 8B, Llama 3.1 8B, and Qwen 3.5 Flash against `battlecast.smart` on the two public hero-party mirrors.
- `llm-toolcall-glm-smart-20-v2` is the post-toolcall-fix GLM 5.2 check: 20 total matches against `battlecast.smart` using five seeds, two side assignments, and the two public hero-party mirrors. GLM uses a larger model-specific completion budget so its reasoning can reach the required tool call instead of truncating.
- `llm-toolcall-frontier-smart-16-v2` verifies GPT-5.5 and Claude Opus 4.8 after the tool-call harness fix, with 16 matches per model against `battlecast.smart`.
- `llm-actual-cheap-verify-v1` verifies the delegate-free actual-action harness with DeepSeek Flash, Ministral 8B, Llama 3.1 8B, and Qwen 3.5 Flash against `battlecast.smart`, capped to one seed across the chokepoint and status-pressure public hero-party mirrors. It should be run with `--max-cost 20` during harness validation.
- `llm-actual-cheap-verify-v2` repeats that scope after adding the legal JSON content fallback for providers that ignore `tool_calls`.
- `llm-actual-cheap-verify-v3` repeats that scope after tightening repair instructions so models must copy exact action ids rather than action labels such as `Longbow`.
- LLM ladder runs write `completed-matches.jsonl` checkpoints as matches finish; `--resume` reloads completed fixtures and continues with failed or unstarted fixtures.
- LLM ladder runs also write local `raw-decisions.jsonl` audit logs for every OpenRouter decision attempt. These are intentionally not published by default.
- Published benchmark results are append-only by season id: new experiments get new ids and new `results/seasons/<id>/` directories rather than overwriting previous runs.

This gives us a safe, auditable harness before we spend significant model budget.

## Next Work

`actual-actions-v1` now replaces full-turn delegates as the fairness bridge. The remaining work is to keep widening the concrete catalogue until it matches every relevant Battlecast decision point:

- dodge and help
- split-target Magic Missile and beam-style multiattacks
- class-specific bonus actions such as Rage movement, Flurry, Steady Aim, and Wild Shape
- reactions and optional smite/slot choices
- richer AoE line/cone aim choices

Until those are covered, `actual-actions-v1` results should be treated as harness-validation results, not final leaderboard claims.
