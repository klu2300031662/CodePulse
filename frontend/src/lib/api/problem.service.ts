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
  starred?: boolean;
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

  getStarred: async (): Promise<Problem[]> => {
    try {
      const response = await api.get('/problems/starred');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to load starred problems.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while loading starred problems.');
    }
  },

  getStarredCount: async (): Promise<number> => {
    try {
      const response = await api.get('/problems/starred/count');
      return response.data.count;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to load starred count.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred.');
    }
  },

  toggleStar: async (id: number): Promise<Problem> => {
    try {
      const response = await api.patch(`/problems/${id}/star`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to toggle star.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred.');
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
