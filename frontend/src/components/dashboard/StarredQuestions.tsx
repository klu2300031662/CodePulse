"use client"

import { useEffect, useState } from "react"
import { Star, ExternalLink, StarOff, Loader2 } from "lucide-react"
import { ProblemService, Problem } from "@/lib/api/problem.service"
import { useAuthStore } from "@/lib/store/auth.store"
import { GUEST_STARRED_PROBLEMS } from "@/lib/guest-data"

const platformIcons: Record<string, string> = {
  LeetCode: "🟡",
  Codeforces: "🔵",
  CodeChef: "🟤",
  HackerRank: "🟢",
  GeeksforGeeks: "🟢",
  InterviewBit: "🔷",
  HackerEarth: "🔷",
  AtCoder: "⚪",
  Manual: "📝",
}

const difficultyColors: Record<string, string> = {
  Easy: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
  Medium: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
  Hard: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
}

interface StarredQuestionsProps {
  prefetchedStarred?: Problem[]
}

export default function StarredQuestions({ prefetchedStarred }: StarredQuestionsProps) {
  const [starred, setStarred] = useState<Problem[]>(prefetchedStarred || [])
  const [loading, setLoading] = useState(!prefetchedStarred)
  const user = useAuthStore((state) => state.user) as any

  useEffect(() => {
    // Skip fetch if prefetched data was provided
    if (prefetchedStarred) return

    if (user?.isGuest) {
      setStarred(GUEST_STARRED_PROBLEMS as any)
      setLoading(false)
      return
    }
    ProblemService.getStarred()
      .then((res) => setStarred(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [user?.isGuest, prefetchedStarred])

  // Sync from prefetched when it arrives
  useEffect(() => {
    if (prefetchedStarred) {
      setStarred(prefetchedStarred)
      setLoading(false)
    }
  }, [prefetchedStarred])

  const handleUnstar = async (id: number) => {
    if (user?.isGuest) return
    try {
      await ProblemService.toggleStar(id)
      setStarred((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
            <Star className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Starred Questions</h3>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          {starred.length} bookmarked
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
            <span className="ml-2 text-sm text-zinc-400 dark:text-zinc-500">Loading...</span>
          </div>
        ) : starred.length > 0 ? (
          <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
            {starred.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
              >
                {/* Platform icon */}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] flex-shrink-0 text-base">
                  {platformIcons[item.platform] || "🔗"}
                </div>

                {/* Question info */}
                <div className="flex-1 min-w-0">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 truncate transition-colors flex items-center gap-1.5"
                    >
                      <span className="truncate">{item.title}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                      {item.title}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {item.platform}
                  </p>
                </div>

                {/* Difficulty badge */}
                {item.difficulty && (
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                      difficultyColors[item.difficulty] || "text-zinc-500 bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10"
                    } flex-shrink-0`}
                  >
                    {item.difficulty}
                  </span>
                )}

                {/* Unstar button */}
                {!user?.isGuest && (
                  <button
                    onClick={() => item.id && handleUnstar(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                    title="Remove star"
                  >
                    <StarOff className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="relative inline-flex">
              <Star className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">0</span>
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-4">
              No starred questions yet
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1.5 max-w-[240px] mx-auto">
              Star problems from the Tracker to bookmark them here for quick access
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
