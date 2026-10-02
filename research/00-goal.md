# 00. Goal, claim and rules of play

## Goal

Build a non-LLM agent that runs on CPU and beats every opponent D20bench offers, scripted and LLM, under the benchmark's own protocol. Prove it with statistics a sceptical reader can rerun.

Beating an opponent means the highest win rate the dice allow, reported with intervals. No agent can win every game. In the default bot ladder, each of the four Battlecast bots lost 26 to 31 of its 112 games [V, `npm run d20bench -- ladder run`].

## The claim we intend to make, and its limits

The claim will name each opponent and the evidence against it:

| opponent class | how we play them | cost | claim if we win |
|---|---|---|---|
| Battlecast bots (`smart`, `aggressive`, `kiting`, `defensive`) and the four baselines | head to head, locally | none | beats each bot on each public map, with intervals |
| free or near-free LLMs on OpenRouter | head to head | cents | beats those named models |
| frontier LLMs (GPT-5.5, Claude Opus 4.8, Gemini 3.1 Pro, GLM 5.2) | head to head, only in a season the benchmark author runs or with an approved budget | GLM 5.2 cost $1.86 per fairfix match [V]; others unmeasured under fairfix | beats those named models |

Without direct games, the claim against a frontier model is limited to the same yardstick: our record against `battlecast.smart` under the fairfix protocol next to theirs. That is weaker and will be labelled as such. Results do not chain across opponents: Smart beat Qwen 3.5 Flash 8-0 and lost to GLM 5.2 3-5 in the same season [V, [02-measurements.md](02-measurements.md#published-llm-results)].

The claim is about D&D 5e combat as implemented by Battlecast. It does not extend to other games or to general intelligence.

## Clean-play rules

Each rule has a check that someone else can run.

| rule | why | check |
|---|---|---|
| Same protocol as the published fairfix seasons: `actual-actions-v1` menus, trigger-time reactions, 50-round cap, both sides | comparability with the LLM results | season config in the repo; harness audit counts |
| The agent only picks an id from the legal menu; the harness applies it | no rule bending | harness rejects ids not in the menu |
| No changes to the rules engine or the opponents' code | opponents must be the published ones | `git diff ad8a355 -- packages/engine/src/battlecast` is empty |
| The agent's simulations use their own random generator | no peeking at or consuming the match's dice | test: the match's roll sequence is identical with and without the agent thinking |
| The agent reads only what the LLM prompt shows | information parity, see [01-benchmark.md](01-benchmark.md#what-an-agent-sees) | code review: no reads of `teamTactics` or agent ids |
| Development seeds and evaluation seeds never overlap | no tuning to the test | seed ranges written in the evaluation plan before the final run |
| The analysis plan and kill criteria are written before the final run | no moving the goalposts | commit timestamp of the plan precedes the results |
| Every number has a script, seed list, commit hash and command | reproducibility | this folder |

The benchmark's contract says a model "cannot invent actions, cannot fudge dice, and cannot delegate to a smarter system" ([author's post](https://e4developer.com/posts/d20bench-benchmarking-llms-with-dungeons-and-dragons/)) [C]. Our agent never hands a turn to a bot: every action it submits is its own pick from the legal menu. If its internal simulator uses the public Battlecast bots to predict how creatures play, the claim must say so in its first paragraph, and we must also report a variant whose simulator uses only our own playout policy.

Exploiting Smart's documented weaknesses is allowed. The benchmark author calls beating its triage blind spot "legitimate play" (`docs/ACTUAL_ACTION_HARNESS_LEARNINGS.md:616-618`) [V].

## Statistical bar

- Per opponent and map, pooled over both sides: a one-sided exact binomial test that our win rate exceeds 0.5, with draws counted as losses.
- Family-wise: Holm correction across all pairings in the confirmatory run, at adjusted p < 0.025. That is the one-sided level of a two-sided 95% interval, so a pass means the Holm-corrected exact (Clopper-Pearson) bound clears 0.5. Wilson intervals, uncorrected, are reported alongside as the effect size (`research/scripts/summarize-evaluation.py`).
- One confirmatory seed range. Other seed ranges count as robustness checks, not extra confirmations.
- Games needed per pairing depend on the true win rate. At a true 75% win rate, 26 games clear 0.5 with 80% power, and 76 games clear 0.6 [V, `python3 research/scripts/published-results.py`]. Holm raises both.

## Compute and money

- Agent play and all bot evaluation: local CPU, 8 cores. No cost.
- Optional learned components: Kaggle 2x T4, 30 h/week, training only. The agent itself must run on CPU.
- LLM opponents: only with an approved budget or through the benchmark author.
- Submission: no fee exists because no submission process exists yet [V, [01-benchmark.md](01-benchmark.md#publishing-and-submission)].
