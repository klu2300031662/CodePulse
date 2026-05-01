import api from './axios';

export interface ExecuteRequest {
  language: string;
  code: string;
  input?: string;
}

export interface ExecuteResponse {
  status: string;
  output: string;
  error: string;
  executionTimeMs: number;
  memoryUsage?: string;
  timeComplexityEstimate: string;
  spaceComplexityEstimate: string;
}

export const TerminalService = {
  execute: async (data: ExecuteRequest): Promise<ExecuteResponse> => {
    try {
      const response = await api.post('/execute', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Code execution failed.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. The backend may be starting up — please try again in a moment.');
      }
      throw new Error('An unexpected error occurred during code execution.');
    }
  }
};
