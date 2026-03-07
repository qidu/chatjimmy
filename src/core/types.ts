/**
 * Core types for ChatJimmy SDK
 */

// ==================== ChatJimmy Native Types ====================

export interface ChatJimmyMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatJimmyChatOptions {
  selectedModel: string;
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
  stream?: boolean;
}

export interface ChatJimmyAttachment {
  type: 'image' | 'document' | 'audio' | 'video';
  data: string; // base64 encoded
  mimeType: string;
  filename?: string;
}

export interface ChatJimmyRequest {
  messages: ChatJimmyMessage[];
  chatOptions: ChatJimmyChatOptions;
  attachment?: ChatJimmyAttachment | null;
}

export interface ChatJimmyStats {
  created_at: number;
  done: boolean;
  done_reason: string;
  total_duration: number;
  logprobs: any | null;
  topk: number;
  ttft: number;
  reason: string;
  status: number;
  prefill_tokens: number;
  prefill_rate: number;
  decode_tokens: number;
  decode_rate: number;
  total_tokens: number;
  total_time: number;
  roundtrip_time: number;
}

export interface ChatJimmyResponse {
  content: string;
  stats: ChatJimmyStats;
  rawResponse?: string; // Original response with stats tags
}

export interface ChatJimmyStreamChunk {
  content: string;
  done: boolean;
  stats?: ChatJimmyStats;
}

// ==================== OpenAI-Compatible Types ====================

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

export interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  tools?: OpenAITool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  stream?: boolean;
  stop?: string | string[];
}

export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: any; // JSON Schema
  };
}

export interface OpenAIResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: {
    index: number;
    message: OpenAIMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
    logprobs?: any;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
}

export interface OpenAIStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      tool_calls?: OpenAIToolCall[];
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
    logprobs?: any;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ==================== Anthropic-Compatible Types ====================

export interface AnthropicMessageParam {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

export interface AnthropicContentBlock {
  type: 'text' | 'image' | 'document' | 'tool_use' | 'tool_result';
  text?: string;
  source?: {
    type: 'base64' | 'url' | 'text';
    media_type: string;
    data?: string;
    url?: string;
  };
  id?: string;
  name?: string;
  input?: any;
  tool_use_id?: string;
  content?: string | AnthropicContentBlock[];
  cache_control?: {
    type: 'ephemeral';
    ttl: string;
  };
  citations?: any[];
}

export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessageParam[];
  system?: string | AnthropicContentBlock[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  thinking?: {
    type: 'enabled';
    budget_tokens: number;
  };
  tool_choice?: 'auto' | 'any' | 'none' | { type: 'tool'; name: string };
  tools?: AnthropicTool[];
  metadata?: {
    user_id: string;
  };
  service_tier?: 'auto' | 'standard_only';
}

export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: any; // JSON Schema
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: AnthropicContentBlock[];
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | 'pause_turn' | 'refusal' | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export interface AnthropicStreamChunk {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
  message?: AnthropicResponse;
  content_block?: {
    index: number;
    type: string;
  };
  delta?: {
    type: 'text_delta';
    text: string;
  };
  usage?: {
    output_tokens: number;
  };
}

// ==================== Google Gemini-Compatible Types ====================

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
  fileData?: {
    mimeType: string;
    fileUri: string;
  };
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
  };
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    stopSequences?: string[];
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
  tools?: {
    functionDeclarations: {
      name: string;
      description?: string;
      parameters: any; // JSON Schema
    }[];
  }[];
  systemInstruction?: {
    parts: GeminiPart[];
  };
}

export interface GeminiResponse {
  candidates: {
    content: GeminiContent;
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
    safetyRatings: {
      category: string;
      probability: string;
    }[];
    tokenCount: number;
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface GeminiStreamChunk {
  candidates: {
    content: GeminiContent;
    finishReason?: string;
    safetyRatings?: any[];
    tokenCount?: number;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ==================== Common Types ====================

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export interface ModelMapping {
  [providerModel: string]: string; // Maps provider model name to ChatJimmy model name
}

export interface ParameterMapping {
  temperature?: {
    min: number;
    max: number;
    default: number;
  };
  topP?: {
    min: number;
    max: number;
    default: number;
  };
  topK?: {
    min: number;
    max: number;
    default: number;
  };
  maxTokens?: {
    min: number;
    max: number;
    default: number;
  };
}

export interface ProviderAdapter {
  convertRequest(request: any): ChatJimmyRequest;
  convertResponse(response: ChatJimmyResponse): any;
  convertStreamChunk(chunk: ChatJimmyStreamChunk): any;
  getModelMapping(): ModelMapping;
  getParameterMapping(): ParameterMapping;
}

// ==================== Error Types ====================

export class ChatJimmyError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ChatJimmyError';
  }
}

export class OpenAIError extends ChatJimmyError {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message, status, code, details);
    this.name = 'OpenAIError';
  }
}

export class AnthropicError extends ChatJimmyError {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message, status, code, details);
    this.name = 'AnthropicError';
  }
}

export class GeminiError extends ChatJimmyError {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message, status, code, details);
    this.name = 'GeminiError';
  }
}

// ==================== Utility Types ====================

export interface StatsData {
  total_duration: number;
  ttft: number;
  prefill_tokens: number;
  decode_tokens: number;
  total_tokens: number;
  prefill_rate: number;
  decode_rate: number;
  total_time: number;
  roundtrip_time: number;
  done: boolean;
  done_reason: string;
  reason: string;
  status: number;
  logprobs: any | null;
  topk: number;
  created_at: number;
}

export interface ParsedStats {
  stats: StatsData;
  content: string;
}