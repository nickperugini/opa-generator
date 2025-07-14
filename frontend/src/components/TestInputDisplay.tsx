import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TestInput {
  description: string;
  input: Record<string, any>;
  expected_result: boolean;
}

interface TestInputDisplayProps {
  testInputs: TestInput[];
  policy: string;
}

const TestInputDisplay: React.FC<TestInputDisplayProps> = ({ testInputs }) => {
  const [selectedInput, setSelectedInput] = useState<number>(0);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const copyTestCommand = (input: TestInput) => {
    const inputJson = JSON.stringify(input.input, null, 2);
    const command = `# Save this policy as policy.rego
# Save the input as input.json
# Then run: opa eval -d policy.rego -i input.json "data.package_name.allow"

echo '${inputJson}' > input.json
opa eval -d policy.rego -i input.json "data.package_name.allow"`;
    
    copyToClipboard(command);
  };

  if (!testInputs || testInputs.length === 0) {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Inputs</h2>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '3rem', height: '3rem', margin: '0 auto' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="mt-2">No test inputs available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Inputs</h2>
      
      <div className="space-y-4">
        {/* Test Input Selector */}
        {testInputs.length > 1 && (
          <div className="form-group">
            <label htmlFor="test-select" className="form-label">
              Select Test Case
            </label>
            <select
              id="test-select"
              value={selectedInput}
              onChange={(e) => setSelectedInput(Number(e.target.value))}
              className="form-input"
            >
              {testInputs.map((input, index) => (
                <option key={index} value={index}>
                  Test {index + 1}: {input.description}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Test Input */}
        {testInputs[selectedInput] && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-700">
                  {testInputs[selectedInput].description}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    testInputs[selectedInput].expected_result 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Expected: {testInputs[selectedInput].expected_result ? 'Allow' : 'Deny'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(testInputs[selectedInput].input, null, 2))}
                    className="btn btn-secondary text-sm"
                  >
                    Copy JSON
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded">
                <SyntaxHighlighter
                  language="json"
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}
                >
                  {JSON.stringify(testInputs[selectedInput].input, null, 2)}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Testing Instructions */}
            <div className="alert alert-info">
              <h4 className="text-sm font-medium mb-2">How to Test This Policy</h4>
              <div className="text-sm space-y-2">
                <p>1. Save the generated policy as <code className="bg-blue-100 px-1 rounded">policy.rego</code></p>
                <p>2. Save the test input as <code className="bg-blue-100 px-1 rounded">input.json</code></p>
                <p>3. Run the OPA evaluation command:</p>
                <div className="bg-blue-100 p-2 rounded mt-2 font-mono text-xs">
                  <code>opa eval -d policy.rego -i input.json "data.package_name.allow"</code>
                </div>
                <button
                  onClick={() => copyTestCommand(testInputs[selectedInput])}
                  className="mt-2 btn btn-primary text-sm"
                >
                  Copy Test Commands
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Test Inputs Summary */}
        {testInputs.length > 1 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">All Test Cases Summary</h3>
            <div className="space-y-2">
              {testInputs.map((input, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedInput === index 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedInput(index)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedInput !== index) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedInput !== index) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{input.description}</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      input.expected_result 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {input.expected_result ? 'Allow' : 'Deny'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestInputDisplay;
