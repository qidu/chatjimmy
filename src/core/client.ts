/**
 * Main client classes for ChatJimmy SDK
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ChatJimmyRequest,
  ChatJimmyResponse,
  ChatJimmyStreamChunk,
  ProviderConfig,
  ChatJimmyError,
  OpenAIRequest,
  OpenAIResponse,
  AnthropicRequest,
  AnthropicResponse,
  GeminiRequest,
  GeminiResponse
} from './types';
import {
  OpenAIAdapter,
  AnthropicAdapter,
  GoogleAdapter
} from '../providers';
import {
  parseStatsFromResponse,
  extractContent,
  extractStats
} from './converters';

/**
 * Base HTTP client with common functionality
 */
export class BaseClient {
  protected axiosInstance: AxiosInstance;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      baseURL: 'https://chatjimmy.ai/api',
      timeout: 30000,
      maxRetries: 3,
      headers: {},
      ...config
    };

    if (!this.config.apiKey) {
      throw new ChatJimmyError('API key is required');
    }

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.headers
      }
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          const message = data?.error || data?.message || error.message;
          throw new ChatJimmyError(message, status, error.code, data);
        } else if (error.request) {
          throw new ChatJimmyError('No response received from server', 0, 'NETWORK_ERROR');
        } else {
          throw new ChatJimmyError(error.message, 0, 'REQUEST_ERROR');
        }
      }
    );
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async makeRequest<T>(
    config: AxiosRequestConfig,
    retries: number = this.config.maxRetries || 3
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.axiosInstance.request<T>(config);
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        await this.delay(this.getRetryDelay(retries));
        return this.makeRequest(config, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx status codes
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 || status === 429; // Server error or rate limit
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse ChatJimmy response text
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
      // Fallback parsing
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
          decode_tokens: content.length,
          decode_rate: 0,
          total_tokens: content.length,
          total_time: 0,
          roundtrip_time: 0
        },
        rawResponse: responseText
      };
    }
  }
}

/**
 * Native ChatJimmy client
 */
export class ChatJimmyClient extends BaseClient {
  /**
   * Send chat request
   */
  async chat(request: ChatJimmyRequest): Promise<ChatJimmyResponse> {
    this.validateChatJimmyRequest(request);

    try {
      const response = await this.makeRequest<{ content: string }>({
        method: 'POST',
        url: '/chat',
        data: request
      });

      return this.parseResponseText(response.data.content);
    } catch (error) {
      if (error instanceof ChatJimmyError) {
        throw error;
      }
      throw new ChatJimmyError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        'CHAT_ERROR',
        error
      );
    }
  }

  /**
   * Stream chat response
   */
  async *chatStream(request: ChatJimmyRequest): AsyncIterable<ChatJimmyStreamChunk> {
    this.validateChatJimmyRequest(request);

    // Enable streaming in request
    const streamRequest = {
      ...request,
      chatOptions: {
        ...request.chatOptions,
        stream: true
      }
    };

    try {
      const response = await this.makeRequest({
        method: 'POST',
        url: '/chat',
        data: streamRequest,
        responseType: 'stream'
      });

      // Note: This is a simplified streaming implementation
      // In a real implementation, you would parse the stream chunks
      const fullResponse = await this.readStream(response.data);
      const parsedResponse = this.parseResponseText(fullResponse);

      // Yield chunks (simplified - in real implementation, parse incremental chunks)
      yield {
        content: parsedResponse.content,
        done: true,
        stats: parsedResponse.stats
      };
    } catch (error) {
      throw new ChatJimmyError(
        error instanceof Error ? error.message : 'Stream error',
        0,
        'STREAM_ERROR',
        error
      );
    }
  }

  /**
   * Validate ChatJimmy request
   */
  private validateChatJimmyRequest(request: ChatJimmyRequest): void {
    if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
      throw new ChatJimmyError('Messages array is required and must contain at least one message');
    }

    if (!request.chatOptions) {
      throw new ChatJimmyError('chatOptions is required');
    }

    if (!request.chatOptions.selectedModel) {
      throw new ChatJimmyError('selectedModel is required in chatOptions');
    }

    // Validate messages
    for (const message of request.messages) {
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        throw new ChatJimmyError(`Invalid message role: ${message.role}`);
      }

      if (!message.content) {
        throw new ChatJimmyError('Message content is required');
      }
    }

    // Validate chat options
    const options = request.chatOptions;
    if (options.temperature !== undefined && (options.temperature < 0 || options.temperature > 1)) {
      throw new ChatJimmyError('Temperature must be between 0 and 1');
    }

    if (options.topK !== undefined && options.topK < 0) {
      throw new ChatJimmyError('topK must be non-negative');
    }

    if (options.topP !== undefined && (options.topP < 0 || options.topP > 1)) {
      throw new ChatJimmyError('topP must be between 0 and 1');
    }

    if (options.maxTokens !== undefined && options.maxTokens < 1) {
      throw new ChatJimmyError('maxTokens must be at least 1');
    }
  }

  /**
   * Read stream data (simplified)
   */
  private readStream(stream: any): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = '';
      stream.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      stream.on('end', () => resolve(data));
      stream.on('error', reject);
    });
  }
}

/**
 * OpenAI-compatible client
 */
export class OpenAICompatibleClient extends BaseClient {
  private adapter: OpenAIAdapter;

  constructor(config: ProviderConfig) {
    super(config);
    this.adapter = new OpenAIAdapter();
  }

  /**
   * Create chat completion (OpenAI style)
   */
  async createChatCompletion(request: OpenAIRequest): Promise<OpenAIResponse> {
    try {
      // Convert OpenAI request to ChatJimmy request
      const chatJimmyRequest = this.adapter.convertRequest(request);

      // Send to ChatJimmy
      const chatJimmyResponse = await this._chat(chatJimmyRequest);

      // Convert response back to OpenAI format
      return this.adapter.convertResponse(chatJimmyResponse, request);
    } catch (error) {
      if (error instanceof ChatJimmyError) {
        throw error;
      }
      throw new ChatJimmyError(
        error instanceof Error ? error.message : 'OpenAI compatibility error',
        0,
        'OPENAI_ERROR',
        error
      );
    }
  }

  /**
   * Create streaming chat completion
   */
  async *createChatCompletionStream(request: OpenAIRequest): AsyncIterable<any> {
    try {
      // Convert OpenAI request to ChatJimmy request
      const chatJimmyRequest = this.adapter.convertRequest(request);

      // Stream from ChatJimmy
      const stream = this._chatStream({
        ...chatJimmyRequest,
        chatOptions: {
          ...chatJimmyRequest.chatOptions,
          stream: true
        }
      });

      // Convert and yield chunks
      for await (const chunk of stream) {
        yield this.adapter.convertStreamChunk(chunk, `chatcmpl-stream-${Date.now()}`);
      }
    } catch (error) {
      throw new ChatJimmyError(
        error instanceof Error ? error.message : 'OpenAI streaming error',
        0,
        'OPENAI_STREAM_ERROR',
        error
      );
    }
  }

  /**
   * OpenAI-style chat.completions API
   */
  chat = {
    completions: {
      create: (request: OpenAIRequest) => this.createChatCompletion(request),
      createStream: (request: OpenAIRequest) => this.createChatCompletionStream(request)
    }
  };

  /**
   * Helper method to use native ChatJimmy client
   */
  private async _chat(request: ChatJimmyRequest): Promise<ChatJimmyResponse> {
    const client = new ChatJimmyClient(this.config);
    return client.chat(request);
  }

  /**
   * Helper method to stream from ChatJimmy
   */
  private async *_chatStream(request: ChatJimmyRequest): AsyncIterable<ChatJimmyStreamChunk> {
    const client = new ChatJimmyClient(this.config);
    yield* client.chatStream(request);
  }
}

/**
 * Anthropic-compatible client
 */
export class AnthropicCompatibleClient extends BaseClient {
  private adapter: AnthropicAdapter;

  constructor(config: ProviderConfig) {
    super(config);
    this.adapter = new AnthropicAdapter();
  }

  /**
   * Create message (Anthropic style)
   */
  async createMessage(request: AnthropicRequest): Promise<AnthropicResponse> {
    try {
      // Convert Anthropic request to ChatJimmy request
      const chatJimmyRequest = this.adapter.convertRequest(request);

      // Send to ChatJimmy
      const chatJimmyResponse = await this._chat(chatJimmyRequest);

      // Convert response back to Anthropic format
      return this.adapter.convertResponse(chatJimmyResponse, request);
    } catch (error) {
      if (error instanceof ChatJimmyError) {
        throw error;
      }
      throw new ChatJimmyError(
        error instanceof Error ? error.message : 'Anthropic compatibility error',
        0,
        'ANTHROPIC_ERROR',
        error
      );
    }
  }

  /**
   * Create streaming message
   */
  async *createMessageStream(request: AnthropicRequest): AsyncIterable<any> {
    try {
      // Convert Anthropic request to ChatJimmy request
      const chatJimmyRequest = this.adapter.convertRequest(request);

      // Stream from ChatJimmy
      const stream = this._chatStream({
        ...chatJimmyRequest,
        chatOptions: {
          ...chatJimmyRequest.chatOptions,
          stream: true
        }
      });

      // Convert and yield chunks
      let index = 0;
      for await (const chunk of stream) {
        yield this.adapter.convertStreamChunk(chunk, index);
        if (!chunk.done) {
          index++;
        }
      }
    } catch (error) {
      throw new ChatJimmyError(
        error instanceof Error ? error.message : 'Anthropic streaming error',
        0,
        'ANTHROPIC_STREAM_ERROR',
        error
      );
    }
  }

  /**
   * Anthropic-style messages API
   */
  messages = {
    create: (request: AnthropicRequest) => this.createMessage(request),
    createStream: (request: AnthropicRequest) => this.createMessageStream(request)
  };

  /**
   * Helper method to use native ChatJimmy client
   */
  private async _chat(request: ChatJimmyRequest): Promise<ChatJimmyResponse> {
    const client = new ChatJimmyClient(this.config);
    return client.chat(request);
  }

  /**
   * Helper method to stream from ChatJimmy
   */
  private async *_chatStream(request: ChatJimmyRequest): AsyncIterable<ChatJimmyStreamChunk> {
    const client = new ChatJimmyClient(this.config);
    yield* client.chatStream(request);
  }
}

/**
 * Google Gemini-compatible client
 */
export class GoogleCompatibleClient extends BaseClient {
  private adapter: GoogleAdapter;

  constructor(config: ProviderConfig) {
    super(config);
    this.adapter = new GoogleAdapter();
  }

  /**
   * Generate content (Google Gemini style)
   */
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      // Convert Google request to ChatJimmy request
      const chatJimmyRequest = this.adapter.convertRequest(request);

      // Send to ChatJimmy
      const chatJimmyResponse = await this._chat(chatJimmyRequest);

      // Convert response back to Google format
      return this.adapter.convertResponse(chatJimmyResponse, request);
    } catch (error) {
      if (error instanceof ChatJimmyError) {
        throw error;
      }
      throw new ChatJimmyError(
        error instanceof Error ? error.message : 'Google Gemini compatibility error',
        0,
        'GEMINI_ERROR',
        error
      );
    }
  }

  /**
   * Generate streaming content
   */
  async *generateContentStream(request: GeminiRequest): AsyncIterable<any> {
    try {
      // Convert Google request to ChatJimmy request
      const chatJimmyRequest = this.adapter.convertRequest(request);

      // Stream from ChatJimmy
      const stream = this._chatStream({
        ...chatJimmyRequest,
        chatOptions: {
          ...chatJimmyRequest.chatOptions,
          stream: true
        }
      });

      // Convert and yield chunks
      for await (const chunk of stream) {
        yield this.adapter.convertStreamChunk(chunk);
      }
    } catch (error) {
      throw new ChatJimmyError(
        error instanceof Error ? error.message : 'Google Gemini streaming error',
        0,
        'GEMINI_STREAM_ERROR',
        error
      );
    }
  }

  /**
   * Google-style generateContent API
   */
  generateContentMethod = {
    generateContent: (request: GeminiRequest) => this.generateContent(request),
    streamGenerateContent: (request: GeminiRequest) => this.generateContentStream(request)
  };

  /**
   * Helper method to use native ChatJimmy client
   */
  private async _chat(request: ChatJimmyRequest): Promise<ChatJimmyResponse> {
    const client = new ChatJimmyClient(this.config);
    return client.chat(request);
  }

  /**
   * Helper method to stream from ChatJimmy
   */
  private async *_chatStream(request: ChatJimmyRequest): AsyncIterable<ChatJimmyStreamChunk> {
    const client = new ChatJimmyClient(this.config);
    yield* client.chatStream(request);
  }
}