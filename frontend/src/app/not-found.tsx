"use client"

import Link from "next/link"
import { AlertTriangle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-[#09090b] dark:text-zinc-300">
      <div className="grid lg:grid-cols-2 place-content-center items-center gap-8 lg:gap-16 max-w-6xl w-full">
        {/* Graphic Side */}
        <div className="flex justify-center flex-1 order-2 lg:order-1 h-full w-full">
          <div className="relative w-64 h-64 md:w-96 md:h-96">
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 blur-3xl rounded-full" />
            <div className="relative flex items-center justify-center w-full h-full bg-white dark:bg-zinc-900 shadow-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 rotate-3 transition-transform hover:rotate-6 duration-500">
               <AlertTriangle className="w-32 h-32 text-blue-500 md:w-48 md:h-48 drop-shadow-lg" />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-purple-500/20 rounded-full blur-xl" />
            <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-blue-500/20 rounded-full blur-xl" />
          </div>
        </div>

        {/* Text content side */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left order-1 lg:order-2 w-full h-full gap-4 lg:gap-6">
          <span className="text-4xl font-bold md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
            Oops...
          </span>
          <h1 className="font-black text-8xl md:text-[12rem] leading-none text-zinc-900 dark:text-zinc-100 tracking-tighter drop-shadow-sm">
            404
          </h1>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-zinc-600 dark:text-zinc-400 md:text-3xl">
              Page Not Found
            </h2>
            <p className="font-medium text-zinc-500 dark:text-zinc-500 max-w-md text-lg">
              The page you are looking for is either missing
              <br className="hidden lg:block md:hidden" /> or temporarily unavailable.
            </p>
          </div>
          <Link href="/" className="mt-4 inline-block">
            <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105 active:scale-95">
              <Home className="w-5 h-5" />
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
