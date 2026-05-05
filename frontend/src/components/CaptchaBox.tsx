"use client"

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { RefreshCw, ShieldCheck, ShieldX } from 'lucide-react'

export interface CaptchaHandle {
  reset: () => void
  isVerified: () => boolean
}

interface CaptchaBoxProps {
  onVerify?: (verified: boolean) => void
  className?: string
}

// Generate a random alphanumeric code (mix of upper, lower, digits)
function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

const CaptchaBox = forwardRef<CaptchaHandle, CaptchaBoxProps>(
  ({ onVerify, className }, ref) => {
    const [captchaCode, setCaptchaCode] = useState('')
    const [userInput, setUserInput] = useState('')
    const [verified, setVerified] = useState(false)
    const [error, setError] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const drawCaptcha = useCallback((code: string) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = canvas.width
      const h = canvas.height
      const dark = isDarkMode()

      // Background
      ctx.fillStyle = dark ? '#0f0f23' : '#f0f0f8'
      ctx.fillRect(0, 0, w, h)

      // Noise lines
      for (let i = 0; i < 6; i++) {
        ctx.beginPath()
        ctx.moveTo(Math.random() * w, Math.random() * h)
        ctx.lineTo(Math.random() * w, Math.random() * h)
        ctx.strokeStyle = dark
          ? `hsla(${Math.random() * 360}, 50%, 50%, 0.3)`
          : `hsla(${Math.random() * 360}, 40%, 70%, 0.5)`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Noise dots
      for (let i = 0; i < 40; i++) {
        ctx.beginPath()
        ctx.arc(Math.random() * w, Math.random() * h, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = dark
          ? `hsla(${Math.random() * 360}, 60%, 60%, 0.35)`
          : `hsla(${Math.random() * 360}, 50%, 60%, 0.4)`
        ctx.fill()
      }

      // Draw each character with random position, rotation, and color
      const fontSize = 26
      const startX = 18
      const charWidth = (w - 36) / code.length

      code.split('').forEach((char, i) => {
        ctx.save()
        const x = startX + i * charWidth + Math.random() * 6 - 3
        const y = h / 2 + fontSize / 3 + Math.random() * 8 - 4
        const angle = (Math.random() - 0.5) * 0.5 // -15° to +15°

        ctx.translate(x, y)
        ctx.rotate(angle)

        // Random vibrant color — darker for light mode, brighter for dark
        const hue = 200 + Math.random() * 120 // violet-blue range
        ctx.fillStyle = dark
          ? `hsl(${hue}, 80%, 70%)`
          : `hsl(${hue}, 70%, 35%)`
        ctx.font = `bold ${fontSize + Math.floor(Math.random() * 6 - 3)}px 'Courier New', monospace`
        ctx.textBaseline = 'middle'
        ctx.fillText(char, 0, 0)

        ctx.restore()
      })

      // Strikethrough lines over text
      for (let i = 0; i < 2; i++) {
        ctx.beginPath()
        ctx.moveTo(10 + Math.random() * 20, h / 2 + Math.random() * 10 - 5)
        ctx.bezierCurveTo(
          w * 0.3, h * (0.3 + Math.random() * 0.4),
          w * 0.7, h * (0.3 + Math.random() * 0.4),
          w - 10 - Math.random() * 20, h / 2 + Math.random() * 10 - 5
        )
        ctx.strokeStyle = dark
          ? `hsla(${260 + Math.random() * 60}, 60%, 60%, 0.4)`
          : `hsla(${260 + Math.random() * 60}, 50%, 50%, 0.35)`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }, [])

    const regenerate = useCallback(() => {
      const newCode = generateCode(6)
      setCaptchaCode(newCode)
      setUserInput('')
      setVerified(false)
      setError(false)
      onVerify?.(false)
      // Draw after state update
      setTimeout(() => drawCaptcha(newCode), 0)
    }, [drawCaptcha, onVerify])

    useEffect(() => {
      regenerate()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useImperativeHandle(ref, () => ({
      reset: regenerate,
      isVerified: () => verified,
    }))

    const handleVerify = () => {
      if (userInput.trim() === captchaCode) {
        setVerified(true)
        setError(false)
        onVerify?.(true)
      } else {
        setError(true)
        setVerified(false)
        onVerify?.(false)
        // Regenerate after wrong attempt
        setTimeout(() => regenerate(), 1200)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleVerify()
      }
    }

    if (verified) {
      return (
        <div className={`${className || ''}`}>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-300/40 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 px-4 py-3 transition-all duration-300">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Captcha verified successfully</span>
          </div>
        </div>
      )
    }

    return (
      <div className={`${className || ''}`}>
        <div className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#0a0a1f]/60 p-3.5 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-500 dark:text-violet-400" />
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Security Check</span>
            </div>
          </div>

          {/* Canvas + Refresh */}
          <div className="flex items-center gap-2">
            <canvas
              ref={canvasRef}
              width={200}
              height={56}
              className="rounded-lg border border-zinc-200 dark:border-white/[0.08] flex-1 select-none"
              style={{ imageRendering: 'auto' }}
            />
            <button
              type="button"
              onClick={regenerate}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-400/30 transition-all duration-200 flex-shrink-0"
              title="Generate new code"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value)
                setError(false)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter code above"
              maxLength={6}
              autoComplete="off"
              spellCheck={false}
              className={`flex-1 h-9 rounded-lg border px-3 text-sm font-mono tracking-widest bg-white dark:bg-[#0f0f23] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all duration-200 ${
                error
                  ? 'border-red-300 dark:border-red-400/60 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
                  : 'border-zinc-200 dark:border-white/[0.08] focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20'
              }`}
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={userInput.length < 3}
              className="h-9 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:from-violet-500 hover:to-blue-500 transition-all duration-200 shadow-sm hover:shadow-violet-500/20 flex-shrink-0"
            >
              Verify
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-1.5 animate-in slide-in-from-top-2">
              <ShieldX className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
              <span className="text-xs text-red-500 dark:text-red-400 font-medium">Incorrect code. Try again with the new one.</span>
            </div>
          )}
        </div>
      </div>
    )
  }
)

CaptchaBox.displayName = 'CaptchaBox'

export default CaptchaBox
