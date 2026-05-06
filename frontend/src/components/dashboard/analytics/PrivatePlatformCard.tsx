"use client"
import { ShieldOff, ExternalLink, Lock } from "lucide-react"

interface Props {
  platformName: string
  username: string
  note?: string
  profileUrl?: string
}

const PLATFORM_THEMES: Record<string, { lightGradient: string; darkGradient: string; iconBg: string; icon: string; lightBorder: string; darkBorder: string }> = {
  CodeChef:      { lightGradient: "from-amber-50 via-yellow-50 to-orange-50", darkGradient: "dark:from-[#2d1b0e] dark:via-[#3d2317] dark:to-[#4a2c1a]", iconBg: "from-amber-700 to-yellow-600",   icon: "CC",  lightBorder: "border-amber-200", darkBorder: "dark:border-amber-700/30" },
  GeeksForGeeks: { lightGradient: "from-green-50 via-emerald-50 to-teal-50", darkGradient: "dark:from-[#0a2010] dark:via-[#0f2d18] dark:to-[#183d24]", iconBg: "from-green-500 to-emerald-600",  icon: "GFG", lightBorder: "border-green-200", darkBorder: "dark:border-green-500/30" },
  HackerRank:    { lightGradient: "from-emerald-50 via-green-50 to-teal-50", darkGradient: "dark:from-[#0a1f0a] dark:via-[#0d2818] dark:to-[#1a3a2a]", iconBg: "from-emerald-500 to-green-600", icon: "HR",  lightBorder: "border-emerald-200", darkBorder: "dark:border-emerald-500/30" },
  InterviewBit:  { lightGradient: "from-teal-50 via-cyan-50 to-sky-50",      darkGradient: "dark:from-[#0a1a2a] dark:via-[#0d2535] dark:to-[#153045]", iconBg: "from-teal-500 to-cyan-600",     icon: "IB",  lightBorder: "border-teal-200", darkBorder: "dark:border-teal-500/30" },
}

export default function PrivatePlatformCard({ platformName, username, note, profileUrl }: Props) {
  const theme = PLATFORM_THEMES[platformName] || {
    lightGradient: "from-zinc-50 via-zinc-100 to-zinc-50", darkGradient: "dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900",
    iconBg: "from-zinc-600 to-zinc-700", icon: platformName.substring(0, 2).toUpperCase(),
    lightBorder: "border-zinc-200", darkBorder: "dark:border-zinc-700/30",
  }

  const defaultProfileUrls: Record<string, string> = {
    CodeChef: `https://www.codechef.com/users/${username}`,
    GeeksForGeeks: `https://www.geeksforgeeks.org/user/${username}/`,
    HackerRank: `https://www.hackerrank.com/profile/${username}`,
    InterviewBit: `https://www.interviewbit.com/profile/${username}`,
  }
  const url = profileUrl || defaultProfileUrls[platformName] || "#"

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.lightGradient} ${theme.darkGradient} p-6 border ${theme.lightBorder} ${theme.darkBorder}`}>
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.iconBg} shadow-lg opacity-60`}>
            <span className="text-2xl font-black text-white">{theme.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{platformName}</h3>
            <p className="text-zinc-500 dark:text-white/30 text-sm mt-1">@{username}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
            <Lock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Private / Unavailable</span>
          </div>
        </div>
      </div>

      {/* Main notice */}
      <div className={`relative overflow-hidden rounded-2xl border ${theme.lightBorder} ${theme.darkBorder} bg-gradient-to-br ${theme.lightGradient} ${theme.darkGradient} p-10`}>
        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] mb-5">
            <ShieldOff className="h-9 w-9 text-zinc-400 dark:text-zinc-500" />
          </div>

          <h4 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Profile Data Unavailable</h4>

          <p className="text-zinc-500 text-sm max-w-md leading-relaxed mb-6">
            {note || `${platformName} profile analytics could not be loaded. This may be because the profile is set to private, the platform&apos;s API is temporarily unavailable, or the username doesn&apos;t match an active profile.`}
          </p>

          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 hover:border-zinc-300 dark:hover:border-white/20 transition-all">
            <ExternalLink className="h-4 w-4" />
            View on {platformName}
          </a>

          <div className="mt-8 p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] max-w-lg">
            <p className="text-zinc-500 dark:text-zinc-600 text-xs leading-relaxed">
              <strong className="text-zinc-600 dark:text-zinc-500">Why is this happening?</strong><br />
              Some platforms don&apos;t offer public APIs, require login to view profiles, or rate-limit external requests.
              Your linked platform data (total problems solved) is still tracked on the Dashboard via periodic sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
