# llm-actual-glm-smart-4round-v1 LLM Elo Smoke Season

Small delegate-free actual-action check for GLM 5.2 against Battlecast Smart, with four combat rounds per match.

Generated: 2026-06-22T19:37:11.197Z
Completed: 2026-06-22T20:28:26.046Z
LLM action space: actual-actions-v1
Concurrency: 2
Max rounds: 4
Initial rating: 1000
K-factor: 32
Matches: 4/4 completed
Stopped: estimated cost reached $3.00

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1023.8 | 4 | 3-1-0 | 3.0 |
| 2 | openrouter:z-ai/glm-5.2 | 976.2 | 4 | 1-3-0 | 1.0 |

## Cost Summary

Estimated total cost: $3.034636
LLM decisions: 168
Tokens: 2683120 total (2490178 prompt, 192942 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:z-ai/glm-5.2 | 168 | 2490178 | 192942 | 2683120 | $3.034636 |

## Harness Audit

Model turn starts: 210
Model action resolutions: 210
Model delegate legal-action exposures: 0
Model delegate selections: 0
Stepwise model turns: 46 (142 post-action continuations, max 7 actions in one turn)
Tool-call decisions: 168 (0 JSON fallbacks, 1 repair attempts)
No-log movement actions: 0
Invalid action applications: 0
Model action-space turn starts: actual-actions-v1=210

| Accepted Action Key | Count |
| --- | ---: |
| end_turn | 58 |
| move_to | 27 |
| attack:Eldritch Blast | 14 |
| move_toward | 14 |
| spell:Healing Word | 11 |
| attack:Javelin | 10 |
| attack:Longbow | 10 |
| spell:Cure Wounds | 7 |
| reaction:cutting_words_attack | 6 |
| spell:Hunter's Mark | 5 |
| spell:Spiritual Weapon | 5 |
| attack:Longsword | 4 |
| spell:Aid | 4 |
| spell:Hex | 4 |
| spell:Lightning Bolt | 3 |
| class_feature:action_surge | 2 |
| reaction:cutting_words_damage | 2 |
| reaction:decline | 2 |
| spell:Bless | 2 |
| spell:Guiding Bolt | 2 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | battlecast.smart | blue | 32 | $0.577778 | `8adf812302d4` |
| public.hero-mirror-chokepoint-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:z-ai/glm-5.2 | red | 38 | $0.753086 | `adbb206983af` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | battlecast.smart | blue | 41 | $0.745905 | `191145f0f21f` |
| public.hero-mirror-status-l5.v1__actual-actions-v1__1__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:z-ai/glm-5.2 | blue | 57 | $0.957866 | `7881fb13542b` |

