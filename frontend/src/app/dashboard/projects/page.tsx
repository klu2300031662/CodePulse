"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Star, GitFork, ExternalLink, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Repository {
  id: number
  name: string
  description: string
  stargazers_count: number
  forks_count: number
  language: string
  updated_at: string
  html_url: string
}

export default function ProjectsPage() {
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [inputUsername, setInputUsername] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const syncGithub = async () => {
    if (!inputUsername) return;
    setIsDialogOpen(false)
    setLoading(true)
    setUsername(inputUsername)
    try {
      const res = await fetch(`https://api.github.com/users/${inputUsername}/repos?sort=updated&per_page=6`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setRepos(data)
      } else {
        setRepos([])
      }
    } catch (err) {
      console.error(err)
      setRepos([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Project Portfolio</h2>
          <p className="text-muted-foreground">Your top public GitHub repositories, automatically synced.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <Github className="w-4 h-4" /> 
              {username ? `Synced: ${username}` : "Sync with GitHub"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Sync GitHub</DialogTitle>
              <DialogDescription>
                Enter your GitHub username to sync your public repositories.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  className="col-span-3"
                  placeholder="octocat"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={syncGithub}>Sync Repositories</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!username ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 text-muted-foreground">
           No GitHub account synced. Click &quot;Sync with GitHub&quot; to view your projects.
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-muted-foreground">
          Loading repositories...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map((repo) => (
            <Card key={repo.id} className="flex flex-col h-full hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl line-clamp-1 truncate">{repo.name}</CardTitle>
                  <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                <CardDescription className="line-clamp-2 h-10 mt-2 text-sm">
                  {repo.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {repo.language && (
                  <Badge variant="secondary" className="mb-4">
                    {repo.language}
                  </Badge>
                )}
              </CardContent>
              <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-4 mt-auto">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> {repo.stargazers_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork className="w-3 h-3" /> {repo.forks_count}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-right">
                  <Calendar className="w-3 h-3" /> 
                  {new Date(repo.updated_at).toLocaleDateString()}
                </div>
              </CardFooter>
            </Card>
          ))}
          {repos.length === 0 && (
             <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground">
                 No public repositories found for user {username}.
             </div>
          )}
        </div>
      )}
    </div>
  )
}
