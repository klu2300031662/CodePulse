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
  getAll: async () => {
    const response = await api.get('/problems');
    return response.data;
  },

  create: async (data: Problem) => {
    const response = await api.post('/problems', data);
    return response.data;
  },

  update: async (id: number, data: Problem) => {
    const response = await api.put(`/problems/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/problems/${id}`);
    return response.data;
  }
};
