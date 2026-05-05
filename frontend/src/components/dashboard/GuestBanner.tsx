"use client"

import { useAuthStore } from '@/lib/store/auth.store'
import Link from 'next/link'
import { UserPlus, X, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function GuestBanner() {
  const user = useAuthStore((state) => state.user) as any
  const [dismissed, setDismissed] = useState(false)

  // Only show for guest users
  if (!user?.isGuest || dismissed) return null

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-300/40 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-amber-500/10 backdrop-blur-sm mb-6">
      {/* Animated shimmer */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 dark:via-amber-400/5 to-transparent"
        style={{
          animation: 'shimmer 3s ease-in-out infinite',
        }}
      />
      
      <div className="relative flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20">
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              You&apos;re in Guest Mode
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-300/60 mt-0.5">
              Sign up to sync your platforms and save your progress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-500/20 transition-all duration-200 hover:shadow-amber-500/30 hover:scale-[1.02]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Sign Up Now
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-amber-500/60 dark:text-amber-400/60 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
