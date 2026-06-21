# llm-toolcall-cheap-verify-v3 LLM Elo Smoke Season

Tool-call reliability verification season for the cheap model trio against Battlecast Smart on the chokepoint and status-pressure hero-party mirrors.

Generated: 2026-06-21T01:32:45.278Z
Completed: 2026-06-21T01:34:03.144Z
LLM action space: battlecast-full-turn
Concurrency: 6
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 12/12 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1097.4 | 12 | 10-2-0 | 10.0 |
| 2 | openrouter:qwen/qwen3.5-flash-02-23 | 979.0 | 4 | 1-3-0 | 1.0 |
| 3 | openrouter:mistralai/ministral-8b-2512 | 975.4 | 4 | 1-3-0 | 1.0 |
| 4 | openrouter:meta-llama/llama-3.1-8b-instruct | 948.2 | 4 | 0-4-0 | 0.0 |

## Cost Summary

Estimated total cost: $0.130153
LLM decisions: 106
Tokens: 1596341 total (1559498 prompt, 36843 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:mistralai/ministral-8b-2512 | 31 | 485540 | 1582 | 487122 | $0.073068 |
| openrouter:qwen/qwen3.5-flash-02-23 | 41 | 596069 | 33587 | 629656 | $0.047477 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 34 | 477889 | 1674 | 479563 | $0.009608 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 7 | $0.016417 | `d417c6848262` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 4 | $0.009430 | `c0c5af646ac2` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 9 | $0.002493 | `04c2e869bca2` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 5 | $0.001425 | `992357734aff` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | red | 12 | $0.013987 | `c8e0857deb13` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 7 | $0.008207 | `6d704196c03c` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | red | 12 | $0.028652 | `65841b764b26` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 8 | $0.018569 | `bfd359cf20e4` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 12 | $0.003447 | `66c54f32015e` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 8 | $0.002243 | `a02168a82a8f` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 12 | $0.013675 | `38cb66bcaedc` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 10 | $0.011608 | `97a780c5f4c3` |
