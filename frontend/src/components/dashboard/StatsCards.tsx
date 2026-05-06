"use client"

import { useEffect, useState } from "react"
import { PlatformLink } from "@/lib/api/platform.service"
import { Hash, Link2 } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import { GUEST_PLATFORMS } from "@/lib/guest-data"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  gradient: string
  glowColor: string
}

function StatCard({ icon, label, value, gradient, glowColor }: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0f0f23]/80 backdrop-blur-xl p-6 transition-all duration-500 hover:border-zinc-300 dark:hover:border-white/[0.12] hover:translate-y-[-2px] hover:shadow-lg dark:hover:shadow-none"
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
            {value.toLocaleString()}
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
}

export default function StatsCards({ prefetchedPlatforms }: StatsCardsProps) {
  const [platforms, setPlatforms] = useState<PlatformLink[]>(prefetchedPlatforms || [])
  const user = useAuthStore((state) => state.user) as any
  const { fetchPlatforms } = useDashboardStore()

  useEffect(() => {
    if (prefetchedPlatforms) return

    if (user?.isGuest) {
      setPlatforms(GUEST_PLATFORMS as any)
      return
    }
    fetchPlatforms(false).then((data) => setPlatforms(data))
  }, [user?.isGuest, prefetchedPlatforms, fetchPlatforms])

  useEffect(() => {
    if (prefetchedPlatforms) setPlatforms(prefetchedPlatforms)
  }, [prefetchedPlatforms])

  const totalQuestions = platforms.reduce((sum, p) => sum + (p.totalSolved || 0), 0)
  const platformCount = platforms.length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatCard
        icon={<Hash className="h-6 w-6 text-white" />}
        label="All Platforms Total"
        value={totalQuestions}
        gradient="from-blue-500 to-cyan-400"
        glowColor="bg-blue-500"
      />
      <StatCard
        icon={<Link2 className="h-6 w-6 text-white" />}
        label="Platforms Linked"
        value={platformCount}
        gradient="from-violet-500 to-purple-400"
        glowColor="bg-violet-500"
      />
    </div>
  )
}
