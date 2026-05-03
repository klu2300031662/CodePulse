"use client"

import { Building2, Lock } from "lucide-react"

export default function CompanyPrep() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-white text-sm">Company Prep</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-medium">
          Coming Soon
        </span>
      </div>

      {/* Placeholder */}
      <div className="p-5">
        <div className="relative rounded-xl border border-white/[0.04] bg-white/[0.02] p-6 text-center">
          {/* Fake company logos */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {["G", "M", "A", "F", "N"].map((letter, i) => (
              <div
                key={i}
                className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sm font-bold text-zinc-600"
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 rounded-xl bg-[#0f0f23]/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-xl bg-white/[0.06] flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-400">
              Company-specific prep coming soon
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Targeted preparation for top tech companies
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
