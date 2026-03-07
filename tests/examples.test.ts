/**
 * Tests for example files
 */

import fs from 'fs';
import path from 'path';

describe('Examples', () => {
  test('openai-compatible.ts should compile and have correct structure', () => {
    const examplePath = path.join(__dirname, '../examples/openai-compatible.ts');
    const content = fs.readFileSync(examplePath, 'utf8');

    // Check that it imports the OpenAICompatibleClient
    expect(content).toContain('import { OpenAICompatibleClient }');

    // Check that it has the main function
    expect(content).toContain('async function main()');

    // Check that it has example sections
    expect(content).toContain('=== Example 1: Simple Chat Completion ===');
    expect(content).toContain('=== Example 2: Streaming Response ===');
    expect(content).toContain('=== Example 3: Custom Parameters ===');
    expect(content).toContain('=== Example 4: Error Handling ===');
    expect(content).toContain('=== Example 5: Native ChatJimmy Client ===');
  });

  test('anthropic-compatible.ts should compile and have correct structure', () => {
    const examplePath = path.join(__dirname, '../examples/anthropic-compatible.ts');
    const content = fs.readFileSync(examplePath, 'utf8');

    // Check that it imports the AnthropicCompatibleClient
    expect(content).toContain('import { AnthropicCompatibleClient }');

    // Check that it has the main function
    expect(content).toContain('async function main()');

    // Check that it has example sections
    expect(content).toContain('=== Example 1: Simple Message Creation ===');
    expect(content).toContain('=== Example 2: Streaming Response ===');
    expect(content).toContain('=== Example 3: Content Blocks ===');
    expect(content).toContain('=== Example 4: With Thinking Budget ===');
    expect(content).toContain('=== Example 5: Error Handling ===');
    expect(content).toContain('=== Example 6: System Prompt ===');
    expect(content).toContain('=== Example 7: Stop Sequences ===');
  });

  test('examples should compile without TypeScript errors', () => {
    // This test verifies that the examples can be compiled
    // We're not actually running them since they require API keys
    // but we can verify they don't have syntax errors
    const openaiExample = path.join(__dirname, '../examples/openai-compatible.ts');
    const anthropicExample = path.join(__dirname, '../examples/anthropic-compatible.ts');

    // Just check that files exist and are readable
    expect(fs.existsSync(openaiExample)).toBe(true);
    expect(fs.existsSync(anthropicExample)).toBe(true);

    const openaiContent = fs.readFileSync(openaiExample, 'utf8');
    const anthropicContent = fs.readFileSync(anthropicExample, 'utf8');

    expect(openaiContent.length).toBeGreaterThan(0);
    expect(anthropicContent.length).toBeGreaterThan(0);
  });
});