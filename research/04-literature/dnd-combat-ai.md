# Prior work: AI for D&D combat

Census date 2026-10-01. Question: has anyone built a search or learned agent that beats a strong scripted D&D 5e combat AI, and what did they learn?

Provenance: entries tagged [C] were read in the primary source. The links let anyone re-read them. Entries tagged [V] were checked by me against files on disk. [U] means seen only in a summary or press piece.

## Short answer

Search and learned agents have been tried on D&D combat. None has been shown to beat a mature scripted 5e AI, and none has run on the Battlecast engine. The strongest scripted baseline on record is Battlecast's own bot family, which D20bench uses.

## Search agents

| source | setting | agents | result | notes |
|---|---|---|---|---|
| Shyne 2023, Union College honors thesis ([pdf](https://arches.union.edu/do/53208/iiif/7cb74347-954b-4e60-8819-5397ed22fce8/full/full/0/2023_ShyneF.pdf)) | simplified level-1 5e | rule-based (Protective, Aggressive) vs general game-playing search (Monte Carlo Game Search, Trimming, JinJerry, OLETS) | mixed monster tournament wins: Protective 65, Aggressive 58, MCGS 41, Trimming 31, JinJerry 26, OLETS 9. PC-only: MCGS 54, Aggressive 53, Protective 44 [C] | "In simple scenarios, rule-based agents win at a higher rate than general agents, but with complex scenarios, the rule-based and general agents perform similarly." Games per pairing not stated in the section read [C] |
| wszdexdrf/dnd-ml (GitHub, 2026) | 5e encounters | MCTS, 30 iterations, depth-3 random rollouts, vs a utility heuristic | as party 100% / 62% / 28% by challenge band, n=50 per cell [C] | no heuristic-vs-heuristic control on the same scenarios, so no evidence it beats the heuristic |

Negative result that matters: general search with shallow or random playouts tied or lost to simple rule bots (Shyne). That points at the playout policy and evaluation, not at search itself. It is one thesis on a simplified ruleset, so the evidence is thin.

## Learned agents

| source | setting | method | result | caveat |
|---|---|---|---|---|
| Dayo, Ogbinar, Naval 2025 ([arXiv 2503.15726](https://arxiv.org/html/2503.15726v1)) | 1v1, level 2, natural_20.py engine | DQN, 30 matches per pairing | fighter-only vs rules bot: 22/7/1 wins/losses/ties for the rules-trained agent [C] | the rules bot is "if an attack is possible, it executes the attack; if not, it moves closer to the hero". Authors: "'bugs' in the rules-based AI get consistently taken advantage of during the RL training process" [C] |
| dabslee/suntzu (GitHub) | 1v1 | MaskablePPO | "reaches 32% wins in 13 s / 47% wins in 40 s" vs a rule-based wolf [C] | no control |
| AndrewLim1990 blog, 2020 | 1v1 | dueling DQN | about 80% vs a random opponent [U] | random opponent only |
| Romeo and Bagdanov 2025, NTRL ([arXiv 2506.19530](https://arxiv.org/html/2506.19530)) | encounter design | RL chooses encounters; combat uses a fixed utility heuristic [C] | not a combat agent | |

## LLM benchmarks on D&D combat

| source | engine | opponents | non-LLM baseline | top result |
|---|---|---|---|---|
| DungeonBench, Ismayilov, Kara, Oktay 2026 ([arXiv 2607.29577](https://arxiv.org/html/2607.29577v1)) | its own 2014-SRD engine, not Battlecast [C] | "all opposing sides are controlled by the same heuristic planner" [C] | none with numbers. A behaviour-cloned ranker and a PPO interface are described (App. A.3-A.4) with no results row [C] | encounter win rate: Gemini 3.1 Pro 83±5, GPT-5.5 82±5, Grok 4.3 72±6, Claude Opus 4.7 68±6, DeepSeek V4 68±6 [C]. No code URL in the paper [C] |
| Setting the DC, NeurIPS 2025 workshop ([abstract](https://neurips.cc/virtual/2025/128312)) | LLMs play DM, players and monsters | rubric scoring, not win rate [C] | none in abstract or press; body not readable through OpenReview | press reports conflict on which model came second [U] |
| D20bench `llm-actual-fairfix-tournament-v2` | Battlecast | `battlecast.smart` | Smart itself | GLM 5.2 16-8, Smart 15-9 [V, [02-measurements.md](../02-measurements.md#published-llm-results)] |

## What the D20bench author says about Smart

From `docs/ACTUAL_ACTION_HARNESS_LEARNINGS.md:612-620` [V]:

> Smart has no downed-ally triage. It leaves dying creatures to fail death saves while LLMs stabilise and yo-yo heal. This is a real tactical blind spot, and beating it is legitimate play.

> Smart's repositioning logic bleeds opportunity attacks now that LLM reactors actually take them.

Both are "deliberately documented rather than patched, to keep season results comparable" (line 613). The same file records how DeepSeek beat Smart: "Healing Word yo-yo healing, Stabilise triage, 153 opportunity attacks, and concentration-breaking focus fire. It lost the damage race 290 to 312 and won on action economy" (lines 607-610) [V].

The roadmap already anticipates a search agent: "Shallow-search or rollout oracle for small deterministic scenarios" (`docs/ROADMAP.md:256`) [V], and the project plan lists "Tactical regret versus shallow search or scripted oracle in small scenarios" as a metric (`docs/PROJECT_PLAN.md:117`) [V].

Battlecast's AI, per its author: "The AI is about 2,700 lines of heuristic logic. No LLM in the loop" ([blog](https://e4developer.com/posts/how-i-built-a-dnd-combat-simulator/)) [C].

## What this means for us

- "Nobody has applied search or RL to D&D combat" is false. Do not claim it.
- "No published search or RL agent beats a mature scripted 5e AI" holds as of 2026-10-01, with gaps: the Setting the DC body is unread, part of the GitHub search was rate-limited, and one NUS class report (Pitch2342/DnD_CS5446) is unread.
- The one direct search-vs-script comparison (Shyne) is a warning. Shallow random playouts did not beat rule bots. A search agent here needs a strong playout policy and a sound evaluation, which is what the engine's own bots provide.
- Exploiting Smart's triage and opportunity-attack weaknesses is play the author explicitly calls legitimate.
