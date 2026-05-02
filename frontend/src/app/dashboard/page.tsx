"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Calendar,
  ChevronDown,
  ChevronUp,
  Unlink,
} from "lucide-react";

import { useAuthStore } from "@/lib/store/auth.store";
import { PlatformService, PlatformLink } from "@/lib/api/platform.service";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const [platforms, setPlatforms] = useState<PlatformLink[]>([]);
  const [expandedPlatform, setExpandedPlatform] = useState<number | null>(null);

  useEffect(() => {
    PlatformService.getUserPlatforms()
      .then((res) => setPlatforms(res))
      .catch((err) => console.error(err));
  }, []);

  const handleUnlink = async (id: number) => {
    if (confirm("Are you sure you want to unlink this platform?")) {
      try {
        await PlatformService.removePlatform(id);
        setPlatforms((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error("Failed to unlink", err);
      }
    }
  };

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* 🔥 PROFILE */}
      <Card className="rounded-xl shadow">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
            {user?.name?.[0] || "U"}
          </div>

          <div>
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-gray-500">@{user?.username}</p>
          </div>
        </CardContent>
      </Card>

      {/* 🔥 MIDDLE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 🔗 LINKED PLATFORMS */}
        <Card className="rounded-xl shadow">
          <CardHeader>
            <CardTitle>🔗 Linked Platforms</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {platforms.length === 0 && (
              <p className="text-gray-400">No platforms connected</p>
            )}

            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="border rounded-lg p-3 bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{platform.platformName}</p>
                    <p className="text-green-600 text-sm">Connected</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedPlatform(
                          expandedPlatform === platform.id
                            ? null
                            : platform.id
                        )
                      }
                    >
                      {expandedPlatform === platform.id ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>

                    <button onClick={() => handleUnlink(platform.id)}>
                      <Unlink size={18} className="text-red-500" />
                    </button>
                  </div>
                </div>

                {expandedPlatform === platform.id && (
                  <div className="mt-2 text-sm text-gray-600">
                    Username: {platform.username}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 🏆 ACHIEVEMENTS */}
        <Card className="rounded-xl shadow">
          <CardHeader>
            <CardTitle>🏆 Achievements</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>🔥 50 Day Streak</span>
              <span className="text-green-600">Done</span>
            </div>

            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>💯 100 Day Streak</span>
              <span className="text-gray-400">In Progress</span>
            </div>

            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>⭐ Codeforces 1200+</span>
              <span className="text-green-600">Done</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📅 UPCOMING CONTESTS */}
      <Card className="rounded-xl shadow">
        <CardHeader>
          <CardTitle>📅 Upcoming Contests</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="p-4 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">LeetCode Weekly Contest</p>
              <p className="text-sm text-gray-500">Starts in 2 hours</p>
            </div>
            <Trophy className="text-orange-500" />
          </div>

          <div className="p-4 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">Codeforces Round</p>
              <p className="text-sm text-gray-500">Starts tomorrow</p>
            </div>
            <Calendar className="text-blue-500" />
          </div>

        </CardContent>
      </Card>

    </div>
  );
}