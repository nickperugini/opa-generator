# OpenAI OPA Policy Generator API

A serverless API for generating and refining Open Policy Agent (OPA) Rego policies using GPT-4o Mini.

## Base URL
```
https://sw9i8ofa62.execute-api.us-east-1.amazonaws.com/dev
```

## Authentication
No authentication required for public endpoints.

## Endpoints

### 1. Health Check
**GET** `/health`

Check the health status of the API and OpenAI connection.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-12T01:00:00.000Z",
  "version": "1.0.0",
  "openai_status": "connected"
}
```

### 2. Generate Policy
**POST** `/generate-policy`

Generate a new OPA Rego policy from natural language instructions.

**Request Body:**
```json
{
  "instructions": "Only allow if user role is admin and department is HR",
  "context": {
    "domain": "access_control",
    "complexity": "simple"
  }
}
```

**Response:**
```json
{
  "type": "complete",
  "policy": "package rbac.admin_access\n\ndefault allow := false\n\nallow if {\n    input.user.role == \"admin\"\n    input.user.department == \"HR\"\n}",
  "test_inputs": [
    {
      "description": "Admin user in HR department should be allowed",
      "input": {
        "user": {
          "role": "admin",
          "department": "HR"
        }
      },
      "expected": true
    },
    {
      "description": "Regular user should be denied",
      "input": {
        "user": {
          "role": "user",
          "department": "HR"
        }
      },
      "expected": false
    }
  ],
  "explanation": "This policy allows access only if the user's role is 'admin' and department is 'HR'.",
  "timestamp": "2025-07-12T01:00:00.000Z",
  "metadata": {
    "instructions": "Only allow if user role is admin and department is HR",
    "generated_at": "2025-07-12T01:00:00.000Z",
    "model": "gpt-4o-mini",
    "validation_warnings": []
  }
}
```

### 3. Refine Policy
**POST** `/refine-policy`

Refine an existing OPA Rego policy with new requirements while preserving original intent.

**Request Body:**
```json
{
  "instructions": "Also require that the user has MFA enabled",
  "existing_policy": "package rbac.admin_access\n\ndefault allow := false\n\nallow if {\n    input.user.role == \"admin\"\n    input.user.department == \"HR\"\n}",
  "context": {
    "domain": "access_control",
    "complexity": "medium"
  }
}
```

**Response:**
```json
{
  "type": "complete",
  "policy": "package rbac.admin_access\n\ndefault allow := false\n\nallow if {\n    input.user.role == \"admin\"\n    input.user.department == \"HR\"\n    input.user.mfa_enabled == true\n}",
  "test_inputs": [
    {
      "description": "Admin user in HR with MFA should be allowed",
      "input": {
        "user": {
          "role": "admin",
          "department": "HR",
          "mfa_enabled": true
        }
      },
      "expected": true
    },
    {
      "description": "Admin user in HR without MFA should be denied",
      "input": {
        "user": {
          "role": "admin",
          "department": "HR",
          "mfa_enabled": false
        }
      },
      "expected": false
    }
  ],
  "explanation": "This policy allows access only if the user's role is 'admin', department is 'HR', and MFA is enabled.",
  "timestamp": "2025-07-12T01:00:00.000Z",
  "refinement": true
}
```

## Request Parameters

### Context Object (Optional)
- `domain`: String - Domain context (e.g., "access_control", "time_based_access")
- `complexity`: String - Complexity level ("simple", "medium", "complex")

## Response Format

All successful responses include:
- `type`: Always "complete"
- `policy`: Generated OPA Rego policy code (no import statements)
- `test_inputs`: Array of test cases with realistic input data
- `explanation`: Human-readable explanation of the policy
- `timestamp`: ISO 8601 timestamp
- `refinement`: Boolean (only present for refine-policy endpoint)
- `metadata`: Additional information about generation

## Test Inputs Format

Test inputs are dynamically generated to match the policy structure:
```json
{
  "description": "Clear description of what is being tested",
  "input": {
    // Exact input data structure that matches policy's input.* references
  },
  "expected": true/false // Expected result for allow rules
}
```

## Error Codes

### 400 Bad Request
```json
{
  "error": "Instructions are required and must be a string",
  "code": "INVALID_INPUT"
}
```

### 429 Too Many Requests
```json
{
  "error": "OpenAI API rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to generate OPA policy",
  "code": "GENERATION_ERROR",
  "details": "OpenAI API error message"
}
```

## Usage Examples

### cURL Examples

**Health Check:**
```bash
curl -X GET "https://sw9i8ofa62.execute-api.us-east-1.amazonaws.com/dev/health"
```

**Generate Policy:**
```bash
curl -X POST "https://sw9i8ofa62.execute-api.us-east-1.amazonaws.com/dev/generate-policy" \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "Only allow if user role is admin and department is HR",
    "context": {
      "domain": "access_control",
      "complexity": "simple"
    }
  }'
```

**Refine Policy:**
```bash
curl -X POST "https://sw9i8ofa62.execute-api.us-east-1.amazonaws.com/dev/refine-policy" \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "Also require that the user has MFA enabled",
    "existing_policy": "package rbac.admin_access\n\ndefault allow := false\n\nallow if {\n    input.user.role == \"admin\"\n    input.user.department == \"HR\"\n}",
    "context": {
      "domain": "access_control"
    }
  }'
```

### JavaScript/TypeScript Example

```typescript
const API_BASE_URL = 'https://sw9i8ofa62.execute-api.us-east-1.amazonaws.com/dev';

// Generate a new policy
async function generatePolicy(instructions: string, context?: any) {
  const response = await fetch(`${API_BASE_URL}/generate-policy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instructions,
      context
    })
  });
  
  return await response.json();
}

// Refine an existing policy
async function refinePolicy(instructions: string, existingPolicy: string, context?: any) {
  const response = await fetch(`${API_BASE_URL}/refine-policy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instructions,
      existing_policy: existingPolicy,
      context
    })
  });
  
  return await response.json();
}

// Usage
const policy = await generatePolicy(
  "Only allow if user role is admin and department is HR",
  { domain: "access_control", complexity: "simple" }
);

const refinedPolicy = await refinePolicy(
  "Also require that the user has MFA enabled",
  policy.policy,
  { domain: "access_control" }
);
```

## Features

- **Dynamic Test Inputs**: Test cases automatically match the policy's input structure
- **No Import Statements**: Generated policies never include import statements
- **Policy Refinement**: Modify existing policies while preserving original intent
- **GPT-4o Mini**: Cost-effective AI model with excellent policy generation capabilities
- **CORS Enabled**: Ready for web application integration
- **Comprehensive Error Handling**: Clear error messages and codes

## Rate Limits

The API uses OpenAI's GPT-4o Mini model, which has the following rate limits:
- Requests per minute: Varies by OpenAI tier
- Tokens per minute: Varies by OpenAI tier

Rate limit errors will return HTTP 429 with appropriate error messages.

## Architecture

- **Frontend**: React app hosted on S3
- **Backend**: AWS Lambda with Node.js 18.x
- **API Gateway**: HTTP API with CORS support
- **AI Model**: OpenAI GPT-4o Mini
- **Security**: API key stored in AWS Secrets Manager
