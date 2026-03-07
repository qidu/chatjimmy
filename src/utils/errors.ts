/**
 * Error types and utilities for ChatJimmy SDK
 */

import { ChatJimmyError, OpenAIError, AnthropicError, GeminiError } from '../core/types';

/**
 * Create error from HTTP response
 */
export function createErrorFromResponse(
  status: number,
  data: any,
  provider: 'chatjimmy' | 'openai' | 'anthropic' | 'google' = 'chatjimmy'
): ChatJimmyError {
  const message = data?.error || data?.message || `HTTP ${status}`;
  const code = data?.code || `HTTP_${status}`;
  const details = data?.details || data;

  switch (provider) {
    case 'openai':
      return new OpenAIError(message, status, code, details);
    case 'anthropic':
      return new AnthropicError(message, status, code, details);
    case 'google':
      return new GeminiError(message, status, code, details);
    default:
      return new ChatJimmyError(message, status, code, details);
  }
}

/**
 * Create error from exception
 */
export function createErrorFromException(
  error: any,
  provider: 'chatjimmy' | 'openai' | 'anthropic' | 'google' = 'chatjimmy'
): ChatJimmyError {
  if (error instanceof ChatJimmyError) {
    return error;
  }

  const message = error?.message || 'Unknown error';
  const status = error?.status || error?.response?.status || 0;
  const code = error?.code || 'UNKNOWN_ERROR';
  const details = error?.response?.data || error;

  switch (provider) {
    case 'openai':
      return new OpenAIError(message, status, code, details);
    case 'anthropic':
      return new AnthropicError(message, status, code, details);
    case 'google':
      return new GeminiError(message, status, code, details);
    default:
      return new ChatJimmyError(message, status, code, details);
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ChatJimmyError): boolean {
  // Retry on network errors, rate limits, and server errors
  if (!error.status) return true; // Network error
  if (error.status >= 500) return true; // Server error
  if (error.status === 429) return true; // Rate limit
  if (error.status === 408) return true; // Timeout
  return false;
}

/**
 * Get retry delay for error
 */
export function getRetryDelay(error: ChatJimmyError, attempt: number): number {
  // Exponential backoff with jitter
  const baseDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
  const jitter = Math.random() * 1000; // Add up to 1 second jitter
  return baseDelay + jitter;
}

/**
 * Error codes and their meanings
 */
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'Network connection failed',
  TIMEOUT_ERROR: 'Request timed out',
  CONNECTION_ERROR: 'Connection error',

  // HTTP errors
  BAD_REQUEST: 'Invalid request parameters',
  UNAUTHORIZED: 'Authentication failed',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT: 'Rate limit exceeded',
  SERVER_ERROR: 'Server error',

  // Validation errors
  VALIDATION_ERROR: 'Request validation failed',
  MODEL_NOT_SUPPORTED: 'Model not supported',
  PARAMETER_INVALID: 'Invalid parameter value',

  // Conversion errors
  CONVERSION_ERROR: 'Failed to convert between formats',
  PARSING_ERROR: 'Failed to parse response',

  // Stream errors
  STREAM_ERROR: 'Stream error',
  STREAM_PARSE_ERROR: 'Failed to parse stream chunk'
} as const;

/**
 * Create validation error
 */
export function createValidationError(
  field: string,
  message: string,
  provider: 'chatjimmy' | 'openai' | 'anthropic' | 'google' = 'chatjimmy'
): ChatJimmyError {
  const fullMessage = `Validation error for ${field}: ${message}`;
  const details = { field, message };

  switch (provider) {
    case 'openai':
      return new OpenAIError(fullMessage, 400, 'VALIDATION_ERROR', details);
    case 'anthropic':
      return new AnthropicError(fullMessage, 400, 'VALIDATION_ERROR', details);
    case 'google':
      return new GeminiError(fullMessage, 400, 'VALIDATION_ERROR', details);
    default:
      return new ChatJimmyError(fullMessage, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Create model not supported error
 */
export function createModelNotSupportedError(
  model: string,
  provider: 'chatjimmy' | 'openai' | 'anthropic' | 'google' = 'chatjimmy'
): ChatJimmyError {
  const message = `Model "${model}" is not supported`;
  const details = { model };

  switch (provider) {
    case 'openai':
      return new OpenAIError(message, 400, 'MODEL_NOT_SUPPORTED', details);
    case 'anthropic':
      return new AnthropicError(message, 400, 'MODEL_NOT_SUPPORTED', details);
    case 'google':
      return new GeminiError(message, 400, 'MODEL_NOT_SUPPORTED', details);
    default:
      return new ChatJimmyError(message, 400, 'MODEL_NOT_SUPPORTED', details);
  }
}

/**
 * Create parameter error
 */
export function createParameterError(
  param: string,
  value: any,
  expected: string,
  provider: 'chatjimmy' | 'openai' | 'anthropic' | 'google' = 'chatjimmy'
): ChatJimmyError {
  const message = `Parameter "${param}" has invalid value "${value}". Expected: ${expected}`;
  const details = { param, value, expected };

  switch (provider) {
    case 'openai':
      return new OpenAIError(message, 400, 'PARAMETER_INVALID', details);
    case 'anthropic':
      return new AnthropicError(message, 400, 'PARAMETER_INVALID', details);
    case 'google':
      return new GeminiError(message, 400, 'PARAMETER_INVALID', details);
    default:
      return new ChatJimmyError(message, 400, 'PARAMETER_INVALID', details);
  }
}

/**
 * Format error for logging
 */
export function formatError(error: ChatJimmyError): string {
  const parts = [
    `Error: ${error.name}`,
    `Message: ${error.message}`,
    `Status: ${error.status || 'N/A'}`,
    `Code: ${error.code || 'N/A'}`
  ];

  if (error.details) {
    parts.push(`Details: ${JSON.stringify(error.details, null, 2)}`);
  }

  return parts.join('\n');
}

/**
 * Check if error is authentication error
 */
export function isAuthenticationError(error: ChatJimmyError): boolean {
  return error.status === 401 || error.status === 403;
}

/**
 * Check if error is rate limit error
 */
export function isRateLimitError(error: ChatJimmyError): boolean {
  return error.status === 429;
}

/**
 * Check if error is server error
 */
export function isServerError(error: ChatJimmyError): boolean {
  return error.status !== undefined && error.status >= 500;
}

/**
 * Create error with retry information
 */
export function createErrorWithRetryInfo(
  error: ChatJimmyError,
  attempt: number,
  maxAttempts: number
): ChatJimmyError {
  const retryInfo = {
    attempt,
    maxAttempts,
    retryable: isRetryableError(error),
    nextRetryDelay: getRetryDelay(error, attempt)
  };

  const enhancedError = new ChatJimmyError(
    error.message,
    error.status,
    error.code,
    { ...error.details, retryInfo }
  );

  // Preserve original error name
  Object.setPrototypeOf(enhancedError, Object.getPrototypeOf(error));
  enhancedError.name = error.name;

  return enhancedError;
}