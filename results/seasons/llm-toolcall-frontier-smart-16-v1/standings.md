# llm-toolcall-frontier-smart-16-v1 LLM Elo Smoke Season

Post-toolcall-fix frontier verification season for GPT-5.5 and Claude Opus 4.8 against Battlecast Smart, with sixteen matches per model.

Generated: 2026-06-21T07:38:59.010Z
Completed: 2026-06-21T07:38:59.613Z
LLM action space: battlecast-full-turn
Concurrency: 8
Max rounds: 3
Initial rating: 1000
K-factor: 32
Matches: 0/32 completed, 32 failed

## Standings

| Rank | Agent | Elo | Matches | W-L-D | Score |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | battlecast.smart | 1000.0 | 0 | 0-0-0 | 0.0 |
| 2 | openrouter:anthropic/claude-opus-4.8 | 1000.0 | 0 | 0-0-0 | 0.0 |
| 3 | openrouter:openai/gpt-5.5 | 1000.0 | 0 | 0-0-0 | 0.0 |

## Cost Summary

Estimated total cost: $0.000000
LLM decisions: 0
Tokens: 0 total (0 prompt, 0 completion)

| Model Agent | Decisions | Prompt Tokens | Completion Tokens | Total Tokens | Estimated Cost |
| --- | ---: | ---: | ---: | ---: | ---: |

## Failed Matches

| Index | Scenario | Seed | Red | Blue | Error |
| ---: | --- | --- | --- | --- | --- |
| 1 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 6 | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:openai/gpt-5.5 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 2 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 0 | public.hero-mirror-chokepoint-l5.v1 | 1 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 8 | public.hero-mirror-chokepoint-l5.v1 | 3 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 7 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:openai/gpt-5.5 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 5 | public.hero-mirror-chokepoint-l5.v1 | 2 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 3 | public.hero-mirror-chokepoint-l5.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 9 | public.hero-mirror-chokepoint-l5.v1 | 3 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 11 | public.hero-mirror-chokepoint-l5.v1 | 3 | battlecast.smart | openrouter:openai/gpt-5.5 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 10 | public.hero-mirror-chokepoint-l5.v1 | 3 | openrouter:openai/gpt-5.5 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 12 | public.hero-mirror-chokepoint-l5.v1 | 4 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 4 | public.hero-mirror-chokepoint-l5.v1 | 2 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 13 | public.hero-mirror-chokepoint-l5.v1 | 4 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 14 | public.hero-mirror-chokepoint-l5.v1 | 4 | openrouter:openai/gpt-5.5 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 16 | public.hero-mirror-status-l5.v1 | 1 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 15 | public.hero-mirror-chokepoint-l5.v1 | 4 | battlecast.smart | openrouter:openai/gpt-5.5 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 17 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 18 | public.hero-mirror-status-l5.v1 | 1 | openrouter:openai/gpt-5.5 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 19 | public.hero-mirror-status-l5.v1 | 1 | battlecast.smart | openrouter:openai/gpt-5.5 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 21 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 20 | public.hero-mirror-status-l5.v1 | 2 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 22 | public.hero-mirror-status-l5.v1 | 2 | openrouter:openai/gpt-5.5 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 23 | public.hero-mirror-status-l5.v1 | 2 | battlecast.smart | openrouter:openai/gpt-5.5 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 24 | public.hero-mirror-status-l5.v1 | 3 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 25 | public.hero-mirror-status-l5.v1 | 3 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 26 | public.hero-mirror-status-l5.v1 | 3 | openrouter:openai/gpt-5.5 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 27 | public.hero-mirror-status-l5.v1 | 3 | battlecast.smart | openrouter:openai/gpt-5.5 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 28 | public.hero-mirror-status-l5.v1 | 4 | openrouter:anthropic/claude-opus-4.8 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 29 | public.hero-mirror-status-l5.v1 | 4 | battlecast.smart | openrouter:anthropic/claude-opus-4.8 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 30 | public.hero-mirror-status-l5.v1 | 4 | openrouter:openai/gpt-5.5 | battlecast.smart | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |
| 31 | public.hero-mirror-status-l5.v1 | 4 | battlecast.smart | openrouter:openai/gpt-5.5 | OpenRouter tool request failed (404): {"error":{"message":"No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection","code":404}} |

## Matches

| Match | Scenario | Seed | Red | Blue | Winner | LLM Decisions | Estimated Cost | Hash |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- |

