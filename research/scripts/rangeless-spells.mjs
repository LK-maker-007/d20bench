const dist = new URL('../../packages/engine/dist/', import.meta.url);
const { buildHero } = await import(new URL('battlecast/data/heroes.js', dist));

const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
// The menu aims a sphere at a point only when the spell has a range, and lets a rangeless spell reach 5 ft.
for (const heroClass of classes) {
  for (const action of buildHero(heroClass, 5).actions) {
    if (action.range || action.type === 'melee' || action.targetScope === 'self') continue;
    const area = action.savingThrow?.area?.toLowerCase();
    const sphere = area && !area.includes('emanation') && (area.includes('sphere') || area.includes('radius') || area.includes('cylinder'));
    const singleTargetSpell = !area && action.targetScope === 'one_enemy' && action.spellLevel !== undefined;
    if (sphere) console.log(`${heroClass}\t${action.name}\t${action.savingThrow.area}\tmenu: centred on the caster`);
    else if (singleTargetSpell) console.log(`${heroClass}\t${action.name}\tsingle target\tmenu: 5 ft reach`);
  }
}
