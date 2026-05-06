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

export interface ComplexityAnalysis {
  timeComplexity: string;
  timeExplanation: string;
  spaceComplexity: string;
  spaceExplanation: string;
  reasoning: string;
  source: 'ai' | 'heuristic';
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
  },

  analyzeComplexity: async (code: string, language: string): Promise<ComplexityAnalysis> => {
    try {
      const response = await fetch('/api/analyze-complexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Complexity analysis failed.');
    }
  }
};
