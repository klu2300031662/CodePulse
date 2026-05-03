"use client"

import { useAuthStore } from "@/lib/store/auth.store"
import TopBanner from "@/components/dashboard/TopBanner"
import StatsCards from "@/components/dashboard/StatsCards"
import RecentSheets from "@/components/dashboard/RecentSheets"
import TopicAnalysis from "@/components/dashboard/TopicAnalysis"
import ContestList from "@/components/dashboard/ContestList"
import PrepHub from "@/components/dashboard/PrepHub"
import CompanyPrep from "@/components/dashboard/CompanyPrep"
import LinkedPlatforms from "@/components/dashboard/LinkedPlatforms"
import Achievements from "@/components/dashboard/Achievements"

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Here&apos;s your coding progress overview
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
          {/* Recent / Sheets */}
          <RecentSheets />

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