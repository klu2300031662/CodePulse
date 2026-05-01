import api from './axios';

export interface Problem {
  id?: number;
  title: string;
  url: string;
  platform: string;
  difficulty: string;
  status: string;
  dateSolved: string;
  notes: string;
  tags: string;
}

export const ProblemService = {
  getAll: async (): Promise<Problem[]> => {
    try {
      const response = await api.get('/problems');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to load problems.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while loading problems.');
    }
  },

  create: async (data: Problem): Promise<Problem> => {
    try {
      const response = await api.post('/problems', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to create problem.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while creating the problem.');
    }
  },

  update: async (id: number, data: Problem): Promise<Problem> => {
    try {
      const response = await api.put(`/problems/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to update problem.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while updating the problem.');
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/problems/${id}`);
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to delete problem.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while deleting the problem.');
    }
  }
};
