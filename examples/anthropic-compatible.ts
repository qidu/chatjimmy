/**
 * Example: Anthropic-compatible client usage
 */

import { AnthropicCompatibleClient } from '../src';

async function main() {
  // Initialize client with your API key
  const client = new AnthropicCompatibleClient({
    apiKey: 'your-api-key-here',
    baseURL: 'https://chatjimmy.ai/api'
  });

  try {
    // Example 1: Simple message creation
    console.log('=== Example 1: Simple Message Creation ===');
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
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
      max_tokens: 500,
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
      await client.messages.create({
        model: 'unsupported-model', // This model is not in the mapping
        max_tokens: 100,
        messages: [
          { role: 'user', content: 'This will fail' }
        ]
      });
    } catch (error) {
      console.log('Error caught:', error.message);
      console.log('Error code:', error.code);
      console.log('Error status:', error.status);
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

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export default main;