/**
 * ChatJimmy SDK - Main entry point
 */

// Core types and client
export * from './core/types';
export * from './core/client';

// Providers
export * from './providers';

// Utilities
export * from './utils/parsing';
export * from './utils/errors';
export * from './utils/validation';

// Converters
export * from './core/converters';

// Re-export commonly used types for convenience
export {
  ChatJimmyClient,
  OpenAICompatibleClient,
  AnthropicCompatibleClient,
  GoogleCompatibleClient
} from './core/client';

export {
  OpenAIAdapter,
  AnthropicAdapter,
  GoogleAdapter
} from './providers';

export {
  parseStats,
  extractContent,
  extractStats,
  formatStats,
  statsToOpenAIUsage,
  statsToAnthropicUsage,
  statsToGoogleUsage
} from './utils/parsing';

export {
  createErrorFromResponse,
  createErrorFromException,
  isRetryableError,
  getRetryDelay
} from './utils/errors';

export {
  validateChatJimmyRequest,
  validateOpenAIRequest,
  validateAnthropicRequest,
  validateGoogleRequest,
  validateApiKey
} from './utils/validation';