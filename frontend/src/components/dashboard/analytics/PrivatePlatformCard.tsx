"use client"
import { ShieldOff, ExternalLink, Lock } from "lucide-react"

interface Props {
  platformName: string
  username: string
  note?: string
  profileUrl?: string
}

const PLATFORM_THEMES: Record<string, { gradient: string; iconBg: string; icon: string; borderColor: string }> = {
  CodeChef:      { gradient: "from-[#2d1b0e] via-[#3d2317] to-[#4a2c1a]", iconBg: "from-amber-700 to-yellow-600",   icon: "CC",  borderColor: "border-amber-700/30" },
  GeeksForGeeks: { gradient: "from-[#0a2010] via-[#0f2d18] to-[#183d24]", iconBg: "from-green-500 to-emerald-600",  icon: "GFG", borderColor: "border-green-500/30" },
  HackerRank:    { gradient: "from-[#0a1f0a] via-[#0d2818] to-[#1a3a2a]", iconBg: "from-emerald-500 to-green-600", icon: "HR",  borderColor: "border-emerald-500/30" },
  InterviewBit:  { gradient: "from-[#0a1a2a] via-[#0d2535] to-[#153045]", iconBg: "from-teal-500 to-cyan-600",     icon: "IB",  borderColor: "border-teal-500/30" },
}

export default function PrivatePlatformCard({ platformName, username, note, profileUrl }: Props) {
  const theme = PLATFORM_THEMES[platformName] || {
    gradient: "from-zinc-900 via-zinc-800 to-zinc-900",
    iconBg: "from-zinc-600 to-zinc-700",
    icon: platformName.substring(0, 2).toUpperCase(),
    borderColor: "border-zinc-700/30",
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
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-6 border ${theme.borderColor}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.iconBg} shadow-lg opacity-60`}>
            <span className="text-2xl font-black text-white">{theme.icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">{platformName}</h3>
            <p className="text-white/30 text-sm mt-1">@{username}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Lock className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-400 font-medium">Private / Unavailable</span>
          </div>
        </div>
      </div>

      {/* Main private notice card */}
      <div className={`relative overflow-hidden rounded-2xl border ${theme.borderColor} bg-gradient-to-br ${theme.gradient} p-10`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        
        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] mb-5">
            <ShieldOff className="h-9 w-9 text-zinc-500" />
          </div>
          
          <h4 className="text-lg font-semibold text-zinc-200 mb-2">Profile Data Unavailable</h4>
          
          <p className="text-zinc-500 text-sm max-w-md leading-relaxed mb-6">
            {note || `${platformName} profile analytics could not be loaded. This may be because the profile is set to private, the platform's API is temporarily unavailable, or the username doesn't match an active profile.`}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              View on {platformName}
            </a>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] max-w-lg">
            <p className="text-zinc-600 text-xs leading-relaxed">
              <strong className="text-zinc-500">Why is this happening?</strong>
              <br />
              Some platforms don&apos;t offer public APIs, require login to view profiles, or rate-limit external requests.
              Your linked platform data (total problems solved) is still tracked on the Dashboard via periodic sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
