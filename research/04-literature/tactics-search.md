# Prior work: search in multi-action, multi-unit turn-based games

Census date 2026-10-01. Question: which search methods win in turn-based games where one turn holds several actions over many units, and which lose?

Provenance: [C] entries were read in the method and results sections unless marked "abstract only" or "snippet". Not readable: the EMCTS CIG 2018 full text, Churchill and Buro's Portfolio Greedy Search paper (host down), Sato and Ikeda on TUBSTAP, TBETS (paywalled), and the open-loop GECCO 2015 paper. No Tribes competition results were found.

## Multi-action turns

**Hero Academy, Justesen et al., TCIAIG** ([pdf](https://researcher.itu.dk/ws/files/82456662/justesen_tciaig17.pdf)) [C]
- Setting: randomness and hidden information switched off; about 60 actions per step, 5 action points per turn, about 7.8×10^8 action sequences per turn; 6 s per turn on one core; 100 games per pairing.
- Methods: online evolutionary planning (OEP) over whole turns (population 100, static heuristic fitness); UCT; non-exploring MCTS (C=0, greedy rollouts); bridge-burning MCTS. All pruned redundant and dominated actions.
- Result: "The non-exploring MCTS is the best performing method but with no significant difference compared to … OEP and BB-MCTS". "Vanilla MCTS plays on the same level as the Greedy Action baseline." At 10 or more action points, OEP won 55% or more against every MCTS variant.
- Why vanilla MCTS failed: 258,488 iterations per turn reached only 201 distinct end-of-turn outcomes, against 9,344 for OEP. Tree search "concentrate[s] … on the part of plan space closest to the root".
- Rejected: rollout-based fitness for OEP, rollouts longer than one turn.

**Flexible-Horizon Evolutionary MCTS, Baier and Cowling, AIIDE 2018** ([link](https://ojs.aaai.org/index.php/AIIDE/article/view/13023)) [C]
- A tree over whole-turn plans whose edges are mutations, no rollouts, extended past its own turn with a greedy opponent model capped at the 10 best-ordered actions. 1 s per turn, 1000 games, deterministic game.
- "consistently and significantly outperforms all baselines at all tested turn lengths"; against plain EMCTS 85% at 2 action points, about 57 to 62% at higher counts.
- Plain EMCTS lost to non-exploring MCTS at very low action points because it "cannot see past its own turn". Searching deeper than the turn "can lead to missing good immediate actions".

## Tribes and Stratega

| source | setting | result |
|---|---|---|
| Tribes, AIIDE 2020 ([pdf](https://cdn.aaai.org/ojs/7438/7438-52-10764-1-2-20200923.pdf)) | 2000 forward-model calls per decision, about 54.5 actions per move | RHEA beat MCTS 63% and the rule-based agent 58.6%; the rule-based agent beat MCTS 56.2%: "It is remarkable that the Rule Based agent ranks second". MCTS used no rollouts [C] |
| Hsu and Perez-Liebana ([pdf](https://ceur-ws.org/Vol-2862/paper27.pdf)) | Tribes | MCTS with hard and move pruning beat the rule-based agent 56.9% and RHEA 57.8%; unpruned MCTS managed 43.8% and 37% [C] |
| Dockhorn et al., CEC 2021 ([arXiv 2104.10429](https://arxiv.org/abs/2104.10429)) | Stratega, portfolios of six scripts | portfolio RHEA "wins 686 out of 800 games"; no raw-MCTS baseline, so it does not show portfolios beat unconstrained search [C] |
| Elastic MCTS ([arXiv 2205.15126](https://arxiv.org/abs/2205.15126)) | Stratega, 30,000 calls per decision | searching one unit per tree level in fixed order: "MCTSu and Elastic MCTSu both outperform MCTS by a large margin" [C] |

## microRTS and RTS combat

- NaiveMCTS ([arXiv 1710.04805](https://arxiv.org/abs/1710.04805)): "MC dominates MCTS for low computation budgets"; UCB1-FPU "achieved a win ratio of 0" on the large map [C].
- 2017 competition ([AI Magazine](https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/2777)): a PuppetSearch plus NaiveMCTS hybrid was "the only approach that outperformed the hardcoded bots consistently"; NaiveMCTS bots were "unable to search deep enough" on large maps [C].
- 2018 to 2023 ([results](https://sites.google.com/site/micrortsaicompetition/competition-results)): the NaiveMCTS baseline ranked below the scripted rush every year [C]. 2023: "Scripted agents have predominantly won the five previous iterations" ([arXiv 2402.08112](https://arxiv.org/abs/2402.08112)) [C].
- Stratified Strategy Selection ([IJCAI 2017](https://www.ijcai.org/proceedings/2017/0522.pdf)): at 40 ms per decision, the tree searches ABCD and UCTCD "performed much worse than the others"; at 56 units per side, script-based selection won 95 to 96% against portfolio searches [C].
- Portfolio Greedy Search beating alpha-beta and UCT up to 50v50: snippet only, not verified.

## Search under chance

- Monte Carlo *-Minimax ([pdf](https://dke.maastrichtuniversity.nl/m.winands/documents/mc_star_minimax.pdf)): sample a few outcomes per chance node with Star1/Star2 pruning, 200 ms per move; beat classic Star1/Star2 everywhere (85% in Can't Stop) and matched the best MCTS with probability-sampled chance nodes in Pig and Ra [C].
- Determinization fails through strategy fusion and non-locality ([Long et al.](https://cdn.aaai.org/ojs/7562/7562-13-11092-1-2-20201228.pdf)) [C]. That is a hidden-information effect; D20bench has none apart from future dice.
- Bot Bowl: MCTS with a scripted heuristic (Sapling) went 1 win, 20 draws, 39 losses in 2020, losing 10-0 to every scripted bot, with a forward model built on "slow copy.deepcopy()" ([Bot Bowl II](https://njustesen.github.io/botbowl/bot-bowl-ii.html)) [C].

## Rollout over a base policy

- Bertsekas, multiagent rollout ([arXiv 1910.00120](https://arxiv.org/abs/1910.00120)) [C]: the rollout policy's cost is never worse than the base policy's when Q-factors are exact expectations under the base policy. Choosing one agent at a time keeps the guarantee at linear cost, provided agents choose in a fixed order and each knows its predecessors' choices; otherwise Example 3.1 gives cost 2 against the base policy's 1. It cannot improve a base policy that is already agent-by-agent optimal.
- What the guarantee does not cover [H]: the model has no adversary, so it holds only against a fixed opponent model; Monte Carlo estimates make it approximate.
- Tesauro and Galperin, backgammon ([NeurIPS 1996](https://proceedings.neurips.cc/paper_files/paper/1996/file/996009f2374006606f4c0b0fda878af1-Paper.pdf)) [C]: "a huge error reduction of potentially a factor of 4 or more", at about "10K or more trials per candidate".

## Where search lost

| loser | winner | stated reason |
|---|---|---|
| vanilla MCTS, Hero Academy | OEP, constrained MCTS | search stays near the root; 201 distinct turn outcomes |
| plain EMCTS at low action points | non-exploring MCTS | cannot see past its own turn |
| default MCTS, Tribes | rule-based agent, RHEA | branching too large; fixed by pruning |
| NaiveMCTS, microRTS | scripted rushes | large maps, insufficient depth |
| ABCD and UCTCD, SparCraft | portfolio methods | not stated |
| open-loop MCTS, GVGAI | random search, RHEA | low budget |
| Sapling and Dryad, Bot Bowl | scripted bots, imitation plus RL | slow forward model; does not scale to the full game |

## Matrix

| source | branching | budget | winner | how the action space was cut | dice in search |
|---|---|---|---|---|---|
| Hero Academy | 60 per step, 5 AP | 2 to 6 s | non-exploring MCTS ≈ OEP | pruning, whole-turn plans | off |
| FH-EMCTS | 30 to 60 per step | 1 s | FH-EMCTS | mutation tree, top-10 opponent moves | off |
| Tribes | 54 per move | 2000 calls | pruned MCTS > RHEA > rule-based > MCTS | pruning | partly |
| Stratega | n/a | 30k calls | unit-ordered MCTS, portfolio RHEA | unit ordering, scripts | no |
| microRTS | up to 10^20 | 100 ms | scripted, hybrid, RL | scripts, combinatorial bandits | no |
| SparCraft | 8 to 112 units | 40 ms | script selection | scripts, unit types | no |
| GVGAI | small | 480 calls | RHEA, random search | n/a | yes |
| Bot Bowl | about 10^50 | 120 s per turn | scripted, imitation plus RL | pathfinding macros | yes |
| backgammon | about 20 | about 10 s | rollout | n/a | yes |

**Unanimous among winners.** The per-turn action space is cut before search, in all nine settings. Evaluation uses a heuristic, one-turn rollouts or truncated rollouts, not long random playouts.

**Contested.** Evolution vs tree search (flips with turn length and pruning). UCT vs alpha-beta. RHEA population size. Sampled *-minimax vs MCTS with chance nodes.

**Correlates with failure.** Unconstrained UCT over atomic actions. Few evaluations per decision. Large maps and long horizons. Not seeing the opponent's reply. Standard scenarios where hand scripts were tuned for exactly those cases.

## Transfer to D20bench

| their condition | ours | transfers? |
|---|---|---|
| Hero Academy, 3 to 5 action points per turn, deterministic | 3 to 4 decisions per creature turn, dice | turn length similar; their results switched randomness off, so dice effects are untested |
| initiative per side | initiative alternates every creature | seeing the opponent's reply matters more than optimising one long turn |
| Hero Academy MCTS about 43,000 iterations per second per core | 77 to 98 full playouts per second per core, about 620 to 780 on 8 cores [V, from 10 to 13 ms per playout in two measurements] | tree methods are starved unless playouts are truncated and leaves evaluated |
| backgammon rollout, about 10^4 trials per candidate | our parked design compares the final two candidates on 32 samples each; standard error of a win/loss difference about 0.125 before shared seeds | too few samples; truncation and a value estimate are needed to raise the count |

Best-supported fit [H]: rollout over a scripted base policy with screened candidates and sequential sample allocation (Bertsekas, Tesauro), with candidates cut to a small set and playouts truncated to raise the sample count. Kill criterion proposed by the census: if rollout does not beat its own base script with an interval that excludes 50% at the budget actually played, stop and try flexible-horizon evolutionary MCTS or non-exploring MCTS with truncated evaluation.
