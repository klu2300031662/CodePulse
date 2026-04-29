"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Trophy, Clock, Calendar,
  ChevronDown, ChevronUp, RefreshCw, Unlink, Link2
} from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"
import { format } from "date-fns"

export default function DashboardPage() {
  const user = useAuthStore(state => state.user)
  const [platforms, setPlatforms] = useState<PlatformLink[]>([])
  const [expandedPlatform, setExpandedPlatform] = useState<number | null>(null)

  useEffect(() => {
    PlatformService.getUserPlatforms()
      .then(res => setPlatforms(res))
      .catch(err => console.error(err))
  }, [])
  
  const handleUnlink = async (id: number) => {
    if (confirm("Are you sure you want to unlink this platform?")) {
      try {
        await PlatformService.removePlatform(id)
        setPlatforms(platforms.filter(p => p.id !== id))
      } catch (err) {
        console.error("Failed to unlink", err)
      }
    }
  }

  const getUpcomingContests = () => {
    const defaultContests = [
      { id: 1, platform: 'LeetCode', name: 'Weekly Contest 405', startsIn: 'in 14h 32m', date: 'Sun, 8:00 AM' },
      { id: 2, platform: 'Codeforces', name: 'Round 950 (Div. 2)', startsIn: 'in 1d 2h', date: 'Mon, 8:00 PM' },
      { id: 3, platform: 'GeeksForGeeks', name: 'Job-A-Thon 34', startsIn: 'in 2d 5h', date: 'Wed, 8:00 PM' },
      { id: 4, platform: 'HackerRank', name: 'ProjectEuler+', startsIn: 'in 3d 10h', date: 'Sat, 1:00 PM' }
    ];
    
    if (platforms.length === 0) return [];
    const linkedNames = platforms.map(p => p.platformName);
    return defaultContests.filter(c => linkedNames.includes(c.platform)).sort((a,b) => a.startsIn.localeCompare(b.startsIn));
  }
  
  const upcomingContests = getUpcomingContests();

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)]">
      {/* Left Side Panel (Command Area) */}
      <div className="w-full max-w-[320px] space-y-6 flex-shrink-0">
        
        {/* 1. User Profile Section */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center relative">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10" />
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-blue-500/20 ring-4 ring-white dark:ring-[#09090b] relative z-10 mb-4 transition-transform hover:scale-105">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'D'}
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 relative z-10">
              {user?.name || user?.username || 'Developer'}
            </h3>
            <p className="text-sm font-medium text-muted-foreground mt-1 relative z-10">@{user?.username || 'dev_user'}</p>
          </CardContent>
        </Card>

        {/* 2. Connected Platforms Section */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 text-center">
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              <Link2 className="h-5 w-5 text-blue-500" /> Linked Platforms
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {platforms.length > 0 ? platforms.map(platform => (
                <div key={platform.id} className="flex flex-col">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    onClick={() => setExpandedPlatform(expandedPlatform === platform.id ? null : platform.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold shadow-sm">
                        {platform.platformName.substring(0, 1)}
                      </div>
                      <div className="space-y-1 mt-0.5">
                        <p className="text-sm font-semibold leading-none">{platform.platformName}</p>
                        <p className="text-xs text-green-500 dark:text-green-400 font-medium">Connected</p>
                      </div>
                    </div>
                    {expandedPlatform === platform.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  
                  {expandedPlatform === platform.id && (
                    <div className="px-4 pb-4 pt-1 bg-zinc-50/80 dark:bg-zinc-900/40 animate-in slide-in-from-top-2">
                      <div className="space-y-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b]">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Username:</span>
                          <span className="font-medium text-foreground">@{platform.username}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Solved:</span>
                          <span className="font-bold text-foreground text-blue-600 dark:text-blue-400">{platform.totalSolved}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Last Sync:</span>
                          <span className="font-medium text-foreground text-xs">{platform.lastSyncedAt ? format(new Date(platform.lastSyncedAt), 'MMM d, h:mm a') : 'Never'}</span>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                          <Button size="sm" variant="outline" className="w-full text-xs h-8 bg-white dark:bg-[#09090b]"><RefreshCw className="h-3 w-3 mr-1.5" /> Sync</Button>
                          <Button size="sm" variant="outline" className="w-full text-xs h-8 text-red-500 bg-white dark:bg-[#09090b] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleUnlink(platform.id)}><Unlink className="h-3 w-3 mr-1.5" /> Disconnect</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">No platforms connected yet</p>
                  <Link href="/dashboard/platforms">
                    <Button size="sm" className="w-full shadow-sm">Connect Platform</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Upcoming Contests Section */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 text-center">
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-orange-500" /> Upcoming Contests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {upcomingContests.length > 0 ? (
              upcomingContests.map(contest => (
                <div key={contest.id} className="group flex flex-col p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-500 font-bold shrink-0 shadow-sm border border-orange-100 dark:border-orange-900/50">
                      {contest.platform.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1 mt-0.5 w-full">
                      <p className="text-xs font-semibold uppercase text-orange-600 dark:text-orange-500 tracking-wider leading-none">{contest.platform}</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{contest.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg mb-3">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Starts {contest.startsIn}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {contest.date}</span>
                  </div>
                  <Button size="sm" className="w-full h-8 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white shadow-sm border-0 group-hover:shadow transition-all">
                    Register
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                <Trophy className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">No upcoming contests</p>
                <p className="text-xs text-muted-foreground px-4">Connect more platforms to see contests here.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
      
      {/* the rest of the dashboard is empty now as requested */}
    </div>
  )
}
