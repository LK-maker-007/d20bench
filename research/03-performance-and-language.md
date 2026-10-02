# 03. Performance and the language question

## Machine

11th Gen Intel Core i5-11300H, 8 logical CPUs (4 cores, 2 threads each), 15 GB RAM, Node v20.20.2, Linux [V, `lscpu`, `node --version`]. Timings below were taken with no other benchmark running; the load average at the start was 3.55 from the tail of the bot matrix, so treat them as upper bounds within about 20%.

## Engine speed

```
node research/scripts/engine-speed.mjs
node research/scripts/engine-speed.mjs public.hero-mirror-balanced-l5.v1 public.goblin-warband-6v6.v1
```

[V]:

| map | harness match, Smart vs Smart | bare playout to the end | bare playout, 2 rounds | state copy without logs |
|---|---:|---:|---:|---:|
| chokepoint | 108.4 ms | 11.98 ms | 5.33 ms | 0.210 ms |
| status pressure | 431.4 ms | 12.68 ms | 3.70 ms | 0.283 ms |
| balanced | 142.0 ms | 13.37 ms | 6.35 ms | 0.204 ms |
| goblin warband | 59.9 ms | 13.39 ms | 9.71 ms | 0.095 ms |

"Bare playout" runs the engine's own Smart turn for every creature from round 1 with no harness, replay or hashing. 299 or 300 of 300 bare playouts reached a winner within the 50-round cap on every map.

Copying the state with its logs and events costs 2.4 to 3.2 times more than without them (0.501 vs 0.210 ms on chokepoint). The engine reads past events only for the current turn's movement (`ai-turn.ts:637`, `:852`, `:1881` at `ad8a355`), so a simulator can drop logs and keep recent events.

## Where the harness spends its time

```
node --cpu-prof --cpu-prof-dir=<dir> research/scripts/harness-profile.mjs public.hero-mirror-status-l5.v1 10
node research/scripts/summarize-cpu-profile.mjs <dir> hashBattlecastState cloneBattleState executeTurn
```

[V], inclusive time over 10 status-pressure matches:

| function | share | what it does |
|---|---:|---|
| `hashBattlecastState` | 70.5% | stable JSON plus hash of the whole state for every replay event |
| `cloneBattleState` | 18.0% | snapshot before each scripted turn so a reaction prompt can rewind |
| `executeTurn` | 6.4% | the bots actually playing |

A harness match costs 4.5 to 34 times a bare playout (goblin warband to status pressure), and 88.5% of harness time is replay bookkeeping, not game logic. An agent's internal simulator does not need either. Data generation for learning should also bypass the harness.

## Where a bare playout spends its time

```
node --cpu-prof --cpu-prof-dir=<dir> research/scripts/playout-profile.mjs public.hero-mirror-chokepoint-l5.v1 500
node research/scripts/summarize-cpu-profile.mjs <dir> executeTurn findPath moveToward chooseSmartDestination trySpellcast resolveAttack executeSpell resolveAoE applyDamage rollDice pushLog
```

[V], inclusive time over 500 chokepoint playouts (rows overlap because callers include callees):

| function | share | kind |
|---|---:|---|
| `moveToward` | 25.1% | bot movement |
| `chooseSmartDestination` | 20.2% | bot movement scoring |
| `findPath` | 19.3% | pathfinding |
| `trySpellcast` | 17.6% | bot spell choice |
| `resolveAttack` | 6.1% | rules |
| `executeSpell` | 5.6% | rules |
| `applyDamage` | 3.0% | rules |
| `resolveAoE` | 2.9% | rules |
| `pushLog` | 1.7% | logging |
| `rollDice` | 0.5% | dice |

Most of a playout is the scripted bots deciding where to move. Rule resolution is a small share.

## Code size

`wc -l` at `ad8a355` [V]:

| part | files | lines |
|---|---|---:|
| rules | `combat*.ts`, `dice.ts` | 7,075 |
| bot decision logic, plus turn-start rules in `ai-turn.ts` | `ai*.ts` | 6,057 |
| data tables | `monsters.ts`, `heroes.ts`, `spells.ts`, `presets.ts`, `maps.ts` | 10,002 |
| types | `battlecast/types/*.ts` | 1,068 |
| legal-action menus | `legal-actions.ts` | 2,133 |
| match runner and action application | `agent-match.ts` | 2,910 |

## The language decision

Official matches run in the TypeScript harness, so the agent's interface is TypeScript whatever its internals. The question is whether its internal simulator should be a port.

| | stay in TypeScript (Node) | port the simulator to Rust |
|---|---|---|
| rule fidelity | identical by construction: same code as the benchmark | must be proven by differential tests on identical dice streams |
| what must be ported | nothing | rules (7.1k lines) and bot logic (6.1k lines), because playouts run the bots; data can be exported as JSON |
| speed | 12 to 13 ms per full playout, measured | faster by an unmeasured factor [H] |
| main risk | too slow if strength keeps rising with budget | a port that drifts from the real rules makes the search optimise a different game |
| integration | in-process, `worker_threads` for parallelism | native addon or subprocess |

Cheaper speedups exist before a port [H]:
- skip replay bookkeeping inside the simulator (88.5% of harness time in the profile above);
- truncate playouts after a few rounds and score with an evaluation (2-round playouts cost 29 to 73% of full ones);
- run 8 evaluation matches in parallel, one per logical CPU.

Decision rule: build in TypeScript. Measure win rate against thinking budget at 0.25x, 1x and 4x. Port the hot path to Rust only if the 4x budget is significantly stronger than 1x on a pre-registered comparison, and only with a differential test suite that replays identical dice through both engines and requires identical state hashes. C++ offers nothing Rust does not here, and Rust has mature Node bindings (napi-rs) [H, not checked].
