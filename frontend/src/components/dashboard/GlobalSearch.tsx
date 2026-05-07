"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Search, X, Trophy, FolderGit2, Code2, Settings, ExternalLink } from "lucide-react"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import { useRouter } from "next/navigation"
import Fuse from "fuse.js"

interface SearchItem {
  id: string
  title: string
  subtitle: string
  category: "contest" | "project" | "platform" | "setting"
  icon: string
  url?: string
  route?: string
}

const SETTINGS_ITEMS: SearchItem[] = [
  { id: "s-account", title: "Account Settings", subtitle: "Manage your profile and email", category: "setting", icon: "⚙️", route: "/dashboard/settings" },
  { id: "s-platforms", title: "Linked Platforms", subtitle: "Manage connected coding platforms", category: "setting", icon: "🔗", route: "/dashboard/settings#platforms" },
  { id: "s-notifications", title: "Notification Preferences", subtitle: "Configure alerts and reminders", category: "setting", icon: "🔔", route: "/dashboard/settings#notifications" },
  { id: "s-appearance", title: "Appearance", subtitle: "Dark mode, light mode, theme", category: "setting", icon: "🎨", route: "/dashboard/settings#appearance" },
  { id: "s-privacy", title: "Privacy Settings", subtitle: "Control data and visibility", category: "setting", icon: "🔒", route: "/dashboard/settings#privacy" },
  { id: "s-danger", title: "Delete Account", subtitle: "Permanently delete your account", category: "setting", icon: "⚠️", route: "/dashboard/settings#danger" },
  { id: "s-analytics", title: "Platform Analytics", subtitle: "View detailed coding stats", category: "setting", icon: "📊", route: "/dashboard/analytics" },
  { id: "s-terminal", title: "Terminal Analyzer", subtitle: "Run code and analyze complexity", category: "setting", icon: "💻", route: "/dashboard/terminal" },
  { id: "s-projects", title: "Projects", subtitle: "View GitHub repositories", category: "setting", icon: "📁", route: "/dashboard/projects" },
  { id: "s-tracker", title: "Problems Tracker", subtitle: "Track solved problems", category: "setting", icon: "📝", route: "/dashboard/tracker" },
  { id: "s-leaderboard", title: "Leaderboard", subtitle: "View global rankings", category: "setting", icon: "🏆", route: "/dashboard/leaderboard" },
]

const categoryLabels: Record<string, { label: string; icon: any }> = {
  contest: { label: "Contests", icon: Trophy },
  project: { label: "Projects", icon: FolderGit2 },
  platform: { label: "Platforms", icon: Code2 },
  setting: { label: "Pages & Settings", icon: Settings },
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const contestsCache = useDashboardStore((s) => s.contestsCache)
  const platforms = useDashboardStore((s) => s.platforms)

  // Build search index
  const allItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [...SETTINGS_ITEMS]

    // Contests
    if (contestsCache?.data) {
      contestsCache.data.forEach((c, i) => {
        items.push({
          id: `c-${i}`,
          title: c.title,
          subtitle: `${c.platform} • ${new Date(c.startTime * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })}`,
          category: "contest",
          icon: "🏆",
          url: c.url,
        })
      })
    }

    // GitHub projects from localStorage
    try {
      const repos = JSON.parse(localStorage.getItem("codepulse_github_repos") || "[]")
      repos.forEach((r: any) => {
        items.push({
          id: `p-${r.id}`,
          title: r.name,
          subtitle: r.description || r.language || "GitHub repository",
          category: "project",
          icon: "📂",
          url: r.html_url,
        })
      })
    } catch {}

    // Platforms
    platforms.forEach(p => {
      items.push({
        id: `pl-${p.id}`,
        title: `${p.platformName} — @${p.username}`,
        subtitle: `${p.totalSolved || 0} problems solved`,
        category: "platform",
        icon: "💻",
        route: "/dashboard/analytics",
      })
    })

    return items
  }, [contestsCache, platforms])

  const fuse = useMemo(() => new Fuse(allItems, {
    keys: ["title", "subtitle"],
    threshold: 0.4,
    includeScore: true,
  }), [allItems])

  const results = useMemo(() => {
    if (!query.trim()) return []
    return fuse.search(query).slice(0, 12).map(r => r.item)
  }, [query, fuse])

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, SearchItem[]> = {}
    results.forEach(r => {
      if (!map[r.category]) map[r.category] = []
      map[r.category].push(r)
    })
    return map
  }, [results])

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === "Escape") {
        setOpen(false)
        setQuery("")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleSelect = (item: SearchItem) => {
    setOpen(false)
    setQuery("")
    if (item.url) {
      window.open(item.url, "_blank")
    } else if (item.route) {
      router.push(item.route)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="header-search"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="h-9 flex items-center gap-2 px-3 rounded-xl text-zinc-400 hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all duration-200 hover:shadow-sm"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          ⌘K
        </kbd>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" />

          {/* Search Modal */}
          <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-[10vh] px-4">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <Search className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search contests, projects, platforms, pages..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  autoFocus
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => { setOpen(false); setQuery("") }}
                  className="text-[10px] font-medium text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                >
                  ESC
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto">
                {query && results.length === 0 ? (
                  <div className="py-10 text-center text-sm text-zinc-400">
                    No results for &quot;{query}&quot;
                  </div>
                ) : query ? (
                  <div className="py-2">
                    {Object.entries(grouped).map(([cat, items]) => {
                      const config = categoryLabels[cat]
                      const Icon = config?.icon || Settings
                      return (
                        <div key={cat}>
                          <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                            <Icon className="h-3 w-3" />
                            {config?.label || cat}
                          </div>
                          {items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-colors text-left"
                            >
                              <span className="text-base">{item.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{item.title}</p>
                                <p className="text-xs text-zinc-400 truncate">{item.subtitle}</p>
                              </div>
                              {item.url && <ExternalLink className="h-3 w-3 text-zinc-300 flex-shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    Start typing to search across your dashboard...
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
