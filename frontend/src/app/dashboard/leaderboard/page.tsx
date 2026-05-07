"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Medal, Globe, Crown, TrendingUp, Loader2, RefreshCw } from "lucide-react"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import { useAuthStore } from "@/lib/store/auth.store"
import { AnalyticsService, PlatformAnalytics } from "@/lib/api/analytics.service"
import { Button } from "@/components/ui/button"
import GuestGate from "@/components/dashboard/GuestGate"

interface PlatformRank {
  platform: string
  username: string
  rank: number | string
  rating: number | string
  solved: number | string
  badge: string
}

// Generate a consistent color from username
function usernameToColor(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  const hue = ((hash % 360) + 360) % 360
  return `hsl(${hue}, 65%, 55%)`
}

function usernameToGradient(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  const hue1 = ((hash % 360) + 360) % 360
  const hue2 = (hue1 + 40) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 65%, 45%))`
}

const platformIcons: Record<string, string> = {
  LeetCode: "🟡",
  Codeforces: "🔵",
  CodeChef: "🟤",
  HackerRank: "🟢",
  GeeksForGeeks: "🟢",
  InterviewBit: "🔷",
  AtCoder: "⚪",
}

const platformBadgeStyles: Record<string, string> = {
  LeetCode: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  Codeforces: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  CodeChef: "bg-amber-50 dark:bg-amber-700/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-600/20",
  HackerRank: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20",
  GeeksForGeeks: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  InterviewBit: "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20",
}

function extractRankData(platform: string, data: PlatformAnalytics): Omit<PlatformRank, 'username' | 'platform'> {
  const name = platform.toLowerCase()

  if (name === 'leetcode') {
    return {
      rank: data.ranking || data.globalRanking || 'N/A',
      rating: data.contestRating || 'N/A',
      solved: data.totalSolved || 0,
      badge: data.topPercentage ? `Top ${data.topPercentage}%` : '',
    }
  }
  if (name === 'codeforces') {
    return {
      rank: data.rank || 'N/A',
      rating: data.rating || 'N/A',
      solved: data.totalSolved || 0,
      badge: data.maxRank || '',
    }
  }
  if (name === 'codechef') {
    return {
      rank: data.globalRank || 'N/A',
      rating: data.currentRating || 'N/A',
      solved: data.totalSolved || 0,
      badge: data.stars || '',
    }
  }
  if (name === 'hackerrank') {
    const totalBadges = data.badges?.length || 0
    return {
      rank: totalBadges > 0 ? `${totalBadges} badges` : 'N/A',
      rating: 'N/A',
      solved: data.totalSolved || 0,
      badge: '',
    }
  }
  if (name === 'geeksforgeeks') {
    return {
      rank: data.instituteRank || 'N/A',
      rating: data.score || 'N/A',
      solved: data.totalSolved || 0,
      badge: data.streak ? `🔥 ${data.streak} day streak` : '',
    }
  }

  return { rank: 'N/A', rating: 'N/A', solved: 0, badge: '' }
}

function getRankIcon(rank: number | string) {
  if (typeof rank === "string") return <Globe className="h-5 w-5 text-zinc-400" />
  if (rank <= 1000) return <Crown className="h-5 w-5 text-amber-500" />
  if (rank <= 10000) return <Trophy className="h-5 w-5 text-yellow-500" />
  if (rank <= 50000) return <Medal className="h-5 w-5 text-zinc-400" />
  return <TrendingUp className="h-5 w-5 text-zinc-400" />
}

export default function LeaderboardPage() {
  const user = useAuthStore((state) => state.user) as any
  const { platforms, fetchPlatforms, analyticsCache, setAnalyticsForPlatform } = useDashboardStore()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch platforms + analytics data
  useEffect(() => {
    if (user?.isGuest) { setLoading(false); return }
    async function loadData() {
      const plats = await fetchPlatforms(user?.isGuest)

      // Fetch analytics for platforms not yet cached
      const fetchPromises = plats.map(async (p) => {
        if (analyticsCache[p.platformName]) return
        try {
          const data = await AnalyticsService.getPlatformAnalytics(p.id)
          setAnalyticsForPlatform(p.platformName, data)
        } catch {}
      })

      await Promise.allSettled(fetchPromises)
      setLoading(false)
    }
    loadData()
  }, [user?.isGuest]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true)
    for (const p of platforms) {
      try {
        AnalyticsService.invalidateCache(p.id)
        const data = await AnalyticsService.getPlatformAnalytics(p.id)
        setAnalyticsForPlatform(p.platformName, data)
      } catch {}
    }
    setRefreshing(false)
  }

  // Build leaderboard from analytics cache
  const platformRanks = useMemo<PlatformRank[]>(() => {
    return platforms
      .map(p => {
        const data = analyticsCache[p.platformName]
        if (!data || data.isPrivate || data.error) {
          return {
            platform: p.platformName,
            username: p.username,
            rank: 'N/A' as const,
            rating: 'N/A' as const,
            solved: 0,
            badge: '',
          }
        }
        const extracted = extractRankData(p.platformName, data)
        return {
          platform: p.platformName,
          username: p.username,
          ...extracted,
        }
      })
      .sort((a, b) => {
        // Sort: numeric ranks first, N/A last
        const ra = typeof a.rank === 'number' ? a.rank : Infinity
        const rb = typeof b.rank === 'number' ? b.rank : Infinity
        return ra - rb
      })
  }, [platforms, analyticsCache])

  if (user?.isGuest) return <GuestGate />

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Global Leaderboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Your global rank across all linked competitive programming platforms.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Ranks
        </Button>
      </div>

      {/* Leaderboard Table */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Platform Rankings
          </CardTitle>
          <CardDescription>Real-time rankings fetched from your connected accounts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60px] text-center">#</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Global Rank</TableHead>
                <TableHead className="text-right">Solved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Fetching platform rankings...
                    </div>
                  </TableCell>
                </TableRow>
              ) : platformRanks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No platforms connected. Link your accounts from the Platforms page to see your global rankings.
                  </TableCell>
                </TableRow>
              ) : (
                platformRanks.map((entry, idx) => {
                  const bgColor = usernameToColor(entry.username)
                  const gradient = usernameToGradient(entry.username)
                  const initial = entry.username.charAt(0).toUpperCase()
                  const badgeStyle = platformBadgeStyles[entry.platform] || "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                  const icon = platformIcons[entry.platform] || "🔗"

                  return (
                    <TableRow key={idx} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                      <TableCell className="text-center">
                        <div className="flex justify-center">{getRankIcon(entry.rank)}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeStyle}`}>
                          {icon} {entry.platform}
                        </span>
                        {entry.badge && (
                          <span className="ml-2 text-[10px] text-muted-foreground">{entry.badge}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {/* Username initial badge with unique color */}
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                            style={{ background: gradient }}
                          >
                            {initial}
                          </div>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{entry.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-violet-600 dark:text-violet-400">
                          {typeof entry.rating === 'number' ? entry.rating.toLocaleString() : entry.rating}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {typeof entry.rank === 'number' ? `#${entry.rank.toLocaleString()}` : entry.rank}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {typeof entry.solved === 'number' ? entry.solved.toLocaleString() : entry.solved}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
