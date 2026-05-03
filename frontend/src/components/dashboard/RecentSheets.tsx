"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, FileText, ArrowRight, BookOpen } from "lucide-react"

interface RecentItem {
  id: string
  title: string
  platform: string
  timestamp: string
  difficulty?: "Easy" | "Medium" | "Hard"
}

interface SheetItem {
  id: string
  title: string
  count: number
  progress: number
}

// Placeholder data — connect to real API when available
const recentItems: RecentItem[] = [
  {
    id: "1",
    title: "Two Sum",
    platform: "LeetCode",
    timestamp: "2 hours ago",
    difficulty: "Easy",
  },
  {
    id: "2",
    title: "Merge Intervals",
    platform: "LeetCode",
    timestamp: "5 hours ago",
    difficulty: "Medium",
  },
  {
    id: "3",
    title: "Binary Tree Level Order",
    platform: "LeetCode",
    timestamp: "1 day ago",
    difficulty: "Medium",
  },
  {
    id: "4",
    title: "Reverse Linked List",
    platform: "CodeChef",
    timestamp: "2 days ago",
    difficulty: "Easy",
  },
]

const customSheets: SheetItem[] = [
  { id: "1", title: "DSA Fundamentals", count: 50, progress: 30 },
  { id: "2", title: "Dynamic Programming", count: 40, progress: 12 },
  { id: "3", title: "Graph Theory", count: 35, progress: 5 },
]

const difficultyColors: Record<string, string> = {
  Easy: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  Medium: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  Hard: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
}

export default function RecentSheets() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden">
      <Tabs defaultValue="recent" className="w-full">
        {/* Header with tabs */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Activity</h3>
          </div>
          <TabsList className="bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] h-8">
            <TabsTrigger
              value="recent"
              className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white text-zinc-500 dark:text-zinc-400 h-6 px-3"
            >
              Recent
            </TabsTrigger>
            <TabsTrigger
              value="sheets"
              className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white text-zinc-500 dark:text-zinc-400 h-6 px-3"
            >
              Custom Sheets
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Recent tab */}
        <TabsContent value="recent" className="mt-0">
          <div className="p-3 space-y-1">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03] cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] flex-shrink-0">
                  <FileText className="h-4 w-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white truncate transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{item.platform}</span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-600">{item.timestamp}</span>
                  </div>
                </div>
                {item.difficulty && (
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                      difficultyColors[item.difficulty]
                    }`}
                  >
                    {item.difficulty}
                  </span>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Custom Sheets tab */}
        <TabsContent value="sheets" className="mt-0">
          <div className="p-3 space-y-1.5">
            {customSheets.map((sheet) => (
              <div
                key={sheet.id}
                className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03] cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-gradient-to-br dark:from-violet-500/20 dark:to-blue-500/20 border border-violet-100 dark:border-violet-500/10 flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white truncate transition-colors">
                    {sheet.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700"
                        style={{
                          width: `${(sheet.progress / sheet.count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                      {sheet.progress}/{sheet.count}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-all group-hover:translate-x-0.5 flex-shrink-0" />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
