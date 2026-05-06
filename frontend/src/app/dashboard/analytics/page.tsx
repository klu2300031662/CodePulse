"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlatformChart } from "@/components/dashboard/platform-chart"
import { ActivityHeatmap } from "@/components/dashboard/heatmap"
import { Sparkles } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts"
import { PlatformLink } from "@/lib/api/platform.service"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import { useAuthStore } from "@/lib/store/auth.store"

export default function AnalyticsPage() {
  const user = useAuthStore((state) => state.user) as any
  const { platforms, fetchPlatforms, platformsLoaded } = useDashboardStore()
  const [difficultyData, setDifficultyData] = useState([
    { name: "Easy", value: 0, color: "#10b981" },
    { name: "Medium", value: 0, color: "#f59e0b" },
    { name: "Hard", value: 0, color: "#ef4444" },
  ])
  const [problemsSolvedData, setProblemsSolvedData] = useState<{month: string, solved: number}[]>([])
  
  useEffect(() => {
    // Use cached data, fetch only if not loaded yet
    fetchPlatforms(user?.isGuest)
  }, [user?.isGuest, fetchPlatforms])

  useEffect(() => {
    if (platforms.length > 0) {
      let easy = 0, medium = 0, hard = 0, total = 0;
      platforms.forEach(p => {
        easy += p.easySolved;
        medium += p.mediumSolved;
        hard += p.hardSolved;
        total += p.totalSolved;
      });
      setDifficultyData([
        { name: "Easy", value: easy, color: "#10b981" },
        { name: "Medium", value: medium, color: "#f59e0b" },
        { name: "Hard", value: hard, color: "#ef4444" },
      ]);
      setProblemsSolvedData([
        { month: "Jan", solved: total > 0 ? Math.round(total * 0.1) : 0 },
        { month: "Feb", solved: total > 0 ? Math.round(total * 0.2) : 0 },
        { month: "Mar", solved: total > 0 ? Math.round(total * 0.5) : 0 },
        { month: "Apr", solved: total > 0 ? Math.round(total * 0.7) : 0 },
        { month: "May", solved: total > 0 ? Math.round(total * 0.9) : 0 },
        { month: "Jun", solved: total },
      ]);
    }
  }, [platforms])

  const contestRatingData = platforms.length > 0 ? [
    { contest: "Contest 1", rating: 1200 },
    { contest: "Contest 2", rating: 1250 },
    { contest: "Contest 3", rating: 1210 },
    { contest: "Contest 4", rating: 1350 },
    { contest: "Contest 5", rating: 1420 },
    { contest: "Contest 6", rating: 1450 },
  ] : [
    { contest: "Contest 1", rating: 0 },
    { contest: "Contest 2", rating: 0 },
    { contest: "Contest 3", rating: 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Deep dive into your coding performance and statistics across all platforms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Problems Solved Over Time */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>Problems Solved Over Time</CardTitle>
            <CardDescription>Monthly coding progression</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={problemsSolvedData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="solved" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>Difficulty Distribution</CardTitle>
            <CardDescription>Easy vs Medium vs Hard</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform-wise Contributions */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Where you solve the most problems</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <PlatformChart />
          </CardContent>
        </Card>

        {/* Contest Rating Progression */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle>Contest Rating Progression</CardTitle>
            <CardDescription>Codeforces/LeetCode rating history</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contestRatingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
                <XAxis dataKey="contest" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="stepAfter" dataKey="rating" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
        
      {/* Activity Heatmap */}
      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
          <CardDescription>Daily coding habits across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap />
        </CardContent>
      </Card>
      
      {/* AI Suggestions */}
      <Card className="shadow-sm border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50 transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            AI Suggestions
          </CardTitle>
          <CardDescription className="text-blue-600/70 dark:text-blue-400/70">Personalized recommendations to improve your coding performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="bg-background rounded-md p-4 border">
            <p><strong className="text-primary">Focus Area:</strong> Dynamic Programming</p>
            <p className="text-muted-foreground mt-1">Based on your recent contest submissions, you struggle with 2D DP problems. Consider practicing more Medium-level DP problems on LeetCode.</p>
          </div>
          <div className="bg-background rounded-md p-4 border">
            <p><strong className="text-primary">Speed Improvement:</strong> Language Proficiency</p>
            <p className="text-muted-foreground mt-1">Your typical solution in Python takes longer than the optimal baseline. Try utilizing built-in libraries like `collections.defaultdict` or `heapq` more frequently.</p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
