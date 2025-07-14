#!/usr/bin/env node

/**
 * Code Generator MCP Server
 * Generates new Rego rules from requirements using OpenAI
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const OpenAI = require('openai');

class CodeGeneratorServer {
    constructor() {
        this.server = new Server(
            {
                name: 'opa-code-generator',
                version: '1.0.0'
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.setupTools();
    }

    setupTools() {
        // Tool: Generate complete Rego policy
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;

            switch (name) {
                case 'generate-rego-policy':
                    return await this.generateRegoPolicy(args);
                case 'generate-rule-fragment':
                    return await this.generateRuleFragment(args);
                case 'generate-helper-functions':
                    return await this.generateHelperFunctions(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });

        this.server.setRequestHandler('tools/list', async () => {
            return {
                tools: [
                    {
                        name: 'generate-rego-policy',
                        description: 'Generate a complete Rego policy from natural language requirements',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                instructions: {
                                    type: 'string',
                                    description: 'Natural language description of the policy requirements'
                                },
                                context: {
                                    type: 'object',
                                    description: 'Additional context including documentation and examples'
                                },
                                requirements: {
                                    type: 'object',
                                    properties: {
                                        includeComments: { type: 'boolean' },
                                        generateTests: { type: 'boolean' },
                                        followBestPractices: { type: 'boolean' }
                                    }
                                }
                            },
                            required: ['instructions']
                        }
                    },
                    {
                        name: 'generate-rule-fragment',
                        description: 'Generate specific Rego rule fragments for targeted functionality',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                ruleType: {
                                    type: 'string',
                                    enum: ['allow', 'deny', 'helper', 'validation'],
                                    description: 'Type of rule to generate'
                                },
                                requirements: {
                                    type: 'string',
                                    description: 'Specific requirements for the rule'
                                },
                                existingPolicy: {
                                    type: 'string',
                                    description: 'Existing policy context for integration'
                                }
                            },
                            required: ['ruleType', 'requirements']
                        }
                    },
                    {
                        name: 'generate-helper-functions',
                        description: 'Generate reusable helper functions for common policy patterns',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                functionType: {
                                    type: 'string',
                                    description: 'Type of helper function needed'
                                },
                                requirements: {
                                    type: 'string',
                                    description: 'Requirements for the helper function'
                                },
                                inputStructure: {
                                    type: 'object',
                                    description: 'Expected input data structure'
                                }
                            },
                            required: ['functionType', 'requirements']
                        }
                    }
                ]
            };
        });
    }

    async generateRegoPolicy(args) {
        try {
            const { instructions, context = {}, requirements = {} } = args;

            const systemPrompt = `You are an expert OPA Rego policy generator. Generate syntactically correct, production-ready Rego policies.

REQUIREMENTS:
- Generate clean, well-commented Rego code
- Follow OPA best practices
- NO import statements (import rego.v1 or import data.rego.v1)
- Use meaningful package names
- Include default rules for security
- Generate realistic test cases if requested

RESPONSE FORMAT:
Return a JSON object with:
{
  "policy": "complete Rego policy code",
  "package_name": "suggested package name",
  "test_cases": [...] (if generateTests is true),
  "explanation": "brief explanation of the policy"
}`;

            let userPrompt = `Generate a Rego policy for: ${instructions}`;
            
            if (context.documentation) {
                userPrompt += `\n\nRelevant documentation:\n${context.documentation}`;
            }

            if (requirements.includeComments) {
                userPrompt += '\n\nInclude comprehensive comments explaining the logic.';
            }

            if (requirements.generateTests) {
                userPrompt += '\n\nGenerate test cases that validate the policy behavior.';
            }

            if (requirements.followBestPractices) {
                userPrompt += '\n\nEnsure the policy follows OPA best practices for security and performance.';
            }

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
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
                result = JSON.parse(response);
            } catch (parseError) {
                // Fallback: extract policy from text response
                result = this.parseTextResponse(response, instructions);
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: result,
                        metadata: {
                            tool_name: 'generate-rego-policy',
                            execution_time: new Date().toISOString(),
                            model: 'gpt-4o-mini'
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            console.error('Error generating Rego policy:', error);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        metadata: {
                            tool_name: 'generate-rego-policy',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };
        }
    }

    async generateRuleFragment(args) {
        try {
            const { ruleType, requirements, existingPolicy } = args;

            const systemPrompt = `You are an expert at generating specific Rego rule fragments. Generate clean, focused rule fragments that integrate well with existing policies.

RULE TYPES:
- allow: Permission-granting rules
- deny: Explicit denial rules  
- helper: Reusable helper functions
- validation: Input validation rules

Return only the rule fragment code, properly formatted.`;

            let userPrompt = `Generate a ${ruleType} rule for: ${requirements}`;
            
            if (existingPolicy) {
                userPrompt += `\n\nExisting policy context:\n${existingPolicy}`;
                userPrompt += '\n\nEnsure the new rule integrates properly with the existing policy structure.';
            }

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: 1000
            });

            const ruleCode = completion.choices[0]?.message?.content;
            if (!ruleCode) {
                throw new Error('No response from OpenAI');
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: {
                            rule_code: ruleCode.trim(),
                            rule_type: ruleType,
                            integration_notes: this.generateIntegrationNotes(ruleType, existingPolicy)
                        },
                        metadata: {
                            tool_name: 'generate-rule-fragment',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            console.error('Error generating rule fragment:', error);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        metadata: {
                            tool_name: 'generate-rule-fragment',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };
        }
    }

    async generateHelperFunctions(args) {
        try {
            const { functionType, requirements, inputStructure } = args;

            const systemPrompt = `You are an expert at creating reusable Rego helper functions. Generate clean, efficient helper functions that can be reused across multiple policies.

Focus on:
- Clear function names
- Proper parameter handling
- Comprehensive logic
- Good documentation
- Reusability

Return the helper function code with comments.`;

            let userPrompt = `Generate a helper function for: ${functionType}\nRequirements: ${requirements}`;
            
            if (inputStructure) {
                userPrompt += `\n\nExpected input structure:\n${JSON.stringify(inputStructure, null, 2)}`;
            }

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: 1000
            });

            const functionCode = completion.choices[0]?.message?.content;
            if (!functionCode) {
                throw new Error('No response from OpenAI');
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: {
                            function_code: functionCode.trim(),
                            function_type: functionType,
                            usage_examples: this.generateUsageExamples(functionCode)
                        },
                        metadata: {
                            tool_name: 'generate-helper-functions',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            console.error('Error generating helper functions:', error);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        metadata: {
                            tool_name: 'generate-helper-functions',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };
        }
    }

    parseTextResponse(response, instructions) {
        // Fallback parser for non-JSON responses
        const policyMatch = response.match(/```rego\n([\s\S]*?)\n```/) || 
                           response.match(/```\n([\s\S]*?)\n```/);
        
        const policy = policyMatch ? policyMatch[1] : response;
        
        return {
            policy: policy.trim(),
            package_name: this.extractPackageName(policy) || 'example.policy',
            explanation: `Generated policy for: ${instructions}`
        };
    }

    extractPackageName(policy) {
        const packageMatch = policy.match(/package\s+([^\s\n]+)/);
        return packageMatch ? packageMatch[1] : null;
    }

    generateIntegrationNotes(ruleType, existingPolicy) {
        if (!existingPolicy) {
            return `This ${ruleType} rule can be added to any compatible Rego policy.`;
        }

        return `This ${ruleType} rule is designed to integrate with the provided policy structure. Ensure proper placement within the policy hierarchy.`;
    }

    generateUsageExamples(functionCode) {
        // Extract function name for usage examples
        const functionMatch = functionCode.match(/(\w+)\s*\(/);
        const functionName = functionMatch ? functionMatch[1] : 'helper_function';
        
        return [
            `# Usage in allow rule:`,
            `allow if {`,
            `    ${functionName}(input)`,
            `}`,
            ``,
            `# Usage in conditional:`,
            `some_rule if {`,
            `    ${functionName}(input.user)`,
            `    # additional conditions...`,
            `}`
        ].join('\n');
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Code Generator MCP server running on stdio');
    }
}

// Start the server
if (require.main === module) {
    const server = new CodeGeneratorServer();
    server.run().catch(console.error);
}

module.exports = { CodeGeneratorServer };
