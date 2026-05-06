"use client"
import { PlatformAnalytics } from "@/lib/api/analytics.service"
import { Card, CardContent } from "@/components/ui/card"
import { Code2, Hash, BookOpen } from "lucide-react"

interface Props { data: PlatformAnalytics }

export default function InterviewBitTab({ data }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* InterviewBit header - teal theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1a2a] via-[#0d2535] to-[#153045] p-6 border border-teal-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
            <span className="text-2xl font-black text-white">IB</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">InterviewBit</h3>
            <p className="text-teal-200/50 text-sm mt-1">@{data.username}</p>
            {data.note && <p className="text-teal-300/40 text-xs mt-2 italic">{data.note}</p>}
          </div>
          <div className="flex gap-4 flex-wrap">
            {data.score !== undefined && (
              <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-bold text-teal-400">{data.score}</p>
                <p className="text-[11px] text-zinc-400 font-medium">Score</p>
              </div>
            )}
            {data.rank !== undefined && (
              <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-2xl font-bold text-cyan-400">#{data.rank}</p>
                <p className="text-[11px] text-zinc-400 font-medium">Rank</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-teal-900/30 bg-[#0a1a2a]/80">
          <CardContent className="pt-5 pb-4 text-center">
            <Code2 className="h-6 w-6 text-teal-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-teal-400">{data.score || "—"}</p>
            <p className="text-xs text-zinc-500 mt-1">Total Score</p>
          </CardContent>
        </Card>
        <Card className="border-teal-900/30 bg-[#0a1a2a]/80">
          <CardContent className="pt-5 pb-4 text-center">
            <Hash className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-cyan-400">{data.rank || "—"}</p>
            <p className="text-xs text-zinc-500 mt-1">Global Rank</p>
          </CardContent>
        </Card>
        <Card className="border-teal-900/30 bg-[#0a1a2a]/80">
          <CardContent className="pt-5 pb-4 text-center">
            <BookOpen className="h-6 w-6 text-sky-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-sky-400">{data.totalSolved || "—"}</p>
            <p className="text-xs text-zinc-500 mt-1">Problems Solved</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-teal-900/30 bg-[#0a1a2a]/80">
        <CardContent className="py-10 text-center">
          <Code2 className="h-10 w-10 text-teal-800 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">InterviewBit profile data is limited due to API restrictions.</p>
          <p className="text-zinc-600 text-xs mt-1">Score and rank data will appear when available from the profile page.</p>
        </CardContent>
      </Card>
    </div>
  )
}
