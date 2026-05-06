"use client"

import { Sparkles, Rocket } from "lucide-react"

export default function TopBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200 dark:border-white/[0.06] bg-gradient-to-r from-violet-50 via-blue-50 to-violet-50 dark:from-[#0f0f23] dark:via-[#1a1040] dark:to-[#0f0f23]">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-32 w-32 rounded-full bg-violet-300/20 dark:bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-blue-300/20 dark:bg-blue-500/10 blur-3xl" />
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-violet-200/20 dark:from-violet-600/5 to-transparent" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              Monthly Rewind
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500/20 to-blue-500/20 dark:from-violet-500/30 dark:to-blue-500/30 text-violet-600 dark:text-violet-300 font-semibold uppercase tracking-wider border border-violet-300/30 dark:border-violet-400/20">
                <Rocket className="h-3 w-3" />
                Coming Soon
              </span>
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Your monthly coding summary will appear here.
            </p>
          </div>
        </div>

        {/* Decorative pulse animation */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500/10 to-blue-500/10 dark:from-violet-500/20 dark:to-blue-500/20 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/5 to-blue-500/5 animate-ping" />
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium max-w-[140px] leading-tight">
            We&apos;re building something exciting for you
          </p>
        </div>
      </div>
    </div>
  )
}
