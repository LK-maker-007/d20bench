# Stage 5: confirmatory run

Plan written on 2026-10-02, before any game of this stage. It is committed before the run starts, so the commit time shows the plan came first ([00-goal.md](../00-goal.md#clean-play-rules)).

## The agent

The final configuration is the stage 3 4x schedule: samples 4, 16, 48; keep 6, 2, 1 ([3-budget.md](3-budget.md)). From this stage on, `lk-47` names it. The 1x schedule stays registered as `lk-47.budget-1x`, and `lk-47.budget-4x` is gone. Stages 2 and 3 ran at or before commit `538b504`, where `lk-47` meant the 1x schedule. To rerun them, check out that commit.

## Scope

- Opponents: `battlecast.smart`, `battlecast.aggressive`, `battlecast.kiting`, `battlecast.defensive`.
- Maps: chokepoint and status pressure, the two maps of the published fairfix season. LK-47 has never played the goblin duel, the goblin warband or the balanced mirror. Those are run later and reported separately, not as part of this claim.

## Check on development seeds, before the run

4x has played only `battlecast.aggressive`. On chokepoint, 1x won 0.578 against Smart and 0.527 against defensive. If 4x is no stronger there, a confirmatory run fails whatever its size: 6% chance that all 8 pairings pass at 200 games each. If 4x adds 10 points, the chance is 94% [V, simulation with these assumed rates].

- 4x against `battlecast.smart` and `battlecast.defensive` on chokepoint, seeds 3001 to 3050, both sides, 100 games each. These seeds were never used.
- If either win rate is below 0.60, stop: improve the agent on development seeds before any confirmatory game.
- These games size the run and are reported, but they are not part of the claim.

Result, run on 2026-10-02 at commit `f013c11`, exit status 0, no draws [V, `summarize-evaluation.py`]. Both are above 0.60, so the confirmatory run went ahead.

| opponent | wins | win rate | 95% Wilson | 1x on seeds 2001 to 2200 |
|---|---:|---:|---|---:|
| `battlecast.smart` | 82 / 100 | 0.820 | [0.733, 0.883] | 0.578 |
| `battlecast.defensive` | 74 / 100 | 0.740 | [0.646, 0.816] | 0.527 |

`research/data/stage-5-precheck.jsonl`: 200 lines, sha256 `8d40de9ca841ee2ca04a7498e6a78a89ba21517208745343ff8e7870f7d68292`. The two columns use different seeds, so they are not a paired comparison.

## Confirmatory design

- Seeds 100001 to 100080, both sides: 160 games per pairing, 8 pairings, 1,280 games. No confirmatory seed has been played by any agent.
- Pass, per pairing: one-sided exact binomial test of win rate > 0.5, draws counted as losses, Holm over the 8 pairings, adjusted p < 0.025 ([00-goal.md](../00-goal.md#statistical-bar)).
- Fixed size, no interim analysis, no early stop. A live tally shows during the run; nothing is decided before the last game.
- Every pairing is reported, at full strength, whether it passes or fails.
- Audit: the first 5 seeds of every pairing, both sides (80 games), go through `research/scripts/audit-turns.mjs`. Each must replay to its recorded final hash, with 0 violations. Opportunity attacks the engine allows after another reaction are counted, as in [stage 0](0-integrity.md#turn-audit-added-2026-10-02).

## Season entry

After the confirmatory run, with no change to the agent in between, `lk-47` plays the 8 slots every LLM played against `battlecast.smart` in `llm-actual-fairfix-tournament-v2`: seeds 1 and 2, both maps, both sides.

- Played once. No rerun.
- Rated by `research/scripts/season-entry.py`. It appends the 8 games after the season's 48, in the season's map order, then seed, LK-47 as red first, and applies the season's own update (start 1000, K 32). The same code replays the published table exactly [V].
- Reported whatever the result, labelled as what it is: a rating through one shared opponent, weaker evidence than games against the LLMs themselves.

## Commands

```
OPPONENTS="battlecast.smart battlecast.defensive" research/scripts/evaluate.sh lk-47 3001 50 research/data/stage-5-precheck.jsonl public.hero-mirror-chokepoint-l5.v1
research/scripts/evaluate.sh lk-47 100001 80 research/data/stage-5-confirmatory.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
python3 research/scripts/summarize-evaluation.py research/data/stage-5-confirmatory.jsonl lk-47
node research/scripts/audit-turns.mjs lk-47 <opponent> <scenario-id> 100001 5 research/data/stage-5-confirmatory.jsonl
OPPONENTS=battlecast.smart research/scripts/evaluate.sh lk-47 1 2 research/data/stage-5-season-entry.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
python3 research/scripts/season-entry.py results/seasons/llm-actual-fairfix-tournament-v2/standings.json research/data/stage-5-season-entry.jsonl lk-47
```

## Result

### Season entry

Played on 2026-10-02 from 17:55 to 18:01, at commit `f013c11` with the build the confirmatory run uses. One deviation from the plan above: I chose to play it while the confirmatory run was still going, after 716 of its 1,280 games. The agent and the build are the same either way, and each seed fixes its game.

LK-47 won 6 of 8 and ranks second, 4.2 points behind GLM 5.2 [V, `season-entry.py`]:

| rank | agent | Elo | W-L-D |
|---:|---|---:|---|
| 1 | openrouter:z-ai/glm-5.2 | 1068.5 | 16-8-0 |
| 2 | lk-47 | 1064.3 | 6-2-0 |
| 3 | openrouter:deepseek/deepseek-v4-flash | 1014.2 | 13-11-0 |
| 4 | battlecast.smart | 982.8 | 17-15-0 |
| 5 | openrouter:qwen/qwen3.5-flash-02-23 | 870.2 | 4-20-0 |

It lost chokepoint seed 1 as blue and status pressure seed 1 as red. GLM 5.2 won 5 of its 8 games against Smart. This entry is final for `lk-47` as of `f013c11`. I decided that a stronger version will play the same 8 slots once, under its own name; both entries are reported.

`research/data/stage-5-season-entry.jsonl`: 8 lines, sha256 `576cd7471a04d784d5bacb2fd262432b97db8845aadbbc331235229eb24933f1`. All 8 games replay to their recorded hashes with 0 violations ([7-strength.md](7-strength.md#audit-of-both-season-entries)).

### Confirmatory run

Started at 15:52 at commit `f013c11`. I stopped it at 18:15 to free the CPU for stage 7, after 825 of the 1,280 games. Every chokepoint pairing had finished; on status pressure, 155 games against Smart and 30 against Aggressive had been played. The live tally was visible during the run, so the stop was not blind to results. The reason was time.

The four complete pairings are tested as planned, with Holm over the whole family of 8. The four incomplete pairings count as failures (p = 1), which only makes the correction harsher [V]:

| map | opponent | wins | win rate | 95% Wilson | p | Holm p over 8 | passes |
|---|---|---:|---:|---|---:|---:|---|
| chokepoint | `battlecast.smart` | 121 / 160 | 0.756 | [0.684, 0.816] | 2.85e-11 | 2.0e-10 | yes |
| chokepoint | `battlecast.aggressive` | 121 / 160 | 0.756 | [0.684, 0.816] | 2.85e-11 | 2.0e-10 | yes |
| chokepoint | `battlecast.kiting` | 135 / 160 | 0.844 | [0.780, 0.892] | 9.45e-20 | 7.6e-19 | yes |
| chokepoint | `battlecast.defensive` | 115 / 160 | 0.719 | [0.645, 0.783] | 1.49e-08 | 7.5e-08 | yes |
| status pressure | four bots | | | | | | not completed |

Status pressure, not tested, as played: 153 of 155 against Smart, 26 of 30 against Aggressive. No claim is made for the status pressure pairings until they are run in full.

No draws.

`research/data/stage-5-confirmatory.jsonl`: 825 lines, sha256 `edea5ab546cf9dc4b3c8a763fa1654b778faab8c6a4324e6d3001df17fcee5c2`.

### Audit of the first 5 seeds

Run on 2026-10-03 at commit `5124370`. Since `f013c11`, the only change under `packages/` adds the `lk-47.16x` entry to `variants.ts`, so `lk-47` is the policy that played [V, `git diff f013c11 5124370 -- packages`]. Each game was replayed and its final state hash checked against the hash recorded for it in `stage-5-confirmatory.jsonl`.

The plan names 80 games. 60 exist: seeds 100001 to 100005, both sides, in the four chokepoint pairings and the status pressure pairings against Smart and Aggressive. The status pressure pairings against Kiting and Defensive had not started when the run was stopped, so their 20 games were never played and are not audited.

| map | opponent | games | hash matches | LK-47 turns | decisions | reactions taken | violations |
|---|---|---:|---:|---:|---:|---:|---:|
| chokepoint | `battlecast.smart` | 10 | 10 | 377 | 1,105 | 3 | 0 |
| chokepoint | `battlecast.aggressive` | 10 | 10 | 380 | 1,063 | 0 | 0 |
| chokepoint | `battlecast.kiting` | 10 | 10 | 467 | 1,279 | 2 | 0 |
| chokepoint | `battlecast.defensive` | 10 | 10 | 480 | 1,385 | 0 | 0 |
| status pressure | `battlecast.smart` | 10 | 10 | 473 | 1,431 | 28 | 0 |
| status pressure | `battlecast.aggressive` | 10 | 10 | 653 | 1,909 | 20 | 0 |

In total, 60 of 60 hashes match and 2,830 LK-47 turns with 8,172 decisions show 0 violations [V]. No menu offered a whole bot turn and none was picked. No action was logged as invalid, and no move left no log. The most decisions in one turn was 10. Every restored resource came from Dash (873 times) or Action Surge (20 uses). No opportunity attack followed another reaction in these games. The most attack rolls in one turn were 4 for the Fighter and 2 for every other class.

```
node research/scripts/audit-turns.mjs lk-47 <opponent> public.hero-mirror-chokepoint-l5.v1 100001 5 research/data/stage-5-confirmatory.jsonl
node research/scripts/audit-turns.mjs lk-47 <opponent> public.hero-mirror-status-l5.v1 100001 5 research/data/stage-5-confirmatory.jsonl
```

### Resuming the stopped run

Plan written on 2026-10-03, before any of these games. Every game is fixed by its seed and the code, so playing the missing games now gives exactly the results the uninterrupted run would have given. The stop was for time, after the live tally had been seen. Resuming to the planned size, with no further stop, keeps the design as registered.

- Games: the 455 status pressure games of the design that `stage-5-confirmatory.jsonl` does not contain: 5 against Smart, 130 against Aggressive, 160 against Kiting and 160 against Defensive. `research/scripts/missing-games.py` lists them as 95 jobs. A check confirmed the jobs cover exactly the missing games, none twice and none already played.
- Code: `lk-47` as played in the run. Since `f013c11` the only change under `packages/` adds the `lk-47.16x` entry.
- Data: `research/data/stage-5-confirmatory-rest.jsonl`. The original file is not changed.
- Analysis as planned: the two files together must hold 1,280 distinct games, 160 per pairing. Each of the 8 pairings gets the one-sided exact binomial test with Holm over all 8, passing at adjusted p < 0.025. Every pairing is reported whatever the result. No early stop and no rerun.
- Then the audit of the first 5 seeds against Kiting and Defensive on status pressure: the 20 games the earlier audit could not cover.

```
python3 research/scripts/missing-games.py research/data/stage-5-confirmatory.jsonl lk-47 100001 80 public.hero-mirror-status-l5.v1 battlecast.smart battlecast.aggressive battlecast.kiting battlecast.defensive | xargs -P 8 -L 1 node research/scripts/run-matches.mjs | tee -a research/data/stage-5-confirmatory-rest.jsonl
python3 research/scripts/summarize-evaluation.py <(cat research/data/stage-5-confirmatory.jsonl research/data/stage-5-confirmatory-rest.jsonl) lk-47
node research/scripts/audit-turns.mjs lk-47 <opponent> public.hero-mirror-status-l5.v1 100001 5 research/data/stage-5-confirmatory-rest.jsonl
```
