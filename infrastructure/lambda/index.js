const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { OPAPolicyAgent } = require('./agent-core');

// Initialize AWS Secrets Manager client
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Global agent instance (reused across Lambda invocations)
let globalAgent = null;

/**
 * Get OpenAI API key from AWS Secrets Manager
 */
async function getOpenAIApiKey() {
    try {
        const command = new GetSecretValueCommand({
            SecretId: process.env.OPENAI_SECRET_ARN
        });
        
        const response = await secretsClient.send(command);
        const secret = JSON.parse(response.SecretString);
        return secret.api_key;
    } catch (error) {
        console.error('Error retrieving OpenAI API key:', error);
        throw new Error('Failed to retrieve OpenAI API key');
    }
}

/**
 * Initialize or get the global agent instance
 */
async function getAgent() {
    if (!globalAgent) {
        globalAgent = new OPAPolicyAgent();
        
        // Set OpenAI API key for MCP servers that need it
        process.env.OPENAI_API_KEY = await getOpenAIApiKey();
        
        await globalAgent.initialize();
    }
    return globalAgent;
}

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
            'Access-Control-Max-Age': '86400'
        },
        body: ''
    };
}

/**
 * Handle health check requests
 */
async function handleHealth() {
    try {
        const agent = await getAgent();
        
        // Check agent status and tool availability
        const toolCount = agent.toolRegistry.size;
        const mcpServerCount = agent.mcpClients.size;
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0-agent',
                agent_status: 'initialized',
                mcp_servers: mcpServerCount,
                available_tools: toolCount,
                capabilities: [
                    'policy_generation',
                    'policy_refinement', 
                    'policy_validation',
                    'policy_explanation',
                    'deployment_assistance',
                    'context_management',
                    'streaming_support'
                ]
            })
        };
    } catch (error) {
        console.error('Health check failed:', error);
        return {
            statusCode: 503,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                agent_status: 'failed'
            })
        };
    }
}

/**
 * Handle policy generation requests with agent and streaming support
 */
async function handleGeneratePolicy(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { instructions, context = {} } = body;
        const acceptHeader = event.headers?.accept || event.headers?.Accept || '';
        const isStreamingRequest = acceptHeader.includes('text/event-stream');

        if (!instructions || typeof instructions !== 'string') {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Instructions are required and must be a string',
                    code: 'INVALID_INPUT'
                })
            };
        }

        const agent = await getAgent();
        
        if (isStreamingRequest) {
            // Handle streaming request with agent
            return await handleStreamingGeneration(agent, instructions, context);
        } else {
            // Handle regular request with agent
            const result = await agent.processRequest(instructions, context, {
                requestType: 'generate'
            });

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result)
            };
        }
        
    } catch (error) {
        console.error('Error in handleGeneratePolicy:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: error.message || 'Internal server error',
                code: 'GENERATION_ERROR'
            })
        };
    }
}

/**
 * Handle streaming policy generation with agent
 */
async function handleStreamingGeneration(agent, instructions, context) {
    try {
        // Process request with agent (this handles the full workflow)
        const result = await agent.processRequest(instructions, context, {
            requestType: 'generate',
            streaming: true
        });

        // Create streaming events from the result
        const events = [];
        
        // Add initial empty state
        events.push({
            type: 'start',
            data: {
                policy: '',
                test_inputs: [],
                explanation: '',
                timestamp: new Date().toISOString()
            }
        });

        // Simulate character-by-character streaming for compatibility
        // In a real implementation, you might modify the agent to support true streaming
        if (result.policy) {
            for (let i = 0; i < result.policy.length; i++) {
                events.push({
                    type: 'policy_char',
                    data: {
                        char: result.policy[i],
                        index: i,
                        section: 'policy'
                    }
                });
            }
        }

        if (result.explanation) {
            for (let i = 0; i < result.explanation.length; i++) {
                events.push({
                    type: 'explanation_char',
                    data: {
                        char: result.explanation[i],
                        index: i,
                        section: 'explanation'
                    }
                });
            }
        }

        // Add completion event with full result
        events.push({
            type: 'complete',
            data: result
        });

        // Format as Server-Sent Events
        const sseData = events.map(event => 
            `data: ${JSON.stringify(event)}\n\n`
        ).join('');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: sseData
        };

    } catch (error) {
        console.error('Error in streaming generation:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Streaming generation failed',
                code: 'STREAMING_ERROR',
                details: error.message
            })
        };
    }
}

/**
 * Handle policy refinement requests with agent
 */
async function handleRefinePolicy(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { instructions, existing_policy, context = {} } = body;
        const acceptHeader = event.headers?.accept || event.headers?.Accept || '';
        const isStreamingRequest = acceptHeader.includes('text/event-stream');

        if (!instructions || typeof instructions !== 'string') {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Instructions are required and must be a string',
                    code: 'INVALID_INPUT'
                })
            };
        }

        if (!existing_policy || typeof existing_policy !== 'string') {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Existing policy is required and must be a string',
                    code: 'INVALID_INPUT'
                })
            };
        }

        const agent = await getAgent();
        
        // Add existing policy to context for refinement
        const refinementContext = {
            ...context,
            existing_policy: existing_policy
        };
        
        if (isStreamingRequest) {
            // Handle streaming refinement request
            return await handleStreamingRefinement(agent, instructions, refinementContext);
        } else {
            // Handle regular refinement request
            const result = await agent.processRequest(instructions, refinementContext, {
                requestType: 'refine'
            });

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result)
            };
        }

    } catch (error) {
        console.error('Error refining policy:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Failed to refine OPA policy',
                code: 'REFINEMENT_ERROR',
                details: error.message
            })
        };
    }
}

/**
 * Handle streaming policy refinement with agent
 */
async function handleStreamingRefinement(agent, instructions, context) {
    try {
        // Process refinement request with agent
        const result = await agent.processRequest(instructions, context, {
            requestType: 'refine',
            streaming: true
        });

        // Create streaming events from the result
        const events = [];
        
        // Add initial empty state
        events.push({
            type: 'start',
            data: {
                policy: '',
                test_inputs: [],
                explanation: '',
                refinement: true,
                timestamp: new Date().toISOString()
            }
        });

        // Simulate character-by-character streaming for compatibility
        if (result.policy) {
            for (let i = 0; i < result.policy.length; i++) {
                events.push({
                    type: 'policy_char',
                    data: {
                        char: result.policy[i],
                        index: i,
                        section: 'policy'
                    }
                });
            }
        }

        if (result.explanation) {
            for (let i = 0; i < result.explanation.length; i++) {
                events.push({
                    type: 'explanation_char',
                    data: {
                        char: result.explanation[i],
                        index: i,
                        section: 'explanation'
                    }
                });
            }
        }

        // Add completion event
        events.push({
            type: 'complete',
            data: result
        });

        // Format as Server-Sent Events
        const sseData = events.map(event => 
            `data: ${JSON.stringify(event)}\n\n`
        ).join('');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Accept',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: sseData
        };

    } catch (error) {
        console.error('Error in streaming refinement:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Streaming refinement failed',
                code: 'STREAMING_REFINEMENT_ERROR',
                details: error.message
            })
        };
    }
}

/**
 * Handle new agent-specific endpoints
 */
async function handleValidatePolicy(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { policy, context = {} } = body;

        if (!policy) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Policy is required for validation',
                    code: 'INVALID_INPUT'
                })
            };
        }

        const agent = await getAgent();
        const result = await agent.processRequest('Validate this policy', { ...context, policy }, {
            requestType: 'validate'
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('Error validating policy:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Policy validation failed',
                code: 'VALIDATION_ERROR',
                details: error.message
            })
        };
    }
}

async function handleExplainPolicy(event) {
    try {
        const body = JSON.parse(event.body || '{}');
        const { policy, context = {} } = body;

        if (!policy) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Policy is required for explanation',
                    code: 'INVALID_INPUT'
                })
            };
        }

        const agent = await getAgent();
        const result = await agent.processRequest('Explain this policy', { ...context, policy }, {
            requestType: 'explain'
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('Error explaining policy:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Policy explanation failed',
                code: 'EXPLANATION_ERROR',
                details: error.message
            })
        };
    }
}

/**
 * Main Lambda handler with agent support
 */
exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    const { httpMethod, path, requestContext } = event;
    const method = httpMethod || requestContext?.http?.method;
    const routeKey = requestContext?.routeKey || `${method} ${path}`;

    try {
        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return handleCORS();
        }

        // Route requests
        switch (routeKey) {
            case 'GET /health':
                return await handleHealth();
            
            case 'POST /generate-policy':
                return await handleGeneratePolicy(event);
            
            case 'POST /refine-policy':
                return await handleRefinePolicy(event);
            
            case 'POST /validate-policy':
                return await handleValidatePolicy(event);
            
            case 'POST /explain-policy':
                return await handleExplainPolicy(event);
            
            default:
                return {
                    statusCode: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        error: 'Route not found',
                        code: 'NOT_FOUND',
                        available_routes: [
                            'GET /health',
                            'POST /generate-policy',
                            'POST /refine-policy',
                            'POST /validate-policy',
                            'POST /explain-policy'
                        ]
                    })
                };
        }
    } catch (error) {
        console.error('Unhandled error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR'
            })
        };
    }
};

// Cleanup on Lambda shutdown
process.on('SIGTERM', async () => {
    if (globalAgent) {
        await globalAgent.cleanup();
    }
});
