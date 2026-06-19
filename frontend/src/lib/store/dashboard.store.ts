import { create } from 'zustand';
import { PlatformService, PlatformLink } from '@/lib/api/platform.service';
import { ProblemService, Problem } from '@/lib/api/problem.service';
import { PlatformAnalytics } from '@/lib/api/analytics.service';
import { GUEST_PLATFORMS, isGuestMode } from '@/lib/guest-data';

interface CachedContest {
  platform: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  url: string;
  status: 'upcoming' | 'ongoing';
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'codepulse_dashboard_cache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function saveToStorage<T>(key: string, data: T) {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify(entry));
  } catch {}
}

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    // Return data even if stale (component will refresh in background)
    return entry.data;
  } catch {
    return null;
  }
}

function isStale(key: string): boolean {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (!raw) return true;
    const entry = JSON.parse(raw);
    return Date.now() - entry.timestamp > CACHE_TTL;
  } catch {
    return true;
  }
}

interface DashboardState {
  // Data
  platforms: PlatformLink[];
  problems: Problem[];
  analyticsCache: Record<string, PlatformAnalytics>;
  contestsCache: { data: CachedContest[]; fetchedAt: number } | null;

  // Loading states
  platformsLoaded: boolean;
  problemsLoaded: boolean;
  loading: boolean;

  // Actions
  fetchPlatforms: (isGuest?: boolean) => Promise<PlatformLink[]>;
  fetchProblems: (isGuest?: boolean) => Promise<Problem[]>;
  fetchAll: (isGuest?: boolean) => Promise<void>;
  refreshInBackground: (isGuest?: boolean) => void;
  invalidatePlatforms: () => void;
  invalidateProblems: () => void;
  invalidateAll: () => void;

  // Analytics cache
  setAnalyticsForPlatform: (platform: string, data: PlatformAnalytics) => void;
  getAnalyticsForPlatform: (platform: string) => PlatformAnalytics | null;
  clearAnalyticsForPlatform: (platform: string) => void;

  // Contests cache
  setContestsCache: (data: CachedContest[]) => void;
  getContestsCache: () => { data: CachedContest[]; fetchedAt: number } | null;
  invalidateContests: () => void;

  // Optimistic updates
  setPlatforms: (platforms: PlatformLink[]) => void;
  removePlatformOptimistic: (id: number) => void;
  addPlatformOptimistic: (platform: PlatformLink) => void;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  // Initialize from localStorage cache for instant render
  platforms: (typeof window !== 'undefined' && !isGuestMode() ? loadFromStorage<PlatformLink[]>('platforms') : null) || [],
  problems: (typeof window !== 'undefined' && !isGuestMode() ? loadFromStorage<Problem[]>('problems') : null) || [],
  analyticsCache: (typeof window !== 'undefined' ? loadFromStorage<Record<string, PlatformAnalytics>>('analytics') : null) || {},
  contestsCache: (typeof window !== 'undefined' ? loadFromStorage<{ data: CachedContest[]; fetchedAt: number }>('contests') : null) || null,
  platformsLoaded: false,
  problemsLoaded: false,
  loading: false,

  fetchPlatforms: async (isGuest = false) => {
    if (isGuest) {
      set({ platforms: [], platformsLoaded: true });
      return [];
    }

    const state = get();

    // If loaded in memory, return instantly
    if (state.platformsLoaded) return state.platforms;

    // Try localStorage first for instant render
    const cached = loadFromStorage<PlatformLink[]>('platforms');
    if (cached && cached.length > 0 && !isStale('platforms')) {
      set({ platforms: cached, platformsLoaded: true });
      return cached;
    }

    // If we have stale cache, use it immediately but refresh in background
    if (cached && cached.length > 0) {
      set({ platforms: cached, platformsLoaded: true });
      // Background refresh
      if (!isGuest) {
        PlatformService.getUserPlatforms()
          .then(data => {
            set({ platforms: data });
            saveToStorage('platforms', data);
          })
          .catch(() => {});
      }
      return cached;
    }

    if (isGuest) {
      const data: any[] = [];
      set({ platforms: data, platformsLoaded: true });
      return data;
    }

    try {
      const data = await PlatformService.getUserPlatforms();
      set({ platforms: data, platformsLoaded: true });
      saveToStorage('platforms', data);
      return data;
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
      set({ platformsLoaded: true });
      return [];
    }
  },

  fetchProblems: async (isGuest = false) => {
    if (isGuest) {
      set({ problems: [], problemsLoaded: true });
      return [];
    }

    const state = get();

    if (state.problemsLoaded) return state.problems;

    const cached = loadFromStorage<Problem[]>('problems');
    if (cached && cached.length > 0 && !isStale('problems')) {
      set({ problems: cached, problemsLoaded: true });
      return cached;
    }

    if (cached && cached.length > 0) {
      set({ problems: cached, problemsLoaded: true });
      if (!isGuest) {
        ProblemService.getAll()
          .then(data => {
            set({ problems: data });
            saveToStorage('problems', data);
          })
          .catch(() => {});
      }
      return cached;
    }

    if (isGuest) {
      set({ problems: [], problemsLoaded: true });
      return [];
    }

    try {
      const data = await ProblemService.getAll();
      set({ problems: data, problemsLoaded: true });
      saveToStorage('problems', data);
      return data;
    } catch (err) {
      console.error('Failed to fetch problems:', err);
      set({ problemsLoaded: true });
      return [];
    }
  },

  fetchAll: async (isGuest = false) => {
    set({ loading: true });
    await Promise.all([
      get().fetchPlatforms(isGuest),
      get().fetchProblems(isGuest),
    ]);
    set({ loading: false });
  },

  // Silent background refresh (called on tab switch)
  refreshInBackground: (isGuest = false) => {
    if (isGuest) return;
    PlatformService.getUserPlatforms()
      .then(data => {
        set({ platforms: data });
        saveToStorage('platforms', data);
      })
      .catch(() => {});
    ProblemService.getAll()
      .then(data => {
        set({ problems: data });
        saveToStorage('problems', data);
      })
      .catch(() => {});
  },

  invalidatePlatforms: () => {
    set({ platformsLoaded: false });
    try { localStorage.removeItem(`${CACHE_KEY}_platforms`); } catch {}
  },
  invalidateProblems: () => {
    set({ problemsLoaded: false });
    try { localStorage.removeItem(`${CACHE_KEY}_problems`); } catch {}
  },
  invalidateAll: () => {
    set({
      platformsLoaded: false,
      problemsLoaded: false,
      platforms: [],
      problems: [],
    });
    try {
      localStorage.removeItem(`${CACHE_KEY}_platforms`);
      localStorage.removeItem(`${CACHE_KEY}_problems`);
    } catch {}
  },

  // Optimistic updates — instant UI changes
  setPlatforms: (platforms: PlatformLink[]) => {
    set({ platforms, platformsLoaded: true });
    saveToStorage('platforms', platforms);
  },

  removePlatformOptimistic: (id: number) => {
    const updated = get().platforms.filter(p => p.id !== id);
    set({ platforms: updated });
    saveToStorage('platforms', updated);
  },

  addPlatformOptimistic: (platform: PlatformLink) => {
    const updated = [...get().platforms, platform];
    set({ platforms: updated });
    saveToStorage('platforms', updated);
  },

  // Analytics cache — persists across tab switches
  setAnalyticsForPlatform: (platform: string, data: PlatformAnalytics) => {
    const updated = { ...get().analyticsCache, [platform]: data };
    set({ analyticsCache: updated });
    saveToStorage('analytics', updated);
  },
  getAnalyticsForPlatform: (platform: string) => {
    return get().analyticsCache[platform] || null;
  },
  clearAnalyticsForPlatform: (platform: string) => {
    const updated = { ...get().analyticsCache };
    delete updated[platform];
    set({ analyticsCache: updated });
    saveToStorage('analytics', updated);
  },

  // Contests cache — persists across tab switches
  setContestsCache: (data: CachedContest[]) => {
    const cache = { data, fetchedAt: Date.now() };
    set({ contestsCache: cache });
    saveToStorage('contests', cache);
  },
  getContestsCache: () => {
    return get().contestsCache;
  },
  invalidateContests: () => {
    set({ contestsCache: null });
    try { localStorage.removeItem(`${CACHE_KEY}_contests`); } catch {}
  },
}));
