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
    const response = await api.post('/execute', data);
    return response.data;
  }
};
