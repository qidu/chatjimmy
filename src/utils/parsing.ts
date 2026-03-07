/**
 * Stats parsing utilities for ChatJimmy responses
 */

import { ChatJimmyStats, StatsData, ParsedStats } from '../core/types';

/**
 * Parse stats from ChatJimmy response text
 */
export function parseStats(responseText: string): ParsedStats {
  if (!responseText) {
    throw new Error('No response text provided');
  }

  const statsRegex = new RegExp('<\\|stats\\|>(.*?)<\\|/stats\\|>', 's');
  const match = responseText.match(statsRegex);

  if (!match) {
    throw new Error('No stats tags found in response');
  }

  try {
    const statsData: StatsData = JSON.parse(match[1]);
    const content = extractContent(responseText);

    return {
      stats: statsData as ChatJimmyStats,
      content
    };
  } catch (error) {
    throw new Error(`Failed to parse stats JSON: ${error}`);
  }
}

/**
 * Extract content from response text (removes stats tags)
 */
export function extractContent(responseText: string): string {
  const statsRegex = new RegExp('<\\|stats\\|>.*?<\\|/stats\\|>', 's');
  return responseText ? responseText.replace(statsRegex, '').trim() : '';
}

/**
 * Extract stats from response text
 */
export function extractStats(responseText: string): ChatJimmyStats | null {
  try {
    const parsed = parseStats(responseText);
    return parsed.stats;
  } catch {
    return null;
  }
}

/**
 * Check if response contains stats tags
 */
export function hasStats(responseText: string): boolean {
  const statsRegex = new RegExp('<\\|stats\\|>.*?<\\|/stats\\|>', 's');
  return statsRegex.test(responseText);
}

/**
 * Format stats for display
 */
export function formatStats(stats: ChatJimmyStats): string {
  const lines = [
    `Total Duration: ${stats.total_duration.toFixed(6)}s`,
    `TTFT: ${stats.ttft.toFixed(6)}s`,
    `Tokens: ${stats.total_tokens} (prefill: ${stats.prefill_tokens}, decode: ${stats.decode_tokens})`,
    `Rates: prefill=${stats.prefill_rate.toFixed(0)} tokens/s, decode=${stats.decode_rate.toFixed(0)} tokens/s`,
    `Total Time: ${stats.total_time.toFixed(6)}s`,
    `Roundtrip Time: ${stats.roundtrip_time}s`,
    `Done Reason: ${stats.done_reason}`,
    `Status: ${stats.status}`
  ];

  if (stats.logprobs !== null) {
    lines.push(`Logprobs: ${JSON.stringify(stats.logprobs).slice(0, 50)}...`);
  }

  if (stats.topk !== undefined) {
    lines.push(`TopK: ${stats.topk}`);
  }

  return lines.join('\n');
}

/**
 * Convert ChatJimmy stats to OpenAI usage format
 */
export function statsToOpenAIUsage(stats: ChatJimmyStats): {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
} {
  return {
    prompt_tokens: stats.prefill_tokens,
    completion_tokens: stats.decode_tokens,
    total_tokens: stats.total_tokens
  };
}

/**
 * Convert ChatJimmy stats to Anthropic usage format
 */
export function statsToAnthropicUsage(stats: ChatJimmyStats): {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
} {
  return {
    input_tokens: stats.prefill_tokens,
    output_tokens: stats.decode_tokens,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0
  };
}

/**
 * Convert ChatJimmy stats to Google Gemini usage format
 */
export function statsToGoogleUsage(stats: ChatJimmyStats): {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
} {
  return {
    promptTokenCount: stats.prefill_tokens,
    candidatesTokenCount: stats.decode_tokens,
    totalTokenCount: stats.total_tokens
  };
}

/**
 * Calculate token cost based on stats and model
 */
export function calculateTokenCost(
  stats: ChatJimmyStats,
  model: string,
  pricing: Record<string, { input: number; output: number }> = DEFAULT_PRICING
): number {
  const modelPricing = pricing[model] || pricing.default;
  const inputCost = (stats.prefill_tokens / 1000) * modelPricing.input;
  const outputCost = (stats.decode_tokens / 1000) * modelPricing.output;
  return inputCost + outputCost;
}

/**
 * Default pricing (per 1K tokens)
 */
export const DEFAULT_PRICING: Record<string, { input: number; output: number }> = {
  'llama3.1-8B': { input: 0.0001, output: 0.0002 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'claude-sonnet-4-5-20250929': { input: 0.003, output: 0.015 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  default: { input: 0.001, output: 0.002 }
};

/**
 * Parse streaming response chunks
 */
export function parseStreamChunk(chunk: string): {
  content?: string;
  done?: boolean;
  stats?: ChatJimmyStats;
} {
  try {
    // Try to parse as JSON first (for structured streaming)
    const data = JSON.parse(chunk);
    return data;
  } catch {
    // If not JSON, check for stats tags
    if (hasStats(chunk)) {
      try {
        const parsed = parseStats(chunk);
        return {
          content: parsed.content,
          done: true,
          stats: parsed.stats
        };
      } catch {
        // Fall through
      }
    }

    // Return as plain content chunk
    return {
      content: chunk.trim(),
      done: false
    };
  }
}

/**
 * Validate stats data
 */
export function validateStats(stats: any): stats is ChatJimmyStats {
  return (
    stats &&
    typeof stats.total_duration === 'number' &&
    typeof stats.prefill_tokens === 'number' &&
    typeof stats.decode_tokens === 'number' &&
    typeof stats.total_tokens === 'number' &&
    typeof stats.done === 'boolean'
  );
}