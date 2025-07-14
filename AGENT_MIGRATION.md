# Migration to MCP-Based Agent System

This guide explains how to migrate from the original OpenAI streaming demo to the new MCP-based agent system while maintaining all existing functionality.

## 🎯 What's New

### **Agent Architecture**
- **Context Management**: Persistent conversation history and policy context
- **Tool Orchestration**: Multiple specialized MCP servers for different tasks
- **Workflow Automation**: Intelligent workflow selection based on request type
- **Enhanced Capabilities**: Validation, explanation, and deployment assistance

### **New Endpoints**
- `POST /validate-policy` - Comprehensive policy validation
- `POST /explain-policy` - Detailed policy explanations

### **Enhanced Features**
- **Better Test Generation**: Context-aware test case creation
- **Policy Validation**: Syntax and best practices checking
- **Security Analysis**: Vulnerability detection and bypass scenario analysis
- **Deployment Assistance**: Configuration generation and integration guides

## 🔄 Migration Steps

### **1. Deploy the Agent System**

```bash
# Navigate to infrastructure directory
cd infrastructure

# Deploy the agent system
./deploy-agent.sh dev YOUR_OPENAI_API_KEY

# Or manually:
aws cloudformation deploy \
    --template-file cloudformation-agent.yaml \
    --stack-name dev-openai-opa-agent \
    --parameter-overrides Environment=dev OpenAIApiKey=YOUR_KEY \
    --capabilities CAPABILITY_NAMED_IAM
```

### **2. Update Frontend Configuration**

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

### **3. Optional: Leverage New Capabilities**

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

## 🔧 Architecture Comparison

### **Original System**
```
Frontend → API Gateway → Lambda → OpenAI → Response
```

### **Agent System**
```
Frontend → API Gateway → Agent Lambda → MCP Servers → Tools → Response
                                    ↓
                               Context Management
                               Workflow Orchestration
                               Tool Selection
```

## 📊 Enhanced Capabilities

### **1. Context Management**
The agent maintains conversation history and policy context across requests:

```json
{
  "conversationHistory": [...],
  "policyContext": {
    "currentPolicy": "...",
    "requirements": [...],
    "testCases": [...],
    "validationResults": [...]
  }
}
```

### **2. Intelligent Workflows**

The agent automatically selects the best workflow based on your request:

- **Generation Workflow**: Docs → Generate → Validate → Test → Explain
- **Refinement Workflow**: Analyze → Refine → Validate → Test → Explain Changes
- **Validation Workflow**: Syntax → Best Practices → Security → Report
- **Explanation Workflow**: Structure Analysis → Plain English → Examples

### **3. Tool Orchestration**

Each workflow uses multiple specialized tools:

| Tool | Purpose | Used In |
|------|---------|---------|
| Docs Retriever | Get OPA documentation | Generation, Refinement |
| Code Generator | Create Rego policies | Generation |
| Code Refiner | Improve existing code | Refinement |
| Linter/Validator | Check syntax & practices | All workflows |
| Unit Tester | Generate & run tests | Generation, Refinement |
| Policy Explainer | Create explanations | All workflows |
| Deployment Helper | Assist with deployment | Deployment workflow |

## 🚀 Performance Improvements

### **Response Quality**
- **Better Test Cases**: Context-aware test generation matching actual policy logic
- **Comprehensive Validation**: Syntax, best practices, and security analysis
- **Detailed Explanations**: Structure analysis and plain English descriptions

### **Error Handling**
- **Graceful Degradation**: If one tool fails, others continue
- **Fallback Mechanisms**: Backup approaches for critical operations
- **Detailed Error Context**: Better error messages for debugging

### **Monitoring**
- **CloudWatch Dashboard**: Performance metrics and monitoring
- **Detailed Logging**: Tool execution and workflow progress
- **Health Checks**: Agent status and tool availability

## 🔒 Security Enhancements

### **Input Validation**
- Enhanced input sanitization
- Context-aware validation
- Security-focused analysis

### **Policy Security Analysis**
- Vulnerability detection
- Bypass scenario analysis
- Security recommendations
- Compliance checking

## 📈 Monitoring and Observability

### **CloudWatch Metrics**
- Lambda performance (duration, invocations, errors)
- API Gateway metrics (requests, latency, errors)
- Custom agent metrics (tool usage, workflow success rates)

### **Logging**
- Structured logging for all agent operations
- Tool execution traces
- Workflow step tracking
- Error context and recovery attempts

### **Dashboard**
Access your monitoring dashboard:
```
https://console.aws.amazon.com/cloudwatch/home#dashboards:name=dev-opa-agent-dashboard
```

## 🧪 Testing the Migration

### **1. Health Check**
```bash
curl https://your-agent-endpoint/dev/health
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

### **2. Test Existing Functionality**
```bash
# Test policy generation (should work exactly as before)
curl -X POST https://your-agent-endpoint/dev/generate-policy \
  -H "Content-Type: application/json" \
  -d '{"instructions": "Only allow admin users to access sensitive data"}'
```

### **3. Test New Capabilities**
```bash
# Test policy validation
curl -X POST https://your-agent-endpoint/dev/validate-policy \
  -H "Content-Type: application/json" \
  -d '{"policy": "package example\ndefault allow := false\nallow if input.user.role == \"admin\""}'

# Test policy explanation
curl -X POST https://your-agent-endpoint/dev/explain-policy \
  -H "Content-Type: application/json" \
  -d '{"policy": "package example\ndefault allow := false\nallow if input.user.role == \"admin\""}'
```

## 🔄 Rollback Plan

If you need to rollback to the original system:

1. **Keep Original Stack**: Don't delete the original CloudFormation stack
2. **Switch Endpoints**: Update frontend to use original API endpoint
3. **DNS/Load Balancer**: Route traffic back to original system

## 📚 Additional Resources

- [MCP Server Documentation](./infrastructure/lambda/mcp-servers/README.md)
- [Agent Architecture Guide](./AGENT_ARCHITECTURE.md)
- [Tool Development Guide](./TOOL_DEVELOPMENT.md)
- [Monitoring and Troubleshooting](./MONITORING.md)

## 🆘 Troubleshooting

### **Common Issues**

1. **MCP Server Connection Failures**
   - Check Lambda logs for MCP server startup errors
   - Verify OpenAI API key is properly set
   - Ensure sufficient Lambda memory allocation

2. **Tool Execution Timeouts**
   - Increase Lambda timeout (currently 15 minutes)
   - Check individual tool performance
   - Consider tool optimization

3. **Context Management Issues**
   - Monitor memory usage
   - Check conversation history size limits
   - Verify context serialization

### **Getting Help**

1. **CloudWatch Logs**: Check Lambda function logs for detailed error information
2. **Dashboard**: Monitor performance metrics and error rates
3. **Health Endpoint**: Verify agent and tool status

## ✨ Benefits Summary

- **🔄 100% Backward Compatibility**: All existing functionality preserved
- **🧠 Enhanced Intelligence**: Context-aware responses and workflows
- **🛠️ Tool Orchestration**: Specialized tools for better results
- **📊 Better Monitoring**: Comprehensive observability and metrics
- **🔒 Enhanced Security**: Security analysis and validation
- **🚀 Improved Performance**: Better test generation and explanations
- **📈 Scalable Architecture**: Easy to add new tools and capabilities

The migration provides significant improvements while maintaining complete compatibility with your existing frontend and workflows.
