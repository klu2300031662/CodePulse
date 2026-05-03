"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookOpen, Sparkles, Code2, ExternalLink, ArrowRight } from "lucide-react"

interface PrepCard {
  title: string
  shortTitle: string
  description: string
  longDescription: string
  url: string
  icon: React.ReactNode
  gradient: string
  glowColor: string
  borderGlow: string
  tag: string
}

const prepCards: PrepCard[] = [
  {
    title: "Flipkart Interview Sheet",
    shortTitle: "Flipkart",
    description: "Curated Flipkart interview questions and preparation material",
    longDescription:
      "Access a comprehensive collection of interview questions frequently asked at Flipkart. This sheet covers DSA, system design, and behavioral rounds — everything you need to crack the Flipkart interview.",
    url: "https://www.foundit.in/career-advice/flipkart-interview-questions/",
    icon: <BookOpen className="h-6 w-6" />,
    gradient: "from-blue-500 via-blue-600 to-indigo-600",
    glowColor: "bg-blue-500",
    borderGlow: "group-hover:shadow-blue-500/20",
    tag: "Interview",
  },
  {
    title: "Striver A2Z DSA Sheet",
    shortTitle: "Striver A2Z",
    description: "The ultimate DSA preparation roadmap by Striver",
    longDescription:
      "Follow the famous A2Z DSA Sheet by Striver (Raj Vikramaditya) which covers 450+ problems organized by topic. This structured approach takes you from basics to advanced — the gold standard for DSA prep.",
    url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
    icon: <Sparkles className="h-6 w-6" />,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    glowColor: "bg-violet-500",
    borderGlow: "group-hover:shadow-violet-500/20",
    tag: "DSA",
  },
  {
    title: "Top 100 Codes",
    shortTitle: "Top 100",
    description: "Must-solve coding problems for placement preparation",
    longDescription:
      "A handpicked collection of the Top 100 most important coding problems from PrepInsta. These problems are carefully selected to cover all key topics and difficulty levels required for campus placements and tech interviews.",
    url: "https://prepinsta.com/top-100-codes/",
    icon: <Code2 className="h-6 w-6" />,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    glowColor: "bg-emerald-500",
    borderGlow: "group-hover:shadow-emerald-500/20",
    tag: "Placement",
  },
]

export default function PrepHub() {
  const [selectedCard, setSelectedCard] = useState<PrepCard | null>(null)

  return (
    <>
      <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f23]/80 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Interview Prep</h3>
              <p className="text-[11px] text-zinc-500">Curated resources for your next interview</p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="p-4 space-y-3">
          {prepCards.map((card, i) => (
            <button
              key={i}
              id={`prep-card-${i}`}
              onClick={() => setSelectedCard(card)}
              className={`group w-full relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a1a]/60 p-4 transition-all duration-500 hover:border-white/[0.12] hover:translate-y-[-1px] ${card.borderGlow} hover:shadow-xl text-left`}
            >
              {/* Hover glow */}
              <div
                className={`absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20 ${card.glowColor}`}
              />

              <div className="relative flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg text-white transition-transform duration-300 group-hover:scale-110`}
                >
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white group-hover:text-white/90 transition-colors">
                      {card.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 font-medium">
                      {card.tag}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">{card.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-all duration-300 group-hover:translate-x-1 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="bg-[#0f0f23] border-white/10 text-white sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {selectedCard && (
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${selectedCard.gradient} shadow-lg text-white`}
                >
                  {selectedCard.icon}
                </div>
              )}
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  {selectedCard?.title}
                </DialogTitle>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 font-medium">
                  {selectedCard?.tag}
                </span>
              </div>
            </div>
            <DialogDescription className="text-sm text-zinc-400 leading-relaxed pt-2">
              {selectedCard?.longDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button
              id="prep-open-resource-btn"
              onClick={() => {
                if (selectedCard?.url) window.open(selectedCard.url, "_blank")
              }}
              className={`w-full bg-gradient-to-r ${selectedCard?.gradient} hover:opacity-90 text-white font-medium rounded-xl py-5 transition-all duration-300 shadow-lg`}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Resource
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
