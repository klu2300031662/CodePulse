import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/platforms/stats?platform=LeetCode&username=xxx
 * Fetches real-time user stats from coding platform public/community APIs.
 */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const username = searchParams.get("username");

  if (!platform || !username) {
    return NextResponse.json({ error: "platform and username are required" }, { status: 400 });
  }

  try {
    switch (platform.toLowerCase()) {
      case "leetcode":
        return await fetchLeetCode(username);
      case "codeforces":
        return await fetchCodeforces(username);
      case "codechef":
        return await fetchCodeChef(username);
      case "geeksforgeeks":
        return await fetchGFG(username);
      case "hackerrank":
      case "interviewbit":
        return NextResponse.json({
          totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
          platform, username, notPublic: true,
          message: `${platform} does not provide a public API for user statistics.`,
        });
      default:
        return NextResponse.json({
          totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
          notPublic: true, message: `Stats fetching not supported for ${platform} yet`,
        });
    }
  } catch (error: any) {
    console.error(`Failed to fetch ${platform} stats for ${username}:`, error);
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
  }
}

// ── Helper: fetch with timeout ──
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// ════════════════════════════════════════════
// ── LeetCode (GraphQL — very reliable) ──
// ════════════════════════════════════════════
async function fetchLeetCode(username: string) {
  const query = `
    query userProblemsSolved($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum { difficulty, count }
        }
      }
    }
  `;

  const res = await fetchWithTimeout("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!res.ok) throw new Error("LeetCode API unavailable");
  const data = await res.json();
  const stats = data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
  if (!stats) throw new Error(`User '${username}' not found on LeetCode`);

  const get = (d: string) => stats.find((s: any) => s.difficulty === d)?.count || 0;
  return NextResponse.json({
    totalSolved: get("All"), easySolved: get("Easy"),
    mediumSolved: get("Medium"), hardSolved: get("Hard"),
    platform: "LeetCode", username,
  });
}

// ════════════════════════════════════════════
// ── Codeforces (Official API) ──
// ════════════════════════════════════════════
async function fetchCodeforces(username: string) {
  // Try official API with timeout
  const res = await fetchWithTimeout(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=100000`,
    {}, 10000
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (text.includes("not found") || res.status === 400) {
      throw new Error(`User '${username}' not found on Codeforces`);
    }
    throw new Error("Codeforces API unavailable");
  }

  const data = await res.json();
  if (data.status !== "OK") {
    throw new Error(data.comment || `User '${username}' not found on Codeforces`);
  }

  // Count unique solved problems
  const solved = new Map<string, number>();
  for (const sub of (data.result || [])) {
    if (sub.verdict === "OK" && sub.problem) {
      const key = `${sub.problem.contestId}-${sub.problem.index}`;
      if (!solved.has(key)) {
        solved.set(key, sub.problem.rating || 0);
      }
    }
  }

  let easy = 0, medium = 0, hard = 0;
  solved.forEach((rating) => {
    if (rating <= 1200) easy++;
    else if (rating <= 1800) medium++;
    else hard++;
  });

  return NextResponse.json({
    totalSolved: solved.size, easySolved: easy,
    mediumSolved: medium, hardSolved: hard,
    platform: "Codeforces", username,
  });
}

// ════════════════════════════════════════════
// ── CodeChef (Community API + scraping) ──
// ════════════════════════════════════════════
async function fetchCodeChef(username: string) {
  // Approach 1: codechef-api.vercel.app (most reliable community API)
  try {
    const res = await fetchWithTimeout(
      `https://codechef-api.vercel.app/handle/${encodeURIComponent(username)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.profile) {
        // This API returns fullySolved and partiallySolved
        const total = (data.currentRating ? 
          (data.fullySolved?.count || 0) + (data.partiallySolved?.count || 0) : 0
        );
        
        if (total > 0) {
          return NextResponse.json({
            totalSolved: total, easySolved: 0, mediumSolved: 0, hardSolved: 0,
            platform: "CodeChef", username,
            note: "CodeChef does not provide public difficulty breakdowns",
          });
        }
      }
    }
  } catch (e) { console.error("CodeChef API 1 failed:", e); }

  // Approach 2: Scrape the profile page for "Total Problems Solved"
  try {
    const res = await fetchWithTimeout(
      `https://www.codechef.com/users/${encodeURIComponent(username)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" } },
      10000
    );
    if (res.ok) {
      const html = await res.text();
      // Look for "Total Problems Solved: XXX"
      const match = html.match(/Total\s+Problems\s+Solved\s*:\s*(\d+)/i);
      if (match) {
        return NextResponse.json({
          totalSolved: parseInt(match[1], 10), easySolved: 0, mediumSolved: 0, hardSolved: 0,
          platform: "CodeChef", username,
        });
      }
      // Alternative: look for problems-solved section
      const altMatch = html.match(/problems-solved[\s\S]*?(\d+)\s*<\/h3>/);
      if (altMatch) {
        return NextResponse.json({
          totalSolved: parseInt(altMatch[1], 10), easySolved: 0, mediumSolved: 0, hardSolved: 0,
          platform: "CodeChef", username,
        });
      }
    }
  } catch (e) { console.error("CodeChef scrape failed:", e); }

  // Approach 3: Alternative community API
  try {
    const res = await fetchWithTimeout(
      `https://codechef-api.vercel.app/${encodeURIComponent(username)}`
    );
    if (res.ok) {
      const data = await res.json();
      const total = data?.totalProblemsSolved || data?.fullySolved || 0;
      if (total > 0) {
        return NextResponse.json({
          totalSolved: total, easySolved: 0, mediumSolved: 0, hardSolved: 0,
          platform: "CodeChef", username,
        });
      }
    }
  } catch (e) { console.error("CodeChef API 3 failed:", e); }

  throw new Error("CodeChef API unavailable – could not fetch profile data");
}

// ════════════════════════════════════════════
// ── GeeksForGeeks (Community APIs) ──
// ════════════════════════════════════════════
async function fetchGFG(username: string) {
  // Approach 1: Primary community API
  try {
    const res = await fetchWithTimeout(
      `https://geeks-for-geeks-stats-api.vercel.app/?userName=${encodeURIComponent(username)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.totalProblemsSolved) {
        return NextResponse.json({
          totalSolved: data.totalProblemsSolved || 0,
          easySolved: parseInt(data.Easy || data.easy || "0", 10),
          mediumSolved: parseInt(data.Medium || data.medium || "0", 10),
          hardSolved: parseInt(data.Hard || data.hard || "0", 10),
          platform: "GeeksForGeeks", username,
        });
      }
    }
  } catch (e) { console.error("GFG API 1 failed:", e); }

  // Approach 2: gfgstatsapi
  try {
    const res = await fetchWithTimeout(
      `https://gfgstatsapi.onrender.com/api/${encodeURIComponent(username)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data) {
        return NextResponse.json({
          totalSolved: data.totalProblemsSolved || 0,
          easySolved: data.Easy || data.easy || 0,
          mediumSolved: data.Medium || data.medium || 0,
          hardSolved: data.Hard || data.hard || 0,
          platform: "GeeksForGeeks", username,
        });
      }
    }
  } catch (e) { console.error("GFG API 2 failed:", e); }

  // Approach 3: Another GFG stats API
  try {
    const res = await fetchWithTimeout(
      `https://gfg-stats-api.vercel.app/api/${encodeURIComponent(username)}`
    );
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        totalSolved: data.totalProblemsSolved || data.totalProblems || 0,
        easySolved: data.easy || 0,
        mediumSolved: data.medium || 0,
        hardSolved: data.hard || 0,
        platform: "GeeksForGeeks", username,
      });
    }
  } catch (e) { console.error("GFG API 3 failed:", e); }

  throw new Error("GeeksForGeeks API unavailable");
}
