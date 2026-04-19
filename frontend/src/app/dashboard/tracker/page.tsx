"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { ProblemService, Problem } from "@/lib/api/problem.service"
import { Search, Plus, Trash2, Pencil, Download } from "lucide-react"
import { prepInstaProblems } from "@/lib/data/prepinsta"

export default function TrackerPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  
  const [formData, setFormData] = useState<Problem>({
    title: "",
    url: "",
    platform: "LeetCode",
    difficulty: "Medium",
    status: "Solved",
    dateSolved: new Date().toISOString().split('T')[0],
    notes: "",
    tags: ""
  })

  useEffect(() => {
    loadProblems()
  }, [])

  const loadProblems = async () => {
    try {
      const data = await ProblemService.getAll()
      setProblems(data)
    } catch (err) {
      console.error("Failed to load problems", err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProblem && editingProblem.id) {
        await ProblemService.update(editingProblem.id, formData)
      } else {
        await ProblemService.create(formData)
      }
      setIsModalOpen(false)
      loadProblems()
      resetForm()
    } catch (err) {
      console.error("Failed to save problem", err)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this problem?")) {
      try {
        await ProblemService.delete(id)
        loadProblems()
      } catch (err) {
        console.error("Failed to delete problem", err)
      }
    }
  }

  const handleLoadPrepInsta = async () => {
    if (confirm("This will add 20 top PrepInsta coding problems to your tracker. Proceed?")) {
      try {
        for (const p of prepInstaProblems) {
          const problemData = {
            ...p,
            dateSolved: new Date().toISOString().split('T')[0],
            notes: "Practice problem from Top 100 Codes",
            tags: "Top 100"
          };
          await ProblemService.create(problemData as Problem);
        }
        loadProblems();
        alert("Problems added successfully!");
      } catch (err) {
        console.error("Failed to load PrepInsta problems", err);
        alert("Failed to add some problems. Please check console.");
      }
    }
  }

  const resetForm = () => {
    setEditingProblem(null)
    setFormData({
      title: "",
      url: "",
      platform: "LeetCode",
      difficulty: "Medium",
      status: "Solved",
      dateSolved: new Date().toISOString().split('T')[0],
      notes: "",
      tags: ""
    })
  }

  const openEditModal = (problem: Problem) => {
    setEditingProblem(problem)
    setFormData(problem)
    setIsModalOpen(true)
  }
  
  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
    }
  }

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.platform.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Problems Tracker</h2>
          <p className="text-muted-foreground">Manage and track your solved coding challenges.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex gap-2 text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800" onClick={handleLoadPrepInsta}>
            <Download className="h-4 w-4" /> Load PrepInsta Top 100
          </Button>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            if(!open) resetForm()
            setIsModalOpen(open)
          }}>
            <DialogTrigger asChild>
              <Button className="flex gap-2">
                <Plus className="h-4 w-4" /> Add Problem
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingProblem ? 'Edit Problem' : 'Add New Problem'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Problem Title *</Label>
                  <Input 
                    required 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="Two Sum"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label>URL</Label>
                  <Input 
                    value={formData.url} 
                    onChange={e => setFormData({...formData, url: e.target.value})} 
                    placeholder="https://leetcode.com/problems/..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Platform *</Label>
                  <Select 
                    value={formData.platform} 
                    onValueChange={(val) => setFormData({...formData, platform: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LeetCode">LeetCode</SelectItem>
                      <SelectItem value="HackerRank">HackerRank</SelectItem>
                      <SelectItem value="CodeChef">CodeChef</SelectItem>
                      <SelectItem value="Codeforces">Codeforces</SelectItem>
                      <SelectItem value="PrepInsta">PrepInsta</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Difficulty *</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(val) => setFormData({...formData, difficulty: val})}
                  >
                    <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({...formData, status: val})}
                  >
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solved">Solved</SelectItem>
                      <SelectItem value="Attempted">Attempted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Date Solved</Label>
                  <Input 
                    type="date" 
                    value={formData.dateSolved} 
                    onChange={e => setFormData({...formData, dateSolved: e.target.value})} 
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full mt-6">
                {editingProblem ? 'Update Problem' : 'Save Problem'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 w-full max-w-sm shadow-sm relative">
        <Search className="h-5 w-5 text-muted-foreground mr-2" />
        <input 
          type="text" 
          placeholder="Search by title or platform..." 
          className="bg-transparent border-none outline-none w-full text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProblems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No problems found. Start tracking your progress!
                </TableCell>
              </TableRow>
            ) : (
              filteredProblems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell className="font-medium">
                    {problem.url ? (
                      <a href={problem.url} target="_blank" rel="noreferrer" className="hover:underline text-primary">
                        {problem.title}
                      </a>
                    ) : problem.title}
                  </TableCell>
                  <TableCell>{problem.platform}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{problem.status}</TableCell>
                  <TableCell>
                    {problem.dateSolved ? format(new Date(problem.dateSolved), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(problem)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => problem.id && handleDelete(problem.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
