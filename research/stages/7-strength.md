# Stage 7: a stronger version for a second season entry

Plan written on 2026-10-02 at 18:15, before any `lk-47.16x` game.

## Why

`lk-47` (4x) won 6 of its 8 season games and ranks second, 4.2 points behind GLM 5.2 ([5-confirmatory.md](5-confirmatory.md#season-entry)). I decided that a stronger version plays the same 8 slots once, under its own name. The first entry stays in every report.

A CPU profile of one 4x game (seed 1001, chokepoint, against Smart) puts 68.5% of the time inside Smart's own turn logic run by the rollouts, and 13.6% in `copyBattle` [V, `node --cpu-prof`]. Smart's code is upstream and stays unchanged, so speedups that keep every decision the same are worth about 15% at most [H]. More strength has to come from more rollouts.

```
node --cpu-prof --cpu-prof-dir=<dir> research/scripts/run-matches.mjs lk-47 battlecast.smart public.hero-mirror-chokepoint-l5.v1 1001 1
node research/scripts/summarize-cpu-profile.mjs <dir> playScriptedTurn copyBattle
```

## The candidate

`lk-47.16x`: samples 16, 64 and 192; keep 6, 2 and 1. Four times the samples of `lk-47` at every step, like the 4x step of stage 3, which beat 1x with p 1.46e-19 ([3-budget.md](3-budget.md)).

## Development test

- `lk-47.16x` against `battlecast.smart` on chokepoint, seeds 3001 to 3050, both sides: 100 games. `lk-47` played the same 100 in the stage 5 check and won 82.
- Decision: `lk-47.16x` becomes the second entry if it wins more of the 100 than `lk-47` did. At 100 pairs a one-sided McNemar test at 0.025 has power 0.47 for a 10-point gain [V, `paired-power.py 100 0.82`], so the choice is made on the point estimate. The exact p is reported with it.
- Status pressure is not retested. `lk-47` won 153 of 155 games against Smart there before the confirmatory run was stopped.
- If `lk-47.16x` does not win more, there is no second entry from this stage.
- Seeds 1 and 2 and every seed from 100001 stay out of development.

## Second season entry

- `lk-47.16x` plays the 8 slots once: seeds 1 and 2, both maps, both sides, with no change after the development test.
- Rated by `season-entry.py` exactly like the first entry: appended alone to the season's 48 games. Each version is rated as if it had been in the season.
- Both entries are reported, and so is the table with both appended in order.

## Commands

```
OPPONENTS=battlecast.smart CHUNK=13 research/scripts/evaluate.sh lk-47.16x 3001 50 research/data/stage-7-16x.jsonl public.hero-mirror-chokepoint-l5.v1
python3 research/scripts/compare-paired.py research/data/stage-5-precheck.jsonl lk-47 research/data/stage-7-16x.jsonl lk-47.16x
OPPONENTS=battlecast.smart research/scripts/evaluate.sh lk-47.16x 1 2 research/data/stage-7-season-entry.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
python3 research/scripts/season-entry.py results/seasons/llm-actual-fairfix-tournament-v2/standings.json research/data/stage-7-season-entry.jsonl lk-47.16x
```

## Result

### Development test

The plan files were last changed at 18:17:43 and the run started at 18:17:48 [V, file times]. They were committed in `cd7c54b` at 18:41, when 31 of the 100 games had finished, and not edited in between. Exit status 0, no draws. After the results, two edits touched the plan sections: the `copyBattle` share went from 13.5% to 13.6%, the figure the committed profile summarizer prints, and the profile commands were added. The decision rule and the entry rules are as committed.

| agent | wins on the 100 games | win rate | 95% Wilson |
|---|---:|---:|---|
| `lk-47` (stage 5 check) | 82 | 0.820 | [0.733, 0.883] |
| `lk-47.16x` | 90 | 0.900 | [0.826, 0.945] |

Paired on seed and side: only `lk-47.16x` won 11 games, only `lk-47` won 3. One-sided exact McNemar p = 0.0287 [V, `compare-paired.py`]. That is short of 0.025, as the power calculation warned it might be. The decision rule is the point estimate, 90 against 82, so `lk-47.16x` becomes the second entry.

`research/data/stage-7-16x.jsonl`: 100 lines, sha256 `091f088d676301171535fba5da2dae7a5eebfbab00856b4be88f5a940d96a675`.

### Second season entry

Started at 19:27:24 with no code change since `cd7c54b`. It ran with `CHUNK=1`, one game per process, so all 8 games ran at once; each seed fixes its game whatever the chunk size. Finished at 19:34, exit status 0.

`lk-47.16x` won all 8 and ranks first, 38.5 points above GLM 5.2 [V, `season-entry.py`]:

| rank | agent | Elo | W-L-D |
|---:|---|---:|---|
| 1 | lk-47.16x | 1107.0 | 8-0-0 |
| 2 | openrouter:z-ai/glm-5.2 | 1068.5 | 16-8-0 |
| 3 | openrouter:deepseek/deepseek-v4-flash | 1014.2 | 13-11-0 |
| 4 | battlecast.smart | 940.1 | 15-17-0 |
| 5 | openrouter:qwen/qwen3.5-flash-02-23 | 870.2 | 4-20-0 |

With both entries appended in order, `lk-47` first, `lk-47.16x` still ranks first, 22.1 points above GLM 5.2. Smart loses rating to the first entry, so each later win over it is worth less:

| rank | agent | Elo | W-L-D |
|---:|---|---:|---|
| 1 | lk-47.16x | 1090.6 | 8-0-0 |
| 2 | openrouter:z-ai/glm-5.2 | 1068.5 | 16-8-0 |
| 3 | lk-47 | 1064.3 | 6-2-0 |
| 4 | openrouter:deepseek/deepseek-v4-flash | 1014.2 | 13-11-0 |
| 5 | battlecast.smart | 892.1 | 17-23-0 |
| 6 | openrouter:qwen/qwen3.5-flash-02-23 | 870.2 | 4-20-0 |

What this is: the same engine, menus, reaction prompts, round cap, seeds and opponent each LLM faced, rated by the season's own update. What it is not: games against the LLMs. The rating passes through one shared opponent, Smart. Against Smart, GLM 5.2 won 5 of 8, `lk-47` 6 of 8 and `lk-47.16x` 8 of 8. Eight games are a small sample. At 0.90 against Smart on chokepoint (the development test) and 0.987 on status pressure (`lk-47` in the stopped stage 5 run), 8 of 8 had about a 62% chance [H, assumes those rates].

`research/data/stage-7-season-entry.jsonl`: 8 lines, sha256 `97e37665b93cccf8227747a50234bd7926d512109965ee3071207ef44ed7b6b8`.

```
python3 research/scripts/season-entry.py results/seasons/llm-actual-fairfix-tournament-v2/standings.json research/data/stage-5-season-entry.jsonl lk-47 research/data/stage-7-season-entry.jsonl lk-47.16x
```

### Audit of both season entries

All 16 season games were replayed with `audit-turns.mjs` at `cd7c54b` [V]:

| entry | games | replay hash matches | LK-47 turns | violations | invalid actions | delegate actions | opportunity attacks after another reaction |
|---|---:|---:|---:|---:|---:|---:|---:|
| `lk-47.16x` | 8 | 8 | 412 | 0 | 0 | 0 | 0 |
| `lk-47` | 8 | 8 | 362 | 0 | 0 | 0 | 0 |

```
node research/scripts/audit-turns.mjs lk-47.16x battlecast.smart public.hero-mirror-chokepoint-l5.v1 1 2 research/data/stage-7-season-entry.jsonl
node research/scripts/audit-turns.mjs lk-47.16x battlecast.smart public.hero-mirror-status-l5.v1 1 2 research/data/stage-7-season-entry.jsonl
node research/scripts/audit-turns.mjs lk-47 battlecast.smart public.hero-mirror-chokepoint-l5.v1 1 2 research/data/stage-5-season-entry.jsonl
node research/scripts/audit-turns.mjs lk-47 battlecast.smart public.hero-mirror-status-l5.v1 1 2 research/data/stage-5-season-entry.jsonl
```

### Bot regression at `d883839`

Stage 0 showed bot-vs-bot outcomes unchanged by the LK-47 wiring. `agent-match.ts` has changed since, so the check was rerun on `d883839` before the upstream PR: 80 reference pairings, 80 candidate pairings, 0 missing, 0 extra, 0 changed. 16,000 games [V].

```
research/scripts/run-bot-matrix.sh 200 research/data/stage-7-bot-matrix.jsonl
python3 research/scripts/compare-bot-matrix.py research/data/bot-matrix.jsonl research/data/stage-7-bot-matrix.jsonl
```

`research/data/stage-7-bot-matrix.jsonl`: 80 lines, sha256 `835453d4967a445561991605288ce627328ae919ce58d04406ec1144ef19b1ff`.
