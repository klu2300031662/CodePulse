/**
 * Mock/demo data for Guest Mode
 * Provides realistic-looking dashboard data for non-authenticated users
 */

export const GUEST_USER = {
  id: 0,
  username: 'guest_user',
  name: 'Guest User',
  email: 'guest@codepulse.demo',
  token: 'guest-mode-token',
  isGuest: true,
};

export const GUEST_PLATFORMS = [
  {
    id: 1,
    platformName: 'LeetCode',
    platformUsername: 'demo_coder',
    totalSolved: 247,
    easySolved: 102,
    mediumSolved: 118,
    hardSolved: 27,
    ranking: 85432,
    contestRating: 1654,
    lastSynced: new Date().toISOString(),
  },
  {
    id: 2,
    platformName: 'Codeforces',
    platformUsername: 'demo_coder',
    totalSolved: 183,
    easySolved: 75,
    mediumSolved: 82,
    hardSolved: 26,
    ranking: 42100,
    contestRating: 1423,
    lastSynced: new Date().toISOString(),
  },
  {
    id: 3,
    platformName: 'CodeChef',
    platformUsername: 'demo_coder',
    totalSolved: 96,
    easySolved: 45,
    mediumSolved: 38,
    hardSolved: 13,
    ranking: 15200,
    contestRating: 1812,
    lastSynced: new Date().toISOString(),
  },
];

export const GUEST_RECENT_ACTIVITY = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', platform: 'LeetCode', date: '2 hours ago', status: 'Solved' },
  { id: 2, title: 'Merge Intervals', difficulty: 'Medium', platform: 'LeetCode', date: '5 hours ago', status: 'Solved' },
  { id: 3, title: 'LRU Cache', difficulty: 'Hard', platform: 'LeetCode', date: '1 day ago', status: 'Attempted' },
  { id: 4, title: 'Binary Search', difficulty: 'Easy', platform: 'Codeforces', date: '1 day ago', status: 'Solved' },
  { id: 5, title: 'Graph Coloring', difficulty: 'Medium', platform: 'CodeChef', date: '2 days ago', status: 'Solved' },
];

export const GUEST_TOPIC_STATS = [
  { topic: 'Arrays', solved: 68, total: 100 },
  { topic: 'Dynamic Programming', solved: 32, total: 80 },
  { topic: 'Trees', solved: 45, total: 70 },
  { topic: 'Graphs', solved: 28, total: 60 },
  { topic: 'Strings', solved: 55, total: 75 },
  { topic: 'Binary Search', solved: 22, total: 35 },
];

export const GUEST_CONTESTS = [
  {
    id: 1,
    name: 'Weekly Contest 398',
    platform: 'LeetCode',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: '1h 30m',
  },
  {
    id: 2,
    name: 'Codeforces Round #950',
    platform: 'Codeforces',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: '2h',
  },
  {
    id: 3,
    name: 'Starters 138',
    platform: 'CodeChef',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: '2h',
  },
];

export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.user?.isGuest === true;
    } catch {
      return false;
    }
  }
  return false;
}
