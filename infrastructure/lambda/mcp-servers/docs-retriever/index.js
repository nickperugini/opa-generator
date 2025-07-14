#!/usr/bin/env node

/**
 * Docs Retriever MCP Server
 * Gathers OPA documentation, examples, and best practices
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class DocsRetrieverServer {
    constructor() {
        this.server = new Server(
            {
                name: 'opa-docs-retriever',
                version: '1.0.0'
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        this.setupTools();
    }

    setupTools() {
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;

            switch (name) {
                case 'gather-opa-docs':
                    return await this.gatherOpaDocs(args);
                case 'get-best-practices':
                    return await this.getBestPractices(args);
                case 'find-examples':
                    return await this.findExamples(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });

        this.server.setRequestHandler('tools/list', async () => {
            return {
                tools: [
                    {
                        name: 'gather-opa-docs',
                        description: 'Search and retrieve relevant OPA documentation',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'Search query for documentation' },
                                includeExamples: { type: 'boolean', description: 'Include code examples' },
                                includeBestPractices: { type: 'boolean', description: 'Include best practices' }
                            },
                            required: ['query']
                        }
                    },
                    {
                        name: 'get-best-practices',
                        description: 'Get OPA best practices for specific scenarios',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                scenario: { type: 'string', description: 'Specific scenario or use case' },
                                category: { type: 'string', description: 'Category of best practices' }
                            },
                            required: ['scenario']
                        }
                    },
                    {
                        name: 'find-examples',
                        description: 'Find code examples matching requirements',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                requirements: { type: 'string', description: 'Requirements to match' },
                                complexity: { type: 'string', description: 'Complexity level needed' }
                            },
                            required: ['requirements']
                        }
                    }
                ]
            };
        });
    }

    async gatherOpaDocs(args) {
        try {
            const { query, includeExamples = false, includeBestPractices = false } = args;

            // Simulated documentation retrieval
            const docs = {
                content: `OPA Documentation for: ${query}

Basic Rego Syntax:
- package: Defines the namespace for the policy
- default: Sets default values for rules
- allow/deny: Common rule patterns for authorization
- input: Access to input data provided to OPA

${includeExamples ? `
Examples:
package example.authz
default allow := false
allow if {
    input.user.role == "admin"
}
` : ''}

${includeBestPractices ? `
Best Practices:
- Always use 'default allow := false' for security
- Use meaningful package names
- Validate input data structure
- Write comprehensive tests
` : ''}`,
                sources: ['https://www.openpolicyagent.org/docs/latest/'],
                relevance_score: 0.9
            };

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: docs,
                        metadata: {
                            tool_name: 'gather-opa-docs',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        metadata: {
                            tool_name: 'gather-opa-docs',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };
        }
    }

    async getBestPractices(args) {
        try {
            const { scenario, category = 'general' } = args;

            const bestPractices = {
                scenario,
                category,
                practices: [
                    'Use default deny (default allow := false) for security',
                    'Validate input structure before processing',
                    'Use meaningful variable and rule names',
                    'Write comprehensive test cases',
                    'Document complex logic with comments',
                    'Avoid deep nesting in rules',
                    'Use helper functions for reusable logic'
                ],
                examples: [
                    {
                        practice: 'Default deny pattern',
                        code: 'package example\ndefault allow := false\nallow if {\n    # specific conditions\n}'
                    }
                ]
            };

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: bestPractices,
                        metadata: {
                            tool_name: 'get-best-practices',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        metadata: {
                            tool_name: 'get-best-practices',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };
        }
    }

    async findExamples(args) {
        try {
            const { requirements, complexity = 'basic' } = args;

            const examples = [
                {
                    title: 'Role-based Access Control',
                    description: 'Basic RBAC policy example',
                    code: `package rbac.authz

default allow := false

allow if {
    input.user.role == "admin"
}

allow if {
    input.user.role == "user"
    input.action == "read"
}`,
                    complexity: 'basic',
                    use_case: 'authorization'
                },
                {
                    title: 'Time-based Access',
                    description: 'Policy with time restrictions',
                    code: `package time.authz

import rego.v1

default allow := false

allow if {
    input.user.role == "employee"
    is_business_hours
}

is_business_hours if {
    hour := time.clock(time.now_ns())[0]
    hour >= 9
    hour < 17
}`,
                    complexity: 'intermediate',
                    use_case: 'time-based-access'
                }
            ];

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: {
                            examples: examples.filter(ex => 
                                ex.complexity === complexity || complexity === 'all'
                            ),
                            total_found: examples.length
                        },
                        metadata: {
                            tool_name: 'find-examples',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        metadata: {
                            tool_name: 'find-examples',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };
        }
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Docs Retriever MCP server running on stdio');
    }
}

// Start the server
if (require.main === module) {
    const server = new DocsRetrieverServer();
    server.run().catch(console.error);
}

module.exports = { DocsRetrieverServer };
