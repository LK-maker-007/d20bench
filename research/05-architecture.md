# 05. Architecture decision

Status: stage 0 passed ([report](stages/0-integrity.md)); stage 1 failed its parity gate, with causes found ([report](stages/1-imitation.md)). Stage 2 passed against `battlecast.smart` on both maps ([report](stages/2-planner.md)); its planner builds candidates from the menu itself. Stage 3 found strength still rising with compute at 4x ([report](stages/3-budget.md)); the language stays TypeScript for now. Stage 6b found that without Smart in its simulations the planner is much weaker on chokepoint ([report](stages/6b-independence.md)). The earlier draft `search-agent.ts` was discarded unmerged (see [corrections.md](corrections.md), entry 1).

## Decisions taken

| decision | choice | reason |
|---|---|---|
| agent name | LK-47; agent id `lk-47`, variants `lk-47.<variant>`; code in `packages/engine/src/lk-47/` | my choice; id follows upstream `family.variant` style, folder follows upstream kebab-case |
| repository | private GitHub repo `LK-maker-007/LK-47` (remote `lk47`), one branch per stage, starting with `lk-47/stage-0`; `main` is not pushed. A public fork of `bjedrzejewski/d20bench` comes later, as the route for the upstream PR | upstream has no license, so the work stays private until a fork is made to publish it; forks of public repos are public |
| CI | none | upstream has none; unit tests take seconds locally and the bot-matrix regression takes 20 minutes; each stage gate requires pasted `npm test` and `npm run typecheck` output instead |
| language | TypeScript; Rust only if stage 3 shows the agent is compute-bound | [03-performance-and-language.md](03-performance-and-language.md#the-language-decision) |

## 1. The decision and what would change it

Decide what to build, in what order, in which language, so that a CPU-only non-LLM agent beats every D20bench opponent under the fairfix protocol.

A design qualifies only if the evidence says it can beat the strongest scripted bot on each map by a margin we can confirm at our compute. That bar is concrete: `battlecast.aggressive` on chokepoint and status pressure, `battlecast.kiting` on goblin warband, and a near three-way tie on the balanced mirror ([02-measurements.md](02-measurements.md#strongest-bot-per-map)).

## 2. Census

Four surveys, each with its failures listed:

| file | covers |
|---|---|
| [04-literature/tactics-search.md](04-literature/tactics-search.md) | Hero Academy, flexible-horizon EMCTS, Tribes and Stratega, microRTS, SparCraft, GVGAI, *-minimax, Bertsekas rollout, backgammon rollout |
| [04-literature/competitions.md](04-literature/competitions.md) | Bot Bowl I-V, Hearthstone 2018-20, Legends of Code and Magic, Pokémon Showdown, LLM vs engine head to heads |
| [04-literature/learning.md](04-literature/learning.md) | AlphaZero, MuZero, Stochastic MuZero, Gumbel AlphaZero, KataGo, JEPA, Dreamer, PPO, cloning plus RL, expert iteration, TD-Gammon |
| [04-literature/dnd-combat-ai.md](04-literature/dnd-combat-ai.md) | every D&D combat agent found, DungeonBench, Setting the DC, D20bench's own notes |

## 3. Matrix

**Unanimous, so load-bearing**
1. When an exact simulator exists, plan with it. No learned world model beat one; the best case is a tie (MuZero, Stochastic MuZero, Hamrick et al., MiniZero).
2. A hand-written policy or evaluator sits in every winner's loop, or a teacher to imitate. The exceptions spent industrial compute.
3. The per-turn action space is cut before search: pruning, script portfolios, unit ordering, or whole-turn plans. All nine search settings.
4. Positions are judged at a short horizon with an evaluation, or with one-turn or truncated rollouts. No winner used long random playouts.
5. Dice are handled by explicit probabilities, grouped outcomes, or a short sampled horizon.

**Contested, so free parameters**
- Evolution vs tree search over turns (flips with turn length and pruning).
- How deep to search (Hearthstone 1 to 3 own-turn steps; LOCM depth-3 minimax; Bot Bowl winners mostly none).
- Whether a learned value function is worth it at small compute.

**Correlates with failure**
- Unconstrained MCTS over atomic actions (Hero Academy, Tribes, microRTS, Bot Bowl).
- Random playouts on multi-action turns (Bot Bowl tutorial: 2 of 20 against Random).
- RL from scratch (Blood Bowl, hobby AlphaZero backgammon); RL fine-tuning without an anchor to the teacher (MimicBot, RAISocketAI).
- Too few evaluations per decision.
- General game-playing search with shallow random playouts against D&D rule bots (Shyne 2023: tied or lost).

**Explicitly rejected by the people who tried them**
- Rollouts longer than one turn inside evolutionary planning (Hero Academy).
- Opponent-hand prediction that ate search time (LOCM ProphetCoac).
- Evolved weights over hand-tuned ones (EvoGrod lost to GrodBot).

**Beliefs the matrix contradicted**
- I expected MCTS to dominate these competitions. Scripted evaluators and shallow own-turn search won most of them.
- I treated `battlecast.smart` as the bot to beat. `battlecast.aggressive` beats it about 59% on both headline maps.
- My parked draft compared its final two candidates on 32 samples each. That leaves a standard error of about 0.125 on the difference, far too noisy; backgammon rollout used about 10^4 trials per candidate.

## 4. Transfer analysis

| their condition | ours | does it transfer? |
|---|---|---|
| Bot Bowl: dice, multi-action turns, grid, scripted winners | the same shape; Battlecast's bots are hand-tuned heuristics (the author described about 2,700 lines in April 2026; the copied `ai*.ts` files total 6,057 lines today [V]) | yes. Our edge has to come from search on top of strong scripts, not from replacing them |
| Hero Academy, FH-EMCTS: whole-turn plans win at 3 to 5 action points | 3 to 4 decisions per creature turn | yes for planning whole turns. Their games were deterministic, so averaging plans over dice is our addition [H] |
| backgammon rollout: about 10^4 trials per candidate | 77 to 98 full playouts per second per core (10 to 13 ms each, two measurements) [V] | only with fewer candidates, truncated playouts and shared seeds |
| competition time limits (40 ms to 6 s per decision) | the harness sets no time limit for non-LLM agents; LLMs take seconds per decision | we can think longer than any competition entry; evaluation throughput is the real limit |
| Bertsekas guarantee: exact Q-factors, fixed opponent model, agents choosing in a fixed order | Monte Carlo estimates, unknown opponents, initiative fixed per match | approximate improvement over the base policy against that base policy as opponent model; nothing guaranteed against LLMs [H] |
| learned world models (JEPA, MuZero) | exact engine, 12 to 13 ms per full playout [V] | no; rejected |
| expert iteration and Gumbel AlphaZero at small compute | 104 decisions per side per match [V]; Kaggle T4 for training | feasible later, only if search turns out compute-bound |

## 5. Arithmetic on our numbers

Measured [V]: 12 to 13 ms per full bare playout; 3.7 to 9.7 ms for two rounds; 0.1 to 0.3 ms per state copy; 104 decisions per side per match; mean match length 5.2 rounds (chokepoint) to 15.5 rounds (status pressure) for Smart against itself.

Estimates [H]:
- Expensive re-planning happens once per creature turn, not once per menu step: about 4 creatures times the rounds they survive, roughly 20 (chokepoint) to 50 (status pressure) re-plans per side per match.
- One re-plan with 8 candidate plans, 16 samples each, 2-round truncated playouts at about 5 ms: about 0.64 s.
- Per match per core: about 13 to 32 s of thinking. On 8 cores, about 900 to 2,200 matches per hour.
- A 400-game pairing then takes 11 to 27 minutes, and a 20-pairing confirmatory run about 4 to 9 hours.

Without truncation, the same budget at 12.5 ms per full playout gives 2.5 times fewer samples, which is why truncation plus an evaluation function is central.

## 6. Recommendation

**One sentence.** A portfolio rollout planner: at each creature turn, generate a small set of whole-turn plans from the engine's own bots plus targeted variants, play each forward several times on the exact engine with the agent's own dice, judge the result after two rounds with an evaluation function, and execute the best plan step by step through the legal menu, re-planning when the dice change the picture.

**Components**

| part | choice | evidence |
|---|---|---|
| world model | the benchmark's own TypeScript engine, lean state copies, private dice generator | matrix item 1; [03](03-performance-and-language.md) |
| candidate generation | each of the four bot tactics' turn for this creature, replayed through the legal menu; plus targeted variants: focus fire on each reachable enemy, finish a downed enemy, stabilise or heal a downed ally, retreat out of reach, dodge | matrix item 3; portfolio and script-selection winners; Smart's documented triage blind spot |
| evaluation | truncated playouts with a fixed base policy for both sides, then an evaluation of HP, downed and dying state, conditions and resources, fitted by logistic regression to outcomes of bot-vs-bot games | matrix items 2 and 4; TD-Gammon-style value at minimal cost |
| allocation | successive halving across candidates with shared dice seeds | Tesauro rollout; Gumbel sequential halving |
| execution | follow the chosen plan through the menu; re-plan when a target drops, an attack misses, or a reaction changes the state | receding horizon, as all re-planning winners do |
| reactions | the engine's default (always take it) at first | engine default `combat.ts:1565`; revisit only if data shows a cost |
| opponent model | a fixed base policy, never the opponent's identity | fairness rule in [00-goal.md](00-goal.md#clean-play-rules) |
| language | TypeScript first; Rust only on measured need | [03](03-performance-and-language.md#the-language-decision) |
| learning | none at first; a learned value function or expert iteration only if search is compute-bound | [04-literature/learning.md](04-literature/learning.md) |

## 7. Plan, with kill criteria written before any run

Development seeds start at 1001. Confirmatory seeds start at 100001 and are not touched until stage 5.

| stage | what | pass condition | if it fails |
|---|---|---|---|
| 0. Integrity | route LK-47 through the same stepwise path and reaction prompts as LLMs; the `lk-47.pass` probe; LK-47 tests; parallel evaluation runner with Wilson intervals and Holm-corrected exact tests | typecheck and all tests green; no diff under `packages/engine/src/battlecast`; every bot-vs-bot outcome identical to `research/data/bot-matrix.jsonl` (wall-clock time and line order excluded); the probe loses essentially every game | fix before anything else |
| 1. Menu expressiveness | the simulator (lean state copies, private dice) with a test that simulations never draw from the match's dice; for each bot tactic, an imitator that plays that tactic's own turn through the legal menu, against the real bot, chokepoint and status pressure, 400 games pooled | dice-isolation test green; imitator's 95% interval includes 0.5 | the menu cannot express the bots' play; stop and build candidates from menu enumeration instead |
| 2. Planner v1 | portfolio rollout planner against all four bots on both headline maps, 200 games per pairing, 1 s per decision | lower 95% bound above 0.5 against `battlecast.aggressive` on both maps | after two design iterations, stop this design and switch to flexible-horizon EMCTS or non-exploring MCTS with truncated evaluation (the census fallback) |
| 3. Budget scaling | the same planner at 0.25x, 1x and 4x budget against `battlecast.aggressive` | decides the language question | port the hot path to Rust only if 4x beats 1x significantly |
| 4. Learned evaluation (optional) | logistic or small neural value function replacing the hand evaluation | higher win rate at equal wall-clock time | drop it |
| 5. Confirmatory | all four bots on all five public maps, both sides, games per pairing from the power table | every pairing passes a one-sided exact binomial test of win rate > 0.5 at Holm-adjusted p < 0.025 | report the pairings that failed, at full strength |
| 6. LLM head to head | free or cheap models locally; frontier models only through the benchmark author or an approved budget | per named model, lower bound above 0.5 | report as measured |
| 6b. Independence variant | a version whose candidates and playouts use only our own policy, no Battlecast bot code | reported alongside, whatever the result | report as measured |

The goblin duel cannot separate the four bots (every pairing 200 of 400). It stays in the confirmatory run but is reported separately: a duel win shows the agent plays differently from the bots, not more skilfully.

## 8. Disconfirmation

What would show this plan is wrong, cheapest first:
1. Stage 1 fails: the menu loses information the bots use. Cost: a few CPU-hours.
2. Stage 2 fails against Aggressive: planning on top of bot plans adds nothing over the best plan alone.
3. Stage 3 shows strength flat in budget while still below the target: the evaluation function, not compute, is the limit.

## 9. What I got wrong earlier

See [corrections.md](corrections.md). The two that shaped this document: I chose an architecture before surveying anything (entry 1), and I took `battlecast.smart` as the opponent to beat (entry 3).
