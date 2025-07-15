// Streaming API service using Server-Sent Events - Updated to use new MCP-based agent system
const API_BASE_URL = 'https://yp9ikbo9h9.execute-api.us-east-1.amazonaws.com/dev';

export interface StreamingEvent {
  type: 'start' | 'policy_char' | 'explanation_char' | 'complete' | 'error';
  data: any;
}

export interface StreamingCallbacks {
  onStart?: (data: any) => void;
  onPolicyChar?: (char: string) => void;
  onExplanationChar?: (char: string) => void;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

export class StreamingPolicyGenerator {
  private eventSource: EventSource | null = null;
  private abortController: AbortController | null = null;

  async generatePolicy(
    instructions: string, 
    context: any = {}, 
    callbacks: StreamingCallbacks
  ): Promise<void> {
    try {
      // First try Server-Sent Events approach
      await this.generateWithSSE(instructions, context, callbacks, 'generate-policy');
    } catch (error) {
      console.warn('SSE failed, falling back to fetch streaming:', error);
      // Fallback to fetch streaming
      await this.generateWithFetch(instructions, context, callbacks, 'generate-policy');
    }
  }

  async refinePolicy(
    instructions: string,
    existingPolicy: string,
    context: any = {},
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const refinementContext = {
      ...context,
      existing_policy: existingPolicy
    };
    
    try {
      // First try Server-Sent Events approach
      await this.generateWithSSE(instructions, refinementContext, callbacks, 'refine-policy');
    } catch (error) {
      console.warn('SSE refinement failed, falling back to fetch streaming:', error);
      // Fallback to fetch streaming
      await this.generateWithFetch(instructions, refinementContext, callbacks, 'refine-policy');
    }
  }

  private async generateWithSSE(
    instructions: string,
    context: any,
    callbacks: StreamingCallbacks,
    endpoint: string = 'generate-policy'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // For EventSource, we need to use GET with query params or find another approach
      // Let's use fetch with streaming instead
      this.generateWithFetch(instructions, context, callbacks, endpoint)
        .then(resolve)
        .catch(reject);
    });
  }

  private async generateWithFetch(
    instructions: string,
    context: any,
    callbacks: StreamingCallbacks,
    endpoint: string = 'generate-policy'
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      const requestBody: any = {
        instructions,
        context: {
          user_id: 'demo-user',
          session_id: Date.now().toString(),
          ...context
        }
      };

      // Add existing_policy for refinement requests
      if (endpoint === 'refine-policy' && context.existing_policy) {
        requestBody.existing_policy = context.existing_policy;
      }

      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal
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
              await this.handleStreamingEvent(eventData, callbacks);
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
      callbacks.onError?.(error.message || 'Streaming failed');
      throw error;
    }
  }

  private async handleStreamingEvent(
    event: StreamingEvent,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    switch (event.type) {
      case 'start':
        callbacks.onStart?.(event.data);
        break;
      
      case 'policy_char':
        callbacks.onPolicyChar?.(event.data.char);
        // Add small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 20));
        break;
      
      case 'explanation_char':
        callbacks.onExplanationChar?.(event.data.char);
        // Add small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 15));
        break;
      
      case 'complete':
        callbacks.onComplete?.(event.data);
        break;
      
      case 'error':
        callbacks.onError?.(event.data.message || 'Unknown error');
        break;
    }
  }

  abort(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Fallback streaming function for compatibility
export async function generatePolicyStreaming(
  instructions: string,
  context: any = {},
  onUpdate: (data: any) => void
): Promise<any> {
  const generator = new StreamingPolicyGenerator();
  
  let finalResult: any = null;
  let currentPolicy = '';
  let currentExplanation = '';

  await generator.generatePolicy(instructions, context, {
    onStart: () => {
      currentPolicy = '';
      currentExplanation = '';
      onUpdate({
        type: 'start',
        policy: '',
        explanation: '',
        test_inputs: [],
        timestamp: new Date().toISOString()
      });
    },
    
    onPolicyChar: (char) => {
      currentPolicy += char;
      onUpdate({
        type: 'policy_update',
        policy: currentPolicy,
        explanation: currentExplanation,
        test_inputs: [],
        timestamp: new Date().toISOString()
      });
    },
    
    onExplanationChar: (char) => {
      currentExplanation += char;
      onUpdate({
        type: 'explanation_update',
        policy: currentPolicy,
        explanation: currentExplanation,
        test_inputs: [],
        timestamp: new Date().toISOString()
      });
    },
    
    onComplete: (data) => {
      finalResult = data;
      onUpdate({
        type: 'complete',
        ...data
      });
    },
    
    onError: (error) => {
      throw new Error(error);
    }
  });

  return finalResult;
}

export default StreamingPolicyGenerator;
