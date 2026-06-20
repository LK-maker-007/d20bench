import { buildHero } from '../../battlecast/data/heroes.js';
import type { D20benchScenario } from '../../scenario.js';

const RULESET_ID = 'battlecast-srd-2026-06-20';
const DATA_PACK_ID = 'battlecast-srd-snapshot-3b5cfc7';

export const balancedHeroMirrorScenario: D20benchScenario = {
  id: 'public.hero-mirror-balanced-l5.v1',
  name: 'Level 5 Hero Mirror: Balanced Party',
  description: 'A mirrored 4v4 level-5 party fight with frontline, healing, ranged damage, burst AoE, and precision damage.',
  visibility: 'public',
  rulesetId: RULESET_ID,
  dataPackId: DATA_PACK_ID,
  scenarioVersion: '1.0.0',
  gridSize: 20,
  mapId: 'grass-plain',
  tacticalTags: [
    '4v4',
    'mirror',
    'hero-party',
    'frontline',
    'healing',
    'aoe',
    'single-target-burst',
  ],
  designNotes: [
    'Fighter and Rogue create credible weapon pressure so pure spellcasting is not automatically correct.',
    'Cleric offers Bless, Healing Word, Hold Person, Spirit Guardians, and emergency healing tradeoffs.',
    'Wizard has Web, Fireball, Lightning Bolt, and Scorching Ray, creating real AoE and status decisions.',
    'Open terrain makes target priority and spacing matter without hiding the basic tactical signal.',
  ],
  combatants: [
    { monster: buildHero('Fighter', 5), team: 'red', position: { x: 4, y: 8 } },
    { monster: buildHero('Cleric', 5), team: 'red', position: { x: 4, y: 10 } },
    { monster: buildHero('Wizard', 5), team: 'red', position: { x: 3, y: 9 } },
    { monster: buildHero('Rogue', 5), team: 'red', position: { x: 3, y: 11 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 15, y: 8 } },
    { monster: buildHero('Cleric', 5), team: 'blue', position: { x: 15, y: 10 } },
    { monster: buildHero('Wizard', 5), team: 'blue', position: { x: 16, y: 9 } },
    { monster: buildHero('Rogue', 5), team: 'blue', position: { x: 16, y: 11 } },
  ],
};

export const chokeControlHeroMirrorScenario: D20benchScenario = {
  id: 'public.hero-mirror-chokepoint-l5.v1',
  name: 'Level 5 Hero Mirror: Chokepoint Control',
  description: 'A mirrored 4v4 level-5 fight on Stone Bridge where forced movement, terrain control, and line effects are unusually valuable.',
  visibility: 'public',
  rulesetId: RULESET_ID,
  dataPackId: DATA_PACK_ID,
  scenarioVersion: '1.0.0',
  gridSize: 20,
  mapId: 'stone-bridge',
  tacticalTags: [
    '4v4',
    'mirror',
    'hero-party',
    'terrain-control',
    'chokepoint',
    'aoe',
    'status',
  ],
  designNotes: [
    'Paladin can anchor the line with high AC, Bless, Shield of Faith, Aid, and Lay on Hands.',
    'Druid pressures the bridge with Entangle, Moonbeam, Call Lightning, Thunderwave, and healing.',
    'Sorcerer provides Fireball, Lightning Bolt, Shatter, Command, Scorching Ray, and Innate Sorcery.',
    'Ranger adds long-range sustained damage plus Hunter’s Mark and Entangle, punishing poor positioning.',
  ],
  combatants: [
    { monster: buildHero('Paladin', 5), team: 'red', position: { x: 3, y: 8 } },
    { monster: buildHero('Druid', 5), team: 'red', position: { x: 3, y: 11 } },
    { monster: buildHero('Sorcerer', 5), team: 'red', position: { x: 2, y: 9 } },
    { monster: buildHero('Ranger', 5), team: 'red', position: { x: 2, y: 12 } },
    { monster: buildHero('Paladin', 5), team: 'blue', position: { x: 16, y: 8 } },
    { monster: buildHero('Druid', 5), team: 'blue', position: { x: 16, y: 11 } },
    { monster: buildHero('Sorcerer', 5), team: 'blue', position: { x: 17, y: 9 } },
    { monster: buildHero('Ranger', 5), team: 'blue', position: { x: 17, y: 12 } },
  ],
};

export const statusPressureHeroMirrorScenario: D20benchScenario = {
  id: 'public.hero-mirror-status-l5.v1',
  name: 'Level 5 Hero Mirror: Status Pressure',
  description: 'A mirrored 4v4 level-5 fight emphasizing disabling effects, save pressure, buffs, healing, and ranged punishment.',
  visibility: 'public',
  rulesetId: RULESET_ID,
  dataPackId: DATA_PACK_ID,
  scenarioVersion: '1.0.0',
  gridSize: 16,
  mapId: 'forest-clearing',
  tacticalTags: [
    '4v4',
    'mirror',
    'hero-party',
    'status',
    'buffs',
    'healing',
    'aoe',
    'line-of-sight',
  ],
  designNotes: [
    'Bard brings Bane, Hold Person, Hypnotic Pattern, Dissonant Whispers, Healing Word, and Bardic Inspiration.',
    'Warlock brings Hex, Hold Person, Hypnotic Pattern, Fireball, Command, and high-pressure Eldritch Blast.',
    'Cleric can answer with Bless, Healing Word, Spirit Guardians, Hold Person, Guiding Bolt, and Preserve Life.',
    'Fighter keeps the status casters honest with durable melee pressure and ranged fallback.',
  ],
  combatants: [
    { monster: buildHero('Fighter', 5), team: 'red', position: { x: 3, y: 6 } },
    { monster: buildHero('Cleric', 5), team: 'red', position: { x: 3, y: 9 } },
    { monster: buildHero('Bard', 5), team: 'red', position: { x: 2, y: 7 } },
    { monster: buildHero('Warlock', 5), team: 'red', position: { x: 2, y: 10 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 12, y: 6 } },
    { monster: buildHero('Cleric', 5), team: 'blue', position: { x: 12, y: 9 } },
    { monster: buildHero('Bard', 5), team: 'blue', position: { x: 13, y: 7 } },
    { monster: buildHero('Warlock', 5), team: 'blue', position: { x: 13, y: 10 } },
  ],
};

export const heroPartyMirrorScenarios = [
  balancedHeroMirrorScenario,
  chokeControlHeroMirrorScenario,
  statusPressureHeroMirrorScenario,
];
