/**
 * Example: Anthropic-compatible client usage
 *
 * This example shows how to use the Anthropic-compatible client interface.
 * For testing without an API key, you can use curl commands as shown in docs/chatjimmy-examples.md:
 * curl -s -X POST https://chatjimmy.ai/api/chat -d '{"messages": [{"role": "user", "content": "Hello!"}], "chatOptions": {"selectedModel": "llama3.1-8B", "systemPrompt": "", "topK": 8}, "attachment": null}'
 *
 * Note: Anthropic model names are mapped to llama3.1-8B internally.
 */

import { AnthropicCompatibleClient } from '../dist/index.js';

async function main() {
  // Initialize client with dummy API key for testing
  // Note: For production use, get a real API key from chatjimmy.ai
  // This dummy key passes client validation but won't authenticate with the server
  // For testing without the SDK, use curl commands as shown in docs/chatjimmy-examples.md
  const client = new AnthropicCompatibleClient({
    apiKey: 'dummy-test-key-1234567890', // Dummy key for testing (20+ chars)
    baseURL: 'https://chatjimmy.ai/api'
  });

  try {
    // Example 1: Simple message creation
    // Note: 'claude-sonnet-4-5-20250929' is mapped to 'llama3.1-8B' internally
    console.log('=== Example 1: Simple Message Creation ===');
    const response = await client.messages.create({
      model: 'llama3.1-8B', // Mapped to llama3.1-8B
      max_tokens: 1024,
      system: 'You are a helpful assistant.',
      messages: [
        { role: 'user', content: 'Explain quantum computing in simple terms.' }
      ],
      temperature: 1.0
    });

    console.log('Response:', response.content[0].text);
    console.log('Usage:', response.usage);
    console.log('Model:', response.model);
    console.log('ID:', response.id);
    console.log('Stop reason:', response.stop_reason);

    // Example 2: Streaming response
    console.log('\n=== Example 2: Streaming Response ===');
    const stream = await client.messages.createStream({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      messages: [
        { role: 'user', content: 'Count from 1 to 5' }
      ],
      stream: true
    });

    console.log('Streaming response:');
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        process.stdout.write(chunk.delta.text);
      }
    }
    console.log('\n');

    // Example 3: With content blocks
    console.log('=== Example 3: Content Blocks ===');
    const response2 = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What can you tell me about this image?'
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: 'base64-encoded-image-data-here'
              }
            }
          ]
        }
      ]
    });

    console.log('Response with image:', response2.content[0].text);

    // Example 4: With thinking budget
    console.log('\n=== Example 4: With Thinking Budget ===');
    const response3 = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2048, // Must be greater than thinking budget (1024)
      thinking: {
        type: 'enabled',
        budget_tokens: 1024
      },
      messages: [
        { role: 'user', content: 'Solve this complex math problem: What is 2^10?' }
      ]
    });

    console.log('Response with thinking:', response3.content[0].text);

    // Example 5: Error handling
    console.log('\n=== Example 5: Error Handling ===');
    try {
      const response5 = await client.messages.create({
        model: 'gpt-5', // This model is not in the mapping
        max_tokens: 100,
        messages: [
          { role: 'user', content: 'This will fail' }
        ]
      });
      console.log(response5);
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error caught:', error.message);
        const anyError = error as any;
        console.log('Error code:', anyError.code);
        console.log('Error status:', anyError.status);
      } else {
        console.log('Unknown error:', error);
      }
    }

    // Example 6: Using system prompt
    console.log('\n=== Example 6: System Prompt ===');
    const response4 = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 150,
      system: 'You are a Shakespearean actor. Respond in iambic pentameter.',
      messages: [
        { role: 'user', content: 'Tell me about the weather today.' }
      ]
    });

    console.log('Shakespearean weather:', response4.content[0].text);

    // Example 7: With stop sequences
    console.log('\n=== Example 7: Stop Sequences ===');
    const response5 = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      stop_sequences: ['END', '###'],
      messages: [
        { role: 'user', content: 'List three fruits: apple, banana, END' }
      ]
    });

    console.log('Response with stop sequence:', response5.content[0].text);
    console.log('Stop sequence triggered:', response5.stop_sequence);

    // Example 8: Tool calling
    console.log('\n=== Example 8: Tool Calling ===');
    const response6 = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      tools: [
        {
          name: 'get_weather',
          description: 'Get the current weather in a given location',
          input_schema: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The city and state, e.g. San Francisco, CA'
              },
              unit: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: 'The unit of temperature'
              }
            },
            required: ['location']
          }
        }
      ],
      messages: [
        { role: 'user', content: 'What is the weather like in San Francisco?' }
      ]
    });

    console.log('Tool use response:', JSON.stringify(response6.content, null, 2));
    console.log('Stop reason:', response6.stop_reason);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);
