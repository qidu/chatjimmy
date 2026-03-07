# Messages API

## Overview

The Messages API is Anthropic's primary interface for interacting with Claude. It supports single queries and stateless multi-turn conversations with text and image content.

**Endpoint:** `POST /v1/messages`

## Core Request Parameters

### Required Parameters

#### `model: string`
The model to use for completion. Available options include:
- `claude-opus-4-5-20251101` - Premium model (max intelligence)
- `claude-sonnet-4-5-20250929` - Best for real-world agents and coding
- `claude-3-5-haiku-20241022` - Fastest and most compact
- `claude-3-opus-20240229` - Excels at writing and complex tasks

See [models overview](https://docs.anthropic.com/en/docs/models-overview) for complete list.

#### `max_tokens: number`
Maximum tokens to generate before stopping. The model may stop before reaching this limit. Different models have different maximum values.

#### `messages: array of MessageParam`
Array of conversational messages with alternating `user` and `assistant` roles.

**Structure:**
```json
[
  {"role": "user", "content": "Hello, Claude"},
  {"role": "assistant", "content": "Hi! How can I help?"},
  {"role": "user", "content": "Explain quantum computing"}
]
```

**Message Content Types:**
- Simple string: `"Hello, Claude"` (shorthand for text block)
- Text block: `{"type": "text", "text": "Hello, Claude"}`
- Image block: `{"type": "image", "source": {...}}`
- Document block: `{"type": "document", "source": {...}}`
- Tool use: `{"type": "tool_use", "id": "...", "name": "...", "input": {...}}`
- Tool result: `{"type": "tool_result", "tool_use_id": "...", "content": "..."}`

---

### Optional Parameters

#### `system: string | TextBlockParam[]`
System prompt providing context and instructions.

```json
{
  "system": "You are a helpful coding assistant."
}
```

#### `temperature: number` (0.0 - 1.0)
Controls randomness in responses. Default: `1.0`
- Closer to `0.0`: analytical/deterministic
- Closer to `1.0`: creative/generative

#### `top_p: number`
Nucleus sampling threshold (0.0 - 1.0). Use either `temperature` or `top_p`, not both.

#### `top_k: number`
Sample only from top K options per token. Advanced use cases only.

#### `stop_sequences: string[]`
Custom strings that trigger response termination.

```json
{
  "stop_sequences": ["END", "###"]
}
```

#### `stream: boolean`
Enable server-sent event streaming for incremental responses.

#### `thinking: ThinkingConfigParam`
Enable extended thinking with token budget.

```json
{
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000
  }
}
```

Minimum budget: 1,024 tokens. Must be less than `max_tokens`.

#### `tool_choice: ToolChoice`
Control tool usage:
- `{"type": "auto"}` - Model decides (default)
- `{"type": "any"}` - Use any available tool
- `{"type": "tool", "name": "tool_name"}` - Use specific tool
- `{"type": "none"}` - Disable tool use

#### `tools: Tool[]`
Define available tools with JSON schema.

```json
{
  "tools": [
    {
      "name": "get_stock_price",
      "description": "Get current stock price",
      "input_schema": {
        "type": "object",
        "properties": {
          "ticker": {
            "type": "string",
            "description": "Stock ticker (e.g., AAPL)"
          }
        },
        "required": ["ticker"]
      }
    }
  ]
}
```

#### `metadata: Metadata`
Request metadata for abuse detection.

```json
{
  "metadata": {
    "user_id": "uuid-or-hash"
  }
}
```

#### `service_tier: "auto" | "standard_only"`
Service tier for request prioritization. Default: `"auto"`

---

## Image Content

### Base64 Images
```json
{
  "type": "image",
  "source": {
    "type": "base64",
    "media_type": "image/jpeg",
    "data": "base64-encoded-data"
  }
}
```

**Supported formats:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`

### URL Images
```json
{
  "type": "image",
  "source": {
    "type": "url",
    "url": "https://example.com/image.jpg"
  }
}
```

---

## Document Content

### PDF Documents
```json
{
  "type": "document",
  "source": {
    "type": "base64",
    "media_type": "application/pdf",
    "data": "base64-encoded-pdf"
  },
  "title": "Document Title"
}
```

### Plain Text Documents
```json
{
  "type": "document",
  "source": {
    "type": "text",
    "media_type": "text/plain",
    "data": "Plain text content"
  },
  "title": "Document Title"
}
```

---

## Prompt Caching

Add cache control breakpoints to content blocks:

```json
{
  "type": "text",
  "text": "Cached content",
  "cache_control": {
    "type": "ephemeral",
    "ttl": "5m"
  }
}
```

**TTL Options:**
- `"5m"` - 5 minutes (default)
- `"1h"` - 1 hour

---

## Response Format

### Message Response
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-5-20250929",
  "content": [
    {
      "type": "text",
      "text": "Response content"
    }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  }
}
```

### Stop Reasons
- `"end_turn"` - Natural stopping point
- `"max_tokens"` - Max token limit reached
- `"stop_sequence"` - Custom stop sequence triggered
- `"tool_use"` - Model invoked tools
- `"pause_turn"` - Long-running turn paused
- `"refusal"` - Policy violation prevented

### Content Block Types in Response
- `TextBlock` - Text with optional citations
- `ThinkingBlock` - Extended thinking process
- `ToolUseBlock` - Tool invocation
- `WebSearchToolResultBlock` - Web search results

---

## Tool Use Example

### Request:
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 1024,
  "messages": [
    {"role": "user", "content": "What's the S&P 500 at today?"}
  ],
  "tools": [
    {
      "name": "get_stock_price",
      "description": "Get stock price for ticker",
      "input_schema": {
        "type": "object",
        "properties": {
          "ticker": {"type": "string"}
        },
        "required": ["ticker"]
      }
    }
  ]
}
```

### Response:
```json
{
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_...",
      "name": "get_stock_price",
      "input": {"ticker": "^GSPC"}
    }
  ],
  "stop_reason": "tool_use"
}
```

### Follow-up with result:
```json
{
  "messages": [
    {"role": "user", "content": "What's the S&P 500 at today?"},
    {"role": "assistant", "content": [...]},
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_...",
          "content": "259.75 USD"
        }
      ]
    }
  ]
}
```

---

## Web Search Tool

**Type:** `web_search_20250305`

```json
{
  "type": "web_search_20250305",
  "name": "web_search",
  "allowed_domains": ["example.com", "news.com"],
  "max_uses": 5
}
```

**Parameters:**
- `allowed_domains` - Whitelist specific domains
- `blocked_domains` - Blacklist specific domains
- `max_uses` - Maximum search uses per request
- `user_location` - Optional location context

---

## Citation Support

When using documents, Claude can cite sources:

```json
{
  "type": "text",
  "text": "According to the document...",
  "citations": [
    {
      "type": "char_location",
      "cited_text": "specific quote",
      "document_index": 0,
      "document_title": "Document Name",
      "start_char_index": 100,
      "end_char_index": 150
    }
  ]
}
```

---

## Complete Request Example

```bash
curl https://api.anthropic.com/v1/messages \
  -H 'Content-Type: application/json' \
  -H 'anthropic-version: 2023-06-01' \
  -H "X-Api-Key: $ANTHROPIC_API_KEY" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 1024,
    "system": "You are a helpful assistant.",
    "messages": [
      {
        "role": "user",
        "content": "Explain quantum computing in simple terms"
      }
    ],
    "temperature": 1.0
  }'
```

---

## Key Constraints

- **Message limit:** 100,000 messages per request
- **Token budget for thinking:** Minimum 1,024 tokens
- **Consecutive turns:** Multiple consecutive `user` or `assistant` turns are combined into a single turn
- **Final assistant message:** If the last message uses `assistant` role, response continues from that content

---

## Best Practices

1. **System prompts:** Use top-level `system` parameter (not message role)
2. **Temperature tuning:** Use `0.0` for analytical tasks, `1.0` for creative
3. **Token budgets:** Monitor usage for cost optimization
4. **Tool definitions:** Provide detailed descriptions for better tool use
5. **Streaming:** Use for interactive applications to improve perceived latency
6. **Caching:** Cache frequently-used context with ephemeral cache control

---

## Next Steps

- [Token Counting API](token-counting-api.md): Count tokens before sending requests
- [Message Batches API](batches-api.md): Process large volumes of messages
- [Examples](../examples/): Code samples in multiple languages
- [Rate Limits](rate-limits.md): Understanding usage limits