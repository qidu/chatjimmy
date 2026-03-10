/**
 * Example: OpenAI-compatible client usage
 */

import { OpenAICompatibleClient } from '../dist/index.js';

async function main() {
  // Initialize client with your API key
  const client = new OpenAICompatibleClient({
    apiKey: 'your-api-key-here',
    baseURL: 'https://chatjimmy.ai/api' // Optional, defaults to this
  });

  try {
    // Example 1: Simple chat completion
    console.log('=== Example 1: Simple Chat Completion ===');
    const response = await client.chat.completions.create({
      model: 'llama3.1-8B',
      messages: [
        { role: 'user', content: 'Explain quantum computing in simple terms.' }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    console.log('Response:', response.choices[0].message.content);
    console.log('Usage:', response.usage);
    console.log('Model:', response.model);
    console.log('ID:', response.id);

    // Example 2: Streaming response
    console.log('\n=== Example 2: Streaming Response ===');
    const stream = await client.chat.completions.createStream({
      model: 'llama3.1-8B',
      messages: [
        { role: 'user', content: 'Count from 1 to 5' }
      ],
      stream: true,
      max_tokens: 50
    });

    console.log('Streaming response:');
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }
    console.log('\n');

    // Example 3: With custom parameters
    console.log('=== Example 3: Custom Parameters ===');
    const response2 = await client.chat.completions.create({ 
      model: 'llama3.1-8B',
      messages: [
        { role: 'user', content: 'Write a haiku about programming' }
      ],
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: 50,
      stop: ['###']
    });

    console.log('Haiku:', response2.choices[0].message.content);

    // Example 4: Error handling
    console.log('\n=== Example 4: Error Handling ===');
    try {
      const response4= await client.chat.completions.create({
        model: 'gpt-5', // This model is not in the mapping
        messages: [
          { role: 'user', content: 'This will fail' }
        ]
      });
      console.log(response4);
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

    // Example 5: Using the native ChatJimmy client directly
    console.log('\n=== Example 5: Native ChatJimmy Client ===');
    const { ChatJimmyClient } = await import('../dist/index.js');
    const nativeClient = new ChatJimmyClient({
      apiKey: 'your-api-key-here'
    });

    const nativeResponse = await nativeClient.chat({
      messages: [
        { role: 'user', content: 'What is the capital of France?' }
      ],
      chatOptions: {
        selectedModel: 'llama3.1-8B',
        systemPrompt: 'You are a geography expert.',
        temperature: 0.8,
        topK: 8
      }
    });

    console.log('Native response:', nativeResponse.content);
    console.log('Stats:', nativeResponse.stats);

    // Example 5: Tool calling
    console.log('\n=== Example 5: Tool Calling ===');
    const toolResponse = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: 'What is the weather like in Boston?' }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get the current weather in a given location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g. San Francisco, CA'
                },
                unit: {
                  type: 'string',
                  enum: ['celsius', 'fahrenheit']
                }
              },
              required: ['location']
            }
          }
        }
      ],
      tool_choice: 'auto'
    });

    console.log('Tool calls:', JSON.stringify(toolResponse.choices[0].message.tool_calls, null, 2));
    console.log('Finish reason:', toolResponse.choices[0].finish_reason);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);
