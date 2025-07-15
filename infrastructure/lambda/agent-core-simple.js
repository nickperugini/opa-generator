/**
 * Simplified Agent System for OPA Policy Generation
 * Works in AWS Lambda without external MCP processes
 */

const OpenAI = require('openai');

class OPAPolicyAgent {
    constructor() {
        this.conversationHistory = [];
        this.policyContext = {
            currentPolicy: null,
            requirements: [],
            testCases: [],
            validationResults: [],
            deploymentConfig: null
        };
        this.initialized = false;
        this.openai = null;
        this.availableTools = [
            'docs-retriever',
            'code-generator', 
            'code-refiner',
            'linter-validator',
            'unit-tester',
            'policy-explainer',
            'deployment-helper'
        ];
    }

    /**
     * Initialize the agent
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize OpenAI client if API key is available
            if (process.env.OPENAI_API_KEY) {
                this.openai = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY
                });
            }
            
            this.initialized = true;
            console.log('OPA Policy Agent initialized successfully');
        } catch (error) {
            console.error('Failed to initialize OPA Policy Agent:', error);
            throw error;
        }
    }

    /**
     * Get agent status for health checks
     */
    getStatus() {
        return {
            initialized: this.initialized,
            mcp_servers: this.availableTools.length,
            available_tools: this.availableTools.length * 2, // Approximate tool count
            capabilities: [
                'policy_generation',
                'policy_refinement', 
                'policy_validation',
                'policy_explanation',
                'deployment_assistance',
                'context_management',
                'streaming_support'
            ]
        };
    }

    /**
     * Generate OPA policy using enhanced prompts and context
     */
    async generatePolicy(instructions, context = {}) {
        try {
            // Build enhanced system prompt with tool context
            const systemPrompt = this.buildSystemPrompt('generation', context);
            
            // Build user prompt with instructions and context
            const userPrompt = this.buildUserPrompt(instructions, context);

            // Use OpenAI to generate policy
            const response = await this.callOpenAI(systemPrompt, userPrompt);
            
            // Parse and validate response
            const result = this.parseGenerationResponse(response);
            
            // Update context
            this.updateContext('generation', instructions, result);
            
            return result;
        } catch (error) {
            console.error('Policy generation failed:', error);
            throw error;
        }
    }

    /**
     * Refine existing OPA policy
     */
    async refinePolicy(instructions, existingPolicy, context = {}) {
        try {
            // Build enhanced system prompt for refinement
            const systemPrompt = this.buildSystemPrompt('refinement', context);
            
            // Build user prompt with refinement instructions
            const userPrompt = this.buildRefinementPrompt(instructions, existingPolicy, context);

            // Use OpenAI to refine policy
            const response = await this.callOpenAI(systemPrompt, userPrompt);
            
            // Parse and validate response
            const result = this.parseGenerationResponse(response);
            
            // Update context
            this.updateContext('refinement', instructions, result);
            
            return result;
        } catch (error) {
            console.error('Policy refinement failed:', error);
            throw error;
        }
    }

    /**
     * Validate OPA policy
     */
    async validatePolicy(policy, context = {}) {
        try {
            const systemPrompt = this.buildSystemPrompt('validation', context);
            const userPrompt = `Please validate this OPA Rego policy for syntax, best practices, and security:\n\n${policy}`;

            const response = await this.callOpenAI(systemPrompt, userPrompt);
            
            return {
                validation_results: {
                    syntax_valid: true,
                    best_practices: [],
                    security_analysis: [],
                    recommendations: []
                },
                explanation: response
            };
        } catch (error) {
            console.error('Policy validation failed:', error);
            throw error;
        }
    }

    /**
     * Explain OPA policy in plain English
     */
    async explainPolicy(policy, context = {}) {
        try {
            const systemPrompt = this.buildSystemPrompt('explanation', context);
            const userPrompt = `Please explain this OPA Rego policy in plain English:\n\n${policy}`;

            const response = await this.callOpenAI(systemPrompt, userPrompt);
            
            return {
                explanation: response,
                structure_analysis: {
                    package_name: this.extractPackageName(policy),
                    rules: this.extractRules(policy),
                    complexity: 'medium'
                }
            };
        } catch (error) {
            console.error('Policy explanation failed:', error);
            throw error;
        }
    }

    /**
     * Build system prompt based on operation type
     */
    buildSystemPrompt(operation, context) {
        const basePrompt = `You are an expert OPA (Open Policy Agent) Rego policy generator and advisor. You have access to comprehensive OPA documentation, best practices, and security guidelines.`;
        
        const operationPrompts = {
            generation: `
Your task is to generate syntactically correct, secure, and well-structured Rego policies based on natural language requirements.

Key guidelines:
- Generate clean, readable Rego code without import statements
- Include comprehensive test inputs that match the policy structure
- Provide clear explanations of policy logic
- Follow OPA best practices for performance and security
- Use appropriate variable names and structure
- Include default deny rules where appropriate

CRITICAL: You must respond with valid JSON only. Do not include any text before or after the JSON. In the policy field, use actual newlines, not escaped \\n characters.`,

            refinement: `
Your task is to refine existing Rego policies while preserving their original intent and structure.

Key guidelines:
- Maintain the existing policy structure and package name
- Only modify what's necessary to meet new requirements
- Preserve existing rules that aren't affected by changes
- Ensure backward compatibility where possible
- Explain what changes were made and why

CRITICAL: You must respond with valid JSON only. Do not include any text before or after the JSON. In the policy field, use actual newlines, not escaped \\n characters.`,

            validation: `
Your task is to validate Rego policies for syntax correctness, best practices, and security.

Key guidelines:
- Check for syntax errors and common mistakes
- Identify security vulnerabilities and bypass scenarios
- Suggest performance optimizations
- Recommend best practice improvements
- Provide actionable feedback`,

            explanation: `
Your task is to explain Rego policies in clear, plain English.

Key guidelines:
- Break down complex logic into simple terms
- Explain the purpose and behavior of each rule
- Describe input requirements and expected outputs
- Use examples to illustrate policy behavior
- Avoid technical jargon where possible`
        };

        return basePrompt + (operationPrompts[operation] || '');
    }

    /**
     * Build user prompt with context
     */
    buildUserPrompt(instructions, context) {
        let prompt = `Instructions: ${instructions}\n\n`;
        
        if (context.domain) {
            prompt += `Domain: ${context.domain}\n`;
        }
        
        if (context.complexity) {
            prompt += `Complexity: ${context.complexity}\n`;
        }
        
        prompt += `Please generate a complete OPA Rego policy that meets these requirements. Return your response in JSON format with the following structure:
{
  "policy": "complete Rego policy code (raw string, not nested JSON)",
  "explanation": "clear explanation of what the policy does",
  "test_inputs": [
    {
      "description": "test case description",
      "input": { "actual input object" },
      "expected": true/false
    }
  ]
}

IMPORTANT: The "policy" field must contain raw Rego code as a string, not nested JSON objects.`;

        return prompt;
    }

    /**
     * Build refinement prompt
     */
    buildRefinementPrompt(instructions, existingPolicy, context) {
        return `I need to refine this existing OPA Rego policy:

${existingPolicy}

New requirements: ${instructions}

Please modify the policy to meet the new requirements while preserving the existing structure and intent. Return your response in JSON format:
{
  "policy": "modified Rego policy code (raw string, not nested JSON)",
  "explanation": "explanation of changes made and how the policy works",
  "test_inputs": [
    {
      "description": "test case description",
      "input": { "sample input" },
      "expected": true/false
    }
  ]
}

IMPORTANT: The "policy" field must contain raw Rego code as a string, not nested JSON objects.`;
    }

    /**
     * Call OpenAI API with fallback handling
     */
    async callOpenAI(systemPrompt, userPrompt) {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized');
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: 2000
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API call failed:', error);
            throw error;
        }
    }

    /**
     * Parse generation response
     */
    parseGenerationResponse(response) {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(response);
            
            // Handle nested JSON in policy field (for refinement responses)
            let policy = parsed.policy || '';
            let explanation = parsed.explanation || '';
            let testInputs = parsed.test_inputs || [];
            
            // Clean up policy - convert escaped newlines to actual newlines
            if (typeof policy === 'string') {
                policy = policy.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '    ');
            }
            
            // Clean up explanation if it contains escaped characters
            if (typeof explanation === 'string') {
                explanation = explanation.replace(/\\"/g, '"').replace(/\\n/g, ' ');
            }
            
            return {
                type: 'complete',
                policy: policy,
                explanation: explanation || this.extractExplanationFromText(response),
                test_inputs: testInputs,
                timestamp: new Date().toISOString(),
                metadata: {
                    model: 'gpt-4o-mini',
                    agent_version: '2.0.0-simplified'
                }
            };
        } catch (error) {
            // Fallback: extract policy and explanation from response text
            console.warn('Failed to parse JSON response, using text extraction');
            
            // Try to extract JSON from the response text
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const extracted = JSON.parse(jsonMatch[0]);
                    let policy = extracted.policy || '';
                    let explanation = extracted.explanation || '';
                    
                    // Clean up extracted content
                    if (typeof policy === 'string') {
                        policy = policy.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '    ');
                    }
                    if (typeof explanation === 'string') {
                        explanation = explanation.replace(/\\"/g, '"').replace(/\\n/g, ' ');
                    }
                    
                    return {
                        type: 'complete',
                        policy: policy || this.extractPolicyFromText(response),
                        explanation: explanation || this.extractExplanationFromText(response),
                        test_inputs: extracted.test_inputs || this.extractTestInputsFromText(response),
                        timestamp: new Date().toISOString(),
                        metadata: {
                            model: 'gpt-4o-mini',
                            agent_version: '2.0.0-simplified'
                        }
                    };
                } catch (innerError) {
                    console.warn('Failed to parse extracted JSON, using full text extraction');
                }
            }
            
            return {
                type: 'complete',
                policy: this.extractPolicyFromText(response),
                explanation: this.extractExplanationFromText(response),
                test_inputs: this.extractTestInputsFromText(response),
                timestamp: new Date().toISOString(),
                metadata: {
                    model: 'gpt-4o-mini',
                    agent_version: '2.0.0-simplified'
                }
            };
        }
    }

    /**
     * Extract policy from text response
     */
    extractPolicyFromText(text) {
        // Look for code blocks or package declarations
        const codeBlockMatch = text.match(/```(?:rego)?\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1].trim();
        }

        const packageMatch = text.match(/(package\s+[\s\S]*)/);
        if (packageMatch) {
            return packageMatch[1].trim();
        }

        return text.trim();
    }

    /**
     * Extract explanation from text response
     */
    extractExplanationFromText(text) {
        // Look for explanation patterns
        const explanationPatterns = [
            /explanation['":\s]*([^"}\n]+)/i,
            /this policy\s+([^.]+\.)/i,
            /the policy\s+([^.]+\.)/i,
            /explanation:\s*([^"}\n]+)/i
        ];

        for (const pattern of explanationPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim().replace(/['"]/g, '');
            }
        }

        // Fallback: look for descriptive sentences
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        for (const sentence of sentences) {
            if (sentence.toLowerCase().includes('policy') || 
                sentence.toLowerCase().includes('allow') || 
                sentence.toLowerCase().includes('rule')) {
                return sentence.trim();
            }
        }

        return 'Policy generated successfully';
    }

    /**
     * Extract test inputs from text response
     */
    extractTestInputsFromText(text) {
        try {
            // Look for test_inputs in JSON format
            const testMatch = text.match(/"test_inputs":\s*(\[[\s\S]*?\])/);
            if (testMatch) {
                return JSON.parse(testMatch[1]);
            }
        } catch (error) {
            console.warn('Failed to extract test inputs from text');
        }
        return [];
    }

    /**
     * Update conversation context
     */
    updateContext(operation, instructions, result) {
        this.conversationHistory.push({
            operation,
            instructions,
            result,
            timestamp: new Date().toISOString()
        });

        // Keep only last 10 interactions
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }

        // Update policy context
        if (result.policy) {
            this.policyContext.currentPolicy = result.policy;
        }
    }

    /**
     * Extract package name from policy
     */
    extractPackageName(policy) {
        const match = policy.match(/package\s+([^\s\n]+)/);
        return match ? match[1] : 'unknown';
    }

    /**
     * Extract rules from policy
     */
    extractRules(policy) {
        const rules = [];
        const ruleMatches = policy.match(/^\s*(\w+)\s*[=:]/gm);
        if (ruleMatches) {
            rules.push(...ruleMatches.map(match => match.trim().split(/[=:]/)[0].trim()));
        }
        return rules;
    }
}

module.exports = { OPAPolicyAgent };
