# llm-actual-cheap-verify-v5 LLM Elo Smoke Season

Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart, rerun after widening actual-actions-v1 with stepwise class features, directional AoE, and target-level random monster rays.

Generated: 2026-06-21T21:53:34.985Z
Completed: 2026-06-21T22:05:45.147Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 15/16 completed, 1 failed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1150.9 | 15 | 14-1-0 | 14.0 |
| 2 | openrouter:mistralai/ministral-8b-2512 | 981.9 | 4 | 1-3-0 | 1.0 |
| 3 | openrouter:qwen/qwen3.5-flash-02-23 | 965.4 | 3 | 0-3-0 | 0.0 |
| 4 | openrouter:meta-llama/llama-3.1-8b-instruct | 953.7 | 4 | 0-4-0 | 0.0 |
| 5 | openrouter:deepseek/deepseek-v4-flash | 948.3 | 4 | 0-4-0 | 0.0 |

## Cost Summary

Estimated total cost: $0.722506
LLM decisions: 507
Tokens: 8098590 total (7980080 prompt, 118510 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 153 | 2505135 | 8553 | 2513688 | $0.377053 |
| openrouter:deepseek/deepseek-v4-flash | 119 | 1924946 | 7057 | 1932003 | $0.174515 |
| openrouter:qwen/qwen3.5-flash-02-23 | 105 | 1652880 | 97698 | 1750578 | $0.132839 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 130 | 1897119 | 5202 | 1902321 | $0.038098 |

## Failed Matches

| Index | Scenario | Seed | Red | Blue | Error |
| ---: | --- | --- | --- | --- | --- |
| 15 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | OpenRouter tool call did not produce a legal action after 2 attempt(s): OpenRouter response for qwen/qwen3.5-flash-02-23 did not include parseable action JSON. Message: {"role":"assistant","content":null,"refusal":null,"reasoning":"Alright, this is my 6th turn in round 2 as the blue Bard. I just used Dissonant Whispers (a 1st-level spell that forced the Fighter to take 8 psychic damage) and Bardic Inspiration on them, and moved to (10,9). I still have 10 speed left.\n\nLooking at the situation:\n- I'm at (10,9)\n- The Fighter L5 (red) is at (11,9), which is adjacent to me\n- The Cleric is at (3,9) - far away\n- The Bard L5 (red) is at (2,7) - far away\n- The Warlock L5 (red) is at (2,10) - far away\n\nThe Fighter just got hit with Dissonant Whispers for 8 damage and failed his save. He's likely running away from me (that's what the spell does - they make a . Error: model selected non-legal actionId: move_toward:fighter-l5-red-0-a4b5 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 31 | $0.046184 | `91fb1f24a84e` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 28 | $0.044470 | `a1a742b00321` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 33 | $0.082730 | `fadc14781bc2` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | blue | 47 | $0.120274 | `6f296fdbbb30` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 23 | $0.007128 | `1fc0cf83c19f` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 27 | $0.007864 | `a6038df3d0eb` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 37 | $0.046756 | `72c7e9abd8ab` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 24 | $0.033013 | `b4b6b055ba8f` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 34 | $0.048130 | `80bf2ee32963` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 26 | $0.035731 | `bc25b7900f7a` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 51 | $0.121603 | `27105e2aaa6e` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 22 | $0.052446 | `8bdc2c96a981` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 42 | $0.012205 | `02b177ef4fce` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 38 | $0.010902 | `d5c85d96ef04` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 44 | $0.053069 | `4a4448b3f591` |

