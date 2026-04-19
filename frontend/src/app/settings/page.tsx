"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-8 relative">
      <div className="absolute top-8 right-8">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-white dark:bg-[#09090b] shadow-sm transition-all hover:shadow-md">
          <h3 className="text-lg font-medium">Appearance</h3>
          <p className="text-sm text-muted-foreground mb-4">Customize how CodePulse looks on your device.</p>
          <div className="flex items-center justify-between">
            <span className="font-medium">Theme Preference</span>
            <div className="w-48"><ThemeToggle /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
