"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, ExternalLink, RefreshCw, Loader2, Trophy, Zap, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardStore } from "@/lib/store/dashboard.store"

interface Contest {
  platform: string
  title: string
  startTime: number
  endTime: number
  duration: number
  url: string
  status: "upcoming" | "ongoing"
}

const platformBadge: Record<string, string> = {
  LeetCode: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  Codeforces: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  CodeChef: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  HackerRank: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20",
  HackerEarth: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20",
  AtCoder: "bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/20",
  TopCoder: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
  Google: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
}

const platformIcon: Record<string, string> = {
  LeetCode: "🟡",
  Codeforces: "🔵",
  CodeChef: "🟤",
  HackerRank: "🟢",
  HackerEarth: "🔷",
  AtCoder: "⚪",
  TopCoder: "🟣",
  Google: "🔴",
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function timeUntil(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = timestamp - now
  if (diff <= 0) return "Started"
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const STALE_MS = 5 * 60 * 1000 // 5 min

export default function ContestsPage() {
  const { contestsCache, setContestsCache, invalidateContests } = useDashboardStore()

  // Always initialize from cache instantly — never show loading spinner
  const [contests, setContests] = useState<Contest[]>(contestsCache?.data || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<string>("all")
  const [lastFetched, setLastFetched] = useState<Date | null>(
    contestsCache ? new Date(contestsCache.fetchedAt) : null
  )
  const hasFetched = useRef(false)

  const fetchContests = async (silent = false) => {
    if (!silent) setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/contests")
      if (!res.ok) throw new Error("Failed to fetch contests")
      const data = await res.json()
      const list = data.contests || []
      setContests(list)
      setContestsCache(list)
      setLastFetched(new Date())
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to load contests")
    } finally {
      setLoading(false)
    }
  }

  // Always fetch silently in background — never block the UI
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    if (contestsCache && Date.now() - contestsCache.fetchedAt < STALE_MS) {
      // Cache is fresh — use it, don't re-fetch
      return
    }

    // Always fetch silently (data from cache shows instantly)
    fetchContests(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync from store if cache updates (e.g. from dashboard pre-fetch)
  useEffect(() => {
    if (contestsCache?.data && contestsCache.data.length > 0 && contests.length === 0) {
      setContests(contestsCache.data)
      setLastFetched(new Date(contestsCache.fetchedAt))
    }
  }, [contestsCache]) // eslint-disable-line react-hooks/exhaustive-deps

  // Get unique platforms from contests
  const allPlatforms = Array.from(new Set(contests.map(c => c.platform))).sort()

  // Filter contests
  const filteredContests = filter === "all"
    ? contests
    : contests.filter(c => c.platform === filter)

  const ongoingCount = contests.filter(c => c.status === "ongoing").length

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Upcoming Contests
            {ongoingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <Zap className="h-3 w-3" /> {ongoingCount} Live
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">
            Real-time contest schedule from all major coding platforms.
            {lastFetched && (
              <span className="ml-2 text-xs opacity-60">
                Updated {lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST
              </span>
            )}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => fetchContests(false)} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Platform filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
            filter === "all"
              ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-500/30 shadow-sm"
              : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-500/25"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Filter className="h-3 w-3" /> All ({contests.length})
          </span>
        </button>
        {allPlatforms.map(p => {
          const count = contests.filter(c => c.platform === p).length
          return (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                filter === p
                  ? (platformBadge[p] || "bg-zinc-100 text-zinc-600 border-zinc-300") + " shadow-sm"
                  : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-500/25"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {platformIcon[p] || "⚪"} {p} ({count})
              </span>
            </button>
          )
        })}
      </div>

      <Card className="group relative overflow-hidden shadow-sm border-zinc-200 dark:border-zinc-800 transition-all duration-500 hover:border-violet-300 dark:hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10">
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-500 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10 dark:group-hover:opacity-20" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Global Contest Schedule
          </CardTitle>
          <CardDescription>
            Live data from LeetCode, Codeforces, CodeChef, HackerRank, AtCoder & more
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date & Time</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Starts In</TableHead>
                  <TableHead className="text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Fetching live contest data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="text-red-500 space-y-2">
                        <p>{error}</p>
                        <Button variant="outline" size="sm" onClick={fetchContests}>Retry</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredContests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No upcoming contests found{filter !== "all" ? ` for ${filter}` : ""}.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContests.slice(0, 50).map((contest, idx) => {
                    const startDate = new Date(contest.startTime * 1000)
                    const badge = platformBadge[contest.platform] || "bg-zinc-100 text-zinc-600 border-zinc-300"
                    const icon = platformIcon[contest.platform] || "⚪"
                    const isOngoing = contest.status === "ongoing"

                    return (
                      <TableRow key={idx} className={isOngoing ? "bg-emerald-50/30 dark:bg-emerald-500/[0.03]" : ""}>
                        <TableCell className="font-medium max-w-[300px]">
                          <span className="truncate block">{contest.title}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge}`}>
                            {icon} {contest.platform}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isOngoing ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Upcoming</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="flex items-center gap-1.5 text-xs">
                              <Calendar className="w-3 h-3" />
                              {startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] opacity-70">
                              <Clock className="w-2.5 h-2.5" />
                              {startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDuration(contest.duration)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isOngoing ? (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Now</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{timeUntil(contest.startTime)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={contest.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {!loading && filteredContests.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Showing {Math.min(filteredContests.length, 50)} of {filteredContests.length} contests • Data from kontests.net
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
