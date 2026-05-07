"use client"

import { Building2, FileSearch, BookOpen, Target, Users, TrendingUp, Rocket } from "lucide-react"

const features = [
  { icon: Building2, label: "Company-wise Questions", desc: "Browse problems frequently asked by FAANG and top tech companies" },
  { icon: FileSearch, label: "Role-based Filtering", desc: "Filter by SDE-1, SDE-2, Data Engineer, and more roles" },
  { icon: BookOpen, label: "Interview Experiences", desc: "Read real interview experiences shared by the community" },
  { icon: Target, label: "Targeted Practice", desc: "Get curated problem sets tailored to your dream company" },
  { icon: Users, label: "Company Insights", desc: "Learn about interview rounds, process, and hiring bar" },
  { icon: TrendingUp, label: "Progress Tracking", desc: "Track how many company-tagged problems you've solved" },
]

export default function CompanyPrepPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4 animate-fade-in-up">
      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Badge */}
      <div className="relative mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-300/30 dark:border-blue-700/30 text-blue-700 dark:text-blue-400 text-sm font-semibold">
          <Rocket className="h-4 w-4" />
          Coming Soon
        </span>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 dark:from-white dark:via-zinc-300 dark:to-white bg-clip-text text-transparent mb-4">
        Company Preparation
      </h1>

      {/* Teaser Description */}
      <p className="text-center text-muted-foreground max-w-xl text-base sm:text-lg leading-relaxed mb-10">
        Prepare smarter with company-specific question banks, role-based filters, 
        real interview experiences, and targeted practice — everything you need to crack your dream company.
      </p>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl w-full mb-10">
        {features.map((f, i) => (
          <div
            key={i}
            className="group relative p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/40 dark:to-violet-900/40 group-hover:scale-110 transition-transform duration-300">
                <f.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{f.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA line */}
      <p className="text-xs text-muted-foreground/60 text-center">
        We&apos;re building something special. Stay tuned! ✨
      </p>
    </div>
  )
}
