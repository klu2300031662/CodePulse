"use client"
import { PlatformAnalytics } from "@/lib/api/analytics.service"
import { Card, CardContent } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface Props { data: PlatformAnalytics }

export default function LeetCodeTab({ data }: Props) {
  const difficultyData = [
    { name: "Easy", value: data.easySolved || 0, color: "#00b8a3" },
    { name: "Medium", value: data.mediumSolved || 0, color: "#ffc01e" },
    { name: "Hard", value: data.hardSolved || 0, color: "#ff375f" },
  ]
  const total = data.totalSolved || 0

  let calendarData: Record<string, number> = {}
  if (data.submissionCalendar) {
    try { calendarData = JSON.parse(data.submissionCalendar) } catch {}
  }

  const calendarEntries = Object.entries(calendarData)
    .map(([ts, count]) => ({ date: new Date(parseInt(ts) * 1000), count: count as number }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const weeks: { date: Date; count: number }[][] = []
  const now = new Date()
  const calMap = new Map(calendarEntries.map(e => [e.date.toDateString(), e.count]))
  for (let w = 19; w >= 0; w--) {
    const week: { date: Date; count: number }[] = []
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + (6 - d)
      const date = new Date(now); date.setDate(date.getDate() - dayOffset); date.setHours(0,0,0,0)
      week.push({ date, count: calMap.get(date.toDateString()) || 0 })
    }
    weeks.push(week)
  }

  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-zinc-200 dark:bg-[#2d2d2d]"
    if (count <= 2) return "bg-green-200 dark:bg-[#0e4429]"
    if (count <= 5) return "bg-green-400 dark:bg-[#006d32]"
    if (count <= 9) return "bg-green-500 dark:bg-[#26a641]"
    return "bg-green-600 dark:bg-[#39d353]"
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f3460] p-6 border border-amber-200 dark:border-amber-500/20">
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
            <span className="text-3xl font-black text-white">LC</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">LeetCode</h3>
            <p className="text-amber-700/60 dark:text-amber-200/60 text-sm mt-1">@{data.username}</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="text-center px-4 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-amber-200 dark:border-white/10 backdrop-blur-sm">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.acceptanceRate || 0}%</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Acceptance</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-amber-200 dark:border-white/10 backdrop-blur-sm">
              <p className="text-2xl font-bold text-zinc-800 dark:text-white">#{data.ranking?.toLocaleString() || "—"}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Ranking</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-amber-200 dark:border-white/10 backdrop-blur-sm">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{Math.round(data.contestRating || 0)}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Contest Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1a2e]/80">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Solved by Difficulty</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {difficultyData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg, #1a1a2e)', borderColor: '#333', borderRadius: 8 }} itemStyle={{ color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-2">
              <span className="text-3xl font-black text-zinc-900 dark:text-white">{total}</span>
              <span className="text-zinc-500 text-sm ml-2">problems solved</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1a2e]/80">
          <CardContent className="pt-6 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Detailed Stats</h4>
            {[
              { label: "Easy", solved: data.easySolved || 0, color: "#00b8a3", bg: "bg-[#00b8a3]/10", border: "border-[#00b8a3]/20" },
              { label: "Medium", solved: data.mediumSolved || 0, color: "#ffc01e", bg: "bg-[#ffc01e]/10", border: "border-[#ffc01e]/20" },
              { label: "Hard", solved: data.hardSolved || 0, color: "#ff375f", bg: "bg-[#ff375f]/10", border: "border-[#ff375f]/20" },
            ].map((item) => (
              <div key={item.label} className={`flex items-center justify-between p-4 rounded-xl ${item.bg} border ${item.border}`}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{item.label}</span>
                </div>
                <span className="text-lg font-bold" style={{ color: item.color }}>{item.solved}</span>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-center">
                <p className="text-lg font-bold text-zinc-800 dark:text-white">{data.contestsAttended || 0}</p>
                <p className="text-[10px] text-zinc-500">Contests Attended</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-center">
                <p className="text-lg font-bold text-zinc-800 dark:text-white">{data.totalSubmissions?.toLocaleString() || 0}</p>
                <p className="text-[10px] text-zinc-500">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {calendarEntries.length > 0 && (
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1a2e]/80">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Submission Heatmap</h4>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-[3px] min-w-fit">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) => (
                      <div key={di} title={`${day.count} submissions on ${day.date.toLocaleDateString()}`}
                        className={`w-3 h-3 rounded-[2px] ${getHeatColor(day.count)} transition-colors hover:ring-1 hover:ring-amber-400/50 cursor-pointer`} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-zinc-500">
              <span>Less</span>
              {["bg-zinc-200 dark:bg-[#2d2d2d]","bg-green-200 dark:bg-[#0e4429]","bg-green-400 dark:bg-[#006d32]","bg-green-500 dark:bg-[#26a641]","bg-green-600 dark:bg-[#39d353]"].map((c,i)=>(
                <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`}/>
              ))}
              <span>More</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
