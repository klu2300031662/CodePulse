import { create } from 'zustand';
import { PlatformService, PlatformLink } from '@/lib/api/platform.service';
import { ProblemService, Problem } from '@/lib/api/problem.service';
import { GUEST_PLATFORMS } from '@/lib/guest-data';

interface DashboardState {
  // Data
  platforms: PlatformLink[];
  problems: Problem[];

  // Loading states
  platformsLoaded: boolean;
  problemsLoaded: boolean;
  loading: boolean;

  // Actions
  fetchPlatforms: (isGuest?: boolean) => Promise<PlatformLink[]>;
  fetchProblems: (isGuest?: boolean) => Promise<Problem[]>;
  fetchAll: (isGuest?: boolean) => Promise<void>;
  invalidatePlatforms: () => void;
  invalidateProblems: () => void;
  invalidateAll: () => void;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  platforms: [],
  problems: [],
  platformsLoaded: false,
  problemsLoaded: false,
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

  fetchAll: async (isGuest = false) => {
    set({ loading: true });
    await Promise.all([
      get().fetchPlatforms(isGuest),
      get().fetchProblems(isGuest),
    ]);
    set({ loading: false });
  },

  invalidatePlatforms: () => set({ platformsLoaded: false }),
  invalidateProblems: () => set({ problemsLoaded: false }),
  invalidateAll: () => set({
    platformsLoaded: false,
    problemsLoaded: false,
    platforms: [],
    problems: [],
  }),
}));
