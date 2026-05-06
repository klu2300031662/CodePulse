"use client"

import { useEffect, useState } from "react"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"
import { ProblemService } from "@/lib/api/problem.service"
import { Hash, Star } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"
import { GUEST_PLATFORMS, GUEST_STARRED_COUNT } from "@/lib/guest-data"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  gradient: string
  glowColor: string
  delay: string
}

function StatCard({ icon, label, value, gradient, glowColor, delay }: StatCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0
      const end = value
      const duration = 1200
      const stepTime = Math.max(Math.floor(duration / end), 16)
      const step = () => {
        start += Math.max(1, Math.floor(end / (duration / stepTime)))
        if (start >= end) {
          setAnimatedValue(end)
        } else {
          setAnimatedValue(start)
          requestAnimationFrame(step)
        }
      }
      if (end > 0) step()
    }, parseInt(delay))
    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0f0f23]/80 backdrop-blur-xl p-6 transition-all duration-500 hover:border-zinc-300 dark:hover:border-white/[0.12] hover:translate-y-[-2px] hover:shadow-lg dark:hover:shadow-none"
      style={{ animationDelay: delay }}
    >
      {/* Glow effect */}
      <div
        className={`absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 dark:group-hover:opacity-30 ${glowColor}`}
      />

      {/* Gradient bar */}
      <div
        className={`absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r ${gradient} opacity-60`}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white tabular-nums">
            {animatedValue.toLocaleString()}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

interface StatsCardsProps {
  prefetchedPlatforms?: PlatformLink[]
  prefetchedStarredCount?: number
}

export default function StatsCards({ prefetchedPlatforms, prefetchedStarredCount }: StatsCardsProps) {
  const [platforms, setPlatforms] = useState<PlatformLink[]>(prefetchedPlatforms || [])
  const [starredCount, setStarredCount] = useState(prefetchedStarredCount ?? 0)
  const user = useAuthStore((state) => state.user) as any

  useEffect(() => {
    // Skip fetch if prefetched data was provided
    if (prefetchedPlatforms) return

    if (user?.isGuest) {
      setPlatforms(GUEST_PLATFORMS as any)
      setStarredCount(GUEST_STARRED_COUNT)
      return
    }
    PlatformService.getUserPlatforms()
      .then((res) => setPlatforms(res))
      .catch((err) => console.error(err))

    ProblemService.getStarredCount()
      .then((count) => setStarredCount(count))
      .catch((err) => console.error(err))
  }, [user?.isGuest, prefetchedPlatforms])

  // Sync from prefetched when it arrives
  useEffect(() => {
    if (prefetchedPlatforms) setPlatforms(prefetchedPlatforms)
  }, [prefetchedPlatforms])

  useEffect(() => {
    if (prefetchedStarredCount !== undefined) setStarredCount(prefetchedStarredCount)
  }, [prefetchedStarredCount])

  const totalQuestions = platforms.reduce((sum, p) => sum + (p.totalSolved || 0), 0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatCard
        icon={<Hash className="h-6 w-6 text-white" />}
        label="All Platforms Total"
        value={totalQuestions}
        gradient="from-blue-500 to-cyan-400"
        glowColor="bg-blue-500"
        delay="0"
      />
      <StatCard
        icon={<Star className="h-6 w-6 text-white" />}
        label="Starred"
        value={starredCount}
        gradient="from-amber-500 to-orange-400"
        glowColor="bg-amber-500"
        delay="100"
      />
    </div>
  )
}
