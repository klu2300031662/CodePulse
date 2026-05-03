"use client"

import { useEffect, useState } from "react"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"
import { Hash, CheckCircle2, Star } from "lucide-react"

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
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f23]/80 backdrop-blur-xl p-6 transition-all duration-500 hover:border-white/[0.12] hover:translate-y-[-2px]`}
      style={{
        animationDelay: delay,
      }}
    >
      {/* Glow effect */}
      <div
        className={`absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30 ${glowColor}`}
      />

      {/* Gradient bar */}
      <div
        className={`absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r ${gradient} opacity-60`}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-white tabular-nums">
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

export default function StatsCards() {
  const [platforms, setPlatforms] = useState<PlatformLink[]>([])

  useEffect(() => {
    PlatformService.getUserPlatforms()
      .then((res) => setPlatforms(res))
      .catch((err) => console.error(err))
  }, [])

  const totalQuestions = platforms.reduce((sum, p) => sum + (p.totalSolved || 0), 0)
  const completedQuestions = platforms.reduce(
    (sum, p) => sum + (p.easySolved || 0) + (p.mediumSolved || 0) + (p.hardSolved || 0),
    0
  )
  const starredQuestions = 0 // Future feature

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        icon={<Hash className="h-6 w-6 text-white" />}
        label="Total Questions"
        value={totalQuestions}
        gradient="from-blue-500 to-cyan-400"
        glowColor="bg-blue-500"
        delay="0"
      />
      <StatCard
        icon={<CheckCircle2 className="h-6 w-6 text-white" />}
        label="Completed"
        value={completedQuestions}
        gradient="from-emerald-500 to-teal-400"
        glowColor="bg-emerald-500"
        delay="100"
      />
      <StatCard
        icon={<Star className="h-6 w-6 text-white" />}
        label="Starred"
        value={starredQuestions}
        gradient="from-amber-500 to-orange-400"
        glowColor="bg-amber-500"
        delay="200"
      />
    </div>
  )
}
