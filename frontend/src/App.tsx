import { useState } from 'react';
import PolicyInstructionInput from './components/PolicyInstructionInput';
import StreamingPolicyDisplay from './components/StreamingPolicyDisplay';
import PolicyEditor from './components/PolicyEditor';
import TestInputDisplay from './components/TestInputDisplay';
import PolicyHistory from './components/PolicyHistory';
import ApiDocumentation from './components/ApiDocumentation';
import { generatePolicy, iteratePolicy } from './services/api';
import { useStreamingPolicy } from './hooks/useStreamingPolicy';
import { policyHistoryService } from './services/policyHistory';

function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'editor' | 'history' | 'docs'>('generator');
  const [currentInstructions, setCurrentInstructions] = useState<string>('');
  const [useStreaming, setUseStreaming] = useState<boolean>(true); // Toggle for streaming vs regular API
  
  // Streaming state
  const streamingPolicy = useStreamingPolicy();
  
  // Regular API state (fallback)
  const [regularState, setRegularState] = useState({
    policy: '',
    explanation: '',
    testInputs: [] as any[],
    isGenerating: false,
    error: null as string | null
  });

  // Get current state based on streaming mode
  const currentState = useStreaming ? {
    policy: streamingPolicy.state.policy,
    explanation: streamingPolicy.state.explanation,
    testInputs: streamingPolicy.state.testInputs,
    isGenerating: streamingPolicy.state.isStreaming,
    isStreaming: streamingPolicy.state.isStreaming,
    error: streamingPolicy.state.error
  } : {
    policy: regularState.policy,
    explanation: regularState.explanation,
    testInputs: regularState.testInputs,
    isGenerating: regularState.isGenerating,
    isStreaming: false,
    error: regularState.error
  };
  
  // Helper function to save policy to history
  const savePolicyToHistory = (instructions: string, policy: string, explanation: string, testInputs: any[]) => {
    if (policy && instructions) {
      try {
        policyHistoryService.savePolicySession({
          instructions,
          policy,
          explanation: explanation || 'No explanation provided',
          testInputs: testInputs || []
        });
        console.log('Policy saved to history');
      } catch (error) {
        console.error('Failed to save policy to history:', error);
      }
    }
  };

  const handlePolicyGeneration = async (instructions: string) => {
    try {
      if (useStreaming) {
        // Use streaming API (history saving is handled automatically by the hook)
        await streamingPolicy.generatePolicy(instructions);
      } else {
        // Use regular API as fallback
        setRegularState(prev => ({ ...prev, isGenerating: true, error: null }));
        
        const result = await generatePolicy({ instructions });
        
        const finalPolicy = result.policy || '';
        const finalExplanation = result.explanation || '';
        const finalTestInputs = result.test_inputs || [];
        
        setRegularState({
          policy: finalPolicy,
          explanation: finalExplanation,
          testInputs: finalTestInputs,
          isGenerating: false,
          error: null
        });
        
        // Save to history for regular API
        savePolicyToHistory(instructions, finalPolicy, finalExplanation, finalTestInputs);
      }
      
      setCurrentInstructions('');
      setActiveTab('generator');
      
    } catch (error: any) {
      console.error('Policy generation failed:', error);
      
      if (useStreaming) {
        // Error is handled by the streaming hook
      } else {
        setRegularState(prev => ({
          ...prev,
          isGenerating: false,
          error: error.message || 'Failed to generate policy'
        }));
      }
      
      // If streaming fails, try fallback to regular API
      if (useStreaming && error.message?.includes('streaming')) {
        console.log('Streaming failed, falling back to regular API...');
        setUseStreaming(false);
        // Retry with regular API
        setTimeout(() => handlePolicyGeneration(instructions), 1000);
      }
    }
  };

  const handlePolicyIteration = async (instructions: string) => {
    try {
      const currentPolicy = currentState.policy;
      
      if (useStreaming) {
        // Use streaming API for refinement (history saving is handled automatically)
        await streamingPolicy.refinePolicy(instructions, currentPolicy);
      } else {
        // Use regular API as fallback
        setRegularState(prev => ({ ...prev, isGenerating: true, error: null }));
        
        const result = await iteratePolicy(instructions, currentPolicy);
        
        const finalPolicy = result.policy || '';
        const finalExplanation = result.explanation || '';
        const finalTestInputs = result.test_inputs || [];
        
        setRegularState({
          policy: finalPolicy,
          explanation: finalExplanation,
          testInputs: finalTestInputs,
          isGenerating: false,
          error: null
        });
        
        // Save refined policy to history for regular API
        savePolicyToHistory(instructions, finalPolicy, finalExplanation, finalTestInputs);
      }
      
      setCurrentInstructions('');
      setActiveTab('generator');
      
    } catch (error: any) {
      console.error('Policy refinement failed:', error);
      
      if (useStreaming) {
        // Error is handled by the streaming hook
      } else {
        setRegularState(prev => ({
          ...prev,
          isGenerating: false,
          error: error.message || 'Failed to refine policy'
        }));
      }
      
      // If streaming fails, try fallback to regular API
      if (useStreaming && error.message?.includes('streaming')) {
        console.log('Streaming refinement failed, falling back to regular API...');
        setUseStreaming(false);
        // Retry with regular API
        setTimeout(() => handlePolicyIteration(instructions), 1000);
      }
    }
  };

  const clearPolicy = () => {
    if (useStreaming) {
      streamingPolicy.clearState();
    } else {
      setRegularState({
        policy: '',
        explanation: '',
        testInputs: [],
        isGenerating: false,
        error: null
      });
    }
  };

  const handlePolicySave = (savedPolicy: string, description: string) => {
    console.log('Policy saved:', { policy: savedPolicy, description });
    // You could add a toast notification here
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                OpenAI OPA Policy Generator
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Generate and iterate on syntactically correct OPA Rego policies from natural language instructions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Streaming Toggle */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={useStreaming}
                    onChange={(e) => setUseStreaming(e.target.checked)}
                    className="mr-1"
                  />
                  Streaming
                </label>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2" style={{ backgroundColor: '#059669' }}></div>
                API Connected
              </div>
              
              {currentState.isStreaming && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="loading-spinner mr-2" style={{ width: '12px', height: '12px' }}></div>
                  Streaming...
                  <button
                    onClick={streamingPolicy.abortStreaming}
                    className="ml-2 text-xs text-red-600 hover:text-red-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <div className="container">
          {[
            { key: 'generator', label: 'Policy Generator' },
            { key: 'editor', label: 'Policy Editor' },
            { key: 'history', label: 'Policy History' },
            { key: 'docs', label: 'API Documentation' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-8">
        {activeTab === 'generator' && (
          <div className="space-y-6">
            {/* Policy Generation Section */}
            <div className="grid grid-2">
              <div>
                <PolicyInstructionInput
                  onSubmit={handlePolicyGeneration}
                  onIterate={handlePolicyIteration}
                  isGenerating={currentState.isGenerating}
                  isRefining={false}
                  hasExistingPolicy={!!currentState.policy}
                  currentInstructions={currentInstructions}
                />
              </div>
              <div>
                <StreamingPolicyDisplay
                  policy={currentState.policy}
                  explanation={currentState.explanation}
                  testInputs={currentState.testInputs}
                  isLoading={currentState.isGenerating}
                  error={currentState.error}
                  isStreaming={currentState.isStreaming}
                />
              </div>
            </div>

            {/* Test Inputs Display */}
            {currentState.testInputs && currentState.testInputs.length > 0 && (
              <TestInputDisplay testInputs={currentState.testInputs} policy={currentState.policy} />
            )}

            {/* Clear Button */}
            {(currentState.policy || currentState.error) && !currentState.isStreaming && (
              <div className="text-center">
                <button
                  onClick={clearPolicy}
                  className="btn btn-secondary"
                >
                  Clear and Start Over
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'editor' && (
          <div>
            <PolicyEditor
              initialPolicy={currentState.policy}
              onSave={handlePolicySave}
            />
            {!currentState.policy && (
              <div className="mt-4 text-center text-gray-500">
                <p>Generate a policy first to start editing, or create a new policy from scratch.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <PolicyHistory
              onLoadInstructions={(instructions) => {
                setCurrentInstructions(instructions);
                setActiveTab('generator');
              }}
              onLoadPolicy={(session) => {
                // Load policy from history
                if (useStreaming) {
                  streamingPolicy.clearState();
                  // Set the state directly (this is a limitation of the current hook design)
                  // In a real app, you might want to modify the hook to support loading state
                } else {
                  setRegularState({
                    policy: session.policy || '',
                    explanation: session.explanation || '',
                    testInputs: session.testInputs || [],
                    isGenerating: false,
                    error: null
                  });
                }
                setCurrentInstructions(session.instructions);
                setActiveTab('generator');
              }}
            />
          </div>
        )}

        {activeTab === 'docs' && (
          <div>
            <ApiDocumentation />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="text-center text-sm text-gray-500">
            <p>
              OpenAI OPA Policy Generator - Demonstrating end-to-end streaming policy generation with iteration
            </p>
            <p className="mt-2">
              Built with React, TypeScript, OpenAI API, AWS Lambda, and API Gateway
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
