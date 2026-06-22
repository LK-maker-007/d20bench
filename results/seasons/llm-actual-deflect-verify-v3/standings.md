# llm-actual-deflect-verify-v3 LLM Elo Smoke Season

Focused delegate-free actual-action validation where cheap OpenRouter models control trigger-time Monk Deflect and Superior Hunter's Defense reactions.

Generated: 2026-06-22T12:49:50.797Z
Completed: 2026-06-22T12:50:23.187Z
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

Estimated total cost: $0.022158
LLM decisions: 53
Tokens: 252891 total (244181 prompt, 8710 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 14 | 66445 | 738 | 67183 | $0.010077 |
| openrouter:deepseek/deepseek-v4-flash | 12 | 60545 | 671 | 61216 | $0.005570 |
| openrouter:qwen/qwen3.5-flash-02-23 | 12 | 53264 | 6743 | 60007 | $0.005215 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 15 | 63927 | 558 | 64485 | $0.001295 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_deepseek_deepseek-v4-flash | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:deepseek/deepseek-v4-flash | red | 5 | $0.001754 | `02bf2c98bbe8` |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_mistralai_ministral-8b-2512 | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:mistralai/ministral-8b-2512 | red | 7 | $0.004024 | `0e0fe9f4cf77` |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_meta-llama_llama-3.1-8b-instruct | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:meta-llama/llama-3.1-8b-instruct | red | 8 | $0.000552 | `649da57ec835` |
| hidden.llm-mitigation-monk-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_qwen_qwen3.5-flash-02-23 | hidden.llm-mitigation-monk-duel.v1 | 1 | battlecast.aggressive | openrouter:qwen/qwen3.5-flash-02-23 | red | 7 | $0.002722 | `9d9ab252c828` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_deepseek_deepseek-v4-flash | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:deepseek/deepseek-v4-flash | red | 7 | $0.003816 | `2f72383efbb6` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_mistralai_ministral-8b-2512 | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:mistralai/ministral-8b-2512 | red | 7 | $0.006053 | `358ea4f0e240` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_meta-llama_llama-3.1-8b-instruct | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:meta-llama/llama-3.1-8b-instruct | red | 7 | $0.000743 | `0f6d4d953a5e` |
| hidden.llm-mitigation-ranger-duel.v1__actual-actions-v1__1__battlecast.aggressive__openrouter_qwen_qwen3.5-flash-02-23 | hidden.llm-mitigation-ranger-duel.v1 | 1 | battlecast.aggressive | openrouter:qwen/qwen3.5-flash-02-23 | red | 5 | $0.002494 | `add0f40b46a5` |
