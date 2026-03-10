# ChatJimmy SDK for AI Agents

A comprehensive TypeScript/JavaScript SDK for building AI agents with ChatJimmy's API, featuring seamless compatibility with OpenAI, Anthropic, and Google Gemini APIs.

## Overview

ChatJimmy SDK provides a unified interface for AI chat APIs, allowing you to:
- Use ChatJimmy's native API directly
- Migrate existing OpenAI, Anthropic, or Google Gemini code with minimal changes
- Build cross-platform AI agents that work with multiple providers
- Parse performance metrics from ChatJimmy's `<|stats|>` tags

### Key Features
- **Multi-Provider Compatibility**: Use the same code with OpenAI, Anthropic, Google Gemini, or native ChatJimmy APIs
- **TypeScript First**: Full type safety with comprehensive TypeScript definitions
- **Automatic Stats Parsing**: Built-in parsing of performance metrics
- **Streaming Support**: Real-time streaming for all providers
- **Error Handling**: Provider-specific error types with retry logic
- **Parameter Normalization**: Automatic conversion between provider parameter ranges

## Installation

```bash
npm install chatjimmy-sdk
```

## Quick Start

### Using OpenAI-Compatible Interface

```typescript
import { OpenAICompatibleClient } from 'chatjimmy-sdk';

const client = new OpenAICompatibleClient({
  apiKey: 'your-chatjimmy-api-key',
  baseURL: 'https://chatjimmy.ai/api' // Optional, defaults to this
});

// Standard OpenAI-style request
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing in simple terms.' }
  ],
  temperature: 0.7,
  max_tokens: 100
});

console.log(response.choices[0].message.content);
console.log('Tokens used:', response.usage.total_tokens);
```

### Using Anthropic-Compatible Interface

```typescript
import { AnthropicCompatibleClient } from 'chatjimmy-sdk';

const client = new AnthropicCompatibleClient({
  apiKey: 'your-chatjimmy-api-key'
});

// Standard Anthropic-style request
const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: 'You are a helpful coding assistant.',
  messages: [
    { role: 'user', content: 'Write a Python function to calculate factorial' }
  ],
  temperature: 1.0
});

console.log(response.content[0].text);
console.log('Input tokens:', response.usage.input_tokens);
```

### Using Native ChatJimmy Interface

```typescript
import { ChatJimmyClient } from 'chatjimmy-sdk';

const client = new ChatJimmyClient({
  apiKey: 'your-chatjimmy-api-key'
});

// Direct ChatJimmy API access
const response = await client.chat({
  messages: [
    { role: 'user', content: 'What is the capital of France?' }
  ],
  chatOptions: {
    selectedModel: 'llama3.1-8B',
    systemPrompt: 'You are a geography expert.',
    temperature: 0.8,
    topK: 8,
    maxTokens: 100
  }
});

console.log(response.content);
console.log('Performance stats:', response.stats);
```

## Configuration

### Client Configuration Options

```typescript
interface ProviderConfig {
  apiKey: string;           // Required: Your ChatJimmy API key
  baseURL?: string;         // Optional: API base URL (default: 'https://chatjimmy.ai/api')
  timeout?: number;         // Optional: Request timeout in ms (default: 30000)
  maxRetries?: number;      // Optional: Max retry attempts (default: 3)
  headers?: Record<string, string>; // Optional: Additional headers
}
```

### Environment Variables

```bash
# Recommended: Set API key in environment
export CHATJIMI_API_KEY="your-api-key"
```

```typescript
// Use environment variable
const client = new OpenAICompatibleClient({
  apiKey: process.env.CHATJIMI_API_KEY!
});
```

## Advanced Usage

### Tool Calling

Both OpenAI and Anthropic compatible clients support tool/function calling:

```typescript
// OpenAI-style tool calling
import { OpenAICompatibleClient } from 'chatjimmy-sdk';

const client = new OpenAICompatibleClient({
  apiKey: process.env.CHATJIMI_API_KEY!
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is the weather in Boston?' }],
  tools: [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather in a given location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit']
          }
        },
        required: ['location']
      }
    }
  }],
  tool_choice: 'auto'
});

console.log(response.choices[0].message.tool_calls);

// Anthropic-style tool calling
import { AnthropicCompatibleClient } from 'chatjimmy-sdk';

const client = new AnthropicCompatibleClient({
  apiKey: process.env.CHATJIMI_API_KEY!
});

const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 500,
  tools: [{
    name: 'get_weather',
    description: 'Get the current weather in a given location',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit']
        }
      },
      required: ['location']
    }
  }],
  messages: [{ role: 'user', content: 'What is the weather in Boston?' }]
});

console.log(response.content);
```

### Streaming Responses

```typescript
// OpenAI-style streaming
const stream = await client.chat.completions.createStream({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
  max_tokens: 500
});

for await (const chunk of stream) {
  if (chunk.choices[0]?.delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}

// Anthropic-style streaming
const stream = await client.messages.createStream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 500,
  messages: [{ role: 'user', content: 'Explain recursion' }],
  stream: true
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
    process.stdout.write(chunk.delta.text);
  }
}
```

### Error Handling with Retries

```typescript
import { ChatJimmyError, OpenAIError, isRetryableError } from 'chatjimmy-sdk';

try {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello' }]
  });
} catch (error) {
  if (error instanceof OpenAIError) {
    console.error('OpenAI-compatible error:', error.message);

    if (isRetryableError(error)) {
      console.log('This error is retryable');
    }

    if (error.status === 429) {
      console.log('Rate limit exceeded');
    }
  } else if (error instanceof ChatJimmyError) {
    console.error('ChatJimmy error:', error.message);
  }
}
```

### Custom Model Mapping

```typescript
import { OpenAIAdapter } from 'chatjimmy-sdk';

// Create custom adapter with custom model mapping
const customAdapter = new OpenAIAdapter();
const customMapping = {
  'gpt-4o': 'custom-model-1',
  'gpt-3.5-turbo': 'custom-model-2',
  // Add your custom mappings
};

// Use the adapter directly
const chatJimiRequest = customAdapter.convertRequest(openAIRequest);
```

### Stats and Performance Metrics

```typescript
import { parseStats, formatStats, statsToOpenAIUsage } from 'chatjimmy-sdk';

// Parse stats from raw response
const rawResponse = 'Hello world!<|stats|>{"total_tokens": 42, "total_duration": 0.123}<|/stats|>';
const parsed = parseStats(rawResponse);

console.log('Content:', parsed.content);
console.log('Stats:', parsed.stats);

// Format stats for display
console.log('Formatted stats:', formatStats(parsed.stats));

// Convert to OpenAI usage format
const openAIUsage = statsToOpenAIUsage(parsed.stats);
console.log('OpenAI usage:', openAIUsage);
```

## API Reference

### ChatJimmyClient

**Methods:**
- `chat(request: ChatJimmyRequest): Promise<ChatJimmyResponse>` - Send chat request
- `chatStream(request: ChatJimmyRequest): AsyncIterable<ChatJimmyStreamChunk>` - Stream chat response

**ChatJimmyRequest:**
```typescript
interface ChatJimmyRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  chatOptions: {
    selectedModel: string;
    systemPrompt?: string;
    temperature?: number;    // 0-1
    topK?: number;           // Default: 8
    topP?: number;           // 0-1
    maxTokens?: number;
    stopSequences?: string[];
    stream?: boolean;
  };
  attachment?: {
    type: 'image' | 'document' | 'audio' | 'video';
    data: string;           // base64 encoded
    mimeType: string;
    filename?: string;
  } | null;
}
```

### OpenAICompatibleClient

**Methods:**
- `chat.completions.create(request: OpenAIRequest): Promise<OpenAIResponse>`
- `chat.completions.createStream(request: OpenAIRequest): AsyncIterable<OpenAIStreamChunk>`

**OpenAIRequest:** Standard OpenAI ChatCompletion request format.

### AnthropicCompatibleClient

**Methods:**
- `messages.create(request: AnthropicRequest): Promise<AnthropicResponse>`
- `messages.createStream(request: AnthropicRequest): AsyncIterable<AnthropicStreamChunk>`

**AnthropicRequest:** Standard Anthropic Messages API request format.

### GoogleCompatibleClient

**Methods:**
- `generateContentMethod.generateContent(request: GeminiRequest): Promise<GeminiResponse>`
- `generateContentMethod.streamGenerateContent(request: GeminiRequest): AsyncIterable<any>`

**GeminiRequest:** Standard Google Gemini API request format.

## Model Mapping Table

| Provider | Supported Models | Mapped to ChatJimmy |
|----------|-----------------|-------------------|
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`, `gpt-3.5-turbo-instruct` | `llama3.1-8B` |
| **Anthropic** | `claude-opus-4-5-20251101`, `claude-sonnet-4-5-20250929`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307` | `llama3.1-8B` |
| **Google Gemini** | `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-1.0-pro`, `gemini-1.0-ultra` | `llama3.1-8B` |

## Parameter Conversion

The SDK automatically normalizes parameters between providers:

| Parameter | OpenAI Range | Anthropic Range | Google Range | ChatJimmy Range |
|-----------|-------------|----------------|--------------|----------------|
| `temperature` | 0-2 | 0-1 | 0-1 | 0-1 |
| `top_p` | 0-1 | 0-1 | 0-1 | 0-1 |
| `top_k` | N/A | 0-100 | 1-40 | Default: 8 |
| `max_tokens` | ≥1 | ≥1 | 1-8192 | ≥1 |

## Error Types

```typescript
// Import error types
import {
  ChatJimmyError,
  OpenAIError,
  AnthropicError,
  GeminiError,
  isRetryableError,
  isAuthenticationError,
  isRateLimitError,
  isServerError
} from 'chatjimmy-sdk';

// Common error properties
interface ChatJimmyError {
  message: string;
  status?: number;      // HTTP status code
  code?: string;        // Error code
  details?: any;        // Additional error details
}
```

## Examples

See the `examples/` directory for complete working examples:
- `examples/openai-compatible.ts` - OpenAI-style usage
- `examples/anthropic-compatible.ts` - Anthropic-style usage

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/chatjimmy/chatjimmy-sdk.git
cd chatjimmy-sdk

# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Run examples
npm run examples
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx jest tests/converters.test.ts
```

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/chatjimmy/chatjimmy-sdk/issues)
- **Documentation**: [ChatJimmy Docs](https://docs.chatjimmy.ai)
- **API Reference**: See source code for detailed type definitions

## Changelog

### v0.1.0
- Initial release
- OpenAI, Anthropic, and Google Gemini compatibility
- Native ChatJimmy client
- Stats parsing utilities
- Comprehensive error handling
- Streaming support for all providers