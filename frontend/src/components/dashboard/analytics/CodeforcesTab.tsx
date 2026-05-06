"use client"
import { PlatformAnalytics } from "@/lib/api/analytics.service"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Props { data: PlatformAnalytics }

const RANK_COLORS: Record<string, string> = {
  "newbie": "#808080", "pupil": "#008000", "specialist": "#03a89e",
  "expert": "#0000ff", "candidate master": "#aa00aa", "master": "#ff8c00",
  "international master": "#ff8c00", "grandmaster": "#ff0000",
  "international grandmaster": "#ff0000", "legendary grandmaster": "#ff0000",
}

export default function CodeforcesTab({ data }: Props) {
  const rankColor = RANK_COLORS[(data.rank || "").toLowerCase()] || "#1e90ff"
  const contestData = (data.contestHistory || []).slice(-30).map((c, i) => ({
    name: `#${i + 1}`, rating: c.newRating, contestName: c.contestName,
  }))

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 dark:from-[#1a1a40] dark:via-[#162447] dark:to-[#1f4068] p-6 border border-blue-200 dark:border-blue-500/20">
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
            <span className="text-3xl font-black text-white">CF</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Codeforces</h3>
            <p className="text-blue-700/60 dark:text-blue-200/60 text-sm mt-1">@{data.username}</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="text-center px-4 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-blue-200 dark:border-white/10">
              <p className="text-2xl font-bold" style={{ color: rankColor }}>{data.rating || "—"}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Rating</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-blue-200 dark:border-white/10">
              <p className="text-2xl font-bold capitalize" style={{ color: rankColor }}>{data.rank || "—"}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Rank</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-blue-200 dark:border-white/10">
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{data.maxRating || "—"}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Max Rating</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Problems Solved", value: data.totalSolved || 0, color: "text-blue-600 dark:text-blue-400" },
          { label: "Contests Attended", value: data.contestsAttended || 0, color: "text-cyan-600 dark:text-cyan-400" },
          { label: "Contribution", value: data.contribution || 0, color: data.contribution && data.contribution > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400" },
        ].map((item) => (
          <Card key={item.label} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1a40]/80">
            <CardContent className="pt-5 pb-4 text-center">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {contestData.length > 0 && (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1a40]/80">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Contest Rating History</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={contestData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                    labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.contestName || label}
                    formatter={(value: any) => [value, 'Rating']} />
                  <Line type="monotone" dataKey="rating" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
