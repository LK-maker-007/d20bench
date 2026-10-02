# 02. Measurements

Everything here was produced on the machine described in [03-performance-and-language.md](03-performance-and-language.md), against a build of upstream commit `ad8a355` with no local changes to the engine. Each section gives the command that reproduces it.

## Scripted-bot round robin

The four Battlecast bots against each other on all five public scenarios, both side assignments, seeds 1 to 200, 50-round cap, `actual-actions-v1` settings. 80 ordered pairings, 16,000 games, 20 minutes on 8 cores.

```
research/scripts/run-bot-matrix.sh 200 research/data/bot-matrix.jsonl
python3 research/scripts/summarize-bot-matrix.py research/data/bot-matrix.jsonl
```

Data: `research/data/bot-matrix.jsonl`, sha256 `9f05e080100a26ff5b3ee683556be0f959bfb53f10bda346bad8f66ec74d8d9c`. Its `meanRounds` field is the engine's round counter at the end of each match, which is one more than the rounds played: the counter advances after the final round (`agent-match.ts:406-407` at `ad8a355`; checked on three matches).

Determinism check: the 14 pairings that overlap with an earlier run (`research/data/bot-matrix-2026-10-01.jsonl`, made with a scratch copy of the same script) match game for game, 14 of 14 [V].

### Strongest bot per map

Score is the bot's pooled win rate against the other three bots, 1,200 games each [V].

| map | best bot | score | weakest bot | score |
|---|---|---:|---|---:|
| goblin duel | all equal | 0.500 | all equal | 0.500 |
| goblin warband 6v6 | kiting | 0.853 | defensive | 0.357 |
| hero mirror, balanced | kiting | 0.527 | smart | 0.437 |
| hero mirror, chokepoint | aggressive | 0.666 | kiting | 0.199 |
| hero mirror, status pressure | aggressive | 0.657 | kiting | 0.253 |

Kiting's goblin warband lead is not tactics. For creatures without Multiattack, the kiting bot attacks twice per turn because it never marks its action as used ([stages/1-imitation.md](stages/1-imitation.md#cause-1-the-kiting-bot-attacks-twice)) [V].

### Head to head on the two headline maps

Pooled over both sides, 400 games per pairing, 95% Wilson interval [V].

| bot | opponent | chokepoint | status pressure |
|---|---|---|---|
| aggressive | smart | 0.585 [0.536, 0.632] | 0.590 [0.541, 0.637] |
| aggressive | defensive | 0.578 [0.529, 0.625] | 0.550 [0.501, 0.598] |
| aggressive | kiting | 0.835 [0.795, 0.868] | 0.833 [0.793, 0.866] |
| defensive | smart | 0.505 [0.456, 0.554] | 0.463 [0.414, 0.511] |
| defensive | kiting | 0.833 [0.793, 0.866] | 0.630 [0.582, 0.676] |
| kiting | smart | 0.265 [0.224, 0.310] | 0.223 [0.184, 0.266] |

### Side bias

Mirror matches, same bot on both sides, red wins out of 200 [V]:

| map | smart | aggressive | kiting | defensive |
|---|---:|---:|---:|---:|
| goblin duel | 98 | 98 | 98 | 98 |
| goblin warband | 100 | 101 | 96 | 102 |
| balanced | 90 | 90 | 93 | 109 |
| chokepoint | 85 | 101 | 82 | 112 |
| status pressure | 96 | 95 | 114 | 81 |

Four of the 20 mirrors have a 95% Wilson interval that excludes 0.5: chokepoint smart 85 and kiting 82, status pressure defensive 81 and kiting 114 [V]. About one in 20 would by chance, so some maps carry a side bias for some bots. Pooling both sides, as every comparison here does, cancels it.

### What looking at the data showed

- The goblin duel cannot rank agents. Every pairing finished exactly 200 of 400, and every mirror 98 of 200: all four tactics play the duel identically, so the seed alone decides it [V]. Any agent's duel result will measure dice, not skill, unless it plays differently from the bots.
- `battlecast.smart`, the bot in the published LLM seasons, ranks third of four on chokepoint (0.548), second on status pressure (0.575) and last on the balanced mirror (0.437). `battlecast.aggressive` beats it about 59% on both headline maps.
- No single bot is best everywhere. "Beat every bot" has to be checked map by map.

## Published LLM results

From the repo's own season files:

```
python3 research/scripts/published-results.py
```

`llm-actual-fairfix-tournament-v2`, 48 matches, head to head [V]:

| agent A | agent B | A wins | B wins |
|---|---|---:|---:|
| battlecast.smart | deepseek-v4-flash | 4 | 4 |
| battlecast.smart | qwen3.5-flash | 8 | 0 |
| battlecast.smart | glm-5.2 | 3 | 5 |
| deepseek-v4-flash | qwen3.5-flash | 6 | 2 |
| deepseek-v4-flash | glm-5.2 | 3 | 5 |
| qwen3.5-flash | glm-5.2 | 2 | 6 |

Wins by side: red 28, blue 20. Chokepoint 12-12; status pressure red 16, blue 8 [V].

Decisions per LLM side per match against Smart: mean 103.9, median 98.5, range 16 to 229, from the `llmDecisions` field [V].

## LLM cost per match

[V], from `costSummary` in the season files:

| season | model | USD per match |
|---|---|---:|
| fairfix-v2 (stepwise menus, 50 rounds) | GLM 5.2 | 1.857 |
| fairfix-v2 | DeepSeek V4 Flash | 0.201 |
| fairfix-v2 | Qwen 3.5 Flash | 0.192 |
| frontier-public-v1 (old menus, 3 rounds) | Claude Opus 4.8 | 0.195 |
| frontier-public-v1 | GPT-5.5 | 0.187 |
| frontier-public-v1 | Gemini 3.1 Pro | 0.098 |
| frontier-public-v1 | GLM 5.2 | 0.039 |

GLM 5.2 cost 48 times more per match under fairfix than under the old 3-round setup. No frontier model has played under fairfix. If they scaled like GLM, a fairfix match would cost $5 to $10 [H].

## Sample sizes

Games per opponent for the 95% Wilson lower bound to clear a target, before Holm correction [V]. Break-even assumes the observed rate equals the true rate, which happens about half the time; the power columns use the exact binomial distribution.

| true win rate | > 0.5 break-even | > 0.5 at 80% power | > 0.6 break-even | > 0.6 at 80% power |
|---:|---:|---:|---:|---:|
| 0.60 | 91 | 187 | >5000 | n/a |
| 0.65 | 41 | 82 | 350 | 730 |
| 0.70 | 21 | 43 | 88 | 177 |
| 0.75 | 16 | 26 | 34 | 76 |
| 0.80 | 11 | 19 | 22 | 41 |
| 0.85 | 8 | 14 | 14 | 25 |
| 0.90 | 4 | 8 | 11 | 14 |

## Legal-action menus

First-step menu for each red creature at the start of a match, `actual-actions-v1` [V]:

```
node research/scripts/menu-sizes.mjs
```

| map | creature | actions | of which `move_to` |
|---|---|---:|---:|
| balanced | Fighter | 59 | 48 |
| balanced | Cleric | 72 | 48 |
| balanced | Wizard | 87 | 48 |
| balanced | Rogue | 60 | 48 |
| chokepoint | Paladin | 68 | 48 |
| chokepoint | Druid | 101 | 48 (plus 45 Wild Shape forms) |
| chokepoint | Sorcerer | 92 | 48 |
| chokepoint | Ranger | 63 | 48 |
| status pressure | Fighter | 59 | 48 |
| status pressure | Cleric | 72 | 48 |
| status pressure | Bard | 71 | 48 |
| status pressure | Warlock | 79 | 48 |
