"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertOctagon, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center text-center gap-6 max-w-lg">
            {/* Pulsing icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center w-32 h-32 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl">
                <AlertOctagon className="w-16 h-16 text-red-400 drop-shadow-lg" />
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-zinc-100">
              Something went wrong
            </h1>
            <p className="text-lg text-zinc-400 max-w-md">
              An unexpected error occurred in the application. This has been logged and we&apos;ll look into it.
            </p>

            {error.digest && (
              <p className="text-sm text-zinc-600 font-mono bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex gap-3 mt-2">
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
                  className="rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2 font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  <Home className="w-5 h-5" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
