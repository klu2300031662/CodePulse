"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Star, GitFork, ExternalLink, Calendar, Pin, PinOff, RefreshCw, Unlink, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/store/auth.store"
import GuestGate from "@/components/dashboard/GuestGate"
import { GitHubService } from "@/lib/api/github.service"

// GitHub language colors
const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", "C#": "#178600", Go: "#00ADD8", Rust: "#dea584",
  Ruby: "#701516", PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB",
  HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Jupyter: "#DA5B0B", Scala: "#c22d40",
  R: "#198CE7", Lua: "#000080", Vue: "#41b883", SCSS: "#c6538c", Makefile: "#427819",
}

interface Repository {
  id: number
  name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  html_url: string
  fork: boolean
}

/**
 * Build user-specific storage keys.
 * This ensures GitHub data from one user doesn't leak into another user's session.
 */
function getStorageKeys(userId: number | string) {
  const prefix = `codepulse_github_${userId}`
  return {
    repos: `${prefix}_repos`,
    pinned: `${prefix}_pinned`,
    lastSync: `${prefix}_lastSync`,
  }
}

// Legacy keys (for migration/cleanup)
const LEGACY_STORAGE_KEYS = {
  username: "codepulse_github_username",
  repos: "codepulse_github_repos",
  pinned: "codepulse_github_pinned",
  lastSync: "codepulse_github_lastSync",
}

const REPOS_PER_PAGE = 20

export default function ProjectsPage() {
  const user = useAuthStore((s) => s.user) as any
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [inputUsername, setInputUsername] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pinnedIds, setPinnedIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  const storageKeys = useMemo(() => {
    return user?.id ? getStorageKeys(user.id) : null
  }, [user?.id])

  // ── On mount: restore from backend + user-scoped localStorage ──
  useEffect(() => {
    if (!user || user.isGuest || !storageKeys) {
      setInitialLoading(false)
      return
    }

    // Migrate legacy keys → user-specific keys (one-time)
    migrateLegacyKeys(storageKeys)

    // 1. Try user-scoped localStorage for instant render
    const cachedRepos = localStorage.getItem(storageKeys.repos)
    const cachedPinned = localStorage.getItem(storageKeys.pinned)
    const cachedSync = localStorage.getItem(storageKeys.lastSync)

    if (cachedRepos) {
      try { setRepos(JSON.parse(cachedRepos)) } catch { /* ignore */ }
    }
    if (cachedPinned) {
      try { setPinnedIds(JSON.parse(cachedPinned)) } catch { /* ignore */ }
    }
    if (cachedSync) setLastSyncTime(cachedSync)

    // 2. Load GitHub username from backend (persisted across devices/sessions)
    GitHubService.getGitHubLink()
      .then((data) => {
        if (data.linked && data.githubUsername) {
          setUsername(data.githubUsername)
          if (data.lastSyncedAt) setLastSyncTime(data.lastSyncedAt)

          // If we have no cached repos, fetch them now
          if (!cachedRepos) {
            fetchAllRepos(data.githubUsername).then((repos) => {
              setRepos(repos)
              const now = new Date().toISOString()
              setLastSyncTime(now)
              if (storageKeys) {
                localStorage.setItem(storageKeys.repos, JSON.stringify(repos))
                localStorage.setItem(storageKeys.lastSync, now)
              }
            }).catch(console.error)
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load GitHub link:", err)
      })
      .finally(() => {
        setInitialLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Persist pinned repos (user-scoped)
  useEffect(() => {
    if (storageKeys) {
      localStorage.setItem(storageKeys.pinned, JSON.stringify(pinnedIds))
    }
  }, [pinnedIds, storageKeys])

  // Migrate old generic keys to user-specific keys (one-time cleanup)
  function migrateLegacyKeys(keys: ReturnType<typeof getStorageKeys>) {
    const legacyUsername = localStorage.getItem(LEGACY_STORAGE_KEYS.username)
    const legacyRepos = localStorage.getItem(LEGACY_STORAGE_KEYS.repos)
    const legacyPinned = localStorage.getItem(LEGACY_STORAGE_KEYS.pinned)
    const legacySync = localStorage.getItem(LEGACY_STORAGE_KEYS.lastSync)

    if (legacyRepos && !localStorage.getItem(keys.repos)) {
      localStorage.setItem(keys.repos, legacyRepos)
    }
    if (legacyPinned && !localStorage.getItem(keys.pinned)) {
      localStorage.setItem(keys.pinned, legacyPinned)
    }
    if (legacySync && !localStorage.getItem(keys.lastSync)) {
      localStorage.setItem(keys.lastSync, legacySync)
    }

    // Clean up legacy keys
    Object.values(LEGACY_STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
  }

  // Fetch ALL repos (handles pagination from GitHub API)
  const fetchAllRepos = useCallback(async (user: string) => {
    const allRepos: Repository[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const res = await fetch(
        `https://api.github.com/users/${user}/repos?per_page=${perPage}&sort=updated&page=${page}`
      )
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) break
      allRepos.push(...data)
      if (data.length < perPage) break
      page++
    }

    return allRepos
  }, [])

  const syncGithub = async () => {
    if (!inputUsername.trim()) return
    setIsDialogOpen(false)
    setLoading(true)
    const ghUser = inputUsername.trim()

    try {
      const data = await fetchAllRepos(ghUser)
      setRepos(data)
      setUsername(ghUser)
      const now = new Date().toISOString()
      setLastSyncTime(now)

      // Persist username to backend (survives logout)
      await GitHubService.linkGitHub(ghUser)

      // Cache repos in user-scoped localStorage
      if (storageKeys) {
        localStorage.setItem(storageKeys.repos, JSON.stringify(data))
        localStorage.setItem(storageKeys.lastSync, now)
      }
    } catch (err) {
      console.error(err)
      setRepos([])
    } finally {
      setLoading(false)
    }
  }

  const resyncGithub = async () => {
    if (!username) return
    setLoading(true)
    try {
      const data = await fetchAllRepos(username)
      setRepos(data)
      const now = new Date().toISOString()
      setLastSyncTime(now)

      // Update sync time on backend
      GitHubService.updateSyncTime().catch(() => {})

      if (storageKeys) {
        localStorage.setItem(storageKeys.repos, JSON.stringify(data))
        localStorage.setItem(storageKeys.lastSync, now)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const unlinkGithub = async () => {
    try {
      // Remove from backend first
      await GitHubService.unlinkGitHub()
    } catch (err) {
      console.error("Failed to unlink GitHub from backend:", err)
    }

    // Clear local state
    setUsername("")
    setRepos([])
    setPinnedIds([])
    setLastSyncTime(null)
    setSearchQuery("")
    setCurrentPage(1)
    setInputUsername("")

    // Clear user-scoped localStorage
    if (storageKeys) {
      Object.values(storageKeys).forEach(k => localStorage.removeItem(k))
    }
  }

  const togglePin = (id: number) => {
    setPinnedIds(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id)
      if (prev.length >= 6) return prev // max 6 pins
      return [...prev, id]
    })
  }

  // Filter & sort: pinned first, then by updated_at
  const filteredRepos = useMemo(() => {
    let list = repos.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.language || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    const pinned = list.filter(r => pinnedIds.includes(r.id))
    const unpinned = list.filter(r => !pinnedIds.includes(r.id))
    return [...pinned, ...unpinned]
  }, [repos, searchQuery, pinnedIds])

  const totalPages = Math.ceil(filteredRepos.length / REPOS_PER_PAGE)
  const paginatedRepos = filteredRepos.slice(
    (currentPage - 1) * REPOS_PER_PAGE,
    currentPage * REPOS_PER_PAGE
  )

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (user?.isGuest) return <GuestGate />

  // Initial loading (checking backend for linked GitHub)
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-fade-in-up">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
        <p className="text-sm">Loading your projects...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Project Portfolio
          </h2>
          <p className="text-muted-foreground text-sm">
            {username
              ? <>{filteredRepos.length} public repositories from <strong>@{username}</strong></>
              : "Sync your GitHub to view all public repositories."
            }
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {username ? (
            <>
              <Button variant="outline" size="sm" className="flex gap-2" onClick={resyncGithub} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Re-sync
              </Button>
              <Button variant="outline" size="sm" className="flex gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={unlinkGithub}>
                <Unlink className="h-4 w-4" />
                Unlink GitHub
              </Button>
            </>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex gap-2 bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-100 dark:to-zinc-200 dark:text-zinc-900 hover:opacity-90">
                  <Github className="w-4 h-4" />
                  Sync with GitHub
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Github className="h-5 w-5" /> Sync GitHub</DialogTitle>
                  <DialogDescription>
                    Enter your GitHub username to sync all your public repositories.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">Username</Label>
                    <Input
                      id="username"
                      value={inputUsername}
                      onChange={(e) => setInputUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && syncGithub()}
                      className="col-span-3"
                      placeholder="octocat"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={syncGithub} disabled={!inputUsername.trim()}>
                    <Github className="h-4 w-4 mr-2" />
                    Sync Repositories
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Not synced state */}
      {!username ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 text-muted-foreground">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full blur-2xl opacity-10" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <Github className="h-10 w-10 text-zinc-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">No GitHub Account Linked</h3>
          <p className="text-sm text-center max-w-md">Click &quot;Sync with GitHub&quot; to view your public repositories, pin favorites, and track your projects.</p>
        </div>
      ) : loading && repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
          <p className="text-sm">Fetching repositories from GitHub...</p>
        </div>
      ) : (
        <>
          {/* Search + Stats bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 w-full max-w-sm shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search repos by name, description, or language..."
                className="bg-transparent border-none outline-none w-full text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {lastSyncTime && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last synced: {formatDate(lastSyncTime)}
                </span>
              )}
              {pinnedIds.length > 0 && (
                <span className="flex items-center gap-1">
                  <Pin className="h-3 w-3" />
                  {pinnedIds.length}/6 pinned
                </span>
              )}
            </div>
          </div>

          {/* Repo grid */}
          {filteredRepos.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No repositories match your search.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedRepos.map((repo) => {
                  const isPinned = pinnedIds.includes(repo.id)
                  return (
                    <Card
                      key={repo.id}
                      className={`group flex flex-col h-full transition-all duration-300 hover:shadow-lg ${
                        isPinned
                          ? "border-violet-300 dark:border-violet-700 bg-violet-50/30 dark:bg-violet-950/10 shadow-sm shadow-violet-200/50 dark:shadow-violet-900/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-base font-semibold line-clamp-1 truncate flex items-center gap-1.5">
                            {isPinned && <Pin className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />}
                            {repo.name}
                          </CardTitle>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => togglePin(repo.id)}
                              className={`p-1 rounded-md transition-colors ${
                                isPinned
                                  ? "text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                                  : "text-zinc-400 hover:text-violet-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              }`}
                              title={isPinned ? "Unpin" : pinnedIds.length >= 6 ? "Max 6 pins" : "Pin to top"}
                            >
                              {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                            </button>
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2 text-xs mt-1 min-h-[2rem]">
                          {repo.description || "No description provided."}
                        </CardDescription>
                      </CardHeader>

                      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3 mt-auto px-4 pb-3">
                        <div className="flex items-center gap-3">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span
                                className="h-2.5 w-2.5 rounded-full inline-block"
                                style={{ backgroundColor: LANG_COLORS[repo.language] || "#8b8b8b" }}
                              />
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3" /> {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <GitFork className="w-3 h-3" /> {repo.forks_count}
                          </span>
                        </div>
                        <span className="text-[10px]">{formatDate(repo.updated_at)}</span>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page: number
                      if (totalPages <= 7) {
                        page = i + 1
                      } else if (currentPage <= 4) {
                        page = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i
                      } else {
                        page = currentPage - 3 + i
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                            currentPage === page
                              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex gap-1"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
