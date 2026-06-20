# llm-smoke-v0 LLM Elo Smoke Season

First bounded LLM smoke season on the public goblin duel, using latest Kimi, GLM 5.2, latest DeepSeek, and cheap smaller OpenRouter models.

Generated: 2026-06-20T16:03:43.995Z
Completed: 2026-06-20T16:08:54.002Z
Concurrency: 3
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 56/56 completed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | openrouter:z-ai/glm-5.2 | 1090.5 | 14 | 10-4-0 | 10.0 |
| 2 | openrouter:qwen/qwen3.5-flash-02-23 | 1031.9 | 14 | 9-5-0 | 9.0 |
| 3 | openrouter:meta-llama/llama-3.1-8b-instruct | 1011.8 | 14 | 8-6-0 | 8.0 |
| 4 | openrouter:moonshotai/kimi-k2.7-code | 1006.7 | 14 | 6-8-0 | 6.0 |
| 5 | baseline.focus-fire | 1002.1 | 14 | 8-6-0 | 8.0 |
| 6 | openrouter:deepseek/deepseek-v4-pro | 991.8 | 14 | 7-7-0 | 7.0 |
| 7 | openrouter:deepseek/deepseek-v4-flash | 964.1 | 14 | 5-9-0 | 5.0 |
| 8 | openrouter:mistralai/ministral-8b-2512 | 901.0 | 14 | 3-11-0 | 3.0 |

## Cost Summary

Estimated total cost: $0.066587
LLM decisions: 174
Tokens: 144567 total (101681 prompt, 42886 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |
| openrouter:z-ai/glm-5.2 | 25 | 13708 | 2479 | 16187 | $0.026614 |
| openrouter:moonshotai/kimi-k2.7-code | 23 | 12859 | 2618 | 15477 | $0.015904 |
| openrouter:deepseek/deepseek-v4-pro | 25 | 16785 | 4518 | 21303 | $0.011232 |
| openrouter:qwen/qwen3.5-flash-02-23 | 26 | 14638 | 28568 | 43206 | $0.008379 |
| openrouter:mistralai/ministral-8b-2512 | 24 | 14416 | 805 | 15221 | $0.002283 |
| openrouter:deepseek/deepseek-v4-flash | 25 | 14962 | 2832 | 17794 | $0.001856 |
| openrouter:meta-llama/llama-3.1-8b-instruct | 26 | 14313 | 1066 | 15379 | $0.000318 |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| public.goblin-duel.v1__1__openrouter_moonshotai_kimi-k2.7-code__openrouter_z-ai_glm-5.2 | public.goblin-duel.v1 | 1 | openrouter:moonshotai/kimi-k2.7-code | openrouter:z-ai/glm-5.2 | blue | 3 | $0.002882 | `2b96a10e5524` |
| public.goblin-duel.v1__1__openrouter_moonshotai_kimi-k2.7-code__openrouter_deepseek_deepseek-v4-pro | public.goblin-duel.v1 | 1 | openrouter:moonshotai/kimi-k2.7-code | openrouter:deepseek/deepseek-v4-pro | blue | 3 | $0.001704 | `116cc0cf5a13` |
| public.goblin-duel.v1__1__openrouter_moonshotai_kimi-k2.7-code__openrouter_deepseek_deepseek-v4-flash | public.goblin-duel.v1 | 1 | openrouter:moonshotai/kimi-k2.7-code | openrouter:deepseek/deepseek-v4-flash | blue | 3 | $0.000588 | `a9c0095d9477` |
| public.goblin-duel.v1__1__openrouter_moonshotai_kimi-k2.7-code__openrouter_qwen_qwen3.5-flash-02-23 | public.goblin-duel.v1 | 1 | openrouter:moonshotai/kimi-k2.7-code | openrouter:qwen/qwen3.5-flash-02-23 | blue | 5 | $0.002214 | `ca9658493bfd` |
| public.goblin-duel.v1__1__openrouter_moonshotai_kimi-k2.7-code__openrouter_mistralai_ministral-8b-2512 | public.goblin-duel.v1 | 1 | openrouter:moonshotai/kimi-k2.7-code | openrouter:mistralai/ministral-8b-2512 | blue | 3 | $0.000673 | `fa28d6aef4b2` |
| public.goblin-duel.v1__1__openrouter_moonshotai_kimi-k2.7-code__openrouter_meta-llama_llama-3.1-8b-instruct | public.goblin-duel.v1 | 1 | openrouter:moonshotai/kimi-k2.7-code | openrouter:meta-llama/llama-3.1-8b-instruct | blue | 3 | $0.000483 | `91f65f8872b4` |
| public.goblin-duel.v1__1__openrouter_moonshotai_kimi-k2.7-code__baseline.focus-fire | public.goblin-duel.v1 | 1 | openrouter:moonshotai/kimi-k2.7-code | baseline.focus-fire | blue | 1 | $0.000508 | `69226283751a` |
| public.goblin-duel.v1__1__openrouter_z-ai_glm-5.2__openrouter_moonshotai_kimi-k2.7-code | public.goblin-duel.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:moonshotai/kimi-k2.7-code | blue | 3 | $0.002782 | `e9c202b17ec1` |
| public.goblin-duel.v1__1__openrouter_z-ai_glm-5.2__openrouter_deepseek_deepseek-v4-pro | public.goblin-duel.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:deepseek/deepseek-v4-pro | blue | 3 | $0.001704 | `e9c202b17ec1` |
| public.goblin-duel.v1__1__openrouter_z-ai_glm-5.2__openrouter_deepseek_deepseek-v4-flash | public.goblin-duel.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:deepseek/deepseek-v4-flash | red | 4 | $0.002365 | `1126844d6fc3` |
| public.goblin-duel.v1__1__openrouter_z-ai_glm-5.2__openrouter_qwen_qwen3.5-flash-02-23 | public.goblin-duel.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:qwen/qwen3.5-flash-02-23 | blue | 3 | $0.002254 | `91f65f8872b4` |
| public.goblin-duel.v1__1__openrouter_z-ai_glm-5.2__openrouter_mistralai_ministral-8b-2512 | public.goblin-duel.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:mistralai/ministral-8b-2512 | red | 4 | $0.002936 | `6d7dcf4064c5` |
| public.goblin-duel.v1__1__openrouter_z-ai_glm-5.2__openrouter_meta-llama_llama-3.1-8b-instruct | public.goblin-duel.v1 | 1 | openrouter:z-ai/glm-5.2 | openrouter:meta-llama/llama-3.1-8b-instruct | blue | 3 | $0.001104 | `f9402fbbbdc9` |
| public.goblin-duel.v1__1__openrouter_z-ai_glm-5.2__baseline.focus-fire | public.goblin-duel.v1 | 1 | openrouter:z-ai/glm-5.2 | baseline.focus-fire | red | 2 | $0.002164 | `b8a30b1c5d44` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-pro__openrouter_moonshotai_kimi-k2.7-code | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-pro | openrouter:moonshotai/kimi-k2.7-code | blue | 3 | $0.001936 | `09cf4337425c` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-pro__openrouter_z-ai_glm-5.2 | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-pro | openrouter:z-ai/glm-5.2 | blue | 3 | $0.002367 | `3f59868dc050` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-pro__openrouter_deepseek_deepseek-v4-flash | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-pro | openrouter:deepseek/deepseek-v4-flash | red | 4 | $0.001000 | `c6af9966cc04` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-pro__openrouter_qwen_qwen3.5-flash-02-23 | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-pro | openrouter:qwen/qwen3.5-flash-02-23 | blue | 3 | $0.000987 | `4ba501c840d0` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-pro__openrouter_mistralai_ministral-8b-2512 | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-pro | openrouter:mistralai/ministral-8b-2512 | red | 4 | $0.001285 | `5d81e0788f81` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-pro__openrouter_meta-llama_llama-3.1-8b-instruct | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-pro | openrouter:meta-llama/llama-3.1-8b-instruct | red | 4 | $0.000935 | `15d45c80a785` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-pro__baseline.focus-fire | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-pro | baseline.focus-fire | blue | 1 | $0.000476 | `69226283751a` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_moonshotai_kimi-k2.7-code | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:moonshotai/kimi-k2.7-code | blue | 3 | $0.001532 | `2b96a10e5524` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_z-ai_glm-5.2 | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:z-ai/glm-5.2 | blue | 3 | $0.002004 | `8dc5ee3084a2` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_deepseek_deepseek-v4-pro | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:deepseek/deepseek-v4-pro | red | 6 | $0.002024 | `b8432cbf629d` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_qwen_qwen3.5-flash-02-23 | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:qwen/qwen3.5-flash-02-23 | blue | 3 | $0.000542 | `3f59868dc050` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_mistralai_ministral-8b-2512 | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:mistralai/ministral-8b-2512 | blue | 5 | $0.000480 | `2095f587d76b` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-flash__openrouter_meta-llama_llama-3.1-8b-instruct | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | openrouter:meta-llama/llama-3.1-8b-instruct | blue | 3 | $0.000108 | `05f937a3158c` |
| public.goblin-duel.v1__1__openrouter_deepseek_deepseek-v4-flash__baseline.focus-fire | public.goblin-duel.v1 | 1 | openrouter:deepseek/deepseek-v4-flash | baseline.focus-fire | blue | 1 | $0.000066 | `69226283751a` |
| public.goblin-duel.v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_moonshotai_kimi-k2.7-code | public.goblin-duel.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:moonshotai/kimi-k2.7-code | red | 4 | $0.002530 | `e4479745b51c` |
| public.goblin-duel.v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_z-ai_glm-5.2 | public.goblin-duel.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:z-ai/glm-5.2 | blue | 3 | $0.002558 | `05f937a3158c` |
| public.goblin-duel.v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-pro | public.goblin-duel.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-pro | blue | 3 | $0.000993 | `d0345057dbfe` |
| public.goblin-duel.v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_deepseek_deepseek-v4-flash | public.goblin-duel.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:deepseek/deepseek-v4-flash | red | 4 | $0.000620 | `907d69264a18` |
| public.goblin-duel.v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_mistralai_ministral-8b-2512 | public.goblin-duel.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:mistralai/ministral-8b-2512 | red | 4 | $0.000669 | `6b97acd85cb9` |
| public.goblin-duel.v1__1__openrouter_qwen_qwen3.5-flash-02-23__openrouter_meta-llama_llama-3.1-8b-instruct | public.goblin-duel.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | openrouter:meta-llama/llama-3.1-8b-instruct | blue | 3 | $0.000352 | `3f59868dc050` |
| public.goblin-duel.v1__1__openrouter_qwen_qwen3.5-flash-02-23__baseline.focus-fire | public.goblin-duel.v1 | 1 | openrouter:qwen/qwen3.5-flash-02-23 | baseline.focus-fire | blue | 1 | $0.000433 | `69226283751a` |
| public.goblin-duel.v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_moonshotai_kimi-k2.7-code | public.goblin-duel.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:moonshotai/kimi-k2.7-code | blue | 3 | $0.001500 | `ad41056fb7e6` |
| public.goblin-duel.v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_z-ai_glm-5.2 | public.goblin-duel.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:z-ai/glm-5.2 | blue | 3 | $0.002045 | `184278be6a7f` |
| public.goblin-duel.v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_deepseek_deepseek-v4-pro | public.goblin-duel.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:deepseek/deepseek-v4-pro | blue | 3 | $0.000920 | `0f6d343ff32e` |
| public.goblin-duel.v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_deepseek_deepseek-v4-flash | public.goblin-duel.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:deepseek/deepseek-v4-flash | blue | 5 | $0.000405 | `ca32728713c1` |
| public.goblin-duel.v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_qwen_qwen3.5-flash-02-23 | public.goblin-duel.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:qwen/qwen3.5-flash-02-23 | blue | 3 | $0.000621 | `f044598e2a7f` |
| public.goblin-duel.v1__1__openrouter_mistralai_ministral-8b-2512__openrouter_meta-llama_llama-3.1-8b-instruct | public.goblin-duel.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | openrouter:meta-llama/llama-3.1-8b-instruct | blue | 3 | $0.000117 | `ad41056fb7e6` |
| public.goblin-duel.v1__1__openrouter_mistralai_ministral-8b-2512__baseline.focus-fire | public.goblin-duel.v1 | 1 | openrouter:mistralai/ministral-8b-2512 | baseline.focus-fire | blue | 1 | $0.000092 | `03121de24509` |
| public.goblin-duel.v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_moonshotai_kimi-k2.7-code | public.goblin-duel.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:moonshotai/kimi-k2.7-code | blue | 5 | $0.002178 | `afaee4ab6e89` |
| public.goblin-duel.v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_z-ai_glm-5.2 | public.goblin-duel.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:z-ai/glm-5.2 | blue | 3 | $0.001899 | `f9402fbbbdc9` |
| public.goblin-duel.v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_deepseek_deepseek-v4-pro | public.goblin-duel.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:deepseek/deepseek-v4-pro | red | 4 | $0.000814 | `1197ac7ffb47` |
| public.goblin-duel.v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_deepseek_deepseek-v4-flash | public.goblin-duel.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:deepseek/deepseek-v4-flash | blue | 3 | $0.000152 | `a0a12332127e` |
| public.goblin-duel.v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_qwen_qwen3.5-flash-02-23 | public.goblin-duel.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:qwen/qwen3.5-flash-02-23 | blue | 6 | $0.000948 | `a857b2eb1d99` |
| public.goblin-duel.v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__openrouter_mistralai_ministral-8b-2512 | public.goblin-duel.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | openrouter:mistralai/ministral-8b-2512 | red | 4 | $0.000213 | `3de7538fe2d5` |
| public.goblin-duel.v1__1__openrouter_meta-llama_llama-3.1-8b-instruct__baseline.focus-fire | public.goblin-duel.v1 | 1 | openrouter:meta-llama/llama-3.1-8b-instruct | baseline.focus-fire | blue | 1 | $0.000012 | `69226283751a` |
| public.goblin-duel.v1__1__baseline.focus-fire__openrouter_moonshotai_kimi-k2.7-code | public.goblin-duel.v1 | 1 | baseline.focus-fire | openrouter:moonshotai/kimi-k2.7-code | blue | 2 | $0.001458 | `09cf4337425c` |
| public.goblin-duel.v1__1__baseline.focus-fire__openrouter_z-ai_glm-5.2 | public.goblin-duel.v1 | 1 | baseline.focus-fire | openrouter:z-ai/glm-5.2 | blue | 3 | $0.002941 | `ced2100299bf` |
| public.goblin-duel.v1__1__baseline.focus-fire__openrouter_deepseek_deepseek-v4-pro | public.goblin-duel.v1 | 1 | baseline.focus-fire | openrouter:deepseek/deepseek-v4-pro | red | 2 | $0.000803 | `2d15a742e72b` |
| public.goblin-duel.v1__1__baseline.focus-fire__openrouter_deepseek_deepseek-v4-flash | public.goblin-duel.v1 | 1 | baseline.focus-fire | openrouter:deepseek/deepseek-v4-flash | blue | 2 | $0.000186 | `5bf2d3af1a5d` |
| public.goblin-duel.v1__1__baseline.focus-fire__openrouter_qwen_qwen3.5-flash-02-23 | public.goblin-duel.v1 | 1 | baseline.focus-fire | openrouter:qwen/qwen3.5-flash-02-23 | red | 2 | $0.000704 | `258fc16581e9` |
| public.goblin-duel.v1__1__baseline.focus-fire__openrouter_mistralai_ministral-8b-2512 | public.goblin-duel.v1 | 1 | baseline.focus-fire | openrouter:mistralai/ministral-8b-2512 | blue | 3 | $0.000294 | `ab3c23df9186` |
| public.goblin-duel.v1__1__baseline.focus-fire__openrouter_meta-llama_llama-3.1-8b-instruct | public.goblin-duel.v1 | 1 | baseline.focus-fire | openrouter:meta-llama/llama-3.1-8b-instruct | blue | 2 | $0.000024 | `fa28d6aef4b2` |

