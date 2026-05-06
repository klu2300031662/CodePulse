import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/platforms/stats?platform=LeetCode&username=xxx
 * Fetches real-time user stats from coding platform public APIs.
 * Supports: LeetCode, Codeforces, CodeChef, GeeksForGeeks
 * Not supported (no public API): HackerRank, InterviewBit
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
      case "hackerrank":
        return NextResponse.json({
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          platform: "HackerRank",
          username,
          notPublic: true,
          message: "HackerRank does not provide a public API for user statistics. Your data cannot be synced automatically.",
        });
      case "interviewbit":
        return NextResponse.json({
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          platform: "InterviewBit",
          username,
          notPublic: true,
          message: "InterviewBit does not provide a public API for user statistics. Your data cannot be synced automatically.",
        });
      default:
        return NextResponse.json({
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          notPublic: true,
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
  // Try the CodeChef user profile page to scrape "Total Problems Solved"
  try {
    const profileRes = await fetch(
      `https://www.codechef.com/users/${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html",
        },
      }
    );

    if (profileRes.ok) {
      const html = await profileRes.text();

      // Extract "Total Problems Solved: XXX" from the page
      const totalMatch = html.match(/Total Problems Solved:\s*(\d+)/i);
      if (totalMatch) {
        const totalSolved = parseInt(totalMatch[1], 10);
        return NextResponse.json({
          totalSolved,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          platform: "CodeChef",
          username,
          note: "CodeChef does not provide difficulty breakdowns publicly",
        });
      }

      // Alternative: try finding the problem count from rating section
      const solvedMatch = html.match(/class="rating-data-section problems-solved"[\s\S]*?(\d+)\s*<\/h5>/);
      if (solvedMatch) {
        return NextResponse.json({
          totalSolved: parseInt(solvedMatch[1], 10),
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          platform: "CodeChef",
          username,
        });
      }
    }
  } catch (e) {
    console.error("CodeChef scrape failed:", e);
  }

  // Fallback: try community API
  try {
    const res = await fetch(
      `https://codechef-api.vercel.app/handle/${encodeURIComponent(username)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        return NextResponse.json({
          totalSolved: data.fullySolved?.count || data.partiallySolved?.count || 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          platform: "CodeChef",
          username,
        });
      }
    }
  } catch (e) {
    console.error("CodeChef API fallback failed:", e);
  }

  throw new Error("CodeChef API unavailable – could not fetch profile data");
}

// ── GeeksForGeeks ──
async function fetchGFG(username: string) {
  // Try the primary community API
  try {
    const res = await fetch(
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
          platform: "GeeksForGeeks",
          username,
        });
      }
    }
  } catch (e) {
    console.error("GFG primary API failed:", e);
  }

  // Fallback: try alternate API
  try {
    const res = await fetch(
      `https://gfg-stats-api.vercel.app/api/${encodeURIComponent(username)}`
    );
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        totalSolved: data.totalProblemsSolved || data.totalProblems || 0,
        easySolved: data.easy || data.school || 0,
        mediumSolved: data.medium || data.basic || 0,
        hardSolved: data.hard || 0,
        platform: "GeeksForGeeks",
        username,
      });
    }
  } catch (e) {
    console.error("GFG fallback API failed:", e);
  }

  // Last resort: scrape GFG profile
  try {
    const res = await fetch(
      `https://www.geeksforgeeks.org/user/${encodeURIComponent(username)}/`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html",
        },
      }
    );
    if (res.ok) {
      const html = await res.text();
      const totalMatch = html.match(/Problems Solved[\s\S]*?(\d+)/);
      if (totalMatch) {
        return NextResponse.json({
          totalSolved: parseInt(totalMatch[1], 10),
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          platform: "GeeksForGeeks",
          username,
        });
      }
    }
  } catch (e) {
    console.error("GFG scrape failed:", e);
  }

  throw new Error("GeeksForGeeks API unavailable");
}
