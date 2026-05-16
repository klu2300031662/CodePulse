"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Terminal, Target, BarChart3, Presentation, Trophy, ArrowRight, Sparkles, Zap, Code2, ChevronRight, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="flex flex-col min-h-screen bg-transparent overflow-x-hidden">
      
      {/* Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="CodePulse" width={30} height={30} className="rounded-md" />
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">CodePulse</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
          </Link>
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="relative h-9 w-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all duration-300 shadow-sm hover:shadow-md"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 dark:hidden transition-transform duration-300 hover:rotate-45" />
              <Moon className="h-4 w-4 hidden dark:block transition-transform duration-300 hover:-rotate-12" />
            </button>
          )}
          <Link href="/register">
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 border-0">
              Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 px-6 text-center max-w-5xl mx-auto">
          {/* Animated gradient orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/[0.07] blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/[0.07] blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-cyan-500/[0.05] blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
          </div>

          <div className="relative space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full border border-violet-200/50 dark:border-violet-500/20 px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-500/10 dark:to-blue-500/10 text-violet-700 dark:text-violet-300 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 mr-2 text-violet-500" />
              Your All-in-One Coding Portfolio &amp; Tool
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-balance leading-[1.1]">
              Master your coding{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 dark:from-violet-400 dark:via-blue-400 dark:to-cyan-400">
                journey.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Track your coding progress, showcase your portfolio, and boost your skills. Connect LeetCode, HackerRank, Codeforces, GeeksForGeeks and more — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02] border-0">
                  Start Coding Journey <Presentation className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base border-zinc-300 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all duration-300">
                  Explore Features <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-8 md:gap-12 pt-8">
              {[
                { value: '5+', label: 'Platforms' },
                { value: '100%', label: 'Free' },
                { value: 'AI', label: 'Powered' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          
            {/* Dashboard Preview mockup */}
            <div className="mt-12 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-background/80 backdrop-blur-sm shadow-2xl shadow-violet-500/[0.05] overflow-hidden ring-1 ring-border/30 mx-auto max-w-4xl transition-transform hover:scale-[1.005] duration-700">
              <div className="h-11 bg-zinc-100/80 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 flex items-center px-4 gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-400/80"></div>
                <div className="h-3 w-3 rounded-full bg-green-400/80"></div>
                <div className="flex-1 mx-8">
                  <div className="h-5 bg-zinc-200/60 dark:bg-zinc-700/60 rounded-md max-w-xs mx-auto" />
                </div>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[length:24px_24px]" />
                <div className="flex flex-col items-center gap-3 opacity-40">
                  <BarChart3 className="h-20 w-20 text-muted-foreground/40" />
                  <span className="text-sm text-muted-foreground/50 font-medium">Dashboard Preview</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/30 dark:via-violet-500/[0.02] to-transparent" />
          <div className="max-w-6xl mx-auto space-y-16 relative">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-violet-200/50 dark:border-violet-500/20 px-3 py-1 text-xs font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-2">
                <Zap className="h-3 w-3 mr-1.5" /> FEATURES
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to succeed</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built by developers for developers. A single place to manage your technical interview preparation.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: BarChart3, title: 'Unified Analytics', desc: 'Track your problem-solving statistics across multiple platforms. Visualize activity via heatmaps and detailed metrics.', color: 'violet' },
                { icon: Target, title: 'Goal Tracking', desc: 'Set daily targets, track your streaks, and manage standard lists like top 100 codes to ensure consistent progress.', color: 'blue' },
                { icon: Trophy, title: 'Portfolio Showcase', desc: 'Present all your coding achievements in a single shareable developer profile perfect for resumes.', color: 'emerald' },
                { icon: Terminal, title: 'Complexity Terminal', desc: 'Write, execute, and test code using our integrated editor with instant AI feedback on complexities.', color: 'cyan', isNew: true },
              ].map((f, i) => (
                <div key={i} className={`group bg-background/80 backdrop-blur-sm rounded-2xl p-7 border border-zinc-200/60 dark:border-white/[0.06] shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-${f.color}-500/[0.05] hover:border-${f.color}-300/50 dark:hover:border-${f.color}-500/20 hover:-translate-y-1 relative overflow-hidden`}>
                  {f.isNew && <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">NEW</div>}
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br from-${f.color}-500/10 to-${f.color}-500/5 dark:from-${f.color}-500/20 dark:to-${f.color}-500/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className={`h-5 w-5 text-${f.color}-600 dark:text-${f.color}-400`} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-yellow-200/50 dark:border-yellow-500/20 px-3 py-1 text-xs font-medium bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                ★ TESTIMONIALS
              </div>
              <h2 className="text-3xl font-bold">Trusted by top developers</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              {[
                { quote: "CodePulse completely changed how I prepare for interviews. Combining all my tracked problems into one heatmap is incredible.", name: "Sarah Jenkins", role: "Software Engineer @ Microsoft", color: "violet" },
                { quote: "The interactive terminal is deeply integrated. I no longer need to switch tabs between my code tracker and IDE.", name: "David Chen", role: "Senior Dev @ Startup", color: "blue" },
              ].map((t, i) => (
                <div key={i} className="space-y-4 p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-zinc-200/60 dark:border-white/[0.06] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex gap-0.5 text-yellow-400 text-sm">★★★★★</div>
                  <p className="italic text-muted-foreground leading-relaxed">&quot;{t.quote}&quot;</p>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-${t.color}-400 to-${t.color}-600 flex items-center justify-center text-white font-bold text-sm`}>{t.name[0]}</div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/[0.03] via-blue-600/[0.05] to-cyan-600/[0.03]" />
          <div className="max-w-2xl mx-auto text-center space-y-6 relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to level up?</h2>
            <p className="text-muted-foreground text-lg">Join thousands of developers tracking their coding journey with CodePulse.</p>
            <Link href="/register">
              <Button size="lg" className="h-12 px-10 text-base bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02] border-0 mt-2">
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-sm">
        <div className="max-w-screen-xl px-4 py-8 mx-auto space-y-2 overflow-hidden sm:px-6 lg:px-8">
          <nav className="flex flex-wrap justify-center">
            {['FAQ', 'Contact Us', 'Privacy', 'Timeline', 'Terms', 'Refund Policy'].map((item, i) => (
              <div key={i} className="px-5 py-2">
                <Link href={`/${item.toLowerCase().replace(' ', '-').replace(' ', '-')}`} className="text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors text-sm">{item}</Link>
              </div>
            ))}
          </nav>
          
          <div className="flex justify-center mt-8 space-x-6">
            <a href="https://github.com/klu2300031662" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-violet-500 transition-colors">
              <span className="sr-only">GitHub</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24,40,40,0,0,0-40-40,8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68ZM200,112a40,40,0,0,1-40,40H112a40,40,0,0,1-40-40v-8a41.74,41.74,0,0,1,6.9-22.48A8,8,0,0,0,80,73.55a43.81,43.81,0,0,1,.79-33.58,43.88,43.88,0,0,1,32.32,20.06A8,8,0,0,0,119.82,64h32.35a8,8,0,0,0,6.74-3.69,43.87,43.87,0,0,1,32.32-20.06A43.81,43.81,0,0,1,192,73.55a8,8,0,0,0,1.1,7.69A41.72,41.72,0,0,1,200,104Z"></path></svg>
            </a>
            <a href="https://www.linkedin.com/in/abdul-karim-bb940434a/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-violet-500 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216V216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z"></path></svg>
            </a>
            <a href="https://x.com/klu2300031662" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-violet-500 transition-colors">
              <span className="sr-only">X / Twitter</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M214.75,211.71l-62.6-98.38,61.77-67.95a8,8,0,0,0-11.84-10.76L143.24,99.34,102.75,35.71A8,8,0,0,0,96,32H48a8,8,0,0,0-6.75,12.3l62.6,98.37-61.77,68a8,8,0,1,0,11.84,10.76l58.84-64.72,40.49,63.63A8,8,0,0,0,160,224h48a8,8,0,0,0,6.75-12.29ZM164.39,208,62.57,48h29L193.43,208Z"></path></svg>
            </a>
            <a href="https://instagram.com/klu2300031662" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-violet-500 transition-colors">
              <span className="sr-only">Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path></svg>
            </a>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
            <span>Built with</span>
            <span className="text-red-400">♥</span>
            <span>by</span>
            <a href="https://www.linkedin.com/in/abdul-karim-bb940434a/" target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline transition-colors">
              Shaik Abdul Karim Azad
            </a>
          </div>
          
          <p className="mt-3 text-center text-zinc-400 dark:text-zinc-500 text-xs">
            © 2026 CodePulse, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
