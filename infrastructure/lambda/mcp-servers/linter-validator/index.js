#!/usr/bin/env node

/**
 * Linter/Validator MCP Server
 * Validates Rego syntax and checks best practices
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const OpenAI = require('openai');

class LinterValidatorServer {
    constructor() {
        this.server = new Server(
            {
                name: 'opa-linter-validator',
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
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;

            switch (name) {
                case 'validate-rego-syntax':
                    return await this.validateRegoSyntax(args);
                case 'check-rego-best-practices':
                    return await this.checkBestPractices(args);
                case 'analyze-policy-security':
                    return await this.analyzePolicySecurity(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });

        this.server.setRequestHandler('tools/list', async () => {
            return {
                tools: [
                    {
                        name: 'validate-rego-syntax',
                        description: 'Validate Rego policy syntax and structure',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                policy: {
                                    type: 'string',
                                    description: 'Rego policy code to validate'
                                },
                                strictMode: {
                                    type: 'boolean',
                                    description: 'Enable strict validation mode'
                                },
                                checkBestPractices: {
                                    type: 'boolean',
                                    description: 'Include best practices validation'
                                }
                            },
                            required: ['policy']
                        }
                    },
                    {
                        name: 'check-rego-best-practices',
                        description: 'Check Rego policy against best practices',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                policy: {
                                    type: 'string',
                                    description: 'Rego policy code to check'
                                },
                                includeSecurityChecks: {
                                    type: 'boolean',
                                    description: 'Include security-related checks'
                                },
                                includePerformanceChecks: {
                                    type: 'boolean',
                                    description: 'Include performance-related checks'
                                }
                            },
                            required: ['policy']
                        }
                    },
                    {
                        name: 'analyze-policy-security',
                        description: 'Analyze policy for security vulnerabilities and issues',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                policy: {
                                    type: 'string',
                                    description: 'Rego policy code to analyze'
                                },
                                checkForVulnerabilities: {
                                    type: 'boolean',
                                    description: 'Check for common security vulnerabilities'
                                },
                                checkForBypass: {
                                    type: 'boolean',
                                    description: 'Check for potential bypass scenarios'
                                }
                            },
                            required: ['policy']
                        }
                    }
                ]
            };
        });
    }

    async validateRegoSyntax(args) {
        try {
            const { policy, strictMode = false, checkBestPractices = false } = args;

            // Basic syntax validation
            const syntaxIssues = this.performBasicSyntaxCheck(policy);
            
            // Use OpenAI for advanced validation
            const systemPrompt = `You are an expert OPA Rego validator. Analyze the provided Rego policy for syntax errors, structural issues, and correctness.

VALIDATION CRITERIA:
- Syntax correctness
- Package declaration
- Rule structure
- Variable usage
- Logic consistency
- Import statement issues (flag if present - they shouldn't be)

${strictMode ? 'Use STRICT validation mode - flag even minor issues.' : 'Use standard validation mode.'}
${checkBestPractices ? 'Also check against OPA best practices.' : ''}

Return a JSON object with:
{
  "valid": boolean,
  "issues": [
    {
      "type": "error|warning|info",
      "message": "description",
      "line": number (if applicable),
      "suggestion": "how to fix"
    }
  ],
  "score": number (0-100),
  "summary": "overall assessment"
}`;

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Validate this Rego policy:\n\n${policy}` }
                ],
                temperature: 0.1,
                max_tokens: 1500
            });

            const response = completion.choices[0]?.message?.content;
            let validationResult;

            try {
                validationResult = JSON.parse(response);
            } catch (parseError) {
                // Fallback validation result
                validationResult = {
                    valid: syntaxIssues.length === 0,
                    issues: syntaxIssues,
                    score: syntaxIssues.length === 0 ? 85 : 60,
                    summary: 'Basic validation completed'
                };
            }

            // Combine with basic syntax issues
            validationResult.issues = [...syntaxIssues, ...(validationResult.issues || [])];
            validationResult.valid = validationResult.valid && syntaxIssues.length === 0;

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: validationResult,
                        metadata: {
                            tool_name: 'validate-rego-syntax',
                            execution_time: new Date().toISOString(),
                            validation_mode: strictMode ? 'strict' : 'standard'
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            console.error('Error validating Rego syntax:', error);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        metadata: {
                            tool_name: 'validate-rego-syntax',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };
        }
    }

    async checkBestPractices(args) {
        try {
            const { policy, includeSecurityChecks = true, includePerformanceChecks = true } = args;

            const systemPrompt = `You are an expert OPA consultant. Analyze the Rego policy against OPA best practices and provide recommendations.

CHECK FOR:
- Package naming conventions
- Rule organization and structure
- Default rule usage (default allow := false)
- Variable naming and scoping
- Code reusability and modularity
- Documentation and comments
${includeSecurityChecks ? '- Security best practices and potential vulnerabilities' : ''}
${includePerformanceChecks ? '- Performance optimization opportunities' : ''}

Return a JSON object with:
{
  "overall_score": number (0-100),
  "categories": {
    "structure": {"score": number, "issues": [...], "recommendations": [...]},
    "naming": {"score": number, "issues": [...], "recommendations": [...]},
    "security": {"score": number, "issues": [...], "recommendations": [...]},
    "performance": {"score": number, "issues": [...], "recommendations": [...]},
    "documentation": {"score": number, "issues": [...], "recommendations": [...]}
  },
  "summary": "overall assessment",
  "priority_fixes": ["most important issues to address"]
}`;

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Analyze this Rego policy for best practices:\n\n${policy}` }
                ],
                temperature: 0.1,
                max_tokens: 2000
            });

            const response = completion.choices[0]?.message?.content;
            let bestPracticesResult;

            try {
                bestPracticesResult = JSON.parse(response);
            } catch (parseError) {
                // Fallback result
                bestPracticesResult = this.generateFallbackBestPracticesResult(policy);
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: bestPracticesResult,
                        metadata: {
                            tool_name: 'check-rego-best-practices',
                            execution_time: new Date().toISOString(),
                            checks_included: {
                                security: includeSecurityChecks,
                                performance: includePerformanceChecks
                            }
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            console.error('Error checking best practices:', error);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        metadata: {
                            tool_name: 'check-rego-best-practices',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };
        }
    }

    async analyzePolicySecurity(args) {
        try {
            const { policy, checkForVulnerabilities = true, checkForBypass = true } = args;

            const systemPrompt = `You are a security expert specializing in OPA policy analysis. Analyze the Rego policy for security vulnerabilities and potential bypass scenarios.

SECURITY ANALYSIS FOCUS:
- Authorization bypass opportunities
- Input validation weaknesses
- Logic flaws that could be exploited
- Default behavior security implications
- Privilege escalation risks
${checkForVulnerabilities ? '- Common OPA security vulnerabilities' : ''}
${checkForBypass ? '- Potential bypass scenarios and attack vectors' : ''}

Return a JSON object with:
{
  "security_score": number (0-100),
  "risk_level": "low|medium|high|critical",
  "vulnerabilities": [
    {
      "type": "vulnerability type",
      "severity": "low|medium|high|critical",
      "description": "detailed description",
      "impact": "potential impact",
      "mitigation": "how to fix",
      "line_reference": "line number if applicable"
    }
  ],
  "bypass_scenarios": [
    {
      "scenario": "description of bypass",
      "likelihood": "low|medium|high",
      "impact": "potential impact",
      "prevention": "how to prevent"
    }
  ],
  "recommendations": ["security improvement suggestions"],
  "compliance_notes": "any compliance considerations"
}`;

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Perform security analysis on this Rego policy:\n\n${policy}` }
                ],
                temperature: 0.1,
                max_tokens: 2000
            });

            const response = completion.choices[0]?.message?.content;
            let securityResult;

            try {
                securityResult = JSON.parse(response);
            } catch (parseError) {
                // Fallback security analysis
                securityResult = this.generateFallbackSecurityResult(policy);
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        result: securityResult,
                        metadata: {
                            tool_name: 'analyze-policy-security',
                            execution_time: new Date().toISOString(),
                            analysis_scope: {
                                vulnerabilities: checkForVulnerabilities,
                                bypass_scenarios: checkForBypass
                            }
                        }
                    }, null, 2)
                }]
            };

        } catch (error) {
            console.error('Error analyzing policy security:', error);
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        metadata: {
                            tool_name: 'analyze-policy-security',
                            execution_time: new Date().toISOString()
                        }
                    }, null, 2)
                }]
            };
        }
    }

    performBasicSyntaxCheck(policy) {
        const issues = [];

        // Check for package declaration
        if (!policy.includes('package ')) {
            issues.push({
                type: 'error',
                message: 'Missing package declaration',
                suggestion: 'Add a package declaration at the top of the policy'
            });
        }

        // Check for import statements (should not be present)
        if (policy.includes('import rego.v1') || policy.includes('import data.rego.v1')) {
            issues.push({
                type: 'warning',
                message: 'Import statements detected',
                suggestion: 'Remove import statements - they are not needed for this use case'
            });
        }

        // Check for basic rule structure
        if (!policy.includes('allow') && !policy.includes('deny')) {
            issues.push({
                type: 'warning',
                message: 'No allow or deny rules found',
                suggestion: 'Consider adding explicit allow or deny rules'
            });
        }

        // Check for unmatched braces
        const openBraces = (policy.match(/{/g) || []).length;
        const closeBraces = (policy.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push({
                type: 'error',
                message: 'Unmatched braces detected',
                suggestion: 'Check for missing opening or closing braces'
            });
        }

        return issues;
    }

    generateFallbackBestPracticesResult(policy) {
        const hasPackage = policy.includes('package ');
        const hasDefaultAllow = policy.includes('default allow');
        const hasComments = policy.includes('#') || policy.includes('//');

        return {
            overall_score: hasPackage && hasDefaultAllow ? 75 : 60,
            categories: {
                structure: {
                    score: hasPackage ? 90 : 60,
                    issues: hasPackage ? [] : ['Missing package declaration'],
                    recommendations: hasPackage ? [] : ['Add proper package declaration']
                },
                security: {
                    score: hasDefaultAllow ? 85 : 70,
                    issues: hasDefaultAllow ? [] : ['No default allow rule found'],
                    recommendations: hasDefaultAllow ? [] : ['Add default allow := false for security']
                },
                documentation: {
                    score: hasComments ? 80 : 50,
                    issues: hasComments ? [] : ['Limited documentation'],
                    recommendations: hasComments ? [] : ['Add more comments explaining policy logic']
                }
            },
            summary: 'Basic best practices analysis completed',
            priority_fixes: hasPackage && hasDefaultAllow ? [] : ['Add package declaration', 'Add default allow rule']
        };
    }

    generateFallbackSecurityResult(policy) {
        const hasDefaultDeny = policy.includes('default allow := false');
        const hasInputValidation = policy.includes('input.');

        return {
            security_score: hasDefaultDeny ? 80 : 60,
            risk_level: hasDefaultDeny ? 'low' : 'medium',
            vulnerabilities: hasDefaultDeny ? [] : [
                {
                    type: 'missing_default_deny',
                    severity: 'medium',
                    description: 'No default deny rule found',
                    impact: 'May allow unintended access',
                    mitigation: 'Add default allow := false'
                }
            ],
            bypass_scenarios: [],
            recommendations: hasDefaultDeny ? ['Policy appears secure'] : ['Add default deny rule', 'Validate all inputs'],
            compliance_notes: 'Basic security analysis completed'
        };
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Linter/Validator MCP server running on stdio');
    }
}

// Start the server
if (require.main === module) {
    const server = new LinterValidatorServer();
    server.run().catch(console.error);
}

module.exports = { LinterValidatorServer };
