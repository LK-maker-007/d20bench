# Stage 1: menu imitation

Started 2026-10-01 on branch `lk-47/stage-1`. Result: dice isolation passes; parity fails in all 8 cells. The sections up to "Found before the run" were written before any parity game was played.

## Question

Can a scripted bot's turn be expressed through the same legal menus the LLMs get? The planner in stage 2 uses the bots' own turns as candidate plans, so a menu that cannot express them caps how strong those candidates can be.

## What was built

| file | what it does |
|---|---|
| `packages/engine/src/lk-47/imitator.ts` | runs the scripted bot's turn on a private copy of the battle under private dice, reads what it did from the copy's events and logs, then plays those steps back through the legal menu one decision at a time |
| `packages/engine/src/lk-47/variants.ts` | four variants: `lk-47.imitate-smart`, `-aggressive`, `-kiting`, `-defensive` |

How a planned step becomes a menu action:

| bot step, read from | menu action chosen |
|---|---|
| move, from `move` events | the offered destination closest to the bot's square, if it is closer than standing still |
| weapon or spell attack, from `attack` events | the same action on the same target; if that target is gone, the target the bot's own rule picks now |
| area spell, from `aoe` events | the same spell aimed nearest the bot's centre, direction or target square |
| heal, from heal logs paired with the `heal` event at the same index | the same spell on one of the healed creatures |
| stabilise, Wild Shape | the matching menu entry |
| buffs, class features, Dash, Disengage, from the acting creature's own logs | the menu entry with that name and target |
| reactions and Divine Smite | the bots' defaults: always react, first melee weapon for opportunity attacks; smite every hit with a free smite, else the lowest slot |

## Gate, fixed before the run

- The private plan never draws from the match's dice and never changes the live battle state: a test runs a plan inside a seeded match generator and checks its state is untouched.
- Parity, per tactic and per map: each imitator plays its own bot on chokepoint and status pressure, seeds 1001 to 1200, both sides, 400 games per cell, 8 cells. Pass: the imitator is not significantly worse than its bot, meaning the 95% Wilson upper bound of its win rate is at least 0.5.

The architecture doc stated the parity gate as "the interval includes 0.5". That would also fail an imitator that is significantly better than its bot, which is no evidence the menu loses information. The gate above is the precise form, fixed before any parity game.

## Found before the run: area spells without a range

The bots and the LLM menu place sphere spells differently:

- Bots use `getHeroAoeTargets` (`battlecast/engine/ai-spellcasting.ts:163-170`), which treats any sphere as cast at a point, picks the best centre within the spell's range, and hits only enemies; the engine calls this "Strictly a deviation from SRD".
- The menu offers a point-centred sphere only when the spell has a `range` field (`legal-actions.ts:2048-2051`). Without one, `getAoETargets` treats it as centred on the caster (`battlecast/engine/combat-aoe.ts:890-897`): it is offered only when an enemy is within its radius of the caster, and the cast hits every creature that close, allies included (`applySpellAction` in `agent-match.ts`).
- In a traced status-pressure match the bot Warlock cast Fireball from range while the imitator's menu offered no Fireball at all.

Level-5 hero spells shaped as a sphere or cylinder, from `buildHero(<class>, 5)` at `ad8a355` [V]. Every one except Land's Aid lacks a `range` field, so the menu centres it on the caster:

| class | spells the menu centres on the caster | point-aimed with a range |
|---|---|---|
| Bard | Shatter (10 ft), Hypnotic Pattern (30 ft) | none |
| Druid | Entangle (20 ft), Moonbeam (5 ft cylinder), Call Lightning (5 ft cylinder) | Land's Aid (10 ft, range 60) |
| Ranger | Entangle (20 ft) | none |
| Sorcerer | Shatter (10 ft), Fireball (20 ft) | none |
| Warlock | Hypnotic Pattern (30 ft), Fireball (20 ft) | none |
| Wizard | Sleep (20 ft), Web (20 ft), Fireball (20 ft) | none |

Cones, lines and emanations start at the caster in both: the menu aims them from the caster's square (`directionalAreaActions` in `legal-actions.ts`) and the bots treat them as caster-origin shapes (`aoeOriginKind` in `ai-spellcasting.ts`). The two may still pick different directions.

This limits every menu-driven agent, including every LLM in the published seasons, and the planner cannot work around it without leaving the benchmark's protocol. The parity run will show how much it costs.

## Results

### Private planning is isolated

`packages/engine/tests/lk-47.test.ts` runs a plan inside a seeded match generator and checks that the generator's position and the live battle are unchanged, and that one seed gives one plan [V, `npm test`, 130 of 130]. Three deliberate breakages were each caught: planning on the match's dice and planning on the live battle failed the isolation test; pairing heal logs with the wrong event failed the heal test once that test was tightened to the exact plan (the first, looser version passed with the bug in place, so it was strengthened).

### Parity: fails in every cell

```
OPPONENTS=battlecast.<tactic> research/scripts/evaluate.sh lk-47.imitate-<tactic> 1001 200 research/data/stage-1-parity-<tactic>.jsonl public.hero-mirror-chokepoint-l5.v1 public.hero-mirror-status-l5.v1
python3 research/scripts/summarize-parity.py research/data/stage-1-parity-*.jsonl
```

[V], 400 games per cell, seeds 1001 to 1200, both sides:

| imitator vs its own bot | chokepoint | status pressure |
|---|---|---|
| smart | 0 / 400, 0.000 [0.000, 0.010] | 19 / 400, 0.048 [0.031, 0.073] |
| aggressive | 2 / 400, 0.005 [0.001, 0.018] | 12 / 400, 0.030 [0.017, 0.052] |
| kiting | 1 / 400, 0.003 [0.000, 0.014] | 21 / 400, 0.052 [0.035, 0.079] |
| defensive | 0 / 400, 0.000 [0.000, 0.010] | 0 / 400, 0.000 [0.000, 0.010] |

### Control: a map without spells

```
OPPONENTS=battlecast.<tactic> research/scripts/evaluate.sh lk-47.imitate-<tactic> 1001 100 research/data/stage-1-control-warband-<tactic>.jsonl public.goblin-warband-6v6.v1
```

[V], 200 games per cell:

| imitator vs its own bot, goblin warband | wins | win rate [95% Wilson] |
|---|---:|---|
| smart | 99 / 200 | 0.495 [0.426, 0.564] |
| aggressive | 102 / 200 | 0.510 [0.441, 0.578] |
| defensive | 100 / 200 | 0.500 [0.431, 0.569] |
| kiting | 18 / 200 | 0.090 [0.058, 0.138] |

Where the menu can express the bot's turn, the imitator plays even with it. Moves, weapon attacks, reactions and Nimble Escape translate faithfully.

### Cause 1: the kiting bot attacks twice

For a creature without Multiattack, the kiting branch of `executeTurn` makes one ranged attack and never sets `creature.hasActed` (`battlecast/engine/ai-turn.ts:2135-2148` at `ad8a355`). The fallback block below runs when `!creature.hasActed` (`:2153-2186`) and attacks again. A traced warband match shows two Shortbow attack events per kiting goblin turn with no movement between them [V]; the Goblin Warrior has no Multiattack (its only actions are Scimitar and Shortbow). The legal menu allows one attack, so no menu-driven agent can copy this. It also explains kiting's 0.853 score on the goblin warband in [02-measurements.md](../02-measurements.md#strongest-bot-per-map): that lead comes from the extra attack.

### Cause 2: area and cantrip spells without a range

Listed above and reproducible with `node research/scripts/rangeless-spells.mjs`: 13 sphere or cylinder entries that the menu centres on the caster, and 2 cantrips (Sacred Flame, Vicious Mockery) that it limits to 5 ft.

Attribution, from `node research/scripts/parity-attribution.mjs smart <scenario> 1001 10` (20 matches per map; plans regenerated under a fixed seed, so counts are approximate) [V]:

| map | imitator turns | turns with a plan but only an end turn | planned spells never on that turn's menus |
|---|---:|---:|---|
| chokepoint | 113 | 12 | Sorcerer Fireball 22 turns, Druid Call Lightning 5 |
| status pressure | 620 | 34 | Cleric Sacred Flame 55, Warlock Fireball 14, Bard Hypnotic Pattern 13, Bard Shatter 11 |

Causal test: the same smart parity with those spells given their SRD range in in-memory copies of both maps, for both teams (`research/scripts/parity-counterfactual.mjs`; the range values were entered by hand and not checked against the SRD) [V]:

| map | real data | ranges filled in |
|---|---|---|
| chokepoint | 0 / 400, 0.000 | 71 / 200, 0.355 [0.292, 0.423] |
| status pressure | 19 / 400, 0.048 | 36 / 200, 0.180 [0.133, 0.239] |

The missing ranges cause a large share of the collapse. They do not explain all of it: with ranges filled in, the imitator still loses clearly. The remainder is unexplained. Candidates [H]: bot abilities the menu never offers (the attribution saw Seeking Spell and Land's Aid Heal), the 48-square movement menu, and plans that break when the real dice differ from the private ones.

### Data

| file | games | sha256 |
|---|---:|---|
| `research/data/stage-1-parity-smart.jsonl` | 800 | `586a06bf1c0b21498f1e1d1d3e402c0ef268c53e77dc7ccd4e6b79ca565e01da` |
| `research/data/stage-1-parity-aggressive.jsonl` | 800 | `94915da189e85d666435be59f653e5f9dd5bebe9d9f55e95ceeb837ca95ac662` |
| `research/data/stage-1-parity-kiting.jsonl` | 800 | `a2cbf26677c3af6109f7b185b01518af0e87cf6d7178e215af936cd23ef123c0` |
| `research/data/stage-1-parity-defensive.jsonl` | 800 | `0000724ad3dda6227ed76477b55bdca0863f6fa966ac1e18e8b39dd61a894648` |
| `research/data/stage-1-control-warband-smart.jsonl` | 200 | `21290fc0c7d0e965d0ee7df943d914dab27c27a6f377492c7758efd289a788f4` |
| `research/data/stage-1-control-warband-aggressive.jsonl` | 200 | `1ed4d46234b6580319ca26afd434c8b744b9b66d40536ef08f53db9bc3f83007` |
| `research/data/stage-1-control-warband-kiting.jsonl` | 200 | `bbf6591a54c197d399f6054f9f28312f06e21fb58adaf5b48d54d7e4ec4016a9` |
| `research/data/stage-1-control-warband-defensive.jsonl` | 200 | `d641f7f94d1b7dddcb987939d972c83bdeafaedce6617b67653ba405330ec213` |
| `research/data/stage-1-counterfactual-smart.jsonl` | 400 | `4115cf74cbc64d5cd5bd1036273d22944b1c9cbd4867490f787c51b89b790348` |

## What the failure means

The pre-registered response to a failed parity gate is to build planner candidates from the menu itself instead of from bot plans. The evidence supports that, with one refinement: bot plans translate well wherever the menu can express them (the warband control), so they stay as one candidate source and are not the only one.

The failure does not show that the bots cannot be beaten through the menu. GLM 5.2 beat `battlecast.smart` 5-3 under the same handicaps ([02-measurements.md](../02-measurements.md#published-llm-results)). The imitator loses because it follows plans built on spells the menu does not offer, and idles when they are missing; a planner that only ever chooses from the menu does not have that failure mode.

Both causes are defects in the benchmark, not in LK-47, and they affect every LLM result published so far.
