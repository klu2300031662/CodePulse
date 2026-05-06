"use client"
import { PlatformAnalytics } from "@/lib/api/analytics.service"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Star, Shield } from "lucide-react"

interface Props { data: PlatformAnalytics }

export default function HackerRankTab({ data }: Props) {
  const skills = data.skills || []
  const badges = data.badges || []

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* HackerRank header - green theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1f0a] via-[#0d2818] to-[#1a3a2a] p-6 border border-emerald-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
            <span className="text-3xl font-black text-white">HR</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">HackerRank</h3>
            <p className="text-emerald-200/50 text-sm mt-1">@{data.username}</p>
            {data.note && <p className="text-emerald-300/40 text-xs mt-2 italic">{data.note}</p>}
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-emerald-400">{badges.length}</p>
              <p className="text-[11px] text-zinc-400 font-medium">Badges</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-green-400">{skills.length}</p>
              <p className="text-[11px] text-zinc-400 font-medium">Skill Areas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <Card className="border-emerald-900/30 bg-[#0a1f0a]/80">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400" /> Badges
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <Shield className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{badge.name}</p>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: badge.stars || 0 }).map((_, si) => (
                        <Star key={si} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Scores */}
      {skills.length > 0 && (
        <Card className="border-emerald-900/30 bg-[#0a1f0a]/80">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">Skill Scores</h4>
            <div className="space-y-3">
              {skills.map((skill, i) => {
                const maxScore = Math.max(...skills.map(s => s.score || 0), 1)
                const pct = ((skill.score || 0) / maxScore) * 100
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-300">{skill.name}</span>
                      <span className="text-emerald-400 font-semibold">{skill.score}</span>
                    </div>
                    <div className="h-2 bg-emerald-900/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback when no data */}
      {badges.length === 0 && skills.length === 0 && (
        <Card className="border-emerald-900/30 bg-[#0a1f0a]/80">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-emerald-800 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">HackerRank profile data is limited due to API restrictions.</p>
            <p className="text-zinc-600 text-xs mt-1">Badges and skill scores will appear when available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
