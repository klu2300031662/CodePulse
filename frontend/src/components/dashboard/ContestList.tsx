"use client"

import { useEffect, useState } from "react"
import { Trophy, ExternalLink, Clock, Loader2, Link2 } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import Link from "next/link"

type Contest = {
  platform: string
  title: string
  startTime: number
  url: string
}

const platformColors: Record<string, string> = {
  LeetCode: "from-amber-500 to-orange-500",
  Codeforces: "from-blue-500 to-indigo-500",
  CodeChef: "from-emerald-500 to-green-500",
  HackerRank: "from-green-500 to-emerald-500",
  HackerEarth: "from-cyan-500 to-blue-500",
  AtCoder: "from-gray-500 to-zinc-500",
  default: "from-violet-500 to-purple-500",
}

const platformBadgeColors: Record<string, string> = {
  LeetCode: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  Codeforces: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  CodeChef: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  HackerRank: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20",
  HackerEarth: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20",
  AtCoder: "bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-500/20",
  default: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
}

function getTimeRemaining(startTime: number): string {
  const now = Date.now()
  const diff = startTime * 1000 - now
  if (diff <= 0) return "Started"
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const CONTEST_CACHE_KEY = "codepulse_contests_cache";

function getCachedContests(): Contest[] {
  try {
    const raw = localStorage.getItem(CONTEST_CACHE_KEY);
    if (!raw) return [];
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < 30 * 60 * 1000 && data?.length > 0) return data;
    return data || [];
  } catch { return []; }
}

function setCachedContests(data: Contest[]) {
  try {
    localStorage.setItem(CONTEST_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export default function ContestList() {
  const cached = typeof window !== "undefined" ? getCachedContests() : [];
  const [allContests, setAllContests] = useState<Contest[]>(cached)
  const [loading, setLoading] = useState(cached.length === 0)
  const user = useAuthStore((state) => state.user) as any
  const platforms = useDashboardStore((state) => state.platforms)

  // Get linked platform names (normalized for matching)
  const linkedPlatformNames = platforms.map((p: any) => p.platformName)

  useEffect(() => {
    if (user?.isGuest) {
      setLoading(false)
      return
    }
    // Fetch live contest data
    fetch("/api/contests")
      .then((res) => res.json())
      .then((data) => {
        const mapped = (data.contests || []).map((c: any) => ({
          platform: c.platform,
          title: c.title,
          startTime: c.startTime,
          url: c.url,
        }))
        setAllContests(mapped)
        setCachedContests(mapped)
      })
      .catch((err) => console.error("Contest fetch error", err))
      .finally(() => setLoading(false))
  }, [user?.isGuest])

  // Filter contests to only linked platforms
  const filteredContests = allContests.filter((c) => {
    return linkedPlatformNames.some((name: string) =>
      c.platform.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(c.platform.toLowerCase())
    )
  })

  const upcomingContests = filteredContests
    .filter((c) => c.startTime * 1000 > Date.now())
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 6)

  const noPlatformsLinked = linkedPlatformNames.length === 0

  return (
    <div className="group relative rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-violet-300 dark:hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10 hover:-translate-y-[2px]">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 dark:group-hover:opacity-30" />
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Upcoming Contests</h3>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          {noPlatformsLinked ? "No platforms" : `${upcomingContests.length} upcoming`}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5 max-h-[420px] overflow-y-auto scrollbar-thin">
        {noPlatformsLinked ? (
          /* No platforms linked — prompt user */
          <div className="text-center py-10">
            <div className="h-12 w-12 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
              <Link2 className="h-6 w-6 text-violet-500" />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No platforms linked</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[220px] mx-auto">
              Link your coding platforms to see upcoming contests
            </p>
            <Link
              href="/dashboard/platforms"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              <Link2 className="h-3.5 w-3.5" />
              Link Platforms
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-zinc-400 dark:text-zinc-500 animate-spin" />
            <span className="ml-2 text-sm text-zinc-400 dark:text-zinc-500">Loading contests...</span>
          </div>
        ) : upcomingContests.length > 0 ? (
          upcomingContests.map((contest, i) => (
            <button
              key={i}
              id={`contest-item-${i}`}
              onClick={() => window.open(contest.url, "_blank")}
              className="w-full group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-white/[0.04] text-left"
            >
              {/* Platform indicator */}
              <div
                className={`h-9 w-1 rounded-full bg-gradient-to-b ${
                  platformColors[contest.platform] || platformColors.default
                } opacity-60 group-hover:opacity-100 transition-opacity`}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white truncate transition-colors">
                  {contest.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                      platformBadgeColors[contest.platform] || platformBadgeColors.default
                    }`}
                  >
                    {contest.platform}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {getTimeRemaining(contest.startTime)}
                  </span>
                </div>
              </div>

              <ExternalLink className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors flex-shrink-0" />
            </button>
          ))
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No upcoming contests</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Your linked platforms have no scheduled contests</p>
          </div>
        )}
      </div>
    </div>
  )
}
