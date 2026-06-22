# llm-actual-cheap-verify-v11 LLM Elo Smoke Season

Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after exposing non-geometric multi-target saving throws such as Paladin Abjure Foes.

Generated: 2026-06-22T16:17:33.788Z
Completed: 2026-06-22T16:33:22.560Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 16/16 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1070.3 | 16 | 11-3-2 | 12.0 |
| 2 | openrouter:deepseek/deepseek-v4-flash | 1011.7 | 4 | 2-2-0 | 2.0 |
| 3 | openrouter:qwen/qwen3.5-flash-02-23 | 986.9 | 4 | 1-3-0 | 1.0 |
| 4 | openrouter:meta-llama/llama-3.1-8b-instruct | 967.0 | 4 | 0-3-1 | 0.5 |
| 5 | openrouter:mistralai/ministral-8b-2512 | 964.1 | 4 | 0-3-1 | 0.5 |

## Cost Summary

Estimated total cost: $0.905720
LLM decisions: 606
Tokens: 9603052 total (9409903 prompt, 193149 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 197 | 3174553 | 6574 | 3181127 | $0.477169 |
| openrouter:deepseek/deepseek-v4-flash | 138 | 2208235 | 8378 | 2216613 | $0.200249 |
| openrouter:qwen/qwen3.5-flash-02-23 | 148 | 2272448 | 174582 | 2447030 | $0.193100 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 123 | 1754667 | 3615 | 1758282 | $0.035202 |

## Harness Audit

Model turn starts: 732
Model action resolutions: 732
Model delegate legal-action exposures: 0
Model delegate selections: 0
Stepwise model turns: 150 (526 post-action continuations, max 12 actions in one turn)
Tool-call decisions: 560 (46 JSON fallbacks, 3 repair attempts)

| Accepted Action Key | Count |
| --- | ---: |
| end_turn | 156 |
| move_toward | 122 |
| move_to | 93 |
| attack:Javelin | 55 |
| spell:Healing Word | 36 |
| attack:Eldritch Blast | 32 |
| attack:Longbow | 22 |
| spell:Hunter's Mark | 18 |
| attack:Longsword | 15 |
| dash | 15 |
| reaction:cutting_words_attack | 12 |
| spell:Scorching Ray | 12 |
| spell:Cure Wounds | 11 |
| spell:Hex | 11 |
| spell:Shield of Faith | 11 |
| attack:Shortbow | 10 |
| reaction:cutting_words_damage | 9 |
| spell:Lay on Hands | 9 |
| class_feature:action_surge | 8 |
| spell:Aid | 7 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 25 | $0.036330 | `3f28fd3518c2` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 30 | $0.048777 | `7bb478d73dc1` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 42 | $0.103494 | `ec6fa58bf9d9` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 51 | $0.130550 | `a115406997a5` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 23 | $0.006891 | `65c56c859289` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 20 | $0.005698 | `69d450f840d2` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 25 | $0.035009 | `4154fada2026` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 22 | $0.031043 | `37750e5ffdfb` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | red | 42 | $0.059320 | `cf9d38ac8795` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | blue | 41 | $0.055823 | `a6b80e2b3071` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | draw | 65 | $0.153046 | `2e70a1519bd5` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 39 | $0.090080 | `49c7e6a54a57` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | draw | 49 | $0.013905 | `2a096d5df69f` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 31 | $0.008708 | `3e923d181a37` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 46 | $0.052913 | `fd5cb78cace9` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | blue | 55 | $0.074136 | `be0cb6d04a8a` |

