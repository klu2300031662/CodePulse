"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, ExternalLink } from "lucide-react"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"

const upcomingContests = [
  { id: 1, name: "Weekly Contest 405", platform: "LeetCode", date: "2026-04-15T18:00:00Z", link: "https://leetcode.com/contest/" },
  { id: 2, name: "Biweekly Contest 134", platform: "LeetCode", date: "2026-04-20T14:30:00Z", link: "https://leetcode.com/contest/" },
  { id: 3, name: "Codeforces Round 955 (Div. 2)", platform: "Codeforces", date: "2026-04-18T14:35:00Z", link: "https://codeforces.com/contests" },
  { id: 4, name: "Educational Codeforces Round 168", platform: "Codeforces", date: "2026-04-25T14:35:00Z", link: "https://codeforces.com/contests" },
  { id: 5, name: "GeeksForGeeks Weekly Coding", platform: "GeeksForGeeks", date: "2026-04-21T16:00:00Z", link: "https://practice.geeksforgeeks.org/events" },
  { id: 6, name: "Weekly Preparation", platform: "HackerRank", date: "2026-04-26T12:00:00Z", link: "https://www.hackerrank.com/contests" },
  { id: 7, name: "Weekly Contest 406", platform: "LeetCode", date: "2026-04-22T18:00:00Z", link: "https://leetcode.com/contest/" },
]

export default function ContestsPage() {
  const [platforms, setPlatforms] = useState<PlatformLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    PlatformService.getUserPlatforms()
      .then(data => {
        setPlatforms(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const linkedPlatformNames = platforms.map(p => p.platformName)
  const filteredContests = upcomingContests.filter(c => linkedPlatformNames.includes(c.platform)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upcoming Contests</h2>
        <p className="text-muted-foreground">View scheduled and upcoming contests based on your linked platforms.</p>
      </div>

      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle>Global Schedule</CardTitle>
          <CardDescription>Upcoming matches from LeetCode, Codeforces, HackerRank, etc.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                  <TableHead className="text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Loading Data...</TableCell>
                  </TableRow>
                ) : filteredContests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No upcoming contests found. Make sure to link platforms in Connected Platforms settings.</TableCell>
                  </TableRow>
                ) : (
                  filteredContests.map((contest) => (
                    <TableRow key={contest.id}>
                      <TableCell className="font-medium">{contest.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                          {contest.platform}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <div className="flex justify-end items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(contest.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <div className="flex justify-end items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(contest.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <a href={contest.link} target="_blank" rel="noreferrer" className="flex justify-end items-center hover:text-primary transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
