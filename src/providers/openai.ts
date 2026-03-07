/**
 * OpenAI adapter implementation
 */

import { BaseAdapter } from './base';
import {
  ChatJimmyRequest,
  ChatJimmyResponse,
  ChatJimmyStreamChunk,
  OpenAIRequest,
  OpenAIResponse,
  OpenAIError,
  ModelMapping,
  ParameterMapping
} from '../core/types';
import {
  convertOpenAIToChatJimmy,
  convertChatJimmyToOpenAI,
  convertChatJimmyToOpenAIStreamChunk,
  OPENAI_MODEL_MAPPING,
  OPENAI_PARAMETER_MAPPING
} from '../core/converters';

export class OpenAIAdapter extends BaseAdapter {
  constructor() {
    super(OPENAI_MODEL_MAPPING, OPENAI_PARAMETER_MAPPING);
  }

  convertRequest(request: OpenAIRequest): ChatJimmyRequest {
    this.validateOpenAIRequest(request);
    return convertOpenAIToChatJimmy(request);
  }

  convertResponse(response: ChatJimmyResponse, originalRequest?: OpenAIRequest): OpenAIResponse {
    return convertChatJimmyToOpenAI(response, originalRequest);
  }

  convertStreamChunk(chunk: ChatJimmyStreamChunk, requestId?: string): any {
    return convertChatJimmyToOpenAIStreamChunk(chunk, requestId);
  }

  /**
   * Validate OpenAI request
   */
  private validateOpenAIRequest(request: OpenAIRequest): void {
    if (!request.model) {
      throw new OpenAIError('Model is required');
    }

    if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
      throw new OpenAIError('Messages array is required and must contain at least one message');
    }

    // Validate temperature range
    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new OpenAIError('Temperature must be between 0 and 2');
      }
    }

    // Validate top_p range
    if (request.top_p !== undefined) {
      if (request.top_p < 0 || request.top_p > 1) {
        throw new OpenAIError('top_p must be between 0 and 1');
      }
    }

    // Validate max_tokens range
    if (request.max_tokens !== undefined) {
      if (request.max_tokens < 1) {
        throw new OpenAIError('max_tokens must be at least 1');
      }
    }

    // Validate message roles
    for (const message of request.messages) {
      if (!['system', 'user', 'assistant', 'tool'].includes(message.role)) {
        throw new OpenAIError(`Invalid message role: ${message.role}`);
      }

      if (!message.content && !message.tool_calls) {
        throw new OpenAIError('Message content or tool_calls is required');
      }
    }
  }

  /**
   * Create OpenAI error response
   */
  createErrorResponse(error: OpenAIError, originalRequest?: OpenAIRequest): OpenAIResponse {
    const now = Math.floor(Date.now() / 1000);

    return {
      id: `chatcmpl-error-${now}`,
      object: 'chat.completion',
      created: now,
      model: originalRequest?.model || 'gpt-4o',
      choices: [],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  /**
   * Get supported OpenAI models
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
   * Normalize OpenAI parameters to ChatJimmy range
   */
  normalizeParameters(request: OpenAIRequest): OpenAIRequest {
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

    if (normalizedRequest.max_tokens !== undefined) {
      normalizedRequest.max_tokens = this.normalizeParameter(
        normalizedRequest.max_tokens,
        'maxTokens'
      ) as number;
    }

    return normalizedRequest;
  }

  /**
   * Extract system prompt from OpenAI messages
   */
  extractSystemPrompt(messages: OpenAIRequest['messages']): string {
    const systemMessages = messages.filter(msg => msg.role === 'system');
    return systemMessages.map(msg => msg.content).join('\n');
  }

  /**
   * Extract user/assistant messages from OpenAI messages
   */
  extractConversationMessages(messages: OpenAIRequest['messages']): OpenAIRequest['messages'] {
    return messages.filter(msg => msg.role === 'user' || msg.role === 'assistant');
  }
}