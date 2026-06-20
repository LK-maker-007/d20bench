# llm-frontier-smart-v1 LLM Elo Smoke Season

Public LLM ladder against only Battlecast Smart, using Battlecast full-turn delegate actions across the chokepoint and status-pressure level-5 4v4 hero-party mirrors, with two seeds for 8 matches per model.

Generated: 2026-06-20T21:43:50.152Z
Completed: 2026-06-20T22:02:16.618Z
LLM action space: battlecast-full-turn
Concurrency: 8
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 80/80 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1131.6 | 80 | 55-24-1 | 55.5 |
| 2 | openrouter:mistralai/ministral-8b-2512 | 1058.2 | 8 | 5-3-0 | 5.0 |
| 3 | openrouter:meta-llama/llama-3.1-8b-instruct | 1054.3 | 8 | 5-3-0 | 5.0 |
| 4 | openrouter:qwen/qwen3.5-flash-02-23 | 1036.1 | 8 | 4-4-0 | 4.0 |
| 5 | openrouter:google/gemini-3.1-pro-preview | 1023.4 | 8 | 4-4-0 | 4.0 |
| 6 | openrouter:deepseek/deepseek-v4-flash | 1014.5 | 8 | 3-5-0 | 3.0 |
| 7 | openrouter:openai/gpt-5.5 | 954.9 | 8 | 1-6-1 | 1.5 |
| 8 | openrouter:z-ai/glm-5.2 | 949.1 | 8 | 1-7-0 | 1.0 |
| 9 | openrouter:anthropic/claude-opus-4.8 | 937.3 | 8 | 1-7-0 | 1.0 |
| 10 | openrouter:deepseek/deepseek-v4-pro | 924.8 | 8 | 0-8-0 | 0.0 |
| 11 | openrouter:moonshotai/kimi-k2.7-code | 915.8 | 8 | 0-8-0 | 0.0 |

## Cost Summary

Estimated total cost: $19.300301
LLM decisions: 728
Tokens: 11625163 total (10964210 prompt, 660953 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:anthropic/claude-opus-4.8 | 67 | 1566218 | 5342 | 1571560 | $7.964640 |
| openrouter:openai/gpt-5.5 | 67 | 918970 | 38074 | 957044 | $5.737070 |
| openrouter:google/gemini-3.1-pro-preview | 77 | 1099230 | 35167 | 1134397 | $2.620464 |
| openrouter:z-ai/glm-5.2 | 74 | 1008211 | 49761 | 1057972 | $1.413873 |
| openrouter:moonshotai/kimi-k2.7-code | 60 | 822051 | 36801 | 858852 | $0.616037 |
| openrouter:deepseek/deepseek-v4-pro | 65 | 959300 | 33214 | 992514 | $0.446192 |
| openrouter:mistralai/ministral-8b-2512 | 87 | 1334462 | 3780 | 1338242 | $0.200736 |
| openrouter:qwen/qwen3.5-flash-02-23 | 73 | 1027861 | 422029 | 1449890 | $0.176539 |
| openrouter:deepseek/deepseek-v4-flash | 72 | 1060899 | 32165 | 1093064 | $0.101271 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 86 | 1167008 | 4620 | 1171628 | $0.023479 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 6 | $0.689550 | `ddb145f52723` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 4 | $0.470565 | `4283671320fb` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_google_gemini-3.1-pro-preview__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:google/gemini-3.1-pro-preview | battlecast.smart | red | 9 | $0.302510 | `65d3018d5dae` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_google_gemini-3.1-pro-preview | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:google/gemini-3.1-pro-preview | red | 5 | $0.173532 | `e4decc18002a` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | blue | 9 | $0.759985 | `e38f61577693` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 7 | $0.591960 | `65cae0e6dbc6` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_moonshotai_kimi-k2.7-code__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:moonshotai/kimi-k2.7-code | battlecast.smart | blue | 7 | $0.069222 | `ec94d101cdc7` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_moonshotai_kimi-k2.7-code | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:moonshotai/kimi-k2.7-code | red | 6 | $0.058983 | `dbcb707f4d9d` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | battlecast.smart | blue | 7 | $0.128761 | `6973b868a2f2` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:z-ai/glm-5.2 | red | 6 | $0.117986 | `7b6c40bb1280` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_deepseek_deepseek-v4-pro__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-pro | battlecast.smart | blue | 11 | $0.075299 | `00aaa70ce1fc` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_deepseek_deepseek-v4-pro | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-pro | red | 4 | $0.026963 | `6f1dc9552091` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 8 | $0.010630 | `d3b86eeac48a` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 7 | $0.009803 | `35bea63e90eb` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | red | 10 | $0.018983 | `d9e8a234dae4` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 5 | $0.009009 | `4e71844db0ca` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | red | 12 | $0.027210 | `07c567a6ba28` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | blue | 12 | $0.027374 | `cc434fbf1e0f` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | red | 12 | $0.003242 | `76faac79550d` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | blue | 12 | $0.003259 | `8da89229ec21` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 2 | $0.236560 | `ff0038fcc52d` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 12 | $1.407145 | `27d7ecd4a55b` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_google_gemini-3.1-pro-preview__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:google/gemini-3.1-pro-preview | battlecast.smart | blue | 8 | $0.274738 | `da75b4988523` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_google_gemini-3.1-pro-preview | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:google/gemini-3.1-pro-preview | blue | 10 | $0.322784 | `082442d06841` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:openai/gpt-5.5 | battlecast.smart | blue | 2 | $0.167075 | `55775d72acce` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:openai/gpt-5.5 | blue | 8 | $0.646095 | `0d6acbe70b54` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_moonshotai_kimi-k2.7-code__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:moonshotai/kimi-k2.7-code | battlecast.smart | blue | 5 | $0.049310 | `3ebebd4cc6bb` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_moonshotai_kimi-k2.7-code | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:moonshotai/kimi-k2.7-code | red | 4 | $0.040195 | `88e3ad3c129a` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:z-ai/glm-5.2 | battlecast.smart | blue | 1 | $0.020745 | `a2309fff6d25` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:z-ai/glm-5.2 | blue | 12 | $0.218725 | `9187a0795f28` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_deepseek_deepseek-v4-pro__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-pro | battlecast.smart | blue | 3 | $0.020445 | `a9f913537fd8` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_deepseek_deepseek-v4-pro | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:deepseek/deepseek-v4-pro | red | 10 | $0.066170 | `4066c609b330` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | blue | 2 | $0.002929 | `8d2dd7b4a9d7` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | blue | 9 | $0.011879 | `3d1aa9bda31c` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | blue | 1 | $0.001726 | `9cca7a559116` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | blue | 12 | $0.023380 | `9319972e97e7` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | blue | 6 | $0.013903 | `c8e7ee495a37` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | blue | 12 | $0.026611 | `7e600c188033` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | blue | 5 | $0.001369 | `baafb6efcf32` |
| public.hero-mirror-chokepoint-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | blue | 12 | $0.003162 | `948f5415116d` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | red | 12 | $1.453515 | `fbddf4d41c3a` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 8 | $0.939295 | `eb22330adf4e` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_google_gemini-3.1-pro-preview__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:google/gemini-3.1-pro-preview | battlecast.smart | red | 12 | $0.405100 | `8e88aa87af85` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_google_gemini-3.1-pro-preview | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:google/gemini-3.1-pro-preview | red | 11 | $0.379170 | `cb3d6b8457f8` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | blue | 12 | $1.071050 | `30507d78e5ec` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 10 | $0.856255 | `caae6b06ba54` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_moonshotai_kimi-k2.7-code__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:moonshotai/kimi-k2.7-code | battlecast.smart | blue | 12 | $0.128076 | `e63fe0378fb2` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_moonshotai_kimi-k2.7-code | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:moonshotai/kimi-k2.7-code | red | 10 | $0.097680 | `44b427a41d9b` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:z-ai/glm-5.2 | battlecast.smart | blue | 12 | $0.227458 | `67e83306ca68` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:z-ai/glm-5.2 | red | 12 | $0.237427 | `4270f4811306` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_deepseek_deepseek-v4-pro__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-pro | battlecast.smart | blue | 12 | $0.083592 | `9a667a3d745f` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_deepseek_deepseek-v4-pro | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-pro | red | 9 | $0.060605 | `f88b4b536966` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | red | 12 | $0.017809 | `8d08e94e7ef6` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 10 | $0.014193 | `60a879c7ae22` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | red | 12 | $0.022302 | `422c5ecba348` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 11 | $0.021347 | `f213ad523a46` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | red | 12 | $0.028105 | `52f339e48d76` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 10 | $0.023317 | `f4c3e224e247` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | red | 12 | $0.003318 | `5780dfca17c3` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__1__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 10 | $0.002754 | `552aca6fbb80` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_anthropic_claude-opus-4.8__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | blue | 11 | $1.322110 | `9160d16f389f` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_anthropic_claude-opus-4.8 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | red | 12 | $1.445900 | `0b5c975e8fac` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_google_gemini-3.1-pro-preview__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:google/gemini-3.1-pro-preview | battlecast.smart | blue | 10 | $0.343610 | `4fd494af6c09` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_google_gemini-3.1-pro-preview | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:google/gemini-3.1-pro-preview | blue | 12 | $0.419020 | `316a9aafdfb4` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_openai_gpt-5.5__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:openai/gpt-5.5 | battlecast.smart | draw | 10 | $0.874215 | `3d814083453b` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_openai_gpt-5.5 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:openai/gpt-5.5 | red | 9 | $0.770435 | `01aaf7411791` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_moonshotai_kimi-k2.7-code__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:moonshotai/kimi-k2.7-code | battlecast.smart | blue | 9 | $0.095891 | `2d68168bf5cb` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_moonshotai_kimi-k2.7-code | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:moonshotai/kimi-k2.7-code | red | 7 | $0.076681 | `0af9c47027b8` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_z-ai_glm-5.2__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:z-ai/glm-5.2 | battlecast.smart | blue | 12 | $0.233987 | `599d8c41ac2d` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_z-ai_glm-5.2 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:z-ai/glm-5.2 | red | 12 | $0.228784 | `4d26bfc5f76e` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_deepseek_deepseek-v4-pro__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-pro | battlecast.smart | blue | 9 | $0.063382 | `86780f4126c1` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_deepseek_deepseek-v4-pro | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:deepseek/deepseek-v4-pro | red | 7 | $0.049736 | `4fd6e6c02ad4` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_deepseek_deepseek-v4-flash__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:deepseek/deepseek-v4-flash | battlecast.smart | red | 12 | $0.017180 | `c2d400f3ebd0` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_deepseek_deepseek-v4-flash | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:deepseek/deepseek-v4-flash | red | 12 | $0.016847 | `91a2c12af95e` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_qwen_qwen3.5-flash-02-23__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:qwen/qwen3.5-flash-02-23 | battlecast.smart | red | 12 | $0.021201 | `8fea8bc4d3a8` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_qwen_qwen3.5-flash-02-23 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:qwen/qwen3.5-flash-02-23 | red | 10 | $0.058592 | `6f1794c800b4` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_mistralai_ministral-8b-2512__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:mistralai/ministral-8b-2512 | battlecast.smart | red | 12 | $0.028379 | `c790add12892` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_mistralai_ministral-8b-2512 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:mistralai/ministral-8b-2512 | red | 11 | $0.025838 | `9fcb2b1552f6` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__openrouter_meta-llama_llama-3.1-8b-instruct__battlecast.smart | public.hero-mirror-status-l5.v1 | 2 | openrouter:meta-llama/llama-3.1-8b-instruct | battlecast.smart | red | 12 | $0.003307 | `dac510d40d67` |
| public.hero-mirror-status-l5.v1__battlecast-full-turn__2__battlecast.smart__openrouter_meta-llama_llama-3.1-8b-instruct | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:meta-llama/llama-3.1-8b-instruct | red | 11 | $0.003067 | `6201de98f913` |

