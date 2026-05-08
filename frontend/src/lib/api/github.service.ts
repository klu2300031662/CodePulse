import api from './axios';

export interface GitHubLinkData {
  linked: boolean;
  githubUsername?: string;
  linkedAt?: string;
  lastSyncedAt?: string;
}

export const GitHubService = {
  /**
   * Get the linked GitHub username from the backend.
   */
  getGitHubLink: async (): Promise<GitHubLinkData> => {
    try {
      const response = await api.get('/github');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to load GitHub link.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while loading GitHub link.');
    }
  },

  /**
   * Link a GitHub username (persists to database).
   */
  linkGitHub: async (githubUsername: string): Promise<GitHubLinkData> => {
    try {
      const response = await api.post('/github', { githubUsername });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to link GitHub.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while linking GitHub.');
    }
  },

  /**
   * Unlink GitHub account (removes from database).
   */
  unlinkGitHub: async (): Promise<void> => {
    try {
      await api.delete('/github');
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to unlink GitHub.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while unlinking GitHub.');
    }
  },

  /**
   * Update the last synced timestamp on the backend.
   */
  updateSyncTime: async (): Promise<GitHubLinkData> => {
    try {
      const response = await api.put('/github/sync');
      return response.data;
    } catch (error: any) {
      // Non-critical — don't throw, just log
      console.warn('Failed to update GitHub sync time:', error);
      return { linked: true };
    }
  },
};
