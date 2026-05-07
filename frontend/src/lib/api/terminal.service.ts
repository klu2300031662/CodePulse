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
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok && !result.status) {
        throw new Error(result.error || 'Code execution failed.');
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'An unexpected error occurred during code execution.');
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
