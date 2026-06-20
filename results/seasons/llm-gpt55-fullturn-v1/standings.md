# llm-gpt55-fullturn-v1 LLM Elo Smoke Season

GPT-5.5 only: Battlecast full-turn delegate action space against random and copied Battlecast tactics, across the 6v6 goblin control and three level-5 4v4 hero-party mirrors.

Generated: 2026-06-20T20:24:11.918Z
Completed: 2026-06-20T20:34:58.678Z
LLM action space: battlecast-full-turn
Concurrency: 8
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 40/40 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1023.9 | 8 | 4-4-0 | 4.0 |
| 2 | openrouter:openai/gpt-5.5 | 1023.9 | 40 | 24-16-0 | 24.0 |
| 3 | battlecast.aggressive | 1018.3 | 8 | 4-4-0 | 4.0 |
| 4 | battlecast.defensive | 1016.5 | 8 | 4-4-0 | 4.0 |
| 5 | battlecast.kiting | 1012.4 | 8 | 4-4-0 | 4.0 |
| 6 | baseline.random-legal | 905.1 | 8 | 0-8-0 | 0.0 |

## Cost Summary

Estimated total cost: $13.200260
LLM decisions: 465
Tokens: 1634582 total (1433488 prompt, 201094 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:openai/gpt-5.5 | 465 | 1433488 | 201094 | 1634582 | $13.200260 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__baseline.random-legal | public.goblin-warband-6v6.v1 | 1 | openrouter:openai/gpt-5.5 | baseline.random-legal | red | 18 | $0.437580 | `c3a7ed7c7db1` |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__baseline.random-legal__openrouter_openai_gpt-5.5 | public.goblin-warband-6v6.v1 | 1 | baseline.random-legal | openrouter:openai/gpt-5.5 | blue | 16 | $0.420265 | `16236a94052a` |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.aggressive | public.goblin-warband-6v6.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.aggressive | blue | 12 | $0.338680 | `9b4df0f2c51a` |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__battlecast.aggressive__openrouter_openai_gpt-5.5 | public.goblin-warband-6v6.v1 | 1 | battlecast.aggressive | openrouter:openai/gpt-5.5 | blue | 16 | $0.391925 | `ea7c41e5276b` |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.smart | public.goblin-warband-6v6.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | red | 16 | $0.411970 | `b0ddd8ef778c` |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__battlecast.smart__openrouter_openai_gpt-5.5 | public.goblin-warband-6v6.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | blue | 15 | $0.374210 | `084d30c0ff8b` |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.kiting | public.goblin-warband-6v6.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.kiting | blue | 8 | $0.220720 | `abe962ba283b` |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__battlecast.kiting__openrouter_openai_gpt-5.5 | public.goblin-warband-6v6.v1 | 1 | battlecast.kiting | openrouter:openai/gpt-5.5 | red | 10 | $0.286675 | `12d25179f41e` |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.defensive | public.goblin-warband-6v6.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.defensive | blue | 8 | $0.222385 | `fd1b0a53f804` |
| public.goblin-warband-6v6.v1__battlecast-full-turn__1__battlecast.defensive__openrouter_openai_gpt-5.5 | public.goblin-warband-6v6.v1 | 1 | battlecast.defensive | openrouter:openai/gpt-5.5 | blue | 13 | $0.317520 | `082adc3cd5d5` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__baseline.random-legal | public.hero-mirror-balanced-l5.v1 | 1 | openrouter:openai/gpt-5.5 | baseline.random-legal | red | 12 | $0.256360 | `eae298994c52` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__baseline.random-legal__openrouter_openai_gpt-5.5 | public.hero-mirror-balanced-l5.v1 | 1 | baseline.random-legal | openrouter:openai/gpt-5.5 | blue | 12 | $0.298400 | `e63233f21a02` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.aggressive | public.hero-mirror-balanced-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.aggressive | blue | 10 | $0.238745 | `d94a7433fcb1` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__battlecast.aggressive__openrouter_openai_gpt-5.5 | public.hero-mirror-balanced-l5.v1 | 1 | battlecast.aggressive | openrouter:openai/gpt-5.5 | blue | 11 | $0.293445 | `68f14053cdf3` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-balanced-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | blue | 8 | $0.200790 | `9ca763fa427c` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-balanced-l5.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | blue | 12 | $0.328300 | `eea747023aeb` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.kiting | public.hero-mirror-balanced-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.kiting | blue | 10 | $0.271810 | `af00db024f43` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__battlecast.kiting__openrouter_openai_gpt-5.5 | public.hero-mirror-balanced-l5.v1 | 1 | battlecast.kiting | openrouter:openai/gpt-5.5 | blue | 12 | $0.294555 | `e9038222e3fe` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.defensive | public.hero-mirror-balanced-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.defensive | blue | 10 | $0.260320 | `4dd8a18fa175` |
| public.hero-mirror-balanced-l5.v1__battlecast-full-turn__1__battlecast.defensive__openrouter_openai_gpt-5.5 | public.hero-mirror-balanced-l5.v1 | 1 | battlecast.defensive | openrouter:openai/gpt-5.5 | blue | 12 | $0.330305 | `833022ef6578` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__baseline.random-legal | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:openai/gpt-5.5 | baseline.random-legal | red | 12 | $0.366655 | `91adad963c1e` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__baseline.random-legal__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 1 | baseline.random-legal | openrouter:openai/gpt-5.5 | blue | 12 | $0.368885 | `1f93e6dfe1aa` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.aggressive | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.aggressive | blue | 9 | $0.272845 | `996d13a14fb1` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.aggressive__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.aggressive | openrouter:openai/gpt-5.5 | blue | 12 | $0.376905 | `8626b0c9f8e1` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | blue | 8 | $0.238875 | `dc97f37beecc` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | blue | 11 | $0.337695 | `36b8bb6a3174` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.kiting | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.kiting | red | 11 | $0.339335 | `83abaf500f3f` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.kiting__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.kiting | openrouter:openai/gpt-5.5 | blue | 12 | $0.393785 | `3c3444b683d0` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.defensive | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.defensive | red | 11 | $0.329260 | `91b731d6dbe7` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.defensive__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.defensive | openrouter:openai/gpt-5.5 | blue | 12 | $0.384510 | `ff0186608388` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__baseline.random-legal | public.hero-mirror-status-l5.v1 | 1 | openrouter:openai/gpt-5.5 | baseline.random-legal | red | 12 | $0.364510 | `6cf66341500d` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__baseline.random-legal__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 1 | baseline.random-legal | openrouter:openai/gpt-5.5 | blue | 12 | $0.360660 | `a3d0f98e5af2` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.aggressive | public.hero-mirror-status-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.aggressive | red | 12 | $0.381580 | `3880c1be1ae1` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.aggressive__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 1 | battlecast.aggressive | openrouter:openai/gpt-5.5 | red | 10 | $0.328350 | `81e608975563` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | blue | 12 | $0.398060 | `7130b4c9c00b` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 11 | $0.340625 | `e4f9b85fb7cf` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.kiting | public.hero-mirror-status-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.kiting | red | 12 | $0.375680 | `0bb8b63222a0` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.kiting__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 1 | battlecast.kiting | openrouter:openai/gpt-5.5 | red | 11 | $0.343995 | `c8f42ea66e29` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.defensive | public.hero-mirror-status-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.defensive | blue | 12 | $0.382865 | `7fabca42cb57` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.defensive__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 1 | battlecast.defensive | openrouter:openai/gpt-5.5 | red | 10 | $0.320225 | `a4d117a100db` |

