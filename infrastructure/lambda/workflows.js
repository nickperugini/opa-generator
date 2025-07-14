/**
 * Workflow Orchestration System for OPA Policy Operations
 * Coordinates multiple tools to accomplish complex tasks
 */

class BaseWorkflow {
    constructor(agent) {
        this.agent = agent;
        this.steps = [];
        this.results = {};
    }

    async execute(instructions, context, options) {
        throw new Error('Execute method must be implemented by subclass');
    }

    async executeStep(stepName, toolName, args, options = {}) {
        try {
            console.log(`Executing step: ${stepName} with tool: ${toolName}`);
            
            const result = await this.agent.callTool(toolName, {
                ...args,
                context: this.agent.getContext(),
                previousResults: this.results
            });
            
            this.results[stepName] = result;
            this.steps.push({ stepName, toolName, success: true, timestamp: new Date().toISOString() });
            
            return result;
        } catch (error) {
            console.error(`Step ${stepName} failed:`, error);
            this.steps.push({ stepName, toolName, success: false, error: error.message, timestamp: new Date().toISOString() });
            
            if (!options.continueOnError) {
                throw error;
            }
            return null;
        }
    }
}

class PolicyGenerationWorkflow extends BaseWorkflow {
    async execute(instructions, context, options = {}) {
        try {
            // Step 1: Gather relevant documentation and best practices
            const docsResult = await this.executeStep(
                'gatherDocs',
                'gather-opa-docs',
                {
                    query: instructions,
                    includeExamples: true,
                    includeBestPractices: true
                },
                { continueOnError: true }
            );

            // Step 2: Generate initial policy
            const generationResult = await this.executeStep(
                'generatePolicy',
                'generate-rego-policy',
                {
                    instructions,
                    context: {
                        ...context,
                        documentation: docsResult?.content || null
                    },
                    requirements: {
                        includeComments: true,
                        generateTests: true,
                        followBestPractices: true
                    }
                }
            );

            // Step 3: Validate the generated policy
            const validationResult = await this.executeStep(
                'validatePolicy',
                'validate-rego-syntax',
                {
                    policy: generationResult.policy,
                    checkBestPractices: true,
                    checkSecurity: true
                },
                { continueOnError: true }
            );

            // Step 4: Generate comprehensive test cases
            const testResult = await this.executeStep(
                'generateTests',
                'generate-test-cases',
                {
                    policy: generationResult.policy,
                    instructions,
                    coverageTarget: 'comprehensive',
                    includeEdgeCases: true
                }
            );

            // Step 5: Run tests to validate correctness
            const testValidationResult = await this.executeStep(
                'runTests',
                'run-policy-tests',
                {
                    policy: generationResult.policy,
                    testCases: testResult.testCases
                },
                { continueOnError: true }
            );

            // Step 6: Generate explanation
            const explanationResult = await this.executeStep(
                'explainPolicy',
                'explain-policy-logic',
                {
                    policy: generationResult.policy,
                    context: instructions,
                    includeExamples: true
                }
            );

            // Step 7: Refine policy if validation found issues
            let finalPolicy = generationResult.policy;
            let finalTests = testResult.testCases;
            
            if (validationResult && validationResult.issues && validationResult.issues.length > 0) {
                const refinementResult = await this.executeStep(
                    'refinePolicy',
                    'refine-rego-code',
                    {
                        policy: generationResult.policy,
                        issues: validationResult.issues,
                        instructions: 'Fix validation issues while maintaining functionality'
                    },
                    { continueOnError: true }
                );
                
                if (refinementResult && refinementResult.policy) {
                    finalPolicy = refinementResult.policy;
                    
                    // Re-generate tests for refined policy
                    const refinedTestResult = await this.executeStep(
                        'regenerateTests',
                        'generate-test-cases',
                        {
                            policy: finalPolicy,
                            instructions,
                            coverageTarget: 'comprehensive'
                        },
                        { continueOnError: true }
                    );
                    
                    if (refinedTestResult) {
                        finalTests = refinedTestResult.testCases;
                    }
                }
            }

            // Update agent context
            this.agent.updatePolicyContext({
                currentPolicy: finalPolicy,
                requirements: [instructions],
                testCases: finalTests,
                validationResults: validationResult?.issues || [],
                lastGenerated: new Date().toISOString()
            });

            // Prepare streaming-compatible result
            const result = {
                type: 'complete',
                policy: finalPolicy,
                test_inputs: this.formatTestInputs(finalTests),
                explanation: explanationResult?.explanation || 'Policy generated successfully',
                metadata: {
                    instructions,
                    generated_at: new Date().toISOString(),
                    model: 'mcp-agent',
                    workflow_steps: this.steps,
                    validation_issues: validationResult?.issues || [],
                    test_results: testValidationResult?.results || []
                },
                timestamp: new Date().toISOString()
            };

            return result;
        } catch (error) {
            console.error('Policy generation workflow failed:', error);
            throw error;
        }
    }

    formatTestInputs(testCases) {
        if (!testCases || !Array.isArray(testCases)) {
            return [{
                description: "Basic test case",
                input: { user: { role: "user" }, action: "access" },
                expected_result: false
            }];
        }

        return testCases.map(test => ({
            description: test.description || test.name || 'Test case',
            input: test.input || test.data || {},
            expected_result: test.expected !== undefined ? test.expected : test.expected_result
        }));
    }
}

class PolicyRefinementWorkflow extends BaseWorkflow {
    async execute(instructions, context, options = {}) {
        try {
            const existingPolicy = context.existing_policy;
            if (!existingPolicy) {
                throw new Error('Existing policy required for refinement');
            }

            // Step 1: Analyze existing policy
            const analysisResult = await this.executeStep(
                'analyzePolicy',
                'analyze-policy-structure',
                {
                    policy: existingPolicy,
                    analysisType: 'comprehensive'
                }
            );

            // Step 2: Gather relevant docs for new requirements
            const docsResult = await this.executeStep(
                'gatherDocs',
                'gather-opa-docs',
                {
                    query: instructions,
                    includeExamples: true,
                    context: 'refinement'
                },
                { continueOnError: true }
            );

            // Step 3: Refine the policy
            const refinementResult = await this.executeStep(
                'refinePolicy',
                'refine-rego-code',
                {
                    policy: existingPolicy,
                    instructions,
                    context: {
                        ...context,
                        analysis: analysisResult,
                        documentation: docsResult?.content || null
                    },
                    preserveStructure: true
                }
            );

            // Step 4: Validate refined policy
            const validationResult = await this.executeStep(
                'validateRefinedPolicy',
                'validate-rego-syntax',
                {
                    policy: refinementResult.policy,
                    originalPolicy: existingPolicy,
                    checkBestPractices: true,
                    checkBackwardCompatibility: true
                },
                { continueOnError: true }
            );

            // Step 5: Generate updated test cases
            const testResult = await this.executeStep(
                'generateUpdatedTests',
                'generate-test-cases',
                {
                    policy: refinementResult.policy,
                    instructions: `Original: ${existingPolicy}\n\nRefinement: ${instructions}`,
                    coverageTarget: 'comprehensive',
                    includeRegressionTests: true
                }
            );

            // Step 6: Run tests
            const testValidationResult = await this.executeStep(
                'runRefinedTests',
                'run-policy-tests',
                {
                    policy: refinementResult.policy,
                    testCases: testResult.testCases
                },
                { continueOnError: true }
            );

            // Step 7: Generate explanation of changes
            const explanationResult = await this.executeStep(
                'explainRefinement',
                'explain-policy-changes',
                {
                    originalPolicy: existingPolicy,
                    refinedPolicy: refinementResult.policy,
                    instructions,
                    includeImpactAnalysis: true
                }
            );

            // Update agent context
            this.agent.updatePolicyContext({
                currentPolicy: refinementResult.policy,
                requirements: [...(this.agent.policyContext.requirements || []), instructions],
                testCases: testResult.testCases,
                validationResults: validationResult?.issues || [],
                lastRefined: new Date().toISOString()
            });

            const result = {
                type: 'complete',
                policy: refinementResult.policy,
                test_inputs: this.formatTestInputs(testResult.testCases),
                explanation: explanationResult?.explanation || 'Policy refined successfully',
                refinement: true,
                metadata: {
                    instructions,
                    refined_at: new Date().toISOString(),
                    model: 'mcp-agent',
                    workflow_steps: this.steps,
                    validation_issues: validationResult?.issues || [],
                    test_results: testValidationResult?.results || [],
                    changes_summary: explanationResult?.changesSummary || []
                },
                timestamp: new Date().toISOString()
            };

            return result;
        } catch (error) {
            console.error('Policy refinement workflow failed:', error);
            throw error;
        }
    }

    formatTestInputs(testCases) {
        if (!testCases || !Array.isArray(testCases)) {
            return [{
                description: "Basic test case",
                input: { user: { role: "user" }, action: "access" },
                expected_result: false
            }];
        }

        return testCases.map(test => ({
            description: test.description || test.name || 'Test case',
            input: test.input || test.data || {},
            expected_result: test.expected !== undefined ? test.expected : test.expected_result
        }));
    }
}

class PolicyValidationWorkflow extends BaseWorkflow {
    async execute(instructions, context, options = {}) {
        try {
            const policy = context.policy || this.agent.policyContext.currentPolicy;
            if (!policy) {
                throw new Error('Policy required for validation');
            }

            // Step 1: Syntax validation
            const syntaxResult = await this.executeStep(
                'validateSyntax',
                'validate-rego-syntax',
                {
                    policy,
                    strictMode: true
                }
            );

            // Step 2: Best practices check
            const bestPracticesResult = await this.executeStep(
                'checkBestPractices',
                'check-rego-best-practices',
                {
                    policy,
                    includeSecurityChecks: true,
                    includePerformanceChecks: true
                },
                { continueOnError: true }
            );

            // Step 3: Security analysis
            const securityResult = await this.executeStep(
                'analyzeSecurityImplications',
                'analyze-policy-security',
                {
                    policy,
                    checkForVulnerabilities: true,
                    checkForBypass: true
                },
                { continueOnError: true }
            );

            // Step 4: Generate validation report
            const reportResult = await this.executeStep(
                'generateValidationReport',
                'generate-validation-report',
                {
                    policy,
                    syntaxResults: syntaxResult,
                    bestPracticesResults: bestPracticesResult,
                    securityResults: securityResult
                }
            );

            const result = {
                type: 'validation_complete',
                policy,
                validation_results: {
                    syntax: syntaxResult,
                    best_practices: bestPracticesResult,
                    security: securityResult,
                    overall_score: reportResult?.score || 0,
                    recommendations: reportResult?.recommendations || []
                },
                metadata: {
                    validated_at: new Date().toISOString(),
                    workflow_steps: this.steps
                },
                timestamp: new Date().toISOString()
            };

            return result;
        } catch (error) {
            console.error('Policy validation workflow failed:', error);
            throw error;
        }
    }
}

class PolicyExplanationWorkflow extends BaseWorkflow {
    async execute(instructions, context, options = {}) {
        try {
            const policy = context.policy || this.agent.policyContext.currentPolicy;
            if (!policy) {
                throw new Error('Policy required for explanation');
            }

            // Step 1: Analyze policy structure
            const structureResult = await this.executeStep(
                'analyzeStructure',
                'analyze-policy-structure',
                {
                    policy,
                    includeFlowAnalysis: true
                }
            );

            // Step 2: Generate plain English explanation
            const explanationResult = await this.executeStep(
                'generateExplanation',
                'explain-policy-logic',
                {
                    policy,
                    context: instructions,
                    includeExamples: true,
                    includeFlowDiagram: true,
                    structure: structureResult
                }
            );

            // Step 3: Generate usage examples
            const examplesResult = await this.executeStep(
                'generateExamples',
                'generate-usage-examples',
                {
                    policy,
                    explanation: explanationResult.explanation,
                    includeEdgeCases: true
                },
                { continueOnError: true }
            );

            const result = {
                type: 'explanation_complete',
                policy,
                explanation: explanationResult.explanation,
                structure_analysis: structureResult,
                usage_examples: examplesResult?.examples || [],
                metadata: {
                    explained_at: new Date().toISOString(),
                    workflow_steps: this.steps
                },
                timestamp: new Date().toISOString()
            };

            return result;
        } catch (error) {
            console.error('Policy explanation workflow failed:', error);
            throw error;
        }
    }
}

class PolicyDeploymentWorkflow extends BaseWorkflow {
    async execute(instructions, context, options = {}) {
        try {
            const policy = context.policy || this.agent.policyContext.currentPolicy;
            if (!policy) {
                throw new Error('Policy required for deployment assistance');
            }

            // Step 1: Analyze deployment requirements
            const requirementsResult = await this.executeStep(
                'analyzeDeploymentRequirements',
                'analyze-deployment-needs',
                {
                    policy,
                    targetEnvironment: context.environment || 'kubernetes',
                    instructions
                }
            );

            // Step 2: Generate deployment configuration
            const configResult = await this.executeStep(
                'generateDeploymentConfig',
                'generate-opa-deployment-config',
                {
                    policy,
                    requirements: requirementsResult,
                    platform: context.platform || 'kubernetes'
                }
            );

            // Step 3: Generate integration guide
            const integrationResult = await this.executeStep(
                'generateIntegrationGuide',
                'generate-integration-guide',
                {
                    policy,
                    deploymentConfig: configResult,
                    targetSystem: context.targetSystem || 'generic'
                },
                { continueOnError: true }
            );

            // Step 4: Generate monitoring setup
            const monitoringResult = await this.executeStep(
                'generateMonitoringSetup',
                'generate-monitoring-config',
                {
                    policy,
                    deploymentConfig: configResult
                },
                { continueOnError: true }
            );

            const result = {
                type: 'deployment_complete',
                policy,
                deployment_config: configResult,
                integration_guide: integrationResult?.guide || 'Integration guide not available',
                monitoring_setup: monitoringResult?.config || null,
                requirements: requirementsResult,
                metadata: {
                    deployment_planned_at: new Date().toISOString(),
                    workflow_steps: this.steps
                },
                timestamp: new Date().toISOString()
            };

            return result;
        } catch (error) {
            console.error('Policy deployment workflow failed:', error);
            throw error;
        }
    }
}

module.exports = {
    PolicyGenerationWorkflow,
    PolicyRefinementWorkflow,
    PolicyValidationWorkflow,
    PolicyExplanationWorkflow,
    PolicyDeploymentWorkflow
};
