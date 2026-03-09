/**
 * Base provider adapter interface and implementation
 */

import {
  ProviderAdapter,
  ChatJimmyRequest,
  ChatJimmyResponse,
  ChatJimmyStreamChunk,
  ModelMapping,
  ParameterMapping,
  ChatJimmyError
} from '../core/types.js';
import {
  normalizeParameter,
  denormalizeParameter,
  extractStats,
  extractContent,
  parseStatsFromResponse
} from '../core/converters.js';

/**
 * Base adapter class implementing common functionality
 */
export abstract class BaseAdapter implements ProviderAdapter {
  protected modelMapping: ModelMapping;
  protected parameterMapping: ParameterMapping;

  constructor(
    modelMapping: ModelMapping,
    parameterMapping: ParameterMapping
  ) {
    this.modelMapping = modelMapping;
    this.parameterMapping = parameterMapping;
  }

  /**
   * Convert provider request to ChatJimmy request
   */
  abstract convertRequest(request: any): ChatJimmyRequest;

  /**
   * Convert ChatJimmy response to provider response
   */
  abstract convertResponse(response: ChatJimmyResponse): any;

  /**
   * Convert ChatJimmy stream chunk to provider stream chunk
   */
  abstract convertStreamChunk(chunk: ChatJimmyStreamChunk): any;

  /**
   * Get model mapping for this provider
   */
  getModelMapping(): ModelMapping {
    return this.modelMapping;
  }

  /**
   * Get parameter mapping for this provider
   */
  getParameterMapping(): ParameterMapping {
    return this.parameterMapping;
  }

  /**
   * Normalize parameter value using provider mapping
   */
  protected normalizeParameter(
    value: number | undefined,
    paramName: keyof ParameterMapping
  ): number | undefined {
    return normalizeParameter(value, this.parameterMapping, paramName);
  }

  /**
   * Denormalize parameter value using provider mapping
   */
  protected denormalizeParameter(
    value: number | undefined,
    paramName: keyof ParameterMapping
  ): number | undefined {
    return denormalizeParameter(value, this.parameterMapping, paramName);
  }

  /**
   * Map provider model name to ChatJimmy model name
   */
  protected mapModel(providerModel: string): string {
    return this.modelMapping[providerModel] || 'llama3.1-8B';
  }

  /**
   * Parse response text into ChatJimmyResponse
   */
  protected parseResponseText(responseText: string): ChatJimmyResponse {
    try {
      const parsed = parseStatsFromResponse(responseText);
      return {
        content: parsed.content,
        stats: parsed.stats,
        rawResponse: responseText
      };
    } catch (error) {
      // If parsing fails, create basic response
      const stats = extractStats(responseText);
      const content = extractContent(responseText);

      return {
        content,
        stats: stats || {
          created_at: Date.now() / 1000,
          done: true,
          done_reason: 'stop',
          total_duration: 0,
          logprobs: null,
          topk: 8,
          ttft: 0,
          reason: 'unknown',
          status: 0,
          prefill_tokens: 0,
          prefill_rate: 0,
          decode_tokens: content.length, // Rough estimate
          decode_rate: 0,
          total_tokens: content.length,
          total_time: 0,
          roundtrip_time: 0
        },
        rawResponse: responseText
      };
    }
  }

  /**
   * Validate provider request
   */
  protected validateRequest(request: any): void {
    if (!request) {
      throw new ChatJimmyError('Request is required');
    }

    // Provider-specific validation should be implemented in subclasses
  }

  /**
   * Create error response for provider
   */
  protected createErrorResponse(
    error: ChatJimmyError,
    originalRequest?: any
  ): any {
    // Provider-specific error response creation should be implemented in subclasses
    throw error;
  }
}

/**
 * Factory function to create adapter instance
 */
export function createAdapter(provider: 'openai' | 'anthropic' | 'google'): ProviderAdapter {
  switch (provider) {
    case 'openai':
      // Will be implemented in openai.ts
      throw new Error('OpenAI adapter not implemented yet');
    case 'anthropic':
      // Will be implemented in anthropic.ts
      throw new Error('Anthropic adapter not implemented yet');
    case 'google':
      // Will be implemented in google.ts
      throw new Error('Google adapter not implemented yet');
    default:
      throw new ChatJimmyError(`Unknown provider: ${provider}`);
  }
}