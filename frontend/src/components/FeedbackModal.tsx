"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import feedbackService, { type FeedbackPayload } from "@/lib/api/feedback.service"
import { MessageSquareHeart, Bug, Lightbulb, Wrench, MessageCircle, Star, Send, CheckCircle2, Loader2 } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth.store"

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const categories = [
  { value: "general" as const, label: "General", icon: MessageCircle, color: "violet" },
  { value: "bug" as const, label: "Bug Report", icon: Bug, color: "red" },
  { value: "feature" as const, label: "Feature Request", icon: Lightbulb, color: "amber" },
  { value: "improvement" as const, label: "Improvement", icon: Wrench, color: "blue" },
]

export default function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const isGuest = useAuthStore((s) => s.isGuest)
  const [category, setCategory] = useState<FeedbackPayload["category"]>("general")
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setCategory("general")
    setRating(0)
    setHoveredStar(0)
    setMessage("")
    setError("")
    setSubmitted(false)
  }

  const handleClose = (val: boolean) => {
    if (!val) {
      // Reset after close animation
      setTimeout(resetForm, 300)
    }
    onOpenChange(val)
  }

  const handleSubmit = async () => {
    if (isGuest) return
    if (rating === 0) {
      setError("Please select a rating.")
      return
    }
    if (!message.trim()) {
      setError("Please write your feedback.")
      return
    }
    if (message.trim().length < 10) {
      setError("Feedback should be at least 10 characters.")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      await feedbackService.submit({ category, rating, message: message.trim() })
      setSubmitted(true)
    } catch (err: any) {
      const msg = err?.backendMessage || err?.response?.data?.message || "Failed to submit feedback. Please try again."
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const starLabels = ["Terrible", "Poor", "Okay", "Good", "Amazing"]
  const displayStars = hoveredStar || rating

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] border-zinc-200/60 dark:border-zinc-700/60 bg-background/95 backdrop-blur-xl shadow-2xl">
        {submitted ? (
          /* ─── Success State ─── */
          <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold">Thank you! 🎉</h3>
            <p className="text-muted-foreground text-center text-sm max-w-xs">
              Your feedback has been submitted successfully. We truly appreciate your input in making CodePulse better.
            </p>
            <Button
              onClick={() => handleClose(false)}
              className="mt-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0"
            >
              Close
            </Button>
          </div>
        ) : (
          /* ─── Form State ─── */
          <>
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 dark:from-violet-500/20 dark:to-blue-500/20 flex items-center justify-center">
                  <MessageSquareHeart className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Share Your Feedback</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Help us improve CodePulse — every bit counts!
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
 
            <div className="space-y-5 pt-1">
              {/* Category Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isActive = category === cat.value
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                          isActive
                            ? "border-violet-400/50 dark:border-violet-500/30 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-500/10 dark:to-blue-500/10 text-violet-700 dark:text-violet-300 shadow-sm"
                            : "border-zinc-200/60 dark:border-zinc-700/40 text-muted-foreground hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <cat.icon className={`h-4 w-4 ${isActive ? "text-violet-600 dark:text-violet-400" : ""}`} />
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>
 
              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={isGuest}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="group relative p-0.5 transition-transform duration-150 hover:scale-125 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors duration-200 ${
                          star <= displayStars
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]"
                            : "text-zinc-300 dark:text-zinc-600"
                        }`}
                      />
                    </button>
                  ))}
                  {displayStars > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground font-medium animate-in fade-in-0 slide-in-from-left-1 duration-200">
                      {starLabels[displayStars - 1]}
                    </span>
                  )}
                </div>
              </div>
 
              {/* Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Your Feedback</label>
                  <span className={`text-xs ${message.length > 450 ? (message.length > 500 ? "text-red-500" : "text-amber-500") : "text-muted-foreground"}`}>
                    {message.length}/500
                  </span>
                </div>
                <Textarea
                  value={message}
                  disabled={isGuest}
                  onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                  placeholder={isGuest ? "Feedback input is disabled in Guest Mode." : "Tell us what you love, what's broken, or what you'd like to see..."}
                  className="min-h-[100px] resize-none border-zinc-200/60 dark:border-zinc-700/40 focus:border-violet-400 dark:focus:border-violet-500/50 transition-colors text-sm disabled:opacity-50"
                />
              </div>
 
              {/* Guest Warning */}
              {isGuest && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 animate-in fade-in-0 slide-in-from-top-1 duration-200 font-medium">
                  ⚠️ Feedback submission is disabled in Guest Mode. Please sign in or create an account to share feedback!
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 rounded-lg px-3 py-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                  {error}
                </div>
              )}
            </div>
 
            <DialogFooter className="pt-2">
              <Button
                variant="ghost"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim() || rating === 0 || isGuest}
                className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
