# llm-actual-cheap-verify-v1 LLM Elo Smoke Season

Delegate-free actual-action harness verification for cheap OpenRouter models against Battlecast Smart. LLMs choose concrete movement, attacks, spells, healing, buffs, AoE, and end-turn actions step by step; Battlecast tactic delegates are not exposed.

Generated: 2026-06-21T20:07:51.782Z
Completed: 2026-06-21T20:20:10.220Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 15/16 completed, 1 failed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1116.9 | 15 | 13-2-0 | 13.0 |
| 2 | openrouter:mistralai/ministral-8b-2512 | 983.0 | 4 | 1-3-0 | 1.0 |
| 3 | openrouter:deepseek/deepseek-v4-flash | 981.5 | 4 | 1-3-0 | 1.0 |
| 4 | openrouter:meta-llama/llama-3.1-8b-instruct | 963.5 | 3 | 0-3-0 | 0.0 |
| 5 | openrouter:qwen/qwen3.5-flash-02-23 | 955.2 | 4 | 0-4-0 | 0.0 |

## Cost Summary

Estimated total cost: $0.935139
LLM decisions: 693
Tokens: 10019124 total (9838906 prompt, 180218 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 237 | 3518990 | 13112 | 3532102 | $0.529815 |
| openrouter:deepseek/deepseek-v4-flash | 141 | 2044989 | 8464 | 2053453 | $0.185573 |
| openrouter:qwen/qwen3.5-flash-02-23 | 151 | 2105467 | 151076 | 2256543 | $0.176135 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 164 | 2169460 | 7566 | 2177026 | $0.043616 |

## Failed Matches

| Index | Scenario | Seed | Red | Blue | Error |
| ---: | --- | --- | --- | --- | --- |
| 4 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | OpenRouter tool call did not produce a legal action after 2 attempt(s): OpenRouter response for meta-llama/llama-3.1-8b-instruct did not include parseable action JSON. Message: {"role":"assistant","content":"{\"actionId\": \"move_toward:paladin-l5-blue-0-jnq0\", \"rationale\": \"Move toward enemy Paladin L5 (blue) to engage in combat.\"}","refusal":null,"reasoning":null}. Error: OpenRouter response did not include tool_calls. |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 28 | $0.035891 | `460c53172fad` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 36 | $0.047989 | `82656258a55d` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 55 | $0.124755 | `16ef4f8a7b11` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 38 | $0.086187 | `417bf5d01272` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 27 | $0.007250 | `c0c81426268c` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 32 | $0.040364 | `5dff2313b08e` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 30 | $0.034411 | `81203f6ce5eb` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 41 | $0.053671 | `d623b9ea047b` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | blue | 36 | $0.048021 | `d54adc100ec9` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 76 | $0.169693 | `b7df2f7f9f93` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | blue | 68 | $0.149181 | `784927c643ef` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 81 | $0.021627 | `599c4a2f3be7` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 56 | $0.014739 | `ceacabd347d3` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 57 | $0.064299 | `1077bc26d720` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 32 | $0.037061 | `2c7c09895207` |
