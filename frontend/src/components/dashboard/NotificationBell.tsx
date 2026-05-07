"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Bell, Trophy, Flame, Award, RefreshCw, X, Check, CheckCheck } from "lucide-react"
import { useDashboardStore } from "@/lib/store/dashboard.store"

interface Notification {
  id: string
  type: "contest" | "streak" | "badge" | "sync"
  title: string
  message: string
  time: number
  read: boolean
}

const NOTIF_KEY = "codepulse_notifications"
const NOTIF_READ_KEY = "codepulse_notif_read"

function getStoredReadIds(): string[] {
  try { return JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || "[]") } catch { return [] }
}

function setStoredReadIds(ids: string[]) {
  localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(ids))
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  contest: { icon: Trophy, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  streak: { icon: Flame, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  badge: { icon: Award, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
  sync: { icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const contestsCache = useDashboardStore((s) => s.contestsCache)
  const platforms = useDashboardStore((s) => s.platforms)
  const analyticsCache = useDashboardStore((s) => s.analyticsCache)

  useEffect(() => {
    setReadIds(getStoredReadIds())
  }, [])

  // Generate notifications from current data
  const notifications = useMemo<Notification[]>(() => {
    const notifs: Notification[] = []
    const now = Date.now()

    // Contest starting within 1 hour
    if (contestsCache?.data) {
      contestsCache.data.forEach(c => {
        const startMs = c.startTime * 1000
        const diff = startMs - now
        if (diff > 0 && diff < 60 * 60 * 1000) {
          const mins = Math.floor(diff / 60000)
          notifs.push({
            id: `contest-${c.startTime}`,
            type: "contest",
            title: `${c.platform} Contest Soon`,
            message: `"${c.title}" starts in ${mins} minutes`,
            time: now,
            read: false,
          })
        }
        // Contest starting within 24 hours
        if (diff > 60 * 60 * 1000 && diff < 24 * 60 * 60 * 1000) {
          const hours = Math.floor(diff / (60 * 60 * 1000))
          notifs.push({
            id: `contest-24h-${c.startTime}`,
            type: "contest",
            title: `Upcoming: ${c.platform}`,
            message: `"${c.title}" starts in ${hours} hours`,
            time: now - 5 * 60 * 1000,
            read: false,
          })
        }
      })
    }

    // Sync completed notifications for each platform
    platforms.forEach(p => {
      const data = analyticsCache[p.platformName]
      if (data && !data.error && !data.isPrivate) {
        notifs.push({
          id: `sync-${p.platformName}`,
          type: "sync",
          title: `${p.platformName} Synced`,
          message: `${p.username} — ${data.totalSolved || 0} problems tracked`,
          time: new Date(data.fetchedAt).getTime(),
          read: false,
        })
      }
      if (data?.error || data?.isPrivate) {
        notifs.push({
          id: `sync-err-${p.platformName}`,
          type: "sync",
          title: `${p.platformName} Sync Issue`,
          message: data.isPrivate ? "Profile is private" : (data.error || "Failed to fetch"),
          time: new Date(data.fetchedAt).getTime(),
          read: false,
        })
      }
    })

    // Streak notification (from GFG analytics)
    const gfg = analyticsCache["GeeksForGeeks"]
    if (gfg?.streak && gfg.streak > 0) {
      notifs.push({
        id: `streak-gfg`,
        type: "streak",
        title: "Streak Active! 🔥",
        message: `${gfg.streak} day streak on GFG — keep going!`,
        time: now - 30 * 60 * 1000,
        read: false,
      })
    }

    // Badge for high problem count
    platforms.forEach(p => {
      const data = analyticsCache[p.platformName]
      if (data?.totalSolved && data.totalSolved >= 100) {
        notifs.push({
          id: `badge-100-${p.platformName}`,
          type: "badge",
          title: "Century Club! 🏅",
          message: `You've solved ${data.totalSolved} problems on ${p.platformName}`,
          time: now - 60 * 60 * 1000,
          read: false,
        })
      }
    })

    // Apply read status
    return notifs
      .map(n => ({ ...n, read: readIds.includes(n.id) }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 15)
  }, [contestsCache, platforms, analyticsCache, readIds])

  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = (id: string) => {
    const updated = [...new Set([...readIds, id])]
    setReadIds(updated)
    setStoredReadIds(updated)
  }

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id)
    const updated = [...new Set([...readIds, ...allIds])]
    setReadIds(updated)
    setStoredReadIds(updated)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="header-notifications"
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all duration-200 hover:shadow-sm hover:scale-105"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0a0a1f]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[360px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => {
                const config = typeConfig[notif.type]
                const Icon = config.icon
                return (
                  <button
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                      !notif.read ? "bg-violet-50/30 dark:bg-violet-500/[0.03]" : ""
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${!notif.read ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"}`}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1">{timeAgo(notif.time)}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
