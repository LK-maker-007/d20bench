# llm-toolcall-frontier-smart-16-v2 LLM Elo Smoke Season

Post-toolcall-fix frontier verification season for GPT-5.5 and Claude Opus 4.8 against Battlecast Smart, with sixteen matches per model.

Generated: 2026-06-21T07:40:05.283Z
Completed: 2026-06-21T09:57:17.300Z
LLM action space: battlecast-full-turn
Concurrency: 8
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 32/32 completed
Stopped: estimated cost reached $25.00

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1090.3 | 32 | 23-9-0 | 23.0 |
| 2 | openrouter:openai/gpt-5.5 | 1038.8 | 16 | 8-8-0 | 8.0 |
| 3 | openrouter:anthropic/claude-opus-4.8 | 870.8 | 16 | 1-15-0 | 1.0 |

## Cost Summary

Estimated total cost: $29.282645
LLM decisions: 300
Tokens: 5630128 total (5581164 prompt, 48964 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:anthropic/claude-opus-4.8 | 141 | 3368870 | 18419 | 3387289 | $17.304825 |
| openrouter:openai/gpt-5.5 | 159 | 2212294 | 30545 | 2242839 | $11.977820 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 9 | $1.100560 | `4c1ce5004e60` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 9 | $1.085995 | `b9cac7e930c0` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | blue | 6 | $0.452125 | `7a65882832b8` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | blue | 12 | $0.870340 | `afd8d97a17e6` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 4 | $0.482705 | `8881df478d02` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 12 | $1.435355 | `5ccb78d83224` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:openai/gpt-5.5 | battlecast.smart | blue | 2 | $0.144270 | `e7e145f6d9dd` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 11 | $0.813445 | `ba9daad1ebef` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__3__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 3 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 8 | $0.980720 | `f08b466289a8` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__3__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-chokepoint-l5.v1 | 3 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 4 | $0.479180 | `30a81e65a69e` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__3__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 3 | openrouter:openai/gpt-5.5 | battlecast.smart | red | 12 | $0.877850 | `577eb6b573a9` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__3__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 3 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 8 | $0.629045 | `02e4e764c596` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__4__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 4 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 7 | $0.836245 | `47e70fae837c` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__4__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-chokepoint-l5.v1 | 4 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 10 | $1.214675 | `b65df4db5f47` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__4__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 4 | openrouter:openai/gpt-5.5 | battlecast.smart | red | 12 | $0.869340 | `c46f6171a5ad` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__4__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 4 | battlecast.smart | openrouter:openai/gpt-5.5 | blue | 12 | $0.861645 | `f874efc4c31e` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 11 | $1.369950 | `f2433df4fb9d` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 10 | $1.251370 | `181e48b176c7` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | red | 12 | $0.916965 | `3950d078d669` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 9 | $0.698190 | `d4c911f57dea` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | red | 10 | $1.245505 | `8f8b73f3a64d` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 9 | $1.112465 | `b170cb8d2a8a` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:openai/gpt-5.5 | battlecast.smart | red | 11 | $0.830705 | `f2b62656ed8a` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 8 | $0.598545 | `a92e1d302a3e` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__3__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-status-l5.v1 | 3 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 8 | $0.986490 | `59172a8456f6` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__3__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-status-l5.v1 | 3 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 10 | $1.247865 | `10500cf84f18` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__3__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-status-l5.v1 | 3 | openrouter:openai/gpt-5.5 | battlecast.smart | red | 12 | $0.918965 | `4eb8dc3f7f5d` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__3__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 3 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 9 | $0.690395 | `8942d3dbcce5` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__4__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-status-l5.v1 | 4 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 10 | $1.248575 | `1494db61fb76` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__4__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-status-l5.v1 | 4 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 10 | $1.227170 | `c285ac6363d1` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__4__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-status-l5.v1 | 4 | openrouter:openai/gpt-5.5 | battlecast.smart | red | 11 | $0.871730 | `3ec2c684a23c` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__4__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 4 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 12 | $0.934265 | `6da26a506cb7` |
