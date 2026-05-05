"use client"

import { useEffect, useState } from 'react'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
}

export default function LoadingOverlay({ 
  isVisible, 
  message = "Wait a moment, loading your dashboard..." 
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setMounted(true)
    } else {
      const timer = setTimeout(() => setMounted(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-[#0a0a2e] to-zinc-950" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '32px 32px'
      }} />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative flex flex-col items-center gap-8">
        {/* Animated spinner */}
        <div className="relative">
          {/* Outer ring */}
          <div className="h-20 w-20 rounded-full border-[3px] border-white/[0.06]" />
          
          {/* Spinning gradient arc */}
          <div 
            className="absolute inset-0 h-20 w-20 rounded-full border-[3px] border-transparent animate-spin"
            style={{
              borderTopColor: '#8b5cf6',
              borderRightColor: '#3b82f6',
              animationDuration: '1.2s',
            }}
          />
          
          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-400 to-blue-400 animate-pulse shadow-lg shadow-violet-500/30" />
          </div>
        </div>

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-white font-bold text-sm">CP</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">
            CodePulse
          </span>
        </div>

        {/* Message */}
        <p className="text-sm text-zinc-400 tracking-wide animate-pulse max-w-xs text-center">
          {message}
        </p>

        {/* Progress bar animation */}
        <div className="w-48 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
            style={{
              animation: 'loadingBar 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes loadingBar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
