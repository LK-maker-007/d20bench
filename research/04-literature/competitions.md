# Prior work: who wins game-AI competitions with dice and multi-action turns

Census date 2026-10-01. Question: in competitions closest to D20bench (dice, full or near-full information, several actions per turn, hobby compute), what kind of agent won, what lost, and why?

Provenance: [C] entries were read in the primary source, and the winning bots' code was read where cited (file:line refers to that bot's repo). (WF) marks numbers seen only through a web summary and not checked against raw text.

## Bot Bowl (Blood Bowl AI competition)

Blood Bowl is the closest public analogue: dice on almost every action, full information, several actions per turn on a grid. Turn branching factor around 10^50 ([Justesen et al. 2019](https://njustesen.github.io/njustesen/publications/justesen2019blood.pdf)). Each pair played 10 games, on laptop-class hardware ("Don't expect any GPUs").

| edition | winner and type | W/D/L | best RL entry | best MCTS entry |
|---|---|---|---|---|
| [I, 2019](https://njustesen.github.io/botbowl/bot-bowl-i.html) | GrodBot, scripted | 34/5/1 | A2C 0/17/23 (Random 0/15/25) | none |
| [II, 2020](https://njustesen.github.io/botbowl/bot-bowl-ii.html) | Minigrod, scripted | 47/10/3 | Gotebot 26/9/25 | Sapling 1/20/39 |
| [III, 2021](https://njustesen.github.io/botbowl/bot-bowl-iii.html) | MimicBot: behaviour cloning of a scripted bot, then RL, plus scripted rules | 36/1/3 | GoteBoy (R2D2) 0/20/20 | Dryad 2/18/20 |
| [IV, 2022](https://njustesen.github.io/botbowl/bot-bowl-iv.html) | Drefsante, scripted (Java) | 57/1/2 | YayBot (BC+RL) 7/7/46 | Treekin 22/16/22 |
| [V, 2023](https://njustesen.github.io/botbowl/bot-bowl-v.html) | Drefsante, scripted | 37/0/3 | "Overparameterized 40k Bot" 0/11/29 | Treeman 19/1/20 |

All rows [C]. No later edition was found.

How the winners handled dice: Minigrod scores each candidate as `action_risk * pow(path_risk, 2) * score`, with exact success probabilities along the safest path and no tree search (minigrod.py:677-681) [C].

Why the losers lost, in the authors' words:
- RL: earlier attempts "failed ... due to the intrinsic randomness in the environment and the large and uneven number of actions", and randomness acts "as a confounder for Monte-Carlo based methods" ([MimicBot, arXiv 2108.09478](https://arxiv.org/abs/2108.09478)) [C].
- MCTS: the official tutorial gave MCTS 5 s per decision; it won 2 of 20 against Random with random playouts and 7 of 20 without. Random playouts "more often than not result in failed dodges" ([botbowl docs/mcts.md](https://github.com/njustesen/botbowl/blob/main/docs/mcts.md)) [C].
- Automated tuning: EvoGrod, GrodBot with 16 evolved weights, lost the Bot Bowl I final to hand-tuned GrodBot [C].

## Hearthstone AI Competition

Results slides: [2018](https://hearthstoneai.github.io/files/slides/2018-Results-Hearthstone-AI-Competition.pdf), [2019](https://hearthstoneai.github.io/files/slides/2019-Results-Hearthstone-AI-Competition.pdf), [2020](https://hearthstoneai.github.io/files/slides/2020-Results-Hearthstone-AI-Competition.pdf) [C].

| year, track | winner | method | win rate | note |
|---|---|---|---|---|
| 2018 premade | Frick/Akkaya | not named in slides | 76.0% | EVA second, 74.2% |
| 2019 premade | BotHeimbrodt | "Pruned BFS + Heuristics" | 57.66% | MCTS entries 2nd (55.22%) and 4th (37.11%) |
| 2019 user decks | MCGSAgent | MCTS family | 79.57% | |
| 2020 premade | "Dynamic Lookahead" | own-turn lookahead | 72.34% | 2nd and 3rd used it too |

The 2019 and 2020 winners share code: a search over the agent's own turn only, depth 3 when there are fewer than 5 options, depth 2 for 5 to 24, depth 1 for 25 or more (MyAgent.cs:82), and an 8-term weighted evaluation. 2020 changed only the weights. Chance is ignored: one `Simulate` sample per action [C].

## Legends of Code and Magic

From the competition summary ([arXiv 2305.11814](https://arxiv.org/abs/2305.11814), Table I) [C]:

| period | winner | method | win rate |
|---|---|---|---|
| 2019 to early 2020 | Coac | depth-3 minimax, alpha-beta, heuristic pruning | 94.22%, 89.88%, 86.07% |
| late 2020 | Chad | MCTS with opponent-hand guessing | 79.99% |
| 2021 | DrainPower | own turn plus opponent reply simulation | 78.72% |
| 2022 | ByteRL | end-to-end RL, compute not stated | 84.41% |

The organisers: "Search-based agents ... won all competitions running version 1.2", all used move pruning, and "most of them implemented lethal move detection" [C]. A failure: ProphetCoac's opponent-hand prediction "reduced the overall win rate, most likely due to less time available for search" [C].

## Pokémon Showdown

Different structure from ours (simultaneous moves, hidden opponent sets), included because it has the best public record of search vs RL vs LLM.

- Foul Play: samples opponent sets from usage statistics, runs Rust MCTS on each sample in parallel, expands chance nodes by probability with damage rolls branched only near the root, and scores leaves with a hand-written evaluation rather than playouts (poke-engine mcts.rs:106-125, 143, 190-202) [C]. Rating: "over 90% GXE in Generation 9 Random Battles (peak rating 2341)" ([PokeAgent paper, arXiv 2603.15563](https://arxiv.org/abs/2603.15563)) [C].
- PokeAgent Challenge, NeurIPS 2025: FoulPlay won Gen 9 OU 50-14; an offline-RL entry built on Metamon won Gen 1 OU 50-28. "Default turn timers (60-90s) proved insufficient for LLM inference" [C].
- Metamon ([arXiv 2504.04395](https://arxiv.org/abs/2504.04395)): 15M to 200M parameter transformers, offline RL on 475k human replays, 8 A5000 GPUs; drew with Foul Play in Gens 3 and 4 and beat it in Gens 1 and 2 over 300 battles per generation [C].
- PokéChamp ([arXiv 2503.04094](https://arxiv.org/abs/2503.04094)): LLM inside minimax; beat a rule bot 84% and PokéLLMon 76%, but "For about one third of the games, PokéChamp lost by exceeding the turn time limit". It never played Foul Play [C].
- 2026 bots (WF): Jaxcalibur, self-play RL plus AlphaZero-style search, about six months on an H100; Laplace, Foul Play search plus a small value network used on 5 to 10% of turns; PokaiTrainer: "The network's policy alone loses even to a shallow heuristic search."

## LLM vs search or RL, head to head

| arena | result | tag |
|---|---|---|
| GTBench ([arXiv 2402.12348](https://arxiv.org/abs/2402.12348)) | against MCTS with 1000 simulations, "all the LLM agents ... achieve NRA as −1" in deterministic full-information games; near even in chance games | [C] |
| Chess vs Stockfish 18 | Gemini 3.1 Pro about 1920, 1 win in 16 at the 2596 level | (WF) |
| Poker, GTO Wizard benchmark | best LLM lost 16 ±3 bb/100 over 5000 hands | (WF) |
| D20bench fairfix-v2 | GLM 5.2 16-8, `battlecast.smart` 15-9 over 48 matches | [V] |
| DungeonBench | LLMs 68 to 83% against a fixed heuristic opponent; no non-LLM party reported | [C] |

## Matrix

| arena | winner type | how the winner handles chance | RL from scratch | plain MCTS | LLM |
|---|---|---|---|---|---|
| Bot Bowl I-V | scripted 4 times, cloned-script hybrid once | exact probability times score | near Random | 3rd to 5th | n/a |
| Hearthstone 2018-20 | own-turn lookahead, depth 3 or less | one sample | n/a | 2nd and 4th (2019) | n/a |
| LOCM 2019-21 | minimax, MCTS, turn simulation | sampled | n/a | won late 2020 | n/a |
| LOCM 2022 | end-to-end RL | learned | won | n/a | n/a |
| Pokémon 2025 | MCTS with eval leaves; offline RL | explicit chance nodes, grouped rolls | n/a | n/a | lost |
| GTBench, chess, poker | engine, MCTS, solver | n/a | n/a | n/a | lost |

**Unanimous among winners.** A hand-written evaluator or scripted policy in the loop, or human or scripted games to imitate. The only exceptions spent industrial compute (ByteRL, compute unstated; Jaxcalibur, months on an H100).

**Contested.** Whether to search at all (Bot Bowl winners mostly did not), and how deep (Hearthstone 1 to 3 own-turn steps; LOCM depth 3 minimax).

**Correlates with losing.** RL from scratch. MCTS with random playouts on multi-action turns. Spending search time on opponent prediction. LLMs running out of clock.

**Explicitly rejected by winners.** Random playouts (Foul Play's "rollout" is a static evaluation). Deep blind sampling of dice.

## Transfer to D20bench

| their condition | ours | transfers? |
|---|---|---|
| Bot Bowl: dice, multi-action turns, grid, scripted winners | same structure | yes: probability-weighted action scoring, safest-path movement, scripted policy as the base |
| Hearthstone own-turn depth rule | 60 to 100 actions per step | as written it gives depth 1 for us; pruning is the real lesson |
| Pokémon chance nodes and grouped rolls | dice with small outcome sets (miss, hit, crit; save or fail) | yes for the idea of grouping outcomes |
| Pokémon simultaneous moves, hidden sets | sequential turns, full information | no |
| random playouts failed | our playouts would use the engine's own Smart bot, not random moves | different setup; that it helps is [H] until measured |

What the census overturned: I expected MCTS to dominate these competitions. Scripted evaluators and shallow own-turn search won most of them.
