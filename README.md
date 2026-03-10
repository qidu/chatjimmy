# ChatJimmy SDK

A TypeScript/JavaScript SDK for ChatJimmy AI chat API with compatibility layers for OpenAI, Anthropic, and Google Gemini APIs.

## 📖 Comprehensive Documentation

For complete documentation including API reference, advanced usage, and agent development guide, see [AGENTS.md](./AGENTS.md).

## 🚀 Quick Links

- [AGENTS.md](./AGENTS.md) - Complete SDK documentation
- [Examples](./examples/) - Usage examples
- [Source Code](./src/) - TypeScript source
- [Tests](./tests/) - Unit tests

## Features

- **Native ChatJimmy API client** - Direct access to ChatJimmy's native API
- **OpenAI Compatibility** - Use existing OpenAI client code with ChatJimmy
- **Anthropic Compatibility** - Use existing Anthropic client code with ChatJimmy
- **Google Gemini Compatibility** - Use existing Google Gemini client code with ChatJimmy
- **Tool Calling Support** - Function/tool calling for all compatible APIs
- **TypeScript Support** - Full type definitions for all APIs
- **Stats Parsing** - Automatic parsing of `<|stats|>` performance metrics

## Installation

```bash
npm install chatjimmy-sdk
```

## Quick Start

### Native ChatJimmy API

```typescript
import { ChatJimmyClient } from 'chatjimmy-sdk';

const client = new ChatJimmyClient({
  apiKey: 'your-api-key',
  baseURL: 'https://chatjimmy.ai/api'
});

const response = await client.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  chatOptions: {
    selectedModel: 'llama3.1-8B',
    systemPrompt: '',
    topK: 8
  }
});

console.log(response.content);
console.log(response.stats); // Parsed performance metrics
```

### OpenAI-Compatible Client

```typescript
import { OpenAICompatibleClient } from 'chatjimmy-sdk';

const client = new OpenAICompatibleClient({
  apiKey: 'your-api-key',
  baseURL: 'https://chatjimmy.ai/api'
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  max_tokens: 100
});

console.log(response.choices[0].message.content);
console.log(response.usage); // Converted from stats
```

### Anthropic-Compatible Client

```typescript
import { AnthropicCompatibleClient } from 'chatjimmy-sdk';

const client = new AnthropicCompatibleClient({
  apiKey: 'your-api-key',
  baseURL: 'https://chatjimmy.ai/api'
});

const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: 'You are a helpful assistant.',
  messages: [
    { role: 'user', content: 'Explain quantum computing' }
  ],
  temperature: 1.0
});

console.log(response.content[0].text);
console.log(response.usage); // Converted from stats
```

### Tool Calling

```typescript
// OpenAI-style tool calling
const response = await openaiClient.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is the weather in Boston?' }],
  tools: [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        },
        required: ['location']
      }
    }
  }]
});

// Anthropic-style tool calling
const response = await anthropicClient.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 500,
  tools: [{
    name: 'get_weather',
    description: 'Get the current weather',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      },
      required: ['location']
    }
  }],
  messages: [{ role: 'user', content: 'What is the weather in Boston?' }]
});
```

## API Reference

### ChatJimmyClient

The native ChatJimmy client with the following methods:

- `chat(request: ChatJimmyRequest): Promise<ChatJimmyResponse>` - Send chat request
- `chatStream(request: ChatJimmyRequest): AsyncIterable<ChatJimmyStreamChunk>` - Stream chat response

### OpenAICompatibleClient

OpenAI-compatible client with the following methods:

- `chat.completions.create(request: OpenAIRequest): Promise<OpenAIResponse>` - Create chat completion
- `chat.completions.createStream(request: OpenAIRequest): AsyncIterable<OpenAIStreamChunk>` - Stream chat completion

### AnthropicCompatibleClient

Anthropic-compatible client with the following methods:

- `messages.create(request: AnthropicRequest): Promise<AnthropicResponse>` - Create message
- `messages.createStream(request: AnthropicRequest): AsyncIterable<AnthropicStreamChunk>` - Stream message

## Model Mapping

The SDK automatically maps provider model names to ChatJimmy's `selectedModel`:

| Provider | Model Name | ChatJimmy Model |
|----------|------------|----------------|
| OpenAI | `gpt-4o` | `llama3.1-8B` |
| OpenAI | `gpt-4o-mini` | `llama3.1-8B` |
| Anthropic | `claude-sonnet-4-5-20250929` | `llama3.1-8B` |
| Anthropic | `claude-3-5-haiku-20241022` | `llama3.1-8B` |
| Google | `gemini-1.5-pro` | `llama3.1-8B` |
| Google | `gemini-1.5-flash` | `llama3.1-8B` |

## Stats Parsing

ChatJimmy responses include performance metrics in `<|stats|>` tags. The SDK automatically parses these:

```typescript
const response = await client.chat(...);
console.log(response.stats);
// {
//   total_duration: 0.004286766052246094,
//   ttft: 0.0011785030364990234,
//   prefill_tokens: 22,
//   decode_tokens: 19,
//   total_tokens: 41,
//   // ... and more
// }
```

## Error Handling

The SDK includes comprehensive error handling with provider-specific error types:

```typescript
try {
  const response = await client.chat(...);
} catch (error) {
  if (error instanceof ChatJimmyError) {
    console.error('ChatJimmy error:', error.message);
    console.error('Status:', error.status);
  } else if (error instanceof OpenAIError) {
    console.error('OpenAI error:', error.message);
  }
}
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Run examples
npm run examples

node examples/openai-compatible.ts

node examples/anthropic-compatible.ts

# Lint code
npm run lint

# Format code
npm run format
```

## 📊 Build Status

- **TypeScript Compilation**: ✅ Success
- **Unit Tests**: ✅ 17/17 tests passing
- **Examples**: ✅ Working examples provided
- **Type Safety**: ✅ Full TypeScript support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Submit a pull request

## 📄 License

MIT
