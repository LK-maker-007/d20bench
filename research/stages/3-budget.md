# Stage 3: thinking budget

Started 2026-10-01 on branch `lk-47/stage-3`. The sections up to the result were written before any evaluation game was played.

## Question

Does LK-47 get stronger when it simulates more? The answer settles the language question: [03-performance-and-language.md](../03-performance-and-language.md#the-language-decision) says to port the hot path to Rust only if 4x budget beats 1x significantly. If strength is flat in budget, compute is not the limit. The limit is then what the simulation judges: the evaluation function (stage 4), the one-round horizon and the simulated opponents.

## Budget levels

The planner, the candidates and the evaluation stay the same. Only the number of rollouts changes (`packages/engine/src/lk-47/variants.ts`).

| agent | samples per surviving candidate, then how many are kept |
|---|---|
| `lk-47.budget-min` | 1, keep 1 |
| `lk-47` | 1, keep 6; 4, keep 2; 12, keep 1 |
| `lk-47.budget-4x` | 4, keep 6; 16, keep 2; 48, keep 1 |

At any given decision `lk-47.budget-4x` runs exactly four times the rollouts of `lk-47`, because the kept counts are equal and every sample count is multiplied by four (`planner.ts:33-43`).

The plan asked for 0.25x. Going below one rollout per candidate would mean dropping candidates unsampled, which changes what the planner can choose rather than how well it judges. The lowest level is therefore one rollout per candidate.

Measured on smoke seeds 9001 and 9002, both sides, 4 matches per map and level, against `battlecast.aggressive`; these games are not part of any evaluation [V]:

```
node research/scripts/planner-budget.mjs <agent> battlecast.aggressive <scenario-id> 9001 2
```

| agent | map | rollouts per planned decision | relative to `lk-47` | ms per decision |
|---|---|---:|---:|---:|
| `lk-47.budget-min` | chokepoint | 13.5 | 0.31 | 117 |
| `lk-47` | chokepoint | 44.0 | 1 | 203 |
| `lk-47.budget-4x` | chokepoint | 173.9 | 3.95 | 473 |
| `lk-47.budget-min` | status pressure | 11.2 | 0.26 | 60 |
| `lk-47` | status pressure | 42.3 | 1 | 137 |
| `lk-47.budget-4x` | status pressure | 159.7 | 3.78 | 364 |

Across games the ratio is not exactly 4, because different choices lead to different positions with different numbers of candidates. Time grows less than rollouts: 4x costs 2.3 to 2.7 times the time per decision of 1x. The harness sets no time limit on an LK-47 decision; the only timeout in the engine is the 90 s OpenRouter request limit (`openrouter-agent.ts:49`), which applies to LLM calls [V].

## Design, fixed before the run

- Opponent `battlecast.aggressive`, as the plan says. It is the strongest bot on both headline maps ([02-measurements.md](../02-measurements.md#strongest-bot-per-map)).
- Seeds 2001 to 2200, both sides, chokepoint and status pressure: 800 games per level. Stage 2 used these seeds only against `battlecast.smart`.
- The 1x arm is the stage 2 run against the other three bots, which was pre-registered there and has not been run yet. Its games against `battlecast.aggressive` are the 1x arm here.
- A pair is two games with the same map, seed and side. The two start from the same dice and diverge once the agents choose differently.
- Primary test, and the only one that decides anything: 4x stronger than 1x, pooled over both maps, exact one-sided McNemar test, pass at p < 0.025. Each pair in which exactly one arm won counts as a fair coin under "no difference".
- Reported without deciding anything: per-map results; 1x against the minimum level with the same test; each level's win rate with a 95% Wilson interval.
- Power at 800 pairs, with the two outcomes of a pair taken as independent, which likely understates it [V, `python3 research/scripts/paired-power.py 800 0.5` and `800 0.6`]:

| gain of 4x over 1x | power, 1x at 0.50 | power, 1x at 0.60 |
|---:|---:|---:|
| 3 points | 0.21 | 0.22 |
| 5 points | 0.50 | 0.52 |
| 7 points | 0.79 | 0.82 |
| 10 points | 0.98 | 0.99 |

  A gain under 5 points will likely go undetected. A miss therefore means "no gain large enough to matter at this cost", not "no gain at all".
- Fixed sample size. A live tally shows during the run; no decision is taken before every game has finished.

## Decision rule, fixed before the run

- **4x significantly stronger.** Strength is still rising with compute at 1x. First, make the higher budget the default if its time per match is acceptable. Then buy more budget: the cheap speedups listed in 03 first, and the Rust port only with the differential test suite 03 requires.
- **Not significant.** Stay in TypeScript. More of the same simulation does not pay at this range, so the next gains have to come from what the simulation judges: the evaluation, the horizon and the opponent model.

## Commands

These commands reproduce the data at commit `538b504`. From stage 5 on, `lk-47` names the 4x schedule and the 1x schedule is `lk-47.budget-1x`.

```
OPPONENTS="battlecast.aggressive battlecast.kiting battlecast.defensive" research/scripts/evaluate.sh lk-47 2001 200 research/data/stage-2-other-bots.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
OPPONENTS=battlecast.aggressive research/scripts/evaluate.sh lk-47.budget-min 2001 200 research/data/stage-3-budget-min.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
OPPONENTS=battlecast.aggressive research/scripts/evaluate.sh lk-47.budget-4x 2001 200 research/data/stage-3-budget-4x.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
cd research/scripts
python3 compare-paired.py ../data/stage-2-other-bots.jsonl lk-47 ../data/stage-3-budget-4x.jsonl lk-47.budget-4x
python3 compare-paired.py ../data/stage-3-budget-min.jsonl lk-47.budget-min ../data/stage-2-other-bots.jsonl lk-47
```

## Result

Run on 2026-10-02 as one detached job of 4,000 games, with a live tally every 100 games. Exit status 0 [V].

**The primary test passes.** Over the 800 pairs, 4x won 234 games that 1x lost, and 1x won 78 that 4x lost. The exact one-sided McNemar p is 1.46e-19 [V, `compare-paired.py`].

Win rate against `battlecast.aggressive`, seeds 2001 to 2200, both sides, no draws, 95% Wilson [V]:

| agent | chokepoint | status pressure | pooled |
|---|---|---|---|
| `lk-47.budget-min` | 0.138 [0.107, 0.175] | 0.300 [0.257, 0.347] | 0.219 [0.191, 0.249] |
| `lk-47` | 0.532 [0.484, 0.581] | 0.688 [0.640, 0.731] | 0.610 [0.576, 0.643] |
| `lk-47.budget-4x` | 0.738 [0.692, 0.778] | 0.873 [0.836, 0.902] | 0.805 [0.776, 0.831] |

Paired, per map [V]:

| comparison | map | only the stronger arm won | only the weaker arm won | one-sided p |
|---|---|---:|---:|---:|
| 4x over 1x | chokepoint | 126 | 44 | 1.17e-10 |
| 4x over 1x | status pressure | 108 | 34 | 1.78e-10 |
| 1x over minimum | chokepoint | 186 | 28 | 4.12e-30 |
| 1x over minimum | status pressure | 186 | 31 | 1.96e-28 |

Time per match against `battlecast.aggressive`: 8.4 s at the minimum level, 31.6 s at 1x, 76.5 s at 4x. Spread over LK-47's decisions, that is 76, 221 and 544 ms per decision, including the opponent's share. The matches ran 8 at a time while the machine did light other work, so these are approximate [V].

Data:

| file | games | sha256 |
|---|---:|---|
| `research/data/stage-3-budget-min.jsonl` | 800 | `1cc50b24c7f38759dd08323a04e42ab878afeb4e23af4c5a9eb3cec782e69c75` |
| `research/data/stage-3-budget-4x.jsonl` | 800 | `44a123f5252558ddae2f3d71a35ae2e0e7ef72e04e05b44a32db0fbf8dad7a66` |
| `research/data/stage-2-other-bots.jsonl`, the 1x arm | 800 of its 2,400 | `a43cb73e6e89193cd3e25b286cddcdce34451f556539c8ddf3c6ffbaef42d802` |

## What the result means

The rule fixed before the run fires: 4x is significantly stronger than 1x.

- Strength was still rising steeply at 1x. Between the minimum level and 4x, the pooled win rate went from 0.219 to 0.805 for 13 to 14 times the rollouts (smoke measurement above).
- The minimum level is far worse than its 0.28x rollout share would suggest. With one rollout per candidate the planner picks whichever option drew lucky dice; that reading is untested [H].
- Disconfirmation 3 in [05-architecture.md](../05-architecture.md#8-disconfirmation), strength flat in budget, did not happen. Up to 4x, compute is a binding limit, not the evaluation.
- The default moves up. 76.5 s per match is acceptable, since the harness sets no time limit on an LK-47 decision. The id `lk-47` will name the final configuration before stage 5; every data file keeps the commit that produced it.
- Next: whether strength keeps rising beyond 4x. First the cheap speedups in 03, then 16x against 4x on fresh development seeds. The Rust port stays the last resort and still needs the differential test suite.

What this does not show:
- Anything beyond `battlecast.aggressive` on two maps and development seeds. 4x has not played `battlecast.smart`, `kiting` or `defensive`.
- Whether the gain continues past 4x.
