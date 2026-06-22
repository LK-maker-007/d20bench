# llm-actual-cheap-verify-v8 LLM Elo Smoke Season

Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after making Paladin Divine Smite an explicit post-hit action choice.

Generated: 2026-06-22T11:18:44.477Z
Completed: 2026-06-22T11:29:08.662Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 16/16 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1112.4 | 16 | 13-3-0 | 13.0 |
| 2 | openrouter:deepseek/deepseek-v4-flash | 1007.1 | 4 | 2-2-0 | 2.0 |
| 3 | openrouter:mistralai/ministral-8b-2512 | 977.2 | 4 | 1-3-0 | 1.0 |
| 4 | openrouter:qwen/qwen3.5-flash-02-23 | 953.7 | 4 | 0-4-0 | 0.0 |
| 5 | openrouter:meta-llama/llama-3.1-8b-instruct | 949.7 | 4 | 0-4-0 | 0.0 |

## Cost Summary

Estimated total cost: $0.729740
LLM decisions: 525
Tokens: 8274135 total (8153644 prompt, 120491 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 144 | 2353337 | 8024 | 2361361 | $0.354204 |
| openrouter:deepseek/deepseek-v4-flash | 133 | 2114938 | 7594 | 2122532 | $0.191711 |
| openrouter:qwen/qwen3.5-flash-02-23 | 123 | 1865966 | 100009 | 1965975 | $0.147290 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 125 | 1819403 | 4864 | 1824267 | $0.036534 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 29 | $0.042077 | `350c7ab15198` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | blue | 44 | $0.065253 | `19320bbbdc25` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 29 | $0.074111 | `c35b06caaa42` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 41 | $0.104468 | `8af480fbda67` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 25 | $0.007796 | `f7d75e40c9b4` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 24 | $0.007195 | `70c8ddf049cb` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 24 | $0.029587 | `8797ec91a0dd` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 18 | $0.022163 | `f3f523a8c460` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | red | 34 | $0.047186 | `dd37b14d6d5c` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 26 | $0.037196 | `77de9e28417c` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | red | 46 | $0.110089 | `345c8ab4bf05` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 28 | $0.065536 | `6917137a065c` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 39 | $0.011175 | `bddf38341608` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 37 | $0.010368 | `ac562ee2826e` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 45 | $0.054586 | `7ef4efd38f6c` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 36 | $0.040954 | `c9dd99e9099c` |

