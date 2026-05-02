"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/lib/store/auth.store"
import { PlatformService, PlatformLink } from "@/lib/api/platform.service"
import api from "@/lib/api/axios"

type Contest = {
  platform: string
  title: string
  startTime: number
  url: string
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  const [platforms, setPlatforms] = useState<PlatformLink[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [contests, setContests] = useState<Contest[]>([])

  const linkedPlatforms = platforms.filter(p => p.connected)

  // Load platforms
  useEffect(() => {
    PlatformService.getUserPlatforms()
      .then(res => setPlatforms(res))
      .catch(err => console.error(err))
  }, [])

  // ✅ Fetch ALL contests (multi-platform)
  useEffect(() => {
    api.get("/contests/all")
      .then(res => {
        setContests(res.data || [])
      })
      .catch(err => console.error("Contest fetch error", err))
  }, [])

  const formatTime = (unix: number) => {
    return new Date(unix * 1000).toLocaleString()
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* LEFT SIDE */}
      <div className="lg:col-span-1 space-y-6">

        {/* PROFILE */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-bold">{user?.fullName}</h2>
            <p className="text-gray-500">@{user?.username}</p>
          </CardContent>
        </Card>

        {/* LINKED PLATFORMS */}
        <Card>
          <CardHeader>
            <CardTitle>Linked Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            {linkedPlatforms.length > 0 ? (
              linkedPlatforms.map(p => (
                <div key={p.id} className="flex justify-between py-2">
                  <span>{p.name}</span>
                  <span className="text-green-500">Connected</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No platforms connected</p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* RIGHT SIDE */}
      <div className="lg:col-span-2 space-y-6">

        {/* UPCOMING CONTESTS */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Contests</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {contests.length > 0 ? (
              contests
                .filter(c =>
                  linkedPlatforms.some(p => p.name === c.platform)
                )
                .slice(0, 5)
                .map((c, i) => (
                  <div
                    key={i}
                    className="p-4 border rounded-lg hover:shadow cursor-pointer"
                    onClick={() => window.open(c.url, "_blank")}
                  >
                    <p className="font-semibold">
                      [{c.platform}] {c.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTime(c.startTime)}
                    </p>
                  </div>
                ))
            ) : (
              <p className="text-gray-500">Loading contests...</p>
            )}

          </CardContent>
        </Card>

        {/* ACHIEVEMENTS */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>

          <CardContent>

            {/* SELECT PLATFORM */}
            {!selectedPlatform && (
              <div className="grid grid-cols-2 gap-4">
                {linkedPlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.name)}
                    className="p-4 border rounded-lg hover:shadow-md transition"
                  >
                    <p className="font-semibold">{platform.name}</p>
                    <p className="text-sm text-gray-500">View achievements</p>
                  </button>
                ))}
              </div>
            )}

            {/* SHOW ACHIEVEMENTS */}
            {selectedPlatform && (
              <div>
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="text-sm text-blue-500 mb-3"
                >
                  ← Back
                </button>

                <h3 className="font-semibold mb-4">
                  {selectedPlatform} Achievements
                </h3>

                {selectedPlatform === "LeetCode" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <p className="text-sm text-gray-500">Most Recent</p>
                      <p className="font-semibold">50 Days Badge</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-lg font-medium">
                      🚀 You're just getting started!
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Solve problems on {selectedPlatform} to unlock achievements
                    </p>
                  </div>
                )}
              </div>
            )}

          </CardContent>
        </Card>

      </div>

    </div>
  )
}