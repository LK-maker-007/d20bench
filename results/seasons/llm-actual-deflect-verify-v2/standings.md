# llm-actual-deflect-verify-v2 LLM Elo Smoke Season

Focused delegate-free actual-action validation where cheap OpenRouter models control trigger-time Monk Deflect and Superior Hunter's Defense reactions.

Generated: 2026-06-22T12:45:30.791Z
Completed: 2026-06-22T12:46:10.530Z
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

Estimated total cost: $0.020260
LLM decisions: 46
Tokens: 222596 total (214565 prompt, 8031 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 14 | 66790 | 751 | 67541 | $0.010131 |
| openrouter:qwen/qwen3.5-flash-02-23 | 12 | 55130 | 6257 | 61387 | $0.005210 |
| openrouter:deepseek/deepseek-v4-flash | 9 | 42034 | 616 | 42650 | $0.003894 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 11 | 50611 | 407 | 51018 | $0.001024 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_deepseek_deepseek-v4-flash | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:deepseek/deepseek-v4-flash | red | 5 | $0.001764 | `02bf2c98bbe8` |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_mistralai_ministral-8b-2512 | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:mistralai/ministral-8b-2512 | red | 7 | $0.004027 | `0e0fe9f4cf77` |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_meta-llama_llama-3.1-8b-instruct | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:meta-llama/llama-3.1-8b-instruct | red | 4 | $0.000281 | `c1a562908a89` |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_qwen_qwen3.5-flash-02-23 | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:qwen/qwen3.5-flash-02-23 | red | 6 | $0.002256 | `e886b7088c79` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_deepseek_deepseek-v4-flash | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:deepseek/deepseek-v4-flash | red | 4 | $0.002130 | `874606e019f5` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_mistralai_ministral-8b-2512 | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:mistralai/ministral-8b-2512 | red | 7 | $0.006105 | `b06c3188795a` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_meta-llama_llama-3.1-8b-instruct | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:meta-llama/llama-3.1-8b-instruct | red | 7 | $0.000743 | `bfa62215b3b9` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_qwen_qwen3.5-flash-02-23 | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:qwen/qwen3.5-flash-02-23 | red | 6 | $0.002954 | `26dfe6b5e897` |

