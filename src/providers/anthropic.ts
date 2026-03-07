/**
 * Anthropic adapter implementation
 */

import { BaseAdapter } from './base';
import {
  ChatJimmyRequest,
  ChatJimmyResponse,
  ChatJimmyStreamChunk,
  AnthropicRequest,
  AnthropicResponse,
  AnthropicContentBlock,
  AnthropicError,
  ModelMapping,
  ParameterMapping
} from '../core/types';
import {
  convertAnthropicToChatJimmy,
  convertChatJimmyToAnthropic,
  convertChatJimmyToAnthropicStreamChunk,
  ANTHROPIC_MODEL_MAPPING,
  ANTHROPIC_PARAMETER_MAPPING
} from '../core/converters';

export class AnthropicAdapter extends BaseAdapter {
  constructor() {
    super(ANTHROPIC_MODEL_MAPPING, ANTHROPIC_PARAMETER_MAPPING);
  }

  convertRequest(request: AnthropicRequest): ChatJimmyRequest {
    this.validateAnthropicRequest(request);
    return convertAnthropicToChatJimmy(request);
  }

  convertResponse(response: ChatJimmyResponse, originalRequest?: AnthropicRequest): AnthropicResponse {
    return convertChatJimmyToAnthropic(response, originalRequest);
  }

  convertStreamChunk(chunk: ChatJimmyStreamChunk, index: number = 0): any {
    return convertChatJimmyToAnthropicStreamChunk(chunk, index);
  }

  /**
   * Validate Anthropic request
   */
  private validateAnthropicRequest(request: AnthropicRequest): void {
    if (!request.model) {
      throw new AnthropicError('Model is required');
    }

    if (!request.max_tokens) {
      throw new AnthropicError('max_tokens is required');
    }

    if (request.max_tokens < 1) {
      throw new AnthropicError('max_tokens must be at least 1');
    }

    if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
      throw new AnthropicError('Messages array is required and must contain at least one message');
    }

    // Validate temperature range
    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 1) {
        throw new AnthropicError('Temperature must be between 0 and 1');
      }
    }

    // Validate top_p range
    if (request.top_p !== undefined) {
      if (request.top_p < 0 || request.top_p > 1) {
        throw new AnthropicError('top_p must be between 0 and 1');
      }
    }

    // Validate top_k range
    if (request.top_k !== undefined) {
      if (request.top_k < 0 || request.top_k > 100) {
        throw new AnthropicError('top_k must be between 0 and 100');
      }
    }

    // Validate thinking budget if provided
    if (request.thinking?.budget_tokens !== undefined) {
      if (request.thinking.budget_tokens < 1024) {
        throw new AnthropicError('Thinking budget must be at least 1024 tokens');
      }
      if (request.thinking.budget_tokens >= request.max_tokens) {
        throw new AnthropicError('Thinking budget must be less than max_tokens');
      }
    }

    // Validate message structure
    for (const message of request.messages) {
      if (!['user', 'assistant'].includes(message.role)) {
        throw new AnthropicError(`Invalid message role: ${message.role}`);
      }

      if (!message.content) {
        throw new AnthropicError('Message content is required');
      }

      // Validate content blocks if array
      if (Array.isArray(message.content)) {
        for (const block of message.content) {
          if (!block.type) {
            throw new AnthropicError('Content block type is required');
          }
        }
      }
    }
  }

  /**
   * Create Anthropic error response
   */
  createErrorResponse(error: AnthropicError, originalRequest?: AnthropicRequest): AnthropicResponse {
    return {
      id: `msg-error-${Date.now()}`,
      type: 'message',
      role: 'assistant',
      model: originalRequest?.model || 'claude-sonnet-4-5-20250929',
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      stop_reason: 'refusal',
      stop_sequence: null,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0
      }
    };
  }

  /**
   * Get supported Anthropic models
   */
  getSupportedModels(): string[] {
    return Object.keys(this.modelMapping);
  }

  /**
   * Check if model is supported
   */
  isModelSupported(model: string): boolean {
    return this.modelMapping[model] !== undefined;
  }

  /**
   * Normalize Anthropic parameters to ChatJimmy range
   */
  normalizeParameters(request: AnthropicRequest): AnthropicRequest {
    const normalizedRequest = { ...request };

    if (normalizedRequest.temperature !== undefined) {
      normalizedRequest.temperature = this.normalizeParameter(
        normalizedRequest.temperature,
        'temperature'
      ) as number;
    }

    if (normalizedRequest.top_p !== undefined) {
      normalizedRequest.top_p = this.normalizeParameter(
        normalizedRequest.top_p,
        'topP'
      ) as number;
    }

    if (normalizedRequest.top_k !== undefined) {
      normalizedRequest.top_k = this.normalizeParameter(
        normalizedRequest.top_k,
        'topK'
      ) as number;
    }

    if (normalizedRequest.max_tokens !== undefined) {
      normalizedRequest.max_tokens = this.normalizeParameter(
        normalizedRequest.max_tokens,
        'maxTokens'
      ) as number;
    }

    return normalizedRequest;
  }

  /**
   * Extract text from Anthropic content blocks
   */
  extractTextFromContentBlocks(content: string | AnthropicContentBlock[]): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      const textBlocks = content
        .filter(block => block.type === 'text' && block.text)
        .map(block => block.text);
      return textBlocks.join('\n');
    }

    return '';
  }

  /**
   * Convert text to Anthropic content blocks
   */
  convertTextToContentBlocks(text: string): AnthropicContentBlock[] {
    return [{
      type: 'text',
      text: text
    }];
  }

  /**
   * Handle system prompt extraction
   */
  extractSystemPrompt(request: AnthropicRequest): string {
    if (typeof request.system === 'string') {
      return request.system;
    }

    if (Array.isArray(request.system)) {
      return this.extractTextFromContentBlocks(request.system);
    }

    return '';
  }

  /**
   * Handle tool definitions
   */
  normalizeTools(tools?: AnthropicRequest['tools']): AnthropicRequest['tools'] {
    if (!tools) return undefined;

    return tools.map(tool => ({
      name: tool.name,
      description: tool.description || '',
      input_schema: tool.input_schema
    }));
  }
}