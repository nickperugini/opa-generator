# OpenAI OPA Policy Generator

An intelligent, MCP-based agent system for generating, validating, and managing Open Policy Agent (OPA) Rego policies using OpenAI GPT-4o Mini with advanced tool orchestration and workflow automation.

## Live Application

- **Frontend**: http://opa-policy-generator.s3-website-us-east-1.amazonaws.com
- **API Base URL**: https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev
- **GitHub Repository**: https://github.com/nickperugini/opa-generator

## Features

### Core Functionality
- **Natural Language to OPA**: Convert plain English instructions to syntactically correct Rego policies
- **Policy Refinement**: Modify existing policies while preserving original intent and structure
- **Dynamic Test Inputs**: Automatically generate test cases that match your policy's input structure
- **Real-time Generation**: Instant policy creation with streaming responses
- **No Import Statements**: Clean policies without unnecessary import statements
- **Intelligent Agent**: Context-aware policy generation with memory and conversation history
- **Tool Orchestration**: 7 specialized MCP servers for different policy-related tasks
- **Workflow Automation**: Smart workflow selection based on request type and complexity

### User Experience
- **Policy History**: Automatically save all generated policies with instructions (browser local storage)
- **Instruction Templates**: Save and reuse common policy instruction patterns
- **Search & Filter**: Find previous policies by instructions, content, or tags
- **Export/Import**: Export policy history and templates for backup or sharing
- **Monaco Editor**: Professional code editor with Rego syntax highlighting
- **Responsive Design**: Works on desktop and mobile devices
- **4 Main Tabs**: Generator, Editor, History, API Documentation

### Technical Features
- **Cost Optimized**: Uses GPT-4o Mini for excellent quality at low cost (~$0.11-1.01/month)
- **Serverless Architecture**: Scales automatically with AWS Lambda
- **CORS Enabled**: Ready for web application integration
- **Comprehensive Error Handling**: Clear error messages and graceful recovery
- **MCP Protocol Integration**: Model Context Protocol for tool orchestration
- **Fallback Mechanisms**: Graceful degradation when agent components fail
- **Security Analysis**: Built-in security analysis and vulnerability detection
- **Policy Validation**: Comprehensive syntax, best practices, and security analysis

### Agent Capabilities
- **Context Management**: Maintains conversation history and policy context
- **Workflow Orchestration**: Automatically selects appropriate workflows based on request type
- **Tool Registry**: Dynamic tool discovery and management
- **Enhanced Validation**: Multi-layer validation including syntax, best practices, and security
- **Policy Explanation**: Detailed explanations of policy logic and behavior
- **Deployment Assistance**: Help with policy deployment and integration

## Architecture

```
Frontend → API Gateway → Agent Lambda → MCP Servers → Specialized Tools
                                    ↓
                               Context Management
                               Workflow Orchestration
                               Tool Selection
```

### System Components
- **Frontend**: React + TypeScript + Vite (hosted on S3)
- **Backend**: AWS Lambda (Node.js 18.x) with MCP-based agent system
- **API**: AWS API Gateway (HTTP API with CORS)
- **AI**: OpenAI GPT-4o Mini with intelligent prompt engineering
- **Security**: API key stored in AWS Secrets Manager
- **Infrastructure**: CloudFormation for reproducible deployments
- **Storage**: Browser localStorage for policy history (no server storage)
- **Monitoring**: CloudWatch dashboard with comprehensive metrics

### Agent Workflows

1. **Generation Workflow**
   ```
   Docs Retrieval → Policy Generation → Validation → Testing → Explanation
   ```

2. **Refinement Workflow**
   ```
   Analysis → Refinement → Validation → Testing → Change Explanation
   ```

3. **Validation Workflow**
   ```
   Syntax Check → Best Practices → Security Analysis → Report Generation
   ```

## Available Tools

| Tool | Purpose | Capabilities |
|------|---------|-------------|
| **Docs Retriever** | Gather OPA documentation | Search docs, best practices, examples |
| **Code Generator** | Create Rego policies | Generate policies, rules, helper functions |
| **Code Refiner** | Improve existing code | Optimize, refactor, add comments |
| **Linter/Validator** | Quality assurance | Syntax check, best practices, security |
| **Unit Tester** | Test generation | Create comprehensive test suites |
| **Policy Explainer** | Documentation | Plain English explanations |
| **Deployment Helper** | Integration support | Deployment configs, guides |

## API Endpoints

### Core Endpoints (100% Backward Compatible)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check and agent status |
| POST | `/generate-policy` | Generate new OPA policy from instructions |
| POST | `/refine-policy` | Refine existing policy with new requirements |

### Enhanced Agent Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/validate-policy` | Comprehensive policy validation |
| POST | `/explain-policy` | Detailed policy explanations |

### API Examples

**Generate Policy:**
```bash
curl -X POST "https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev/generate-policy" \
  -H "Content-Type: application/json" \
  -d '{"instructions": "Only allow if user role is admin and department is HR"}'
```

**Refine Policy:**
```bash
curl -X POST "https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev/refine-policy" \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "Also require MFA enabled",
    "existing_policy": "package access_control\n\ndefault allow = false\n\nallow = true {\n    input.user.role == \"admin\"\n    input.user.department == \"HR\"\n}"
  }'
```

**Validate Policy:**
```bash
curl -X POST "https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev/validate-policy" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": "package example\ndefault allow := false\nallow if input.user.role == \"admin\""
  }'
```

## Quick Start

### For Users
1. **Visit**: http://opa-policy-generator.s3-website-us-east-1.amazonaws.com
2. **Enter Instructions**: Describe your policy in plain English
3. **Generate**: Click "Generate OPA Policy" 
4. **Refine**: Use "Refine Existing Policy" to modify
5. **Validate**: Use validation features for quality assurance
6. **Save**: Policies automatically saved to browser history

### For Developers

#### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ 
- OpenAI API key
- Git

#### Deploy Your Own Instance
```bash
# Clone the repository
git clone https://github.com/nickperugini/opa-generator.git
cd opa-generator

# Deploy to AWS
cd infrastructure
./deploy-secure.sh dev YOUR_OPENAI_API_KEY

# Deploy frontend
cd ../frontend
npm install
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete
```

#### Local Development
```bash
# Install dependencies
cd infrastructure/lambda
npm install

# Setup MCP servers
cd mcp-servers
for dir in */; do cd "$dir" && npm install && cd ..; done

# Run locally (requires additional setup for MCP servers)
npm run dev
```

## Detailed Setup Guide

### Prerequisites

#### Required Tools
- **AWS CLI**: Configured with appropriate permissions
- **Node.js**: Version 18.x or later
- **npm**: Version 8.x or later
- **OpenAI API Key**: From OpenAI platform

#### AWS Permissions Required
Your AWS user/role needs permissions for:
- CloudFormation (create/update/delete stacks)
- Lambda (create/update functions)
- API Gateway (create/manage APIs)
- S3 (create buckets, upload files)
- Secrets Manager (create/read secrets)
- IAM (create roles for Lambda)

### Backend Deployment

#### Option 1: Secure Deployment (Recommended)
```bash
cd infrastructure
./deploy-secure.sh dev YOUR_OPENAI_API_KEY
```

#### Option 2: Manual Deployment
```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name openai-opa-generator \
  --template-body file://cloudformation-agent-fixed.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack creation (5-10 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name openai-opa-generator \
  --region us-east-1

# Add OpenAI API key to AWS Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id openai-api-key \
  --secret-string "your-openai-api-key-here" \
  --region us-east-1

# Deploy Lambda function
cd lambda
npm install
zip -r ../lambda-deployment.zip .
aws lambda update-function-code \
  --function-name dev-openai-opa-agent \
  --zip-file fileb://../lambda-deployment.zip \
  --region us-east-1
```

### Frontend Deployment

#### Create S3 Bucket
```bash
# Create S3 bucket (use a unique name)
aws s3 mb s3://your-unique-bucket-name --region us-east-1

# Configure for static website hosting
aws s3 website s3://your-unique-bucket-name \
  --index-document index.html \
  --error-document index.html

# Disable block public access
aws s3api put-public-access-block \
  --bucket your-unique-bucket-name \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Apply public read policy
aws s3api put-bucket-policy \
  --bucket your-unique-bucket-name \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::your-unique-bucket-name/*"
      }
    ]
  }'
```

#### Build and Deploy Frontend
```bash
cd frontend
npm install
npm run build
aws s3 sync dist/ s3://your-unique-bucket-name --delete
```

#### Update CORS Configuration
```bash
# Get your API Gateway ID from CloudFormation outputs
API_ID=$(aws cloudformation describe-stacks \
  --stack-name openai-opa-generator \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiId`].OutputValue' \
  --output text \
  --region us-east-1)

# Update CORS to include your S3 bucket URL
aws apigatewayv2 update-api \
  --api-id $API_ID \
  --cors-configuration '{
    "AllowOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://your-unique-bucket-name.s3-website-us-east-1.amazonaws.com"
    ],
    "AllowMethods": ["GET", "POST", "OPTIONS"],
    "AllowHeaders": ["content-type", "x-amz-date", "authorization", "x-api-key"],
    "MaxAge": 300
  }' \
  --region us-east-1
```

## GitHub Repository Setup

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `opa-policy-agent` (or your preferred name)
   - **Description**: `Intelligent OPA Policy Generator with MCP-based Agent System`
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

### Step 2: Push to GitHub

After creating the repository, run these commands:

```bash
cd /home/nperu/Documents/openai-streaming-demo

# Add your GitHub repository as remote (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify Upload

1. Go to your GitHub repository
2. Verify all files are uploaded
3. Check that sensitive files are NOT present:
   - No API keys
   - No .env files
   - No credentials
   - No deployment artifacts (.zip files)

### Step 4: Set Repository Secrets (for CI/CD)

If you want to set up automated deployments:

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Secrets and variables" → "Actions"
4. Add these secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_REGION`: Your preferred AWS region (e.g., us-east-1)

## Migration from Original System

The agent system maintains **100% backward compatibility**:

- All existing endpoints work unchanged
- Same request/response formats
- Streaming support preserved
- Frontend requires no changes

**New benefits:**
- Context-aware responses with conversation memory
- Tool orchestration with specialized MCP servers
- Better validation and comprehensive testing
- Enhanced security analysis and vulnerability detection
- Workflow automation based on request complexity
- Policy explanation and documentation capabilities

### Migration Steps

#### 1. Deploy the Agent System

```bash
# Navigate to infrastructure directory
cd infrastructure

# Deploy the agent system
./deploy-secure.sh dev YOUR_OPENAI_API_KEY

# Or manually:
aws cloudformation deploy \
    --template-file cloudformation-agent-fixed.yaml \
    --stack-name dev-openai-opa-agent \
    --parameter-overrides Environment=dev OpenAIApiKey=YOUR_KEY \
    --capabilities CAPABILITY_NAMED_IAM
```

#### 2. Update Frontend Configuration

The agent system maintains **100% backward compatibility** with existing endpoints:

```typescript
// No changes needed for existing functionality
const API_BASE_URL = 'https://your-new-agent-api-endpoint.com/dev';

// Existing endpoints work exactly the same:
// POST /generate-policy
// POST /refine-policy  
// GET /health

// New endpoints available:
// POST /validate-policy
// POST /explain-policy
```

#### 3. Optional: Leverage New Capabilities

```typescript
// New validation endpoint
const validatePolicy = async (policy: string) => {
  const response = await fetch(`${API_BASE_URL}/validate-policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policy })
  });
  return response.json();
};

// New explanation endpoint
const explainPolicy = async (policy: string) => {
  const response = await fetch(`${API_BASE_URL}/explain-policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policy })
  });
  return response.json();
};
```

## Project Structure

```
opa-generator/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── PolicyInstructionInput.tsx
│   │   │   ├── StreamingPolicyDisplay.tsx
│   │   │   ├── PolicyEditor.tsx
│   │   │   ├── PolicyHistory.tsx
│   │   │   └── ApiDocumentation.tsx
│   │   ├── services/           # API and storage services
│   │   │   ├── api.ts
│   │   │   ├── streamingApi.ts
│   │   │   └── policyHistory.ts
│   │   ├── hooks/              # React hooks
│   │   │   └── useStreamingPolicy.ts
│   │   ├── index.css           # Custom CSS framework
│   │   └── App.tsx             # Main application
│   ├── package.json
│   └── vite.config.ts
├── infrastructure/
│   ├── cloudformation-agent-fixed.yaml  # AWS infrastructure as code
│   ├── deploy-secure.sh        # Secure deployment script
│   ├── deploy-flexible.sh      # Flexible deployment script
│   └── lambda/                 # Lambda function code
│       ├── index.js            # Main handler with agent orchestration
│       ├── agent-core.js       # Agent system core logic
│       ├── workflows.js        # Workflow implementations
│       ├── mcp-servers/        # MCP server implementations
│       │   ├── docs-retriever/
│       │   ├── code-generator/
│       │   └── linter-validator/
│       └── package.json
└── README.md                   # This file
```

## Use Cases

### Access Control Policies
- **Role-based Access**: "Only allow if user role is admin"
- **Attribute-based Access**: "Allow if user department is HR and has manager role"
- **Multi-factor Authentication**: "Require MFA for admin operations"

### Time-based Policies
- **Business Hours**: "Only allow access during business hours (9 AM - 5 PM)"
- **Date Ranges**: "Allow access only during Q4 2024"
- **Maintenance Windows**: "Deny access during maintenance (weekends 2-4 AM)"

### Resource Protection
- **Document Access**: "Allow read access to documents if user owns them or is in same team"
- **API Rate Limiting**: "Allow max 100 requests per hour per user"
- **Geographic Restrictions**: "Deny access from countries not in approved list"

### Compliance & Governance
- **Data Classification**: "Require encryption for confidential data access"
- **Audit Requirements**: "Log all admin actions and require approval"
- **Regulatory Compliance**: "Enforce GDPR data access restrictions"

## Cost Breakdown

**Monthly costs for typical usage (1-2 users, ~100 policies/month):**
- **S3 Hosting**: ~$0.01/month (static website)
- **Lambda**: ~$0.00/month (within free tier)
- **API Gateway**: ~$0.00/month (within free tier)
- **OpenAI API**: ~$0.10-1.00/month (GPT-4o Mini usage)
- **Secrets Manager**: ~$0.40/month (API key storage)

**Total: ~$0.51-1.41/month**

*Costs scale with usage. Heavy usage may exceed free tiers.*

## Security & Privacy

### Data Privacy
- **No Server Storage**: Policy history stored locally in browser
- **Private by Default**: Each user's data is isolated
- **Export Control**: Users control their data export/import
- **No Tracking**: No analytics or user tracking

### API Security
- **OpenAI API Key**: Secured in AWS Secrets Manager
- **CORS Configured**: Proper cross-origin resource sharing
- **Input Validation**: Sanitization and validation of all inputs
- **Error Handling**: No sensitive data in error responses

### Infrastructure Security
- **IAM Roles**: Minimal permissions for Lambda function
- **VPC Optional**: Can be deployed in VPC for additional isolation
- **CloudWatch Logging**: Comprehensive audit trail
- **Secrets Management**: No hardcoded credentials

### Security Analysis Capabilities
- Authorization bypass detection
- Input validation weakness identification
- Logic flaw analysis
- Privilege escalation risk assessment
- Compliance checking

## Performance & Monitoring

### Performance Metrics
- **Response Time**: ~2-5 seconds for policy generation
- **Availability**: 99.9% uptime with AWS Lambda
- **Scalability**: Serverless architecture scales automatically
- **Cost Efficiency**: Pay-per-use pricing model

### Monitoring
- **CloudWatch Logs**: Lambda function execution logs
- **API Gateway Metrics**: Request/response monitoring
- **Error Tracking**: Comprehensive error logging
- **Usage Analytics**: API call patterns and costs
- **Agent Metrics**: Tool usage, workflow success rates

### CloudWatch Dashboard
Access your monitoring dashboard:
```
https://console.aws.amazon.com/cloudwatch/home#dashboards:name=dev-opa-agent-dashboard
```

## Integration Examples

### JavaScript/TypeScript
```typescript
const policyGenerator = {
  baseUrl: 'https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev',
  
  async generatePolicy(instructions: string) {
    const response = await fetch(`${this.baseUrl}/generate-policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructions })
    });
    return response.json();
  },

  async validatePolicy(policy: string) {
    const response = await fetch(`${this.baseUrl}/validate-policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy })
    });
    return response.json();
  }
};

// Usage
const result = await policyGenerator.generatePolicy(
  "Only allow if user role is admin and department is HR"
);
console.log(result.policy);

const validation = await policyGenerator.validatePolicy(result.policy);
console.log(validation.validation_results);
```

### Python
```python
import requests

class PolicyGenerator:
    def __init__(self):
        self.base_url = "https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev"
    
    def generate_policy(self, instructions):
        url = f"{self.base_url}/generate-policy"
        response = requests.post(url, json={"instructions": instructions})
        return response.json()
    
    def validate_policy(self, policy):
        url = f"{self.base_url}/validate-policy"
        response = requests.post(url, json={"policy": policy})
        return response.json()

# Usage
generator = PolicyGenerator()
result = generator.generate_policy("Only allow if user role is admin")
print(result["policy"])

validation = generator.validate_policy(result["policy"])
print(validation["validation_results"])
```

### Go
```go
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type PolicyGenerator struct {
    BaseURL string
}

func NewPolicyGenerator() *PolicyGenerator {
    return &PolicyGenerator{
        BaseURL: "https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev",
    }
}

func (pg *PolicyGenerator) GeneratePolicy(instructions string) (*PolicyResponse, error) {
    url := pg.BaseURL + "/generate-policy"
    payload := map[string]string{"instructions": instructions}
    
    jsonData, _ := json.Marshal(payload)
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result PolicyResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return &result, nil
}

func (pg *PolicyGenerator) ValidatePolicy(policy string) (*ValidationResponse, error) {
    url := pg.BaseURL + "/validate-policy"
    payload := map[string]string{"policy": policy}
    
    jsonData, _ := json.Marshal(payload)
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result ValidationResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return &result, nil
}
```

## Testing Your Deployment

### 1. Test API Health
```bash
# Get your API URL from CloudFormation
API_URL=$(aws cloudformation describe-stacks \
  --stack-name openai-opa-generator \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text \
  --region us-east-1)

# Test health endpoint
curl "$API_URL/health"
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0-agent",
  "agent_status": "initialized",
  "mcp_servers": 7,
  "available_tools": 15,
  "capabilities": [
    "policy_generation",
    "policy_refinement",
    "policy_validation",
    "policy_explanation",
    "deployment_assistance",
    "context_management",
    "streaming_support"
  ]
}
```

### 2. Test Policy Generation
```bash
# Test policy generation
curl -X POST "$API_URL/generate-policy" \
  -H "Content-Type: application/json" \
  -d '{"instructions": "Only allow if user role is admin"}'
```

### 3. Test New Capabilities
```bash
# Test policy validation
curl -X POST "$API_URL/validate-policy" \
  -H "Content-Type: application/json" \
  -d '{"policy": "package example\ndefault allow := false\nallow if input.user.role == \"admin\""}'

# Test policy explanation
curl -X POST "$API_URL/explain-policy" \
  -H "Content-Type: application/json" \
  -d '{"policy": "package example\ndefault allow := false\nallow if input.user.role == \"admin\""}'
```

### 4. Test Frontend
Visit your S3 website URL and try generating a policy through the UI.

## Updates & Maintenance

### Redeployment
```bash
# Update frontend
cd frontend && npm run build
aws s3 sync dist/ s3://opa-policy-generator --delete

# Update backend
cd infrastructure/lambda && npm install
zip -r ../lambda-deployment.zip .
aws lambda update-function-code \
  --function-name dev-openai-opa-agent \
  --zip-file fileb://../lambda-deployment.zip
```

### Update Lambda Function
```bash
cd infrastructure/lambda
npm install  # Install any new dependencies
zip -r ../lambda-deployment.zip .
aws lambda update-function-code \
  --function-name dev-openai-opa-agent \
  --zip-file fileb://../lambda-deployment.zip \
  --region us-east-1
```

### Update Frontend
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://your-unique-bucket-name --delete
```

### Update Infrastructure
```bash
cd infrastructure
aws cloudformation update-stack \
  --stack-name openai-opa-generator \
  --template-body file://cloudformation-agent-fixed.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitoring Costs
- Monitor OpenAI API usage in OpenAI dashboard
- Check AWS billing for Lambda/API Gateway usage
- Set up CloudWatch alarms for unusual activity

## Troubleshooting

### Common Issues

**Lambda Function Not Working:**
```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/dev-openai-opa-agent"
aws logs tail "/aws/lambda/dev-openai-opa-agent" --follow
```

**CORS Errors:**
- Ensure your S3 bucket URL is in the API Gateway CORS configuration
- Check that the API Gateway has been deployed after CORS changes

**OpenAI API Errors:**
- Verify API key is correctly stored in Secrets Manager
- Check OpenAI account has sufficient credits
- Review rate limits in OpenAI dashboard

**S3 Website Not Loading:**
- Ensure bucket policy allows public read access
- Check that static website hosting is enabled
- Verify index.html exists in bucket root

**MCP Server Connection Failures:**
- Check Lambda logs for MCP server startup errors
- Verify OpenAI API key is properly set
- Ensure sufficient Lambda memory allocation

**Tool Execution Timeouts:**
- Increase Lambda timeout (currently 15 minutes)
- Check individual tool performance
- Consider tool optimization

**Context Management Issues:**
- Monitor memory usage
- Check conversation history size limits
- Verify context serialization

### Getting Help
- Check CloudWatch logs for detailed error messages
- Review AWS CloudFormation events for deployment issues
- Test individual components (Lambda, API Gateway, S3) separately
- Use `/health` endpoint to check agent and tool status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes with comprehensive tests
4. Test thoroughly including agent workflows
5. Submit a pull request with detailed description

### Adding New Tools
1. Create new MCP server in `mcp-servers/`
2. Implement the MCP server interface
3. Add tools following established patterns
4. Update agent configuration
5. Test integration with existing workflows

## Support & Troubleshooting

### Common Issues
- **CORS Errors**: Check API Gateway CORS configuration
- **OpenAI Errors**: Verify API key and account credits
- **Lambda Timeouts**: Check CloudWatch logs for performance issues
- **Agent Failures**: Check MCP server status and fallback mechanisms

### Getting Help
1. **Check Logs**: AWS CloudWatch logs for detailed error information
2. **API Testing**: Use curl or Postman to test endpoints directly
3. **Agent Status**: Use `/health` endpoint to check agent and tool status
4. **GitHub Issues**: Create issues for bugs or feature requests

### Monitoring
- **CloudWatch Dashboard**: Monitor Lambda performance and API Gateway metrics
- **Agent Metrics**: Track tool usage and workflow success rates
- **Cost Monitoring**: Set up billing alerts for OpenAI API usage

## License

MIT License - see LICENSE file for details

---

**Built with AWS Serverless, MCP Protocol, React, and OpenAI GPT-4o Mini**

*Intelligent policy generation with context, memory, and specialized tools*

*Last Updated: July 2025*
