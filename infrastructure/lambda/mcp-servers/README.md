# MCP Servers for OPA Policy Agent

This directory contains Model Context Protocol (MCP) servers that provide specialized tools for OPA policy generation, validation, and management.

## Available Servers

### 1. Docs Retriever (`docs-retriever/`)
- **Purpose**: Gather OPA documentation, examples, and best practices
- **Tools**: 
  - `gather-opa-docs`: Search and retrieve relevant documentation
  - `get-best-practices`: Get OPA best practices for specific scenarios
  - `find-examples`: Find code examples matching requirements

### 2. Code Generator (`code-generator/`)
- **Purpose**: Generate new Rego rules from requirements
- **Tools**:
  - `generate-rego-policy`: Create complete Rego policies
  - `generate-rule-fragment`: Create specific rule fragments
  - `generate-helper-functions`: Create reusable helper functions

### 3. Code Refiner (`code-refiner/`)
- **Purpose**: Refine, optimize, and explain Rego code
- **Tools**:
  - `refine-rego-code`: Improve existing Rego code
  - `optimize-performance`: Optimize policy performance
  - `add-comments`: Add comprehensive comments to code

### 4. Linter/Validator (`linter-validator/`)
- **Purpose**: Check syntax and best practices
- **Tools**:
  - `validate-rego-syntax`: Check Rego syntax correctness
  - `check-rego-best-practices`: Validate against best practices
  - `analyze-policy-security`: Security analysis of policies

### 5. Unit Tester (`unit-tester/`)
- **Purpose**: Validate rule correctness with test cases
- **Tools**:
  - `generate-test-cases`: Create comprehensive test cases
  - `run-policy-tests`: Execute tests against policies
  - `analyze-test-coverage`: Analyze test coverage

### 6. Policy Explainer (`policy-explainer/`)
- **Purpose**: Translate rules to plain English
- **Tools**:
  - `explain-policy-logic`: Explain how policies work
  - `explain-policy-changes`: Explain changes between policy versions
  - `generate-usage-examples`: Create usage examples

### 7. Deployment Helper (`deployment-helper/`)
- **Purpose**: Assist with OPA integration and deployment
- **Tools**:
  - `generate-opa-deployment-config`: Create deployment configurations
  - `generate-integration-guide`: Create integration documentation
  - `analyze-deployment-needs`: Analyze deployment requirements

## Running MCP Servers

Each server is a standalone Node.js application that implements the MCP protocol. They can be started individually or managed by the main agent system.

### Development
```bash
cd mcp-servers/[server-name]
npm install
npm start
```

### Production
The servers are automatically managed by the OPA Policy Agent system in the Lambda environment.

## Adding New Servers

1. Create a new directory under `mcp-servers/`
2. Implement the MCP server interface
3. Add tools following the established patterns
4. Update the agent configuration to include the new server
5. Test integration with the main agent system

## Tool Interface Standards

All tools should follow these conventions:

### Input Format
```json
{
  "context": {
    "conversationHistory": [...],
    "policyContext": {...},
    "availableTools": [...]
  },
  "previousResults": {...},
  // Tool-specific parameters
}
```

### Output Format
```json
{
  "success": true,
  "result": {
    // Tool-specific results
  },
  "metadata": {
    "tool_name": "...",
    "execution_time": "...",
    "version": "..."
  },
  "errors": []
}
```

## Error Handling

All tools should implement robust error handling and provide meaningful error messages that can be used by the agent for recovery or alternative approaches.
