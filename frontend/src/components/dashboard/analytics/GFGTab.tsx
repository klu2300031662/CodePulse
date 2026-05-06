"use client"
import { PlatformAnalytics } from "@/lib/api/analytics.service"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Trophy, TrendingUp } from "lucide-react"

interface Props { data: PlatformAnalytics }

export default function GFGTab({ data }: Props) {
  const difficultyData = [
    { label: "Easy", value: data.easySolved || 0, color: "#22c55e", bg: "bg-green-500/10", border: "border-green-500/20" },
    { label: "Medium", value: data.mediumSolved || 0, color: "#eab308", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "Hard", value: data.hardSolved || 0, color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/20" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* GFG header - green theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a2010] via-[#0f2d18] to-[#183d24] p-6 border border-green-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
            <span className="text-2xl font-black text-white">GFG</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">GeeksForGeeks</h3>
            <p className="text-green-200/50 text-sm mt-1">@{data.username}</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-green-400">{data.score || 0}</p>
              <p className="text-[11px] text-zinc-400 font-medium">Coding Score</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-orange-400">{data.streak || 0}</p>
                <p className="text-[11px] text-zinc-400 font-medium">Current Streak</p>
              </div>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-emerald-400">{data.totalSolved || 0}</p>
              <p className="text-[11px] text-zinc-400 font-medium">Total Solved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-900/30 bg-[#0a2010]/80">
          <CardContent className="pt-5 pb-4 text-center">
            <Flame className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-orange-400">{data.maxStreak || 0}</p>
            <p className="text-xs text-zinc-500 mt-1">Max Streak</p>
          </CardContent>
        </Card>
        <Card className="border-green-900/30 bg-[#0a2010]/80">
          <CardContent className="pt-5 pb-4 text-center">
            <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-yellow-400">{data.instituteRank || "—"}</p>
            <p className="text-xs text-zinc-500 mt-1">Institute Rank</p>
          </CardContent>
        </Card>
        <Card className="border-green-900/30 bg-[#0a2010]/80">
          <CardContent className="pt-5 pb-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-400">{data.score || 0}</p>
            <p className="text-xs text-zinc-500 mt-1">Coding Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty Breakdown */}
      <Card className="border-green-900/30 bg-[#0a2010]/80">
        <CardContent className="pt-6 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-300 mb-4">Problem Count by Difficulty</h4>
          {difficultyData.map((item) => {
            const total = data.totalSolved || 1
            const pct = Math.round((item.value / total) * 100)
            return (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-zinc-300 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-semibold" style={{ color: item.color }}>{item.value} <span className="text-zinc-600 text-xs">({pct}%)</span></span>
                </div>
                <div className="h-2.5 bg-zinc-900/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
