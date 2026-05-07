"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Code2, Terminal, Target, BarChart3, Presentation, Users, Trophy } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      
      {/* Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">CodePulse</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-6 text-center max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-muted/50 text-muted-foreground mb-4">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Your All-in-One Coding Portfolio & Tool
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-balance leading-tight">
            Master your coding <span className="text-blue-600 dark:text-blue-400">journey.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            Easily track your coding progress, showcase your portfolio, and boost your skills with our comprehensive tools. Connect LeetCode, HackerRank, Codeforces, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base">Start Coding Journey <Presentation className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">Explore Features</Button>
            </Link>
          </div>
          
          {/* Dashboard Preview mockup */}
          <div className="mt-16 rounded-xl border bg-background shadow-2xl overflow-hidden ring-1 ring-border/50 mx-auto max-w-4xl opacity-90 transition-transform hover:scale-[1.01] duration-500">
            <div className="h-12 bg-muted/50 border-b flex items-center px-4 gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
              <div className="h-3 w-3 rounded-full bg-green-400"></div>
            </div>
            <div className="aspect-[16/9] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              <BarChart3 className="h-24 w-24 text-muted-foreground/30" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to succeed</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built by developers for developers. A single place to manage your technical interview preparation.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="bg-background rounded-2xl p-8 border shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Unified Analytics</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Track your problem-solving statistics across multiple platforms. Visualize activity via heatmaps and detailed metrics.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-background rounded-2xl p-8 border shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Goal Tracking</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Set daily targets, track your streaks, and manage standard lists like top 100 codes to ensure consistent progress.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-background rounded-2xl p-8 border shadow-sm transition-all hover:shadow-md hover:border-primary/50">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Portfolio Showcase</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Present all your coding achievements in a single shareable developer profile perfect for resumes and job applications.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-background rounded-2xl p-8 border shadow-sm transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">NEW</div>
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6">
                  <Terminal className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Complexity Terminal</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Write, execute, and test code using our integrated editor with instant AI feedback on time and space complexities.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-6 border-t">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h2 className="text-3xl font-bold">Trusted by top developers</h2>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="space-y-4 p-6 bg-card rounded-xl border shadow-sm">
                <div className="flex gap-1 text-yellow-400">★★★★★</div>
                <p className="italic text-muted-foreground">&quot;CodePulse completely changed how I prepare for interviews. Combining all my tracked problems into one heatmap is incredible.&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-sm">Sarah Jenkins</div>
                    <div className="text-xs text-muted-foreground">Software Engineer @ Microsoft</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6 bg-card rounded-xl border shadow-sm">
                <div className="flex gap-1 text-yellow-400">★★★★★</div>
                <p className="italic text-muted-foreground">&quot;The interactive terminal is deeply integrated. I no longer need to switch tabs between my code tracker and IDE.&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-sm">David Chen</div>
                    <div className="text-xs text-muted-foreground">Senior Dev @ Startup</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-[#09090b] dark:border-zinc-800">
        <div className="max-w-screen-xl px-4 py-8 mx-auto space-y-2 overflow-hidden sm:px-6 lg:px-8">
          <nav className="flex flex-wrap justify-center">
            <div className="px-5 py-2">
              <Link href="/faq" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300">FAQ</Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/contact" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300">Contact Us</Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/privacy" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300">Privacy</Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/timeline" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300">Timeline</Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/terms" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300">Terms</Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/refund" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300">Refund Policy</Link>
            </div>
          </nav>
          
          <div className="flex justify-center mt-8 space-x-6">
            <a href="https://github.com/klu2300031662" target="_blank" rel="noopener noreferrer" className="text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors">
              <span className="sr-only">GitHub</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24,40,40,0,0,0-40-40,8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68ZM200,112a40,40,0,0,1-40,40H112a40,40,0,0,1-40-40v-8a41.74,41.74,0,0,1,6.9-22.48A8,8,0,0,0,80,73.55a43.81,43.81,0,0,1,.79-33.58,43.88,43.88,0,0,1,32.32,20.06A8,8,0,0,0,119.82,64h32.35a8,8,0,0,0,6.74-3.69,43.87,43.87,0,0,1,32.32-20.06A43.81,43.81,0,0,1,192,73.55a8,8,0,0,0,1.1,7.69A41.72,41.72,0,0,1,200,104Z"></path></svg>
            </a>
            <a href="https://linkedin.com/in/klu2300031662" target="_blank" rel="noopener noreferrer" className="text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216V216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z"></path></svg>
            </a>
            <a href="https://x.com/klu2300031662" target="_blank" rel="noopener noreferrer" className="text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors">
              <span className="sr-only">X / Twitter</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M214.75,211.71l-62.6-98.38,61.77-67.95a8,8,0,0,0-11.84-10.76L143.24,99.34,102.75,35.71A8,8,0,0,0,96,32H48a8,8,0,0,0-6.75,12.3l62.6,98.37-61.77,68a8,8,0,1,0,11.84,10.76l58.84-64.72,40.49,63.63A8,8,0,0,0,160,224h48a8,8,0,0,0,6.75-12.29ZM164.39,208,62.57,48h29L193.43,208Z"></path></svg>
            </a>
            <a href="https://instagram.com/klu2300031662" target="_blank" rel="noopener noreferrer" className="text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors">
              <span className="sr-only">Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path></svg>
            </a>
          </div>
          
          <p className="mt-8 text-center text-zinc-400 dark:text-zinc-500 text-sm">
            © 2026 CodePulse, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
