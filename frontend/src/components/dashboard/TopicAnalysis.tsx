"use client"

import { BarChart3, Lock } from "lucide-react"

export default function TopicAnalysis() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-white text-sm">Topic Analysis</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium">
          Coming Soon
        </span>
      </div>

      {/* Placeholder */}
      <div className="p-6">
        <div className="relative rounded-xl border border-white/[0.04] bg-white/[0.02] p-8 text-center">
          {/* Fake chart bars */}
          <div className="flex items-end justify-center gap-2 mb-6 h-24">
            {[40, 65, 30, 80, 55, 45, 70, 35, 60, 50].map((h, i) => (
              <div
                key={i}
                className="w-4 rounded-t-sm bg-gradient-to-t from-violet-500/20 to-blue-500/10 border border-white/[0.04]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 rounded-xl bg-[#0f0f23]/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-400">
              Topic-wise analysis coming soon
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Solve more problems to see topic insights
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
