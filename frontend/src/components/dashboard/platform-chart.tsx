"use client"

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { PlatformService } from '@/lib/api/platform.service'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7']

export function PlatformChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    PlatformService.getUserPlatforms()
      .then(platforms => {
        const chartData = platforms.map(p => ({
          platform: p.platformName,
          count: p.totalSolved
        })).filter(d => d.count > 0)
        setData(chartData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="h-[300px] flex items-center justify-center">Loading...</div>

  if (data.length === 0) return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available. Connect platforms to see distribution.</div>

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="count"
            nameKey="platform"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
