# Building A Fair Actual-Action Harness For D20bench

D20bench is trying to measure tactical D&D combat competence under the copied
Battlecast SRD rules. That sounds simple until the agent boundary becomes fuzzy.
If an LLM is allowed to call "play smart" and Battlecast executes a whole turn
for it, the model is not really playing the game. If the LLM only gets
`attack`, `move`, and `end_turn`, it is also not really playing the same game as
Battlecast Smart, because the copied engine can cast spells, spend class
resources, make reactions, move through terrain, heal, buff, disable, and exploit
action economy.

The current harness answers that by making the LLM choose actual concrete legal
actions one at a time. The engine remains responsible for rules and randomness.
The model supplies intent only through exact action ids from the current legal
action catalogue. This document explains the design, where the code lives, and
what the latest runs taught us.

## The Important Lesson From The Early Runs

The first serious benchmark problem was not that the models were weak. It was
that the control interface was not yet fair enough to interpret the results.

There were two earlier modes:

- `primitive`: small actions such as attack, move toward, and end turn.
- `battlecast-full-turn`: full-turn delegate actions such as
  `battlecast_tactic:smart`.

Both were useful for bringing the system up. `primitive` proved that LLMs could
participate in the deterministic runner. `battlecast-full-turn` proved that
tool-call selection, OpenRouter cost accounting, parallel seasons, and copied
Battlecast policies could all be wired together. But neither mode was the right
final comparison against `battlecast.smart`.

The core fairness bug was this: a full-turn delegate is a policy, not an action.
Letting an LLM select `battlecast_tactic:smart` means the LLM delegates the
actual gameplay to Battlecast. Preventing the LLM from selecting delegates but
only giving it primitive actions means Battlecast still has a much richer action
space. The only interpretable middle ground is:

1. Generate every currently legal concrete action from the real engine state.
2. Show those exact actions to the model.
3. Require one exact action id.
4. Apply that action through the copied Battlecast rules.
5. Ask again if the creature still has action economy left.

That is `actual-actions-v1`.

## The Current Harness Loop

The shortest version is: D20bench is an environment loop, not a chat loop.

The central orchestrator is `runAgentMatchAsync` in
`packages/engine/src/agent-match.ts`. It creates the deterministic battle state,
walks initiative, identifies the controller for the active creature, records
replay events, and dispatches OpenRouter LLMs into the actual-action loop when
`llmActionSpace` is `actual-actions-v1`.

The important code path is:

- `packages/engine/src/agent-match.ts`
  - `runAgentMatchAsync`
  - `processManualAgentTurnStart`
  - `runStepwiseOpenRouterTurn`
  - `createActionCatalogueForAgent`
  - `applyActualLegalAction`
  - `prepareOpportunityReactionChoicesForBattlecastTurn`
  - `createOpportunityAttackHooks`
- `packages/engine/src/legal-actions.ts`
  - `generateLegalActions`
  - the `LegalAction` union and stable action id helpers
- `packages/engine/src/llm-observation.ts`
  - `buildLlmBattleObservation`
- `packages/engine/src/openrouter-agent.ts`
  - `chooseOpenRouterAction`
  - `buildOpenRouterToolRequest`
  - `parseModelDecision`
  - `buildRawTrace`
- `packages/engine/src/replay.ts`
  - replay event types and verification contracts
- `packages/engine/src/llm-season.ts`
  - `runLlmSeason`
  - `summarizeLlmHarnessAudit`
  - `auditLlmSeasonResult`
  - season definitions such as `llmActualCheapRoundRobinV2Season`

Here is the flow in more detail.

1. `runAgentMatchAsync` starts from a public or hidden scenario, seeds the
   Battlecast-compatible RNG, creates the copied Battlecast state, and pushes a
   `match_started` replay event.
2. At the start of each creature turn, `processManualAgentTurnStart` applies the
   same turn-start machinery that Battlecast-controlled turns use: start-of-turn
   effects, movement reset, skip-turn conditions, passive auras, death-state
   handling, and related bookkeeping.
3. If the active controller is an OpenRouter LLM and the season uses
   `actual-actions-v1`, `runStepwiseOpenRouterTurn` takes over.
4. `runStepwiseOpenRouterTurn` builds an `ActualTurnContext`. This tracks
   things that matter inside a single turn: remaining attack rolls, whether the
   attack action has started, bonus-action availability, Flurry strikes, pending
   smite choices, disengage state, and whether the turn has ended.
5. For the current state and active creature, `createActionCatalogueForAgent`
   calls `generateLegalActions` with `includeActualActions: true`.
6. `generateLegalActions` returns a `LegalActionCatalogue` containing exact
   legal actions and an `actionEconomy` snapshot. In `actual-actions-v1`, this
   can include target-directed attacks, exact `move_to:x,y` destinations, Dash,
   Disengage, Dodge, Help, Stabilise, class features, spell casts, AoE centers,
   line and cone directions, healing, buffs, smites, maintained spell follow-ups,
   retarget actions, reactions, and `end_turn`.
7. `runStepwiseOpenRouterTurn` records a `turn_started` replay event with the
   legal actions, action space, action economy, active creature, controller, and
   state hash.
8. `buildLlmBattleObservation` serializes the battle state for the model. The
   observation includes the active creature, other creatures, HP, AC, positions,
   conditions, defenses, resources, action profiles, spell metadata, active
   buffs, condition timers, grid blockers, team tactic flags, recent logs, the
   action economy snapshot, and the exact legal action ids.
9. `chooseOpenRouterAction` sends that observation to OpenRouter with a single
   tool named `choose_d20bench_action`. The tool schema constrains `actionId` to
   the current legal ids.
10. The returned `actionId` is validated against the same catalogue. A missing
    tool call, malformed arguments, multiple tool calls, or non-legal action id
    is rejected and retried with a repair prompt. The harness does not silently
    convert bad output to `end_turn`.
11. `applyActualLegalAction` applies the accepted action through the copied
    Battlecast rules and D20bench wrappers. Dice, saving throws, spell effects,
    resources, reactions, damage, death saves, movement, logs, and animation
    events are all owned by the engine.
12. The harness records `action_resolved` with the requested action id, accepted
    action object, LLM trace metadata, new logs/events, and state hash.
13. If the creature still has action economy, the loop repeats from a fresh
    catalogue built from the updated state. This is the key design decision:
    models attack, see the result, and then choose the next action.

The loop has a step cap so a broken model cannot create an infinite turn. Hitting
that cap ends the turn through the engine and records the event in the replay.

## Why Stepwise Control Matters

D&D combat is not one decision per turn. A level-5 Fighter may attack, see a hit
or miss, spend Action Surge, then attack again. A Paladin may hit and then decide
whether to Divine Smite. A Warlock's Eldritch Blast is multiple beams. A Monk may
attack and then spend ki. A caster may move, cast a bonus-action spell, and then
still make another legal choice depending on the rules state. Reactions also
happen at trigger time, often during another creature's turn.

A one-shot "plan the whole turn" interface would force the model to commit before
it sees dice and effects. Battlecast Smart does not operate under that handicap:
it executes against the real state as the turn unfolds. `actual-actions-v1`
therefore asks the model for one concrete action, applies it, and asks again from
the updated state if more can happen.

The latest broad run proves this path is being exercised. In
`llm-actual-cheap-round-robin-v2`, the audit recorded 826 model turns with more
than one model decision and 3,005 post-action continuations. The maximum was 10
model actions in one turn. In the GLM spot check, 46 model turns were stepwise,
with 142 continuations and a max of 7 actions in one turn.

Those numbers matter because they show the harness is no longer just asking for
whole-turn summaries. The models are operating inside the action economy.

## What The Model Sees

The LLM observation schema is built in
`packages/engine/src/llm-observation.ts` by `buildLlmBattleObservation`.

The important fields are:

- `schemaVersion`: currently `d20bench.llm_observation.v2`.
- `objective`: a short instruction matched to the active action space.
- `actionSpace`: `actual-actions-v1` for the fair harness.
- `actionEconomy`: remaining main action, attack-roll budget, bonus action,
  movement, pending smite, Flurry strikes, and related state.
- `activeCreature`: the creature being controlled.
- `creatures`: visible runtime state for all combatants.
- `grid`: map size plus movement and line-of-sight blockers.
- `legalActions`: the exact current action ids and compact action descriptions.
- `recentLogs`: the last combat log entries, so the model can react to what just
  happened.
- `tacticReference`: only populated in `battlecast-full-turn`, not in
  `actual-actions-v1`.

This is not literally the same representation Battlecast Smart uses internally.
Battlecast Smart is code operating directly over the Battlecast state, while an
LLM receives a serialized state. The fairness claim is narrower and more useful:
the LLM sees the same rules state it needs to make the same kind of action
choice, and both agents' choices are resolved by the same engine.

The critical removed deltas are:

- no hidden Battlecast delegate actions are shown to OpenRouter agents in
  `actual-actions-v1`;
- no automatic Battlecast tactical policy chooses the model's spell, target, or
  class-feature spend;
- post-action and trigger-time decisions are exposed as additional concrete
  choices when they happen;
- actions that are not currently legal because of range, resources, line of
  sight, action economy, or state are not in the enum.

## Tool Calls And Fail-Closed Parsing

The OpenRouter adapter lives in `packages/engine/src/openrouter-agent.ts`.

`chooseOpenRouterAction` constructs the model request, hashes the observation,
records the legal action ids, sends the request, parses the response, validates
the chosen id, and returns an accepted action plus trace metadata.

The tool contract is intentionally tight:

```json
{
  "name": "choose_d20bench_action",
  "arguments": {
    "actionId": "attack:Longbow:blue-ranger-1234",
    "rationale": "Focus the exposed ranged threat."
  }
}
```

The actual schema uses an enum of the exact legal ids for this decision. If the
model returns "Longbow", "attack the ranger", or an action id from a previous
step, that is rejected. If a provider ignores tool calls but returns parseable
JSON with a legal `actionId`, the adapter accepts it as a JSON fallback and marks
the trace accordingly. This keeps provider quirks from breaking the whole run
without allowing invented actions.

Every attempt can be written to:

```text
results/seasons/<season-id>/raw-decisions.jsonl
```

Those raw traces include the request body, response body, parse status, parse
error, legal action ids, observation hash, turn metadata, and accepted action id
when one exists. The file is ignored by git because it can contain full prompts
and provider payloads, but it is essential for local audit.

The important policy is fail-closed. Repeated malformed output fails the match
instead of silently inventing a default action. This was one of the main lessons
from the GLM and frontier checks: tool-call reliability has to be measured and
preserved, not smoothed over.

## Replays, Checkpoints, Audits, And The Site

The harness is useful because it leaves artifacts.

Each match replay records:

- `match_started`, `round_started`, `turn_started`, `action_resolved`,
  `round_ended`, and `match_finished` events;
- the controller for the active creature;
- the action space;
- the turn-start legal actions;
- action economy snapshots;
- requested and accepted action ids;
- LLM generation metadata and token usage when present;
- logs, animation events, and state hashes.

LLM seasons are defined and run through `packages/engine/src/llm-season.ts`.
`runLlmSeason` creates fixtures, runs a bounded worker pool for parallel API
waiting, writes progress, appends completed match checkpoints, computes Elo, and
renders `standings.json` plus `standings.md`.

Important output files:

```text
results/seasons/<season-id>/progress.json
results/seasons/<season-id>/completed-matches.jsonl
results/seasons/<season-id>/standings.json
results/seasons/<season-id>/standings.md
results/seasons/<season-id>/raw-decisions.jsonl
```

`completed-matches.jsonl` and `raw-decisions.jsonl` are local audit material and
resume state. Published standings are append-only by season id: a new run should
get a new id and a new result directory rather than overwrite an old run.

The fairness audit is computed by `summarizeLlmHarnessAudit` and checked by
`auditLlmSeasonResult` in `packages/engine/src/llm-season.ts`. The CLI command is
implemented in `packages/engine/src/cli.ts`:

```bash
npm run d20bench -- llm audit --season llm-actual-cheap-round-robin-v2 --require-stepwise --require-actual-actions
```

The audit checks the things we actually care about:

- model turn starts and action resolutions;
- model legal-action exposures to `battlecast_tactic`;
- model selections of `battlecast_tactic`;
- whether model turn starts used `actual-actions-v1`;
- stepwise model turns and continuations;
- tool-call decisions, JSON fallbacks, and repair attempts;
- no-effect movement actions;
- invalid model action applications;
- accepted action-key counts.

The results site reads the generated season artifacts. The build script at
`scripts/build-results-site-data.mjs` pulls `results/seasons/*/standings.json`
into the static site data, and `apps/results-site/app.js` surfaces the harness
metrics in the season overview.

## What The Latest Broad Run Says

The latest broad confidence run is:

```text
llm-actual-cheap-round-robin-v2
```

It ran DeepSeek Flash, Ministral 8B, Qwen 3.5 Flash, Llama 3.1 8B, and
`battlecast.smart` in an ordered round robin. The scenarios were the two public
4v4 level-5 hero-party mirrors:

- `public.hero-mirror-chokepoint-l5.v1`
- `public.hero-mirror-status-l5.v1`

Both side assignments were used for every unordered pair, with seed 1 and four
combat rounds per match. The season completed 40/40 matches with 0 failures.

Overall result:

| Agent | Elo | Record |
| --- | ---: | ---: |
| `battlecast.smart` | 1130.0 | 14-2 |
| `openrouter:deepseek/deepseek-v4-flash` | 1036.3 | 10-6 |
| `openrouter:mistralai/ministral-8b-2512` | 983.6 | 7-9 |
| `openrouter:qwen/qwen3.5-flash-02-23` | 971.0 | 7-9 |
| `openrouter:meta-llama/llama-3.1-8b-instruct` | 879.1 | 2-14 |

By battle type:

| Agent | Chokepoint | Status Pressure |
| --- | ---: | ---: |
| `battlecast.smart` | 8-0 | 6-2 |
| `openrouter:deepseek/deepseek-v4-flash` | 5-3 | 5-3 |
| `openrouter:mistralai/ministral-8b-2512` | 3-5 | 4-4 |
| `openrouter:qwen/qwen3.5-flash-02-23` | 4-4 | 3-5 |
| `openrouter:meta-llama/llama-3.1-8b-instruct` | 0-8 | 2-6 |

Harness audit:

| Metric | Value |
| --- | ---: |
| Model turn starts | 4,322 |
| Model action resolutions | 4,322 |
| Model delegate legal-action exposures | 0 |
| Model delegate selections | 0 |
| Model `actual-actions-v1` turn starts | 4,322 |
| Stepwise model turns | 826 |
| Post-action continuations | 3,005 |
| Max model actions in one turn | 10 |
| Tool-call decisions | 3,150 |
| JSON fallback decisions | 499 |
| Repair attempts | 13 |
| Invalid action applications | 0 |
| No-effect movement actions | 0 |

Published accepted-decision cost was `$5.103671`. Local raw API-attempt
accounting for the completed season was `$7.280952`, because rejected attempts
and provider retries exist in the raw traces even when only accepted decisions
are summarized in the published standings.

The action mix is the strongest evidence that this was a real action-space run.
The accepted actions included movement, opportunity attacks, longbow and javelin
attacks, Eldritch Blast, Healing Word, Hunter's Mark, Scorching Ray, Shield of
Faith, Action Surge, Lay on Hands, Guiding Bolt, Hex, Cure Wounds, Bardic
Inspiration, Wild Shape, Dissonant Whispers, Hold Person, Shining Smite, Cutting
Words, Spiritual Weapon, Aid, Produce Flame, Divine Smite, Magic Missile,
Stabilise, Bless, Fireball, Spirit Guardians, Lightning Bolt, and Entangle.

That is the key confidence result: the model side is no longer a strategy
delegate and no longer a toy action set.

## What The GLM Spot Check Says

The latest strong-model spot check is:

```text
llm-actual-glm-smart-4round-v1
```

It ran GLM 5.2 against `battlecast.smart` on the same two public hero-party
mirrors, both side assignments, four combat rounds per match. It completed 4/4
matches with 0 failures and stopped at the configured `$3.00` published cost
cap.

Result:

| Agent | Elo | Record |
| --- | ---: | ---: |
| `battlecast.smart` | 1023.8 | 3-1 |
| `openrouter:z-ai/glm-5.2` | 976.2 | 1-3 |

GLM's win was on the status-pressure board with `battlecast.smart` as red and
GLM as blue. Chokepoint was 0-2 for GLM; status-pressure was 1-1.

Harness audit:

| Metric | Value |
| --- | ---: |
| Model turn starts | 210 |
| Model action resolutions | 210 |
| Model delegate legal-action exposures | 0 |
| Model delegate selections | 0 |
| Model `actual-actions-v1` turn starts | 210 |
| Stepwise model turns | 46 |
| Post-action continuations | 142 |
| Max model actions in one turn | 7 |
| Tool-call decisions | 168 |
| JSON fallback decisions | 0 |
| Repair attempts | 1 |
| Invalid action applications | 0 |
| No-effect movement actions | 0 |

Published accepted-decision cost was `$3.034636`. Local raw API-attempt
accounting was `$4.333136`, including the rejected repair attempt and raw
provider usage.

The main interpretation is not "GLM is bad." Four matches is too small for that.
The more useful interpretation is that tool-call cleanliness and tactical skill
are separate. GLM produced clean tool calls, used concrete actions, and still did
not obviously beat Battlecast Smart in this tiny check. That suggests the current
benchmark is testing policy quality, not just API compliance.

## What We Learned

The first lesson is that `battlecast.smart` is a strong baseline. It is not a
generic random heuristic. It has native access to the same copied rules, mature
Battlecast tactical code, and no serialization overhead. In the fair-action
round robin it went 14-2 overall and 8-0 on the chokepoint board.

The second lesson is that the models are not helpless once the action space is
fair. DeepSeek Flash went 10-6 overall and 5-3 on both public battle types. Qwen
and Ministral were competitive with each other. Even Llama, which struggled
overall, found status-pressure wins. This means the harness is capable of
separating model policies instead of reducing everything to invalid-action noise.

The third lesson is that battle type matters. The chokepoint board is punishing:
positioning, line effects, and poor movement snowball quickly. Battlecast Smart
dominated there. The status-pressure board generated more model wins and more
useful variance, probably because there are more support, disable, focus-fire,
and recovery choices where policy differences show up.

The fourth lesson is that stepwise action economy is non-negotiable. The latest
runs contain hundreds of multi-decision model turns. Without this, the harness
would hide many of the most important D&D choices: whether to spend a reaction,
whether to smite after a crit, whether to move after seeing an attack miss, or
whether to spend Action Surge after the first attack action.

The fifth lesson is that provider behavior must be archived exactly. Cheap models
and providers sometimes emit JSON content instead of tool calls. Some need repair
prompts. Some are verbose enough that raw API-attempt cost and accepted-decision
cost differ materially. Preserving `raw-decisions.jsonl` lets us debug those
differences without weakening the benchmark contract.

The sixth lesson is cost is mostly a product of observation size times stepwise
decisions. The cheap round robin was affordable even at 3,649 accepted decisions,
but it used 55.3M prompt tokens because the state is rich and sent repeatedly.
GLM was much more expensive per match because of model pricing and completion
behavior. Future cost work should focus on observation compaction, stable
references, and maybe action-profile deduplication rather than reducing the
rules complexity.

The seventh lesson is that small samples should stay labeled as harness
validation. `llm-actual-cheap-round-robin-v2` is enough to say the harness is
working and the benchmark is interesting. It is not enough to publish universal
claims about model strength. Production leaderboard runs need more seeds,
confidence intervals, and probably a compact replay analysis tool for common
misplays.

## What Is Fair Now, And What Is Still Not Perfect

The current setup is fair in the important benchmark sense:

- OpenRouter agents in `actual-actions-v1` cannot see or select Battlecast
  tactic delegates.
- Every model action is selected from the engine-generated legal catalogue.
- The engine, not the model, applies all rules and dice.
- The model receives post-action state before making further same-turn choices.
- Reactions and trigger-time choices are explicit legal actions when implemented.
- The audit proves no delegates, invalid applications, or no-effect movement
  actions occurred in the latest runs.

There are still differences to be honest about:

- Battlecast Smart is handwritten code over native state; an LLM sees serialized
  JSON. That is a real representation difference.
- The observation is large. That is expensive and may make some models worse
  simply because they are managing a lot of text.
- `actual-actions-v1` only covers mechanics that have been represented as
  concrete actions or explicitly classified as passive/automatic. As more
  Battlecast rules are copied, the legal action layer must keep up.
- The latest public runs use only two battle types and limited seeds. They are
  harness-confidence runs, not final science.

The design direction is still right. The fix for these gaps is not to simplify
the fights. It is to keep the full game state, compress observations carefully,
add concrete actions for newly copied mechanics, and archive enough runs to make
the statistics meaningful.

## Tests That Protect The Harness

Most of the action-space protections live in unit tests under
`packages/engine/tests`.

Useful pointers:

- `packages/engine/tests/openrouter-agent.test.ts`
  - forces a single tool call with the current legal action enum;
  - repairs missing tool calls without converting to `end_turn`;
  - accepts legal JSON fallbacks from providers that ignore `tool_calls`;
  - rejects repeated malformed output;
  - serializes delegate-free actual-action observations.
- `packages/engine/tests/agent-match.test.ts`
  - checks concrete spell actions in `actual-actions-v1`;
  - exercises stepwise Eldritch Blast beams;
  - verifies Action Surge and follow-up attacks;
  - verifies Stabilise;
  - verifies opportunity attacks and damage reactions;
  - verifies Bard Cutting Words trigger handling;
  - checks no delegate exposure in actual-action LLM turns.
- `packages/engine/tests/llm-season.test.ts`
  - checks actual-action season definitions;
  - summarizes harness audit counters;
  - fails audit checks for delegate exposure, delegate selection, invalid
    applications, no-effect movement, and missing stepwise turns.

The important pattern is: every time a new Battlecast mechanic becomes available
to models, it should get both a concrete legal-action representation and a test
that proves the model chooses the exact action id through the harness.

## How To Reproduce The Current Confidence Checks

The OpenRouter key is loaded from `.env.local`:

```text
OPENROUTER_API_KEY=...
```

Build first:

```bash
npm run build
```

Run the latest broad cheap round robin:

```bash
npm run d20bench -- llm ladder run --season llm-actual-cheap-round-robin-v2 --resume --max-cost 10
```

Run the GLM spot check:

```bash
npm run d20bench -- llm ladder run --season llm-actual-glm-smart-4round-v1 --resume --max-cost 3
```

Audit a completed actual-action season:

```bash
npm run d20bench -- llm audit --season llm-actual-cheap-round-robin-v2 --require-stepwise --require-actual-actions
```

Regenerate the site data after new standings are archived:

```bash
npm run results:site:data
```

The site itself serves the generated artifacts. It should not recompute ratings
or mutate historical results.

## The Next Sensible Work

The harness is now credible enough to run small public-confidence seasons. The
next improvements should make it cheaper, easier to inspect, and harder to
misinterpret:

- Add observation compression without removing tactical information.
- Add per-turn qualitative analysis: wasted turns, low-value target choices,
  missed healing, missed concentration opportunities, bad movement, and
  overkill.
- Add confidence intervals or a rating model that better communicates
  uncertainty for small samples.
- Keep adding focused hidden smoke seasons whenever a new concrete action family
  is implemented.
- Continue append-only result publishing by season id.
- Treat final leaderboard claims as a later phase, after more seeds and larger
  production runs.

The key thing learned from the latest runs is that the benchmark is finally
testing the right object. We are no longer mostly measuring whether a model can
format a strategy delegate, and we are no longer forcing the model into a toy
subset of D&D. The LLM now sees the current battle, chooses an exact legal action,
the engine resolves it, and the replay proves what happened.
