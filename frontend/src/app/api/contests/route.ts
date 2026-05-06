import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/contests
 * Fetches upcoming contests from ALL coding platforms via Kontests.net API
 * Returns unified contest data: LeetCode, Codeforces, CodeChef, HackerRank, HackerEarth, AtCoder, etc.
 */

interface KontestContest {
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  duration: string;
  site: string;
  in_24_hours: string;
  status: string;
}

interface UnifiedContest {
  platform: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number; // seconds
  url: string;
  status: "upcoming" | "ongoing";
}

// Map Kontests.net site names to our platform names
const SITE_MAP: Record<string, string> = {
  "CodeForces": "Codeforces",
  "CodeForces::Gym": "Codeforces",
  "CodeChef": "CodeChef",
  "LeetCode": "LeetCode",
  "HackerRank": "HackerRank",
  "HackerEarth": "HackerEarth",
  "AtCoder": "AtCoder",
  "TopCoder": "TopCoder",
  "Kick Start": "Google",
};

export async function GET(request: NextRequest) {
  try {
    const res = await fetch("https://kontests.net/api/v1/all", {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      // Fallback: try clist.by API
      return await fetchFromClist();
    }

    const data: KontestContest[] = await res.json();

    // Filter to upcoming/ongoing contests and map to our format
    const contests: UnifiedContest[] = data
      .filter((c) => {
        const start = new Date(c.start_time).getTime();
        const end = new Date(c.end_time).getTime();
        const now = Date.now();
        // Include if contest hasn't ended yet
        return end > now;
      })
      .map((c) => {
        const startTime = new Date(c.start_time).getTime();
        const endTime = new Date(c.end_time).getTime();
        const now = Date.now();

        return {
          platform: SITE_MAP[c.site] || c.site,
          title: c.name,
          startTime: Math.floor(startTime / 1000),
          endTime: Math.floor(endTime / 1000),
          duration: parseInt(c.duration) || Math.floor((endTime - startTime) / 1000),
          url: c.url,
          status: (now >= startTime && now < endTime ? "ongoing" : "upcoming") as "upcoming" | "ongoing",
        };
      })
      .sort((a, b) => a.startTime - b.startTime);

    return NextResponse.json({ contests, source: "kontests.net" });
  } catch (error) {
    console.error("Failed to fetch contests:", error);
    return NextResponse.json(
      { contests: [], error: "Failed to fetch contest data" },
      { status: 500 }
    );
  }
}

async function fetchFromClist() {
  // Fallback with empty data — clist.by requires API key
  return NextResponse.json({ contests: [], source: "fallback" });
}
