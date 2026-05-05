"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth.store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserCircle, Edit, CreditCard, FileText, LogOut } from "lucide-react"

export default function ProfileDropdown() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "CP"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="profile-dropdown-trigger"
          className="relative h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300 hover:scale-105 ring-2 ring-zinc-200 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
        >
          {initials}
          {(user as any)?.isGuest ? (
            <span className="absolute -bottom-0.5 -right-0.5 px-1 py-px rounded-full bg-amber-500 border-2 border-white dark:border-[#0a0a1a] text-[7px] font-bold text-white leading-none">G</span>
          ) : (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0a0a1a]" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-white dark:bg-[#12122a] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white shadow-xl shadow-black/10 dark:shadow-black/50 rounded-xl p-1"
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-3 py-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-zinc-900 dark:text-white">
              {user?.name || user?.username || "User"}
            </p>
            <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
              {user?.email || "user@codepulse.dev"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/10" />
        <DropdownMenuItem
          id="dropdown-profile"
          className="px-3 py-2.5 cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus:text-zinc-900 dark:focus:text-white focus:bg-zinc-50 dark:focus:bg-white/5 rounded-lg transition-colors"
          onClick={() => router.push("/profile")}
        >
          <UserCircle className="mr-3 h-4 w-4 text-violet-500 dark:text-violet-400" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          id="dropdown-edit-profile"
          className="px-3 py-2.5 cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus:text-zinc-900 dark:focus:text-white focus:bg-zinc-50 dark:focus:bg-white/5 rounded-lg transition-colors"
          onClick={() => router.push("/settings")}
        >
          <Edit className="mr-3 h-4 w-4 text-blue-500 dark:text-blue-400" />
          Edit Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          id="dropdown-profile-card"
          className="px-3 py-2.5 cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus:text-zinc-900 dark:focus:text-white focus:bg-zinc-50 dark:focus:bg-white/5 rounded-lg transition-colors"
          onClick={() => router.push("/profile")}
        >
          <CreditCard className="mr-3 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          Profile Card
        </DropdownMenuItem>
        <DropdownMenuItem
          id="dropdown-my-sheets"
          className="px-3 py-2.5 cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus:text-zinc-900 dark:focus:text-white focus:bg-zinc-50 dark:focus:bg-white/5 rounded-lg transition-colors"
          onClick={() => router.push("/dashboard/tracker")}
        >
          <FileText className="mr-3 h-4 w-4 text-amber-500 dark:text-amber-400" />
          My Sheets
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/10" />
        <DropdownMenuItem
          id="dropdown-logout"
          className="px-3 py-2.5 cursor-pointer text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 focus:text-red-600 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-500/10 rounded-lg transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
