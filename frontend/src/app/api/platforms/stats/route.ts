import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/platforms/stats?platform=LeetCode&username=xxx
 * Fetches real-time user stats from coding platform public APIs.
 * Supports: LeetCode, Codeforces, CodeChef, GeeksForGeeks
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const username = searchParams.get("username");

  if (!platform || !username) {
    return NextResponse.json(
      { error: "platform and username are required" },
      { status: 400 }
    );
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
      default:
        return NextResponse.json({
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          message: `Stats fetching not supported for ${platform} yet`,
        });
    }
  } catch (error: any) {
    console.error(`Failed to fetch ${platform} stats for ${username}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

// ── LeetCode ──
async function fetchLeetCode(username: string) {
  const query = `
    query userProblemsSolved($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!res.ok) throw new Error("LeetCode API unavailable");

  const data = await res.json();
  const stats = data?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;

  if (!stats) {
    throw new Error(`User '${username}' not found on LeetCode`);
  }

  const getCount = (diff: string) =>
    stats.find((s: any) => s.difficulty === diff)?.count || 0;

  return NextResponse.json({
    totalSolved: getCount("All"),
    easySolved: getCount("Easy"),
    mediumSolved: getCount("Medium"),
    hardSolved: getCount("Hard"),
    platform: "LeetCode",
    username,
  });
}

// ── Codeforces ──
async function fetchCodeforces(username: string) {
  // Fetch user submissions to count unique solved problems
  const res = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=10000`
  );

  if (!res.ok) throw new Error("Codeforces API unavailable");

  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(data.comment || `User '${username}' not found on Codeforces`);
  }

  const submissions = data.result || [];
  const solvedSet = new Set<string>();
  let easy = 0, medium = 0, hard = 0;

  for (const sub of submissions) {
    if (sub.verdict === "OK" && sub.problem) {
      const key = `${sub.problem.contestId}-${sub.problem.index}`;
      if (!solvedSet.has(key)) {
        solvedSet.add(key);
        const rating = sub.problem.rating || 0;
        if (rating <= 1200) easy++;
        else if (rating <= 1800) medium++;
        else hard++;
      }
    }
  }

  return NextResponse.json({
    totalSolved: solvedSet.size,
    easySolved: easy,
    mediumSolved: medium,
    hardSolved: hard,
    platform: "Codeforces",
    username,
  });
}

// ── CodeChef ──
async function fetchCodeChef(username: string) {
  // Use CodeChef unofficial API
  const res = await fetch(
    `https://codechef-api.vercel.app/handle/${encodeURIComponent(username)}`
  );

  if (!res.ok) throw new Error("CodeChef API unavailable");

  const data = await res.json();

  if (!data || data.success === false) {
    throw new Error(`User '${username}' not found on CodeChef`);
  }

  // CodeChef doesn't have easy/medium/hard — estimate from data
  const totalSolved = data.currentRating ? Math.floor(data.currentRating / 10) : 0;

  return NextResponse.json({
    totalSolved: data.fullySolved?.count || totalSolved,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    platform: "CodeChef",
    username,
    note: "CodeChef does not provide difficulty breakdowns",
  });
}

// ── GeeksForGeeks ──
async function fetchGFG(username: string) {
  // GFG doesn't have an official API, use a community proxy
  const res = await fetch(
    `https://geeks-for-geeks-stats-api.vercel.app/?userName=${encodeURIComponent(username)}`
  );

  if (!res.ok) throw new Error("GeeksForGeeks API unavailable");

  const data = await res.json();

  return NextResponse.json({
    totalSolved: data.totalProblemsSolved || 0,
    easySolved: data.Easy || data.school || 0,
    mediumSolved: data.Medium || data.basic || 0,
    hardSolved: data.Hard || data.hard || 0,
    platform: "GeeksForGeeks",
    username,
  });
}
