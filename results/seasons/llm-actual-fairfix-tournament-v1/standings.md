# llm-actual-fairfix-tournament-v1 LLM Elo Smoke Season

Round robin for DeepSeek Flash, Qwen 3.5 Flash, and Battlecast Smart on the two public hero-party mirrors after the fairness fixes: visible win condition and round cap, grid geometry in the prompt, per-enemy distances, denser move_to menus, trigger-time LLM opportunity attacks against all Battlecast movers, decision failures costing a turn instead of the match, a wider log window, an 8192-token completion budget, and temperature 0.2.

Generated: 2026-07-03T15:59:52.279Z
Completed: 2026-07-03T19:07:44.960Z
LLM action space: actual-actions-v1
Concurrency: 4
Max rounds: 50
Initial rating: 1000
K-factor: 32
Matches: 12/12 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1042.9 | 8 | 6-2-0 | 6.0 |
| 2 | openrouter:deepseek/deepseek-v4-flash | 1009.5 | 8 | 4-4-0 | 4.0 |
| 3 | openrouter:qwen/qwen3.5-flash-02-23 | 947.6 | 8 | 2-6-0 | 2.0 |

## Cost Summary

Estimated total cost: $3.178921
LLM decisions: 1980
Tokens: 35844837 total (34172714 prompt, 1672123 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:deepseek/deepseek-v4-flash | 1227 | 21212037 | 91983 | 21304020 | $1.925640 |
| openrouter:qwen/qwen3.5-flash-02-23 | 753 | 12960677 | 1580140 | 14540817 | $1.253280 |

## Harness Audit

Model turn starts: 2360
Model action resolutions: 2360
Model delegate legal-action exposures: 0
Model delegate selections: 0
Stepwise model turns: 430 (1690 post-action continuations, max 10 actions in one turn)
Tool-call decisions: 1980 (0 JSON fallbacks, 21 repair attempts)
No-log movement actions: 0
Invalid action applications: 0
Model action-space turn starts: actual-actions-v1=2360

| Accepted Action Key | Count |
| --- | ---: |
| move_to | 827 |
| end_turn | 591 |
| attack:Eldritch Blast | 115 |
| attack:Longsword | 112 |
| move_toward | 80 |
| spell:Healing Word | 74 |
| attack:Javelin | 71 |
| attack:Longbow | 57 |
| reaction:opportunity_attack | 54 |
| attack:Shortbow | 23 |
| dodge | 22 |
| spell:Hunter's Mark | 21 |
| spell:Scorching Ray | 18 |
| spell:Second Wind | 17 |
| spell:Aid | 16 |
| spell:Lay on Hands | 16 |
| attack:Warhammer | 15 |
| spell:Hex | 15 |
| spell:Spiritual Weapon | 15 |
| dash | 13 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:qwen/qwen3.5-flash-02-23 | blue | 138 | $0.242986 | `1a42136a1b29` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 26 | $0.045857 | `2f8a49776a84` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-flash | blue | 157 | $0.240794 | `39023da3518a` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 38 | $0.079089 | `3a2433970363` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 79 | $0.143420 | `1c43971e9c33` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 30 | $0.044472 | `e6e4de48e7e4` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:qwen/qwen3.5-flash-02-23 | red | 280 | $0.421092 | `a3a014c91062` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 217 | $0.344799 | `caef076080f0` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-flash | blue | 436 | $0.696464 | `7705d0fcd91e` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | red | 252 | $0.392643 | `8cac1eec7c45` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | blue | 227 | $0.352421 | `51921ee6c68a` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 100 | $0.174885 | `d7aa163860ae` |

