"use client"

import { BarChart3, Lock } from "lucide-react"

export default function TopicAnalysis() {
  return (
    <div className="group relative rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-violet-300 dark:hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10 hover:-translate-y-[2px]">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-pink-500 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 dark:group-hover:opacity-30" />
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Topic Analysis</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium">
          Coming Soon
        </span>
      </div>

      {/* Placeholder */}
      <div className="p-6">
        <div className="relative rounded-xl border border-zinc-100 dark:border-white/[0.04] bg-zinc-50 dark:bg-white/[0.02] p-8 text-center">
          {/* Fake chart bars */}
          <div className="flex items-end justify-center gap-2 mb-6 h-24">
            {[40, 65, 30, 80, 55, 45, 70, 35, 60, 50].map((h, i) => (
              <div
                key={i}
                className="w-4 rounded-t-sm bg-gradient-to-t from-violet-300/30 dark:from-violet-500/20 to-blue-200/20 dark:to-blue-500/10 border border-zinc-200/50 dark:border-white/[0.04]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 rounded-xl bg-white/60 dark:bg-[#0f0f23]/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Topic-wise analysis coming soon
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
              Solve more problems to see topic insights
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
