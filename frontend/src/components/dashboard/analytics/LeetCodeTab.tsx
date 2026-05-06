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

  // Parse submission calendar for heatmap
  let calendarData: Record<string, number> = {}
  if (data.submissionCalendar) {
    try {
      calendarData = JSON.parse(data.submissionCalendar)
    } catch {}
  }

  const calendarEntries = Object.entries(calendarData)
    .map(([ts, count]) => ({ date: new Date(parseInt(ts) * 1000), count: count as number }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  // Generate last 20 weeks of heatmap
  const weeks: { date: Date; count: number }[][] = []
  const now = new Date()
  const calMap = new Map(calendarEntries.map(e => [e.date.toDateString(), e.count]))
  
  for (let w = 19; w >= 0; w--) {
    const week: { date: Date; count: number }[] = []
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + (6 - d)
      const date = new Date(now)
      date.setDate(date.getDate() - dayOffset)
      date.setHours(0, 0, 0, 0)
      // Find closest match in calendar
      const count = calMap.get(date.toDateString()) || 0
      week.push({ date, count })
    }
    weeks.push(week)
  }

  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-[#2d2d2d]"
    if (count <= 2) return "bg-[#0e4429]"
    if (count <= 5) return "bg-[#006d32]"
    if (count <= 9) return "bg-[#26a641]"
    return "bg-[#39d353]"
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* LeetCode themed header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6 border border-amber-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Logo */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
            <span className="text-3xl font-black text-white">LC</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">LeetCode</h3>
            <p className="text-amber-200/60 text-sm mt-1">@{data.username}</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-2xl font-bold text-amber-400">{data.acceptanceRate || 0}%</p>
              <p className="text-[11px] text-zinc-400 font-medium">Acceptance</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">#{data.ranking?.toLocaleString() || "—"}</p>
              <p className="text-[11px] text-zinc-400 font-medium">Ranking</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-2xl font-bold text-orange-400">{Math.round(data.contestRating || 0)}</p>
              <p className="text-[11px] text-zinc-400 font-medium">Contest Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <Card className="border-zinc-800 bg-[#1a1a2e]/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">Solved by Difficulty</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {difficultyData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#333', borderRadius: 8 }} itemStyle={{ color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-2">
              <span className="text-3xl font-black text-white">{total}</span>
              <span className="text-zinc-500 text-sm ml-2">problems solved</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <Card className="border-zinc-800 bg-[#1a1a2e]/80 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">Detailed Stats</h4>
            {[ 
              { label: "Easy", solved: data.easySolved || 0, color: "#00b8a3", bg: "bg-[#00b8a3]/10", border: "border-[#00b8a3]/20" },
              { label: "Medium", solved: data.mediumSolved || 0, color: "#ffc01e", bg: "bg-[#ffc01e]/10", border: "border-[#ffc01e]/20" },
              { label: "Hard", solved: data.hardSolved || 0, color: "#ff375f", bg: "bg-[#ff375f]/10", border: "border-[#ff375f]/20" },
            ].map((item) => (
              <div key={item.label} className={`flex items-center justify-between p-4 rounded-xl ${item.bg} border ${item.border}`}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-zinc-200">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold" style={{ color: item.color }}>{item.solved}</span>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-lg font-bold text-white">{data.contestsAttended || 0}</p>
                <p className="text-[10px] text-zinc-500">Contests Attended</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-lg font-bold text-white">{data.totalSubmissions?.toLocaleString() || 0}</p>
                <p className="text-[10px] text-zinc-500">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission Heatmap */}
      {calendarEntries.length > 0 && (
        <Card className="border-zinc-800 bg-[#1a1a2e]/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">Submission Heatmap</h4>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-[3px] min-w-fit">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) => (
                      <div
                        key={di}
                        title={`${day.count} submissions on ${day.date.toLocaleDateString()}`}
                        className={`w-3 h-3 rounded-[2px] ${getHeatColor(day.count)} transition-colors hover:ring-1 hover:ring-amber-400/50 cursor-pointer`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-zinc-500">
              <span>Less</span>
              {["bg-[#2d2d2d]", "bg-[#0e4429]", "bg-[#006d32]", "bg-[#26a641]", "bg-[#39d353]"].map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
              ))}
              <span>More</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
