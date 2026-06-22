# llm-actual-cheap-verify-v12 LLM Elo Smoke Season

Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after filtering no-progress move_toward actions from actual-actions-v1.

Generated: 2026-06-22T16:56:03.596Z
Completed: 2026-06-22T16:56:03.830Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 16/16 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1151.6 | 16 | 15-1-0 | 15.0 |
| 2 | openrouter:mistralai/ministral-8b-2512 | 983.7 | 4 | 1-3-0 | 1.0 |
| 3 | openrouter:qwen/qwen3.5-flash-02-23 | 958.9 | 4 | 0-4-0 | 0.0 |
| 4 | openrouter:meta-llama/llama-3.1-8b-instruct | 955.5 | 4 | 0-4-0 | 0.0 |
| 5 | openrouter:deepseek/deepseek-v4-flash | 950.3 | 4 | 0-4-0 | 0.0 |

## Cost Summary

Estimated total cost: $0.838062
LLM decisions: 591
Tokens: 9320995 total (9156816 prompt, 164179 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 178 | 2893194 | 5858 | 2899052 | $0.434858 |
| openrouter:qwen/qwen3.5-flash-02-23 | 164 | 2484570 | 147710 | 2632280 | $0.199902 |
| openrouter:deepseek/deepseek-v4-flash | 112 | 1806165 | 6479 | 1812644 | $0.163721 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 137 | 1972887 | 4132 | 1977019 | $0.039582 |

## Harness Audit

Model turn starts: 724
Model action resolutions: 724
Model delegate legal-action exposures: 0
Model delegate selections: 0
Stepwise model turns: 146 (519 post-action continuations, max 10 actions in one turn)
Tool-call decisions: 520 (71 JSON fallbacks, 1 repair attempts)
No-log movement actions: 0
Invalid action applications: 0

| Accepted Action Key | Count |
| --- | ---: |
| end_turn | 163 |
| move_to | 108 |
| move_toward | 99 |
| attack:Javelin | 59 |
| attack:Eldritch Blast | 32 |
| attack:Longbow | 30 |
| spell:Healing Word | 24 |
| spell:Hunter's Mark | 20 |
| dash | 15 |
| spell:Scorching Ray | 14 |
| spell:Cure Wounds | 12 |
| attack:Longsword | 11 |
| spell:Hex | 11 |
| spell:Shield of Faith | 11 |
| spell:Lay on Hands | 10 |
| spell:Second Wind | 10 |
| reaction:cutting_words_attack | 9 |
| attack:Shortbow | 8 |
| class_feature:action_surge | 8 |
| reaction:cutting_words_damage | 7 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 26 | $0.040791 | `e269d7a55f64` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 23 | $0.037402 | `40e842247ec5` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 34 | $0.086507 | `2e24cd054f0a` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 50 | $0.128822 | `62158afe9575` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 29 | $0.008768 | `02f12b69d762` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 26 | $0.007661 | `e39900a2f13b` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 30 | $0.037000 | `1d7e5c3a87aa` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 42 | $0.054810 | `dabe0e715f72` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 24 | $0.033052 | `0ff030edddcb` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 39 | $0.052476 | `627940d9c816` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | red | 53 | $0.124374 | `2153c374f86e` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 41 | $0.095155 | `52733e99eb34` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 49 | $0.013953 | `01c2b149354b` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 33 | $0.009200 | `a997d402c967` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 53 | $0.062282 | `47e806a0a640` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 39 | $0.045811 | `684a0f1abaed` |

