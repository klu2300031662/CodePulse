"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-full flex justify-start items-center space-x-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-900"
    >
      <Sun className="h-5 w-5 dark:hidden" />
      <Moon className="h-5 w-5 hidden dark:block" />
      <span className="font-medium">Toggle Theme</span>
    </Button>
  )
}
