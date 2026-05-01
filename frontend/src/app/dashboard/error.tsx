"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ShieldAlert, RefreshCw, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  const isAuthError = error.message?.toLowerCase().includes("unauthorized") || 
                      error.message?.toLowerCase().includes("log in") ||
                      error.message?.toLowerCase().includes("session");

  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh] p-6">
      <div className="flex flex-col items-center text-center gap-5 max-w-md">
        {/* Error icon with glow */}
        <div className="relative">
          <div className={`absolute inset-0 ${isAuthError ? 'bg-amber-500/20' : 'bg-red-500/20'} blur-2xl rounded-full animate-pulse`} />
          <div className="relative flex items-center justify-center w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <ShieldAlert className={`w-12 h-12 ${isAuthError ? 'text-amber-500' : 'text-red-500'} drop-shadow-md`} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {isAuthError ? "Session Expired" : "Dashboard Error"}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-base">
            {isAuthError 
              ? "Your session has expired or you're not logged in. Please sign in again to continue."
              : error.message || "Something went wrong loading the dashboard. Please try again."
            }
          </p>
        </div>

        {error.digest && (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 font-mono bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800">
            {error.digest}
          </p>
        )}

        <div className="flex gap-3 mt-1">
          {isAuthError ? (
            <Link href="/login">
              <Button
                size="lg"
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </Button>
            </Link>
          ) : (
            <Button
              onClick={reset}
              size="lg"
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
