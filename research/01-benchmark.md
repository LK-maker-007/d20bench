# 01. The benchmark

What D20bench measures, how a match is decided, and what an agent may see and do. Every line here was read from upstream commit `ad8a355` unless tagged otherwise. Line numbers refer to that commit, not to our working tree.

## What it is

D20bench is a combat-only Dungeons & Dragons benchmark. Its own description: "a planned tactical Dungeons & Dragons tournament harness where language models control combatants, submit legal actions to a deterministic rules engine, and compete in reproducible encounters" (`README.md:3`). The rules, monster data and scripted bots come from Battlecast, a D&D 5e SRD combat simulator by the same author (`README.md:11`, `:13`). There is no roleplay, exploration or game master. A match is two teams on a grid fighting until one side is down or the round cap hits.

## Public scenarios

`npm run d20bench -- scenario list` [V]:

| id | battle type | sides |
|---|---|---|
| `public.goblin-duel.v1` | duel-smoke | 1v1 goblins |
| `public.goblin-warband-6v6.v1` | goblin-warband | 6v6 goblins |
| `public.hero-mirror-balanced-l5.v1` | hero-party-balanced | Fighter, Cleric, Wizard, Rogue mirror |
| `public.hero-mirror-chokepoint-l5.v1` | hero-party-chokepoint | Paladin, Druid, Sorcerer, Ranger mirror on Stone Bridge |
| `public.hero-mirror-status-l5.v1` | hero-party-status | Fighter, Cleric, Bard, Warlock mirror |

Party compositions are from `packages/engine/src/scenarios/public/hero-party-mirrors.ts` and the menu dump in [02-measurements.md](02-measurements.md#legal-action-menus).

## The headline protocol

The most recent published season, `llm-actual-fairfix-tournament-v2` (`packages/engine/src/llm-season.ts:1109`), is the one the author's blog post reports. Its settings:

| setting | value | source |
|---|---|---|
| scenarios | chokepoint and status-pressure hero mirrors | `llm-season.ts:1115-1118` |
| seeds | 1, 2 | `llm-season.ts:1119` |
| round cap | 50 | `llm-season.ts:1120` |
| action space | `actual-actions-v1` | `llm-season.ts:1125` |
| pairings | round robin, both sides | `llm-season.ts:1121-1124` |
| rating | sequential Elo, start 1000, K=32 | `llm-season.ts:1126-1127` |
| agents | DeepSeek V4 Flash, Qwen 3.5 Flash, GLM 5.2, `battlecast.smart` | `llm-season.ts:1103-1114` |

Under `actual-actions-v1` an LLM controls one creature at a time and picks one concrete action per step: move, attack, cast, dash, dodge, disengage, class feature, end turn. After each step it gets a fresh legal menu, up to 12 steps per turn (`agent-match.ts:719`). Opportunity attacks and damage reactions are asked for at the moment they trigger (`agent-match.ts:312-323`).

## How a match is decided

- A team wins when the other side is out of the fight (`checkBattleComplete` in `battlecast/engine/combat.ts`).
- At the round cap, the side with more remaining HP wins, else it is a draw (`agent-match.ts:2874-2878`).
- With a 50-round cap, almost every match ends by elimination: 299 of 300 Smart-vs-Smart playouts reached a winner on both headline maps [V, [03-performance-and-language.md](03-performance-and-language.md)].

## What an agent sees

The LLM prompt is built from every creature in the battle, allies and enemies alike (`llm-observation.ts:353-355`). Per creature it includes HP (`:414`), AC (`:417`), position (`:420`), conditions (`:427`) and resources (`:432`), plus the round cap and win condition (`:374-377`). Future dice rolls are not visible to anyone.

A built-in non-LLM agent receives the full `BattleState` (`agents.ts:16-17`). That is the same information the prompt shows, plus internal fields. For parity our agent must not read the opponent's identity or tactic setting from the state. See [00-goal.md](00-goal.md#clean-play-rules).

## Dice

Every roll in a match comes from one seeded generator per match, created at `agent-match.ts:233` and installed for the match at `:235`. The engine reads whatever generator is installed in the current async context (`battlecast/engine/dice.ts:31-32`). An agent that simulates inside the match context would consume or preview the match's own rolls. Our agent runs its simulations under its own generator. A test must prove the match's roll sequence is unchanged.

## The scripted bots

Four Battlecast tactics are available as opponents: `smart`, `aggressive`, `kiting` and `defensive`. Facts that matter for beating them:

- Smart does not finish off downed enemies. `finishDowned` defaults to false (`combat.ts:106-107`), and dying targets are dropped from target selection while a standing enemy exists (`ai-targeting.ts:301-304`).
- Smart's target choice depends on each creature's own Intelligence modifier, not on a team plan. Modifier 2 or more picks the lowest HP fraction nearby (`ai-targeting.ts:335-349`); 0 or more mixes nearest and weakest (`:352`).
- Smart is the bot in the fairfix seasons, and the README describes Battlecast's scripted AI as what "anchors the Elo ladder" (`README.md:13`). It is not the strongest bot on the headline maps. See [02-measurements.md](02-measurements.md#scripted-bot-round-robin).

## Publishing and submission

- There is no submission process for outside agents. A search of the repo docs found none [V]. The public leaderboard is a planned deliverable: "LMArena-style leaderboard with rating, confidence, win rate, legality, cost, latency, ruleset, and benchmark version" (`docs/ROADMAP.md:229`).
- Running an agent costs nothing. The only paid component is LLM API calls through OpenRouter (`openrouter-agent.ts:96-99`).
- Ratings are relative to each season's pool, so no number is comparable across seasons. There is no record to hold, only standings within a season.
