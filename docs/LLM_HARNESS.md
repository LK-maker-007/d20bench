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
3. D20bench builds a compact LLM observation:
   - round and turn index
   - active creature
   - allies and enemies with HP, AC, position, conditions, and resources
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

Run the current smoke ladder with:

```bash
npm run build
npm run d20bench -- llm ladder run --concurrency 3
```

## Current Scope

The first implementation is deliberately narrow:

- LLM agents choose from the existing D20bench legal-action catalogue.
- Current legal actions are `attack`, `move_toward`, and `end_turn`.
- Battlecast tactic agents still delegate to copied Battlecast `executeTurn`.
- LLM replay verification checks structure but skips model reruns.
- The first LLM season roster uses OpenRouter models for Kimi K2.7 Code, GLM 5.2, DeepSeek v4 Pro, DeepSeek v4 Flash, Qwen 3.5 Flash, Ministral 8B, and Llama 3.1 8B, plus `baseline.focus-fire`.

This gives us a safe, auditable harness before we spend significant model budget.

## Next Work

The important next step is expanding the legal-action catalogue:

- spell casts
- AoE centers and lines/cones
- buffs and debuffs
- healing and revive actions
- multiattack
- dash, dodge, disengage, help
- bonus actions and reactions

Once these are engine-generated legal actions, LLM agents can use them through the same harness without changing the model-control contract.
