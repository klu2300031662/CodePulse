import api from './axios';

export interface PlatformAnalytics {
  platform: string;
  username: string;
  fetchedAt: string;
  error?: string;
  note?: string;

  // LeetCode
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  totalSolved?: number;
  totalSubmissions?: number;
  acceptanceRate?: number;
  ranking?: number;
  contestRating?: number;
  contestsAttended?: number;
  globalRanking?: number;
  topPercentage?: number;
  submissionCalendar?: string;

  // Codeforces
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  contribution?: number;
  friendOfCount?: number;
  contestHistory?: Array<{
    contestName: string;
    rank: number;
    oldRating: number;
    newRating: number;
  }>;

  // CodeChef
  currentRating?: number;
  highestRating?: number;
  stars?: string;
  globalRank?: number;
  countryRank?: number;
  recentContests?: Array<{
    name: string;
    rating: number;
    rank: number;
  }>;

  // HackerRank
  skills?: Array<{ name: string; score: number }>;
  badges?: Array<{ name: string; stars: number }>;

  // GFG
  score?: number;
  streak?: number;
  maxStreak?: number;
  instituteRank?: string;

  // InterviewBit (limited)
  [key: string]: any;
}

// Client-side cache (10 min TTL)
const CACHE_TTL = 10 * 60 * 1000;
const analyticsCache = new Map<number, { data: PlatformAnalytics; ts: number }>();

export const AnalyticsService = {
  getPlatformAnalytics: async (platformId: number): Promise<PlatformAnalytics> => {
    // Check cache
    const cached = analyticsCache.get(platformId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.data;
    }

    try {
      const response = await api.get(`/platforms/${platformId}/analytics`);
      const data = response.data as PlatformAnalytics;
      analyticsCache.set(platformId, { data, ts: Date.now() });
      return data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.backendMessage || 'Failed to fetch platform analytics.');
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      }
      throw new Error('An unexpected error occurred while fetching analytics.');
    }
  },

  invalidateCache: (platformId?: number) => {
    if (platformId) {
      analyticsCache.delete(platformId);
    } else {
      analyticsCache.clear();
    }
  }
};
