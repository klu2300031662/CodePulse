"use client"

import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TopBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-r from-[#0f0f23] via-[#1a1040] to-[#0f0f23]">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-violet-600/5 to-transparent" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Monthly Rewind Ready
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium uppercase tracking-wider">
                New
              </span>
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              See your coding journey highlights from this month
            </p>
          </div>
        </div>
        <Button
          id="monthly-rewind-cta"
          className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/30 hover:translate-y-[-1px] group"
        >
          View Rewind
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  )
}
