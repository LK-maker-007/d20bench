# llm-actual-fairfix-tournament-v2 LLM Elo Smoke Season

Calibration round robin for DeepSeek Flash, Qwen 3.5 Flash, GLM 5.2, and Battlecast Smart on the two public hero-party mirrors with two seeds, after moving opportunity-attack prompts from predeclare to trigger-time snapshot/retry.

Generated: 2026-07-04T11:04:16.762Z
Completed: 2026-07-04T11:25:26.541Z
LLM action space: actual-actions-v1
Concurrency: 6
Max rounds: 50
Initial rating: 1000
K-factor: 32
Matches: 48/48 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | openrouter:z-ai/glm-5.2 | 1068.5 | 24 | 16-8-0 | 16.0 |
| 2 | battlecast.smart | 1047.1 | 24 | 15-9-0 | 15.0 |
| 3 | openrouter:deepseek/deepseek-v4-flash | 1014.2 | 24 | 13-11-0 | 13.0 |
| 4 | openrouter:qwen/qwen3.5-flash-02-23 | 870.2 | 24 | 4-20-0 | 4.0 |

## Cost Summary

Estimated total cost: $54.010541
LLM decisions: 7864
Tokens: 145538939 total (135020254 prompt, 10518685 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:z-ai/glm-5.2 | 2299 | 38508640 | 3352609 | 41861249 | $44.562661 |
| openrouter:deepseek/deepseek-v4-flash | 3054 | 53194441 | 230185 | 53424626 | $4.828933 |
| openrouter:qwen/qwen3.5-flash-02-23 | 2511 | 43317173 | 6935891 | 50253064 | $4.618948 |

## Harness Audit

Model turn starts: 9568
Model action resolutions: 9568
Model delegate legal-action exposures: 0
Model delegate selections: 0
Stepwise model turns: 1784 (6374 post-action continuations, max 12 actions in one turn)
Tool-call decisions: 7864 (0 JSON fallbacks, 92 repair attempts)
No-log movement actions: 0
Invalid action applications: 0
Model action-space turn starts: actual-actions-v1=9568

| Accepted Action Key | Count |
| --- | ---: |
| move_to | 2817 |
| end_turn | 2786 |
| attack:Longsword | 453 |
| attack:Eldritch Blast | 357 |
| spell:Healing Word | 333 |
| attack:Javelin | 300 |
| reaction:opportunity_attack | 292 |
| attack:Longbow | 275 |
| move_toward | 269 |
| spell:Hunter's Mark | 99 |
| spell:Lay on Hands | 92 |
| spell:Second Wind | 92 |
| spell:Scorching Ray | 86 |
| spell:Cure Wounds | 73 |
| spell:Spiritual Weapon | 73 |
| spell:Hex | 63 |
| attack:Shortbow | 60 |
| spell:Guiding Bolt | 56 |
| spell:Aid | 54 |
| dash | 51 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:qwen/qwen3.5-flash-02-23 | red | 148 | $0.219433 | `c5f8f2074820` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_z-ai_glm-5.2 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:z-ai/glm-5.2 | blue | 115 | $1.580419 | `c75688088753` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | red | 221 | $0.347403 | `7db3db7f9329` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-flash | blue | 153 | $0.251485 | `2065d90d4beb` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_z-ai_glm-5.2 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:z-ai/glm-5.2 | blue | 102 | $1.651293 | `fabf96ed1a9b` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 46 | $0.086320 | `29f92ae7e6e7` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_z-ai_glm-5.2__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:deepseek/deepseek-v4-flash | blue | 133 | $1.002399 | `fe86c93da2c4` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_z-ai_glm-5.2__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:qwen/qwen3.5-flash-02-23 | red | 250 | $3.172225 | `cd8e76345b1b` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | battlecast.smart | blue | 35 | $0.671818 | `66b0c24015d1` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 106 | $0.177621 | `aaa06c153d47` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 34 | $0.049268 | `c342e396aac3` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:z-ai/glm-5.2 | blue | 146 | $2.883911 | `70e8ead7452e` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__openrouter_deepseek_deepseek-v4-flash__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-flash | openrouter:qwen/qwen3.5-flash-02-23 | red | 164 | $0.296509 | `8d34754ee7cb` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__openrouter_deepseek_deepseek-v4-flash__openrouter_z-ai_glm-5.2 | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-flash | openrouter:z-ai/glm-5.2 | blue | 102 | $1.277723 | `deef160a4fee` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 16 | $0.029016 | `79790434529e` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-flash | blue | 182 | $0.273652 | `426753bdfdef` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__openrouter_qwen_qwen3.5-flash-02-23__openrouter_z-ai_glm-5.2 | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:z-ai/glm-5.2 | red | 157 | $1.244900 | `ce163ba343c5` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 17 | $0.022687 | `655366b9bbe4` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__openrouter_z-ai_glm-5.2__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:z-ai/glm-5.2 | openrouter:deepseek/deepseek-v4-flash | red | 141 | $1.833026 | `aef597a17898` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__openrouter_z-ai_glm-5.2__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:z-ai/glm-5.2 | openrouter:qwen/qwen3.5-flash-02-23 | red | 159 | $2.050810 | `206cc87c0711` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:z-ai/glm-5.2 | battlecast.smart | red | 128 | $2.560699 | `faff9ecccad2` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | blue | 78 | $0.137379 | `c9fc5cf1ecc8` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 31 | $0.086849 | `f8cbf503f310` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__2__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:z-ai/glm-5.2 | red | 22 | $0.436687 | `6122dcb9b346` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:qwen/qwen3.5-flash-02-23 | blue | 603 | $0.973326 | `456eed98998d` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_z-ai_glm-5.2 | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:z-ai/glm-5.2 | red | 176 | $0.966134 | `8a68d0a617c1` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 121 | $0.191354 | `86dda3f713f3` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-flash | blue | 353 | $0.531335 | `2141a5f61a2b` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_z-ai_glm-5.2 | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:z-ai/glm-5.2 | blue | 287 | $3.613970 | `d894af529ce9` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 143 | $0.209422 | `1079fd67567e` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_z-ai_glm-5.2__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:deepseek/deepseek-v4-flash | red | 231 | $2.700926 | `7436874af18c` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_z-ai_glm-5.2__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:qwen/qwen3.5-flash-02-23 | red | 173 | $1.999708 | `789aa9bb282b` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | battlecast.smart | red | 120 | $2.274936 | `557296454077` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 80 | $0.129339 | `d53ac6059953` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 187 | $0.280868 | `bae4a9ddeae7` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:z-ai/glm-5.2 | blue | 153 | $2.981352 | `bc094e186275` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__openrouter_deepseek_deepseek-v4-flash__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-flash | openrouter:qwen/qwen3.5-flash-02-23 | red | 285 | $0.442273 | `065368191015` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__openrouter_deepseek_deepseek-v4-flash__openrouter_z-ai_glm-5.2 | public.hero-mirror-status-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-flash | openrouter:z-ai/glm-5.2 | red | 237 | $2.022363 | `7f5d542ad731` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | red | 205 | $0.322678 | `76d653db0842` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 2 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-flash | red | 380 | $0.692141 | `e2c34dfb29c0` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__openrouter_qwen_qwen3.5-flash-02-23__openrouter_z-ai_glm-5.2 | public.hero-mirror-status-l5.v1 | 2 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:z-ai/glm-5.2 | red | 474 | $3.170819 | `015cf433025e` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 125 | $0.256144 | `58fb777e5f95` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__openrouter_z-ai_glm-5.2__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 2 | openrouter:z-ai/glm-5.2 | openrouter:deepseek/deepseek-v4-flash | red | 112 | $1.351607 | `99582e53a491` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__openrouter_z-ai_glm-5.2__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 2 | openrouter:z-ai/glm-5.2 | openrouter:qwen/qwen3.5-flash-02-23 | red | 254 | $3.057685 | `11c25b3ce1ed` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:z-ai/glm-5.2 | battlecast.smart | red | 71 | $1.348096 | `81b8724d63aa` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | blue | 229 | $0.350339 | `92de05a72c42` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 91 | $0.143862 | `9b134e62d6e7` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__2__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:z-ai/glm-5.2 | red | 88 | $1.656331 | `991c1fdf0bf3` |

