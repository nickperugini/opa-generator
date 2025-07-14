import React, { useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface StreamingPolicyDisplayProps {
  policy: string;
  explanation: string;
  testInputs: any[];
  isLoading: boolean;
  error: string | null;
  isStreaming?: boolean;
}

const StreamingPolicyDisplay: React.FC<StreamingPolicyDisplayProps> = ({
  policy,
  explanation,
  testInputs,
  isLoading,
  error,
  isStreaming = false
}) => {
  const policyRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when content updates during streaming
  useEffect(() => {
    if (isStreaming && policyRef.current) {
      policyRef.current.scrollTop = policyRef.current.scrollHeight;
    }
  }, [policy, isStreaming]);

  useEffect(() => {
    if (isStreaming && explanationRef.current) {
      explanationRef.current.scrollTop = explanationRef.current.scrollHeight;
    }
  }, [explanation, isStreaming]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(policy);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy policy to clipboard:', err);
    }
  };

  const renderLoadingState = () => (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Generated Policy</h2>
      </div>
      
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{
            width: '60%',
            animation: 'progress-slide 2s ease-in-out infinite'
          }}></div>
        </div>
        <span className="text-sm text-gray-600">Generating OPA policy...</span>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Generated Policy</h2>
      <div className="alert alert-error">
        <div className="flex">
          <div style={{ flexShrink: 0 }}>
            <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">Error generating policy</h3>
            <div className="mt-2 text-sm">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Generated Policy</h2>
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '3rem', height: '3rem', margin: '0 auto' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-2">Enter policy instructions to generate an OPA Rego policy</p>
      </div>
    </div>
  );

  const renderStreamingIndicator = () => (
    <div className="flex items-center justify-center mb-4 py-2">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        <span className="ml-3 text-sm text-gray-600">Generating policy...</span>
      </div>
    </div>
  );

  if (error) {
    return renderError();
  }

  if (isLoading && !isStreaming && !policy && !explanation) {
    return renderLoadingState();
  }

  if (!policy && !explanation && !isStreaming) {
    return renderEmptyState();
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Generated Policy</h2>
        <div className="flex items-center space-x-3">
          {policy && (
            <button
              onClick={copyToClipboard}
              className="btn btn-secondary text-sm"
            >
              Copy Policy
            </button>
          )}
        </div>
      </div>
      
      {isStreaming && renderStreamingIndicator()}
      
      <div className="space-y-4">
        {/* Policy Code Box */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">OPA Rego Policy</h3>
          <div 
            ref={policyRef}
            className={`border border-gray-200 rounded ${isStreaming ? 'streaming-container' : ''}`}
          >
            {policy ? (
              <SyntaxHighlighter
                language="javascript"
                style={tomorrow}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5'
                }}
              >
                {policy}
              </SyntaxHighlighter>
            ) : (
              <div className="p-4 text-gray-500 min-h-[100px] flex items-center">
                {isStreaming ? (
                  <div className="streaming-cursor">|</div>
                ) : (
                  <p>Policy will appear here...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Test Inputs Section */}
        {testInputs && testInputs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Test Inputs</h3>
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
                {JSON.stringify(testInputs, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* Explanation Box */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Policy Explanation</h3>
          <div 
            ref={explanationRef}
            className={`alert alert-info ${isStreaming ? 'streaming-container' : ''}`}
          >
            {explanation ? (
              <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                {explanation}
              </p>
            ) : (
              <div className="text-gray-500 min-h-[60px] flex items-center">
                {isStreaming ? (
                  <div className="streaming-cursor">|</div>
                ) : (
                  <p>Explanation will appear here...</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingPolicyDisplay;
