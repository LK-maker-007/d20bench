# Stage 6b: the independence variant

Started 2026-10-02 on branch `lk-47/stage-3`, while the stage 3 games were running. The sections up to the result were written before any game of this variant was played.

## Why

`lk-47` predicts the next round by letting every creature play it as `battlecast.smart`. [00-goal.md](../00-goal.md#clean-play-rules) commits us to say so up front, and to report a variant whose simulations use only our own policy. A reader can then see how much of LK-47's strength comes from borrowing the bots' judgement.

## What changes

`lk-47.independent` (`packages/engine/src/lk-47/variants.ts`) has the same candidates, schedule and evaluation as `lk-47`. Only the simulated round differs. Every creature, friend or foe, plays LK-47's greedy policy (`playGreedyTurn` in `planner.ts`):

1. Start the turn as the harness does for a menu-driven agent (`beginTurn`, which calls the harness's own turn-start processing).
2. Take the in-place menu action with the best immediate gain, the same rule LK-47 uses to finish its own turn in a rollout.
3. If nothing is worth doing and no enemy is within 5 ft, take the menu's `move_toward` on the nearest enemy once, then look again.

What still runs from the Battlecast code, and why none of it is a bot making a decision:
- Rules: turn start, attacks, spells, damage, conditions, end of turn. The live match applies every LLM choice with the same functions. Turn start is `beginBattlecastControlledTurn`, which sits in `ai-turn.ts` but is what the harness runs before every LLM turn.
- Movement for `move_toward`: the harness resolves it with the engine's `moveToward` (`battlecast/engine/ai-movement.ts`), the same function it uses when an LLM picks `move_toward`.
- Reactions of simulated creatures: their controllers are not menu-driven, so the engine applies its default. That default takes the opportunity attack with the first melee weapon (`ai-turn.ts:746-750`) and uses damage reactions. LK-47's own reaction rule is the same (`bot-defaults.ts`).
- `executeTurn`, the bots' turn logic, never runs. The planner could reach it only through `playScriptedTurn` or a `battlecast_tactic` menu action. LK-47's menus never offer the latter: `createActionCatalogueForAgent` in `agent-match.ts` enables whole-turn bot actions only for LLM agents in the `battlecast-full-turn` space. A test spies on `playScriptedTurn` and fails if the variant calls it once; it also checks that a distant simulated enemy moves through `move_toward` [V, `npm test`].

## Tests, before any game

- The variant plans on private copies under private dice and picks only from the menu; a short match replays identically [V, `npx vitest run packages/engine/tests/lk-47.test.ts`, 19 of 19].
- Three deliberate breakages, each caught by a failing test [V]:
  - Simulating with bot turns: the spy saw 94 calls.
  - Never moving: no `move_toward` was seen.
  - Playing the simulated turns on the live battle: the isolation test caught the changed state.

## Evaluation, fixed before the run

- Against `battlecast.smart`, seeds 2001 to 2200, both sides, chokepoint and status pressure, 800 games. These are the stage 2 gate's games, so every game pairs with one `lk-47` played on the same map, seed and side.
- Reported whatever the result, as the plan says ([05-architecture.md](../05-architecture.md#7-plan-with-kill-criteria-written-before-any-run)): per-map win rate with a 95% Wilson interval; the stage 2 test, a one-sided exact binomial test of win rate > 0.5 with Holm over the two maps; and the paired comparison with `lk-47` on the same seeds, by the exact McNemar test (`research/scripts/compare-paired.py`).
- Nothing is decided by this run. The confirmatory plan in stage 5 says whether the variant is also run on the confirmatory seeds.

```
OPPONENTS=battlecast.smart research/scripts/evaluate.sh lk-47.independent 2001 200 research/data/stage-6b-independent.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
python3 research/scripts/summarize-evaluation.py research/data/stage-6b-independent.jsonl lk-47.independent
cd research/scripts && python3 compare-paired.py ../data/stage-2-gate-v1.jsonl lk-47 ../data/stage-6b-independent.jsonl lk-47.independent
```

## Result

Run on 2026-10-02 after the stage 3 games, with the engine rebuilt from the code above. 800 games, exit status 0, no draws, no duplicate games [V].

| map | `lk-47.independent` wins | win rate | 95% Wilson | Holm p (win rate > 0.5) | `lk-47` on the same games |
|---|---:|---:|---|---:|---:|
| chokepoint | 78 / 400 | 0.195 | [0.159, 0.237] | 1 | 0.578 |
| status pressure | 256 / 400 | 0.640 | [0.592, 0.686] | 2.33e-08 | 0.823 |

Paired with `lk-47` on the same map, seed and side: `lk-47` won 292 pairs that the independent variant lost; the reverse happened 66 times. Per map that is 177 against 24 on chokepoint and 115 against 42 on status pressure. The exact McNemar p that `lk-47` is stronger is 2.42e-35 pooled [V]; the pre-registered direction, the independent variant stronger, gives p = 1.

Data: `research/data/stage-6b-independent.jsonl`, 800 lines, sha256 `17ad6e4e24b87f647d37f20ac189985e3b6dbb9037c039151bf373063572a956`. 8.85 core-hours, 39.8 s per match on average.

## What the result means

- Most of LK-47's edge over Smart on chokepoint comes from predicting the other creatures with Smart's own turn logic. With LK-47's greedy policy in its place, the planner loses 4 games in 5 there.
- On status pressure the independent planner still beats Smart, 0.640, with no Battlecast bot code in its simulations.
- The search adds strength on its own. Through the same menu, a copy of Smart that replays Smart's plans won 0 of 400 on chokepoint and 19 of 400 on status pressure ([stage 1](1-imitation.md#parity-fails-in-every-cell)). The independent planner, which never runs a bot, won 78 and 256.
- The claim names this in its first paragraph, as [00-goal.md](../00-goal.md#clean-play-rules) requires. `lk-47` picks every action itself from the menu; its prediction of how others respond uses Smart's code.
- What would close the gap is a better playout policy of our own, written or learned. The greedy one moves toward the nearest enemy and takes the largest immediate gain, nothing more [H].
