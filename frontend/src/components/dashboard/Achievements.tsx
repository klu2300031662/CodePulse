"use client"

import { useEffect, useState } from "react"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"
import { useAuthStore } from "@/lib/store/auth.store"
import { GUEST_PLATFORMS } from "@/lib/guest-data"
import { Medal, Link2, Lock, Trophy, Flame, Target, Award, Zap, Star } from "lucide-react"

/* ─── Platform badge definitions ─── */

interface PlatformBadge {
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  threshold: number          // totalSolved needed to unlock
  thresholdType: 'solved'    // expandable in future
}

const leetcodeBadges: PlatformBadge[] = [
  { title: "50 Days", description: "50+ problems solved", icon: <Flame className="h-4 w-4" />, gradient: "from-amber-500 to-orange-500", threshold: 50, thresholdType: 'solved' },
  { title: "100 Days", description: "100+ problems solved", icon: <Target className="h-4 w-4" />, gradient: "from-blue-500 to-cyan-500", threshold: 100, thresholdType: 'solved' },
  { title: "200 Club", description: "200+ problems solved", icon: <Trophy className="h-4 w-4" />, gradient: "from-emerald-500 to-teal-500", threshold: 200, thresholdType: 'solved' },
  { title: "500 Legend", description: "500+ problems solved", icon: <Award className="h-4 w-4" />, gradient: "from-violet-500 to-purple-500", threshold: 500, thresholdType: 'solved' },
]

const codeforcesBadges: PlatformBadge[] = [
  { title: "Newbie", description: "Started competing", icon: <Zap className="h-4 w-4" />, gradient: "from-gray-400 to-gray-500", threshold: 1, thresholdType: 'solved' },
  { title: "Pupil", description: "50+ problems solved", icon: <Target className="h-4 w-4" />, gradient: "from-green-500 to-emerald-500", threshold: 50, thresholdType: 'solved' },
  { title: "Specialist", description: "150+ problems solved", icon: <Trophy className="h-4 w-4" />, gradient: "from-cyan-500 to-blue-500", threshold: 150, thresholdType: 'solved' },
  { title: "Expert", description: "300+ problems solved", icon: <Award className="h-4 w-4" />, gradient: "from-blue-600 to-indigo-600", threshold: 300, thresholdType: 'solved' },
]

const codechefBadges: PlatformBadge[] = [
  { title: "1 Star", description: "Getting started", icon: <Star className="h-4 w-4" />, gradient: "from-gray-400 to-zinc-500", threshold: 1, thresholdType: 'solved' },
  { title: "2 Star", description: "30+ problems solved", icon: <Star className="h-4 w-4" />, gradient: "from-green-500 to-emerald-500", threshold: 30, thresholdType: 'solved' },
  { title: "3 Star", description: "75+ problems solved", icon: <Star className="h-4 w-4" />, gradient: "from-blue-500 to-cyan-500", threshold: 75, thresholdType: 'solved' },
  { title: "4 Star", description: "150+ problems solved", icon: <Star className="h-4 w-4" />, gradient: "from-violet-500 to-purple-500", threshold: 150, thresholdType: 'solved' },
]

const hackerrankBadges: PlatformBadge[] = [
  { title: "Bronze", description: "10+ problems solved", icon: <Medal className="h-4 w-4" />, gradient: "from-amber-700 to-amber-600", threshold: 10, thresholdType: 'solved' },
  { title: "Silver", description: "50+ problems solved", icon: <Medal className="h-4 w-4" />, gradient: "from-gray-300 to-gray-400", threshold: 50, thresholdType: 'solved' },
  { title: "Gold", description: "100+ problems solved", icon: <Medal className="h-4 w-4" />, gradient: "from-yellow-400 to-amber-500", threshold: 100, thresholdType: 'solved' },
]

const gfgBadges: PlatformBadge[] = [
  { title: "Beginner", description: "10+ problems solved", icon: <Zap className="h-4 w-4" />, gradient: "from-green-400 to-green-500", threshold: 10, thresholdType: 'solved' },
  { title: "Intermediate", description: "50+ problems solved", icon: <Target className="h-4 w-4" />, gradient: "from-green-500 to-emerald-600", threshold: 50, thresholdType: 'solved' },
  { title: "Expert", description: "150+ problems solved", icon: <Trophy className="h-4 w-4" />, gradient: "from-emerald-600 to-teal-600", threshold: 150, thresholdType: 'solved' },
]

const interviewbitBadges: PlatformBadge[] = [
  { title: "Starter", description: "10+ problems solved", icon: <Zap className="h-4 w-4" />, gradient: "from-cyan-500 to-blue-500", threshold: 10, thresholdType: 'solved' },
  { title: "Achiever", description: "50+ problems solved", icon: <Target className="h-4 w-4" />, gradient: "from-blue-500 to-indigo-500", threshold: 50, thresholdType: 'solved' },
  { title: "Master", description: "100+ problems solved", icon: <Trophy className="h-4 w-4" />, gradient: "from-indigo-500 to-purple-500", threshold: 100, thresholdType: 'solved' },
]

const platformBadgeMap: Record<string, PlatformBadge[]> = {
  LeetCode: leetcodeBadges,
  Codeforces: codeforcesBadges,
  CodeChef: codechefBadges,
  HackerRank: hackerrankBadges,
  GeeksforGeeks: gfgBadges,
  InterviewBit: interviewbitBadges,
}

const platformIcons: Record<string, string> = {
  LeetCode: "🟡",
  Codeforces: "🔵",
  CodeChef: "🟤",
  HackerRank: "🟢",
  GeeksforGeeks: "🟢",
  InterviewBit: "🔷",
}

const allPlatformNames = ["LeetCode", "CodeChef", "Codeforces", "HackerRank", "GeeksforGeeks", "InterviewBit"]

interface AchievementsProps {
  prefetchedPlatforms?: PlatformLink[]
}

export default function Achievements({ prefetchedPlatforms }: AchievementsProps) {
  const [platforms, setPlatforms] = useState<PlatformLink[]>(prefetchedPlatforms || [])
  const [loading, setLoading] = useState(!prefetchedPlatforms)
  const user = useAuthStore((state) => state.user) as any

  useEffect(() => {
    // Skip fetch if prefetched data was provided
    if (prefetchedPlatforms) return

    if (user?.isGuest) {
      setPlatforms(GUEST_PLATFORMS as any)
      setLoading(false)
      return
    }
    PlatformService.getUserPlatforms()
      .then((res) => setPlatforms(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [user?.isGuest, prefetchedPlatforms])

  // Sync from prefetched when it arrives
  useEffect(() => {
    if (prefetchedPlatforms) {
      setPlatforms(prefetchedPlatforms)
      setLoading(false)
    }
  }, [prefetchedPlatforms])

  const linkedMap = new Map<string, PlatformLink>()
  platforms.forEach(p => linkedMap.set(p.platformName, p))

  // Count total unlocked badges
  let totalUnlocked = 0
  let totalBadges = 0
  allPlatformNames.forEach(name => {
    const badges = platformBadgeMap[name] || []
    totalBadges += badges.length
    const plat = linkedMap.get(name)
    if (plat) {
      totalUnlocked += badges.filter(b => (plat.totalSolved || 0) >= b.threshold).length
    }
  })

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500">
            <Medal className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Achievements</h3>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
          {totalUnlocked}/{totalBadges} unlocked
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-4 w-4 border-2 border-zinc-300 dark:border-zinc-600 border-t-violet-500 rounded-full animate-spin" />
            <span className="ml-2 text-sm text-zinc-400 dark:text-zinc-500">Loading...</span>
          </div>
        ) : (
          allPlatformNames.map(name => {
            const plat = linkedMap.get(name)
            const badges = platformBadgeMap[name] || []
            const isLinked = !!plat
            const solved = plat?.totalSolved || 0

            return (
              <div key={name} className="space-y-2.5">
                {/* Platform header */}
                <div className="flex items-center gap-2">
                  <span className="text-base">{platformIcons[name] || "🔗"}</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    {name}
                  </span>
                  {isLinked ? (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      • {solved} solved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-white/[0.06]">
                      <Lock className="h-2.5 w-2.5" />
                      Link to unlock
                    </span>
                  )}
                </div>

                {/* Badges grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {badges.map((badge) => {
                    const unlocked = isLinked && solved >= badge.threshold
                    return (
                      <div
                        key={badge.title}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-300 ${
                          unlocked
                            ? "bg-white dark:bg-white/[0.04] border-zinc-200 dark:border-white/[0.08] shadow-sm"
                            : "bg-zinc-50/50 dark:bg-white/[0.01] border-zinc-100 dark:border-white/[0.04]"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${badge.gradient} text-white shadow-md transition-all duration-300 ${
                            unlocked ? "opacity-100 scale-100" : "opacity-20 scale-90"
                          }`}
                        >
                          {badge.icon}
                        </div>
                        <p className={`text-[10px] font-semibold text-center leading-tight ${
                          unlocked ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-600"
                        }`}>
                          {badge.title}
                        </p>
                        <p className={`text-[9px] text-center leading-tight ${
                          unlocked ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-300 dark:text-zinc-700"
                        }`}>
                          {badge.description}
                        </p>
                        {unlocked && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-sm">
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        {/* Progress indicator for linked but not yet unlocked */}
                        {isLinked && !unlocked && (
                          <div className="w-full mt-0.5">
                            <div className="h-1 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${badge.gradient} transition-all duration-700 opacity-50`}
                                style={{ width: `${Math.min((solved / badge.threshold) * 100, 100)}%` }}
                              />
                            </div>
                            <p className="text-[8px] text-zinc-400 dark:text-zinc-600 text-center mt-0.5">
                              {solved}/{badge.threshold}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Separator between platforms */}
                <div className="border-b border-zinc-100 dark:border-white/[0.04] last:border-0" />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
