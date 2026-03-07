/**
 * Conversion functions between ChatJimmy and provider formats
 */

import {
  ChatJimmyMessage,
  ChatJimmyChatOptions,
  ChatJimmyRequest,
  ChatJimmyResponse,
  ChatJimmyStats,
  ChatJimmyStreamChunk,
  OpenAIMessage,
  OpenAIRequest,
  OpenAIResponse,
  AnthropicMessageParam,
  AnthropicContentBlock,
  AnthropicRequest,
  AnthropicResponse,
  GeminiContent,
  GeminiPart,
  GeminiRequest,
  GeminiResponse,
  ModelMapping,
  ParameterMapping,
  StatsData,
  ParsedStats
} from './types';

// ==================== Model Mappings ====================

export const OPENAI_MODEL_MAPPING: ModelMapping = {
  'gpt-4o': 'llama3.1-8B',
  'gpt-4o-mini': 'llama3.1-8B',
  'gpt-4-turbo': 'llama3.1-8B',
  'gpt-3.5-turbo': 'llama3.1-8B',
  'gpt-4': 'llama3.1-8B',
  'gpt-3.5-turbo-instruct': 'llama3.1-8B'
};

export const ANTHROPIC_MODEL_MAPPING: ModelMapping = {
  'claude-opus-4-5-20251101': 'llama3.1-8B',
  'claude-sonnet-4-5-20250929': 'llama3.1-8B',
  'claude-3-5-haiku-20241022': 'llama3.1-8B',
  'claude-3-opus-20240229': 'llama3.1-8B',
  'claude-3-sonnet-20240229': 'llama3.1-8B',
  'claude-3-haiku-20240307': 'llama3.1-8B'
};

export const GEMINI_MODEL_MAPPING: ModelMapping = {
  'gemini-1.5-pro': 'llama3.1-8B',
  'gemini-1.5-flash': 'llama3.1-8B',
  'gemini-1.0-pro': 'llama3.1-8B',
  'gemini-1.0-ultra': 'llama3.1-8B'
};

// ==================== Parameter Mappings ====================

export const OPENAI_PARAMETER_MAPPING: ParameterMapping = {
  temperature: { min: 0, max: 2, default: 1 },
  topP: { min: 0, max: 1, default: 1 },
  maxTokens: { min: 1, max: 4096, default: 1024 }
};

export const ANTHROPIC_PARAMETER_MAPPING: ParameterMapping = {
  temperature: { min: 0, max: 1, default: 1 },
  topP: { min: 0, max: 1, default: 1 },
  topK: { min: 0, max: 100, default: 8 },
  maxTokens: { min: 1, max: 4096, default: 1024 }
};

export const GEMINI_PARAMETER_MAPPING: ParameterMapping = {
  temperature: { min: 0, max: 1, default: 0.7 },
  topP: { min: 0, max: 1, default: 0.95 },
  topK: { min: 1, max: 40, default: 40 },
  maxTokens: { min: 1, max: 8192, default: 2048 }
};

// ==================== OpenAI Conversions ====================

/**
 * Convert OpenAI request to ChatJimmy request
 */
export function convertOpenAIToChatJimmy(request: OpenAIRequest): ChatJimmyRequest {
  // Extract system message if present
  let systemPrompt = '';
  const messages: ChatJimmyMessage[] = [];

  for (const msg of request.messages) {
    if (msg.role === 'system') {
      systemPrompt = msg.content;
    } else if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
    // Note: OpenAI tool messages are not supported in basic conversion
  }

  // Map model
  const selectedModel = OPENAI_MODEL_MAPPING[request.model] || 'llama3.1-8B';

  // Map parameters
  const chatOptions: ChatJimmyChatOptions = {
    selectedModel,
    systemPrompt,
    temperature: request.temperature,
    topK: 8, // Default for ChatJimmy
    maxTokens: request.max_tokens,
    stopSequences: Array.isArray(request.stop) ? request.stop : request.stop ? [request.stop] : undefined,
    stream: request.stream
  };

  // Map top_p if provided
  if (request.top_p !== undefined) {
    chatOptions.topP = request.top_p;
  }

  return {
    messages,
    chatOptions,
    attachment: null
  };
}

/**
 * Convert ChatJimmy response to OpenAI response
 */
export function convertChatJimmyToOpenAI(
  response: ChatJimmyResponse,
  originalRequest?: OpenAIRequest
): OpenAIResponse {
  const now = Math.floor(Date.now() / 1000);

  return {
    id: `chatcmpl-${now}`,
    object: 'chat.completion',
    created: now,
    model: originalRequest?.model || 'gpt-4o',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: response.content
      },
      finish_reason: 'stop',
      logprobs: null
    }],
    usage: {
      prompt_tokens: response.stats.prefill_tokens,
      completion_tokens: response.stats.decode_tokens,
      total_tokens: response.stats.total_tokens
    },
    system_fingerprint: `chatjimmy-${response.stats.created_at}`
  };
}

// ==================== Anthropic Conversions ====================

/**
 * Convert Anthropic request to ChatJimmy request
 */
export function convertAnthropicToChatJimmy(request: AnthropicRequest): ChatJimmyRequest {
  // Extract system prompt
  let systemPrompt = '';
  if (typeof request.system === 'string') {
    systemPrompt = request.system;
  } else if (Array.isArray(request.system)) {
    // Extract text from system content blocks
    const textBlocks = request.system
      .filter(block => block.type === 'text' && block.text)
      .map(block => block.text);
    systemPrompt = textBlocks.join('\n');
  }

  // Convert messages
  const messages: ChatJimmyMessage[] = [];

  for (const msg of request.messages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      } else if (Array.isArray(msg.content)) {
        // Extract text from content blocks
        const textBlocks = msg.content
          .filter((block: AnthropicContentBlock) => block.type === 'text' && block.text)
          .map((block: AnthropicContentBlock) => block.text);
        messages.push({
          role: msg.role,
          content: textBlocks.join('\n')
        });
      }
    }
  }

  // Map model
  const selectedModel = ANTHROPIC_MODEL_MAPPING[request.model] || 'llama3.1-8B';

  // Map parameters
  const chatOptions: ChatJimmyChatOptions = {
    selectedModel,
    systemPrompt,
    temperature: request.temperature,
    topK: request.top_k !== undefined ? request.top_k : 8,
    topP: request.top_p,
    maxTokens: request.max_tokens,
    stopSequences: request.stop_sequences,
    stream: request.stream
  };

  return {
    messages,
    chatOptions,
    attachment: null
  };
}

/**
 * Convert ChatJimmy response to Anthropic response
 */
export function convertChatJimmyToAnthropic(
  response: ChatJimmyResponse,
  originalRequest?: AnthropicRequest
): AnthropicResponse {
  return {
    id: `msg-${response.stats.created_at}`,
    type: 'message',
    role: 'assistant',
    model: originalRequest?.model || 'claude-sonnet-4-5-20250929',
    content: [{
      type: 'text',
      text: response.content
    }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: response.stats.prefill_tokens,
      output_tokens: response.stats.decode_tokens,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0
    }
  };
}

// ==================== Google Gemini Conversions ====================

/**
 * Convert Google Gemini request to ChatJimmy request
 */
export function convertGoogleToChatJimmy(request: GeminiRequest): ChatJimmyRequest {
  // Extract system instruction
  let systemPrompt = '';
  if (request.systemInstruction?.parts) {
    const textParts = request.systemInstruction.parts
      .filter(part => part.text)
      .map(part => part.text);
    systemPrompt = textParts.join('\n');
  }

  // Convert contents to messages
  const messages: ChatJimmyMessage[] = [];

  for (const content of request.contents) {
    if (content.role === 'user' || content.role === 'model') {
      const textParts = content.parts
        .filter(part => part.text)
        .map(part => part.text);

      if (textParts.length > 0) {
        messages.push({
          role: content.role === 'user' ? 'user' : 'assistant',
          content: textParts.join('\n')
        });
      }
    }
  }

  // Map model (default to llama3.1-8B since Gemini models need mapping)
  const selectedModel = 'llama3.1-8B';

  // Map parameters from generationConfig
  const genConfig = request.generationConfig || {};
  const chatOptions: ChatJimmyChatOptions = {
    selectedModel,
    systemPrompt,
    temperature: genConfig.temperature,
    topK: genConfig.topK !== undefined ? genConfig.topK : 8,
    topP: genConfig.topP,
    maxTokens: genConfig.maxOutputTokens,
    stopSequences: genConfig.stopSequences
  };

  return {
    messages,
    chatOptions,
    attachment: null
  };
}

/**
 * Convert ChatJimmy response to Google Gemini response
 */
export function convertChatJimmyToGoogle(
  response: ChatJimmyResponse,
  originalRequest?: GeminiRequest
): GeminiResponse {
  return {
    candidates: [{
      content: {
        role: 'model',
        parts: [{
          text: response.content
        }]
      },
      finishReason: 'STOP',
      safetyRatings: [],
      tokenCount: response.stats.total_tokens
    }],
    usageMetadata: {
      promptTokenCount: response.stats.prefill_tokens,
      candidatesTokenCount: response.stats.decode_tokens,
      totalTokenCount: response.stats.total_tokens
    }
  };
}

// ==================== Parameter Normalization ====================

/**
 * Normalize parameter value to ChatJimmy range
 */
export function normalizeParameter(
  value: number | undefined,
  providerMapping: ParameterMapping,
  paramName: keyof ParameterMapping
): number | undefined {
  if (value === undefined) return undefined;

  const mapping = providerMapping[paramName];
  if (!mapping) return value;

  const { min, max } = mapping;

  // Clamp value to range
  let normalized = Math.max(min, Math.min(max, value));

  // Special handling for temperature (OpenAI uses 0-2, ChatJimmy uses 0-1)
  if (paramName === 'temperature' && max === 2) {
    normalized = normalized / 2; // Scale from 0-2 to 0-1
  }

  return normalized;
}

/**
 * Denormalize parameter value from ChatJimmy to provider range
 */
export function denormalizeParameter(
  value: number | undefined,
  providerMapping: ParameterMapping,
  paramName: keyof ParameterMapping
): number | undefined {
  if (value === undefined) return undefined;

  const mapping = providerMapping[paramName];
  if (!mapping) return value;

  const { min, max } = mapping;

  // Special handling for temperature (ChatJimmy uses 0-1, OpenAI uses 0-2)
  if (paramName === 'temperature' && max === 2) {
    return value * 2; // Scale from 0-1 to 0-2
  }

  // Clamp value to range
  return Math.max(min, Math.min(max, value));
}

// ==================== Stats Parsing ====================

/**
 * Parse stats from ChatJimmy response
 */
export function parseStatsFromResponse(responseText: string): ParsedStats {
  const statsRegex = new RegExp('<\\|stats\\|>(.*?)<\\|/stats\\|>', 's');
  const match = responseText.match(statsRegex);

  if (!match) {
    throw new Error('No stats found in response');
  }

  try {
    const statsData: StatsData = JSON.parse(match[1]);
    const content = responseText.replace(statsRegex, '').trim();

    return {
      stats: statsData,
      content
    };
  } catch (error) {
    throw new Error(`Failed to parse stats: ${error}`);
  }
}

/**
 * Extract stats from response text
 */
export function extractStats(responseText: string): ChatJimmyStats | null {
  try {
    const parsed = parseStatsFromResponse(responseText);
    return parsed.stats as ChatJimmyStats;
  } catch {
    return null;
  }
}

/**
 * Extract content from response text (removes stats tags)
 */
export function extractContent(responseText: string): string {
  try {
    const parsed = parseStatsFromResponse(responseText);
    return parsed.content;
  } catch {
    // If no stats tags, return original text
    return responseText ? responseText.trim() : '';
  }
}

// ==================== Stream Conversion Helpers ====================

/**
 * Convert ChatJimmy stream chunk to OpenAI stream chunk
 */
export function convertChatJimmyToOpenAIStreamChunk(
  chunk: ChatJimmyStreamChunk,
  requestId: string = 'chatcmpl-stream'
): any {
  const now = Math.floor(Date.now() / 1000);

  return {
    id: requestId,
    object: 'chat.completion.chunk',
    created: now,
    model: 'gpt-4o',
    choices: [{
      index: 0,
      delta: {
        content: chunk.content
      },
      finish_reason: chunk.done ? 'stop' : null,
      logprobs: null
    }]
  };
}

/**
 * Convert ChatJimmy stream chunk to Anthropic stream chunk
 */
export function convertChatJimmyToAnthropicStreamChunk(
  chunk: ChatJimmyStreamChunk,
  index: number = 0
): any {
  if (chunk.done) {
    return {
      type: 'message_stop',
      usage: {
        output_tokens: chunk.stats?.decode_tokens || 0
      }
    };
  }

  return {
    type: 'content_block_delta',
    index,
    delta: {
      type: 'text_delta',
      text: chunk.content
    }
  };
}