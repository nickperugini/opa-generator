import axios from 'axios';

// API configuration
const API_BASE_URL = 'https://sw9i8ofa62.execute-api.us-east-1.amazonaws.com/dev';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const generatePolicy = async (request: any): Promise<any> => {
  try {
    const response = await api.post('/generate-policy', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data;
      throw new Error(apiError.error || 'Failed to generate policy');
    }
    throw new Error('Network error occurred');
  }
};

export const iteratePolicy = async (instructions: string, existingPolicy: string, context?: any): Promise<any> => {
  try {
    const request = {
      instructions,
      context: {
        existing_policy: existingPolicy,
        user_id: 'demo-user',
        session_id: Date.now().toString(),
        ...context
      }
    };
    const response = await api.post('/generate-policy', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data;
      throw new Error(apiError.error || 'Failed to iterate policy');
    }
    throw new Error('Network error occurred');
  }
};

export const checkHealth = async (): Promise<any> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data;
      throw new Error(apiError.error || 'Health check failed');
    }
    throw new Error('Network error occurred');
  }
};

export default api;
