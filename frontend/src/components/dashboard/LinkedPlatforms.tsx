"use client"

import { useEffect, useState } from "react"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"
import { Link2, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"
import { GUEST_PLATFORMS } from "@/lib/guest-data"

const platformIcons: Record<string, string> = {
  LeetCode: "🟡",
  Codeforces: "🔵",
  CodeChef: "🟤",
  HackerRank: "🟢",
  HackerEarth: "🔷",
  GeeksforGeeks: "🟢",
  AtCoder: "⚪",
}

const platformGradients: Record<string, string> = {
  LeetCode: "from-amber-500/10 to-orange-500/5",
  Codeforces: "from-blue-500/10 to-indigo-500/5",
  CodeChef: "from-amber-700/10 to-yellow-600/5",
  HackerRank: "from-green-500/10 to-emerald-500/5",
  HackerEarth: "from-cyan-500/10 to-blue-500/5",
  GeeksforGeeks: "from-green-500/10 to-emerald-500/5",
  AtCoder: "from-gray-500/10 to-zinc-500/5",
}

interface LinkedPlatformsProps {
  prefetchedPlatforms?: PlatformLink[]
}

export default function LinkedPlatforms({ prefetchedPlatforms }: LinkedPlatformsProps) {
  const [platforms, setPlatforms] = useState<PlatformLink[]>(prefetchedPlatforms || [])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(!prefetchedPlatforms)
  const user = useAuthStore((state) => state.user) as any

  useEffect(() => {
    if (prefetchedPlatforms) return

    if (user?.isGuest) {
      setPlatforms([])
      setLoading(false)
      return
    }
    PlatformService.getUserPlatforms()
      .then((res) => setPlatforms(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [user?.isGuest, prefetchedPlatforms])

  useEffect(() => {
    if (prefetchedPlatforms) {
      setPlatforms(prefetchedPlatforms)
      setLoading(false)
    }
  }, [prefetchedPlatforms])

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const displayName = (p: PlatformLink) => {
    return p.username || p.platformName || "Unknown"
  }

  return (
    <div className="group relative rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-violet-300 dark:hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10 hover:-translate-y-[2px]">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 dark:group-hover:opacity-30" />
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
            <Link2 className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Linked Platforms</h3>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          {platforms.length} connected
        </span>
      </div>

      {/* List */}
      <div className="p-3 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-4 w-4 text-zinc-400 dark:text-zinc-500 animate-spin" />
            <span className="ml-2 text-sm text-zinc-400 dark:text-zinc-500">Loading...</span>
          </div>
        ) : platforms.length > 0 ? (
          platforms.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-100 dark:border-white/[0.04] overflow-hidden transition-all duration-300"
            >
              <button
                id={`platform-${p.id}`}
                onClick={() => toggleExpand(p.id)}
                className={`w-full flex items-center gap-3 p-3 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03] text-left ${
                  expandedId === p.id ? "bg-zinc-50/50 dark:bg-white/[0.02]" : ""
                }`}
              >
                <span className="text-lg flex-shrink-0">
                  {platformIcons[p.platformName] || "🔗"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                    {p.platformName}
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                    @{displayName(p)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {p.totalSolved || 0} solved
                  </span>
                  {expandedId === p.id ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {expandedId === p.id && (
                <div
                  className={`px-4 pb-4 pt-1 bg-gradient-to-b ${
                    platformGradients[p.platformName] || "from-zinc-500/5 to-transparent"
                  } animate-in slide-in-from-top-2 duration-200`}
                >
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/10">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{p.easySolved || 0}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Easy</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{p.mediumSolved || 0}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Medium</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{p.hardSolved || 0}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Hard</p>
                    </div>
                  </div>
                  {p.profileUrl && (
                    <a
                      href={p.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors py-2 rounded-lg border border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12] hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Profile
                    </a>
                  )}
                  {p.lastSyncedAt && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center mt-2">
                      Last synced: {new Date(p.lastSyncedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Link2 className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No platforms connected</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
              Link your coding profiles to track progress
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
