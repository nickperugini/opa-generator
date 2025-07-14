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
        const workflow = new PolicyGenerationWorkflow(this);
        return await workflow.execute(instructions, context, options);
    }

    /**
     * Execute policy refinement workflow  
     */
    async executeRefinementWorkflow(instructions, context, options) {
        const workflow = new PolicyRefinementWorkflow(this);
        return await workflow.execute(instructions, context, options);
    }

    /**
     * Execute validation workflow
     */
    async executeValidationWorkflow(instructions, context, options) {
        const workflow = new PolicyValidationWorkflow(this);
        return await workflow.execute(instructions, context, options);
    }

    /**
     * Execute explanation workflow
     */
    async executeExplanationWorkflow(instructions, context, options) {
        const workflow = new PolicyExplanationWorkflow(this);
        return await workflow.execute(instructions, context, options);
    }

    /**
     * Execute deployment workflow
     */
    async executeDeploymentWorkflow(instructions, context, options) {
        const workflow = new PolicyDeploymentWorkflow(this);
        return await workflow.execute(instructions, context, options);
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
