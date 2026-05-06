"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import { useAuthStore } from "@/lib/store/auth.store"
import { Link2, Unlink, RefreshCw, AlertCircle, Plus, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from "lucide-react"

const SUPPORTED_PLATFORMS = ["LeetCode", "CodeChef", "HackerRank", "Codeforces", "InterviewBit", "GeeksForGeeks"]

const platformColors: Record<string, { border: string; bg: string; hover: string; text: string; icon: string }> = {
  LeetCode:      { border: "border-t-amber-500",  bg: "bg-amber-500",  hover: "hover:bg-amber-600", text: "text-amber-600 dark:text-amber-400", icon: "🟡" },
  CodeChef:      { border: "border-t-amber-700",  bg: "bg-amber-700",  hover: "hover:bg-amber-800", text: "text-amber-700 dark:text-amber-400", icon: "🟤" },
  HackerRank:    { border: "border-t-green-500",  bg: "bg-green-600",  hover: "hover:bg-green-700", text: "text-green-600 dark:text-green-400", icon: "🟢" },
  Codeforces:    { border: "border-t-red-500",    bg: "bg-red-600",    hover: "hover:bg-red-700",   text: "text-red-600 dark:text-red-400",     icon: "🔴" },
  InterviewBit:  { border: "border-t-blue-500",   bg: "bg-blue-600",   hover: "hover:bg-blue-700",  text: "text-blue-600 dark:text-blue-400",   icon: "🔵" },
  GeeksForGeeks: { border: "border-t-emerald-500", bg: "bg-emerald-600", hover: "hover:bg-emerald-700", text: "text-emerald-600 dark:text-emerald-400", icon: "🟢" },
}

function getPlatformStyle(name: string) {
  return platformColors[name] || { border: "border-t-violet-500", bg: "bg-violet-600", hover: "hover:bg-violet-700", text: "text-violet-600 dark:text-violet-400", icon: "⚪" }
}

export default function PlatformsPage() {
  const user = useAuthStore((state) => state.user) as any
  const { platforms, fetchPlatforms, invalidatePlatforms } = useDashboardStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState("")

  // Sync state per platform
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set())
  const [syncErrors, setSyncErrors] = useState<Record<number, string>>({})
  const [syncSuccess, setSyncSuccess] = useState<Set<number>>(new Set())

  // Unlink confirmation
  const [unlinkTarget, setUnlinkTarget] = useState<PlatformLink | null>(null)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const [formData, setFormData] = useState({
    platformName: "LeetCode",
    username: "",
    profileUrl: ""
  })

  useEffect(() => {
    fetchPlatforms(user?.isGuest)
  }, [user?.isGuest, fetchPlatforms])

  const loadPlatforms = async () => {
    invalidatePlatforms()
    await fetchPlatforms(user?.isGuest)
  }

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLinking(true)
    try {
      await PlatformService.linkPlatform(formData)
      setIsModalOpen(false)
      loadPlatforms()
      setFormData({ platformName: "LeetCode", username: "", profileUrl: "" })
    } catch (err: any) {
      setError(err.message || err.response?.data || "Failed to link platform.")
    } finally {
      setIsLinking(false)
    }
  }

  const handleSync = async (platform: PlatformLink) => {
    const id = platform.id
    setSyncingIds(prev => new Set(prev).add(id))
    setSyncErrors(prev => { const n = { ...prev }; delete n[id]; return n })
    setSyncSuccess(prev => { const n = new Set(prev); n.delete(id); return n })

    try {
      await PlatformService.syncPlatform(id)
      setSyncSuccess(prev => new Set(prev).add(id))
      // Refresh platforms to show updated data
      loadPlatforms()
      // Clear success indicator after 3s
      setTimeout(() => setSyncSuccess(prev => { const n = new Set(prev); n.delete(id); return n }), 3000)
    } catch (err: any) {
      setSyncErrors(prev => ({ ...prev, [id]: err.message || "Sync failed" }))
    } finally {
      setSyncingIds(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const handleUnlink = async () => {
    if (!unlinkTarget) return
    setIsUnlinking(true)
    try {
      await PlatformService.removePlatform(unlinkTarget.id)
      setUnlinkTarget(null)
      loadPlatforms()
    } catch (err) {
      console.error("Failed to unlink", err)
    } finally {
      setIsUnlinking(false)
    }
  }

  const getAvailablePlatforms = () => {
    const linkedNames = platforms.map(p => p.platformName)
    return SUPPORTED_PLATFORMS.filter(p => !linkedNames.includes(p))
  }

  const selectedStyle = getPlatformStyle(formData.platformName)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connected Platforms</h2>
          <p className="text-muted-foreground">Link your coding accounts to automatically sync your statistics.</p>
        </div>
        
        {/* Link Account Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <Plus className="h-4 w-4" /> Link Account
            </Button>
          </DialogTrigger>
          <DialogContent className={`sm:max-w-[425px] bg-background border-t-4 shadow-lg overflow-hidden ${selectedStyle.border}`}>
            <DialogHeader>
              <DialogTitle className="text-xl">Connect New Platform</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLink} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select 
                  value={formData.platformName} 
                  onValueChange={(val) => setFormData({...formData, platformName: val})}
                >
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>
                    {getAvailablePlatforms().map(p => (
                      <SelectItem key={p} value={p}>
                        <span className="flex items-center gap-2">
                          <span>{getPlatformStyle(p).icon}</span> {p}
                        </span>
                      </SelectItem>
                    ))}
                    {getAvailablePlatforms().length === 0 && (
                      <SelectItem value="none" disabled>All supported platforms linked</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Username / Handle *</Label>
                <Input 
                  required 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  placeholder="johndoe123"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Profile URL (Optional)</Label>
                <Input 
                  value={formData.profileUrl} 
                  onChange={e => setFormData({...formData, profileUrl: e.target.value})} 
                  placeholder={`https://${formData.platformName.toLowerCase()}.com/johndoe123/`}
                  className="bg-background"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 mt-2 bg-red-500/10 p-2 rounded">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
                </div>
              )}
              
              <Button type="submit" className={`w-full mt-4 transition-all ${selectedStyle.bg} ${selectedStyle.hover} text-white`} disabled={isLinking || getAvailablePlatforms().length === 0}>
                {isLinking ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  `Connect ${formData.platformName}`
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map(platform => {
          const style = getPlatformStyle(platform.platformName)
          const isSyncing = syncingIds.has(platform.id)
          const syncError = syncErrors[platform.id]
          const syncOk = syncSuccess.has(platform.id)

          return (
            <Card key={platform.id} className={`group relative flex flex-col overflow-hidden border-zinc-200 dark:border-zinc-800 transition-all duration-500 hover:border-violet-300 dark:hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 dark:hover:shadow-violet-500/10 hover:-translate-y-[2px]`}>
              {/* Gradient top bar */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${
                platform.platformName === "LeetCode" ? "from-amber-400 to-orange-500" :
                platform.platformName === "CodeChef" ? "from-amber-600 to-yellow-500" :
                platform.platformName === "HackerRank" ? "from-green-400 to-emerald-500" :
                platform.platformName === "Codeforces" ? "from-red-400 to-rose-500" :
                platform.platformName === "InterviewBit" ? "from-blue-400 to-indigo-500" :
                "from-emerald-400 to-teal-500"
              }`} />

              {/* Hover glow */}
              <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full ${style.bg} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10 dark:group-hover:opacity-20`} />

              <CardHeader className="relative flex flex-row items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    {platform.platformName}
                  </CardTitle>
                  <CardDescription className="font-medium text-foreground">@{platform.username}</CardDescription>
                </div>
                {/* Sync status indicator */}
                <div className="flex items-center">
                  {isSyncing ? (
                    <div className="flex items-center gap-1.5 text-xs text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-full">
                      <Loader2 className="h-3 w-3 animate-spin" /> Syncing
                    </div>
                  ) : syncOk ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Synced
                    </div>
                  ) : syncError ? (
                    <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-full">
                      <XCircle className="h-3 w-3" /> Failed
                    </div>
                  ) : (
                    <div className={`h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ${style.text} font-bold text-lg`}>
                      {style.icon}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="relative pt-6 flex-1">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Solved</span>
                    <span className="font-bold text-2xl">{platform.totalSolved}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg py-2">
                      <div className="text-[10px] text-green-600 dark:text-green-500 font-bold uppercase tracking-wider mb-1">Easy</div>
                      <div className="font-semibold text-foreground">{platform.easySolved}</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg py-2">
                      <div className="text-[10px] text-yellow-600 dark:text-yellow-500 font-bold uppercase tracking-wider mb-1">Medium</div>
                      <div className="font-semibold text-foreground">{platform.mediumSolved}</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/30 rounded-lg py-2">
                      <div className="text-[10px] text-red-600 dark:text-red-500 font-bold uppercase tracking-wider mb-1">Hard</div>
                      <div className="font-semibold text-foreground">{platform.hardSolved}</div>
                    </div>
                  </div>

                  {/* Sync error message */}
                  {syncError && (
                    <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-500/10 p-2.5 rounded-lg border border-red-200 dark:border-red-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="flex-1">{syncError}</span>
                      <button
                        onClick={() => handleSync(platform)}
                        className="text-red-600 dark:text-red-400 font-semibold hover:underline flex-shrink-0"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="relative flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 py-3 mt-4">
                {/* Last synced timestamp */}
                <div className="flex items-center text-xs text-muted-foreground gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5" /> 
                  {platform.lastSyncedAt 
                    ? format(new Date(platform.lastSyncedAt), 'MMM d, h:mm a') 
                    : 'Never synced'}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Sync Now button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-2.5 ${style.text} hover:bg-zinc-100 dark:hover:bg-zinc-800`}
                    onClick={() => handleSync(platform)}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1.5 text-xs">{isSyncing ? "Syncing" : "Sync"}</span>
                  </Button>

                  {/* Unlink button — opens confirmation */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                    onClick={() => setUnlinkTarget(platform)}
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    <span className="ml-1.5 text-xs">Unlink</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )
        })}

        {/* Empty state */}
        {platforms.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl p-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Link2 className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">No platforms connected</h3>
              <p className="max-w-md mx-auto">Link your LeetCode, CodeChef, HackerRank, Codeforces, InterviewBit, or GeeksForGeeks to automatically sync your problem-solving statistics.</p>
            </div>
          </div>
        )}
      </div>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={!!unlinkTarget} onOpenChange={(open) => { if (!open) setUnlinkTarget(null) }}>
        <DialogContent className="sm:max-w-[420px] bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              Unlink {unlinkTarget?.platformName}?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Are you sure you want to unlink <strong className="text-foreground">{unlinkTarget?.platformName}</strong> (@{unlinkTarget?.username})? Your synced data will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setUnlinkTarget(null)}
              disabled={isUnlinking}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={isUnlinking}
              className="flex-1"
            >
              {isUnlinking ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Unlinking...</>
              ) : (
                "Yes, Unlink"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
