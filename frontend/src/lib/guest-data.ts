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
    username: 'demo_coder',
    profileUrl: 'https://leetcode.com/demo_coder/',
    isSynced: true,
    totalSolved: 247,
    easySolved: 102,
    mediumSolved: 118,
    hardSolved: 27,
    ranking: 85432,
    contestRating: 1654,
    lastSyncedAt: new Date().toISOString(),
  },
  {
    id: 2,
    platformName: 'Codeforces',
    username: 'demo_coder',
    profileUrl: 'https://codeforces.com/profile/demo_coder',
    isSynced: true,
    totalSolved: 183,
    easySolved: 75,
    mediumSolved: 82,
    hardSolved: 26,
    ranking: 42100,
    contestRating: 1423,
    lastSyncedAt: new Date().toISOString(),
  },
  {
    id: 3,
    platformName: 'CodeChef',
    username: 'demo_coder',
    profileUrl: 'https://codechef.com/users/demo_coder',
    isSynced: true,
    totalSolved: 96,
    easySolved: 45,
    mediumSolved: 38,
    hardSolved: 13,
    ranking: 15200,
    contestRating: 1812,
    lastSyncedAt: new Date().toISOString(),
  },
];

export const GUEST_RECENT_ACTIVITY = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', platform: 'LeetCode', date: '2 hours ago', status: 'Solved' },
  { id: 2, title: 'Merge Intervals', difficulty: 'Medium', platform: 'LeetCode', date: '5 hours ago', status: 'Solved' },
  { id: 3, title: 'LRU Cache', difficulty: 'Hard', platform: 'LeetCode', date: '1 day ago', status: 'Attempted' },
  { id: 4, title: 'Binary Search', difficulty: 'Easy', platform: 'Codeforces', date: '1 day ago', status: 'Solved' },
  { id: 5, title: 'Graph Coloring', difficulty: 'Medium', platform: 'CodeChef', date: '2 days ago', status: 'Solved' },
];

export const GUEST_STARRED_COUNT = 5;

export const GUEST_STARRED_PROBLEMS = [
  { id: 1, title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/', platform: 'LeetCode', difficulty: 'Easy', status: 'Solved', dateSolved: '2026-05-04', notes: '', tags: 'arrays,hash-map', starred: true },
  { id: 2, title: 'Merge Intervals', url: 'https://leetcode.com/problems/merge-intervals/', platform: 'LeetCode', difficulty: 'Medium', status: 'Solved', dateSolved: '2026-05-03', notes: '', tags: 'sorting,intervals', starred: true },
  { id: 3, title: 'LRU Cache', url: 'https://leetcode.com/problems/lru-cache/', platform: 'LeetCode', difficulty: 'Hard', status: 'Solved', dateSolved: '2026-05-02', notes: '', tags: 'design,linked-list', starred: true },
  { id: 4, title: 'Binary Search', url: 'https://codeforces.com/problemset/problem/1760/A', platform: 'Codeforces', difficulty: 'Easy', status: 'Solved', dateSolved: '2026-05-01', notes: '', tags: 'binary-search', starred: true },
  { id: 5, title: 'Graph Coloring', url: 'https://www.codechef.com/problems/GRAPHCOL', platform: 'CodeChef', difficulty: 'Medium', status: 'Solved', dateSolved: '2026-04-30', notes: '', tags: 'graphs', starred: true },
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
