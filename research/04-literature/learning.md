# Prior work: learned agents and learned world models

Census date 2026-10-01. Questions: can a learned agent beat a strong scripted bot in a dice-driven tactics game at our compute, and does a learned world model (JEPA, MuZero, Dreamer) beat planning with an exact simulator?

Provenance: [C] entries were read in the primary source, with four quotes spot-checked (Gym-μRTS, Goodfriend, Rubin, DungeonBench) against the source text. Stochastic MuZero and Gumbel quotes come from the first authors' UCL theses because OpenReview was blocked; ICLR wording may differ. [H] marks estimates.

## Learned world models vs an exact simulator

No paper found shows a learned world model beating planning with the exact simulator when one is available. The best case is a tie.

| source | finding |
|---|---|
| MuZero ([arXiv 1911.08265](https://arxiv.org/pdf/1911.08265)) | Go: "slightly exceeded the performance of AlphaZero", with "16 TPUs for training and 1000 TPUs for selfplay" per board game [C] |
| Stochastic MuZero ([thesis ch. 7](https://discovery.ucl.ac.uk/id/eprint/10166147/)) | Backgammon "reached the same playing strength as AlphaZero (using a perfect stochastic simulator)"; in 2048, "diminishing returns due to imperfections of the learned model" [C] |
| Hamrick et al. ([arXiv 2011.04021](https://arxiv.org/abs/2011.04021)) | "Planning with the simulator yields somewhat better results than planning with the learned model" [C] |
| He et al. ([arXiv 2306.00840](https://arxiv.org/abs/2306.00840)) | search with the learned model "fails completely" in Lunar Lander and Breakout [C] |
| MiniZero ([arXiv 2310.11305](https://arxiv.org/abs/2310.11305)) | Othello: "α0 performs better than µ0" [C] |

### What JEPA is for

- LeCun's position paper motivates world models because "Interactions in the real world are expensive and dangerous" ([link](https://archive.org/details/a-path-towards-autonomous-machine-intelligence)) [C].
- I-JEPA is about "learning highly semantic image representations" ([arXiv 2301.08243](https://arxiv.org/abs/2301.08243)) [C].
- V-JEPA 2-AC ([arXiv 2506.09985](https://arxiv.org/abs/2506.09985)) plans robot reach, grasp and pick-and-place from "less than 62 hours" of robot video. Its planner uses "800 samples, 10 refinement steps ... a planning horizon of 1" because "all considered tasks are relatively greedy", and "requires only 16 seconds per action" on an RTX 4090. Pretraining the full model "would require roughly 60 GPU-years" before an 8.4x saving. No game, no simulator baseline [C].
- DreamerV3 selects actions "without lookahead planning" ([arXiv 2301.04104](https://arxiv.org/abs/2301.04104)) [C].

Verdict for D20bench: reject. JEPA-style models exist to learn a world model where no simulator exists. We have the exact rules engine. A learned approximation can at best tie it and adds model error. The 16 s V-JEPA 2-AC spends per action would buy about 1,600 exact full-battle playouts at 10 ms each [H, arithmetic].

## Learned agents in games like ours

| source | method | compute | result | failure or caveat |
|---|---|---|---|---|
| Blood Bowl ([Justesen 2019](https://njustesen.github.io/njustesen/publications/justesen2019blood.pdf)) | A2C | 100M steps, about a week on a desktop | "random agent was unable to score any points in 350,000 ... matches, making it infeasible to apply vanilla reinforcement learning" [C] | sparse reward |
| MimicBot ([arXiv 2108.09478](https://arxiv.org/pdf/2108.09478v1)) | clone scripted bots, then A2C with a cloning loss, then self-play | GTX 1080, about 48 h; 200 games, 400k state-action pairs | hybrid "wins 62% ... loses only 11%" against scripted bots [C] | plain RL from the cloned policy: "policy collapse" [C] |
| Gym-μRTS ([arXiv 2105.13807](https://arxiv.org/html/2105.13807)) | PPO with action masking | "about 60 hours ... (one GPU, three vCPU, 16GB RAM)", 300M steps | "cumulative win rate of 91%" against past competition bots [C] | one map; self-play agents "do not perform particularly well" [C] |
| RAISocketAI ([arXiv 2402.08112](https://arxiv.org/html/2402.08112)) | clone then PPO, per map | 70 GPU-days | won the 2023 microRTS competition (72%); cloning 71% to 88% after PPO [C] | largest map: fine-tuning ended "worse ... than the initial supervised policy" [C] |
| Generals.io ([arXiv 2507.06825](https://arxiv.org/html/2507.06825)) | clone then PPO | H100, 3 h + 36 h | "54.82% win-rate across 529 games" against a heuristic bot [C] | cloning alone stayed below the bot (Elo 1874 vs 2018) [C] |
| LOCM PPO ([Vieira et al.](https://homepages.dcc.ufmg.br/~ronaldo.vieira/assets/pdf/entcom-2023.pdf)) | PPO | 100k episodes on a GTX 1050 Ti | "59.2% ... against a midlevel battle agent" [C] | too few samples |
| LOCM clone + search ([arXiv 2609.06816](https://arxiv.org/abs/2609.06816)) | cloned policy plus search | | 51.35% [50.37, 52.33] against ByteRL; "Without search this agent scores 26.8%" [C, abstract-level check] | search carried the result |
| Hearthstone ([arXiv 1808.04794](https://arxiv.org/abs/1808.04794)) | MCTS plus iterated value network | 20k + 64 × 3k games | as player 2: 26.5% to 50.2% [C] | |
| Expert iteration, Hex ([arXiv 1705.08439](https://arxiv.org/abs/1705.08439)) | slow search teaches a network that guides search | one Titan X, about 8M moves | "won 75.3% of games against 10,000 iteration-MoHex" [C] | training on visit counts: "50 ± 13 Elo stronger" [C] |
| Gumbel AlphaZero ([thesis](https://discovery.ucl.ac.uk/id/eprint/10167022/2/ivo_danihelka_thesis.pdf)) | Gumbel top-k with sequential halving at the root | TPUv3, count not given | "Strikingly, Gumbel MuZero learns reliably even with 2 simulations" on 9x9 Go; "MuZero fails to learn from 16 or fewer" [C] | 2 seeds, "We make no claims about confidence intervals" [C] |
| Raccoon, hobby AlphaZero backgammon ([repo](https://github.com/lassehjorthmadsen/raccoon)) | pure AlphaZero | about 459 T4-hours, about 11k games | "Every self-play checkpoint loses 97–100% of its games against GNUBG 2-ply" [C] | what worked was distilling GNUBG |
| TD-Gammon ([Tesauro](https://bkgm.com/articles/tesauro/TDGammonAchievesMasterLevelPlay.pdf)) | TD(λ) value network | 1.5M games, CPU | near parity with a world-class human [C] | |
| AlphaStar ([paper](https://storage.googleapis.com/deepmind-media/research/alphastar/AlphaStar_unformatted.pdf)) | supervised start, then league | 32 TPUs × 44 days per agent | ablation: no human data 149 Elo vs 1540 with supervised start plus KL [C] | |
| AlphaZero, AlphaGo Zero | self-play MCTS, 800 simulations | 5,000 TPUv1 + 64 TPUv2; 4.9M to 44M games | [C] | far outside our budget |

### Patterns

- Unanimous among learned winners at small budgets: a teacher. Cloning a scripted bot or human games, with a cloning or KL anchor kept during RL (MimicBot, AlphaStar, Generals, RAISocketAI).
- Cloning alone ends below the teacher in every case found (Generals, MimicBot, Lux).
- RL fine-tuning without an anchor collapsed (MimicBot, RAISocketAI's largest map).
- Pure self-play from scratch at hobby scale failed outright (Raccoon, Blood Bowl).
- Expert iteration, a search teaching a network, worked on one GPU (Hex) and in Hearthstone.

## Arithmetic on our numbers

Measured inputs [V]:

- An LLM side made 103.9 decisions per match against Smart in `llm-actual-fairfix-tournament-v2` (median 98.5, range 16 to 229), from the `llmDecisions` field of `results/seasons/llm-actual-fairfix-tournament-v2/standings.json`. The first census draft assumed 300; costs below use 104.
- Bare engine playout to the end of a battle: about 10 ms. A harness match: about 100 to 350 ms. See [03-performance-and-language.md](../03-performance-and-language.md). The harness is slower mainly because it records replay events with state hashes; an agent's internal simulator skips that.

Estimates [H]:

| method | cost per decision | per match (104 decisions) | matches per hour on 8 cores | published count, our wall-clock |
|---|---|---|---|---|
| rollout search, 128 full playouts per decision | about 1.3 s | about 2.2 min | about 220 | evaluation only |
| Gumbel AlphaZero, 16 simulations, about 1 ms per search node | about 16 ms + network | about 2 s | about 14k | AlphaZero.jl's 75k Connect Four games: about 5 h |
| cloning data from a scripted bot | 0 | 0.1 to 0.35 s | 80k to 290k | MimicBot's 200 games: seconds |
| PPO actors | network inference | under 1 s | 30k or more | Gym-μRTS 300M steps = 1.4M to 2.9M matches at 104 to 208 learner decisions each: about 2 to 4 days |

Feeding a GPU from Node: actors write binary shards (observation, per-action features, legal mask, visit-count targets, outcome) to `/kaggle/working/`; PyTorch trains in fp16 on a T4; the model is exported to ONNX and run on CPU in Node through `onnxruntime-node` (version 1.30.0 exists on npm, checked with `npm view`). Kaggle GPU sessions have 4 CPUs (post title only, [link](https://www.kaggle.com/discussions/product-feedback/448251)), so self-play generation is better done locally [H].

## Verdict per approach

| approach | evidence at small compute | verdict |
|---|---|---|
| AlphaZero or MuZero at published scale | none below about 10^4 accelerator-hours; hobby attempt failed at 459 T4-hours | infeasible |
| MuZero, Stochastic MuZero, JEPA, Dreamer | learned model ties an exact simulator at best | reject: we have the exact simulator |
| PPO from scratch | sparse-reward failures in the closest game (Blood Bowl) | low priority |
| cloning a bot, alone | always below the teacher | warm start only |
| cloning then PPO with an anchor | MimicBot, Generals, RAISocketAI | feasible, second choice |
| expert iteration or Gumbel AlphaZero with 16 or fewer simulations on the exact engine, warm-started from search or a cloned bot | ExIt Hex, Hearthstone, LOCM clone + search | feasible, first choice for a learned component |
| TD-learned leaf value function | TD-Gammon | feasible, cheap complement |

Kill criteria proposed by the census, to be finalised in [05-architecture.md](../05-architecture.md):
- Expert iteration: if the network-guided search does not beat its own search teacher at equal time per decision after two iterations, stop.
- Cloning then PPO: if the win rate drops below the cloned starting point despite the anchor, stop.

Belief the census contradicted: environment throughput is not what kills small-budget RL. The failures trace to sparse reward and policy collapse.
