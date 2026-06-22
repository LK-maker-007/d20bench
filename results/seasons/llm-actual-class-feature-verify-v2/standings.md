# llm-actual-class-feature-verify-v2 LLM Elo Smoke Season

Focused delegate-free actual-action validation for Paladin Sacred Weapon and Monk Superior Defense after marking setup class-feature actions explicitly in the LLM observation.

Generated: 2026-06-22T13:58:38.434Z
Completed: 2026-06-22T13:59:24.690Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 1
Initial rating: 1000
K-factor: 32
Matches: 8/8 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | openrouter:deepseek/deepseek-v4-flash | 1016.0 | 2 | 1-0-1 | 1.5 |
| 2 | openrouter:mistralai/ministral-8b-2512 | 1015.3 | 2 | 1-0-1 | 1.5 |
| 3 | openrouter:meta-llama/llama-3.1-8b-instruct | 1014.6 | 2 | 1-0-1 | 1.5 |
| 4 | openrouter:qwen/qwen3.5-flash-02-23 | 1013.9 | 2 | 1-0-1 | 1.5 |
| 5 | battlecast.aggressive | 940.3 | 8 | 0-4-4 | 2.0 |

## Cost Summary

Estimated total cost: $0.022707
LLM decisions: 53
Tokens: 251887 total (243500 prompt, 8387 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 15 | 73281 | 747 | 74028 | $0.011104 |
| openrouter:qwen/qwen3.5-flash-02-23 | 12 | 54341 | 6500 | 60841 | $0.005222 |
| openrouter:deepseek/deepseek-v4-flash | 12 | 56182 | 643 | 56825 | $0.005172 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 14 | 59696 | 497 | 60193 | $0.001209 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| hidden.llm-sacred-weapon-paladin-duel.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.aggressive | hidden.llm-sacred-weapon-paladin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.aggressive | draw | 4 | $0.002014 | `2b910e660c63` |
| hidden.llm-sacred-weapon-paladin-duel.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.aggressive | hidden.llm-sacred-weapon-paladin-duel.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.aggressive | draw | 9 | $0.007219 | `3a3fa8c7bb58` |
| hidden.llm-sacred-weapon-paladin-duel.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.aggressive | hidden.llm-sacred-weapon-paladin-duel.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.aggressive | draw | 5 | $0.000508 | `962733dd3e2a` |
| hidden.llm-sacred-weapon-paladin-duel.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.aggressive | hidden.llm-sacred-weapon-paladin-duel.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.aggressive | draw | 4 | $0.001919 | `72e41ab6cb0e` |
| hidden.llm-superior-defense-monk-duel.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.aggressive | hidden.llm-superior-defense-monk-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.aggressive | red | 8 | $0.003158 | `858c3d95a95e` |
| hidden.llm-superior-defense-monk-duel.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.aggressive | hidden.llm-superior-defense-monk-duel.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.aggressive | red | 6 | $0.003886 | `c90c1a70def3` |
| hidden.llm-superior-defense-monk-duel.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.aggressive | hidden.llm-superior-defense-monk-duel.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.aggressive | red | 9 | $0.000700 | `6300ae0e1025` |
| hidden.llm-superior-defense-monk-duel.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.aggressive | hidden.llm-superior-defense-monk-duel.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.aggressive | red | 8 | $0.003303 | `d4606cd405aa` |
