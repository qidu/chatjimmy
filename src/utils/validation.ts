/**
 * Validation utilities for ChatJimmy SDK
 */

import {
  ChatJimmyRequest,
  ChatJimmyMessage,
  ChatJimmyChatOptions,
  OpenAIRequest,
  AnthropicRequest,
  GeminiRequest
} from '../core/types';
import { createValidationError, createParameterError } from './errors';

/**
 * Validate ChatJimmy request
 */
export function validateChatJimmyRequest(request: ChatJimmyRequest): void {
  if (!request) {
    throw createValidationError('request', 'Request is required');
  }

  validateMessages(request.messages);
  validateChatOptions(request.chatOptions);

  // Validate attachment if present
  if (request.attachment !== undefined && request.attachment !== null) {
    validateAttachment(request.attachment);
  }
}

/**
 * Validate messages array
 */
export function validateMessages(messages: ChatJimmyMessage[]): void {
  if (!Array.isArray(messages)) {
    throw createValidationError('messages', 'Must be an array');
  }

  if (messages.length === 0) {
    throw createValidationError('messages', 'Must contain at least one message');
  }

  for (let i = 0; i < messages.length; i++) {
    validateMessage(messages[i], i);
  }
}

/**
 * Validate individual message
 */
export function validateMessage(message: ChatJimmyMessage, index: number): void {
  if (!message) {
    throw createValidationError(`messages[${index}]`, 'Message is required');
  }

  if (!['user', 'assistant', 'system'].includes(message.role)) {
    throw createValidationError(
      `messages[${index}].role`,
      `Invalid role "${message.role}". Must be one of: user, assistant, system`
    );
  }

  if (typeof message.content !== 'string') {
    throw createValidationError(
      `messages[${index}].content`,
      'Must be a string'
    );
  }

  if (message.content.trim().length === 0) {
    throw createValidationError(
      `messages[${index}].content`,
      'Cannot be empty'
    );
  }
}

/**
 * Validate chat options
 */
export function validateChatOptions(options: ChatJimmyChatOptions): void {
  if (!options) {
    throw createValidationError('chatOptions', 'Chat options are required');
  }

  if (typeof options.selectedModel !== 'string') {
    throw createValidationError('chatOptions.selectedModel', 'Must be a string');
  }

  if (options.selectedModel.trim().length === 0) {
    throw createValidationError('chatOptions.selectedModel', 'Cannot be empty');
  }

  // Validate temperature
  if (options.temperature !== undefined) {
    if (typeof options.temperature !== 'number') {
      throw createValidationError('chatOptions.temperature', 'Must be a number');
    }
    if (options.temperature < 0 || options.temperature > 1) {
      throw createParameterError(
        'chatOptions.temperature',
        options.temperature,
        'number between 0 and 1'
      );
    }
  }

  // Validate topK
  if (options.topK !== undefined) {
    if (typeof options.topK !== 'number') {
      throw createValidationError('chatOptions.topK', 'Must be a number');
    }
    if (options.topK < 0) {
      throw createParameterError(
        'chatOptions.topK',
        options.topK,
        'non-negative number'
      );
    }
  }

  // Validate topP
  if (options.topP !== undefined) {
    if (typeof options.topP !== 'number') {
      throw createValidationError('chatOptions.topP', 'Must be a number');
    }
    if (options.topP < 0 || options.topP > 1) {
      throw createParameterError(
        'chatOptions.topP',
        options.topP,
        'number between 0 and 1'
      );
    }
  }

  // Validate maxTokens
  if (options.maxTokens !== undefined) {
    if (typeof options.maxTokens !== 'number') {
      throw createValidationError('chatOptions.maxTokens', 'Must be a number');
    }
    if (options.maxTokens < 1) {
      throw createParameterError(
        'chatOptions.maxTokens',
        options.maxTokens,
        'number >= 1'
      );
    }
  }

  // Validate stopSequences
  if (options.stopSequences !== undefined) {
    if (!Array.isArray(options.stopSequences)) {
      throw createValidationError('chatOptions.stopSequences', 'Must be an array');
    }
    for (let i = 0; i < options.stopSequences.length; i++) {
      if (typeof options.stopSequences[i] !== 'string') {
        throw createValidationError(
          `chatOptions.stopSequences[${i}]`,
          'Must be a string'
        );
      }
    }
  }

  // Validate stream
  if (options.stream !== undefined && typeof options.stream !== 'boolean') {
    throw createValidationError('chatOptions.stream', 'Must be a boolean');
  }
}

/**
 * Validate attachment
 */
export function validateAttachment(attachment: any): void {
  if (!attachment) {
    throw createValidationError('attachment', 'Attachment is required when provided');
  }

  if (typeof attachment !== 'object') {
    throw createValidationError('attachment', 'Must be an object');
  }

  if (!['image', 'document', 'audio', 'video'].includes(attachment.type)) {
    throw createValidationError(
      'attachment.type',
      `Invalid type "${attachment.type}". Must be one of: image, document, audio, video`
    );
  }

  if (typeof attachment.data !== 'string') {
    throw createValidationError('attachment.data', 'Must be a string (base64 encoded)');
  }

  if (typeof attachment.mimeType !== 'string') {
    throw createValidationError('attachment.mimeType', 'Must be a string');
  }

  if (attachment.mimeType.trim().length === 0) {
    throw createValidationError('attachment.mimeType', 'Cannot be empty');
  }

  if (attachment.filename !== undefined && typeof attachment.filename !== 'string') {
    throw createValidationError('attachment.filename', 'Must be a string if provided');
  }
}

/**
 * Validate OpenAI request
 */
export function validateOpenAIRequest(request: OpenAIRequest): void {
  if (!request) {
    throw createValidationError('request', 'Request is required', 'openai');
  }

  if (!request.model) {
    throw createValidationError('model', 'Model is required', 'openai');
  }

  if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
    throw createValidationError('messages', 'Must be a non-empty array', 'openai');
  }

  // Validate temperature
  if (request.temperature !== undefined) {
    if (typeof request.temperature !== 'number') {
      throw createValidationError('temperature', 'Must be a number', 'openai');
    }
    if (request.temperature < 0 || request.temperature > 2) {
      throw createParameterError(
        'temperature',
        request.temperature,
        'number between 0 and 2',
        'openai'
      );
    }
  }

  // Validate max_tokens
  if (request.max_tokens !== undefined) {
    if (typeof request.max_tokens !== 'number') {
      throw createValidationError('max_tokens', 'Must be a number', 'openai');
    }
    if (request.max_tokens < 1) {
      throw createParameterError(
        'max_tokens',
        request.max_tokens,
        'number >= 1',
        'openai'
      );
    }
  }

  // Validate messages
  for (let i = 0; i < request.messages.length; i++) {
    const msg = request.messages[i];
    if (!msg.role) {
      throw createValidationError(`messages[${i}].role`, 'Role is required', 'openai');
    }
    if (!['system', 'user', 'assistant', 'tool'].includes(msg.role)) {
      throw createValidationError(
        `messages[${i}].role`,
        `Invalid role "${msg.role}"`,
        'openai'
      );
    }
    if (!msg.content && !msg.tool_calls) {
      throw createValidationError(
        `messages[${i}]`,
        'Content or tool_calls is required',
        'openai'
      );
    }
  }
}

/**
 * Validate Anthropic request
 */
export function validateAnthropicRequest(request: AnthropicRequest): void {
  if (!request) {
    throw createValidationError('request', 'Request is required', 'anthropic');
  }

  if (!request.model) {
    throw createValidationError('model', 'Model is required', 'anthropic');
  }

  if (!request.max_tokens) {
    throw createValidationError('max_tokens', 'max_tokens is required', 'anthropic');
  }

  if (typeof request.max_tokens !== 'number' || request.max_tokens < 1) {
    throw createParameterError(
      'max_tokens',
      request.max_tokens,
      'number >= 1',
      'anthropic'
    );
  }

  if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
    throw createValidationError('messages', 'Must be a non-empty array', 'anthropic');
  }

  // Validate temperature
  if (request.temperature !== undefined) {
    if (typeof request.temperature !== 'number') {
      throw createValidationError('temperature', 'Must be a number', 'anthropic');
    }
    if (request.temperature < 0 || request.temperature > 1) {
      throw createParameterError(
        'temperature',
        request.temperature,
        'number between 0 and 1',
        'anthropic'
      );
    }
  }

  // Validate messages
  for (let i = 0; i < request.messages.length; i++) {
    const msg = request.messages[i];
    if (!msg.role) {
      throw createValidationError(`messages[${i}].role`, 'Role is required', 'anthropic');
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      throw createValidationError(
        `messages[${i}].role`,
        `Invalid role "${msg.role}"`,
        'anthropic'
      );
    }
    if (!msg.content) {
      throw createValidationError(`messages[${i}].content`, 'Content is required', 'anthropic');
    }
  }
}

/**
 * Validate Google Gemini request
 */
export function validateGoogleRequest(request: GeminiRequest): void {
  if (!request) {
    throw createValidationError('request', 'Request is required', 'google');
  }

  if (!request.contents || !Array.isArray(request.contents) || request.contents.length === 0) {
    throw createValidationError('contents', 'Must be a non-empty array', 'google');
  }

  // Validate generation config if present
  if (request.generationConfig) {
    const config = request.generationConfig;

    if (config.temperature !== undefined) {
      if (typeof config.temperature !== 'number') {
        throw createValidationError('generationConfig.temperature', 'Must be a number', 'google');
      }
      if (config.temperature < 0 || config.temperature > 1) {
        throw createParameterError(
          'generationConfig.temperature',
          config.temperature,
          'number between 0 and 1',
          'google'
        );
      }
    }

    if (config.maxOutputTokens !== undefined) {
      if (typeof config.maxOutputTokens !== 'number') {
        throw createValidationError('generationConfig.maxOutputTokens', 'Must be a number', 'google');
      }
      if (config.maxOutputTokens < 1) {
        throw createParameterError(
          'generationConfig.maxOutputTokens',
          config.maxOutputTokens,
          'number >= 1',
          'google'
        );
      }
    }
  }

  // Validate contents
  for (let i = 0; i < request.contents.length; i++) {
    const content = request.contents[i];
    if (!content.role) {
      throw createValidationError(`contents[${i}].role`, 'Role is required', 'google');
    }
    if (!['user', 'model'].includes(content.role)) {
      throw createValidationError(
        `contents[${i}].role`,
        `Invalid role "${content.role}"`,
        'google'
      );
    }
    if (!content.parts || !Array.isArray(content.parts) || content.parts.length === 0) {
      throw createValidationError(
        `contents[${i}].parts`,
        'Must be a non-empty array',
        'google'
      );
    }
  }
}

/**
 * Validate API key
 */
export function validateApiKey(apiKey: string): void {
  if (!apiKey) {
    throw createValidationError('apiKey', 'API key is required');
  }

  if (typeof apiKey !== 'string') {
    throw createValidationError('apiKey', 'Must be a string');
  }

  if (apiKey.trim().length === 0) {
    throw createValidationError('apiKey', 'Cannot be empty');
  }

  // Basic pattern validation (adjust based on your API key format)
  if (!apiKey.match(/^[a-zA-Z0-9_\-]{20,}$/)) {
    throw createValidationError('apiKey', 'Invalid API key format');
  }
}

/**
 * Validate base URL
 */
export function validateBaseURL(baseURL: string): void {
  if (!baseURL) {
    throw createValidationError('baseURL', 'Base URL is required');
  }

  if (typeof baseURL !== 'string') {
    throw createValidationError('baseURL', 'Must be a string');
  }

  try {
    const url = new URL(baseURL);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    throw createValidationError('baseURL', 'Invalid URL format');
  }
}

/**
 * Validate timeout
 */
export function validateTimeout(timeout: number): void {
  if (typeof timeout !== 'number') {
    throw createValidationError('timeout', 'Must be a number');
  }

  if (timeout < 0) {
    throw createParameterError('timeout', timeout, 'non-negative number');
  }

  if (timeout > 300000) { // 5 minutes max
    throw createParameterError('timeout', timeout, 'number <= 300000');
  }
}

/**
 * Validate max retries
 */
export function validateMaxRetries(maxRetries: number): void {
  if (typeof maxRetries !== 'number') {
    throw createValidationError('maxRetries', 'Must be a number');
  }

  if (maxRetries < 0) {
    throw createParameterError('maxRetries', maxRetries, 'non-negative number');
  }

  if (maxRetries > 10) {
    throw createParameterError('maxRetries', maxRetries, 'number <= 10');
  }
}