"use client"

import { Code2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Animated logo */}
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-xl shadow-violet-500/20 animate-pulse">
          <Code2 className="h-8 w-8 text-white" />
        </div>
        {/* Orbiting ring */}
        <div className="absolute inset-[-8px] rounded-3xl border-2 border-violet-500/20 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-violet-500" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 tracking-tight">
          Just a moment...
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Loading your dashboard
        </p>
      </div>

      {/* Skeleton shimmer bar */}
      <div className="w-48 h-1 rounded-full bg-zinc-200 dark:bg-white/[0.06] overflow-hidden">
        <div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
          style={{
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}
