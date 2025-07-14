import { useState, useRef } from 'react';
import PolicyInstructionInput from './components/PolicyInstructionInput';
import StreamingPolicyDisplay from './components/StreamingPolicyDisplay';
import PolicyEditor from './components/PolicyEditor';
import TestInputDisplay from './components/TestInputDisplay';
import PolicyHistory from './components/PolicyHistory';
import ApiDocumentation from './components/ApiDocumentation';
import { StreamingPolicyGenerator } from './services/streamingApi';
import { generatePolicy, iteratePolicy } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'editor' | 'history' | 'docs'>('generator');
  const [currentInstructions, setCurrentInstructions] = useState<string>('');
  
  // Policy state
  const [policy, setPolicy] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [testInputs, setTestInputs] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Streaming generator reference
  const streamingGeneratorRef = useRef<StreamingPolicyGenerator | null>(null);

  const handlePolicyGeneration = async (instructions: string) => {
    try {
      setError(null);
      setIsGenerating(true);
      setIsStreaming(true);
      
      // Clear existing content immediately
      setPolicy('');
      setExplanation('');
      setTestInputs([]);
      
      // Create new streaming generator
      streamingGeneratorRef.current = new StreamingPolicyGenerator();
      
      await streamingGeneratorRef.current.generatePolicy(instructions, {}, {
        onStart: () => {
          console.log('Streaming started');
        },
        
        onPolicyChar: (char: string) => {
          setPolicy(prev => prev + char);
        },
        
        onExplanationChar: (char: string) => {
          setExplanation(prev => prev + char);
        },
        
        onComplete: (data: any) => {
          console.log('Streaming completed:', data);
          setPolicy(data.policy || '');
          setExplanation(data.explanation || '');
          setTestInputs(data.test_inputs || []);
          setIsStreaming(false);
          setIsGenerating(false);
        },
        
        onError: (errorMessage: string) => {
          console.error('Streaming error:', errorMessage);
          setError(errorMessage);
          setIsStreaming(false);
          setIsGenerating(false);
          
          // Fallback to regular API
          handleFallbackGeneration(instructions);
        }
      });
      
      setCurrentInstructions('');
      setActiveTab('generator');
      
    } catch (error: any) {
      console.error('Policy generation failed:', error);
      setError(error.message || 'Failed to generate policy');
      setIsStreaming(false);
      setIsGenerating(false);
      
      // Fallback to regular API
      await handleFallbackGeneration(instructions);
    }
  };

  const handleFallbackGeneration = async (instructions: string) => {
    try {
      console.log('Using fallback API...');
      setIsGenerating(true);
      
      const result = await generatePolicy({ instructions });
      
      setPolicy(result.policy || '');
      setExplanation(result.explanation || '');
      setTestInputs(result.test_inputs || []);
      setError(null);
      
    } catch (fallbackError: any) {
      console.error('Fallback generation failed:', fallbackError);
      setError(fallbackError.message || 'Failed to generate policy');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePolicyIteration = async (instructions: string) => {
    try {
      setError(null);
      setIsGenerating(true);
      setIsStreaming(true);
      
      // Clear existing content immediately
      setPolicy('');
      setExplanation('');
      setTestInputs([]);
      
      // Create new streaming generator for refinement
      streamingGeneratorRef.current = new StreamingPolicyGenerator();
      
      await streamingGeneratorRef.current.refinePolicy(instructions, policy, {}, {
        onStart: () => {
          console.log('Streaming refinement started');
        },
        
        onPolicyChar: (char: string) => {
          setPolicy(prev => prev + char);
        },
        
        onExplanationChar: (char: string) => {
          setExplanation(prev => prev + char);
        },
        
        onComplete: (data: any) => {
          console.log('Streaming refinement completed:', data);
          setPolicy(data.policy || '');
          setExplanation(data.explanation || '');
          setTestInputs(data.test_inputs || []);
          setIsStreaming(false);
          setIsGenerating(false);
        },
        
        onError: (errorMessage: string) => {
          console.error('Streaming refinement error:', errorMessage);
          setError(errorMessage);
          setIsStreaming(false);
          setIsGenerating(false);
          
          // Fallback to regular refinement API
          handleFallbackRefinement(instructions);
        }
      });
      
      setCurrentInstructions('');
      setActiveTab('generator');
      
    } catch (error: any) {
      console.error('Policy refinement failed:', error);
      setError(error.message || 'Failed to refine policy');
      setIsStreaming(false);
      setIsGenerating(false);
      
      // Fallback to regular refinement API
      await handleFallbackRefinement(instructions);
    }
  };

  const handleFallbackRefinement = async (instructions: string) => {
    try {
      console.log('Using fallback refinement API...');
      setIsGenerating(true);
      
      const result = await iteratePolicy(instructions, policy);
      
      setPolicy(result.policy || '');
      setExplanation(result.explanation || '');
      setTestInputs(result.test_inputs || []);
      setError(null);
      
    } catch (fallbackError: any) {
      console.error('Fallback refinement failed:', fallbackError);
      setError(fallbackError.message || 'Failed to refine policy');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearPolicy = () => {
    setPolicy('');
    setExplanation('');
    setTestInputs([]);
    setError(null);
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
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2" style={{ backgroundColor: '#059669' }}></div>
                API Connected
              </div>
              {isStreaming && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="loading-spinner mr-2" style={{ width: '12px', height: '12px' }}></div>
                  Streaming...
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
                  isGenerating={isGenerating}
                  isRefining={false}
                  hasExistingPolicy={!!policy}
                  currentInstructions={currentInstructions}
                />
              </div>
              <div>
                <StreamingPolicyDisplay
                  policy={policy}
                  explanation={explanation}
                  testInputs={testInputs}
                  isLoading={isGenerating}
                  error={error}
                  isStreaming={isStreaming}
                />
              </div>
            </div>

            {/* Test Inputs Display */}
            {testInputs && testInputs.length > 0 && (
              <TestInputDisplay testInputs={testInputs} policy={policy} />
            )}

            {/* Clear Button */}
            {(policy || error) && !isStreaming && (
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
              initialPolicy={policy}
              onSave={handlePolicySave}
            />
            {!policy && (
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
                setPolicy(session.policy || '');
                setExplanation(session.explanation || '');
                setTestInputs(session.testInputs || []);
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
