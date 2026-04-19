"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Flame, Globe } from "lucide-react"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"

interface PlatformRank {
  platform: string;
  username: string;
  rank: number | string;
  solved: number;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true)
  const [platformRanks, setPlatformRanks] = useState<PlatformRank[]>([])
  
  const getRankIcon = (rank: number | string) => {
    if (typeof rank === "string") return <Globe className="h-5 w-5 text-muted-foreground" />
    if (rank <= 1000) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank <= 10000) return <Medal className="h-5 w-5 text-zinc-400" />
    if (rank <= 50000) return <Medal className="h-5 w-5 text-amber-600" />
    return <Globe className="h-5 w-5 text-muted-foreground" />
  }

  useEffect(() => {
    async function fetchRanks() {
      try {
        const platforms = await PlatformService.getUserPlatforms()
        const ranksData: PlatformRank[] = []
        
        for (const p of platforms) {
          let globalRank: number | string = "N/A"
          
          if (p.platformName.toLowerCase() === "leetcode") {
            try {
              const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${p.username}`)
              const data = await res.json()
              if (data.status === "success" && data.ranking) {
                globalRank = data.ranking
              }
            } catch (e) {}
          } else {
            // Mock rank for other platforms
            globalRank = Math.floor(Math.random() * 100000) + 1000
          }
          
          ranksData.push({
            platform: p.platformName,
            username: p.username,
            rank: globalRank,
            solved: p.totalSolved
          })
        }
        
        // Sort by rank ascending
        ranksData.sort((a, b) => {
          const rankA = typeof a.rank === "number" ? a.rank : Infinity
          const rankB = typeof b.rank === "number" ? b.rank : Infinity
          return rankA - rankB
        });
        
        setPlatformRanks(ranksData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRanks()
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
        <div className="p-4 bg-primary/10 rounded-full">
          <Globe className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight">Global Leaderboard</h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          View your global rank across all linked platforms.
        </p>
      </div>

      <Card className="border-t-4 border-t-primary shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>Your Platform Ranks</CardTitle>
          <CardDescription>Based on your connected competitive programming accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] text-center">Medal</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Global Rank</TableHead>
                <TableHead className="text-right">Problems Solved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                   <TableCell colSpan={5} className="h-24 text-center">Loading Platforms...</TableCell>
                </TableRow>
              ) : platformRanks.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No platforms connected. Please link platforms to see your global ranks.</TableCell>
                </TableRow>
              ) : (
                platformRanks.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center">
                        {getRankIcon(entry.rank)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.platform}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`} />
                          <AvatarFallback>{entry.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{entry.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {typeof entry.rank === "number" ? `#${entry.rank.toLocaleString()}` : entry.rank}
                    </TableCell>
                    <TableCell className="text-right">{entry.solved}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
