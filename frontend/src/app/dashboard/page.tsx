"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store/auth.store"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import TopBanner from "@/components/dashboard/TopBanner"
import StatsCards from "@/components/dashboard/StatsCards"
import StarredQuestions from "@/components/dashboard/StarredQuestions"
import TopicAnalysis from "@/components/dashboard/TopicAnalysis"
import ContestList from "@/components/dashboard/ContestList"
import PrepHub from "@/components/dashboard/PrepHub"
import CompanyPrep from "@/components/dashboard/CompanyPrep"
import LinkedPlatforms from "@/components/dashboard/LinkedPlatforms"
import Achievements from "@/components/dashboard/Achievements"
import GuestBanner from "@/components/dashboard/GuestBanner"
import { Code2 } from "lucide-react"

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user) as any
  const { platforms, starredProblems, starredCount, loading, platformsLoaded, starredLoaded, fetchAll } = useDashboardStore()
  const [initializing, setInitializing] = useState(!platformsLoaded || !starredLoaded)

  useEffect(() => {
    const init = async () => {
      await fetchAll(user?.isGuest)
      setInitializing(false)
    }
    if (!platformsLoaded || !starredLoaded) {
      init()
    } else {
      setInitializing(false)
    }
  }, [user?.isGuest, platformsLoaded, starredLoaded, fetchAll])

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-xl shadow-violet-500/20 animate-pulse">
            <Code2 className="h-8 w-8 text-white" />
          </div>
          <div className="absolute inset-[-8px] rounded-3xl border-2 border-violet-500/20 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-violet-500" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 tracking-tight">
            Just a moment...
          </h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Loading your dashboard
          </p>
        </div>
        <div className="w-48 h-1 rounded-full bg-zinc-200 dark:bg-white/[0.06] overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 animate-shimmer" />
        </div>
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
          .animate-shimmer {
            animation: shimmer 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {user?.isGuest && <GuestBanner />}

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {user?.isGuest 
            ? "Explore CodePulse with demo data — sign up to track your real progress" 
            : "Here\u0027s your coding progress overview"
          }
        </p>
      </div>

      <TopBanner />

      <StatsCards prefetchedPlatforms={platforms} prefetchedStarredCount={starredCount} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6 min-w-0">
          <StarredQuestions prefetchedStarred={starredProblems} />
          <TopicAnalysis />
          <Achievements prefetchedPlatforms={platforms} />
        </div>

        <div className="space-y-6">
          <ContestList />
          <PrepHub />
          <LinkedPlatforms prefetchedPlatforms={platforms} />
          <CompanyPrep />
        </div>
      </div>
    </div>
  )
}