# llm-actual-cheap-round-robin-v2 LLM Elo Smoke Season

Delegate-free actual-action round robin for the four cheap OpenRouter models and Battlecast Smart, with four fixtures per unordered matchup and four combat rounds per match.

Generated: 2026-06-22T17:43:22.618Z
Completed: 2026-06-22T18:47:17.373Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 4
Initial rating: 1000
K-factor: 32
Matches: 40/40 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1130.0 | 16 | 14-2-0 | 14.0 |
| 2 | openrouter:deepseek/deepseek-v4-flash | 1036.3 | 16 | 10-6-0 | 10.0 |
| 3 | openrouter:mistralai/ministral-8b-2512 | 983.6 | 16 | 7-9-0 | 7.0 |
| 4 | openrouter:qwen/qwen3.5-flash-02-23 | 971.0 | 16 | 7-9-0 | 7.0 |
| 5 | openrouter:meta-llama/llama-3.1-8b-instruct | 879.1 | 16 | 2-14-0 | 2.0 |

## Cost Summary

Estimated total cost: $5.103671
LLM decisions: 3649
Tokens: 56423333 total (55349247 prompt, 1074086 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 1008 | 15908704 | 33216 | 15941920 | $2.391288 |
| openrouter:deepseek/deepseek-v4-flash | 921 | 14412396 | 54547 | 14466943 | $1.306934 |
| openrouter:qwen/qwen3.5-flash-02-23 | 981 | 14535978 | 961640 | 15497618 | $1.194865 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 739 | 10492169 | 24683 | 10516852 | $0.210584 |

## Harness Audit

Model turn starts: 4322
Model action resolutions: 4322
Model delegate legal-action exposures: 0
Model delegate selections: 0
Stepwise model turns: 826 (3005 post-action continuations, max 10 actions in one turn)
Tool-call decisions: 3150 (499 JSON fallbacks, 13 repair attempts)
No-log movement actions: 0
Invalid action applications: 0
Model action-space turn starts: actual-actions-v1=4322

| Accepted Action Key | Count |
| --- | ---: |
| end_turn | 872 |
| move_to | 729 |
| move_toward | 522 |
| attack:Javelin | 299 |
| reaction:opportunity_attack | 261 |
| attack:Longbow | 187 |
| spell:Healing Word | 180 |
| attack:Eldritch Blast | 147 |
| attack:Longsword | 105 |
| spell:Hunter's Mark | 87 |
| spell:Scorching Ray | 66 |
| spell:Shield of Faith | 64 |
| dash | 53 |
| reaction:decline | 50 |
| spell:Second Wind | 42 |
| spell:Hex | 41 |
| spell:Lay on Hands | 39 |
| attack:Shortbow | 38 |
| spell:Guiding Bolt | 33 |
| class_feature:action_surge | 32 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:mistralai/ministral-8b-2512 | red | 104 | $0.192107 | `b718b2a8c9dd` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:meta-llama/llama-3.1-8b-instruct | red | 94 | $0.097135 | `9932b63fb8ab` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:qwen/qwen3.5-flash-02-23 | blue | 115 | $0.157910 | `ffe7bb5e992f` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 47 | $0.068637 | `8fd77aa9975f` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:deepseek/deepseek-v4-flash | blue | 122 | $0.237400 | `8c8a964d45a6` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:meta-llama/llama-3.1-8b-instruct | red | 117 | $0.165557 | `d45a4d26f05d` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:qwen/qwen3.5-flash-02-23 | blue | 128 | $0.226805 | `24fc8ec42d72` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 48 | $0.119390 | `81762f3acf01` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:deepseek/deepseek-v4-flash | blue | 91 | $0.099422 | `5061249d2607` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:mistralai/ministral-8b-2512 | blue | 112 | $0.174250 | `ae431e76afe2` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:qwen/qwen3.5-flash-02-23 | blue | 111 | $0.094764 | `1205b123eab9` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 23 | $0.006485 | `3dca3bb7e8d0` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-flash | blue | 111 | $0.154508 | `6a7712c1df01` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:mistralai/ministral-8b-2512 | blue | 130 | $0.243089 | `5e0e8492cdbc` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:meta-llama/llama-3.1-8b-instruct | red | 113 | $0.095028 | `ba363ee2f4f8` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 39 | $0.055334 | `84eb40efbf65` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 16 | $0.024925 | `f3c53b829223` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 61 | $0.158301 | `531d0d896ec1` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 27 | $0.007796 | `77d3811bddf2` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 19 | $0.025553 | `b29ae61759b9` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:mistralai/ministral-8b-2512 | red | 90 | $0.151785 | `09f83ed429ae` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:meta-llama/llama-3.1-8b-instruct | red | 129 | $0.114463 | `a4fa269261c8` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:qwen/qwen3.5-flash-02-23 | red | 147 | $0.182572 | `b1ef33657151` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | red | 64 | $0.089943 | `3228e3aef3a2` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:deepseek/deepseek-v4-flash | red | 139 | $0.265219 | `a292b445d05d` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:meta-llama/llama-3.1-8b-instruct | red | 124 | $0.185073 | `de094ca7324d` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:qwen/qwen3.5-flash-02-23 | blue | 167 | $0.305653 | `b4da31a443a5` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | red | 76 | $0.179027 | `f8d1d9e8e205` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:deepseek/deepseek-v4-flash | red | 108 | $0.082636 | `4083b65e6ef0` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:mistralai/ministral-8b-2512 | blue | 148 | $0.204738 | `9bc466e4adf0` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:qwen/qwen3.5-flash-02-23 | red | 129 | $0.091366 | `91a2a5aa8c57` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 59 | $0.016861 | `fa33478cb491` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-flash | blue | 135 | $0.171084 | `05bc8e79022e` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:mistralai/ministral-8b-2512 | red | 157 | $0.258534 | `69ab06d41d19` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:meta-llama/llama-3.1-8b-instruct | red | 113 | $0.091031 | `e86bdc8a4ae0` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 64 | $0.079189 | `dd0495a1cd77` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 37 | $0.051097 | `68483670d0fc` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 41 | $0.095660 | `0c294765f8b4` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 36 | $0.010013 | `cf2b72db2a70` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 58 | $0.073331 | `741a1653574e` |

