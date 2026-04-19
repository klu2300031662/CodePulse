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
    const response = await api.get('/platforms');
    return response.data;
  },

  linkPlatform: async (data: { platformName: string, username: string, profileUrl?: string }): Promise<PlatformLink> => {
    const response = await api.post('/platforms', data);
    return response.data;
  },

  removePlatform: async (id: number): Promise<void> => {
    await api.delete(`/platforms/${id}`);
  }
};
