# 🤖 OPA Policy Generator Agent

An intelligent, MCP-based agent system for generating, validating, and managing Open Policy Agent (OPA) Rego policies using OpenAI GPT-4o Mini with advanced tool orchestration.

## 🌟 Features

### **Core Capabilities**
- **🧠 Intelligent Agent**: Context-aware policy generation with memory
- **🛠️ Tool Orchestration**: 7 specialized MCP servers for different tasks
- **🔄 Workflow Automation**: Smart workflow selection based on request type
- **📊 Enhanced Validation**: Comprehensive syntax, best practices, and security analysis
- **🎯 Streaming Support**: Real-time policy generation with SSE
- **🔒 Security First**: Built-in security analysis and vulnerability detection

### **Available Tools**
| Tool | Purpose | Capabilities |
|------|---------|-------------|
| **Docs Retriever** | Gather OPA documentation | Search docs, best practices, examples |
| **Code Generator** | Create Rego policies | Generate policies, rules, helper functions |
| **Code Refiner** | Improve existing code | Optimize, refactor, add comments |
| **Linter/Validator** | Quality assurance | Syntax check, best practices, security |
| **Unit Tester** | Test generation | Create comprehensive test suites |
| **Policy Explainer** | Documentation | Plain English explanations |
| **Deployment Helper** | Integration support | Deployment configs, guides |

## 🚀 Quick Start

### **Prerequisites**
- AWS CLI configured
- Node.js 18+ 
- OpenAI API key

### **Deploy the Agent**
```bash
# Clone the repository
git clone <your-repo-url>
cd openai-streaming-demo

# Deploy to AWS
cd infrastructure
./deploy-agent.sh dev YOUR_OPENAI_API_KEY
```

### **Test the Deployment**
```bash
# Health check
curl https://your-endpoint/dev/health

# Generate a policy
curl -X POST https://your-endpoint/dev/generate-policy \
  -H "Content-Type: application/json" \
  -d '{"instructions": "Only allow admin users to access sensitive data"}'
```

## 📡 API Endpoints

### **Original Endpoints (100% Compatible)**
- `GET /health` - System health and agent status
- `POST /generate-policy` - Generate new OPA policies
- `POST /refine-policy` - Refine existing policies

### **New Agent Endpoints**
- `POST /validate-policy` - Comprehensive policy validation
- `POST /explain-policy` - Detailed policy explanations

## 🏗️ Architecture

```
Frontend → API Gateway → Agent Lambda → MCP Servers → Specialized Tools
                                    ↓
                               Context Management
                               Workflow Orchestration
                               Tool Selection
```

### **Agent Workflows**

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

## 🛠️ Development

### **Local Development**
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

### **Adding New Tools**
1. Create new MCP server in `mcp-servers/`
2. Implement the MCP server interface
3. Add tools following established patterns
4. Update agent configuration
5. Test integration

## 📊 Monitoring

### **CloudWatch Dashboard**
Access your monitoring dashboard:
```
https://console.aws.amazon.com/cloudwatch/home#dashboards:name=dev-opa-agent-dashboard
```

### **Key Metrics**
- Lambda performance (duration, invocations, errors)
- API Gateway metrics (requests, latency, errors)
- Agent-specific metrics (tool usage, workflow success)

## 🔒 Security

### **Built-in Security Features**
- ✅ API keys secured in AWS Secrets Manager
- ✅ Comprehensive input validation
- ✅ Security analysis of generated policies
- ✅ Vulnerability detection and bypass analysis
- ✅ IAM roles with minimal permissions

### **Security Analysis Capabilities**
- Authorization bypass detection
- Input validation weakness identification
- Logic flaw analysis
- Privilege escalation risk assessment
- Compliance checking

## 📚 Documentation

- **[Migration Guide](./AGENT_MIGRATION.md)** - Upgrade from original system
- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[Setup Guide](./SETUP.md)** - Detailed setup instructions
- **[MCP Servers](./infrastructure/lambda/mcp-servers/README.md)** - Tool documentation

## 🧪 Example Usage

### **Generate a Policy**
```javascript
const response = await fetch('/generate-policy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    instructions: "Create a policy that allows managers to approve expenses under $1000"
  })
});

const result = await response.json();
console.log(result.policy);
```

### **Validate a Policy**
```javascript
const response = await fetch('/validate-policy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    policy: "package example\ndefault allow := false\nallow if input.user.role == \"admin\""
  })
});

const validation = await response.json();
console.log(validation.validation_results);
```

### **Explain a Policy**
```javascript
const response = await fetch('/explain-policy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    policy: "package example\ndefault allow := false\nallow if input.user.role == \"admin\""
  })
});

const explanation = await response.json();
console.log(explanation.explanation);
```

## 🔄 Migration from Original

The agent system maintains **100% backward compatibility**:

- ✅ All existing endpoints work unchanged
- ✅ Same request/response formats
- ✅ Streaming support preserved
- ✅ Frontend requires no changes

**New benefits:**
- 🧠 Context-aware responses
- 🛠️ Tool orchestration
- 📊 Better validation and testing
- 🔒 Enhanced security analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: Create GitHub issues for bugs or feature requests
- **Documentation**: Check the docs/ directory
- **Monitoring**: Use CloudWatch dashboard for operational issues

---

**Built with ❤️ using AWS Serverless, MCP Protocol, React, and OpenAI GPT-4o Mini**

*Intelligent policy generation with context, memory, and specialized tools*
