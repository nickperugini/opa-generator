import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ApiDocumentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'examples' | 'errors'>('endpoints');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/health',
      description: 'Check the health status of the API and OpenAI connection',
      requestBody: null,
      response: `{
  "status": "healthy",
  "timestamp": "2025-07-12T01:00:00.000Z",
  "version": "1.0.0",
  "openai_status": "connected"
}`
    },
    {
      method: 'POST',
      path: '/generate-policy',
      description: 'Generate a new OPA Rego policy from natural language instructions',
      requestBody: `{
  "instructions": "Only allow if user role is admin and department is HR",
  "context": {
    "domain": "access_control",
    "complexity": "simple"
  }
}`,
      response: `{
  "type": "complete",
  "policy": "package rbac.admin_access\\n\\ndefault allow := false\\n\\nallow if {\\n    input.user.role == \\"admin\\"\\n    input.user.department == \\"HR\\"\\n}",
  "test_inputs": [
    {
      "description": "Admin user in HR department should be allowed",
      "input": {
        "user": {
          "role": "admin",
          "department": "HR"
        }
      },
      "expected": true
    },
    {
      "description": "Admin user in Sales department should be denied",
      "input": {
        "user": {
          "role": "admin", 
          "department": "Sales"
        }
      },
      "expected": false
    }
  ],
  "explanation": "This policy allows access only if the user's role is 'admin' and department is 'HR'.",
  "timestamp": "2025-07-12T01:00:00.000Z",
  "metadata": {
    "instructions": "Only allow if user role is admin and department is HR",
    "generated_at": "2025-07-12T01:00:00.000Z",
    "model": "gpt-4o-mini",
    "validation_warnings": []
  }
}`
    },
    {
      method: 'POST',
      path: '/refine-policy',
      description: 'Refine an existing OPA Rego policy with new requirements while preserving original intent',
      requestBody: `{
  "instructions": "Also require that the user has MFA enabled",
  "existing_policy": "package rbac.admin_access\\n\\ndefault allow := false\\n\\nallow if {\\n    input.user.role == \\"admin\\"\\n    input.user.department == \\"HR\\"\\n}",
  "context": {
    "domain": "access_control",
    "complexity": "medium"
  }
}`,
      response: `{
  "type": "complete",
  "policy": "package rbac.admin_access\\n\\ndefault allow := false\\n\\nallow if {\\n    input.user.role == \\"admin\\"\\n    input.user.department == \\"HR\\"\\n    input.user.mfa_enabled == true\\n}",
  "test_inputs": [
    {
      "description": "Admin user in HR with MFA should be allowed",
      "input": {
        "user": {
          "role": "admin",
          "department": "HR",
          "mfa_enabled": true
        }
      },
      "expected": true
    },
    {
      "description": "Admin user in HR without MFA should be denied",
      "input": {
        "user": {
          "role": "admin",
          "department": "HR",
          "mfa_enabled": false
        }
      },
      "expected": false
    }
  ],
  "explanation": "This policy allows access only if the user's role is 'admin', department is 'HR', and MFA is enabled.",
  "timestamp": "2025-07-12T01:00:00.000Z",
  "refinement": true
}`
    }
  ];

  const examples = [
    {
      title: 'Health Check',
      request: `curl -X GET "https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev/health"`,
      response: `{
  "status": "healthy",
  "timestamp": "2025-07-12T01:00:00.000Z",
  "version": "1.0.0",
  "openai_status": "connected"
}`
    },
    {
      title: 'Generate Role-Based Access Control Policy',
      request: `curl -X POST "https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev/generate-policy" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instructions": "Only allow if user role is admin and department is HR",
    "context": {
      "domain": "access_control",
      "complexity": "simple"
    }
  }'`,
      response: `{
  "type": "complete",
  "policy": "package rbac.admin_access\\n\\ndefault allow := false\\n\\nallow if {\\n    input.user.role == \\"admin\\"\\n    input.user.department == \\"HR\\"\\n}",
  "test_inputs": [
    {
      "description": "Admin user in HR department should be allowed",
      "input": {
        "user": {
          "role": "admin",
          "department": "HR"
        }
      },
      "expected": true
    },
    {
      "description": "Regular user should be denied",
      "input": {
        "user": {
          "role": "user",
          "department": "HR"
        }
      },
      "expected": false
    }
  ],
  "explanation": "This policy allows access only if the user's role is 'admin' and department is 'HR'.",
  "timestamp": "2025-07-12T01:00:00.000Z"
}`
    },
    {
      title: 'Refine Existing Policy',
      request: `curl -X POST "https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev/refine-policy" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instructions": "Also require that the user has MFA enabled",
    "existing_policy": "package rbac.admin_access\\n\\ndefault allow := false\\n\\nallow if {\\n    input.user.role == \\"admin\\"\\n    input.user.department == \\"HR\\"\\n}",
    "context": {
      "domain": "access_control"
    }
  }'`,
      response: `{
  "type": "complete",
  "policy": "package rbac.admin_access\\n\\ndefault allow := false\\n\\nallow if {\\n    input.user.role == \\"admin\\"\\n    input.user.department == \\"HR\\"\\n    input.user.mfa_enabled == true\\n}",
  "test_inputs": [
    {
      "description": "Admin user in HR with MFA should be allowed",
      "input": {
        "user": {
          "role": "admin",
          "department": "HR",
          "mfa_enabled": true
        }
      },
      "expected": true
    },
    {
      "description": "Admin user in HR without MFA should be denied",
      "input": {
        "user": {
          "role": "admin",
          "department": "HR",
          "mfa_enabled": false
        }
      },
      "expected": false
    }
  ],
  "explanation": "This policy allows access only if the user's role is 'admin', department is 'HR', and MFA is enabled.",
  "timestamp": "2025-07-12T01:00:00.000Z",
  "refinement": true
}`
    },
    {
      title: 'Time-Based Access Control',
      request: `curl -X POST "https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev/generate-policy" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instructions": "Allow access only during business hours (9 AM to 5 PM) on weekdays",
    "context": {
      "domain": "time_based_access",
      "complexity": "medium"
    }
  }'`,
      response: `{
  "type": "complete",
  "policy": "package time.business_hours\\n\\ndefault allow := false\\n\\nallow if {\\n    is_business_hours\\n    is_weekday\\n}\\n\\nis_business_hours if {\\n    hour := input.time.hour\\n    hour >= 9\\n    hour < 17\\n}\\n\\nis_weekday if {\\n    input.time.day_of_week in [\\"Monday\\", \\"Tuesday\\", \\"Wednesday\\", \\"Thursday\\", \\"Friday\\"]\\n}",
  "test_inputs": [
    {
      "description": "Tuesday 2 PM should be allowed",
      "input": {
        "time": {
          "hour": 14,
          "day_of_week": "Tuesday"
        }
      },
      "expected": true
    },
    {
      "description": "Saturday 10 AM should be denied",
      "input": {
        "time": {
          "hour": 10,
          "day_of_week": "Saturday"
        }
      },
      "expected": false
    }
  ],
  "explanation": "This policy allows access only during business hours (9 AM to 5 PM) on weekdays.",
  "timestamp": "2025-07-12T01:00:00.000Z"
}`
    }
  ];

  const errorCodes = [
    {
      code: 400,
      name: 'Bad Request',
      description: 'Invalid request format or missing required fields',
      example: `{
  "error": "Instructions are required and must be a string",
  "code": "INVALID_INPUT"
}`
    },
    {
      code: 401,
      name: 'Unauthorized',
      description: 'Missing or invalid API key',
      example: `{
  "error": "Unauthorized access",
  "code": "UNAUTHORIZED"
}`
    },
    {
      code: 429,
      name: 'Too Many Requests',
      description: 'Rate limit exceeded',
      example: `{
  "error": "OpenAI API rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}`
    },
    {
      code: 500,
      name: 'Internal Server Error',
      description: 'Server error or OpenAI API error',
      example: `{
  "error": "Failed to generate OPA policy",
  "code": "GENERATION_ERROR",
  "details": "OpenAI API error message"
}`
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">API Documentation</h2>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'endpoints', label: 'Endpoints' },
            { key: 'examples', label: 'Examples' },
            { key: 'errors', label: 'Error Codes' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className={`px-3 py-1 rounded-md text-xs font-bold mr-3 border-2 ${
                  endpoint.method === 'GET' 
                    ? 'bg-green-500 text-white border-green-600' 
                    : 'bg-blue-500 text-white border-blue-600'
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-lg font-mono text-gray-800">{endpoint.path}</code>
              </div>
              
              <p className="text-gray-600 mb-4">{endpoint.description}</p>
              
              {endpoint.requestBody && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-700">Request Body</h4>
                    <button
                      onClick={() => copyToClipboard(endpoint.requestBody!)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language="json"
                    style={tomorrow}
                    customStyle={{ fontSize: '0.875rem', margin: 0 }}
                  >
                    {endpoint.requestBody}
                  </SyntaxHighlighter>
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Response</h4>
                  <button
                    onClick={() => copyToClipboard(endpoint.response)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  language="json"
                  style={tomorrow}
                  customStyle={{ fontSize: '0.875rem', margin: 0 }}
                >
                  {endpoint.response}
                </SyntaxHighlighter>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          {examples.map((example, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{example.title}</h3>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Request</h4>
                  <button
                    onClick={() => copyToClipboard(example.request)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  language="bash"
                  style={tomorrow}
                  customStyle={{ fontSize: '0.875rem', margin: 0 }}
                >
                  {example.request}
                </SyntaxHighlighter>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Response</h4>
                  <button
                    onClick={() => copyToClipboard(example.response)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  language="json"
                  style={tomorrow}
                  customStyle={{ fontSize: '0.875rem', margin: 0 }}
                >
                  {example.response}
                </SyntaxHighlighter>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Codes Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          {errorCodes.map((error, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold mr-3 border-2 border-red-600">
                  {error.code}
                </span>
                <h3 className="text-lg font-semibold text-gray-800">{error.name}</h3>
              </div>
              
              <p className="text-gray-600 mb-3">{error.description}</p>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-700">Example Response</h4>
                  <button
                    onClick={() => copyToClipboard(error.example)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  language="json"
                  style={tomorrow}
                  customStyle={{ fontSize: '0.875rem', margin: 0 }}
                >
                  {error.example}
                </SyntaxHighlighter>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiDocumentation;
