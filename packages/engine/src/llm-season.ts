import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { runAgentMatchAsync, type AgentMatchResult, type LlmActionSpace } from './agent-match.js';
import {
  createOpenRouterAgentId,
  listBattlecastTacticAgentIds,
  type AgentId,
  type OpenRouterAgentId,
} from './agents.js';
import type { LegalAction } from './legal-actions.js';
import { loadLocalEnv } from './env.js';
import type { EloStanding } from './ratings.js';
import type { BattleType, D20benchScenario } from './scenario.js';
import type { OpenRouterRawDecisionTrace } from './openrouter-agent.js';
import type { ReplayEventController } from './replay.js';
import { buildHero } from './battlecast/data/heroes.js';
import { getMonsterByName } from './battlecast/data/monsters.js';
import { goblinDuelScenario } from './scenarios/public/goblin-duel.js';
import { goblinWarbandMirrorScenario } from './scenarios/public/goblin-squad.js';
import {
  balancedHeroMirrorScenario,
  chokeControlHeroMirrorScenario,
  statusPressureHeroMirrorScenario,
} from './scenarios/public/hero-party-mirrors.js';

export interface LlmSeasonConfig {
  id: string;
  description: string;
  agents: AgentId[];
  scenarios: D20benchScenario[];
  seeds: Array<string | number>;
  maxRounds: number;
  pairings?: LlmSeasonPairing[];
  llmActionSpace?: LlmActionSpace;
  initialRating?: number;
  kFactor?: number;
  concurrency?: number;
}

export interface LlmSeasonPairing {
  redAgent: AgentId;
  blueAgent: AgentId;
}

export interface LlmSeasonRunOptions {
  generatedAt?: string;
  outDir?: string;
  concurrency?: number;
  matchLimit?: number;
  maxCostUsd?: number;
  resume?: boolean;
  logProgress?: boolean;
  onProgress?: (progress: LlmSeasonProgress) => void | Promise<void>;
}

export interface OpenRouterModelPricing {
  model: string;
  prompt?: number;
  completion?: number;
}

export interface LlmModelCostSummary {
  agentId: AgentId;
  model: string;
  decisions: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface LlmSeasonCostSummary {
  totalDecisions: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  byModel: LlmModelCostSummary[];
}

export interface LlmAcceptedActionCount {
  actionKey: string;
  count: number;
}

export interface LlmSeasonHarnessAudit {
  modelTurnStarts: number;
  modelActionResolutions: number;
  modelDelegateLegalActionExposures: number;
  modelDelegateSelections: number;
  modelStepwiseTurns: number;
  modelStepwiseContinuations: number;
  maxModelActionsInTurn: number;
  modelToolCallDecisions: number;
  modelJsonFallbackDecisions: number;
  modelRepairAttempts: number;
  acceptedActionCounts: LlmAcceptedActionCount[];
}

export type LlmSeasonProgressStatus = 'running' | 'complete' | 'failed' | 'stopped';
export type LlmSeasonMatchProgressStatus = 'running' | 'completed' | 'failed';

export interface LlmSeasonMatchProgress {
  index: number;
  status: LlmSeasonMatchProgressStatus;
  scenarioId: string;
  battleType: BattleType;
  seed: string | number;
  redAgent: AgentId;
  blueAgent: AgentId;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  matchId?: string;
  winner?: AgentMatchResult['winner'];
  llmDecisions?: number;
  estimatedCostUsd?: number;
  finalStateHash?: string;
  error?: string;
}

export interface LlmSeasonFailure {
  index: number;
  scenarioId: string;
  battleType: BattleType;
  seed: string | number;
  redAgent: AgentId;
  blueAgent: AgentId;
  error: string;
}

export interface LlmSeasonProgress {
  seasonId: string;
  description: string;
  status: LlmSeasonProgressStatus;
  llmActionSpace?: LlmActionSpace;
  startedAt: string;
  updatedAt: string;
  concurrency: number;
  maxRounds: number;
  totalMatches: number;
  completedMatches: number;
  failedMatches: number;
  runningMatches: number;
  stopReason?: string;
  costSummary: LlmSeasonCostSummary;
  activeMatches: LlmSeasonMatchProgress[];
  recentMatches: LlmSeasonMatchProgress[];
  failures: LlmSeasonFailure[];
}

export interface LlmSeasonResult {
  seasonId: string;
  description: string;
  generatedAt: string;
  startedAt: string;
  completedAt: string;
  llmActionSpace?: LlmActionSpace;
  initialRating: number;
  kFactor: number;
  maxRounds: number;
  concurrency: number;
  totalMatches: number;
  completedMatches: number;
  failedMatches: number;
  stopReason?: string;
  standings: EloStanding[];
  battleTypeStandings: Array<{
    battleType: BattleType;
    standings: EloStanding[];
  }>;
  costSummary: LlmSeasonCostSummary;
  harnessAudit: LlmSeasonHarnessAudit;
  failures: LlmSeasonFailure[];
  matches: Array<{
    matchId: string;
    scenarioId: string;
    battleType: BattleType;
    seed: string | number;
    redAgent: AgentId;
    blueAgent: AgentId;
    winner: AgentMatchResult['winner'];
    redScore: number;
    blueScore: number;
    redRatingBefore: number;
    blueRatingBefore: number;
    redRatingAfter: number;
    blueRatingAfter: number;
    redBattleTypeRatingBefore: number;
    blueBattleTypeRatingBefore: number;
    redBattleTypeRatingAfter: number;
    blueBattleTypeRatingAfter: number;
    finalStateHash: string;
    llmDecisions: number;
    estimatedCostUsd: number;
  }>;
}

export const llmSmokeModelAgents: OpenRouterAgentId[] = [
  createOpenRouterAgentId('moonshotai/kimi-k2.7-code'),
  createOpenRouterAgentId('z-ai/glm-5.2'),
  createOpenRouterAgentId('deepseek/deepseek-v4-pro'),
  createOpenRouterAgentId('deepseek/deepseek-v4-flash'),
  createOpenRouterAgentId('qwen/qwen3.5-flash-02-23'),
  createOpenRouterAgentId('mistralai/ministral-8b-2512'),
  createOpenRouterAgentId('meta-llama/llama-3.1-8b-instruct'),
];

export const llmFrontierModelAgents: OpenRouterAgentId[] = [
  createOpenRouterAgentId('anthropic/claude-opus-4.8'),
  createOpenRouterAgentId('google/gemini-3.1-pro-preview'),
  createOpenRouterAgentId('openai/gpt-5.5'),
  ...llmSmokeModelAgents,
];

export const llmBattlecastOpponentAgents: AgentId[] = [
  'baseline.random-legal',
  ...listBattlecastTacticAgentIds(),
];

export const llmSmartOpponentAgents: AgentId[] = [
  'battlecast.smart',
];

export const llmSmartTop3ModelAgents: OpenRouterAgentId[] = [
  createOpenRouterAgentId('mistralai/ministral-8b-2512'),
  createOpenRouterAgentId('meta-llama/llama-3.1-8b-instruct'),
  createOpenRouterAgentId('qwen/qwen3.5-flash-02-23'),
];

export const llmSmartGlmModelAgents: OpenRouterAgentId[] = [
  createOpenRouterAgentId('z-ai/glm-5.2'),
];

export const llmToolcallFrontierVerifyModelAgents: OpenRouterAgentId[] = [
  createOpenRouterAgentId('anthropic/claude-opus-4.8'),
  createOpenRouterAgentId('openai/gpt-5.5'),
];

export const llmToolcallVerifyModelAgents: OpenRouterAgentId[] = [
  ...llmSmartTop3ModelAgents,
];

export const llmActualCheapVerifyModelAgents: OpenRouterAgentId[] = [
  createOpenRouterAgentId('deepseek/deepseek-v4-flash'),
  ...llmSmartTop3ModelAgents,
];

export const llmActualReactionVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-reaction-kiting-duel.v1',
  name: 'LLM Reaction Kiting Duel',
  description: 'A Battlecast Kiting Ranger starts adjacent to an OpenRouter Fighter and should trigger an explicit opportunity-attack reaction choice.',
  battleType: 'reaction-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['reaction', 'opportunity-attack', 'kiting'],
  designNotes: [
    'Designed as a live-model harness validation, not a leaderboard battle.',
    'The Ranger is controlled by battlecast.kiting and backs away from the adjacent Fighter, giving the OpenRouter-controlled Fighter an opportunity-attack reaction window.',
  ],
  combatants: [
    { monster: buildHero('Ranger', 5), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
  ],
};

export const llmActualMitigationVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-mitigation-rogue-duel.v1',
  name: 'LLM Mitigation Rogue Duel',
  description: 'A Battlecast Aggressive Fighter attacks an OpenRouter Rogue that should choose whether to spend Uncanny Dodge.',
  battleType: 'mitigation-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['reaction', 'uncanny-dodge', 'damage-mitigation'],
  designNotes: [
    'Designed as a live-model harness validation for defensive reactions.',
    'The Fighter is intentionally high level so at least one attack should hit and trigger the Rogue mitigation window.',
  ],
  combatants: [
    { monster: buildHero('Fighter', 20), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Rogue', 5), team: 'blue', position: { x: 2, y: 3 } },
  ],
};

export const llmActualMonkDeflectVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-mitigation-monk-duel.v1',
  name: 'LLM Mitigation Monk Duel',
  description: 'A Battlecast Aggressive high-level Monk attacks an OpenRouter Monk that should choose whether to spend Deflect Attacks.',
  battleType: 'mitigation-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['reaction', 'monk-deflect', 'damage-mitigation'],
  designNotes: [
    'Designed as a live-model harness validation for Monk defensive reactions.',
    'The attacking Monk is intentionally high level and high-initiative so the Deflect window occurs before the OpenRouter-controlled Monk can reposition.',
  ],
  combatants: [
    { monster: buildHero('Monk', 20), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Monk', 5), team: 'blue', position: { x: 2, y: 3 } },
  ],
};

export const llmActualSuperiorHunterDefenseVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-mitigation-ranger-duel.v1',
  name: 'LLM Mitigation Ranger Duel',
  description: "A Battlecast Aggressive Fighter attacks an OpenRouter Ranger that should choose whether to spend Superior Hunter's Defense.",
  battleType: 'mitigation-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['reaction', 'superior-hunters-defense', 'damage-mitigation'],
  designNotes: [
    "Designed as a live-model harness validation for Ranger Hunter's defensive reaction.",
    'The Fighter is intentionally high level so at least one attack should hit and trigger Superior Hunter\'s Defense.',
  ],
  combatants: [
    { monster: buildHero('Fighter', 20), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Ranger', 15), team: 'blue', position: { x: 2, y: 3 } },
  ],
};

export const llmActualRetaliationVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-retaliation-barbarian-duel.v1',
  name: 'LLM Retaliation Barbarian Duel',
  description: 'A Battlecast Aggressive Fighter damages an adjacent OpenRouter Barbarian that should choose whether to spend Retaliation.',
  battleType: 'retaliation-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['reaction', 'retaliation', 'counterattack'],
  designNotes: [
    'Designed as a live-model harness validation for Barbarian Retaliation.',
    'The Fighter is intentionally high level so at least one adjacent hit should trigger the Retaliation window.',
  ],
  combatants: [
    { monster: buildHero('Fighter', 20), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Barbarian', 10), team: 'blue', position: { x: 2, y: 3 } },
  ],
};

function highArmorFighter(level: number, ac: number) {
  const fighter = buildHero('Fighter', level);
  return {
    ...fighter,
    name: `${fighter.name} AC${ac}`,
    ac,
  };
}

function immobileHero(heroClass: Parameters<typeof buildHero>[0], level: number) {
  const hero = buildHero(heroClass, level);
  return {
    ...hero,
    name: `${hero.name} Immobile`,
    speed: { ...hero.speed, walk: 0 },
  };
}

function fragileImmobileHero(heroClass: Parameters<typeof buildHero>[0], level: number, hp: number) {
  const hero = immobileHero(heroClass, level);
  return {
    ...hero,
    name: `${hero.name} HP${hp}`,
    hp,
    hpFormula: String(hp),
  };
}

function noActionSurgeFighter(level: number) {
  const fighter = buildHero('Fighter', level);
  const { ['action-surge']: _actionSurge, ...resources } = fighter.initialResources ?? {};
  return {
    ...fighter,
    name: `${fighter.name} No Surge`,
    initialResources: resources,
  };
}

function inertHero(heroClass: Parameters<typeof buildHero>[0], level: number, hp = 80) {
  const hero = buildHero(heroClass, level);
  return {
    ...hero,
    name: `${hero.name} Inert`,
    hp,
    hpFormula: String(hp),
    actions: [],
    speed: { ...hero.speed, walk: 0 },
    initialResources: {},
  };
}

function actionSubsetHero(heroClass: Parameters<typeof buildHero>[0], level: number, actionNames: string[]) {
  const hero = buildHero(heroClass, level);
  const allowed = new Set(actionNames);
  return {
    ...hero,
    name: `${hero.name} ${actionNames.join('-')}`,
    actions: hero.actions.filter((action) => allowed.has(action.name)),
  };
}

function purpleWormSwallowOnly() {
  const worm = getMonsterByName('Purple Worm');
  if (!worm) throw new Error('expected Purple Worm monster data');
  return {
    ...worm,
    name: 'Purple Worm Swallow Only',
    actions: worm.actions.filter((action) => action.name === 'Swallow'),
  };
}

export const llmActualLinkedDamageVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-linked-damage-witch-bolt.v1',
  name: 'LLM Linked Damage Witch Bolt',
  description: 'An OpenRouter-controlled Warlock starts with an existing Witch Bolt link and should choose the concrete later-turn bonus-action damage.',
  battleType: 'spell-followup-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 20,
  tacticalTags: ['spell-followup', 'witch-bolt', 'bonus-action'],
  designNotes: [
    'Designed as a live-model harness validation for maintained linked spell damage.',
    'The setup starts on round 2 with Witch Bolt already linked so the first model turn exposes linked_bonus_damage without asking the model to create the setup state.',
  ],
  combatants: [
    { monster: inertHero('Warlock', 5), team: 'red', position: { x: 2, y: 2 } },
    { monster: inertHero('Fighter', 1, 40), team: 'blue', position: { x: 8, y: 8 } },
  ],
  setupBattleState: (state) => {
    const warlock = state.creatures.find((creature) => creature.team === 'red');
    const target = state.creatures.find((creature) => creature.team === 'blue');
    if (!warlock || !target) throw new Error('linked damage setup expected Warlock and target');
    state.round = 2;
    state.initiativeOrder = [warlock.id, ...state.initiativeOrder.filter((id) => id !== warlock.id)];
    warlock.initiative = 30;
    warlock.concentratingOn = 'witch-bolt';
    target.activeBuffs.push({
      name: 'Witch Bolt',
      key: 'witch-bolt',
      casterId: warlock.id,
      appliedRound: 1,
      endRound: 11,
      requiresConcentration: true,
      bonusActionDamage: '1d12',
      bonusActionDamageType: 'lightning',
      bonusActionDamageRange: 60,
      endsWhenTargetDies: true,
    });
  },
};

export const llmActualHexRetargetVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-hex-retarget.v1',
  name: 'LLM Hex Retarget',
  description: 'An OpenRouter-controlled Warlock starts with Hex on a dead target and should move it to a living enemy as a concrete bonus action.',
  battleType: 'spell-followup-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 20,
  tacticalTags: ['spell-followup', 'hex', 'retarget', 'bonus-action'],
  designNotes: [
    'Designed as a live-model harness validation for Hex retargeting.',
    'The setup seeds a dead Hex target and removes Warlock spell slots so retargeting is the concrete follow-up rather than recasting Hex.',
  ],
  combatants: [
    { monster: { ...actionSubsetHero('Warlock', 5, ['Hex']), initialResources: {} }, team: 'red', position: { x: 2, y: 2 } },
    { monster: inertHero('Fighter', 1, 1), team: 'blue', position: { x: 8, y: 8 } },
    { monster: inertHero('Fighter', 1, 40), team: 'blue', position: { x: 9, y: 8 } },
  ],
  setupBattleState: (state) => {
    const warlock = state.creatures.find((creature) => creature.team === 'red');
    const oldTarget = state.creatures.find((creature) => creature.team === 'blue' && creature.position.x === 8);
    const newTarget = state.creatures.find((creature) => creature.team === 'blue' && creature.position.x === 9);
    if (!warlock || !oldTarget || !newTarget) throw new Error('Hex retarget setup expected Warlock and targets');
    state.initiativeOrder = [warlock.id, ...state.initiativeOrder.filter((id) => id !== warlock.id)];
    warlock.initiative = 30;
    warlock.concentratingOn = 'hex';
    oldTarget.isAlive = false;
    oldTarget.currentHp = 0;
    oldTarget.activeBuffs.push({
      name: 'Hex',
      key: 'hex',
      casterId: warlock.id,
      appliedRound: 1,
      endRound: 30,
      requiresConcentration: true,
      damageRider: '1d6 necrotic',
    });
  },
};

export const llmActualSwallowVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-swallow-purple-worm.v1',
  name: 'LLM Swallow Purple Worm',
  description: 'An OpenRouter-controlled Purple Worm starts with a grappled target and should choose concrete Swallow.',
  battleType: 'special-action-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-monsters',
  scenarioVersion: '1.0.0',
  gridSize: 20,
  tacticalTags: ['special-action', 'swallow', 'grapple'],
  designNotes: [
    'Designed as a live-model harness validation for grapple-gated monster special actions.',
    'The setup starts with one target grappled by the worm and removes other worm attacks so Swallow is the concrete non-delegate action under test.',
  ],
  combatants: [
    { monster: purpleWormSwallowOnly(), team: 'red', position: { x: 3, y: 3 } },
    { monster: inertHero('Fighter', 5, 80), team: 'blue', position: { x: 4, y: 3 } },
    { monster: inertHero('Fighter', 5, 80), team: 'blue', position: { x: 7, y: 3 } },
  ],
  setupBattleState: (state) => {
    const worm = state.creatures.find((creature) => creature.team === 'red');
    const grappled = state.creatures.find((creature) => creature.team === 'blue' && creature.position.x === 4);
    if (!worm || !grappled) throw new Error('Swallow setup expected Purple Worm and grappled target');
    state.initiativeOrder = [worm.id, ...state.initiativeOrder.filter((id) => id !== worm.id)];
    worm.initiative = 30;
    grappled.conditions.push('grappled');
    grappled.conditionTimers.push({
      condition: 'grappled',
      duration: 'end_of_next_turn',
      appliedRound: state.round,
      sourceId: worm.id,
    });
  },
};

export const llmActualCuttingWordsAttackVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-cutting-words-attack-party.v1',
  name: 'LLM Cutting Words Attack Roll Party',
  description: 'A Battlecast Aggressive Fighter attacks a tuned-AC ally while an OpenRouter Bard should choose whether to spend Cutting Words on the attack roll.',
  battleType: 'cutting-words-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['reaction', 'cutting-words', 'attack-roll'],
  designNotes: [
    'Designed as a live-model harness validation for Bard Cutting Words attack-roll timing.',
    'The attacking Fighter and protected Fighter AC are tuned so seed 1 produces a non-critical hit inside the Bardic Inspiration die window.',
  ],
  combatants: [
    { monster: buildHero('Fighter', 10), team: 'red', position: { x: 2, y: 2 } },
    { monster: highArmorFighter(5, 22), team: 'blue', position: { x: 2, y: 3 } },
    { monster: buildHero('Bard', 5), team: 'blue', position: { x: 4, y: 3 } },
  ],
};

export const llmActualCuttingWordsDamageVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-cutting-words-damage-party.v1',
  name: 'LLM Cutting Words Damage Roll Party',
  description: 'A Battlecast Aggressive Fighter lands a strong hit while an OpenRouter Bard should choose whether to spend Cutting Words on the damage roll.',
  battleType: 'cutting-words-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['reaction', 'cutting-words', 'damage-roll'],
  designNotes: [
    'Designed as a live-model harness validation for Bard Cutting Words damage-roll timing.',
    'The attacking Fighter is intentionally high level so at least one attack should hit and expose the damage-roll trigger.',
  ],
  combatants: [
    { monster: buildHero('Fighter', 20), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
    { monster: buildHero('Bard', 5), team: 'blue', position: { x: 4, y: 3 } },
  ],
};

export const llmActualActionSurgeVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-action-surge-fighter-duel.v1',
  name: 'LLM Action Surge Fighter Duel',
  description: 'An OpenRouter-controlled Fighter should be able to spend Action Surge after its first attack action and then choose more concrete attacks.',
  battleType: 'action-surge-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['class-feature', 'action-surge', 'stepwise-action-economy'],
  designNotes: [
    'Designed as a live-model harness validation for concrete Fighter Action Surge choices.',
    'The Fighter starts adjacent to a durable target so extra attacks after Action Surge remain relevant.',
  ],
  combatants: [
    { monster: buildHero('Fighter', 5), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
  ],
};

export const llmActualRecklessVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-reckless-barbarian-duel.v1',
  name: 'LLM Reckless Barbarian Duel',
  description: 'An OpenRouter-controlled Barbarian should be able to declare Reckless Attack before choosing concrete melee attacks.',
  battleType: 'reckless-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['class-feature', 'reckless-attack', 'stepwise-action-economy'],
  designNotes: [
    'Designed as a live-model harness validation for concrete Barbarian Reckless Attack choices.',
    'The Barbarian starts adjacent to a melee target so the model can declare Reckless Attack, then inspect the fresh legal-action list and choose attacks.',
  ],
  combatants: [
    { monster: buildHero('Barbarian', 5), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
  ],
};

export const llmActualSacredWeaponVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-sacred-weapon-paladin-duel.v1',
  name: 'LLM Sacred Weapon Paladin Duel',
  description: 'An OpenRouter-controlled Paladin should be able to spend Channel Divinity on Sacred Weapon before choosing concrete melee attacks.',
  battleType: 'class-feature-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['class-feature', 'sacred-weapon', 'buff'],
  designNotes: [
    'Designed as a live-model harness validation for concrete Paladin Sacred Weapon choices.',
    'The Paladin starts adjacent to a melee target so the model can empower its weapon, then continue from a fresh legal-action list.',
  ],
  combatants: [
    { monster: buildHero('Paladin', 5), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
  ],
};

export const llmActualSuperiorDefenseVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-superior-defense-monk-duel.v1',
  name: 'LLM Superior Defense Monk Duel',
  description: 'An OpenRouter-controlled high-level Monk should be able to spend Focus Points on Superior Defense before choosing concrete attacks.',
  battleType: 'class-feature-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['class-feature', 'superior-defense', 'buff'],
  designNotes: [
    'Designed as a live-model harness validation for concrete Monk Superior Defense choices.',
    'Turn-start auto-spending is suppressed for actual-action LLM control, so the model must choose the concrete class-feature action itself.',
  ],
  combatants: [
    { monster: buildHero('Monk', 18), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 2, y: 3 } },
  ],
};

export const llmActualAbjureFoesVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-abjure-foes-paladin-party.v1',
  name: 'LLM Abjure Foes Paladin Party',
  description: 'An OpenRouter-controlled level-9 Paladin should be able to spend Channel Divinity on Abjure Foes and choose the exact enemy target group.',
  battleType: 'class-feature-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 12,
  tacticalTags: ['class-feature', 'abjure-foes', 'multi-target-save'],
  designNotes: [
    'Designed as a live-model harness validation for concrete non-geometric multi-target saving-throw choices.',
    'The Paladin starts with three enemies inside 60 ft, so the legal-action catalogue should expose spell:abjure-foes:targets:<ids> options instead of a Battlecast tactic delegate.',
  ],
  combatants: [
    { monster: buildHero('Paladin', 9), team: 'red', position: { x: 2, y: 2 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 5, y: 2 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 6, y: 3 } },
    { monster: buildHero('Fighter', 5), team: 'blue', position: { x: 7, y: 4 } },
  ],
};

export const llmActualStabiliseVerifyScenario: D20benchScenario = {
  id: 'hidden.llm-stabilise-ally-party.v1',
  name: 'LLM Stabilise Ally Party',
  description: 'A Battlecast Aggressive Fighter downs an OpenRouter ally, then an adjacent OpenRouter Cleric should choose the concrete Stabilise action.',
  battleType: 'support-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['support', 'stabilise', 'death-saves'],
  designNotes: [
    'Designed as a live-model harness validation for concrete adjacent-ally support actions.',
    'Seed 2 lets the Battlecast Fighter create a dying ally state before the Cleric turn, so the legal-action catalogue should expose stabilise:<ally-id> instead of any Battlecast tactic delegate.',
  ],
  combatants: [
    { monster: buildHero('Wizard', 5), team: 'red', position: { x: 2, y: 3 } },
    { monster: buildHero('Cleric', 5), team: 'red', position: { x: 3, y: 3 } },
    { monster: buildHero('Fighter', 20), team: 'blue', position: { x: 2, y: 2 } },
  ],
};

export const llmActualStabiliseVerifyV2Scenario: D20benchScenario = {
  id: 'hidden.llm-stabilise-ally-party-v2.v1',
  name: 'LLM Stabilise Ally Party V2',
  description: 'A Battlecast Aggressive Fighter downs an immobile OpenRouter ally, then an adjacent OpenRouter Cleric should choose the concrete Stabilise action.',
  battleType: 'support-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['support', 'stabilise', 'death-saves'],
  designNotes: [
    'Designed as a live-model harness validation for concrete adjacent-ally support actions.',
    'The would-be downed Wizard has zero movement and 12 HP so live models cannot move it out of adjacency before the Battlecast Fighter creates the dying-ally state.',
    'The Fighter has no Action Surge, so it can down the Wizard without also downing the Cleric before the support action is tested.',
    'Seed 1 lets the Battlecast Fighter create a dying ally state before the Cleric turn, so the legal-action catalogue should expose stabilise:<ally-id> instead of any Battlecast tactic delegate.',
  ],
  combatants: [
    { monster: fragileImmobileHero('Wizard', 5, 12), team: 'red', position: { x: 2, y: 3 } },
    { monster: buildHero('Cleric', 5), team: 'red', position: { x: 3, y: 3 } },
    { monster: noActionSurgeFighter(5), team: 'blue', position: { x: 2, y: 2 } },
  ],
};

export const llmActualStabiliseVerifyV3Scenario: D20benchScenario = {
  id: 'hidden.llm-stabilise-ally-fighter-party.v1',
  name: 'LLM Stabilise Ally Fighter Party',
  description: 'A Battlecast Aggressive Fighter downs an immobile OpenRouter Wizard, then an adjacent OpenRouter Fighter should choose the concrete Stabilise action.',
  battleType: 'support-smoke',
  visibility: 'hidden',
  rulesetId: 'battlecast-srd-2024',
  dataPackId: 'battlecast-heroes',
  scenarioVersion: '1.0.0',
  gridSize: 8,
  tacticalTags: ['support', 'stabilise', 'death-saves'],
  designNotes: [
    'Designed as a live-model harness validation for concrete adjacent-ally support actions without competing healing spells.',
    'The would-be downed Wizard has zero movement and 12 HP so live models cannot move it out of adjacency before the Battlecast Fighter creates the dying-ally state.',
    'The OpenRouter support actor is a Fighter, so Stabilise competes with ordinary attacks and defensive actions but not with Healing Word, Cure Wounds, or Preserve Life.',
    'Seed 2 exposes stabilise:<ally-id> to the red Fighter after the Wizard is downed.',
  ],
  combatants: [
    { monster: fragileImmobileHero('Wizard', 5, 12), team: 'red', position: { x: 2, y: 3 } },
    { monster: buildHero('Fighter', 5), team: 'red', position: { x: 3, y: 3 } },
    { monster: noActionSurgeFighter(5), team: 'blue', position: { x: 2, y: 2 } },
  ],
};

export const llmSmokeSeason: LlmSeasonConfig = {
  id: 'llm-smoke-v0',
  description: 'First bounded LLM smoke season on the public goblin duel, using latest Kimi, GLM 5.2, latest DeepSeek, and cheap smaller OpenRouter models.',
  agents: [
    ...llmSmokeModelAgents,
    'baseline.focus-fire',
  ],
  scenarios: [goblinDuelScenario],
  seeds: [1],
  maxRounds: 3,
  initialRating: 1000,
  kFactor: 32,
  concurrency: 3,
};

export const llmFrontierPublicSeason: LlmSeasonConfig = {
  id: 'llm-frontier-public-v1',
  description: 'Public LLM ladder across the 6v6 goblin control and three level-5 4v4 hero-party mirrors, matching each model against random and copied Battlecast tactic agents in both side assignments.',
  agents: [
    ...llmFrontierModelAgents,
    ...llmBattlecastOpponentAgents,
  ],
  scenarios: [
    goblinWarbandMirrorScenario,
    balancedHeroMirrorScenario,
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: [1],
  maxRounds: 3,
  pairings: createModelOpponentPairings(llmFrontierModelAgents, llmBattlecastOpponentAgents),
  initialRating: 1000,
  kFactor: 32,
  concurrency: 8,
};

export const llmFrontierFullTurnSeason: LlmSeasonConfig = {
  ...llmFrontierPublicSeason,
  id: 'llm-frontier-fullturn-v1',
  description: 'Public LLM ladder with Battlecast full-turn delegate actions exposed to LLMs, across the 6v6 goblin control and three level-5 4v4 hero-party mirrors.',
  llmActionSpace: 'battlecast-full-turn',
};

export const llmFrontierSmartSeason: LlmSeasonConfig = {
  id: 'llm-frontier-smart-v1',
  description: 'Public LLM ladder against only Battlecast Smart, using Battlecast full-turn delegate actions across the chokepoint and status-pressure level-5 4v4 hero-party mirrors, with two seeds for 8 matches per model.',
  agents: [
    ...llmFrontierModelAgents,
    ...llmSmartOpponentAgents,
  ],
  scenarios: [
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: [1, 2],
  maxRounds: 3,
  pairings: createModelOpponentPairings(llmFrontierModelAgents, llmSmartOpponentAgents),
  llmActionSpace: 'battlecast-full-turn',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 8,
};

export const llmFrontierSmartTop3TenXSeason: LlmSeasonConfig = {
  id: 'llm-frontier-smart-top3-10x-v1',
  description: 'Ten-times replication season for Ministral 8B, Llama 3.1 8B, and Qwen 3.5 Flash against Battlecast Smart on the chokepoint and status-pressure level-5 4v4 hero-party mirrors.',
  agents: [
    ...llmSmartTop3ModelAgents,
    ...llmSmartOpponentAgents,
  ],
  scenarios: [
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: Array.from({ length: 20 }, (_, index) => index + 1),
  maxRounds: 3,
  pairings: createModelOpponentPairings(llmSmartTop3ModelAgents, llmSmartOpponentAgents),
  llmActionSpace: 'battlecast-full-turn',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 16,
};

export const llmFrontierSmartGlmTenXSeason: LlmSeasonConfig = {
  id: 'llm-frontier-smart-glm-10x-v1',
  description: 'Ten-times replication season for GLM 5.2 against Battlecast Smart on the chokepoint and status-pressure level-5 4v4 hero-party mirrors.',
  agents: [
    ...llmSmartGlmModelAgents,
    ...llmSmartOpponentAgents,
  ],
  scenarios: [
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: Array.from({ length: 20 }, (_, index) => index + 1),
  maxRounds: 3,
  pairings: createModelOpponentPairings(llmSmartGlmModelAgents, llmSmartOpponentAgents),
  llmActionSpace: 'battlecast-full-turn',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 16,
};

export const llmToolcallCheapVerifySeason: LlmSeasonConfig = {
  id: 'llm-toolcall-cheap-verify-v3',
  description: 'Tool-call reliability verification season for the cheap model trio against Battlecast Smart on the chokepoint and status-pressure hero-party mirrors.',
  agents: [
    ...llmToolcallVerifyModelAgents,
    ...llmSmartOpponentAgents,
  ],
  scenarios: [
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: [1],
  maxRounds: 3,
  pairings: createModelOpponentPairings(llmToolcallVerifyModelAgents, llmSmartOpponentAgents),
  llmActionSpace: 'battlecast-full-turn',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 6,
};

export const llmToolcallGlmSmartTwentySeason: LlmSeasonConfig = {
  id: 'llm-toolcall-glm-smart-20-v2',
  description: 'Twenty-match post-toolcall-fix GLM 5.2 season against Battlecast Smart on the chokepoint and status-pressure hero-party mirrors.',
  agents: [
    ...llmSmartGlmModelAgents,
    ...llmSmartOpponentAgents,
  ],
  scenarios: [
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: Array.from({ length: 5 }, (_, index) => index + 1),
  maxRounds: 3,
  pairings: createModelOpponentPairings(llmSmartGlmModelAgents, llmSmartOpponentAgents),
  llmActionSpace: 'battlecast-full-turn',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 10,
};

export const llmToolcallFrontierSmartSixteenSeason: LlmSeasonConfig = {
  id: 'llm-toolcall-frontier-smart-16-v2',
  description: 'Post-toolcall-fix frontier verification season for GPT-5.5 and Claude Opus 4.8 against Battlecast Smart, with sixteen matches per model.',
  agents: [
    ...llmToolcallFrontierVerifyModelAgents,
    ...llmSmartOpponentAgents,
  ],
  scenarios: [
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: [1, 2, 3, 4],
  maxRounds: 3,
  pairings: createModelOpponentPairings(llmToolcallFrontierVerifyModelAgents, llmSmartOpponentAgents),
  llmActionSpace: 'battlecast-full-turn',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 8,
};

export const llmActualCheapVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-cheap-verify-v1',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart. LLMs choose concrete movement, attacks, spells, healing, buffs, AoE, and end-turn actions step by step; Battlecast tactic delegates are not exposed.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    ...llmSmartOpponentAgents,
  ],
  scenarios: [
    chokeControlHeroMirrorScenario,
    statusPressureHeroMirrorScenario,
  ],
  seeds: [1],
  maxRounds: 3,
  pairings: createModelOpponentPairings(llmActualCheapVerifyModelAgents, llmSmartOpponentAgents),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualCheapVerifyV2Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v2',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after accepting legal JSON content fallbacks from providers that ignore tool_calls while preserving raw traces.',
};

export const llmActualCheapVerifyV3Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v3',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after strict exact-action-id repair instructions and legal JSON content fallback.',
};

export const llmActualCheapVerifyV4Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v4',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after exposing Rogue Steady Aim as a concrete class-feature action.',
};

export const llmActualCheapVerifyV5Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v5',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after widening actual-actions-v1 with stepwise class features, directional AoE, and target-level random monster rays.',
};

export const llmActualCheapVerifyV6Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v6',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after stricter repair prompts list only the current exact legal action ids.',
};

export const llmActualCheapVerifyV7Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v7',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after exposing Dodge and Help as concrete actual actions.',
};

export const llmActualCheapVerifyV8Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v8',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after making Paladin Divine Smite an explicit post-hit action choice.',
};

export const llmActualCheapVerifyV9Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v9',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after exposing opportunity attacks as explicit reaction choices.',
};

export const llmActualCheapVerifyV10Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v10',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after making OpenRouter rationale optional, retrying embedded provider errors, and accepting provider pseudo-tool JSON content.',
};

export const llmActualCheapVerifyV11Season: LlmSeasonConfig = {
  ...llmActualCheapVerifySeason,
  id: 'llm-actual-cheap-verify-v11',
  description: 'Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after exposing non-geometric multi-target saving throws such as Paladin Abjure Foes.',
};

export const llmActualReactionVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-reaction-verify-v1',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control opportunity-attack reactions against a Battlecast Kiting mover.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.kiting',
  ],
  scenarios: [llmActualReactionVerifyScenario],
  seeds: [1],
  maxRounds: 1,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: 'battlecast.kiting' as const,
    blueAgent: model,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualMitigationVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-mitigation-verify-v3',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control trigger-time Uncanny Dodge mitigation against a Battlecast Aggressive attacker with isolated async Battlecast RNG.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [llmActualMitigationVerifyScenario],
  seeds: [1],
  maxRounds: 1,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: 'battlecast.aggressive' as const,
    blueAgent: model,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualDeflectVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-deflect-verify-v3',
  description: "Focused delegate-free actual-action validation where cheap OpenRouter models control trigger-time Monk Deflect and Superior Hunter's Defense reactions.",
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [
    llmActualMonkDeflectVerifyScenario,
    llmActualSuperiorHunterDefenseVerifyScenario,
  ],
  seeds: [1],
  maxRounds: 1,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: 'battlecast.aggressive' as const,
    blueAgent: model,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualRetaliationVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-retaliation-verify-v1',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control trigger-time Barbarian Retaliation reactions.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [llmActualRetaliationVerifyScenario],
  seeds: [1],
  maxRounds: 1,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: 'battlecast.aggressive' as const,
    blueAgent: model,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualCuttingWordsVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-cutting-words-verify-v1',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control trigger-time Bard Cutting Words attack-roll and damage-roll reactions.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [
    llmActualCuttingWordsAttackVerifyScenario,
    llmActualCuttingWordsDamageVerifyScenario,
  ],
  seeds: [1],
  maxRounds: 1,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: 'battlecast.aggressive' as const,
    blueAgent: model,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualActionSurgeVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-action-surge-verify-v1',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control Fighter Action Surge as a concrete stepwise class-feature action.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [llmActualActionSurgeVerifyScenario],
  seeds: [1],
  maxRounds: 1,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: model,
    blueAgent: 'battlecast.aggressive' as const,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualRecklessVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-reckless-verify-v1',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control Barbarian Reckless Attack as a concrete pre-attack class-feature action.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [llmActualRecklessVerifyScenario],
  seeds: [1],
  maxRounds: 1,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: model,
    blueAgent: 'battlecast.aggressive' as const,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualClassFeatureVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-class-feature-verify-v1',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control Paladin Sacred Weapon and Monk Superior Defense as concrete class-feature buff actions.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [
    llmActualSacredWeaponVerifyScenario,
    llmActualSuperiorDefenseVerifyScenario,
  ],
  seeds: [1],
  maxRounds: 1,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: model,
    blueAgent: 'battlecast.aggressive' as const,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualClassFeatureVerifyV2Season: LlmSeasonConfig = {
  ...llmActualClassFeatureVerifySeason,
  id: 'llm-actual-class-feature-verify-v2',
  description: 'Focused delegate-free actual-action validation for Paladin Sacred Weapon and Monk Superior Defense after marking setup class-feature actions explicitly in the LLM observation.',
};

export const llmActualAbjureFoesVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-abjure-foes-verify-v1',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control Paladin Abjure Foes as a concrete multi-target saving-throw action.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [llmActualAbjureFoesVerifyScenario],
  seeds: [1],
  maxRounds: 1,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: model,
    blueAgent: 'battlecast.aggressive' as const,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualStabiliseVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-stabilise-verify-v1',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control Stabilise as a concrete adjacent-ally support action.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [llmActualStabiliseVerifyScenario],
  seeds: [2],
  maxRounds: 2,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: model,
    blueAgent: 'battlecast.aggressive' as const,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmActualStabiliseVerifyV2Season: LlmSeasonConfig = {
  ...llmActualStabiliseVerifySeason,
  id: 'llm-actual-stabilise-verify-v2',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control Stabilise as a concrete adjacent-ally support action in a fixture that preserves adjacency.',
  scenarios: [llmActualStabiliseVerifyV2Scenario],
  seeds: [1],
};

export const llmActualStabiliseVerifyV3Season: LlmSeasonConfig = {
  ...llmActualStabiliseVerifySeason,
  id: 'llm-actual-stabilise-verify-v3',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control Stabilise as a concrete adjacent-ally support action without competing healing spells.',
  scenarios: [llmActualStabiliseVerifyV3Scenario],
  seeds: [2],
};

export const llmActualSpellFollowupVerifySeason: LlmSeasonConfig = {
  id: 'llm-actual-spell-followup-verify-v1',
  description: 'Focused delegate-free actual-action validation where cheap OpenRouter models control maintained Witch Bolt damage, Hex retargeting, and Swallow as concrete follow-up actions from seeded hidden states.',
  agents: [
    ...llmActualCheapVerifyModelAgents,
    'battlecast.aggressive',
  ],
  scenarios: [
    llmActualLinkedDamageVerifyScenario,
    llmActualHexRetargetVerifyScenario,
    llmActualSwallowVerifyScenario,
  ],
  seeds: [1],
  maxRounds: 2,
  pairings: llmActualCheapVerifyModelAgents.map((model) => ({
    redAgent: model,
    blueAgent: 'battlecast.aggressive' as const,
  })),
  llmActionSpace: 'actual-actions-v1',
  initialRating: 1000,
  kFactor: 32,
  concurrency: 4,
};

export const llmSeasons = [
  llmActualSpellFollowupVerifySeason,
  llmActualStabiliseVerifyV3Season,
  llmActualStabiliseVerifyV2Season,
  llmActualStabiliseVerifySeason,
  llmActualAbjureFoesVerifySeason,
  llmActualClassFeatureVerifyV2Season,
  llmActualClassFeatureVerifySeason,
  llmActualRecklessVerifySeason,
  llmActualActionSurgeVerifySeason,
  llmActualCuttingWordsVerifySeason,
  llmActualRetaliationVerifySeason,
  llmActualDeflectVerifySeason,
  llmActualMitigationVerifySeason,
  llmActualReactionVerifySeason,
  llmActualCheapVerifyV11Season,
  llmActualCheapVerifyV10Season,
  llmActualCheapVerifyV9Season,
  llmActualCheapVerifyV8Season,
  llmActualCheapVerifyV7Season,
  llmActualCheapVerifyV6Season,
  llmActualCheapVerifyV5Season,
  llmActualCheapVerifyV4Season,
  llmActualCheapVerifyV3Season,
  llmActualCheapVerifyV2Season,
  llmActualCheapVerifySeason,
  llmFrontierSmartSeason,
  llmFrontierSmartTop3TenXSeason,
  llmFrontierSmartGlmTenXSeason,
  llmToolcallCheapVerifySeason,
  llmToolcallGlmSmartTwentySeason,
  llmToolcallFrontierSmartSixteenSeason,
  llmFrontierFullTurnSeason,
  llmFrontierPublicSeason,
  llmSmokeSeason,
];

export function getLlmSeasonById(id: string): LlmSeasonConfig {
  const season = llmSeasons.find((candidate) => candidate.id === id);
  if (!season) {
    throw new Error(`unknown LLM season: ${id}. Available LLM seasons: ${llmSeasons.map((candidate) => candidate.id).join(', ')}`);
  }
  return season;
}

export async function runLlmSeason(
  config: LlmSeasonConfig,
  options: LlmSeasonRunOptions | string = {},
): Promise<LlmSeasonResult> {
  const runOptions: LlmSeasonRunOptions = typeof options === 'string' ? { generatedAt: options } : options;
  const generatedAt = runOptions.generatedAt ?? new Date().toISOString();
  const startedAt = new Date().toISOString();
  const initialRating = config.initialRating ?? 1000;
  const kFactor = config.kFactor ?? 32;
  const pricing = await loadOpenRouterPricing();
  const allFixtures = createLlmMatchFixtures(config);
  const fixtures = typeof runOptions.matchLimit === 'number'
    ? allFixtures.slice(0, runOptions.matchLimit)
    : allFixtures;
  const concurrency = normalizeConcurrency(runOptions.concurrency ?? config.concurrency, fixtures.length);
  const progressPath = runOptions.outDir ? join(runOptions.outDir, 'progress.json') : undefined;
  const checkpointPath = runOptions.outDir ? join(runOptions.outDir, 'completed-matches.jsonl') : undefined;
  const rawDecisionTracePath = runOptions.outDir ? join(runOptions.outDir, 'raw-decisions.jsonl') : undefined;
  const costAccumulators = new Map<string, LlmModelCostSummary>();
  const outcomes: Array<LlmMatchOutcome | undefined> = Array(fixtures.length).fill(undefined);
  const activeMatches = new Map<number, LlmSeasonMatchProgress>();
  const recentMatches: LlmSeasonMatchProgress[] = [];
  const failures: LlmSeasonFailure[] = [];
  let completedMatches = 0;
  let failedMatches = 0;
  let runningMatches = 0;
  let nextFixtureIndex = 0;
  let progressSequence = 0;
  let progressWriteChain = Promise.resolve();
  let checkpointWriteChain = Promise.resolve();
  let rawDecisionTraceWriteChain = Promise.resolve();
  let stopReason: string | undefined;

  if (checkpointPath) {
    await mkdir(dirname(checkpointPath), { recursive: true });
    if (runOptions.resume) {
      const restored = await loadCompletedMatchCheckpoints(checkpointPath, config.id, fixtures);
      for (const record of restored) {
        const fixture = fixtures[record.fixture.index];
        const matchCost = summarizeMatchCost(record.match, pricing, costAccumulators);
        outcomes[fixture.index] = {
          status: 'completed',
          fixture,
          match: record.match,
          matchCost,
        };
        completedMatches += 1;
        pushRecentMatch(recentMatches, record.progressMatch);
      }
    } else {
      await writeFile(checkpointPath, '', 'utf8');
      if (rawDecisionTracePath) {
        await writeFile(rawDecisionTracePath, '', 'utf8');
      }
    }
  }

  const appendRawDecisionTrace = async (trace: OpenRouterRawDecisionTrace): Promise<void> => {
    if (!rawDecisionTracePath) return;
    const write = rawDecisionTraceWriteChain.then(() =>
      appendFile(rawDecisionTracePath, `${JSON.stringify(trace)}\n`, 'utf8')
    );
    rawDecisionTraceWriteChain = write.catch(() => undefined);
    await write;
  };

  const emitProgress = async (status: LlmSeasonProgressStatus): Promise<void> => {
    const progress = buildProgress({
      config,
      status,
      startedAt,
      concurrency,
      totalMatches: fixtures.length,
      completedMatches,
      failedMatches,
      runningMatches,
      stopReason,
      costSummary: finalizeCostSummary(costAccumulators),
      activeMatches: [...activeMatches.values()],
      recentMatches,
      failures,
    });
    const sequence = progressSequence;
    progressSequence += 1;
    progressWriteChain = progressWriteChain.then(async () => {
      if (progressPath) {
        await writeJsonAtomic(progressPath, progress, sequence);
      }
      await runOptions.onProgress?.(progress);
    });
    await progressWriteChain;
  };

  await emitProgress('running');

  const runWorker = async (): Promise<void> => {
    while (true) {
      if (stopReason) return;
      if (runOptions.maxCostUsd !== undefined && finalizeCostSummary(costAccumulators).estimatedCostUsd >= runOptions.maxCostUsd) {
        stopReason = stopReason ?? `estimated cost reached $${runOptions.maxCostUsd.toFixed(2)}`;
        return;
      }
      const fixture = takeNextFixture(fixtures, outcomes, () => nextFixtureIndex, (value) => {
        nextFixtureIndex = value;
      });
      if (!fixture) return;

      const matchStartedAt = new Date();
      activeMatches.set(fixture.index, {
        index: fixture.index,
        status: 'running',
        scenarioId: fixture.scenario.id,
        battleType: fixture.scenario.battleType,
        seed: fixture.seed,
        redAgent: fixture.redAgent,
        blueAgent: fixture.blueAgent,
        startedAt: matchStartedAt.toISOString(),
      });
      runningMatches += 1;
      await emitProgress('running');

      try {
        const match = await runAgentMatchAsync({
          scenario: fixture.scenario,
          seed: fixture.seed,
          redAgent: fixture.redAgent,
          blueAgent: fixture.blueAgent,
          maxRounds: config.maxRounds,
          llmActionSpace: config.llmActionSpace,
          llmDecisionTraceSink: appendRawDecisionTrace,
        });
        const matchCost = summarizeMatchCost(match, pricing, costAccumulators);
        const completedAt = new Date();
        const progressMatch: LlmSeasonMatchProgress = {
          index: fixture.index,
          status: 'completed',
          scenarioId: fixture.scenario.id,
          battleType: fixture.scenario.battleType,
          seed: match.seed,
          redAgent: fixture.redAgent,
          blueAgent: fixture.blueAgent,
          startedAt: matchStartedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs: completedAt.getTime() - matchStartedAt.getTime(),
          matchId: match.matchId,
          winner: match.winner,
          llmDecisions: matchCost.decisions,
          estimatedCostUsd: matchCost.estimatedCostUsd,
          finalStateHash: match.finalStateHash,
        };
        outcomes[fixture.index] = {
          status: 'completed',
          fixture,
          match,
          matchCost,
        };
        await appendCompletedMatchCheckpoint({
          checkpointPath,
          writeChain: checkpointWriteChain,
          setWriteChain: (value) => {
            checkpointWriteChain = value;
          },
          record: {
            version: 1,
            seasonId: config.id,
            fixture: serializeFixture(fixture),
            match,
            matchCost,
            progressMatch,
          },
        });
        completedMatches += 1;
        pushRecentMatch(recentMatches, progressMatch);
        if (runOptions.logProgress) {
          console.log(formatMatchProgressLine(config.id, completedMatches, failedMatches, fixtures.length, progressMatch, finalizeCostSummary(costAccumulators)));
        }
      } catch (error) {
        const errorMessage = stringifyError(error);
        if (isFatalSeasonError(errorMessage)) {
          stopReason = stopReason ?? formatFatalSeasonStopReason(errorMessage);
        }
        const completedAt = new Date();
        const failure: LlmSeasonFailure = {
          index: fixture.index,
          scenarioId: fixture.scenario.id,
          battleType: fixture.scenario.battleType,
          seed: fixture.seed,
          redAgent: fixture.redAgent,
          blueAgent: fixture.blueAgent,
          error: errorMessage,
        };
        const progressMatch: LlmSeasonMatchProgress = {
          ...failure,
          status: 'failed',
          startedAt: matchStartedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs: completedAt.getTime() - matchStartedAt.getTime(),
        };
        outcomes[fixture.index] = {
          status: 'failed',
          fixture,
          failure,
        };
        failures.push(failure);
        failedMatches += 1;
        pushRecentMatch(recentMatches, progressMatch);
        if (runOptions.logProgress) {
          console.error(`[${config.id}] match ${completedMatches + failedMatches}/${fixtures.length} failed: ${fixture.redAgent} vs ${fixture.blueAgent}: ${failure.error}`);
        }
      } finally {
        activeMatches.delete(fixture.index);
        runningMatches -= 1;
        await emitProgress('running');
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => runWorker()));

  const overallPool = createRatingPool(config.agents, initialRating);
  const battleTypePools = new Map<BattleType, RatingPool>();
  const matches: LlmSeasonResult['matches'] = [];
  const completedAgentMatches: AgentMatchResult[] = [];

  for (const outcome of outcomes) {
    if (!outcome || outcome.status !== 'completed') continue;
    completedAgentMatches.push(outcome.match);
    const battleTypePool = getBattleTypePool(battleTypePools, outcome.fixture.scenario.battleType, config.agents, initialRating);
    const overallRatings = applyMatchRating({
      pool: overallPool,
      redAgent: outcome.fixture.redAgent,
      blueAgent: outcome.fixture.blueAgent,
      redScore: outcome.match.redScore,
      blueScore: outcome.match.blueScore,
      initialRating,
      kFactor,
    });
    const battleTypeRatings = applyMatchRating({
      pool: battleTypePool,
      redAgent: outcome.fixture.redAgent,
      blueAgent: outcome.fixture.blueAgent,
      redScore: outcome.match.redScore,
      blueScore: outcome.match.blueScore,
      initialRating,
      kFactor,
    });

    matches.push({
      matchId: outcome.match.matchId,
      scenarioId: outcome.match.scenarioId,
      battleType: outcome.fixture.scenario.battleType,
      seed: outcome.match.seed,
      redAgent: outcome.fixture.redAgent,
      blueAgent: outcome.fixture.blueAgent,
      winner: outcome.match.winner,
      redScore: outcome.match.redScore,
      blueScore: outcome.match.blueScore,
      redRatingBefore: overallRatings.redBefore,
      blueRatingBefore: overallRatings.blueBefore,
      redRatingAfter: overallRatings.redAfter,
      blueRatingAfter: overallRatings.blueAfter,
      redBattleTypeRatingBefore: battleTypeRatings.redBefore,
      blueBattleTypeRatingBefore: battleTypeRatings.blueBefore,
      redBattleTypeRatingAfter: battleTypeRatings.redAfter,
      blueBattleTypeRatingAfter: battleTypeRatings.blueAfter,
      finalStateHash: outcome.match.finalStateHash,
      llmDecisions: outcome.matchCost.decisions,
      estimatedCostUsd: outcome.matchCost.estimatedCostUsd,
    });
  }

  const result: LlmSeasonResult = {
    seasonId: config.id,
    description: config.description,
    generatedAt,
    startedAt,
    completedAt: new Date().toISOString(),
    llmActionSpace: config.llmActionSpace,
    initialRating,
    kFactor,
    maxRounds: config.maxRounds,
    concurrency,
    totalMatches: fixtures.length,
    completedMatches,
    failedMatches,
    stopReason,
    standings: finalizeStandings(overallPool),
    battleTypeStandings: [...battleTypePools.entries()].map(([battleType, pool]) => ({
      battleType,
      standings: finalizeStandings(pool),
    })),
    costSummary: finalizeCostSummary(costAccumulators),
    harnessAudit: summarizeLlmHarnessAudit(completedAgentMatches),
    failures,
    matches,
  };

  await emitProgress(stopReason ? 'stopped' : 'complete');
  return result;
}

export function renderLlmSeasonMarkdown(result: LlmSeasonResult): string {
  const lines = [
    `# ${result.seasonId} LLM Elo Smoke Season`,
    '',
    result.description,
    '',
    `Generated: ${result.generatedAt}`,
    `Completed: ${result.completedAt}`,
    ...(result.llmActionSpace ? [`LLM action space: ${result.llmActionSpace}`] : []),
    `Concurrency: ${result.concurrency}`,
    `Max rounds: ${result.maxRounds}`,
    `Initial rating: ${result.initialRating}`,
    `K-factor: ${result.kFactor}`,
    `Matches: ${result.completedMatches}/${result.totalMatches} completed${result.failedMatches ? `, ${result.failedMatches} failed` : ''}`,
    ...(result.stopReason ? [`Stopped: ${result.stopReason}`] : []),
    '',
    '## Standings',
    '',
    '| Rank | Agent | Elo | Matches | W-L-D | Score |',
    '| ---: | --- | ---: | ---: | ---: | ---: |',
    ...result.standings.map((standing, index) =>
      `| ${index + 1} | ${standing.agentId} | ${standing.rating.toFixed(1)} | ${standing.matches} | ${standing.wins}-${standing.losses}-${standing.draws} | ${standing.score.toFixed(1)} |`
    ),
    '',
    '## Cost Summary',
    '',
    `Estimated total cost: $${result.costSummary.estimatedCostUsd.toFixed(6)}`,
    `LLM decisions: ${result.costSummary.totalDecisions}`,
    `Tokens: ${result.costSummary.totalTokens} total (${result.costSummary.promptTokens} prompt, ${result.costSummary.completionTokens} completion)`,
    '',
    '| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...result.costSummary.byModel.map((entry) =>
      `| ${entry.agentId} | ${entry.decisions} | ${entry.promptTokens} | ${entry.completionTokens} | ${entry.totalTokens} | $${entry.estimatedCostUsd.toFixed(6)} |`
    ),
    '',
    '## Harness Audit',
    '',
    `Model turn starts: ${result.harnessAudit.modelTurnStarts}`,
    `Model action resolutions: ${result.harnessAudit.modelActionResolutions}`,
    `Model delegate legal-action exposures: ${result.harnessAudit.modelDelegateLegalActionExposures}`,
    `Model delegate selections: ${result.harnessAudit.modelDelegateSelections}`,
    `Stepwise model turns: ${result.harnessAudit.modelStepwiseTurns} (${result.harnessAudit.modelStepwiseContinuations} post-action continuations, max ${result.harnessAudit.maxModelActionsInTurn} actions in one turn)`,
    `Tool-call decisions: ${result.harnessAudit.modelToolCallDecisions} (${result.harnessAudit.modelJsonFallbackDecisions} JSON fallbacks, ${result.harnessAudit.modelRepairAttempts} repair attempts)`,
    '',
    '| Accepted Action Key | Count |',
    '| --- | ---: |',
    ...result.harnessAudit.acceptedActionCounts.slice(0, 20).map((entry) =>
      `| ${entry.actionKey} | ${entry.count} |`
    ),
    '',
    ...(result.failures.length ? [
      '## Failed Matches',
      '',
      '| Index | Scenario | Seed | Red | Blue | Error |',
      '| ---: | --- | --- | --- | --- | --- |',
      ...result.failures.map((failure) =>
        `| ${failure.index} | ${failure.scenarioId} | ${failure.seed} | ${failure.redAgent} | ${failure.blueAgent} | ${failure.error.replace(/\|/g, '\\|')} |`
      ),
      '',
    ] : []),
    '## Matches',
    '',
    '| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |',
    '| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |',
    ...result.matches.map((match) =>
      `| ${match.matchId} | ${match.scenarioId} | ${match.seed} | ${match.redAgent} | ${match.blueAgent} | ${match.winner ?? 'null'} | ${match.llmDecisions} | $${match.estimatedCostUsd.toFixed(6)} | \`${match.finalStateHash.slice(0, 12)}\` |`
    ),
    '',
  ];

  return `${lines.join('\n')}\n`;
}

interface LlmMatchFixture {
  index: number;
  scenario: D20benchScenario;
  seed: string | number;
  redAgent: AgentId;
  blueAgent: AgentId;
}

type LlmMatchOutcome =
  | {
      status: 'completed';
      fixture: LlmMatchFixture;
      match: AgentMatchResult;
      matchCost: { decisions: number; estimatedCostUsd: number };
    }
  | {
      status: 'failed';
      fixture: LlmMatchFixture;
      failure: LlmSeasonFailure;
    };

interface LlmCompletedMatchCheckpoint {
  version: 1;
  seasonId: string;
  fixture: SerializedLlmMatchFixture;
  match: AgentMatchResult;
  matchCost: { decisions: number; estimatedCostUsd: number };
  progressMatch: LlmSeasonMatchProgress;
}

interface SerializedLlmMatchFixture {
  index: number;
  scenarioId: string;
  seed: string | number;
  redAgent: AgentId;
  blueAgent: AgentId;
}

interface RatingPool {
  ratings: Map<AgentId, number>;
  standings: Map<AgentId, EloStanding>;
}

interface MatchRatingInput {
  pool: RatingPool;
  redAgent: AgentId;
  blueAgent: AgentId;
  redScore: number;
  blueScore: number;
  initialRating: number;
  kFactor: number;
}

interface MatchRatingResult {
  redBefore: number;
  blueBefore: number;
  redAfter: number;
  blueAfter: number;
}

function createLlmMatchFixtures(config: LlmSeasonConfig): LlmMatchFixture[] {
  const fixtures: LlmMatchFixture[] = [];
  const pairings = config.pairings ?? createRoundRobinPairings(config.agents);
  for (const scenario of config.scenarios) {
    for (const seed of config.seeds) {
      for (const pairing of pairings) {
        fixtures.push({
          index: fixtures.length,
          scenario,
          seed,
          redAgent: pairing.redAgent,
          blueAgent: pairing.blueAgent,
        });
      }
    }
  }
  return fixtures;
}

function createRoundRobinPairings(agents: AgentId[]): LlmSeasonPairing[] {
  const pairings: LlmSeasonPairing[] = [];
  for (const redAgent of agents) {
    for (const blueAgent of agents) {
      if (redAgent === blueAgent) continue;
      pairings.push({ redAgent, blueAgent });
    }
  }
  return pairings;
}

function createModelOpponentPairings(
  models: AgentId[],
  opponents: AgentId[],
): LlmSeasonPairing[] {
  return opponents.flatMap((opponent) =>
    models.flatMap((model) => [
      { redAgent: model, blueAgent: opponent },
      { redAgent: opponent, blueAgent: model },
    ])
  );
}

function takeNextFixture(
  fixtures: LlmMatchFixture[],
  outcomes: Array<LlmMatchOutcome | undefined>,
  getNextIndex: () => number,
  setNextIndex: (value: number) => void,
): LlmMatchFixture | undefined {
  while (true) {
    const index = getNextIndex();
    const fixture = fixtures[index];
    setNextIndex(index + 1);
    if (!fixture) return undefined;
    if (!outcomes[fixture.index]) return fixture;
  }
}

function serializeFixture(fixture: LlmMatchFixture): SerializedLlmMatchFixture {
  return {
    index: fixture.index,
    scenarioId: fixture.scenario.id,
    seed: fixture.seed,
    redAgent: fixture.redAgent,
    blueAgent: fixture.blueAgent,
  };
}

async function appendCompletedMatchCheckpoint(input: {
  checkpointPath: string | undefined;
  writeChain: Promise<void>;
  setWriteChain: (value: Promise<void>) => void;
  record: LlmCompletedMatchCheckpoint;
}): Promise<void> {
  if (!input.checkpointPath) return;

  const write = input.writeChain.then(() =>
    appendFile(input.checkpointPath!, `${JSON.stringify(input.record)}\n`, 'utf8')
  );
  input.setWriteChain(write.catch(() => undefined));
  await write;
}

async function loadCompletedMatchCheckpoints(
  path: string,
  seasonId: string,
  fixtures: LlmMatchFixture[],
): Promise<LlmCompletedMatchCheckpoint[]> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw error;
  }

  const byIndex = new Map<number, LlmCompletedMatchCheckpoint>();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    const record = normalizeCompletedMatchCheckpoint(parsed, seasonId, fixtures);
    if (record) byIndex.set(record.fixture.index, record);
  }

  return [...byIndex.values()].sort((left, right) => left.fixture.index - right.fixture.index);
}

function normalizeCompletedMatchCheckpoint(
  value: unknown,
  seasonId: string,
  fixtures: LlmMatchFixture[],
): LlmCompletedMatchCheckpoint | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Partial<LlmCompletedMatchCheckpoint>;
  if (record.version !== 1 || record.seasonId !== seasonId) return undefined;
  if (!record.fixture || typeof record.fixture.index !== 'number') return undefined;
  const fixture = fixtures[record.fixture.index];
  if (!fixture || !serializedFixtureMatches(record.fixture, fixture)) return undefined;
  if (!record.match || !record.matchCost || !record.progressMatch) return undefined;
  return {
    version: 1,
    seasonId,
    fixture: record.fixture,
    match: record.match,
    matchCost: record.matchCost,
    progressMatch: record.progressMatch,
  };
}

function serializedFixtureMatches(serialized: SerializedLlmMatchFixture, fixture: LlmMatchFixture): boolean {
  return serialized.index === fixture.index
    && serialized.scenarioId === fixture.scenario.id
    && String(serialized.seed) === String(fixture.seed)
    && serialized.redAgent === fixture.redAgent
    && serialized.blueAgent === fixture.blueAgent;
}

function isMissingFileError(error: unknown): boolean {
  return !!error
    && typeof error === 'object'
    && 'code' in error
    && (error as { code?: unknown }).code === 'ENOENT';
}

function buildProgress(input: {
  config: LlmSeasonConfig;
  status: LlmSeasonProgressStatus;
  startedAt: string;
  concurrency: number;
  totalMatches: number;
  completedMatches: number;
  failedMatches: number;
  runningMatches: number;
  stopReason: string | undefined;
  costSummary: LlmSeasonCostSummary;
  activeMatches: LlmSeasonMatchProgress[];
  recentMatches: LlmSeasonMatchProgress[];
  failures: LlmSeasonFailure[];
}): LlmSeasonProgress {
  return {
    seasonId: input.config.id,
    description: input.config.description,
    status: input.status,
    llmActionSpace: input.config.llmActionSpace,
    startedAt: input.startedAt,
    updatedAt: new Date().toISOString(),
    concurrency: input.concurrency,
    maxRounds: input.config.maxRounds,
    totalMatches: input.totalMatches,
    completedMatches: input.completedMatches,
    failedMatches: input.failedMatches,
    runningMatches: input.runningMatches,
    stopReason: input.stopReason,
    costSummary: input.costSummary,
    activeMatches: [...input.activeMatches].sort((left, right) => left.index - right.index),
    recentMatches: [...input.recentMatches].slice(-20).reverse(),
    failures: [...input.failures],
  };
}

async function loadOpenRouterPricing(): Promise<Map<string, OpenRouterModelPricing>> {
  loadLocalEnv();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing. Put it in .env.local.');
  }

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    throw new Error(`OpenRouter model pricing request failed (${res.status})`);
  }
  const body = await res.json() as { data?: Array<{ id: string; pricing?: Record<string, string> }> };
  return new Map((body.data ?? []).map((model) => [
    model.id,
    {
      model: model.id,
      prompt: numberOrUndefined(model.pricing?.prompt),
      completion: numberOrUndefined(model.pricing?.completion),
    },
  ]));
}

function summarizeMatchCost(
  match: AgentMatchResult,
  pricing: Map<string, OpenRouterModelPricing>,
  accumulators: Map<string, LlmModelCostSummary>,
): { decisions: number; estimatedCostUsd: number } {
  let decisions = 0;
  let estimatedCostUsd = 0;

  for (const event of match.replay) {
    if (event.type !== 'action_resolved' || !event.llmTrace) continue;
    const model = event.llmTrace.model;
    const agentId = event.agentId;
    const usage = event.llmTrace.usage;
    const promptTokens = usage?.promptTokens ?? 0;
    const completionTokens = usage?.completionTokens ?? 0;
    const totalTokens = usage?.totalTokens ?? promptTokens + completionTokens;
    const modelPricing = pricing.get(model) ?? pricing.get(event.llmTrace.responseModel ?? '');
    const cost = estimateCost(promptTokens, completionTokens, modelPricing);
    const current = accumulators.get(agentId) ?? {
      agentId,
      model,
      decisions: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    };

    decisions += 1;
    estimatedCostUsd += cost;
    current.decisions += 1;
    current.promptTokens += promptTokens;
    current.completionTokens += completionTokens;
    current.totalTokens += totalTokens;
    current.estimatedCostUsd += cost;
    accumulators.set(agentId, current);
  }

  return { decisions, estimatedCostUsd };
}

export function summarizeLlmHarnessAudit(matches: AgentMatchResult[]): LlmSeasonHarnessAudit {
  const modelActionsByTurn = new Map<string, number>();
  const acceptedActionCounts = new Map<string, number>();
  let modelTurnStarts = 0;
  let modelActionResolutions = 0;
  let modelDelegateLegalActionExposures = 0;
  let modelDelegateSelections = 0;
  let modelToolCallDecisions = 0;
  let modelJsonFallbackDecisions = 0;
  let modelRepairAttempts = 0;

  for (const match of matches) {
    for (const event of match.replay) {
      if (event.type === 'turn_started' && isOpenRouterController(event.controller)) {
        modelTurnStarts += 1;
        if (event.legalActions.some((action) => action.type === 'battlecast_tactic')) {
          modelDelegateLegalActionExposures += 1;
        }
        continue;
      }

      if (event.type !== 'action_resolved' || !isOpenRouterAgentId(event.agentId)) {
        continue;
      }

      modelActionResolutions += 1;
      if (event.acceptedAction.type === 'battlecast_tactic') {
        modelDelegateSelections += 1;
      }

      const actionKey = acceptedActionAuditKey(event.acceptedAction);
      acceptedActionCounts.set(actionKey, (acceptedActionCounts.get(actionKey) ?? 0) + 1);
      const turnKey = `${match.matchId}:${event.round}:${event.turnIndex}:${event.activeCreatureId}`;
      modelActionsByTurn.set(turnKey, (modelActionsByTurn.get(turnKey) ?? 0) + 1);

      if (event.llmTrace) {
        if (event.llmTrace.toolCall) {
          modelToolCallDecisions += 1;
        } else {
          modelJsonFallbackDecisions += 1;
        }
        modelRepairAttempts += Math.max(0, event.llmTrace.attempts - 1);
      }
    }
  }

  const actionCountsByTurn = [...modelActionsByTurn.values()];
  return {
    modelTurnStarts,
    modelActionResolutions,
    modelDelegateLegalActionExposures,
    modelDelegateSelections,
    modelStepwiseTurns: actionCountsByTurn.filter((count) => count > 1).length,
    modelStepwiseContinuations: actionCountsByTurn.reduce((sum, count) => sum + Math.max(0, count - 1), 0),
    maxModelActionsInTurn: actionCountsByTurn.reduce((max, count) => Math.max(max, count), 0),
    modelToolCallDecisions,
    modelJsonFallbackDecisions,
    modelRepairAttempts,
    acceptedActionCounts: [...acceptedActionCounts.entries()]
      .map(([actionKey, count]) => ({ actionKey, count }))
      .sort((left, right) => right.count - left.count || left.actionKey.localeCompare(right.actionKey)),
  };
}

function isOpenRouterController(controller: ReplayEventController | undefined): boolean {
  return controller?.mode === 'openrouter-llm' || isOpenRouterAgentId(controller?.agentId);
}

function isOpenRouterAgentId(agentId: string | undefined): boolean {
  return typeof agentId === 'string' && agentId.startsWith('openrouter:');
}

function acceptedActionAuditKey(action: LegalAction): string {
  switch (action.type) {
    case 'attack':
    case 'random_ray':
    case 'spell':
      return `${action.type}:${action.actionName}`;
    case 'linked_bonus_damage':
      return `linked_bonus_damage:${action.buffKey}`;
    case 'spell_retarget':
      return `spell_retarget:${action.buffKey}`;
    case 'smite':
      return `smite:${action.smite}`;
    case 'reaction':
      return `reaction:${action.reaction}`;
    case 'class_feature':
      return `class_feature:${action.feature}`;
    case 'battlecast_tactic':
      return `battlecast_tactic:${action.tactic}`;
    default:
      return action.type;
  }
}

function finalizeCostSummary(accumulators: Map<string, LlmModelCostSummary>): LlmSeasonCostSummary {
  const byModel = [...accumulators.values()].sort((left, right) =>
    right.estimatedCostUsd - left.estimatedCostUsd || left.agentId.localeCompare(right.agentId)
  );
  return {
    totalDecisions: byModel.reduce((sum, entry) => sum + entry.decisions, 0),
    promptTokens: byModel.reduce((sum, entry) => sum + entry.promptTokens, 0),
    completionTokens: byModel.reduce((sum, entry) => sum + entry.completionTokens, 0),
    totalTokens: byModel.reduce((sum, entry) => sum + entry.totalTokens, 0),
    estimatedCostUsd: byModel.reduce((sum, entry) => sum + entry.estimatedCostUsd, 0),
    byModel,
  };
}

function createRatingPool(agents: AgentId[], initialRating: number): RatingPool {
  const ratings = new Map<AgentId, number>();
  const standings = new Map<AgentId, EloStanding>();

  for (const agent of agents) {
    ratings.set(agent, initialRating);
    standings.set(agent, {
      agentId: agent,
      rating: initialRating,
      matches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      score: 0,
    });
  }

  return { ratings, standings };
}

function getBattleTypePool(
  pools: Map<BattleType, RatingPool>,
  battleType: BattleType,
  agents: AgentId[],
  initialRating: number,
): RatingPool {
  let pool = pools.get(battleType);
  if (!pool) {
    pool = createRatingPool(agents, initialRating);
    pools.set(battleType, pool);
  }
  return pool;
}

function applyMatchRating(input: MatchRatingInput): MatchRatingResult {
  const redBefore = input.pool.ratings.get(input.redAgent) ?? input.initialRating;
  const blueBefore = input.pool.ratings.get(input.blueAgent) ?? input.initialRating;
  const redAfter = redBefore + input.kFactor * (input.redScore - expectedScore(redBefore, blueBefore));
  const blueAfter = blueBefore + input.kFactor * (input.blueScore - expectedScore(blueBefore, redBefore));

  input.pool.ratings.set(input.redAgent, redAfter);
  input.pool.ratings.set(input.blueAgent, blueAfter);
  updateStanding(input.pool.standings.get(input.redAgent)!, input.redScore, redAfter);
  updateStanding(input.pool.standings.get(input.blueAgent)!, input.blueScore, blueAfter);

  return { redBefore, blueBefore, redAfter, blueAfter };
}

function finalizeStandings(pool: RatingPool): EloStanding[] {
  return [...pool.standings.values()]
    .map((standing) => ({ ...standing, rating: pool.ratings.get(standing.agentId) ?? standing.rating }))
    .sort((left, right) => right.rating - left.rating || left.agentId.localeCompare(right.agentId));
}

function estimateCost(
  promptTokens: number,
  completionTokens: number,
  pricing: OpenRouterModelPricing | undefined,
): number {
  if (!pricing) return 0;
  return promptTokens * (pricing.prompt ?? 0) + completionTokens * (pricing.completion ?? 0);
}

function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

function updateStanding(standing: EloStanding, score: number, rating: number): void {
  standing.matches += 1;
  standing.score += score;
  standing.rating = rating;
  if (score === 1) standing.wins += 1;
  else if (score === 0) standing.losses += 1;
  else standing.draws += 1;
}

async function writeJsonAtomic(path: string, value: unknown, sequence: number): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmpPath = `${path}.${sequence}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tmpPath, path);
}

function normalizeConcurrency(value: number | undefined, totalMatches: number): number {
  const requested = value ?? 3;
  if (!Number.isFinite(requested)) return 1;
  return Math.max(1, Math.min(Math.floor(requested), Math.max(1, totalMatches)));
}

function pushRecentMatch(recentMatches: LlmSeasonMatchProgress[], match: LlmSeasonMatchProgress): void {
  recentMatches.push(match);
  if (recentMatches.length > 20) {
    recentMatches.splice(0, recentMatches.length - 20);
  }
}

function formatMatchProgressLine(
  seasonId: string,
  completedMatches: number,
  failedMatches: number,
  totalMatches: number,
  match: LlmSeasonMatchProgress,
  costSummary: LlmSeasonCostSummary,
): string {
  const finishedMatches = completedMatches + failedMatches;
  const winner = match.winner ? `winner ${match.winner}` : 'no winner';
  return [
    `[${seasonId}] ${finishedMatches}/${totalMatches}`,
    `${match.redAgent} vs ${match.blueAgent}`,
    winner,
    `${match.llmDecisions ?? 0} LLM decisions`,
    `$${costSummary.estimatedCostUsd.toFixed(6)} total`,
  ].join(' | ');
}

function stringifyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const sanitized = sanitizeBenchmarkErrorForArtifacts(message);
  return sanitized.length > 1200 ? `${sanitized.slice(0, 1197)}...` : sanitized;
}

export function isFatalSeasonError(errorMessage: string): boolean {
  return /OpenRouter (fallback )?request failed \(402\)/.test(errorMessage)
    || /OpenRouter (fallback )?request failed \(403\).*key limit exceeded/i.test(errorMessage)
    || /Insufficient credits/i.test(errorMessage)
    || /monthly limit/i.test(errorMessage)
    || /requires more credits/i.test(errorMessage);
}

function formatFatalSeasonStopReason(errorMessage: string): string {
  return `OpenRouter billing or credit limit reached: ${errorMessage}`;
}

export function sanitizeBenchmarkErrorForArtifacts(message: string): string {
  return message
    .replace(/https:\/\/openrouter\.ai\/workspaces\/[^/\s"']+\/keys\/[A-Za-z0-9_-]+/g, 'https://openrouter.ai/workspaces/<workspace>/keys/<key>')
    .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, 'sk-or-v1-<redacted>');
}

function numberOrUndefined(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
