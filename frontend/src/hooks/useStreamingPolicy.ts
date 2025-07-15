import { useState, useCallback, useRef, useEffect } from 'react';
import { policyHistoryService } from '../services/policyHistory';

export interface StreamingState {
  policy: string;
  explanation: string;
  testInputs: any[];
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  lastInstructions?: string;
}

export interface UseStreamingPolicyReturn {
  state: StreamingState;
  generatePolicy: (instructions: string) => Promise<void>;
  refinePolicy: (instructions: string, existingPolicy: string) => Promise<void>;
  clearState: () => void;
  abortStreaming: () => void;
}

const API_BASE_URL = 'https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev';

export function useStreamingPolicy(): UseStreamingPolicyReturn {
  const [state, setState] = useState<StreamingState>({
    policy: '',
    explanation: '',
    testInputs: [],
    isStreaming: false,
    isComplete: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-save to history when streaming completes
  useEffect(() => {
    if (state.isComplete && state.policy && state.lastInstructions) {
      try {
        policyHistoryService.savePolicySession({
          instructions: state.lastInstructions,
          policy: state.policy,
          explanation: state.explanation || 'No explanation provided',
          testInputs: state.testInputs || []
        });
        console.log('Policy automatically saved to history');
      } catch (error) {
        console.error('Failed to auto-save policy to history:', error);
      }
    }
  }, [state.isComplete, state.policy, state.explanation, state.testInputs, state.lastInstructions]);

  const clearState = useCallback(() => {
    setState({
      policy: '',
      explanation: '',
      testInputs: [],
      isStreaming: false,
      isComplete: false,
      error: null,
    });
  }, []);

  const abortStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isStreaming: false,
      error: 'Request aborted by user'
    }));
  }, []);

  const handleStreamingRequest = useCallback(async (
    endpoint: string,
    requestBody: any,
    instructions: string
  ) => {
    // Clear previous state
    clearState();
    
    // Set initial streaming state
    setState(prev => ({
      ...prev,
      isStreaming: true,
      error: null,
      lastInstructions: instructions
    }));

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream', // This triggers streaming mode
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // Process streaming response
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              await handleStreamingEvent(eventData);
            } catch (e) {
              console.warn('Failed to parse SSE data:', line, e);
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Streaming request was aborted');
        return;
      }
      
      console.error('Streaming error:', error);
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: error.message || 'Streaming failed'
      }));
    } finally {
      abortControllerRef.current = null;
    }
  }, [clearState]);

  const handleStreamingEvent = useCallback(async (event: any) => {
    switch (event.type) {
      case 'start':
        setState(prev => ({
          ...prev,
          policy: '',
          explanation: '',
          testInputs: [],
          isStreaming: true,
          isComplete: false,
          error: null
        }));
        break;
      
      case 'policy_char':
        setState(prev => ({
          ...prev,
          policy: prev.policy + event.data.char
        }));
        // Add small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 20));
        break;
      
      case 'explanation_char':
        setState(prev => ({
          ...prev,
          explanation: prev.explanation + event.data.char
        }));
        // Add small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 15));
        break;
      
      case 'complete':
        setState(prev => ({
          ...prev,
          policy: event.data.policy || prev.policy,
          explanation: event.data.explanation || prev.explanation,
          testInputs: event.data.test_inputs || [],
          isStreaming: false,
          isComplete: true,
          error: null
        }));
        break;
      
      case 'error':
        setState(prev => ({
          ...prev,
          isStreaming: false,
          error: event.data.message || 'Unknown streaming error'
        }));
        break;
    }
  }, []);

  const generatePolicy = useCallback(async (instructions: string) => {
    await handleStreamingRequest('generate-policy', {
      instructions,
      context: {
        user_id: 'demo-user',
        session_id: Date.now().toString()
      }
    }, instructions);
  }, [handleStreamingRequest]);

  const refinePolicy = useCallback(async (instructions: string, existingPolicy: string) => {
    await handleStreamingRequest('refine-policy', {
      instructions,
      existing_policy: existingPolicy,
      context: {
        user_id: 'demo-user',
        session_id: Date.now().toString()
      }
    }, instructions);
  }, [handleStreamingRequest]);

  return {
    state,
    generatePolicy,
    refinePolicy,
    clearState,
    abortStreaming
  };
}
