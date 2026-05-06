import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/contests
 * Fetches upcoming contests from ALL coding platforms via multiple APIs.
 * Primary: Kontests.net | Fallback: Codeforces API + Clist
 */

interface UnifiedContest {
  platform: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  url: string;
  status: "upcoming" | "ongoing";
}

// Map Kontests.net site names to our platform names
const SITE_MAP: Record<string, string> = {
  "CodeForces": "Codeforces",
  "CodeForces::Gym": "Codeforces Gym",
  "CodeChef": "CodeChef",
  "LeetCode": "LeetCode",
  "HackerRank": "HackerRank",
  "HackerEarth": "HackerEarth",
  "AtCoder": "AtCoder",
  "TopCoder": "TopCoder",
  "Kick Start": "Google",
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Try Kontests.net first
    const kontestsData = await fetchFromKontests();
    if (kontestsData.length > 0) {
      return NextResponse.json({ contests: kontestsData, source: "kontests.net" });
    }

    // Fallback: aggregate from individual platform APIs
    const fallbackData = await fetchFallbackContests();
    return NextResponse.json({ contests: fallbackData, source: "fallback" });
  } catch (error) {
    console.error("Failed to fetch contests:", error);

    // Last resort: try fallback
    try {
      const fallbackData = await fetchFallbackContests();
      return NextResponse.json({ contests: fallbackData, source: "fallback" });
    } catch {
      return NextResponse.json(
        { contests: [], error: "Failed to fetch contest data" },
        { status: 500 }
      );
    }
  }
}

async function fetchFromKontests(): Promise<UnifiedContest[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://kontests.net/api/v1/all", {
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    const now = Date.now();

    return data
      .filter((c: any) => {
        const end = new Date(c.end_time).getTime();
        return end > now;
      })
      .map((c: any) => {
        const startTime = new Date(c.start_time).getTime();
        const endTime = new Date(c.end_time).getTime();

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
      .sort((a: UnifiedContest, b: UnifiedContest) => a.startTime - b.startTime);
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

async function fetchFallbackContests(): Promise<UnifiedContest[]> {
  const contests: UnifiedContest[] = [];
  const now = Date.now();

  // Codeforces API — always reliable
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://codeforces.com/api/contest.list?gym=false", {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "OK") {
        const upcoming = data.result
          .filter((c: any) => c.phase === "BEFORE" || c.phase === "CODING")
          .slice(0, 15);

        for (const c of upcoming) {
          const startMs = c.startTimeSeconds * 1000;
          contests.push({
            platform: "Codeforces",
            title: c.name,
            startTime: c.startTimeSeconds,
            endTime: c.startTimeSeconds + c.durationSeconds,
            duration: c.durationSeconds,
            url: `https://codeforces.com/contest/${c.id}`,
            status: c.phase === "CODING" ? "ongoing" : "upcoming",
          });
        }
      }
    }
  } catch (e) {
    console.error("Codeforces contest fallback failed:", e);
  }

  // LeetCode GraphQL — upcoming contests
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const query = `{ allContests { title startTime duration titleSlug } }`;
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const allContests = data?.data?.allContests || [];

      // Filter to upcoming/ongoing only
      const upcoming = allContests
        .filter((c: any) => {
          const endTime = (c.startTime + c.duration) * 1000;
          return endTime > now;
        })
        .slice(0, 10);

      for (const c of upcoming) {
        const startMs = c.startTime * 1000;
        contests.push({
          platform: "LeetCode",
          title: c.title,
          startTime: c.startTime,
          endTime: c.startTime + c.duration,
          duration: c.duration,
          url: `https://leetcode.com/contest/${c.titleSlug}/`,
          status: (now >= startMs && now < (c.startTime + c.duration) * 1000 ? "ongoing" : "upcoming"),
        });
      }
    }
  } catch (e) {
    console.error("LeetCode contest fallback failed:", e);
  }

  // CodeChef — scrape contests list
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all", {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();

      // Present contests (ongoing)
      const present = data?.present_contests || [];
      for (const c of present) {
        const start = new Date(c.contest_start_date_iso || c.contest_start_date).getTime();
        const end = new Date(c.contest_end_date_iso || c.contest_end_date).getTime();
        contests.push({
          platform: "CodeChef",
          title: c.contest_name,
          startTime: Math.floor(start / 1000),
          endTime: Math.floor(end / 1000),
          duration: Math.floor((end - start) / 1000),
          url: `https://www.codechef.com/${c.contest_code}`,
          status: "ongoing",
        });
      }

      // Future contests (upcoming)
      const future = data?.future_contests || [];
      for (const c of future.slice(0, 10)) {
        const start = new Date(c.contest_start_date_iso || c.contest_start_date).getTime();
        const end = new Date(c.contest_end_date_iso || c.contest_end_date).getTime();
        contests.push({
          platform: "CodeChef",
          title: c.contest_name,
          startTime: Math.floor(start / 1000),
          endTime: Math.floor(end / 1000),
          duration: Math.floor((end - start) / 1000),
          url: `https://www.codechef.com/${c.contest_code}`,
          status: "upcoming",
        });
      }
    }
  } catch (e) {
    console.error("CodeChef contest fallback failed:", e);
  }

  return contests.sort((a, b) => a.startTime - b.startTime);
}
