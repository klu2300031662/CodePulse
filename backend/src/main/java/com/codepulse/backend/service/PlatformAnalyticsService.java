package com.codepulse.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fetches detailed platform-specific analytics (rating, rank, contest history, badges, etc.)
 * with 10-minute in-memory caching per user+platform key.
 */
@Service
public class PlatformAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(PlatformAnalyticsService.class);
    private static final long CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    // In-memory cache: key = "platform:username"
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private static class CacheEntry {
        final Map<String, Object> data;
        final Instant expiry;
        CacheEntry(Map<String, Object> data) {
            this.data = data;
            this.expiry = Instant.now().plusMillis(CACHE_TTL_MS);
        }
        boolean isExpired() { return Instant.now().isAfter(expiry); }
    }

    public Map<String, Object> getAnalytics(String platform, String username) {
        String key = platform.toLowerCase() + ":" + username.toLowerCase();
        CacheEntry entry = cache.get(key);
        if (entry != null && !entry.isExpired()) {
            logger.debug("Cache hit for {}", key);
            return entry.data;
        }

        Map<String, Object> data;
        switch (platform.toLowerCase()) {
            case "leetcode":     data = fetchLeetCodeAnalytics(username); break;
            case "codeforces":   data = fetchCodeforcesAnalytics(username); break;
            case "codechef":     data = fetchCodeChefAnalytics(username); break;
            case "hackerrank":   data = fetchHackerRankAnalytics(username); break;
            case "geeksforgeeks": data = fetchGFGAnalytics(username); break;
            case "interviewbit": data = fetchInterviewBitAnalytics(username); break;
            default:
                data = Map.of("error", "Unsupported platform: " + platform);
        }

        data.put("platform", platform);
        data.put("username", username);
        data.put("fetchedAt", Instant.now().toString());

        cache.put(key, new CacheEntry(data));
        return data;
    }

    // ── LeetCode Analytics ──
    private Map<String, Object> fetchLeetCodeAnalytics(String username) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("platform", "LeetCode");

        // 1) Profile + solve stats
        try {
            String query = "{\"query\":\"query getUserProfile($username: String!) { " +
                    "matchedUser(username: $username) { " +
                    "profile { ranking realName reputation starRating } " +
                    "submitStats { acSubmissionNum { difficulty count } totalSubmissionNum { difficulty count } } " +
                    "submissionCalendar " +
                    "} " +
                    "userContestRanking(username: $username) { attendedContestsCount rating globalRanking topPercentage } " +
                    "}\",\"variables\":{\"username\":\"" + username + "\"}}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://leetcode.com/graphql"))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "Mozilla/5.0")
                    .POST(HttpRequest.BodyPublishers.ofString(query))
                    .timeout(Duration.ofSeconds(12))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                if (body.contains("\"matchedUser\":null")) {
                    result.put("error", "User not found");
                    return result;
                }

                // Solve stats
                result.put("easySolved", extractCount(body, "Easy", "acSubmissionNum"));
                result.put("mediumSolved", extractCount(body, "Medium", "acSubmissionNum"));
                result.put("hardSolved", extractCount(body, "Hard", "acSubmissionNum"));
                result.put("totalSolved", extractCount(body, "All", "acSubmissionNum"));

                int totalEasySub = extractCount(body, "Easy", "totalSubmissionNum");
                int totalMedSub = extractCount(body, "Medium", "totalSubmissionNum");
                int totalHardSub = extractCount(body, "Hard", "totalSubmissionNum");
                int totalAllSub = extractCount(body, "All", "totalSubmissionNum");
                result.put("totalSubmissions", totalAllSub);

                // Acceptance rate
                if (totalAllSub > 0) {
                    int accepted = (int) result.get("totalSolved");
                    // LeetCode acceptance = accepted submissions / total submissions
                    double acceptanceRate = totalAllSub > 0 ? Math.round(((double) extractCount(body, "All", "acSubmissionNum") * 10000.0 / totalAllSub)) / 100.0 : 0;
                    result.put("acceptanceRate", acceptanceRate);
                } else {
                    result.put("acceptanceRate", 0);
                }

                // Ranking
                result.put("ranking", extractJsonNumber(body, "ranking"));

                // Contest rating
                result.put("contestRating", extractJsonDouble(body, "\"rating\":", "userContestRanking"));
                result.put("contestsAttended", extractJsonNumber(body, "attendedContestsCount"));
                result.put("globalRanking", extractJsonNumber(body, "globalRanking"));
                result.put("topPercentage", extractJsonDouble(body, "\"topPercentage\":", null));

                // Submission calendar (heatmap data)
                int calStart = body.indexOf("\"submissionCalendar\"");
                if (calStart != -1) {
                    int valStart = body.indexOf("\"", calStart + 20) + 1;
                    int valEnd = body.indexOf("\"", valStart);
                    if (valEnd > valStart) {
                        String calStr = body.substring(valStart, valEnd).replace("\\\"", "\"");
                        result.put("submissionCalendar", calStr);
                    }
                }
            } else {
                result.put("error", "API returned status " + response.statusCode());
            }
        } catch (Exception e) {
            logger.error("LeetCode analytics fetch failed for '{}': {}", username, e.getMessage());
            result.put("error", "LeetCode API unavailable");
        }

        return result;
    }

    // ── Codeforces Analytics ──
    private Map<String, Object> fetchCodeforcesAnalytics(String username) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("platform", "Codeforces");

        // 1) User info (rating, rank)
        try {
            HttpRequest infoReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://codeforces.com/api/user.info?handles=" + username))
                    .header("User-Agent", "Mozilla/5.0")
                    .timeout(Duration.ofSeconds(12))
                    .GET().build();

            HttpResponse<String> infoRes = httpClient.send(infoReq, HttpResponse.BodyHandlers.ofString());
            if (infoRes.statusCode() == 200 && infoRes.body().contains("\"status\":\"OK\"")) {
                String body = infoRes.body();
                result.put("rating", extractJsonNumber(body, "\"rating\":"));
                result.put("maxRating", extractJsonNumber(body, "\"maxRating\":"));
                result.put("rank", extractJsonString(body, "rank"));
                result.put("maxRank", extractJsonString(body, "maxRank"));
                result.put("contribution", extractJsonNumber(body, "\"contribution\":"));
                result.put("friendOfCount", extractJsonNumber(body, "\"friendOfCount\":"));
            } else {
                result.put("error", "User not found on Codeforces");
                return result;
            }
        } catch (Exception e) {
            logger.error("Codeforces info failed for '{}': {}", username, e.getMessage());
            result.put("error", "Codeforces API unavailable");
            return result;
        }

        // 2) Contest history (rating changes)
        try {
            HttpRequest ratingReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://codeforces.com/api/user.rating?handle=" + username))
                    .header("User-Agent", "Mozilla/5.0")
                    .timeout(Duration.ofSeconds(12))
                    .GET().build();

            HttpResponse<String> ratingRes = httpClient.send(ratingReq, HttpResponse.BodyHandlers.ofString());
            if (ratingRes.statusCode() == 200 && ratingRes.body().contains("\"status\":\"OK\"")) {
                String body = ratingRes.body();
                List<Map<String, Object>> contestHistory = new ArrayList<>();

                // Parse contest entries
                String[] parts = body.split("\\{");
                for (String part : parts) {
                    if (part.contains("\"contestName\"") && part.contains("\"newRating\"")) {
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("contestName", extractInlineString(part, "contestName"));
                        entry.put("rank", extractInlineNumber(part, "rank"));
                        entry.put("oldRating", extractInlineNumber(part, "oldRating"));
                        entry.put("newRating", extractInlineNumber(part, "newRating"));
                        contestHistory.add(entry);
                    }
                }
                result.put("contestHistory", contestHistory);
                result.put("contestsAttended", contestHistory.size());
            }
        } catch (Exception e) {
            logger.warn("Codeforces rating history failed for '{}': {}", username, e.getMessage());
        }

        // 3) Problem stats (from user.status)
        try {
            HttpRequest statusReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://codeforces.com/api/user.status?handle=" + username + "&from=1&count=100000"))
                    .header("User-Agent", "Mozilla/5.0")
                    .timeout(Duration.ofSeconds(15))
                    .GET().build();

            HttpResponse<String> statusRes = httpClient.send(statusReq, HttpResponse.BodyHandlers.ofString());
            if (statusRes.statusCode() == 200) {
                String body = statusRes.body();
                Set<String> solvedSet = new HashSet<>();
                String[] submissions = body.split("\"verdict\":\"OK\"");
                for (int i = 1; i < submissions.length; i++) {
                    String chunk = submissions[i - 1];
                    String contestId = extractInlineField(chunk, "contestId");
                    String index = extractInlineField(chunk, "index");
                    if (contestId != null && index != null) {
                        solvedSet.add(contestId + "-" + index);
                    }
                }
                result.put("totalSolved", solvedSet.size());
            }
        } catch (Exception e) {
            logger.warn("Codeforces status failed for '{}': {}", username, e.getMessage());
        }

        return result;
    }

    // ── CodeChef Analytics ──
    private Map<String, Object> fetchCodeChefAnalytics(String username) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("platform", "CodeChef");
        boolean gotData = false;

        // Approach 1: Scrape CodeChef profile page directly (most reliable)
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.codechef.com/users/" + username))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml")
                    .timeout(Duration.ofSeconds(12))
                    .GET().build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                String body = response.body();

                // Total problems solved
                java.util.regex.Matcher m = java.util.regex.Pattern
                        .compile("Total\\s+Problems\\s+Solved\\s*:\\s*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                        .matcher(body);
                if (m.find()) {
                    result.put("totalSolved", Integer.parseInt(m.group(1)));
                    gotData = true;
                }

                // Rating from page
                java.util.regex.Matcher rm = java.util.regex.Pattern
                        .compile("(?:rating|Rating)[\\s\\S]*?(\\d{3,4})").matcher(body);
                if (rm.find()) {
                    result.put("currentRating", Integer.parseInt(rm.group(1)));
                    gotData = true;
                }

                // Highest rating
                java.util.regex.Matcher hrm = java.util.regex.Pattern
                        .compile("(?:highest|Highest)\\s*(?:rating|Rating)[\\s\\S]*?(\\d{3,4})").matcher(body);
                if (hrm.find()) {
                    result.put("highestRating", Integer.parseInt(hrm.group(1)));
                }

                // Stars
                java.util.regex.Matcher sm = java.util.regex.Pattern
                        .compile("(\\d)\\s*(?:★|star)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(body);
                if (sm.find()) {
                    result.put("stars", sm.group(1) + "★");
                }

                // Global Rank
                java.util.regex.Matcher grm = java.util.regex.Pattern
                        .compile("(?:Global|global)\\s*(?:Rank|rank)[^\\d]*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(body);
                if (grm.find()) {
                    result.put("globalRank", Integer.parseInt(grm.group(1)));
                }

                // Country Rank
                java.util.regex.Matcher crm = java.util.regex.Pattern
                        .compile("(?:Country|country)\\s*(?:Rank|rank)[^\\d]*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(body);
                if (crm.find()) {
                    result.put("countryRank", Integer.parseInt(crm.group(1)));
                }

                logger.info("CodeChef scrape: got data for '{}', totalSolved={}, globalRank={}, countryRank={}",
                        username, result.get("totalSolved"), result.get("globalRank"), result.get("countryRank"));
            }
        } catch (Exception e) {
            logger.warn("CodeChef profile scrape failed for '{}': {}", username, e.getMessage());
        }

        // Approach 2: Community API (may be rate-limited)
        if (!gotData) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://codechef-api.vercel.app/handle/" + username))
                        .header("User-Agent", "Mozilla/5.0")
                        .timeout(Duration.ofSeconds(10))
                        .GET().build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    String body = response.body();
                    result.put("currentRating", extractJsonNumber(body, "\"currentRating\":"));
                    result.put("highestRating", extractJsonNumber(body, "\"highestRating\":"));
                    result.put("stars", extractJsonStringVal(body, "stars"));
                    result.put("globalRank", extractJsonNumber(body, "\"globalRank\":"));
                    result.put("countryRank", extractJsonNumber(body, "\"countryRank\":"));

                    List<Map<String, Object>> recentContests = new ArrayList<>();
                    String[] contestParts = body.split("\"name\":");
                    for (int i = 1; i < contestParts.length && i <= 10; i++) {
                        String part = contestParts[i];
                        if (part.contains("\"rating\"")) {
                            Map<String, Object> entry = new LinkedHashMap<>();
                            int nameEnd = part.indexOf("\"", 1);
                            if (nameEnd > 1) entry.put("name", part.substring(1, nameEnd));
                            entry.put("rating", extractInlineNumber(part, "rating"));
                            entry.put("rank", extractInlineNumber(part, "rank"));
                            recentContests.add(entry);
                        }
                    }
                    result.put("recentContests", recentContests);
                    gotData = true;
                } else {
                    logger.warn("CodeChef community API returned {} for '{}'", response.statusCode(), username);
                }
            } catch (Exception e) {
                logger.warn("CodeChef community API failed for '{}': {}", username, e.getMessage());
            }
        }

        // If nothing worked, mark as private
        if (!gotData) {
            result.put("isPrivate", true);
            result.put("note", "CodeChef profile data is currently unavailable. The profile may be private or the API is temporarily down.");
        }

        return result;
    }

    // ── HackerRank Analytics (limited — no public API) ──
    private Map<String, Object> fetchHackerRankAnalytics(String username) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("platform", "HackerRank");
        result.put("isPrivate", true);
        result.put("note", "HackerRank does not expose a public API. Profile data is limited.");

        return result;
    }

    // ── GeeksForGeeks Analytics ──
    private Map<String, Object> fetchGFGAnalytics(String username) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("platform", "GeeksForGeeks");
        boolean gotData = false;

        // Approach 1: Scrape GFG profile page directly
        try {
            HttpClient scrapeClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .followRedirects(HttpClient.Redirect.ALWAYS)
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.geeksforgeeks.org/user/" + username + "/"))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .timeout(Duration.ofSeconds(12))
                    .GET().build();

            HttpResponse<String> response = scrapeClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                String body = response.body();

                // Try multiple patterns for totalProblemsSolved
                String[] patterns = {
                    "\"totalProblemsSolved\"\\s*:\\s*\"?(\\d+)\"?",
                    "\"problemsSolved\"\\s*:\\s*\"?(\\d+)\"?",
                    "solvedProblems[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)",
                    "(?:Total\\s+Problems?\\s+Solved|Problems?\\s+Solved)\\D*(\\d+)"
                };
                for (String pat : patterns) {
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile(pat, java.util.regex.Pattern.CASE_INSENSITIVE).matcher(body);
                    if (m.find()) {
                        result.put("totalSolved", Integer.parseInt(m.group(1)));
                        gotData = true;
                        break;
                    }
                }

                // Difficulty breakdown
                if (gotData) {
                    java.util.regex.Matcher em = java.util.regex.Pattern.compile("(?:\"EASY\"|\"easy\"|\"Easy\")\\s*[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(body);
                    if (em.find()) result.put("easySolved", Integer.parseInt(em.group(1)));
                    java.util.regex.Matcher mm = java.util.regex.Pattern.compile("(?:\"MEDIUM\"|\"medium\"|\"Medium\")\\s*[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(body);
                    if (mm.find()) result.put("mediumSolved", Integer.parseInt(mm.group(1)));
                    java.util.regex.Matcher hm = java.util.regex.Pattern.compile("(?:\"HARD\"|\"hard\"|\"Hard\")\\s*[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(body);
                    if (hm.find()) result.put("hardSolved", Integer.parseInt(hm.group(1)));

                    // Coding score
                    java.util.regex.Matcher cs = java.util.regex.Pattern.compile("(?:\"codingScore\"|codingScore)[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)").matcher(body);
                    if (cs.find()) result.put("score", Integer.parseInt(cs.group(1)));

                    // Streak
                    java.util.regex.Matcher st = java.util.regex.Pattern.compile("(?:\"currentStreak\"|currentStreak)[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)").matcher(body);
                    if (st.find()) result.put("streak", Integer.parseInt(st.group(1)));
                }

                logger.info("GFG scrape: got data for '{}', totalSolved={}", username, result.get("totalSolved"));
            }
        } catch (Exception e) {
            logger.warn("GFG profile scrape failed for '{}': {}", username, e.getMessage());
        }

        // Approach 2: Community API (primary)
        if (!gotData) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://geeks-for-geeks-stats-api.vercel.app/?userName=" + username))
                        .header("User-Agent", "Mozilla/5.0")
                        .timeout(Duration.ofSeconds(10))
                        .GET().build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    String body = response.body();
                    int total = parseIntSafe(extractJsonStringVal(body, "totalProblemsSolved"));
                    if (total > 0) {
                        result.put("totalSolved", total);
                        result.put("easySolved", parseIntSafe(extractJsonStringVal(body, "Easy")));
                        result.put("mediumSolved", parseIntSafe(extractJsonStringVal(body, "Medium")));
                        result.put("hardSolved", parseIntSafe(extractJsonStringVal(body, "Hard")));
                        result.put("score", parseIntSafe(extractJsonStringVal(body, "codingScore")));
                        result.put("streak", parseIntSafe(extractJsonStringVal(body, "currentStreak")));
                        result.put("maxStreak", parseIntSafe(extractJsonStringVal(body, "maxStreak")));
                        result.put("instituteRank", extractJsonStringVal(body, "instituteRank"));
                        gotData = true;
                    }
                }
            } catch (Exception e) {
                logger.warn("GFG community API failed for '{}': {}", username, e.getMessage());
            }
        }

        // Approach 3: Alternative community API
        if (!gotData) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://gfgstatsapi.onrender.com/api/" + username))
                        .header("User-Agent", "Mozilla/5.0")
                        .timeout(Duration.ofSeconds(10))
                        .GET().build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() == 200) {
                    String body = response.body();
                    int total = parseIntSafe(extractJsonStringVal(body, "totalProblemsSolved"));
                    if (total > 0) {
                        result.put("totalSolved", total);
                        result.put("easySolved", parseIntSafe(extractJsonStringVal(body, "Easy")));
                        result.put("mediumSolved", parseIntSafe(extractJsonStringVal(body, "Medium")));
                        result.put("hardSolved", parseIntSafe(extractJsonStringVal(body, "Hard")));
                        gotData = true;
                    }
                }
            } catch (Exception e) {
                logger.warn("GFG API 2 failed for '{}': {}", username, e.getMessage());
            }
        }

        if (!gotData) {
            result.put("isPrivate", true);
            result.put("note", "GeeksForGeeks profile data is currently unavailable. The profile may be private or the APIs are temporarily down.");
        }

        return result;
    }

    // ── InterviewBit Analytics (limited) ──
    private Map<String, Object> fetchInterviewBitAnalytics(String username) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("platform", "InterviewBit");
        boolean gotData = false;

        // Try scraping the profile page
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.interviewbit.com/profile/" + username))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .header("Accept", "text/html")
                    .timeout(Duration.ofSeconds(10))
                    .GET().build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                String body = response.body();
                java.util.regex.Matcher sm = java.util.regex.Pattern
                        .compile("(?:score|Score)\\D*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                        .matcher(body);
                if (sm.find()) { result.put("score", Integer.parseInt(sm.group(1))); gotData = true; }

                java.util.regex.Matcher rm = java.util.regex.Pattern
                        .compile("(?:rank|Rank)\\D*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                        .matcher(body);
                if (rm.find()) { result.put("rank", Integer.parseInt(rm.group(1))); gotData = true; }
            }
        } catch (Exception e) {
            logger.warn("InterviewBit scrape failed for '{}': {}", username, e.getMessage());
        }

        // Always mark as private since InterviewBit has no public API
        result.put("isPrivate", true);
        result.put("note", "InterviewBit does not expose a public API. Profile data is limited.");

        return result;
    }

    // ── Utility methods ──

    private int extractCount(String body, String difficulty, String section) {
        try {
            int sectionIdx = body.indexOf("\"" + section + "\"");
            if (sectionIdx == -1) return 0;
            String sub = body.substring(sectionIdx);
            String[] parts = sub.split("\"difficulty\":\"" + difficulty + "\",\"count\":");
            if (parts.length > 1) {
                return Integer.parseInt(parts[1].split("[},]")[0].trim());
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private int extractJsonNumber(String body, String key) {
        try {
            int idx = body.indexOf(key);
            if (idx == -1) return 0;
            String after = body.substring(idx + key.length()).trim();
            if (after.startsWith(":")) after = after.substring(1).trim();
            StringBuilder sb = new StringBuilder();
            for (char c : after.toCharArray()) {
                if (Character.isDigit(c) || c == '-') sb.append(c);
                else if (sb.length() > 0) break;
            }
            return sb.length() > 0 ? Integer.parseInt(sb.toString()) : 0;
        } catch (Exception ignored) {}
        return 0;
    }

    private double extractJsonDouble(String body, String key, String context) {
        try {
            String search = context != null ? body.substring(body.indexOf(context)) : body;
            int idx = search.indexOf(key);
            if (idx == -1) return 0;
            String after = search.substring(idx + key.length()).trim();
            StringBuilder sb = new StringBuilder();
            for (char c : after.toCharArray()) {
                if (Character.isDigit(c) || c == '.' || c == '-') sb.append(c);
                else if (sb.length() > 0) break;
            }
            return sb.length() > 0 ? Double.parseDouble(sb.toString()) : 0;
        } catch (Exception ignored) {}
        return 0;
    }

    private String extractJsonString(String body, String key) {
        try {
            int idx = body.indexOf("\"" + key + "\":\"");
            if (idx == -1) return "";
            String after = body.substring(idx + key.length() + 4);
            int end = after.indexOf("\"");
            return end > 0 ? after.substring(0, end) : "";
        } catch (Exception ignored) {}
        return "";
    }

    private String extractJsonStringVal(String body, String key) {
        try {
            int idx = body.indexOf("\"" + key + "\"");
            if (idx == -1) return null;
            String after = body.substring(idx + key.length() + 2).trim();
            if (after.startsWith(":")) after = after.substring(1).trim();
            if (after.startsWith("\"")) {
                int end = after.indexOf("\"", 1);
                return end > 1 ? after.substring(1, end) : null;
            } else {
                StringBuilder sb = new StringBuilder();
                for (char c : after.toCharArray()) {
                    if (Character.isDigit(c) || c == '.') sb.append(c);
                    else if (sb.length() > 0) break;
                }
                return sb.length() > 0 ? sb.toString() : null;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String extractInlineString(String part, String field) {
        try {
            int idx = part.indexOf("\"" + field + "\":\"");
            if (idx == -1) return "";
            String after = part.substring(idx + field.length() + 4);
            int end = after.indexOf("\"");
            return end > 0 ? after.substring(0, end) : "";
        } catch (Exception ignored) {}
        return "";
    }

    private int extractInlineNumber(String part, String field) {
        try {
            int idx = part.indexOf("\"" + field + "\":");
            if (idx == -1) return 0;
            String after = part.substring(idx + field.length() + 3).trim();
            StringBuilder sb = new StringBuilder();
            for (char c : after.toCharArray()) {
                if (Character.isDigit(c) || c == '-') sb.append(c);
                else if (sb.length() > 0) break;
            }
            return sb.length() > 0 ? Integer.parseInt(sb.toString()) : 0;
        } catch (Exception ignored) {}
        return 0;
    }

    private String extractInlineField(String chunk, String field) {
        try {
            int idx = chunk.lastIndexOf("\"" + field + "\":");
            if (idx == -1) return null;
            String after = chunk.substring(idx + field.length() + 3).trim();
            if (after.startsWith("\"")) {
                int end = after.indexOf("\"", 1);
                return after.substring(1, end);
            } else {
                StringBuilder sb = new StringBuilder();
                for (char c : after.toCharArray()) {
                    if (Character.isDigit(c) || c == '-') sb.append(c);
                    else break;
                }
                return sb.length() > 0 ? sb.toString() : null;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private int parseIntSafe(String s) {
        if (s == null || s.isEmpty()) return 0;
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return 0; }
    }
}
