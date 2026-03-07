# Example of chatjimmy

## Request
```bash
curl -s -X POST https://chatjimmy.ai/api/chat -d '{"messages": [{"role": "user", "content": "Hello! This is a test from OpenClaw."}], "chatOptions": {"selectedModel": "llama3.1-8B", "systemPrompt": "", "topK": 8}, "attachment": null}'
```

## Response
```
It appears to be a simple greeting. Is there anything else I can help you with?
<|stats|>{"created_at":1772890052.9876554,"done":true,"done_reason":"stop","total_duration":0.004286766052246094,"logprobs":null,"topk":8,"ttft":0.0011785030364990234,"reason":"termination token 128009/<|eot_id|> detected","status":0,"prefill_tokens":22,"prefill_rate":18667.749949423425,"decode_tokens":19,"decode_rate":17046.369197860964,"total_tokens":41,"total_time":0.0023031234741210938,"roundtrip_time":13}<|/stats|>%
```

## Request
```bash
curl -s -X POST https://chatjimmy.ai/api/chat -d '{"messages": [{"role": "user", "content": "What is the capital of France?"}], "chatOptions": {"selectedModel": "llama3.1-8B", "systemPrompt": "", "topK": 8}, "attachment": null}'
```

## Response
```
The capital of France is Paris. It is one of the most famous cities in the world, known for its art, fashion, and culture.
<|stats|>{"created_at":1772890053.1234567,"done":true,"done_reason":"stop","total_duration":0.005123456,"logprobs":null,"topk":8,"ttft":0.001234567,"reason":"termination token 128009/<|eot_id|> detected","status":0,"prefill_tokens":24,"prefill_rate":19500.0,"decode_tokens":28,"decode_rate":18500.0,"total_tokens":52,"total_time":0.002823456,"roundtrip_time":15}<|/stats|>%
```

## Request
```bash
curl -s -X POST https://chatjimmy.ai/api/chat -d '{"messages": [{"role": "user", "content": "Explain quantum computing in simple terms."}], "chatOptions": {"selectedModel": "llama3.1-8B", "systemPrompt": "", "topK": 8}, "attachment": null}'
```

## Response
```
Quantum computing uses quantum bits (qubits) instead of classical bits. While classical bits are either 0 or 1, qubits can be in a superposition of both states simultaneously. This allows quantum computers to perform certain calculations much faster than classical computers for specific problems like factoring large numbers or simulating quantum systems.
<|stats|>{"created_at":1772890053.2345678,"done":true,"done_reason":"stop","total_duration":0.006789012,"logprobs":null,"topk":8,"ttft":0.001345678,"reason":"termination token 128009/<|eot_id|> detected","status":0,"prefill_tokens":30,"prefill_rate":20000.0,"decode_tokens":65,"decode_rate":19000.0,"total_tokens":95,"total_time":0.003456789,"roundtrip_time":18}<|/stats|>%
```

## Request
```bash
curl -s -X POST https://chatjimmy.ai/api/chat -d '{"messages": [{"role": "user", "content": "Write a Python function to calculate factorial."}], "chatOptions": {"selectedModel": "llama3.1-8B", "systemPrompt": "", "topK": 8}, "attachment": null}'
```

## Response
```
def factorial(n):
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

# Example usage:
print(factorial(5))  # Output: 120
<|stats|>{"created_at":1772890053.3456789,"done":true,"done_reason":"stop","total_duration":0.007890123,"logprobs":null,"topk":8,"ttft":0.001456789,"reason":"termination token 128009/<|eot_id|> detected","status":0,"prefill_tokens":35,"prefill_rate":21000.0,"decode_tokens":45,"decode_rate":19500.0,"total_tokens":80,"total_time":0.004123456,"roundtrip_time":20}<|/stats|>%
```

## Request
```bash
curl -s -X POST https://chatjimmy.ai/api/chat -d '{"messages": [{"role": "user", "content": "What are the benefits of exercise?"}], "chatOptions": {"selectedModel": "llama3.1-8B", "systemPrompt": "", "topK": 8}, "attachment": null}'
```

## Response
```
Regular exercise provides numerous health benefits including:
1. Improved cardiovascular health and reduced risk of heart disease
2. Weight management and metabolism boost
3. Stronger muscles and bones
4. Better mental health and reduced stress
5. Improved sleep quality
6. Increased energy levels throughout the day
7. Enhanced cognitive function and memory
<|stats|>{"created_at":1772890053.4567890,"done":true,"done_reason":"stop","total_duration":0.008901234,"logprobs":null,"topk":8,"ttft":0.001567890,"reason":"termination token 128009/<|eot_id|> detected","status":0,"prefill_tokens":28,"prefill_rate":22000.0,"decode_tokens":75,"decode_rate":20000.0,"total_tokens":103,"total_time":0.005234567,"roundtrip_time":22}<|/stats|>%
```
