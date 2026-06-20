# Battlecast Rules Core Provenance

## Source

- Repository: `https://github.com/opengandalf/battlecast.git`
- Local checkout: `../battlecast`
- Recorded source commit from extraction notes: `3b5cfc78a009163373311b15b93db2f4907f0202`
- Imported into: `packages/engine/src/battlecast/`

## Copied Files

- `src/data/heroes.ts` -> `packages/engine/src/battlecast/data/heroes.ts`
- `src/data/maps.ts` -> `packages/engine/src/battlecast/data/maps.ts`
- `src/data/monsters.ts` -> `packages/engine/src/battlecast/data/monsters.ts`
- `src/data/presets.ts` -> `packages/engine/src/battlecast/data/presets.ts`
- `src/data/spells.ts` -> `packages/engine/src/battlecast/data/spells.ts`
- `src/engine/ai.ts` -> `packages/engine/src/battlecast/engine/ai.ts`
- `src/engine/ai-loop.ts` -> `packages/engine/src/battlecast/engine/ai-loop.ts`
- `src/engine/ai-movement.ts` -> `packages/engine/src/battlecast/engine/ai-movement.ts`
- `src/engine/ai-movement-evaluator.ts` -> `packages/engine/src/battlecast/engine/ai-movement-evaluator.ts`
- `src/engine/ai-spellcasting.ts` -> `packages/engine/src/battlecast/engine/ai-spellcasting.ts`
- `src/engine/ai-targeting.ts` -> `packages/engine/src/battlecast/engine/ai-targeting.ts`
- `src/engine/ai-turn.ts` -> `packages/engine/src/battlecast/engine/ai-turn.ts`
- `src/types/monster.ts` -> `packages/engine/src/battlecast/types/monster.ts`
- `src/types/animation.ts` -> `packages/engine/src/battlecast/types/animation.ts`
- `src/types/terrain.ts` -> `packages/engine/src/battlecast/types/terrain.ts`
- `src/engine/dice.ts` -> `packages/engine/src/battlecast/engine/dice.ts`
- `src/engine/combat-geometry.ts` -> `packages/engine/src/battlecast/engine/combat-geometry.ts`
- `src/engine/combat.ts` -> `packages/engine/src/battlecast/engine/combat.ts`
- `src/engine/combat-buffs.ts` -> `packages/engine/src/battlecast/engine/combat-buffs.ts`
- `src/engine/combat-spellcasting.ts` -> `packages/engine/src/battlecast/engine/combat-spellcasting.ts`
- `src/engine/combat-aoe.ts` -> `packages/engine/src/battlecast/engine/combat-aoe.ts`

## D20bench Adaptations

- `packages/engine/src/battlecast/engine/dice.ts` keeps Battlecast's public dice API but can now use a D20bench seeded RNG via `setBattlecastRng`, `seedBattlecastRng`, or `withBattlecastRng`.
- Remaining randomness in copied Battlecast files now flows through `battlecastRandom()` so D20bench seeded runs cover creature id suffixes, initiative tie-breaks, recharges, Monte Carlo placement, and random Beholder eye ray selection.
- Relative imports in copied Battlecast files use explicit `.js` specifiers so the compiled D20bench CLI can run under Node's ESM loader.
- `packages/engine/src/battlecast-runner.ts` is D20bench-original wrapper code, not copied Battlecast code. It runs seeded Battlecast-style battles while keeping the copied Battlecast `BattleState` as the returned rules state.
- The sibling Battlecast repository remains read-only. Future updates should copy or transform material into D20bench and update this provenance note.

## Next Extraction Targets

- Battlecast test fixtures that prove important SRD mechanics still behave the same after extraction.
- Battlecast placement utilities if D20bench scenario authoring needs them.
- Battlecast graphical assets only once the replay viewer needs them.
