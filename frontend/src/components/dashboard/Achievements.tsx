"use client"

import { useState } from "react"
import { Award, Trophy, Star, Zap, Target, Medal } from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  gradient: string
}

// Placeholder achievements — in the future, fetch from API
const sampleAchievements: Achievement[] = [
  {
    id: "first-solve",
    title: "First Blood",
    description: "Solve your first problem",
    icon: <Zap className="h-5 w-5" />,
    unlocked: false,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "streak-7",
    title: "Weekly Warrior",
    description: "7-day solving streak",
    icon: <Target className="h-5 w-5" />,
    unlocked: false,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "100-solved",
    title: "Century Club",
    description: "Solve 100 problems",
    icon: <Trophy className="h-5 w-5" />,
    unlocked: false,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "hard-master",
    title: "Hard Mode",
    description: "Solve 25 hard problems",
    icon: <Star className="h-5 w-5" />,
    unlocked: false,
    gradient: "from-red-500 to-pink-500",
  },
]

export default function Achievements() {
  const [achievements] = useState<Achievement[]>(sampleAchievements)
  const unlockedCount = achievements.filter((a) => a.unlocked).length

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
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {unlockedCount > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {achievements
              .filter((a) => a.unlocked)
              .map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.06]"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${a.gradient} text-white shadow-lg`}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-white">{a.title}</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{a.description}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="relative inline-flex">
              <Award className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">!</span>
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-4">
              Start solving problems to unlock achievements 🚀
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1.5">
              Track your progress and earn badges
            </p>

            {/* Locked achievement previews */}
            <div className="grid grid-cols-4 gap-2 mt-6">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/[0.04]"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${a.gradient} text-white opacity-30`}
                  >
                    {a.icon}
                  </div>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-600 text-center leading-tight">
                    {a.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
