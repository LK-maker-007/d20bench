# D20 research

Research toward a CPU-only, non-LLM agent that beats every opponent on [D20bench](https://github.com/bjedrzejewski/d20bench), a D&D 5e combat benchmark. The agent, LK-47, picks every action from the legal menu. Inside its simulations it predicts the other creatures with Battlecast Smart's own turn logic; [stage 6b](stages/6b-independence.md) reports a variant without it. This folder is ours. Outside it, everything is the upstream benchmark at commit `ad8a355` except the LK-47 code: `packages/engine/src/lk-47/`, its harness wiring in `agents.ts`, `agent-match.ts` and `replay.ts`, and `packages/engine/tests/lk-47.test.ts`.

Status, 2026-10-02:

- Stage 0, harness integrity: passed all gates ([report](stages/0-integrity.md)). A turn audit added later found a third benchmark defect.
- Stage 1, bot imitation through the menu: failed its parity gate. The causes are two defects in the benchmark ([report](stages/1-imitation.md)).
- Stage 2, the planner: passed. Under the fairfix protocol LK-47 won 231 of 400 against `battlecast.smart` on chokepoint and 329 of 400 on status pressure. Against the other three bots it won 0.688 to 0.868 on status pressure. On chokepoint it beat `kiting` 0.710, while its 0.532 against `aggressive` and 0.527 against `defensive` are not significant ([report](stages/2-planner.md)).
- Stage 3, thinking budget: four times the rollouts beat the stage 2 planner, 0.805 to 0.610 against `battlecast.aggressive` (paired p = 1.46e-19). The final agent uses 4x ([report](stages/3-budget.md)).
- Stage 6b, the independence variant: with no bot code in its simulations it won 0.195 on chokepoint and 0.640 on status pressure against Smart ([report](stages/6b-independence.md)).
- Stage 5, the confirmatory run: on chokepoint the 4x agent beat all four bots (Smart and Aggressive 121 of 160, Kiting 135, Defensive 115; each passes with Holm over 8). I stopped the run at 825 of 1,280 games, so status pressure makes no claim. The 4x season entry, the 8 games every LLM played against Smart, went 6-2: second, 4.2 points behind GLM 5.2 ([report](stages/5-confirmatory.md)).
- Stage 7, a 16x version: it won 90 of 100 development games against Smart on chokepoint where 4x won 82, then won all 8 season games. Appended to the published season it ranks first at 1107.0, 38.5 points above GLM 5.2; with both versions appended, 1090.6. All 16 season games replay exactly with 0 violations ([report](stages/7-strength.md)). Stage 6 needs LLM games and has no budget.
- Upstream: the agent is offered in [PR #1](https://github.com/bjedrzejewski/d20bench/pull/1), and the three engine defects are reported in [issue #2](https://github.com/bjedrzejewski/d20bench/issues/2).

## Reading order

| file | what it answers |
|---|---|
| [00-goal.md](00-goal.md) | what "beat everyone" means, the claim and its limits, clean-play rules, the statistical bar |
| [01-benchmark.md](01-benchmark.md) | how D20bench works: protocol, scoring, what an agent sees, dice, the bots, submission |
| [02-measurements.md](02-measurements.md) | bot round robin on all five maps, published LLM results and costs, sample sizes, action menus |
| [03-performance-and-language.md](03-performance-and-language.md) | engine speed, where the time goes, TypeScript vs a Rust port |
| [04-literature/](04-literature/) | four censuses: [tactics search](04-literature/tactics-search.md), [competitions](04-literature/competitions.md), [learning and world models](04-literature/learning.md), [D&D combat AI](04-literature/dnd-combat-ai.md) |
| [05-architecture.md](05-architecture.md) | the recommended design, the plan, and the kill criteria |
| [stages/](stages/) | one report per build stage: what was built, every gate with its command and result. Stages [0](stages/0-integrity.md), [1](stages/1-imitation.md), [2](stages/2-planner.md), [3](stages/3-budget.md), [5](stages/5-confirmatory.md), [6b](stages/6b-independence.md), [7](stages/7-strength.md) |
| [corrections.md](corrections.md) | what I said earlier that turned out wrong |

## Findings at a glance

- The bot to beat is not `battlecast.smart`. `battlecast.aggressive` wins about 59% against it on both headline maps, and no bot is best on every map ([02](02-measurements.md#strongest-bot-per-map)).
- In comparable games, hand-written policies plus shallow search on a cut-down action space won; unconstrained MCTS and RL from scratch lost ([literature](04-literature/)).
- No learned world model has beaten planning with an exact simulator. JEPA-style models are the wrong tool when the rules engine is available ([learning](04-literature/learning.md#learned-world-models-vs-an-exact-simulator)).
- No published search or RL agent beats a mature scripted 5e AI ([D&D combat AI](04-literature/dnd-combat-ai.md)).
- The engine plays a full battle in 12 to 13 ms; 88.5% of harness time is replay bookkeeping an agent does not need ([03](03-performance-and-language.md)). Inside LK-47 the cost is elsewhere: 68.5% of a 4x game goes to Smart's own turn logic run by the rollouts ([stage 7](stages/7-strength.md#why)).
- Submission costs nothing; there is no submission process yet. Only LLM opponents cost money ([01](01-benchmark.md#publishing-and-submission)).
- The benchmark favours its scripted bots over every menu-driven player, the fairfix LLMs included. 15 hero spell entries lack a range, so the menu centres them on the caster or limits them to 5 ft, while the bots cast them from afar. The kiting bot gets a second attack per turn. Copies of the bots played through the menu win 0 to 5% against the originals on the hero maps ([stage 1](stages/1-imitation.md)). A third defect lets a creature take an opportunity attack after spending its reaction on something else ([stage 0](stages/0-integrity.md#a-third-benchmark-defect-two-reactions-before-the-next-turn)).
- LK-47's strength on chokepoint comes mostly from predicting the other creatures with Smart's turn logic inside its simulations. Without it, the planner wins 0.195 there ([stage 6b](stages/6b-independence.md)).

## Evidence tags

| tag | meaning |
|---|---|
| [V] | verified: a command was run or a file was read; the command or `file:line` is given |
| [C] | cited: a published source says it; the link is given. Literature entries were read in the primary source and cross-checked where noted |
| [H] | hypothesis or estimate, untested here; the text says what would test it |
| (WF) | seen only through a web summary, not checked against raw text |

`file:line` references point at upstream commit `ad8a355`, not at the working tree.

Other commit hashes in these notes, such as `538b504`, `f013c11`, `cd7c54b` and `d883839`, name commits in the private development history. The public fork holds the same files as a single commit.

## Reproducing the numbers

```
npm ci
npm run build
research/scripts/run-bot-matrix.sh 200 research/data/bot-matrix.jsonl
python3 research/scripts/summarize-bot-matrix.py research/data/bot-matrix.jsonl
python3 research/scripts/published-results.py
node research/scripts/menu-sizes.mjs
node research/scripts/engine-speed.mjs
node --cpu-prof --cpu-prof-dir=<dir> research/scripts/harness-profile.mjs
node --cpu-prof --cpu-prof-dir=<dir> research/scripts/playout-profile.mjs
node research/scripts/summarize-cpu-profile.mjs <dir> <function names>
[CHUNK=<seeds per job>] research/scripts/evaluate.sh <agent> <first-seed> <seeds-per-side> <out.jsonl> [scenario-id ...]
python3 research/scripts/summarize-evaluation.py <out.jsonl> <agent>
python3 research/scripts/compare-bot-matrix.py research/data/bot-matrix.jsonl <new-matrix.jsonl>
node research/scripts/planner-budget.mjs <lk-47-agent> <opponent> <scenario-id> <first-seed> <seed-count>
python3 research/scripts/compare-paired.py <a.jsonl> <agent-a> <b.jsonl> <agent-b>
python3 research/scripts/paired-power.py <pairs> <baseline-win-rate>
node research/scripts/audit-turns.mjs <lk-47-agent> <opponent> <scenario-id> <first-seed> <seed-count> [evaluation.jsonl]
python3 research/scripts/season-entry.py <season standings.json> <entry.jsonl> <agent-id> [<entry.jsonl> <agent-id> ...]
```

Every script reads the compiled engine from `packages/engine/dist`, which `npm run build` and `npm run typecheck` both write. The numbers in 02 and 03 came from a build of `ad8a355` before any LK-47 code; stage 0 rebuilt the engine with LK-47 wired in and confirmed every bot-vs-bot outcome is unchanged. Launchers stream each result line to the terminal as it lands and append it to the data file.

## Layout

```
research/
  README.md
  00-goal.md  01-benchmark.md  02-measurements.md  03-performance-and-language.md
  04-literature/   tactics-search.md  competitions.md  learning.md  dnd-combat-ai.md
  05-architecture.md
  stages/          one report per build stage
  corrections.md
  scripts/         measurement, evaluation and analysis scripts
  data/            raw results as JSON lines; each file's sha256 is in the doc that reports it
```
