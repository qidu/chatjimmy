---
name: vertex-ai-gemini
description: |
  Google Vertex AI Gemini API for content generation. Use when:
  - Making Gemini API calls to Vertex AI
  - Working with Google Cloud AI services
  - Using multimodal inputs (text, images, audio, video)
  - Configuring generation parameters (temperature, maxOutputTokens, etc.)
  - Handling safety settings and tool calls

  NOT for: Google AI Studio (use REST directly), non-Vertex deployments.
---

# Vertex AI Gemini API Skill

Google Cloud Vertex AI Gemini API reference.

## Quick Reference

| Task | Endpoint |
|------|----------|
| Generate content | `POST /v1/projects/{project}/locations/{location}/publishers/{model}:generateContent` |
| Stream generate | `POST /v1/projects/{project}/locations/{location}/publishers/{model}:streamGenerateContent` |
| Count tokens | `POST /v1/projects/{project}/locations/{location}/publishers/{model}:countTokens` |

## Endpoint

```
POST https://{endpoint}/v1/projects/{project}/locations/{location}/publishers/{model}:generateContent
```

**Parameters:**
- `{endpoint}` - e.g., `us-central1-aiplatform.googleapis.com`
- `{project}` - GCP project number or ID
- `{location}` - e.g., `us-central1`
- `{model}` - e.g., `gemini-1.5-pro`, `gemini-1.5-flash`

## The Proxy Endpoint

```
POST https://{endpoint}/v1beta/models/{model}:generateContent
```

**Parameters:**
- `{endpoint}` - a Proxy host e.g., `apiproxy.com`
- `{model}` - e.g., `gemini-1.5-pro`, `gemini-1.5-flash`


## Authentication

```bash
# Via Google Auth Library
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Via access token
curl -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" ...
```

## Request Body

### Content Structure

```json
{
  "contents": [
    {
      "role": "user" | "model",
      "parts": [
        {
          "text": "Hello, Gemini!"
        }
      ]
    }
  ]
}
```

### Multimodal Parts

```json
{
  "parts": [
    { "text": "Describe this image:" },
    {
      "inlineData": {
        "mimeType": "image/jpeg",
        "data": "base64-encoded-image-data"
      }
    },
    {
      "fileData": {
        "mimeType": "audio/mp3",
        "fileUri": "gs://bucket/audio.mp3"
      }
    }
  ]
}
```

### Generation Config

```json
{
  "generationConfig": {
    "stopSequences": ["END"],
    "temperature": 0.9,
    "maxOutputTokens": 8192,
    "topP": 0.95,
    "topK": 40
  }
}
```

### Safety Settings

```json
{
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}
```

### Tools (Function Calling)

```json
{
  "tools": [
    {
      "functionDeclarations": [
        {
          "name": "get_weather",
          "description": "Get weather for a location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "City name"
              }
            },
            "required": ["location"]
          }
        }
      ]
    }
  ]
}
```

## Complete Example

```bash
# Text generation
curl -X POST \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{ "text": "Explain quantum computing in 2 sentences." }]
    }],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 256
    }
  }'
```

## Response Structure

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [{ "text": "Quantum computing uses..." }]
      },
      "finishReason": "STOP",
      "safetyRatings": [
        {
          "category": "HARM_CATEGORY_HARASSMENT",
          "probability": "NEGLIGIBLE"
        }
      ],
      "tokenCount": 45
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 15,
    "candidatesTokenCount": 45,
    "totalTokenCount": 60
  }
}
```

## Model Names

| Model | Description |
|-------|-------------|
| `gemini-1.5-pro` | Most capable, for complex tasks |
| `gemini-1.5-flash` | Fast, efficient, high volume |
| `gemini-1.0-pro` | Legacy pro model |
| `gemini-1.0-ultra` | Experimental ultra |

## Common Patterns

### Streaming Response

```bash
curl -X POST \
  ".../publishers/google/models/gemini-1.5-flash:streamGenerateContent" \
  ... # Same headers and body as above
```

### Image Input

```bash
# Encode image to base64
IMAGE_BASE64=$(base64 -i image.jpg | tr -d '\n')

curl ... -d '{
  "contents": [{
    "parts": [
      { "text": "What is in this image?" },
      { "inlineData": { "mimeType": "image/jpeg", "data": "'$IMAGE_BASE64'" } }
    ]
  }]
}'
```

### System Instruction

```json
{
  "contents": [...],
  "systemInstruction": {
    "parts": [{ "text": "You are a helpful coding assistant." }]
  }
}
```

## Important Notes

- **Rate limits**: Check GCP quotas for your project
- **Pricing**: Based on input/output tokens per model
- **Context window**: gemini-1.5 models support up to 2M tokens
- **Authentication**: Requires Vertex AI User role or higher
- **Region**: Some models available only in specific regions
