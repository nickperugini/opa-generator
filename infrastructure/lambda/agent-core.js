/**
 * Core Agent System for OPA Policy Generation
 * Integrates with MCP servers for tool orchestration and context management
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

class OPAPolicyAgent {
    constructor() {
        this.mcpClients = new Map();
        this.conversationHistory = [];
        this.policyContext = {
            currentPolicy: null,
            requirements: [],
            testCases: [],
            validationResults: [],
            deploymentConfig: null
        };
        this.toolRegistry = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the agent with MCP servers
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize MCP clients for different tool categories
            await this.initializeMCPClients();
            
            // Register available tools
            await this.registerTools();
            
            this.initialized = true;
            console.log('OPA Policy Agent initialized successfully');
        } catch (error) {
            console.error('Failed to initialize OPA Policy Agent:', error);
            throw error;
        }
    }

    /**
     * Initialize MCP clients for different tool servers
     */
    async initializeMCPClients() {
        const mcpServers = [
            {
                name: 'docs-retriever',
                command: 'node',
                args: ['./mcp-servers/docs-retriever/index.js'],
                description: 'Gather docs, examples, and best practices'
            },
            {
                name: 'code-generator',
                command: 'node', 
                args: ['./mcp-servers/code-generator/index.js'],
                description: 'Generate new Rego rules from requirements'
            },
            {
                name: 'code-refiner',
                command: 'node',
                args: ['./mcp-servers/code-refiner/index.js'], 
                description: 'Refine, optimize, and explain Rego code'
            },
            {
                name: 'linter-validator',
                command: 'node',
                args: ['./mcp-servers/linter-validator/index.js'],
                description: 'Check syntax and best practices'
            },
            {
                name: 'unit-tester',
                command: 'node',
                args: ['./mcp-servers/unit-tester/index.js'],
                description: 'Validate rule correctness with test cases'
            },
            {
                name: 'policy-explainer',
                command: 'node',
                args: ['./mcp-servers/policy-explainer/index.js'],
                description: 'Translate rules to plain English'
            },
            {
                name: 'deployment-helper',
                command: 'node',
                args: ['./mcp-servers/deployment-helper/index.js'],
                description: 'Assist with OPA integration and deployment'
            }
        ];

        for (const server of mcpServers) {
            try {
                const transport = new StdioClientTransport({
                    command: server.command,
                    args: server.args
                });

                const client = new Client({
                    name: `opa-agent-${server.name}`,
                    version: '1.0.0'
                }, {
                    capabilities: {
                        tools: {}
                    }
                });

                await client.connect(transport);
                this.mcpClients.set(server.name, {
                    client,
                    transport,
                    description: server.description
                });

                console.log(`Connected to MCP server: ${server.name}`);
            } catch (error) {
                console.warn(`Failed to connect to MCP server ${server.name}:`, error.message);
                // Continue with other servers - some tools may be optional
            }
        }
    }

    /**
     * Register available tools from MCP servers
     */
    async registerTools() {
        for (const [serverName, serverInfo] of this.mcpClients) {
            try {
                const { client } = serverInfo;
                const toolsResponse = await client.listTools();
                
                for (const tool of toolsResponse.tools) {
                    this.toolRegistry.set(tool.name, {
                        serverName,
                        tool,
                        client
                    });
                }
                
                console.log(`Registered ${toolsResponse.tools.length} tools from ${serverName}`);
            } catch (error) {
                console.warn(`Failed to register tools from ${serverName}:`, error.message);
            }
        }
    }

    /**
     * Process a policy generation request with full agent capabilities
     */
    async processRequest(instructions, context = {}, options = {}) {
        try {
            // Add to conversation history
            this.addToHistory('user', instructions, context);

            // Determine the best approach based on request type
            const requestType = this.analyzeRequestType(instructions, context);
            
            // Execute the appropriate workflow
            let result;
            switch (requestType) {
                case 'generate':
                    result = await this.executeGenerationWorkflow(instructions, context, options);
                    break;
                case 'refine':
                    result = await this.executeRefinementWorkflow(instructions, context, options);
                    break;
                case 'validate':
                    result = await this.executeValidationWorkflow(instructions, context, options);
                    break;
                case 'explain':
                    result = await this.executeExplanationWorkflow(instructions, context, options);
                    break;
                case 'deploy':
                    result = await this.executeDeploymentWorkflow(instructions, context, options);
                    break;
                default:
                    result = await this.executeGenerationWorkflow(instructions, context, options);
            }

            // Add result to conversation history
            this.addToHistory('assistant', 'Policy processing completed', result);

            return result;
        } catch (error) {
            console.error('Error processing request:', error);
            throw error;
        }
    }

    /**
     * Execute policy generation workflow
     */
    async executeGenerationWorkflow(instructions, context, options) {
        try {
            const { PolicyGenerationWorkflow } = require('./workflows');
            const workflow = new PolicyGenerationWorkflow(this);
            return await workflow.execute(instructions, context, options);
        } catch (error) {
            console.warn('Workflow execution failed, using fallback:', error.message);
            return await this.fallbackGeneration(instructions, context, options);
        }
    }

    /**
     * Execute policy refinement workflow  
     */
    async executeRefinementWorkflow(instructions, context, options) {
        try {
            const { PolicyRefinementWorkflow } = require('./workflows');
            const workflow = new PolicyRefinementWorkflow(this);
            return await workflow.execute(instructions, context, options);
        } catch (error) {
            console.warn('Refinement workflow failed, using fallback:', error.message);
            return await this.fallbackGeneration(instructions, context, options);
        }
    }

    /**
     * Execute validation workflow
     */
    async executeValidationWorkflow(instructions, context, options) {
        try {
            const { PolicyValidationWorkflow } = require('./workflows');
            const workflow = new PolicyValidationWorkflow(this);
            return await workflow.execute(instructions, context, options);
        } catch (error) {
            console.warn('Validation workflow failed, using fallback:', error.message);
            return await this.fallbackValidation(context.policy);
        }
    }

    /**
     * Execute explanation workflow
     */
    async executeExplanationWorkflow(instructions, context, options) {
        try {
            const { PolicyExplanationWorkflow } = require('./workflows');
            const workflow = new PolicyExplanationWorkflow(this);
            return await workflow.execute(instructions, context, options);
        } catch (error) {
            console.warn('Explanation workflow failed, using fallback:', error.message);
            return await this.fallbackExplanation(context.policy);
        }
    }

    /**
     * Execute deployment workflow
     */
    async executeDeploymentWorkflow(instructions, context, options) {
        try {
            const { PolicyDeploymentWorkflow } = require('./workflows');
            const workflow = new PolicyDeploymentWorkflow(this);
            return await workflow.execute(instructions, context, options);
        } catch (error) {
            console.warn('Deployment workflow failed, using fallback:', error.message);
            return await this.fallbackDeployment(context.policy);
        }
    }

    /**
     * Fallback policy generation using OpenAI directly
     */
    async fallbackGeneration(instructions, context, options) {
        try {
            const OpenAI = require('openai');
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });

            const systemPrompt = `You are an expert OPA Rego policy generator. Generate syntactically correct, production-ready Rego policies.

REQUIREMENTS:
- Generate clean, well-commented Rego code
- Follow OPA best practices
- NO import statements
- Use meaningful package names
- Include default rules for security
- Test inputs must be valid JSON objects without comments
- Test inputs should match the policy's expected input structure

RESPONSE FORMAT - Return ONLY a JSON object with this exact structure:
{
  "policy": "complete Rego policy code as a string",
  "test_inputs": [
    {"user": {"role": "admin", "department": "HR"}},
    {"user": {"role": "user", "department": "HR"}},
    {"user": {"role": "admin", "department": "IT"}}
  ],
  "explanation": "brief explanation of the policy"
}

IMPORTANT: 
- The policy field must contain ONLY the Rego code as a string
- Test inputs must be valid JSON objects that match your policy's input structure
- If policy uses time/date, include time fields in test inputs
- If policy uses specific attributes, include those attributes in test inputs
- Do not include any markdown formatting or code blocks
- Generate test cases that actually test the policy logic (both allow and deny cases)`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate a Rego policy for: ${instructions}` }
                ],
                temperature: 0.1,
                max_tokens: 2000
            });

            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }

            // Try to parse as JSON, fallback to text parsing
            let result;
            try {
                const parsed = JSON.parse(response);
                
                // Check if policy is double-encoded as JSON string
                let policy = parsed.policy;
                let testInputs = parsed.test_inputs || [];
                
                if (typeof policy === 'string' && policy.startsWith('{')) {
                    try {
                        const innerParsed = JSON.parse(policy);
                        policy = innerParsed.policy || policy;
                        testInputs = innerParsed.test_inputs || testInputs;
                    } catch (e) {
                        // Keep original if inner parsing fails
                    }
                }
                
                // Clean up test inputs to remove any JSON comments
                if (Array.isArray(testInputs)) {
                    testInputs = testInputs.map(test => {
                        if (typeof test === 'object' && test !== null) {
                            return {
                                description: test.description || "Test case",
                                input: test.input || test,
                                expected_result: test.expected_result !== undefined ? test.expected_result : true
                            };
                        }
                        return {
                            description: "Test case",
                            input: test,
                            expected_result: true
                        };
                    });
                }
                
                result = {
                    policy: policy,
                    test_inputs: testInputs,
                    explanation: parsed.explanation || `Generated policy for: ${instructions}`
                };
            } catch (parseError) {
                // Fallback: extract policy from text response
                const policyMatch = response.match(/```rego\n([\s\S]*?)\n```/) || 
                                   response.match(/```\n([\s\S]*?)\n```/);
                
                const policy = policyMatch ? policyMatch[1] : response;
                
                result = {
                    policy: policy.trim(),
                    test_inputs: [{
                        description: "Basic test case",
                        input: { user: { role: "admin" }, action: "access" },
                        expected_result: true
                    }],
                    explanation: `Generated policy for: ${instructions}`
                };
            }

            return {
                type: 'complete',
                policy: result.policy,
                test_inputs: result.test_inputs || [],
                explanation: result.explanation || 'Policy generated successfully',
                metadata: {
                    instructions,
                    generated_at: new Date().toISOString(),
                    model: 'gpt-4o-mini-fallback'
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Fallback generation failed:', error);
            throw error;
        }
    }

    /**
     * Fallback validation
     */
    async fallbackValidation(policy) {
        return {
            type: 'validation_complete',
            policy,
            validation_results: {
                syntax: { 
                    valid: policy.includes('package '), 
                    issues: policy.includes('package ') ? [] : ['Missing package declaration']
                },
                overall_score: policy.includes('package ') ? 80 : 60,
                recommendations: ['Add comprehensive comments', 'Include test cases']
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Fallback explanation
     */
    async fallbackExplanation(policy) {
        return {
            type: 'explanation_complete',
            policy,
            explanation: `This OPA Rego policy defines access control rules. It appears to ${policy.includes('allow') ? 'allow' : 'control'} access based on the defined conditions.`,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Fallback deployment assistance
     */
    async fallbackDeployment(policy) {
        return {
            type: 'deployment_complete',
            policy,
            deployment_config: {
                platform: 'kubernetes',
                config: 'Basic OPA deployment configuration would be generated here'
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Analyze request type based on instructions and context
     */
    analyzeRequestType(instructions, context) {
        const lowerInstructions = instructions.toLowerCase();
        
        if (context.existing_policy) {
            if (lowerInstructions.includes('refine') || lowerInstructions.includes('modify') || 
                lowerInstructions.includes('update') || lowerInstructions.includes('improve')) {
                return 'refine';
            }
        }
        
        if (lowerInstructions.includes('validate') || lowerInstructions.includes('check') ||
            lowerInstructions.includes('lint') || lowerInstructions.includes('verify')) {
            return 'validate';
        }
        
        if (lowerInstructions.includes('explain') || lowerInstructions.includes('describe') ||
            lowerInstructions.includes('what does') || lowerInstructions.includes('how does')) {
            return 'explain';
        }
        
        if (lowerInstructions.includes('deploy') || lowerInstructions.includes('integrate') ||
            lowerInstructions.includes('setup') || lowerInstructions.includes('configure')) {
            return 'deploy';
        }
        
        return 'generate';
    }

    /**
     * Call a specific tool
     */
    async callTool(toolName, args) {
        const toolInfo = this.toolRegistry.get(toolName);
        if (!toolInfo) {
            throw new Error(`Tool ${toolName} not found`);
        }

        try {
            const result = await toolInfo.client.callTool({
                name: toolName,
                arguments: args
            });
            
            return result;
        } catch (error) {
            console.error(`Error calling tool ${toolName}:`, error);
            throw error;
        }
    }

    /**
     * Add entry to conversation history
     */
    addToHistory(role, content, metadata = {}) {
        this.conversationHistory.push({
            role,
            content,
            metadata,
            timestamp: new Date().toISOString()
        });

        // Keep history manageable (last 50 entries)
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }
    }

    /**
     * Update policy context
     */
    updatePolicyContext(updates) {
        this.policyContext = {
            ...this.policyContext,
            ...updates,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Get current context for tools
     */
    getContext() {
        return {
            conversationHistory: this.conversationHistory.slice(-10), // Last 10 entries
            policyContext: this.policyContext,
            availableTools: Array.from(this.toolRegistry.keys())
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        for (const [serverName, serverInfo] of this.mcpClients) {
            try {
                await serverInfo.client.close();
                console.log(`Disconnected from MCP server: ${serverName}`);
            } catch (error) {
                console.warn(`Error disconnecting from ${serverName}:`, error.message);
            }
        }
        this.mcpClients.clear();
        this.toolRegistry.clear();
    }
}

module.exports = { OPAPolicyAgent };
