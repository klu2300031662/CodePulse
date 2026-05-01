import api from './axios';

export interface PlatformLink {
  id: number;
  platformName: string;
  username: string;
  profileUrl: string;
  isSynced: boolean;
  lastSyncedAt: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export const PlatformService = {
  getUserPlatforms: async (): Promise<PlatformLink[]> => {
    try {
      const response = await api.get('/platforms');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to load platforms.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while loading platforms.');
    }
  },

  linkPlatform: async (data: { platformName: string, username: string, profileUrl?: string }): Promise<PlatformLink> => {
    try {
      const response = await api.post('/platforms', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to link platform.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while linking the platform.');
    }
  },

  removePlatform: async (id: number): Promise<void> => {
    try {
      await api.delete(`/platforms/${id}`);
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to remove platform.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while removing the platform.');
    }
  }
};
