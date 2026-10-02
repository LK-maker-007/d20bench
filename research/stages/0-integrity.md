# Stage 0: integrity

Date 2026-10-01. Base: upstream `ad8a355`, uncommitted working tree. Result: all gates pass.

## What was built

| file | change |
|---|---|
| `packages/engine/src/agents.ts` | LK-47 agent kind; ids `lk-47${string}`, valid only if registered |
| `packages/engine/src/lk-47/variants.ts` | new: the policy interface and the registry; one variant, `lk-47.pass` |
| `packages/engine/src/agent-match.ts` | LK-47 routed through the LLMs' stepwise path: per-step menus, trigger-time opportunity attack and damage reaction prompts; a policy's pick is rejected unless it is on the menu; LK-47 refused unless `llmActionSpace` is `actual-actions-v1`; the sync runner refuses LK-47 as it refuses LLMs; `runStepwiseOpenRouterTurn` renamed `runStepwiseTurn` because it now serves both |
| `packages/engine/src/replay.ts` | controller mode `lk-47` |
| `packages/engine/tests/lk-47.test.ts` | new: 7 tests |
| `research/scripts/run-matches.mjs`, `evaluate.sh`, `summarize-evaluation.py`, `compare-bot-matrix.py`, `stats.py` | new: evaluation runner, launcher, summary with Wilson intervals and Holm-corrected exact tests, regression comparison, shared statistics |

Nothing under `packages/engine/src/battlecast/` changed. For LLM agents every rewritten condition evaluates as before and the decision calls receive the same arguments; the 116 upstream tests, which drive the LLM stepwise path with mocked model responses, all pass.

`lk-47.pass` is an integrity probe, not a player: it ends every turn and takes the first reaction it is offered. A side played that way must lose almost every match. If it does not, the harness or the scoring is wrong.

## Gates

| gate | command | result |
|---|---|---|
| typecheck | `npm run typecheck` | clean [V] |
| all tests | `npm test` | 123 of 123 pass: 116 upstream, 7 LK-47 [V] |
| LK-47 test file typechecks | `npx tsc --noEmit --strict --target ES2023 --lib ES2023 --module ESNext --moduleResolution bundler --skipLibCheck --types node packages/engine/tests/lk-47.test.ts` | clean [V]; the repo's typecheck covers `src/` only |
| tests catch what they claim | three deliberate breakages, each run against the LK-47 tests, sources restored and checked by sha256 | dropping the protocol guard failed "refuses to play outside the actual-action protocol"; skipping the menu check failed "stops the match when a policy picks an action that is not on the menu"; unrouting opportunity-attack prompts failed "is asked for an opportunity attack" [V] |
| rules engine untouched | `git diff --stat -- packages/engine/src/battlecast` and untracked files there | empty [V] |
| bot outcomes unchanged | `research/scripts/run-bot-matrix.sh 200 <out>` then `python3 research/scripts/compare-bot-matrix.py research/data/bot-matrix.jsonl <out>` | 80 reference pairings, 80 candidate pairings: 0 missing, 0 extra, 0 changed. 16,000 games [V] |
| probe loses | `research/scripts/evaluate.sh lk-47.pass 1001 20 research/data/stage-0-pass-probe.jsonl` then `python3 research/scripts/summarize-evaluation.py research/data/stage-0-pass-probe.jsonl lk-47.pass` | 0 wins in 800 games: 4 bots, 5 maps, both sides, seeds 1001 to 1020; no draws; 800 distinct matches; longest match 8 rounds [V] |

Probe data: `research/data/stage-0-pass-probe.jsonl`, sha256 `9ae6de407f4c363b9a048fe3651982e70340816fc33704a2d242f79127c04f77`. The regression output was not kept; only its comparison result matters, and the command above regenerates it.

The compiled engine was rebuilt before the regression and fingerprinted (sha256 over all `dist/**/*.js`); a second build produced the same fingerprint, so the regression ran on the final code [V].

## Changes to the plan

- The simulator and its dice-isolation test moved from stage 0 to stage 1. Nothing simulates before stage 1, so a test written now would test code with no caller.
- The stage 0 regression gate was restated: identical game outcomes per pairing, not identical bytes ([corrections.md](../corrections.md), entry 10).
- The pass rule for evaluations is one rule everywhere: one-sided exact binomial test at Holm-adjusted p < 0.025 (entry 11).

## Problems found during the stage

- I edited `run-bot-matrix.sh` while the regression was running it, to make its output stream live. Bash reads a script from disk as it runs, so after the jobs finished it read the edited file at a stale position and failed with `line 28: unexpected EOF while looking for matching '"'` (exit 2). All 80 pairings had already been written, and the comparison confirms the data is complete and unchanged. Rule from here: never edit a script while a run of it is in progress ([corrections.md](../corrections.md), entry 12).
- Both launchers now stream every result line to the terminal through `tee` as it lands, instead of writing silently until the end.
- The CLI's `match run` cannot run LK-47: it calls the async runner without an action space, so the protocol guard refuses it with a clear error. Out of scope; evaluations call the library through `research/scripts/run-matches.mjs`.

## Next

Stage 1: the simulator with private dice and its isolation test, then one menu imitator per bot tactic and the parity test against the real bot ([05-architecture.md](../05-architecture.md#7-plan-with-kill-criteria-written-before-any-run)).

## Turn audit, added 2026-10-02

A search agent can win by finding a hole in the simulator instead of playing well. `research/scripts/audit-turns.mjs` replays an evaluated game, checks that it ends in the recorded final state hash, and then checks every LK-47 decision:

- The author's own season-audit counts, applied to LK-47 (`summarizeLlmHarnessAudit` in `llm-season.ts` counts them for LLMs only):
  - menus offering a whole bot turn, and picks of one;
  - actions the engine logged as invalid;
  - moves that left no log;
  - the most decisions in one turn.
- Within each turn, a spent main action, bonus action, attack roll or movement may come back only through a rule that restores it: Action Surge, or Dash for movement.
- At most one reaction between two of the creature's own turns.
- Attack rolls per turn, by class, for inspection.

```
node research/scripts/audit-turns.mjs <agent> <opponent> <scenario-id> <first-seed> <seed-count> <evaluation.jsonl>
```

First audit, 56 games sampled from all four data files so far: the stage 2 gate, the stage 2 games against the other bots, and both stage 3 budget arms [V]:

- Every game replayed to its recorded final hash, with the current code.
- No whole-bot-turn menus or picks, no invalid actions, no moves without a log, at most 9 decisions in a turn.
- Every restored resource came from Action Surge or Dash.
- At most 4 attack rolls in a Fighter turn and 2 for every other class. That is Extra Attack plus Action Surge, and two Eldritch Blast beams at level 5 [H, from the 5e rules as I know them, not checked against a source here].
- 0 violations.

### A third benchmark defect: two reactions before the next turn

The audit found two opportunity attacks by LK-47 creatures that had already used Cutting Words since their last turn. The engine allows this for every player:

- The reactions other than opportunity attacks set only `reactionUsed` (`combat.ts:1580, 2941, 3050, 3112, 3675`, `combat-aoe.ts:204`, `combat-spellcasting.ts:302`).
- Opportunity attacks are checked with `reactionsUsed ?? (reactionUsed ? 1 : 0)`: for bots at `ai-turn.ts:693`, and for menu-driven players at `agent-match.ts:1911`.
- Every turn start sets `reactionsUsed` to 0 (`processTurnStart`, `ai-turn.ts:384`), so the fallback never applies after a creature's first turn.

The reverse order is blocked: an opportunity attack also sets `reactionUsed` (`ai-turn.ts:776`). LK-47 does not seek this out. It takes every reaction it is offered, as the bots do, and the harness offers the second one. The audit counts these cases apart from violations. They are reported upstream with the other two defects in [issue #2](https://github.com/bjedrzejewski/d20bench/issues/2).
