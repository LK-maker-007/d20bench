# llm-actual-spell-followup-verify-v1 LLM Elo Smoke Season

Focused delegate-free actual-action validation where cheap OpenRouter models control maintained Witch Bolt damage, Hex retargeting, and Swallow as concrete follow-up actions from seeded hidden states.

Generated: 2026-06-22T16:10:16.879Z
Completed: 2026-06-22T16:10:17.032Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 2
Initial rating: 1000
K-factor: 32
Matches: 12/12 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | openrouter:deepseek/deepseek-v4-flash | 1013.3 | 3 | 2-1-0 | 2.0 |
| 2 | openrouter:mistralai/ministral-8b-2512 | 1012.7 | 3 | 2-1-0 | 2.0 |
| 3 | openrouter:meta-llama/llama-3.1-8b-instruct | 1012.1 | 3 | 2-1-0 | 2.0 |
| 4 | openrouter:qwen/qwen3.5-flash-02-23 | 1011.6 | 3 | 2-1-0 | 2.0 |
| 5 | battlecast.aggressive | 950.3 | 12 | 4-8-0 | 4.0 |

## Cost Summary

Estimated total cost: $0.022113
LLM decisions: 61
Tokens: 231874 total (216764 prompt, 15110 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 17 | 63227 | 438 | 63665 | $0.009550 |
| openrouter:qwen/qwen3.5-flash-02-23 | 22 | 78815 | 13823 | 92638 | $0.008717 |
| openrouter:deepseek/deepseek-v4-flash | 9 | 32049 | 556 | 32605 | $0.002984 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 13 | 42673 | 293 | 42966 | $0.000862 |

## Harness Audit

Model turn starts: 64
Model action resolutions: 64
Model delegate legal-action exposures: 0
Model delegate selections: 0
Stepwise model turns: 18 (44 post-action continuations, max 8 actions in one turn)
Tool-call decisions: 57 (4 JSON fallbacks, 1 repair attempts)

| Accepted Action Key | Count |
| --- | ---: |
| move_to | 23 |
| end_turn | 17 |
| move_toward | 6 |
| spell_retarget:hex | 4 |
| dash | 3 |
| dodge | 3 |
| linked_bonus_damage:witch-bolt | 3 |
| spell:Swallow | 3 |
| help | 2 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| hidden.llm-linked-damage-witch-bolt.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.aggressive | hidden.llm-linked-damage-witch-bolt.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.aggressive | red | 2 | $0.000467 | `4b0741917e0d` |
| hidden.llm-linked-damage-witch-bolt.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.aggressive | hidden.llm-linked-damage-witch-bolt.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.aggressive | red | 2 | $0.000703 | `f8052a780f1f` |
| hidden.llm-linked-damage-witch-bolt.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.aggressive | hidden.llm-linked-damage-witch-bolt.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.aggressive | red | 2 | $0.000093 | `52277ef23b5a` |
| hidden.llm-linked-damage-witch-bolt.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.aggressive | hidden.llm-linked-damage-witch-bolt.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.aggressive | red | 2 | $0.000563 | `f8052a780f1f` |
| hidden.llm-hex-retarget.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.aggressive | hidden.llm-hex-retarget.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.aggressive | blue | 4 | $0.001424 | `b18ed22a468e` |
| hidden.llm-hex-retarget.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.aggressive | hidden.llm-hex-retarget.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.aggressive | blue | 7 | $0.004096 | `c9d739d0f6da` |
| hidden.llm-hex-retarget.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.aggressive | hidden.llm-hex-retarget.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.aggressive | blue | 5 | $0.000349 | `0a202d6e5589` |
| hidden.llm-hex-retarget.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.aggressive | hidden.llm-hex-retarget.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.aggressive | blue | 6 | $0.002617 | `ba80b7b36ff4` |
| hidden.llm-swallow-purple-worm.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.aggressive | hidden.llm-swallow-purple-worm.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.aggressive | red | 3 | $0.001094 | `003a45a10b87` |
| hidden.llm-swallow-purple-worm.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.aggressive | hidden.llm-swallow-purple-worm.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.aggressive | red | 8 | $0.004750 | `7c6705ec05db` |
| hidden.llm-swallow-purple-worm.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.aggressive | hidden.llm-swallow-purple-worm.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.aggressive | red | 6 | $0.000420 | `7e86ca58d3ae` |
| hidden.llm-swallow-purple-worm.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.aggressive | hidden.llm-swallow-purple-worm.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.aggressive | red | 14 | $0.005537 | `78c08abfa199` |

