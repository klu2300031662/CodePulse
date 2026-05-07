"use client"

import { LogIn, UserPlus, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function GuestGate() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative max-w-md w-full">
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-blue-500/5 to-transparent rounded-3xl blur-2xl" />

        <div className="relative bg-white dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-6 shadow-xl">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Lock className="h-7 w-7 text-white" />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Guest Mode
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
              You&apos;re currently browsing as a guest. Please log in or create an account to access this feature.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => router.push("/login")}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-blue-700 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </button>
            <button
              onClick={() => router.push("/register")}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 font-semibold text-sm hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all duration-300 hover:-translate-y-0.5"
            >
              <UserPlus className="h-4 w-4" />
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
