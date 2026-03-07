# OpenAI API Reference

**Source:** https://platform.openai.com/docs/api-reference

## Quick Reference

| Category | Endpoints |
|----------|-----------|
| **Chat Completions** | `/v1/chat/completions` |
| **Responses** | `/v1/responses`, `/v1/responses/streaming` |
| **Audio** | `/v1/audio/transcriptions`, `/v1/audio/speech` |
| **Images** | `/v1/images/generations` |
| **Embeddings** | `/v1/embeddings` |
| **Models** | `/v1/models` |
| **Files** | `/v1/files` |
| **Fine-tuning** | `/v1/fine_tuning/jobs` |
| **Moderations** | `/v1/moderations` |

## Authentication

```bash
# Bearer token
Authorization: Bearer $OPENAI_API_KEY

# Organization/Project (optional)
OpenAI-Organization: $ORGANIZATION_ID
OpenAI-Project: $PROJECT_ID
```

## Chat Completions

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

## Request Body (Chat Completions)

```json
{
  "model": "gpt-4o | gpt-4o-mini | gpt-4-turbo | gpt-3.5-turbo",
  "messages": [
    {
      "role": "system" | "user" | "assistant" | "tool",
      "content": "string"
    }
  ],
  "temperature": number,
  "top_p": number,
  "n": integer,
  "max_tokens": integer,
  "presence_penalty": number,
  "frequency_penalty": number,
  "logit_bias": object,
  "user": "string",
  "tools": [...],
  "tool_choice": "auto" | "none" | {"type": "function", "function": {"name": "..."}},
  "stream": boolean
}
```

## Response (Chat Completions)

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": integer,
  "model": "gpt-4o-2024-05-13",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "...",
        "tool_calls": [...]
      },
      "finish_reason": "stop" | "length" | "tool_calls" | "content_filter",
      "logprobs": {...}
    }
  ],
  "usage": {
    "prompt_tokens": integer,
    "completion_tokens": integer,
    "total_tokens": integer
  },
  "system_fingerprint": "..."
}
```

## Responses API (New)

```bash
curl https://api.openai.com/v1/responses \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "input": "Explain quantum computing"
  }'
```

## Image Generation

```bash
curl https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dall-e-3",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "1024x1024"
  }'
```

## Audio Transcription

```bash
curl https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "file=@audio.mp3" \
  -F "model="whisper-1""
```

## Embeddings

```bash
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "The food was delicious and the waiter..."
  }'
```

## Models

```bash
# List models
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Retrieve model
curl https://api.openai.com/v1/models/gpt-4o \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## Rate Limit Headers

```
x-ratelimit-limit-requests: 500
x-ratelimit-remaining-requests: 499
x-ratelimit-reset-requests: 1s
x-ratelimit-limit-tokens: 150000
x-ratelimit-remaining-tokens: 149999
x-ratelimit-reset-tokens: 1s
```

## Webhooks

```json
{
  "event_type": "response.completed",
  "data": {
    "response_id": "resp_...",
    "status": "completed",
    "output": [...]
  }
}
```

---

*Captured: 2026-02-28*
*Source: https://platform.openai.com/docs/api-reference*