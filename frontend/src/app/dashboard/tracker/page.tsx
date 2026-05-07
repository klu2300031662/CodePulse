"use client"

import { ClipboardList, Bell, StickerIcon, FolderKanban, Tag, BarChart3, Rocket } from "lucide-react"

const features = [
  { icon: ClipboardList, label: "Track Solved Problems", desc: "Log every problem with platform, difficulty, and status" },
  { icon: StickerIcon, label: "Add Notes", desc: "Write personal notes, approaches, and edge cases" },
  { icon: Bell, label: "Set Reminders", desc: "Get reminded to revisit problems for spaced repetition" },
  { icon: FolderKanban, label: "Organize by Topic", desc: "Group problems by arrays, trees, graphs, DP, and more" },
  { icon: Tag, label: "Difficulty Tags", desc: "Filter and sort by Easy, Medium, and Hard" },
  { icon: BarChart3, label: "Progress Analytics", desc: "Visualize your solving streak and weak areas" },
]

export default function TrackerPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4 animate-fade-in-up">
      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Badge */}
      <div className="relative mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/30 dark:border-amber-700/30 text-amber-700 dark:text-amber-400 text-sm font-semibold">
          <Rocket className="h-4 w-4" />
          Coming Soon
        </span>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 dark:from-white dark:via-zinc-300 dark:to-white bg-clip-text text-transparent mb-4">
        Problems Tracker
      </h1>

      {/* Teaser Description */}
      <p className="text-center text-muted-foreground max-w-xl text-base sm:text-lg leading-relaxed mb-10">
        Soon you&apos;ll be able to track every problem you&apos;ve solved, add notes, set reminders, 
        and organize by topic and difficulty — all in one place.
      </p>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl w-full mb-10">
        {features.map((f, i) => (
          <div
            key={i}
            className="group relative p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-cyan-100 dark:from-violet-900/40 dark:to-cyan-900/40 group-hover:scale-110 transition-transform duration-300">
                <f.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{f.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA line */}
      <p className="text-xs text-muted-foreground/60 text-center">
        We&apos;re building something special. Stay tuned! ✨
      </p>
    </div>
  )
}
