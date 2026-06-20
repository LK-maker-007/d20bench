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
   - tactic reference notes for the copied Battlecast full-turn delegates
   - recent combat logs
   - exact legal action ids
4. The LLM receives the observation and must return structured JSON:

```json
{
  "actionId": "attack:dagger:goblin-minion-blue-0-a4b5",
  "rationale": "Focus the wounded adjacent enemy."
}
```

5. D20bench validates `actionId` against the legal-action catalogue.
6. If valid, D20bench applies the accepted action through the rules engine.
7. If invalid or unparsable, D20bench records the failure and falls back to `end_turn`.
8. The replay stores:
   - requested action id
   - accepted action
   - LLM model metadata
   - token usage when available
   - latency
   - logs, animation events, and state hash

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
- The full-turn action space also exposes copied Battlecast delegates: `battlecast_tactic:aggressive`, `battlecast_tactic:smart`, `battlecast_tactic:kiting`, and `battlecast_tactic:defensive`.
- The current observation schema is `d20bench.llm_observation.v2`, which includes Battlecast-relevant tactical metadata: action/spell profiles, defenses, resources, recharges, buffs, condition timers, concentration/wild-shape state, team tactic flags, and tactic reference notes.
- Battlecast tactic agents still delegate to copied Battlecast `executeTurn`.
- LLM replay verification checks structure but skips model reruns.
- `llm-smoke-v0` uses OpenRouter models for Kimi K2.7 Code, GLM 5.2, DeepSeek v4 Pro, DeepSeek v4 Flash, Qwen 3.5 Flash, Ministral 8B, and Llama 3.1 8B, plus `baseline.focus-fire`.
- `llm-frontier-public-v1` adds `anthropic/claude-opus-4.8`, `google/gemini-3.1-pro-preview`, `openai/gpt-5.5`, `baseline.random-legal`, and all copied Battlecast tactic agents.
- `llm-frontier-public-v1` does not run model-vs-model pairings. It matches each OpenRouter model against random and each copied Battlecast tactic agent in both side assignments.
- `llm-frontier-public-v1` runs the 6v6 goblin control plus the three 4v4 level-5 hero-party mirrors, capped at 3 rounds, with concurrency 8 by default.
- `llm-frontier-fullturn-v1` uses the same schedule but sets `llmActionSpace: battlecast-full-turn`, so LLMs can select the same full-turn Battlecast executor modes as the fixed tactic agents.
- `llm-frontier-smart-v1` is the going-forward public frontier benchmark. It keeps only `battlecast.smart` as the fixed opponent, uses the full-turn delegate action space, and runs two seeds across the chokepoint and status-pressure hero-party scenarios in both side assignments for 8 matches per model.
- `llm-frontier-smart-top3-10x-v1` is a separate replication run for Ministral 8B, Llama 3.1 8B, and Qwen 3.5 Flash. It uses the same two battle types and full-turn action space, but runs 20 seeds for 80 matches per model.
- LLM ladder runs write `completed-matches.jsonl` checkpoints as matches finish; `--resume` reloads completed fixtures and continues with failed or unstarted fixtures.
- Published benchmark results are append-only by season id: new experiments get new ids and new `results/seasons/<id>/` directories rather than overwriting previous runs.

This gives us a safe, auditable harness before we spend significant model budget.

## Next Work

The full-turn delegate action space gives LLMs access to the same Battlecast executor used by the fixed tactic agents without hand-reimplementing every rule. A later, more inspectable option generator can expand those delegates into explicit legal options:

- spell casts
- AoE centers and lines/cones
- buffs and debuffs
- healing and revive actions
- multiattack
- dash, dodge, disengage, help
- bonus actions and reactions

Once these are engine-generated legal actions, LLM agents can choose exact whole-turn plans instead of choosing a Battlecast tactic delegate. The current full-turn delegate mode is the fairness bridge until that richer planner exists.
