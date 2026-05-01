"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ServerCrash, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-[#09090b] dark:text-zinc-300">
      <div className="grid lg:grid-cols-2 place-content-center items-center gap-8 lg:gap-16 max-w-6xl w-full">
        {/* Graphic Side */}
        <div className="flex justify-center flex-1 order-2 lg:order-1 h-full w-full">
          <div className="relative w-64 h-64 md:w-96 md:h-96">
            <div className="absolute inset-0 bg-red-500/20 dark:bg-red-500/10 blur-3xl rounded-full animate-pulse" />
            <div className="relative flex items-center justify-center w-full h-full bg-white dark:bg-zinc-900 shadow-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 -rotate-3 transition-transform hover:-rotate-6 duration-500">
              <ServerCrash className="w-32 h-32 text-red-500 md:w-48 md:h-48 drop-shadow-lg" />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-orange-500/20 rounded-full blur-xl" />
            <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-red-500/20 rounded-full blur-xl" />
          </div>
        </div>

        {/* Text content side */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left order-1 lg:order-2 w-full h-full gap-4 lg:gap-6">
          <span className="text-4xl font-bold md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400">
            Oops...
          </span>
          <h1 className="font-black text-6xl md:text-8xl leading-none text-zinc-900 dark:text-zinc-100 tracking-tighter drop-shadow-sm">
            Error
          </h1>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-zinc-600 dark:text-zinc-400 md:text-3xl">
              Something Went Wrong
            </h2>
            <p className="font-medium text-zinc-500 dark:text-zinc-500 max-w-md text-lg">
              {error.message || "An unexpected error occurred. Please try again or contact support if the problem persists."}
            </p>
          </div>

          {error.digest && (
            <p className="text-sm text-zinc-400 dark:text-zinc-600 font-mono bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              onClick={reset}
              size="lg"
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </Button>
            <Link href="/">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full gap-2 font-semibold transition-all hover:scale-105 active:scale-95"
              >
                <Home className="w-5 h-5" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
