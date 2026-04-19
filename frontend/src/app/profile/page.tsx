"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ActivityHeatmap } from "@/components/dashboard/heatmap"
import { Github, Twitter, Linkedin, Link as LinkIcon, MapPin, Building, Calendar, FileDown } from "lucide-react"

import { useEffect, useState } from "react"

import { AuthService } from "@/lib/api/auth.service"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [platforms, setPlatforms] = useState<PlatformLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser()
    if (currentUser) {
      setUser({
        name: currentUser.username, // Using username as name since name is not in JWT
        username: currentUser.username,
        email: currentUser.email,
        bio: "Passionate developer building the future of web applications.",
        location: "World Wide",
        company: "CodePulse",
        joined: new Date().getFullYear().toString(),
        skills: ["React", "Next.js", "Java", "Spring Boot", "Algorithms"],
        socials: {
          github: "https://github.com",
          twitter: "https://twitter.com",
          linkedin: "https://linkedin.com",
          website: "https://example.com"
        }
      })
      
      PlatformService.getUserPlatforms()
        .then(data => setPlatforms(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return <div className="min-h-screen border-zinc-50 dark:bg-[#09090b] flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <div className="min-h-screen border-zinc-50 dark:bg-[#09090b] flex items-center justify-center">Please log in to view profile.</div>
  }

  const totalSolved = platforms.reduce((acc, p) => acc + p.totalSolved, 0)
  const linkedCount = platforms.length

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-foreground">
      <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Sidebar (Profile Info) */}
        <div className="space-y-6 md:col-span-1">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            <Avatar className="w-48 h-48 border-4 border-background shadow-lg">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
              <AvatarFallback>{user.username.substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="w-full">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground text-lg">@{user.username}</p>
            </div>
            
            <p className="text-sm">{user.bio}</p>
            
            <div className="flex flex-col gap-2 w-full">
              <Button className="w-full font-semibold">Edit Profile</Button>
              <Button variant="outline" className="w-full font-semibold flex gap-2">
                <FileDown className="h-4 w-4" /> Export as Resume
              </Button>
            </div>
            
            <div className="space-y-3 w-full text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" /> {user.company}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {user.location}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Joined {user.joined}
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 border-t w-full">
              <a href={user.socials.github} className="text-muted-foreground hover:text-primary"><Github className="h-5 w-5" /></a>
              <a href={user.socials.twitter} className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></a>
              <a href={user.socials.linkedin} className="text-muted-foreground hover:text-primary"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>
        </div>

        {/* Right Content (Stats & Heatmap) */}
        <div className="md:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
              <CardHeader className="py-4">
                <CardDescription>Problems Solved</CardDescription>
                <CardTitle className="text-3xl text-primary">{totalSolved}</CardTitle>
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
                <CardDescription>Longest Streak</CardDescription>
                <CardTitle className="text-3xl text-orange-500">12 days</CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1 font-medium">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle>Coding Platforms</CardTitle>
              <CardDescription>Connected profiles and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {platforms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No platforms connected yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                  {platforms.map(platform => (
                    <div key={platform.id} className={`p-4 rounded-xl border transition-colors bg-secondary/20 hover:border-primary`}>
                      <h3 className={`font-bold`}>{platform.platformName}</h3>
                      <p className="text-sm text-muted-foreground mb-3">@{platform.username}</p>
                      <div className="space-y-1 text-sm font-medium">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Solved:</span>
                          <span>{platform.totalSolved}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>{totalSolved} contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap />
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  )
}
