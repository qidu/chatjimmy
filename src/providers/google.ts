/**
 * Google Gemini adapter implementation
 */

import { BaseAdapter } from './base';
import {
  ChatJimmyRequest,
  ChatJimmyResponse,
  ChatJimmyStreamChunk,
  GeminiRequest,
  GeminiResponse,
  GeminiContent,
  GeminiPart,
  GeminiError,
  ModelMapping,
  ParameterMapping
} from '../core/types';
import {
  convertGoogleToChatJimmy,
  convertChatJimmyToGoogle,
  GEMINI_MODEL_MAPPING,
  GEMINI_PARAMETER_MAPPING
} from '../core/converters';

export class GoogleAdapter extends BaseAdapter {
  constructor() {
    super(GEMINI_MODEL_MAPPING, GEMINI_PARAMETER_MAPPING);
  }

  convertRequest(request: GeminiRequest): ChatJimmyRequest {
    this.validateGoogleRequest(request);
    return convertGoogleToChatJimmy(request);
  }

  convertResponse(response: ChatJimmyResponse, originalRequest?: GeminiRequest): GeminiResponse {
    return convertChatJimmyToGoogle(response, originalRequest);
  }

  convertStreamChunk(chunk: ChatJimmyStreamChunk): any {
    // For streaming, Gemini uses similar format to regular response but with incremental updates
    return {
      candidates: [{
        content: {
          role: 'model',
          parts: [{
            text: chunk.content
          }]
        },
        finishReason: chunk.done ? 'STOP' : undefined,
        safetyRatings: [],
        tokenCount: chunk.stats?.total_tokens || 0
      }],
      usageMetadata: chunk.stats ? {
        promptTokenCount: chunk.stats.prefill_tokens,
        candidatesTokenCount: chunk.stats.decode_tokens,
        totalTokenCount: chunk.stats.total_tokens
      } : undefined
    };
  }

  /**
   * Validate Google Gemini request
   */
  private validateGoogleRequest(request: GeminiRequest): void {
    if (!request.contents || !Array.isArray(request.contents) || request.contents.length === 0) {
      throw new GeminiError('Contents array is required and must contain at least one content item');
    }

    // Validate generation config if provided
    const genConfig = request.generationConfig;
    if (genConfig) {
      // Validate temperature range
      if (genConfig.temperature !== undefined) {
        if (genConfig.temperature < 0 || genConfig.temperature > 1) {
          throw new GeminiError('Temperature must be between 0 and 1');
        }
      }

      // Validate top_p range
      if (genConfig.topP !== undefined) {
        if (genConfig.topP < 0 || genConfig.topP > 1) {
          throw new GeminiError('topP must be between 0 and 1');
        }
      }

      // Validate top_k range
      if (genConfig.topK !== undefined) {
        if (genConfig.topK < 1 || genConfig.topK > 40) {
          throw new GeminiError('topK must be between 1 and 40');
        }
      }

      // Validate maxOutputTokens range
      if (genConfig.maxOutputTokens !== undefined) {
        if (genConfig.maxOutputTokens < 1) {
          throw new GeminiError('maxOutputTokens must be at least 1');
        }
        if (genConfig.maxOutputTokens > 8192) {
          throw new GeminiError('maxOutputTokens cannot exceed 8192');
        }
      }
    }

    // Validate safety settings if provided
    if (request.safetySettings) {
      for (const setting of request.safetySettings) {
        if (!setting.category || !setting.threshold) {
          throw new GeminiError('Safety settings must have category and threshold');
        }
      }
    }

    // Validate contents structure
    for (const content of request.contents) {
      if (!['user', 'model'].includes(content.role)) {
        throw new GeminiError(`Invalid content role: ${content.role}`);
      }

      if (!content.parts || !Array.isArray(content.parts) || content.parts.length === 0) {
        throw new GeminiError('Content parts array is required and must contain at least one part');
      }

      // Validate parts
      for (const part of content.parts) {
        if (!part.text && !part.inlineData && !part.fileData && !part.functionCall && !part.functionResponse) {
          throw new GeminiError('Part must have at least one field: text, inlineData, fileData, functionCall, or functionResponse');
        }

        // Validate inlineData if present
        if (part.inlineData) {
          if (!part.inlineData.mimeType || !part.inlineData.data) {
            throw new GeminiError('Inline data must have mimeType and data');
          }
        }

        // Validate fileData if present
        if (part.fileData) {
          if (!part.fileData.mimeType || !part.fileData.fileUri) {
            throw new GeminiError('File data must have mimeType and fileUri');
          }
        }
      }
    }
  }

  /**
   * Create Google Gemini error response
   */
  createErrorResponse(error: GeminiError, originalRequest?: GeminiRequest): GeminiResponse {
    return {
      candidates: [{
        content: {
          role: 'model',
          parts: [{
            text: `Error: ${error.message}`
          }]
        },
        finishReason: 'OTHER',
        safetyRatings: [],
        tokenCount: 0
      }],
      usageMetadata: {
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        totalTokenCount: 0
      }
    };
  }

  /**
   * Get supported Google Gemini models
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
   * Normalize Google Gemini parameters to ChatJimmy range
   */
  normalizeParameters(request: GeminiRequest): GeminiRequest {
    const normalizedRequest = { ...request };

    if (!normalizedRequest.generationConfig) {
      normalizedRequest.generationConfig = {};
    }

    const genConfig = normalizedRequest.generationConfig;

    if (genConfig.temperature !== undefined) {
      genConfig.temperature = this.normalizeParameter(
        genConfig.temperature,
        'temperature'
      ) as number;
    }

    if (genConfig.topP !== undefined) {
      genConfig.topP = this.normalizeParameter(
        genConfig.topP,
        'topP'
      ) as number;
    }

    if (genConfig.topK !== undefined) {
      genConfig.topK = this.normalizeParameter(
        genConfig.topK,
        'topK'
      ) as number;
    }

    if (genConfig.maxOutputTokens !== undefined) {
      genConfig.maxOutputTokens = this.normalizeParameter(
        genConfig.maxOutputTokens,
        'maxTokens'
      ) as number;
    }

    return normalizedRequest;
  }

  /**
   * Extract text from Gemini parts
   */
  extractTextFromParts(parts: GeminiPart[]): string {
    const textParts = parts
      .filter(part => part.text)
      .map(part => part.text);
    return textParts.join('\n');
  }

  /**
   * Convert text to Gemini parts
   */
  convertTextToParts(text: string): GeminiPart[] {
    return [{
      text: text
    }];
  }

  /**
   * Extract system instruction
   */
  extractSystemInstruction(request: GeminiRequest): string {
    if (request.systemInstruction?.parts) {
      return this.extractTextFromParts(request.systemInstruction.parts);
    }
    return '';
  }

  /**
   * Handle function declarations
   */
  normalizeFunctionDeclarations(tools?: GeminiRequest['tools']): GeminiRequest['tools'] {
    if (!tools) return undefined;

    return tools.map(tool => ({
      functionDeclarations: tool.functionDeclarations.map(func => ({
        name: func.name,
        description: func.description || '',
        parameters: func.parameters
      }))
    }));
  }

  /**
   * Convert ChatJimmy response to streaming format
   */
  createStreamResponse(response: ChatJimmyResponse, originalRequest?: GeminiRequest): any {
    const baseResponse = this.convertResponse(response, originalRequest);

    return {
      ...baseResponse,
      // Add streaming-specific fields if needed
    };
  }
}