"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store/auth.store"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import { Flame, ExternalLink, Clock, Code2, Zap, Trophy, Loader2 } from "lucide-react"

interface RecentSubmission {
  id: string
  title: string
  titleSlug: string
  timestamp: string
  lang: string
}

const LANG_COLORS: Record<string, string> = {
  python3: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  python: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
  java: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  cpp: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  "c++": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  c: "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400",
  javascript: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  typescript: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  golang: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
  go: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400",
  rust: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  kotlin: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  swift: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  csharp: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  mysql: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  default: "bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-400",
}

const LANG_DISPLAY: Record<string, string> = {
  python3: "Python",
  python: "Python",
  java: "Java",
  cpp: "C++",
  "c++": "C++",
  c: "C",
  javascript: "JS",
  typescript: "TS",
  golang: "Go",
  go: "Go",
  rust: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
  csharp: "C#",
  mysql: "SQL",
}

function timeAgo(timestamp: string): string {
  const now = Date.now()
  const then = parseInt(timestamp) * 1000
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function isToday(timestamp: string): boolean {
  const date = new Date(parseInt(timestamp) * 1000)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

// Guest mock data
const GUEST_SUBMISSIONS: RecentSubmission[] = [
  { id: "1", title: "Two Sum", titleSlug: "two-sum", timestamp: String(Math.floor(Date.now() / 1000) - 3600), lang: "python3" },
  { id: "2", title: "Valid Parentheses", titleSlug: "valid-parentheses", timestamp: String(Math.floor(Date.now() / 1000) - 7200), lang: "java" },
  { id: "3", title: "Merge Two Sorted Lists", titleSlug: "merge-two-sorted-lists", timestamp: String(Math.floor(Date.now() / 1000) - 18000), lang: "cpp" },
  { id: "4", title: "Best Time to Buy and Sell Stock", titleSlug: "best-time-to-buy-and-sell-stock", timestamp: String(Math.floor(Date.now() / 1000) - 86400), lang: "python3" },
  { id: "5", title: "Binary Tree Inorder Traversal", titleSlug: "binary-tree-inorder-traversal", timestamp: String(Math.floor(Date.now() / 1000) - 172800), lang: "java" },
]

export default function RecentlySolved() {
  const [submissions, setSubmissions] = useState<RecentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const user = useAuthStore((state) => state.user) as any
  const { platforms, fetchPlatforms } = useDashboardStore()

  useEffect(() => {
    if (user?.isGuest) {
      setSubmissions(GUEST_SUBMISSIONS)
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const plats = await fetchPlatforms(false)
        const leetcode = plats.find(
          (p) => p.platformName.toLowerCase() === "leetcode"
        )

        if (!leetcode) {
          setError("Link your LeetCode account to see recent solves")
          setLoading(false)
          return
        }

        const res = await fetch(
          `/api/leetcode/recent?username=${encodeURIComponent(leetcode.username)}`
        )

        if (!res.ok) throw new Error("Failed to fetch")

        const data = await res.json()
        setSubmissions(data.submissions || [])
      } catch (err) {
        console.error("Failed to fetch recent submissions:", err)
        setError("Could not load recent submissions")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.isGuest, fetchPlatforms])

  const todayCount = submissions.filter((s) => isToday(s.timestamp)).length

  return (
    <div className="group relative rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-violet-300 dark:hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10 hover:-translate-y-[2px]">
      {/* Glow effect */}
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-orange-500 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 dark:group-hover:opacity-30" />
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
              Recently Solved
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
              Live from LeetCode
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {todayCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <Zap className="h-2.5 w-2.5" />
              {todayCount} today
            </span>
          )}
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
            {submissions.length} recent
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-zinc-400 dark:text-zinc-500 animate-spin" />
            <span className="ml-2 text-sm text-zinc-400 dark:text-zinc-500">
              Fetching from LeetCode...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
              <Code2 className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
              Go to Platforms → Link your LeetCode account
            </p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
              <Trophy className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No recent submissions found
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
              Start solving problems on LeetCode!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
            {submissions.map((sub, idx) => {
              const langKey = sub.lang?.toLowerCase() || "default"
              const langColor = LANG_COLORS[langKey] || LANG_COLORS.default
              const langDisplay = LANG_DISPLAY[langKey] || sub.lang
              const solvedToday = isToday(sub.timestamp)

              return (
                <a
                  key={sub.id || idx}
                  href={`https://leetcode.com/problems/${sub.titleSlug}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 px-5 py-3.5 transition-all duration-200 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                >
                  {/* Index / today indicator */}
                  <div
                    className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                      solvedToday
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/20"
                        : "bg-zinc-100 dark:bg-white/[0.06] text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {solvedToday ? (
                      <Zap className="h-3.5 w-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Problem info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white truncate transition-colors">
                      {sub.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Language badge */}
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${langColor}`}
                      >
                        {langDisplay}
                      </span>
                      {/* Time ago */}
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-600">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(sub.timestamp)}
                      </span>
                      {/* LeetCode badge */}
                      <span className="text-[10px] text-amber-500 dark:text-amber-400/70 font-medium">
                        🟡 LC
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
