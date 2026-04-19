"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, Code2, Target } from "lucide-react"

const COMPANIES = [
  {
    name: "Google",
    totalProblems: 150,
    solved: 45,
    matchRate: 85,
    topTopics: ["Dynamic Programming", "Graphs", "Trees"],
    logo: "G"
  },
  {
    name: "Amazon",
    totalProblems: 120,
    solved: 68,
    matchRate: 92,
    topTopics: ["Arrays", "Strings", "System Design"],
    logo: "A"
  },
  {
    name: "Meta",
    totalProblems: 100,
    solved: 30,
    matchRate: 75,
    topTopics: ["Recursion", "Binary Search", "Two Pointers"],
    logo: "M"
  },
  {
    name: "Microsoft",
    totalProblems: 130,
    solved: 80,
    matchRate: 95,
    topTopics: ["Linked Lists", "Sorting", "Trees"],
    logo: "MS"
  }
]

export default function CompanyPrepPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Company Preparation</h2>
        <p className="text-muted-foreground">Track your progress against top tech company specific problem sets.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {COMPANIES.map((company) => (
          <Card key={company.name} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {company.logo}
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{company.name}</CardTitle>
                <CardDescription>Preparation Readiness</CardDescription>
              </div>
              <Badge variant={company.matchRate >= 90 ? "default" : company.matchRate >= 80 ? "secondary" : "outline"} className="text-sm px-2 py-1">
                {company.matchRate}% Ready
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 tracking-wide">
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-2 text-muted-foreground"><Code2 className="h-4 w-4"/> Solved Problems</span>
                  <span>{company.solved} / {company.totalProblems}</span>
                </div>
                <Progress value={(company.solved / company.totalProblems) * 100} className="h-2" />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Target className="h-4 w-4"/> Target Topics
                </div>
                <div className="flex flex-wrap gap-2">
                  {company.topTopics.map(topic => (
                    <Badge key={topic} variant="outline" className="bg-zinc-50 dark:bg-zinc-900">{topic}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
