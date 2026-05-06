"use client"
import { PlatformAnalytics } from "@/lib/api/analytics.service"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Props { data: PlatformAnalytics }

export default function CodeChefTab({ data }: Props) {
  const stars = data.stars || "0★"
  const starCount = parseInt(stars) || 0
  const recentContests = (data.recentContests || []).slice(-10)

  const contestChartData = recentContests.map((c, i) => ({
    name: c.name?.substring(0, 15) || `#${i + 1}`,
    rating: c.rating || 0,
    rank: c.rank || 0,
  }))

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* CodeChef header - brown/warm theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2d1b0e] via-[#3d2317] to-[#4a2c1a] p-6 border border-amber-700/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700 to-yellow-600 shadow-lg shadow-amber-700/20">
            <span className="text-3xl font-black text-white">CC</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">CodeChef</h3>
            <p className="text-amber-300/50 text-sm mt-1">@{data.username}</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-amber-400">{data.currentRating || "—"}</p>
              <p className="text-[11px] text-zinc-400 font-medium">Current Rating</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-yellow-300">
                {Array.from({ length: Math.min(starCount, 7) }).map((_, i) => "★").join("")}
                {starCount === 0 && "—"}
              </p>
              <p className="text-[11px] text-zinc-400 font-medium">{stars}</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold text-orange-400">{data.highestRating || "—"}</p>
              <p className="text-[11px] text-zinc-400 font-medium">Highest Rating</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Problems Solved", value: data.totalSolved || 0, color: "text-amber-400" },
          { label: "Global Rank", value: data.globalRank ? `#${data.globalRank.toLocaleString()}` : "—", color: "text-yellow-400" },
          { label: "Country Rank", value: data.countryRank ? `#${data.countryRank.toLocaleString()}` : "—", color: "text-orange-400" },
        ].map((item) => (
          <Card key={item.label} className="border-amber-900/30 bg-[#2d1b0e]/80">
            <CardContent className="pt-5 pb-4 text-center">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Contest Performance */}
      {contestChartData.length > 0 && (
        <Card className="border-amber-900/30 bg-[#2d1b0e]/80">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">Recent Contest Performance</h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contestChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                  <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#2d1b0e', borderColor: '#5a3a1a', borderRadius: 10, fontSize: 12 }} itemStyle={{ color: '#fbbf24' }} />
                  <Bar dataKey="rating" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
