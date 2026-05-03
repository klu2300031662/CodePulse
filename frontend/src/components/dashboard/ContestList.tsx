"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api/axios"
import { Trophy, ExternalLink, Clock, Loader2 } from "lucide-react"

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
  LeetCode: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Codeforces: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CodeChef: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  HackerRank: "bg-green-500/10 text-green-400 border-green-500/20",
  HackerEarth: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  AtCoder: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  default: "bg-violet-500/10 text-violet-400 border-violet-500/20",
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

export default function ContestList() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get("/contests/all")
      .then((res) => {
        setContests(res.data || [])
      })
      .catch((err) => console.error("Contest fetch error", err))
      .finally(() => setLoading(false))
  }, [])

  const upcomingContests = contests
    .filter((c) => c.startTime * 1000 > Date.now())
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 6)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-white text-sm">Upcoming Contests</h3>
        </div>
        <span className="text-xs text-zinc-500 font-medium">
          {upcomingContests.length} upcoming
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5 max-h-[420px] overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
            <span className="ml-2 text-sm text-zinc-500">Loading contests...</span>
          </div>
        ) : upcomingContests.length > 0 ? (
          upcomingContests.map((contest, i) => (
            <button
              key={i}
              id={`contest-item-${i}`}
              onClick={() => window.open(contest.url, "_blank")}
              className="w-full group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.04] text-left"
            >
              {/* Platform indicator */}
              <div
                className={`h-9 w-1 rounded-full bg-gradient-to-b ${
                  platformColors[contest.platform] || platformColors.default
                } opacity-60 group-hover:opacity-100 transition-opacity`}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 group-hover:text-white truncate transition-colors">
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
                  <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {getTimeRemaining(contest.startTime)}
                  </span>
                </div>
              </div>

              <ExternalLink className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
            </button>
          ))
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No upcoming contests</p>
            <p className="text-xs text-zinc-600 mt-1">Check back later for new contests</p>
          </div>
        )}
      </div>
    </div>
  )
}
