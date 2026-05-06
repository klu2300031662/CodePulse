"use client"
import { useState, useEffect, useCallback } from "react"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import { useAuthStore } from "@/lib/store/auth.store"
import { AnalyticsService, PlatformAnalytics } from "@/lib/api/analytics.service"
import { PlatformLink } from "@/lib/api/platform.service"
import { RefreshCw, Link2, AlertCircle, BarChart3 } from "lucide-react"

import LeetCodeTab from "@/components/dashboard/analytics/LeetCodeTab"
import CodeforcesTab from "@/components/dashboard/analytics/CodeforcesTab"
import CodeChefTab from "@/components/dashboard/analytics/CodeChefTab"
import HackerRankTab from "@/components/dashboard/analytics/HackerRankTab"
import GFGTab from "@/components/dashboard/analytics/GFGTab"
import InterviewBitTab from "@/components/dashboard/analytics/InterviewBitTab"

// Guest mock analytics data
const GUEST_ANALYTICS: Record<string, PlatformAnalytics> = {
  LeetCode: {
    platform: "LeetCode", username: "demo_coder", fetchedAt: new Date().toISOString(),
    easySolved: 102, mediumSolved: 118, hardSolved: 27, totalSolved: 247,
    totalSubmissions: 892, acceptanceRate: 64.8, ranking: 85432,
    contestRating: 1654, contestsAttended: 12, globalRanking: 42000, topPercentage: 18.5,
  },
  Codeforces: {
    platform: "Codeforces", username: "demo_coder", fetchedAt: new Date().toISOString(),
    rating: 1423, maxRating: 1520, rank: "specialist", maxRank: "specialist",
    contribution: 5, friendOfCount: 23, totalSolved: 183, contestsAttended: 28,
    contestHistory: [
      { contestName: "Round #910", rank: 3200, oldRating: 1350, newRating: 1380 },
      { contestName: "Round #911", rank: 2800, oldRating: 1380, newRating: 1420 },
      { contestName: "Round #912", rank: 4100, oldRating: 1420, newRating: 1390 },
      { contestName: "Round #913", rank: 2500, oldRating: 1390, newRating: 1440 },
      { contestName: "Round #914", rank: 2200, oldRating: 1440, newRating: 1480 },
      { contestName: "Round #915", rank: 3500, oldRating: 1480, newRating: 1450 },
      { contestName: "Round #916", rank: 1800, oldRating: 1450, newRating: 1520 },
      { contestName: "Round #917", rank: 3900, oldRating: 1520, newRating: 1490 },
      { contestName: "Round #918", rank: 2100, oldRating: 1490, newRating: 1423 },
    ],
  },
  CodeChef: {
    platform: "CodeChef", username: "demo_coder", fetchedAt: new Date().toISOString(),
    currentRating: 1812, highestRating: 1900, stars: "4★", totalSolved: 96,
    globalRank: 15200, countryRank: 4200,
    recentContests: [
      { name: "Starters 130", rating: 1750, rank: 1200 },
      { name: "Starters 131", rating: 1780, rank: 1100 },
      { name: "Starters 132", rating: 1812, rank: 980 },
      { name: "Starters 133", rating: 1800, rank: 1050 },
      { name: "Starters 134", rating: 1850, rank: 900 },
      { name: "Starters 135", rating: 1900, rank: 820 },
    ],
  },
}

// Platform tab config
const PLATFORM_CONFIG: Record<string, {
  icon: string; label: string; gradient: string; activeGradient: string; borderColor: string;
}> = {
  LeetCode:      { icon: "🟡", label: "LeetCode",     gradient: "from-amber-500/10 to-orange-500/5",   activeGradient: "from-amber-500 to-orange-500",  borderColor: "border-amber-500/40" },
  Codeforces:    { icon: "🔵", label: "Codeforces",   gradient: "from-blue-500/10 to-indigo-500/5",    activeGradient: "from-blue-500 to-indigo-500",    borderColor: "border-blue-500/40" },
  CodeChef:      { icon: "🟤", label: "CodeChef",     gradient: "from-amber-700/10 to-yellow-600/5",   activeGradient: "from-amber-700 to-yellow-600",   borderColor: "border-amber-700/40" },
  HackerRank:    { icon: "🟢", label: "HackerRank",   gradient: "from-emerald-500/10 to-green-500/5",  activeGradient: "from-emerald-500 to-green-500",  borderColor: "border-emerald-500/40" },
  GeeksForGeeks: { icon: "🟢", label: "GFG",          gradient: "from-green-500/10 to-emerald-500/5",  activeGradient: "from-green-500 to-emerald-600",  borderColor: "border-green-500/40" },
  InterviewBit:  { icon: "🔷", label: "InterviewBit", gradient: "from-teal-500/10 to-cyan-500/5",      activeGradient: "from-teal-500 to-cyan-500",      borderColor: "border-teal-500/40" },
}

export default function AnalyticsPage() {
  const user = useAuthStore((state) => state.user) as any
  const { platforms, fetchPlatforms } = useDashboardStore()
  const [activeTab, setActiveTab] = useState<string>("")
  const [analyticsData, setAnalyticsData] = useState<Record<string, PlatformAnalytics>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlatforms(user?.isGuest)
  }, [user?.isGuest, fetchPlatforms])

  // Auto-select first platform
  useEffect(() => {
    if (platforms.length > 0 && !activeTab) {
      setActiveTab(platforms[0].platformName)
    }
  }, [platforms, activeTab])

  const fetchAnalytics = useCallback(async (platform: PlatformLink) => {
    if (user?.isGuest) {
      const mock = GUEST_ANALYTICS[platform.platformName]
      if (mock) {
        setAnalyticsData(prev => ({ ...prev, [platform.platformName]: mock }))
      }
      return
    }

    // Check if already loaded
    if (analyticsData[platform.platformName]) return

    setLoading(platform.platformName)
    setError(null)
    try {
      const data = await AnalyticsService.getPlatformAnalytics(platform.id)
      setAnalyticsData(prev => ({ ...prev, [platform.platformName]: data }))
    } catch (err: any) {
      setError(err.message || "Failed to fetch analytics")
    } finally {
      setLoading(null)
    }
  }, [user?.isGuest, analyticsData])

  // Fetch analytics when tab changes
  useEffect(() => {
    if (activeTab) {
      const platform = platforms.find(p => p.platformName === activeTab)
      if (platform) {
        fetchAnalytics(platform)
      }
    }
  }, [activeTab, platforms, fetchAnalytics])

  const handleRefresh = async () => {
    const platform = platforms.find(p => p.platformName === activeTab)
    if (!platform || user?.isGuest) return

    AnalyticsService.invalidateCache(platform.id)
    setAnalyticsData(prev => {
      const next = { ...prev }
      delete next[activeTab]
      return next
    })

    setLoading(activeTab)
    setError(null)
    try {
      const data = await AnalyticsService.getPlatformAnalytics(platform.id)
      setAnalyticsData(prev => ({ ...prev, [activeTab]: data }))
    } catch (err: any) {
      setError(err.message || "Failed to refresh analytics")
    } finally {
      setLoading(null)
    }
  }

  const renderPlatformContent = () => {
    if (loading === activeTab) {
      return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full blur-xl opacity-20 animate-pulse" />
            <RefreshCw className="h-8 w-8 text-zinc-400 animate-spin relative" />
          </div>
          <p className="text-zinc-500 text-sm mt-4">Fetching {activeTab} analytics...</p>
          <p className="text-zinc-700 text-xs mt-1">This may take a few seconds</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
          <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={handleRefresh} className="mt-4 text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-2">
            Try again
          </button>
        </div>
      )
    }

    const data = analyticsData[activeTab]
    if (!data) return null

    if (data.error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
          <AlertCircle className="h-8 w-8 text-amber-400 mb-3" />
          <p className="text-amber-400 text-sm">{data.error}</p>
        </div>
      )
    }

    switch (activeTab.toLowerCase()) {
      case "leetcode":      return <LeetCodeTab data={data} />
      case "codeforces":    return <CodeforcesTab data={data} />
      case "codechef":      return <CodeChefTab data={data} />
      case "hackerrank":    return <HackerRankTab data={data} />
      case "geeksforgeeks": return <GFGTab data={data} />
      case "interviewbit":  return <InterviewBitTab data={data} />
      default:              return <p className="text-zinc-500 text-center py-10">Unsupported platform</p>
    }
  }

  if (platforms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full blur-2xl opacity-10" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700">
            <Link2 className="h-10 w-10 text-zinc-600" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-zinc-200 mb-2">No Platforms Linked</h3>
        <p className="text-zinc-500 text-sm text-center max-w-md">
          Link your coding platform profiles from the Dashboard to see detailed analytics here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Platform Analytics
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Deep dive into your stats across each platform</p>
        </div>
        {activeTab && (
          <button
            onClick={handleRefresh}
            disabled={loading === activeTab}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading === activeTab ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform.platformName] || {
            icon: "🔗", label: platform.platformName,
            gradient: "from-zinc-500/10 to-zinc-500/5",
            activeGradient: "from-zinc-500 to-zinc-600",
            borderColor: "border-zinc-500/40",
          }
          const isActive = activeTab === platform.platformName
          const isLoading = loading === platform.platformName

          return (
            <button
              key={platform.id}
              id={`analytics-tab-${platform.platformName.toLowerCase()}`}
              onClick={() => setActiveTab(platform.platformName)}
              className={`
                group relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-300 cursor-pointer select-none
                ${isActive
                  ? `bg-gradient-to-r ${config.activeGradient} text-white shadow-lg ${config.borderColor} border`
                  : `bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60`
                }
              `}
            >
              {/* Active indicator glow */}
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r ${config.activeGradient} opacity-20 blur-xl rounded-xl`} />
              )}
              <span className="relative text-base">{config.icon}</span>
              <span className="relative">{config.label}</span>
              {isLoading && (
                <RefreshCw className="h-3 w-3 animate-spin relative" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderPlatformContent()}
      </div>
    </div>
  )
}
