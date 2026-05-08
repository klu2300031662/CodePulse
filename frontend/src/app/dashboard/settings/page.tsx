"use client"

import { useState, useEffect } from "react"
import { User, Link2, Bell, Palette, Shield, Trash2, Sun, Moon, Monitor, Save, LogOut, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import GuestGate from "@/components/dashboard/GuestGate"

const HIDDEN_PLATFORMS_KEY = "codepulse_hidden_platforms"

function getHiddenPlatforms(): string[] {
  try { return JSON.parse(localStorage.getItem(HIDDEN_PLATFORMS_KEY) || "[]") } catch { return [] }
}

function setHiddenPlatforms(ids: string[]) {
  localStorage.setItem(HIDDEN_PLATFORMS_KEY, JSON.stringify(ids))
}

const NOTIF_PREFS_KEY = "codepulse_notif_prefs"

function getNotifPrefs(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || '{"contests":true,"streaks":true,"badges":true,"sync":true}')
  } catch {
    return { contests: true, streaks: true, badges: true, sync: true }
  }
}

function setNotifPrefs(prefs: Record<string, boolean>) {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs))
}

const sections = [
  { id: "account", label: "Account", icon: User },
  { id: "platforms", label: "Linked Platforms", icon: Link2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
]

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user) as any
  const logout = useAuthStore((s) => s.logout)
  const { platforms } = useDashboardStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("account")
  const [hiddenPlatforms, setHiddenState] = useState<string[]>([])
  const [notifPrefs, setNotifState] = useState<Record<string, boolean>>({ contests: true, streaks: true, badges: true, sync: true })
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setHiddenState(getHiddenPlatforms())
    setNotifState(getNotifPrefs())
    const hash = window.location.hash.replace("#", "")
    if (hash && sections.find(s => s.id === hash)) {
      setActiveSection(hash)
    }
  }, [])

  if (user?.isGuest) return <GuestGate />

  const togglePlatformVisibility = (name: string) => {
    const updated = hiddenPlatforms.includes(name)
      ? hiddenPlatforms.filter(p => p !== name)
      : [...hiddenPlatforms, name]
    setHiddenState(updated)
    setHiddenPlatforms(updated)
    showSaved()
  }

  const toggleNotifPref = (key: string) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifState(updated)
    setNotifPrefs(updated)
    showSaved()
  }

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
          Settings
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your account, preferences, and integrations.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <nav className="lg:w-[220px] flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {sections.map(s => {
            const active = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <s.icon className={`h-4 w-4 ${active ? "text-violet-500" : "text-zinc-400"}`} />
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {saved && (
            <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium shadow-lg animate-in slide-in-from-top-2 duration-200">
              <Save className="h-4 w-4" /> Saved
            </div>
          )}

          {activeSection === "account" && (
            <div className="space-y-6">
              <SectionCard title="Profile Information">
                <div className="space-y-4">
                  <Field label="Full Name" value={user?.name || user?.fullName || "—"} />
                  <Field label="Email" value={user?.email || "—"} />
                  <Field label="Username" value={user?.username || "—"} />
                </div>
              </SectionCard>
              <SectionCard title="Session">
                <Button variant="outline" className="gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </SectionCard>
            </div>
          )}

          {activeSection === "platforms" && (
            <SectionCard title="Platform Visibility" description="Toggle which platforms appear on your dashboard.">
              <div className="space-y-2">
                {platforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No platforms linked yet.</p>
                ) : (
                  platforms.map(p => {
                    const hidden = hiddenPlatforms.includes(p.platformName)
                    return (
                      <div key={p.id} className="flex items-center justify-between px-3 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{p.platformName}</p>
                          <p className="text-xs text-zinc-400">@{p.username}</p>
                        </div>
                        <button
                          onClick={() => togglePlatformVisibility(p.platformName)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            hidden
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                              : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                          }`}
                        >
                          {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {hidden ? "Hidden" : "Visible"}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </SectionCard>
          )}

          {activeSection === "notifications" && (
            <SectionCard title="Notification Preferences" description="Choose which notifications you receive.">
              <div className="space-y-3">
                {[
                  { key: "contests", label: "Contest Alerts", desc: "Notify when a contest starts in 1 hour" },
                  { key: "streaks", label: "Streak Reminders", desc: "Alert when your streak is about to break" },
                  { key: "badges", label: "Badge Achievements", desc: "Notify when you earn a new milestone" },
                  { key: "sync", label: "Sync Status", desc: "Notify when platform sync completes or fails" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between px-3 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{item.label}</p>
                      <p className="text-xs text-zinc-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleNotifPref(item.key)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        notifPrefs[item.key] ? "bg-violet-500" : "bg-zinc-300 dark:bg-zinc-600"
                      }`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        notifPrefs[item.key] ? "translate-x-[22px]" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeSection === "appearance" && (
            <SectionCard title="Theme" description="Select your preferred color scheme.">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setTheme(opt.value); showSaved() }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      theme === opt.value
                        ? "border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-violet-200 dark:hover:border-violet-500/20"
                    }`}
                  >
                    <opt.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {activeSection === "privacy" && (
            <SectionCard title="Privacy & Data" description="How we handle your information.">
              <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                <p>Your data is stored securely and never shared with third parties.</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Platform usernames are used solely for fetching public analytics</li>
                  <li>Code submitted through the Terminal is not stored on our servers</li>
                  <li>Session data is stored locally and cleared on logout</li>
                </ul>
              </div>
            </SectionCard>
          )}

          {activeSection === "danger" && (
            <div className="rounded-xl border-2 border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/10 p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Danger Zone</h3>
                <p className="text-sm text-red-600/70 dark:text-red-400/60 mt-1">These actions are irreversible.</p>
              </div>
              <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-900 space-y-3">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Delete Account</p>
                <p className="text-xs text-zinc-500">All your data, linked platforms, and progress will be permanently removed.</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder='Type "DELETE" to confirm'
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-red-200 dark:border-red-800 bg-transparent outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <Button variant="destructive" size="sm" disabled={deleteConfirm !== "DELETE"} className="gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{title}</h3>
        {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-500 mb-1 block">{label}</label>
      <div className="px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
        {value}
      </div>
    </div>
  )
}
