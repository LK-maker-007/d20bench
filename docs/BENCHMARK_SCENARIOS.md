# Benchmark Scenario Design

## Direction

D20bench should not lean on duels for model ratings. Duels are useful smoke tests, but they hide most tactical skill because there is usually one obvious target and little reason to coordinate.

The main benchmark direction is mirrored squad combat:

- Same team on both sides.
- Same map and scenario metadata.
- Run both side assignments for agent-vs-agent comparisons.
- Repeat over multiple seeds.

This controls for team-composition bias while still testing target priority, positioning, focus fire, support timing, resource use, AoE discipline, and status pressure.

## Rating Aggregation

Each scenario has a single stable battle type used for rating aggregation. Seasons report:

- Blended overall Elo across every scenario in the season.
- Independent Elo standings for each battle type.

This lets the public leaderboard show one general signal while still revealing whether a model is only strong in one kind of battle.

## Current Public Scenario Suite

### `public.goblin-duel.v1`

Battle type: `duel-smoke`.

Tiny adjacent duel. Keep this only as a deterministic engine smoke test.

### `public.goblin-warband-6v6.v1`

Battle type: `goblin-warband`.

Simple mirrored 6v6 Goblin Warrior battle.

Purpose:

- Swarm target selection.
- Focus-fire consistency.
- Initiative variance.
- Basic ranged-to-melee collapse.

This is deliberately simpler than the hero mirrors so the benchmark has one readable “many small units” control case.

### `public.hero-mirror-balanced-l5.v1`

Battle type: `hero-party-balanced`.

Mirrored 4v4 level-5 party on Grass Plain:

- Fighter
- Rogue
- Cleric
- Wizard

Purpose:

- Balanced party tactics.
- Frontline pressure versus backline removal.
- Healing versus damage tempo.
- Wizard AoE/control decisions.
- Rogue precision damage and target finishing.

Notable options:

- Wizard: Web, Fireball, Lightning Bolt, Scorching Ray.
- Cleric: Bless, Healing Word, Hold Person, Spirit Guardians, Preserve Life.
- Fighter/Rogue: durable weapon pressure and single-target cleanup.

### `public.hero-mirror-chokepoint-l5.v1`

Battle type: `hero-party-chokepoint`.

Mirrored 4v4 level-5 party on Stone Bridge:

- Paladin
- Druid
- Sorcerer
- Ranger

Purpose:

- Chokepoint and terrain control.
- Line and area spell positioning.
- Forced movement and clustering punishment.
- Durable anchor plus ranged pressure.

Notable options:

- Paladin: Bless, Shield of Faith, Aid, Lay on Hands.
- Druid: Entangle, Moonbeam, Call Lightning, Thunderwave, healing.
- Sorcerer: Fireball, Lightning Bolt, Shatter, Command, Innate Sorcery.
- Ranger: Longbow pressure, Hunter’s Mark, Entangle.

### `public.hero-mirror-status-l5.v1`

Battle type: `hero-party-status`.

Mirrored 4v4 level-5 party on Forest Clearing:

- Fighter
- Cleric
- Bard
- Warlock

Purpose:

- Status-heavy tactical pressure.
- Buff/debuff timing.
- Saving throw pressure.
- Line-of-sight and positioning under forest terrain.
- Whether agents prioritize disabling casters or durable frontliners.

Notable options:

- Bard: Bane, Hold Person, Hypnotic Pattern, Dissonant Whispers, Bardic Inspiration, Healing Word.
- Warlock: Hex, Hold Person, Hypnotic Pattern, Fireball, Command, Eldritch Blast.
- Cleric: Bless, Healing Word, Hold Person, Spirit Guardians, Guiding Bolt.
- Fighter: reliable pressure that punishes ignored backline control plans.

## Important Caveat

The copied Battlecast autonomous runner can already exercise many AoE/status/support options in these scenarios. D20bench exposes those Battlecast tactic options as agents:

- `battlecast.aggressive`
- `battlecast.smart`
- `battlecast.kiting`
- `battlecast.defensive`

The simple `baseline.*` agents still use the narrower D20bench legal-action catalogue: attack, move-toward, and end-turn.

Before these hero mirrors become the primary Elo suite for LLM agents, the legal-action layer should expand to include:

- Save-based spells and monster abilities.
- AoE target/center choices.
- Buffs and debuffs.
- Healing and revive actions.
- Multiattack.
- Dash, dodge, disengage, help.
- Bonus actions and reactions.

Until then, the hero mirrors are correct scenario fixtures and Battlecast-runner benchmarks. `smoke-v0` remains the fast duel-only simple-agent smoke season, while `public-baseline-v0` is the first non-duel public baseline season used to exercise blended and per-battle-type Elo output with both simple D20bench baselines and copied Battlecast tactic agents.
