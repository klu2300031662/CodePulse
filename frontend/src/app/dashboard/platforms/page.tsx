"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"
import { useDashboardStore } from "@/lib/store/dashboard.store"
import { useAuthStore } from "@/lib/store/auth.store"
import { Link2, Unlink, RefreshCw, AlertCircle, Plus } from "lucide-react"

export default function PlatformsPage() {
  const user = useAuthStore((state) => state.user) as any
  const { platforms, fetchPlatforms, invalidatePlatforms } = useDashboardStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    platformName: "LeetCode",
    username: "",
    profileUrl: ""
  })

  const SUPPORTED_PLATFORMS = ["LeetCode", "HackerRank", "Codeforces", "GeeksForGeeks"]

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
      setError(err.response?.data || "Failed to link platform.")
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async (id: number) => {
    if (confirm("Are you sure you want to unlink this platform? Your synced data will be removed.")) {
      try {
        await PlatformService.removePlatform(id)
        loadPlatforms()
      } catch (err) {
        console.error("Failed to unlink", err)
      }
    }
  }

  const getAvailablePlatforms = () => {
    const linkedNames = platforms.map(p => p.platformName)
    return SUPPORTED_PLATFORMS.filter(p => !linkedNames.includes(p))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connected Platforms</h2>
          <p className="text-muted-foreground">Link your coding accounts to automatically sync your statistics.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <Plus className="h-4 w-4" /> Link Account
            </Button>
          </DialogTrigger>
          <DialogContent className={`sm:max-w-[425px] bg-background border-t-4 shadow-lg overflow-hidden ${
            formData.platformName === 'LeetCode' ? 'border-t-amber-500' :
            formData.platformName === 'HackerRank' ? 'border-t-green-500' :
            formData.platformName === 'Codeforces' ? 'border-t-red-500' :
            'border-t-blue-500'
          }`}>
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
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                    {getAvailablePlatforms().length === 0 && (
                      <SelectItem value="none" disabled>All supported platforms linked</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Username / Handler *</Label>
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
                  placeholder="https://leetcode.com/johndoe123/"
                  className="bg-background"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 mt-2 bg-red-500/10 p-2 rounded">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
              
              <Button type="submit" className={`w-full mt-4 transition-all ${
                formData.platformName === 'LeetCode' ? 'bg-amber-500 hover:bg-amber-600' :
                formData.platformName === 'HackerRank' ? 'bg-green-600 hover:bg-green-700' :
                formData.platformName === 'Codeforces' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              } text-white`} disabled={isLinking || getAvailablePlatforms().length === 0}>
                {isLinking ? "Connecting..." : `Connect ${formData.platformName}`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map(platform => (
          <Card key={platform.id} className="flex flex-col shadow-sm border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
              <div className="space-y-1">
                <CardTitle className="text-xl">{platform.platformName}</CardTitle>
                <CardDescription className="font-medium text-foreground">@{platform.username}</CardDescription>
              </div>
              <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold">
                {platform.platformName.substring(0, 1)}
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
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
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 py-3 mt-4">
              <div className="flex items-center text-xs text-muted-foreground gap-1.5 font-medium">
                <RefreshCw className="h-3.5 w-3.5" /> 
                {platform.lastSyncedAt ? format(new Date(platform.lastSyncedAt), 'MMM d, h:mm a') : 'Never synced'}
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => handleUnlink(platform.id)}>
                <Unlink className="h-4 w-4 mr-1.5" /> Unlink
              </Button>
            </CardFooter>
          </Card>
        ))}

        {platforms.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl p-16 text-center text-muted-foreground flex flex-col items-center justify-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Link2 className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">No platforms connected</h3>
              <p className="max-w-md mx-auto">Link your LeetCode, HackerRank, or other supported platforms to automatically sync your problem-solving statistics in one place.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
