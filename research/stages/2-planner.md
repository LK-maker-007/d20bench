# Stage 2: the planner

Started 2026-10-01 on branch `lk-47/stage-2`. Result: the gate passes on both maps against `battlecast.smart`. The sections up to the gate were written before any planner game was played.

## Target

First place in the published fairfix table (`results/seasons/llm-actual-fairfix-tournament-v2`): GLM 5.2 1068.5, `battlecast.smart` 1047.1, DeepSeek V4 Flash 1014.2, Qwen 3.5 Flash 870.2 [V]. Taking it means beating `battlecast.smart` and the three LLMs under that season's protocol. This stage targets `battlecast.smart`; the LLMs come in stage 6.

## Design

At each menu decision of its own turn, `lk-47` (`packages/engine/src/lk-47/planner.ts`):

1. Builds candidates from the menu itself, cut down: every attack, spell, feature and defensive option; each `move_toward`; and a few `move_to` squares (nearest to each enemy, farthest from the nearest enemy, nearest to each dying ally).
2. Scores each candidate by simulation on a private copy under private dice: play the candidate, finish the creature's turn greedily (best immediate damage or healing from the menu), then let every creature play one round as `battlecast.smart` until this creature's next turn, and score the position.
3. Allocates samples by successive halving with shared dice seeds across candidates.

Reactions and Divine Smite follow the bots' defaults, as in stage 1.

The opponent model is always `battlecast.smart`; the planner never reads which agent or tactic it faces. Its own allies are also modelled as `battlecast.smart` in the simulated round, which credits them with the ranged spells the menu does not offer; that bias applies to every candidate alike, so it shifts scores more than it reorders them [H].

## Changes made before the gate run

- **Speed.** A CPU profile of one planner match showed 42.4% of the time building menus inside simulations, 37.7% of it computing reachable movement squares that the greedy rest-of-turn never uses [V, `node --cpu-prof`, summarised with `research/scripts/summarize-cpu-profile.mjs`]. The simulator now builds those menus without movement squares (`actionsInPlace` in `agent-match.ts`). Checked: identical non-movement entries at all 197 real decisions of two matches and in all 5,342 rest-of-turn menus of one match [V]. Time per decision on the four smoke matches fell from 540 to 920 ms to 165 to 321 ms, and was 195 to 375 ms after the bug fix below [V].
- **Bug found and fixed.** The speedup changed one smoke match by two decisions although no menu changed. Chasing it showed the greedy rest-of-turn gave its +10 finishing bonus to zero-damage actions aimed at a creature at 0 HP (`0 >= 0`), so inside simulations it sometimes chose "move toward" an enemy at 0 HP over a real attack. The bonus now needs damage above zero. The speedup itself was not the cause; it only removed the menu entries the bug acted through.
- **Tests.** The planner never draws from the match's dice or changes the live battle, and picks only from the menu; a short match replays identically [V, `npm test`, 132 of 132]. Planning on the match's dice and planning on the live battle were each caught by the isolation test.

## Gate, fixed before the run

- Dev seeds 2001 to 2200, both sides, chokepoint and status pressure, 400 games per map, against `battlecast.smart`.
- Pass: on both maps, a one-sided exact binomial test of win rate > 0.5 with Holm-adjusted p < 0.025 over the two maps.
- Reported alongside, not gating: the same against the other three bots.
- Kill, from [05-architecture.md](../05-architecture.md#7-plan-with-kill-criteria-written-before-any-run): if two design iterations do not pass, stop this design and switch to the census fallback (flexible-horizon evolutionary MCTS or non-exploring MCTS with truncated evaluation).

## Result

These commands reproduce the data at commit `538b504`. From stage 5 on, `lk-47` names the 4x schedule and the 1x schedule is `lk-47.budget-1x`.

```
OPPONENTS=battlecast.smart research/scripts/evaluate.sh lk-47 2001 200 research/data/stage-2-gate-v1.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
python3 research/scripts/summarize-evaluation.py research/data/stage-2-gate-v1.jsonl lk-47
```

[V], 800 games, seeds 2001 to 2200, 200 games from each side per map, no draws:

| map | LK-47 wins | win rate | 95% Wilson | one-sided p | Holm p | passes |
|---|---:|---:|---|---:|---:|---|
| chokepoint | 231 / 400 | 0.578 | [0.529, 0.625] | 0.00112 | 0.00112 | yes |
| status pressure | 329 / 400 | 0.823 | [0.782, 0.857] | 4.34e-41 | 8.67e-41 | yes |

Data: `research/data/stage-2-gate-v1.jsonl`, 800 lines, sha256 `52af53bc9d482eea9fe84b7fce1496033384d3f5e0d041997f73576efe5778c3`. The matches took 6.03 core-hours in total, 27.2 s each on average, run 8 at a time; the run was not wall-clock timed.

For scale: the bot imitators of stage 1 won 0 of 400 and 19 of 400 against Smart on the same maps. GLM 5.2, first in the published table, won 5 of 8 games against Smart across both maps [V, [02-measurements.md](../02-measurements.md#published-llm-results)]; eight games cannot be compared with these 800 beyond saying both beat Smart.

### Against the other three bots

Pre-registered above as reported alongside, not gating. Run on 2026-10-02 during stage 3, with the stage 2 code unchanged:

```
OPPONENTS="battlecast.aggressive battlecast.kiting battlecast.defensive" research/scripts/evaluate.sh lk-47 2001 200 research/data/stage-2-other-bots.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
python3 research/scripts/summarize-evaluation.py research/data/stage-2-other-bots.jsonl lk-47
```

[V], 2,400 games, seeds 2001 to 2200, 200 from each side per cell, no draws, Holm over these six cells:

| opponent | map | LK-47 wins | win rate | 95% Wilson | Holm p | passes |
|---|---|---:|---:|---|---:|---|
| `battlecast.aggressive` | chokepoint | 213 / 400 | 0.532 | [0.484, 0.581] | 0.211 | no |
| `battlecast.defensive` | chokepoint | 211 / 400 | 0.527 | [0.479, 0.576] | 0.211 | no |
| `battlecast.kiting` | chokepoint | 284 / 400 | 0.710 | [0.664, 0.752] | 4.59e-17 | yes |
| `battlecast.aggressive` | status pressure | 275 / 400 | 0.688 | [0.640, 0.731] | 7.1e-14 | yes |
| `battlecast.defensive` | status pressure | 310 / 400 | 0.775 | [0.732, 0.813] | 5.41e-29 | yes |
| `battlecast.kiting` | status pressure | 347 / 400 | 0.868 | [0.831, 0.897] | 1.41e-53 | yes |

Data: `research/data/stage-2-other-bots.jsonl`, 2,400 lines, no duplicate games, sha256 `a43cb73e6e89193cd3e25b286cddcdce34451f556539c8ddf3c6ffbaef42d802`. 18.6 core-hours, 27.9 s per match on average.

Chokepoint is the weak map. Against aggressive and defensive there, LK-47 is ahead, but not by enough to rule out an even match. In the chokepoint games against aggressive, LK-47's losses were short (median 7 rounds) and its wins long (median 13). One possible reading is that the early rush catches a planner that expects every opponent to play like Smart [H].

What this does not show yet:
- How LK-47 does against the LLMs. First place in the published table needs head-to-head games against GLM 5.2, DeepSeek V4 Flash and Qwen 3.5 Flash (stage 6).
- Results on the confirmatory seeds from 100001, which stay untouched until stage 5.
