"use client"

import { useAuthStore } from "@/lib/store/auth.store"
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

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user) as any

  return (
    <div className="space-y-6">
      {/* Guest Mode Banner */}
      {user?.isGuest && <GuestBanner />}

      {/* Welcome header */}
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

      {/* Top Banner */}
      <TopBanner />

      {/* Stats Cards */}
      <StatsCards />

      {/* Main Grid: Center (70%) + Right Panel (30%) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Center Column */}
        <div className="space-y-6 min-w-0">
          {/* Starred Questions */}
          <StarredQuestions />

          {/* Topic Analysis */}
          <TopicAnalysis />

          {/* Achievements */}
          <Achievements />
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Upcoming Contests */}
          <ContestList />

          {/* Interview Prep Hub */}
          <PrepHub />

          {/* Linked Platforms */}
          <LinkedPlatforms />

          {/* Company Prep (Future) */}
          <CompanyPrep />
        </div>
      </div>
    </div>
  )
}