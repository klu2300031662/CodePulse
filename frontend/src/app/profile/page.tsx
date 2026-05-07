"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ActivityHeatmap } from "@/components/dashboard/heatmap"
import { Calendar, Plus, Pencil, Trash2, X, Sparkles } from "lucide-react"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/lib/store/auth.store"
import { useDashboardStore } from "@/lib/store/dashboard.store"

// ─── Helpers ────────────────────────────────────────────
function nameToGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  const hue1 = ((hash % 360) + 360) % 360
  const hue2 = (hue1 + 40) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 65%, 45%))`
}

// ─── Skills Storage ─────────────────────────────────────
interface Skill { name: string; level: "Beginner" | "Intermediate" | "Advanced" }
const SKILLS_KEY = "codepulse_user_skills"
function getStoredSkills(): Skill[] {
  try { return JSON.parse(localStorage.getItem(SKILLS_KEY) || "[]") } catch { return [] }
}
function saveSkills(skills: Skill[]) {
  localStorage.setItem(SKILLS_KEY, JSON.stringify(skills))
}

const levelColors: Record<string, string> = {
  Beginner: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  Intermediate: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  Advanced: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
}

export default function ProfilePage() {
  const authUser = useAuthStore((state) => state.user) as any
  const { platforms, fetchPlatforms } = useDashboardStore()
  const [loading, setLoading] = useState(true)
  const [skills, setSkills] = useState<Skill[]>([])
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [skillName, setSkillName] = useState("")
  const [skillLevel, setSkillLevel] = useState<Skill["level"]>("Beginner")

  useEffect(() => {
    setSkills(getStoredSkills())
    fetchPlatforms(authUser?.isGuest).finally(() => setLoading(false))
  }, [authUser]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center text-muted-foreground">Loading...</div>
  }

  if (!authUser) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center text-muted-foreground">Please log in to view profile.</div>
  }

  const name = authUser.name || authUser.fullName || authUser.username || "User"
  const username = authUser.username || "user"
  const email = authUser.email || ""
  const initial = name.charAt(0).toUpperCase()
  const totalSolved = platforms.reduce((acc, p) => acc + p.totalSolved, 0)
  const linkedCount = platforms.length

  // Skill handlers
  const openAddSkill = () => {
    setEditIdx(null)
    setSkillName("")
    setSkillLevel("Beginner")
    setShowSkillModal(true)
  }
  const openEditSkill = (idx: number) => {
    setEditIdx(idx)
    setSkillName(skills[idx].name)
    setSkillLevel(skills[idx].level)
    setShowSkillModal(true)
  }
  const saveSkill = () => {
    if (!skillName.trim()) return
    const updated = [...skills]
    if (editIdx !== null) {
      updated[editIdx] = { name: skillName.trim(), level: skillLevel }
    } else {
      updated.push({ name: skillName.trim(), level: skillLevel })
    }
    setSkills(updated)
    saveSkills(updated)
    setShowSkillModal(false)
  }
  const deleteSkill = (idx: number) => {
    const updated = skills.filter((_, i) => i !== idx)
    setSkills(updated)
    saveSkills(updated)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-foreground">
      <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Left Sidebar */}
          <div className="space-y-6 md:col-span-1">
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
              {/* Avatar — first letter badge */}
              <div
                className="w-40 h-40 rounded-full flex items-center justify-center text-white text-6xl font-bold shadow-xl"
                style={{ background: nameToGradient(name) }}
              >
                {initial}
              </div>

              <div className="w-full">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{name}</h1>
                <p className="text-muted-foreground text-lg">@{username}</p>
              </div>

              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Passionate developer building the future of web applications.
              </p>

              <div className="space-y-3 w-full text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date().getFullYear()}
                </div>
              </div>

              {/* Social Links — Coming Soon */}
              <div className="w-full pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  Social links coming soon 🚀
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
                <CardHeader className="py-4">
                  <CardDescription>Problems Solved</CardDescription>
                  <CardTitle className="text-3xl text-violet-600 dark:text-violet-400">{totalSolved}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
                <CardHeader className="py-4">
                  <CardDescription>Platforms Linked</CardDescription>
                  <CardTitle className="text-3xl text-amber-500">{linkedCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
                <CardHeader className="py-4">
                  <CardDescription>Username</CardDescription>
                  <CardTitle className="text-xl text-zinc-700 dark:text-zinc-300">@{username}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Coding Heatmap */}
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔥 Coding Heatmap
                </CardTitle>
                <CardDescription>Combined activity from all linked platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityHeatmap />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>Your technical expertise</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={openAddSkill}>
                  <Plus className="h-3.5 w-3.5" /> Add Skill
                </Button>
              </CardHeader>
              <CardContent>
                {skills.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No skills added yet. Click &quot;Add Skill&quot; to get started.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, idx) => (
                      <div
                        key={idx}
                        className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${levelColors[skill.level]}`}
                      >
                        <span>{skill.name}</span>
                        <span className="opacity-50 text-[10px]">• {skill.level}</span>
                        <button
                          onClick={() => openEditSkill(idx)}
                          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteSkill(idx)}
                          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-red-500 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coding Platforms */}
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle>Coding Platforms</CardTitle>
                <CardDescription>Connected profiles and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {platforms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No platforms connected yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {platforms.map(platform => (
                      <div key={platform.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-violet-300 dark:hover:border-violet-500/20 transition-colors">
                        <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{platform.platformName}</h3>
                        <p className="text-xs text-muted-foreground mb-2">@{platform.username}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Solved:</span>
                          <span className="font-semibold">{platform.totalSolved}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={() => setShowSkillModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                {editIdx !== null ? "Edit Skill" : "Add Skill"}
              </h3>
              <button onClick={() => setShowSkillModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Skill Name</label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. React, Python, DSA..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Beginner", "Intermediate", "Advanced"] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setSkillLevel(lvl)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        skillLevel === lvl
                          ? levelColors[lvl] + " shadow-sm"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-violet-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowSkillModal(false)}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={saveSkill} disabled={!skillName.trim()}>
                {editIdx !== null ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
