import { create } from 'zustand';
import { PlatformService, PlatformLink } from '@/lib/api/platform.service';
import { ProblemService, Problem } from '@/lib/api/problem.service';
import { GUEST_PLATFORMS, GUEST_STARRED_PROBLEMS, GUEST_STARRED_COUNT } from '@/lib/guest-data';

interface DashboardState {
  // Data
  platforms: PlatformLink[];
  problems: Problem[];
  starredProblems: Problem[];
  starredCount: number;

  // Loading states
  platformsLoaded: boolean;
  problemsLoaded: boolean;
  starredLoaded: boolean;
  loading: boolean;

  // Actions
  fetchPlatforms: (isGuest?: boolean) => Promise<PlatformLink[]>;
  fetchProblems: (isGuest?: boolean) => Promise<Problem[]>;
  fetchStarred: (isGuest?: boolean) => Promise<void>;
  fetchAll: (isGuest?: boolean) => Promise<void>;
  invalidatePlatforms: () => void;
  invalidateProblems: () => void;
  invalidateAll: () => void;
  updateStarredLocally: (problemId: number) => void;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  platforms: [],
  problems: [],
  starredProblems: [],
  starredCount: 0,
  platformsLoaded: false,
  problemsLoaded: false,
  starredLoaded: false,
  loading: false,

  fetchPlatforms: async (isGuest = false) => {
    // Return cached data if already loaded
    if (get().platformsLoaded) return get().platforms;

    if (isGuest) {
      const data = GUEST_PLATFORMS as any;
      set({ platforms: data, platformsLoaded: true });
      return data;
    }

    try {
      const data = await PlatformService.getUserPlatforms();
      set({ platforms: data, platformsLoaded: true });
      return data;
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
      set({ platformsLoaded: true });
      return [];
    }
  },

  fetchProblems: async (isGuest = false) => {
    if (get().problemsLoaded) return get().problems;

    if (isGuest) {
      set({ problems: [], problemsLoaded: true });
      return [];
    }

    try {
      const data = await ProblemService.getAll();
      set({ problems: data, problemsLoaded: true });
      return data;
    } catch (err) {
      console.error('Failed to fetch problems:', err);
      set({ problemsLoaded: true });
      return [];
    }
  },

  fetchStarred: async (isGuest = false) => {
    if (get().starredLoaded) return;

    if (isGuest) {
      set({
        starredProblems: GUEST_STARRED_PROBLEMS as any,
        starredCount: GUEST_STARRED_COUNT,
        starredLoaded: true,
      });
      return;
    }

    try {
      const [starred, count] = await Promise.all([
        ProblemService.getStarred().catch(() => []),
        ProblemService.getStarredCount().catch(() => 0),
      ]);
      set({ starredProblems: starred, starredCount: count, starredLoaded: true });
    } catch (err) {
      console.error('Failed to fetch starred:', err);
      set({ starredLoaded: true });
    }
  },

  fetchAll: async (isGuest = false) => {
    set({ loading: true });
    await Promise.all([
      get().fetchPlatforms(isGuest),
      get().fetchProblems(isGuest),
      get().fetchStarred(isGuest),
    ]);
    set({ loading: false });
  },

  invalidatePlatforms: () => set({ platformsLoaded: false }),
  invalidateProblems: () => set({ problemsLoaded: false, starredLoaded: false }),
  invalidateAll: () => set({
    platformsLoaded: false,
    problemsLoaded: false,
    starredLoaded: false,
    platforms: [],
    problems: [],
    starredProblems: [],
    starredCount: 0,
  }),

  // Optimistic update for unstar action
  updateStarredLocally: (problemId: number) => {
    const state = get();
    set({
      starredProblems: state.starredProblems.filter(p => p.id !== problemId),
      starredCount: Math.max(0, state.starredCount - 1),
    });
  },
}));
