/**
 * Tests for conversion functions
 */

import {
  convertOpenAIToChatJimmy,
  convertAnthropicToChatJimmy,
  convertGoogleToChatJimmy,
  parseStatsFromResponse,
  extractContent,
  extractStats,
  OPENAI_MODEL_MAPPING,
  ANTHROPIC_MODEL_MAPPING,
  GEMINI_MODEL_MAPPING
} from '../src/core/converters';

import {
  OpenAIRequest,
  AnthropicRequest,
  GeminiRequest
} from '../src/core/types';

describe('OpenAI Conversions', () => {
  test('convertOpenAIToChatJimmy converts basic request', () => {
    const openAIRequest: OpenAIRequest = {
      model: 'gpt-4o',
      messages: [
        { role: 'system' as const, content: 'You are helpful.' },
        { role: 'user' as const, content: 'Hello!' }
      ],
      temperature: 0.7,
      max_tokens: 100
    };

    const result = convertOpenAIToChatJimmy(openAIRequest);

    expect(result).toHaveProperty('messages');
    expect(result.messages).toHaveLength(1); // System message extracted
    expect(result.messages[0]).toEqual({
      role: 'user',
      content: 'Hello!'
    });

    expect(result).toHaveProperty('chatOptions');
    expect(result.chatOptions.selectedModel).toBe(OPENAI_MODEL_MAPPING['gpt-4o']);
    expect(result.chatOptions.systemPrompt).toBe('You are helpful.');
    expect(result.chatOptions.temperature).toBe(0.7);
    expect(result.chatOptions.maxTokens).toBe(100);
  });

  test('convertOpenAIToChatJimmy handles multiple messages', () => {
    const openAIRequest: OpenAIRequest = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user' as const, content: 'Hi' },
        { role: 'assistant' as const, content: 'Hello!' },
        { role: 'user' as const, content: 'How are you?' }
      ]
    };

    const result = convertOpenAIToChatJimmy(openAIRequest);

    expect(result.messages).toHaveLength(3);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content).toBe('Hi');
    expect(result.messages[1].role).toBe('assistant');
    expect(result.messages[1].content).toBe('Hello!');
    expect(result.messages[2].role).toBe('user');
    expect(result.messages[2].content).toBe('How are you?');
  });

  test('convertOpenAIToChatJimmy maps model correctly', () => {
    const models = Object.keys(OPENAI_MODEL_MAPPING);

    for (const model of models) {
      const request: OpenAIRequest = {
        model,
        messages: [{ role: 'user' as const, content: 'test' }]
      };

      const result = convertOpenAIToChatJimmy(request);
      expect(result.chatOptions.selectedModel).toBe(OPENAI_MODEL_MAPPING[model]);
    }
  });
});

describe('Anthropic Conversions', () => {
  test('convertAnthropicToChatJimmy converts basic request', () => {
    const anthropicRequest: AnthropicRequest = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: 'You are helpful.',
      messages: [
        { role: 'user' as const, content: 'Hello!' }
      ],
      temperature: 1.0
    };

    const result = convertAnthropicToChatJimmy(anthropicRequest);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).toEqual({
      role: 'user',
      content: 'Hello!'
    });

    expect(result.chatOptions.selectedModel).toBe(ANTHROPIC_MODEL_MAPPING['claude-sonnet-4-5-20250929']);
    expect(result.chatOptions.systemPrompt).toBe('You are helpful.');
    expect(result.chatOptions.maxTokens).toBe(1024);
    expect(result.chatOptions.temperature).toBe(1.0);
  });

  test('convertAnthropicToChatJimmy handles content blocks', () => {
    const anthropicRequest: AnthropicRequest = {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Hello' },
            { type: 'text' as const, text: 'World' }
          ]
        }
      ]
    };

    const result = convertAnthropicToChatJimmy(anthropicRequest);

    expect(result.messages[0].content).toBe('Hello\nWorld');
  });

  test('convertAnthropicToChatJimmy maps model correctly', () => {
    const models = Object.keys(ANTHROPIC_MODEL_MAPPING);

    for (const model of models) {
      const request: AnthropicRequest = {
        model,
        max_tokens: 100,
        messages: [{ role: 'user' as const, content: 'test' }]
      };

      const result = convertAnthropicToChatJimmy(request);
      expect(result.chatOptions.selectedModel).toBe(ANTHROPIC_MODEL_MAPPING[model]);
    }
  });
});

describe('Google Gemini Conversions', () => {
  test('convertGoogleToChatJimmy converts basic request', () => {
    const geminiRequest: GeminiRequest = {
      contents: [
        {
          role: 'user' as const,
          parts: [{ text: 'Hello!' }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100
      }
    };

    const result = convertGoogleToChatJimmy(geminiRequest);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).toEqual({
      role: 'user',
      content: 'Hello!'
    });

    expect(result.chatOptions.temperature).toBe(0.7);
    expect(result.chatOptions.maxTokens).toBe(100);
  });

  test('convertGoogleToChatJimmy handles system instruction', () => {
    const geminiRequest: GeminiRequest = {
      contents: [
        {
          role: 'user' as const,
          parts: [{ text: 'Hello!' }]
        }
      ],
      systemInstruction: {
        parts: [{ text: 'You are helpful.' }]
      }
    };

    const result = convertGoogleToChatJimmy(geminiRequest);

    expect(result.chatOptions.systemPrompt).toBe('You are helpful.');
  });

  test('convertGoogleToChatJimmy maps model correctly', () => {
    // Note: Google models are mapped to default 'llama3.1-8B' in current implementation
    const result = convertGoogleToChatJimmy({
      contents: [{ role: 'user', parts: [{ text: 'test' }] }]
    });

    expect(result.chatOptions.selectedModel).toBe('llama3.1-8B');
  });
});

describe('Stats Parsing', () => {
  const sampleResponse = `Hello, this is a test response.
<|stats|>{"created_at":1772890052.9876554,"done":true,"done_reason":"stop","total_duration":0.004286766052246094,"logprobs":null,"topk":8,"ttft":0.0011785030364990234,"reason":"termination token detected","status":0,"prefill_tokens":22,"prefill_rate":18667.75,"decode_tokens":19,"decode_rate":17046.37,"total_tokens":41,"total_time":0.0023031234741210938,"roundtrip_time":13}<|/stats|>`;

  test('parseStatsFromResponse extracts stats and content', () => {
    const result = parseStatsFromResponse(sampleResponse);

    expect(result.content).toBe('Hello, this is a test response.');
    expect(result.stats).toHaveProperty('created_at', 1772890052.9876554);
    expect(result.stats).toHaveProperty('total_tokens', 41);
    expect(result.stats).toHaveProperty('prefill_tokens', 22);
    expect(result.stats).toHaveProperty('decode_tokens', 19);
    expect(result.stats).toHaveProperty('done', true);
  });

  test('extractContent removes stats tags', () => {
    const content = extractContent(sampleResponse);
    expect(content).toBe('Hello, this is a test response.');
    expect(content).not.toContain('<|stats|>');
    expect(content).not.toContain('<|/stats|>');
  });

  test('extractStats extracts stats object', () => {
    const stats = extractStats(sampleResponse);
    expect(stats).not.toBeNull();
    expect(stats).toHaveProperty('total_tokens', 41);
    expect(stats).toHaveProperty('done', true);
  });

  test('extractStats returns null for response without stats', () => {
    const stats = extractStats('Just plain text without stats.');
    expect(stats).toBeNull();
  });

  test('parseStatsFromResponse throws error for invalid JSON', () => {
    const invalidResponse = 'Test<|stats|>{invalid json}<|/stats|>';
    expect(() => parseStatsFromResponse(invalidResponse)).toThrow();
  });
});

describe('Model Mappings', () => {
  test('OPENAI_MODEL_MAPPING contains expected models', () => {
    expect('gpt-4o' in OPENAI_MODEL_MAPPING).toBe(true);
    expect('gpt-4o-mini' in OPENAI_MODEL_MAPPING).toBe(true);
    expect('gpt-3.5-turbo' in OPENAI_MODEL_MAPPING).toBe(true);
    expect(OPENAI_MODEL_MAPPING['gpt-4o']).toBe('llama3.1-8B');
  });

  test('ANTHROPIC_MODEL_MAPPING contains expected models', () => {
    expect(ANTHROPIC_MODEL_MAPPING).toHaveProperty('claude-sonnet-4-5-20250929');
    expect(ANTHROPIC_MODEL_MAPPING).toHaveProperty('claude-3-5-haiku-20241022');
    expect(ANTHROPIC_MODEL_MAPPING['claude-sonnet-4-5-20250929']).toBe('llama3.1-8B');
  });

  test('GEMINI_MODEL_MAPPING contains expected models', () => {
    expect('gemini-1.5-pro' in GEMINI_MODEL_MAPPING).toBe(true);
    expect('gemini-1.5-flash' in GEMINI_MODEL_MAPPING).toBe(true);
    expect(GEMINI_MODEL_MAPPING['gemini-1.5-pro']).toBe('llama3.1-8B');
  });
});