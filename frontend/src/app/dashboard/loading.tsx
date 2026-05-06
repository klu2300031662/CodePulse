import { Code2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 animate-fade-in-up">
      <div className="relative">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20 animate-pulse">
          <Code2 className="h-6 w-6 text-white" />
        </div>
        <div
          className="absolute inset-[-6px] rounded-2xl border-2 border-violet-500/20 animate-spin"
          style={{ animationDuration: "2.5s" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-violet-500" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Just a moment ⚡
        </p>
      </div>
      <div className="w-32 h-0.5 rounded-full bg-zinc-200 dark:bg-white/[0.06] overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 loading-shimmer" />
      </div>
    </div>
  )
}
