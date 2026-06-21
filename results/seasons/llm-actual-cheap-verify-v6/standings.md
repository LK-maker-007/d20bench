# llm-actual-cheap-verify-v6 LLM Elo Smoke Season

Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after stricter repair prompts list only the current exact legal action ids.

Generated: 2026-06-21T22:08:14.006Z
Completed: 2026-06-21T22:18:43.672Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 16/16 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1163.3 | 16 | 15-0-1 | 15.5 |
| 2 | openrouter:mistralai/ministral-8b-2512 | 970.2 | 4 | 0-3-1 | 0.5 |
| 3 | openrouter:qwen/qwen3.5-flash-02-23 | 959.7 | 4 | 0-4-0 | 0.0 |
| 4 | openrouter:meta-llama/llama-3.1-8b-instruct | 956.5 | 4 | 0-4-0 | 0.0 |
| 5 | openrouter:deepseek/deepseek-v4-flash | 950.3 | 4 | 0-4-0 | 0.0 |

## Cost Summary

Estimated total cost: $0.818008
LLM decisions: 578
Tokens: 9188642 total (9024116 prompt, 164526 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 160 | 2635045 | 8936 | 2643981 | $0.396597 |
| openrouter:deepseek/deepseek-v4-flash | 133 | 2167157 | 7637 | 2174794 | $0.196419 |
| openrouter:qwen/qwen3.5-flash-02-23 | 151 | 2295541 | 142678 | 2438219 | $0.186306 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 134 | 1926373 | 5275 | 1931648 | $0.038686 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 33 | $0.050298 | `c2bcd0cf2726` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 26 | $0.042717 | `fcd31930f0f9` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 42 | $0.107490 | `dacf5e7ad074` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 46 | $0.118697 | `6751b0c3ede0` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 33 | $0.009655 | `137a580f2e6e` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 22 | $0.006348 | `afc6c594facd` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 37 | $0.044253 | `44dfec5795b5` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 31 | $0.045469 | `f2fdd47b84d7` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 41 | $0.057657 | `72300c051751` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 33 | $0.045747 | `c64cca6f9c0b` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 36 | $0.087304 | `31e3dfee2028` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | draw | 36 | $0.083106 | `32f9e0f9a53e` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 43 | $0.012336 | `51be3866dcef` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 36 | $0.010346 | `e9572a53568d` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 46 | $0.053602 | `3cef23d91254` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 37 | $0.042983 | `d841148477c7` |

