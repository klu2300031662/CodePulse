"use client"

import { useEffect, useState } from "react"
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns"
import { Tooltip } from "react-tooltip"
import { ProblemService } from "@/lib/api/problem.service"

export function ActivityHeatmap() {
  const [activityData, setActivityData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ProblemService.getAll()
      .then(problems => {
        // Derive heatmap data from solved problems by counting problems per date
        const dateCountMap: Record<string, number> = {}
        if (Array.isArray(problems)) {
          problems.forEach((p: any) => {
            if (p.dateSolved) {
              try {
                const dateKey = format(new Date(p.dateSolved), "yyyy-MM-dd")
                dateCountMap[dateKey] = (dateCountMap[dateKey] || 0) + 1
              } catch (e) {}
            }
          })
        }
        const heatmapData = Object.entries(dateCountMap).map(([date, count]) => ({
          date,
          count
        }))
        setActivityData(heatmapData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // Generate last 6 months of dates (approx 180 days)
  const today = new Date()
  const startDate = startOfWeek(subDays(today, 180))
  const endDate = endOfWeek(today)
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })

  // Organize into weeks
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  
  allDays.forEach((day, i) => {
    currentWeek.push(day)
    if (currentWeek.length === 7 || i === allDays.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  const activityMap = new Map<string, number>()
  activityData.forEach(d => {
    try {
      const dateKey = format(new Date(d.date), "yyyy-MM-dd")
      activityMap.set(dateKey, d.count)
    } catch (e) {}
  })

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-800"
    if (count > 0 && count <= 2) return "bg-green-200 dark:bg-green-900"
    if (count > 2 && count <= 5) return "bg-green-400 dark:bg-green-700"
    if (count > 5 && count <= 8) return "bg-green-500 dark:bg-green-600"
    return "bg-green-600 dark:bg-green-500"
  }

  if (loading) return <div className="h-[200px] flex items-center justify-center">Loading...</div>

  return (
    <div className="w-full flex justify-center py-4 overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={`w-${weekIndex}`} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => {
              // Find activity matching this day by looking up in map
              const key = format(day, "yyyy-MM-dd")
              const count = activityMap.get(key) || 0
              const dateStr = format(day, "MMM d, yyyy")

              return (
                <div
                  key={`d-${dayIndex}`}
                  data-tooltip-id="heatmap-tooltip"
                  data-tooltip-content={`${count} problems on ${dateStr}`}
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${getIntensity(count)} transition-colors hover:ring-1 hover:ring-zinc-400 cursor-pointer`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <Tooltip id="heatmap-tooltip" place="top" style={{ zIndex: 50, fontSize: "12px", borderRadius: "6px" }} />
    </div>
  )
}
