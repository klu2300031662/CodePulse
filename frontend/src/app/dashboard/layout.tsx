"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Code2, Terminal, UserSquare, Settings, LogOut, Activity, FolderArchive, Trophy, UserCircle, Medal } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"

import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">CodePulse</h2>
        </div>
        <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
          <Link href="/dashboard" className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all ${pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/dashboard/platforms" className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all ${pathname?.startsWith('/dashboard/platforms') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <UserSquare className="h-5 w-5" />
            <span className="font-medium">Platforms</span>
          </Link>
          <Link href="/dashboard/analytics" className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all ${pathname?.startsWith('/dashboard/analytics') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <Activity className="h-5 w-5" />
            <span className="font-medium">Analytics</span>
          </Link>
          <Link href="/dashboard/terminal" className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all ${pathname?.startsWith('/dashboard/terminal') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <Terminal className="h-5 w-5" />
            <span className="font-medium">Terminal Analyzer</span>
          </Link>
          <Link href="/dashboard/tracker" className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all ${pathname?.startsWith('/dashboard/tracker') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <Code2 className="h-5 w-5" />
            <span className="font-medium">Problems Tracker</span>
          </Link>
          <Link href="/dashboard/projects" className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all ${pathname?.startsWith('/dashboard/projects') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <FolderArchive className="h-5 w-5" />
            <span className="font-medium">Projects</span>
          </Link>
          <Link href="/dashboard/contests" className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all ${pathname?.startsWith('/dashboard/contests') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <Trophy className="h-5 w-5" />
            <span className="font-medium">Contests</span>
          </Link>
          <Link href="/dashboard/leaderboard" className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all ${pathname?.startsWith('/dashboard/leaderboard') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <Medal className="h-5 w-5" />
            <span className="font-medium">Leaderboard</span>
          </Link>
        </nav>
        <div className="border-t p-4 space-y-2">
          <Link href="/settings" className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-all ${pathname?.startsWith('/settings') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}>
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-red-500 transition-all hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-[#09090b]/50 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-[#09090b]/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground capitalize">
              {pathname === '/dashboard' ? 'Overview' : pathname.replace('/dashboard/', '').replace('-', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/profile">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors border border-primary/20">
                <UserCircle className="h-4 w-4 text-primary" />
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto w-full p-8">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
