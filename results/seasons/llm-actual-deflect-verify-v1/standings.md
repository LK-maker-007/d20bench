# llm-actual-deflect-verify-v1 LLM Elo Smoke Season

Focused delegate-free actual-action validation where cheap OpenRouter models control trigger-time Monk Deflect and Superior Hunter's Defense reactions.

Generated: 2026-06-22T12:42:01.397Z
Completed: 2026-06-22T12:43:02.436Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 1
Initial rating: 1000
K-factor: 32
Matches: 8/8 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.aggressive | 1107.0 | 8 | 8-0-0 | 8.0 |
| 2 | openrouter:qwen/qwen3.5-flash-02-23 | 975.0 | 2 | 0-2-0 | 0.0 |
| 3 | openrouter:meta-llama/llama-3.1-8b-instruct | 973.9 | 2 | 0-2-0 | 0.0 |
| 4 | openrouter:mistralai/ministral-8b-2512 | 972.7 | 2 | 0-2-0 | 0.0 |
| 5 | openrouter:deepseek/deepseek-v4-flash | 971.4 | 2 | 0-2-0 | 0.0 |

## Cost Summary

Estimated total cost: $0.021752
LLM decisions: 49
Tokens: 238907 total (227726 prompt, 11181 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 13 | 62304 | 664 | 62968 | $0.009445 |
| openrouter:deepseek/deepseek-v4-flash | 13 | 61202 | 735 | 61937 | $0.005640 |
| openrouter:qwen/qwen3.5-flash-02-23 | 10 | 47750 | 9304 | 57054 | $0.005523 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 13 | 56470 | 478 | 56948 | $0.001144 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_deepseek_deepseek-v4-flash | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:deepseek/deepseek-v4-flash | red | 7 | $0.002443 | `2d98c8f1398f` |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_mistralai_ministral-8b-2512 | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:mistralai/ministral-8b-2512 | red | 6 | $0.003392 | `2d96119c591c` |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_meta-llama_llama-3.1-8b-instruct | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:meta-llama/llama-3.1-8b-instruct | red | 7 | $0.000495 | `b894f263a2f4` |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_qwen_qwen3.5-flash-02-23 | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:qwen/qwen3.5-flash-02-23 | red | 4 | $0.001477 | `2453aa77b672` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_deepseek_deepseek-v4-flash | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:deepseek/deepseek-v4-flash | red | 6 | $0.003198 | `847176f56fe1` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_mistralai_ministral-8b-2512 | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:mistralai/ministral-8b-2512 | red | 7 | $0.006053 | `358ea4f0e240` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_meta-llama_llama-3.1-8b-instruct | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:meta-llama/llama-3.1-8b-instruct | red | 6 | $0.000649 | `22083e372188` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_qwen_qwen3.5-flash-02-23 | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:qwen/qwen3.5-flash-02-23 | red | 6 | $0.004046 | `376e9aeae0f7` |

