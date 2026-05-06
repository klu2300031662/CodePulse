"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Code2,
  Terminal,
  UserSquare,
  Settings,
  Activity,
  FolderArchive,
  Trophy,
  Medal,
  Building2,
  Sun,
  Moon,
  Search,
  Bell,
  Menu,
  X,
} from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import ProfileDropdown from "@/components/dashboard/ProfileDropdown"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/platforms", label: "Platforms", icon: UserSquare },
  { href: "/dashboard/analytics", label: "Analytics", icon: Activity },
  { href: "/dashboard/terminal", label: "Terminal Analyzer", icon: Terminal },
  { href: "/dashboard/tracker", label: "Problems Tracker", icon: Code2 },
  { href: "/dashboard/projects", label: "Projects", icon: FolderArchive },
  { href: "/dashboard/company", label: "Company Prep", icon: Building2 },
  { href: "/dashboard/contests", label: "Contests", icon: Trophy },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Medal },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href
    return pathname?.startsWith(item.href)
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#06061a] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#0a0a1f]/80 backdrop-blur-xl hidden lg:flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 group-hover:scale-105 transition-all duration-300">
              <span className="text-white font-bold text-sm">CP</span>
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">
              CodePulse
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 px-3 mb-3">
            Menu
          </p>
          {navItems.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-500 relative border overflow-hidden ${
                  active
                    ? "bg-violet-50 dark:bg-violet-500/[0.08] text-violet-700 dark:text-white border-violet-300 dark:border-violet-500/30 shadow-lg shadow-violet-500/10 dark:shadow-violet-500/20 -translate-y-[1px]"
                    : "border-transparent text-zinc-500 hover:text-violet-700 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] hover:border-violet-300 dark:hover:border-violet-500/25 hover:shadow-lg hover:shadow-violet-500/10 dark:hover:shadow-violet-500/15 hover:-translate-y-[2px]"
                }`}
              >
                {/* Glow orb — appears on hover like stat cards */}
                <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-violet-500 blur-2xl transition-opacity duration-500 ${
                  active ? "opacity-10 dark:opacity-20" : "opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20"
                }`} />

                {/* Gradient top bar */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-blue-500 transition-opacity duration-300 ${
                  active ? "opacity-60" : "opacity-0 group-hover:opacity-50"
                }`} />

                {/* Active indicator left bar */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-violet-500 to-blue-500 dark:from-violet-400 dark:to-blue-400" />
                )}
                <item.icon
                  className={`relative h-[18px] w-[18px] transition-all duration-200 ${
                    active
                      ? "text-violet-500 dark:text-violet-400"
                      : "text-zinc-400 dark:text-zinc-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 group-hover:scale-110"
                  }`}
                />
                <span className="relative transition-all duration-200">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-zinc-200 dark:border-white/[0.06] p-3">
          <Link
            href="/settings"
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-500 border overflow-hidden relative ${
              pathname?.startsWith("/settings")
                ? "bg-violet-50 dark:bg-violet-500/[0.08] text-violet-700 dark:text-white border-violet-300 dark:border-violet-500/30 shadow-lg shadow-violet-500/10"
                : "border-transparent text-zinc-500 hover:text-violet-700 dark:hover:text-white hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] hover:border-violet-300 dark:hover:border-violet-500/25 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-[2px]"
            }`}
          >
            <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-violet-500 blur-2xl opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-blue-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            <Settings className="relative h-[18px] w-[18px] text-zinc-400 dark:text-zinc-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 group-hover:rotate-90 transition-all duration-300" />
            <span className="relative">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-[#0a0a1f] border-r border-zinc-200 dark:border-white/[0.06] flex flex-col animate-in slide-in-from-left duration-300">
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CP</span>
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400">
                  CodePulse
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative ${
                      active
                        ? "bg-violet-50 dark:bg-violet-500/[0.08] text-violet-700 dark:text-white"
                        : "text-zinc-500 hover:text-violet-700 dark:hover:text-white hover:bg-violet-50/80 dark:hover:bg-violet-500/[0.06]"
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-violet-500 to-blue-500" />
                    )}
                    <item.icon
                      className={`h-[18px] w-[18px] transition-all duration-200 ${
                        active
                          ? "text-violet-500 dark:text-violet-400"
                          : "text-zinc-400 dark:text-zinc-600 group-hover:text-violet-500 dark:group-hover:text-violet-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#06061a] overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-zinc-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0a1f]/60 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all duration-200 hover:shadow-sm"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 capitalize">
                {pathname === "/dashboard"
                  ? "Overview"
                  : pathname?.replace("/dashboard/", "").replace(/-/g, " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              id="header-search"
              className="h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all duration-200 hover:shadow-sm hover:scale-105"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Notifications */}
            <button
              id="header-notifications"
              className="relative h-9 w-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all duration-200 hover:shadow-sm hover:scale-105"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white dark:ring-[#0a0a1f]" />
            </button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="h-9 w-9 rounded-xl text-zinc-400 hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all duration-200 hover:shadow-sm hover:scale-105"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Divider */}
            <div className="h-6 w-px bg-zinc-200 dark:bg-white/[0.06]" />

            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-[1600px] mx-auto w-full p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
