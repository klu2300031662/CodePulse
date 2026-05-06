package com.codepulse.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

/**
 * Fetches real-time problem-solving stats from coding platforms.
 * Supports: LeetCode, Codeforces, CodeChef, GeeksForGeeks.
 * HackerRank & InterviewBit do not expose public APIs.
 */
@Service
public class PlatformStatsService {

    private static final Logger logger = LoggerFactory.getLogger(PlatformStatsService.class);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public static class PlatformStats {
        public int totalSolved = 0;
        public int easySolved = 0;
        public int mediumSolved = 0;
        public int hardSolved = 0;
        public boolean notPublic = false;
        public String error = null;
    }

    /**
     * Fetch stats for any supported platform.
     */
    public PlatformStats fetchStats(String platformName, String username) {
        switch (platformName.toLowerCase()) {
            case "leetcode":
                return fetchLeetCode(username);
            case "codeforces":
                return fetchCodeforces(username);
            case "codechef":
                return fetchCodeChef(username);
            case "geeksforgeeks":
            case "hackerrank":
            case "interviewbit":
                PlatformStats notPublic = new PlatformStats();
                notPublic.notPublic = true;
                return notPublic;
            default:
                PlatformStats unsupported = new PlatformStats();
                unsupported.error = "Unsupported platform: " + platformName;
                return unsupported;
        }
    }

    // ── LeetCode (GraphQL API — very reliable) ──
    private PlatformStats fetchLeetCode(String username) {
        PlatformStats stats = new PlatformStats();
        try {
            String query = "{\"query\":\"query getUserProfile($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count } } } }\",\"variables\":{\"username\":\"" + username + "\"}}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://leetcode.com/graphql"))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "Mozilla/5.0")
                    .POST(HttpRequest.BodyPublishers.ofString(query))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                if (body.contains("\"matchedUser\":null")) {
                    stats.error = "LeetCode user '" + username + "' not found";
                    return stats;
                }
                stats.totalSolved = extractCount(body, "All");
                stats.easySolved = extractCount(body, "Easy");
                stats.mediumSolved = extractCount(body, "Medium");
                stats.hardSolved = extractCount(body, "Hard");
            } else {
                stats.error = "LeetCode API returned status " + response.statusCode();
            }
        } catch (Exception e) {
            logger.error("LeetCode fetch failed for '{}': {}", username, e.getMessage());
            stats.error = "LeetCode API unavailable";
        }
        return stats;
    }

    // ── Codeforces (Official REST API) ──
    private PlatformStats fetchCodeforces(String username) {
        PlatformStats stats = new PlatformStats();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://codeforces.com/api/user.status?handle=" + username + "&from=1&count=100000"))
                    .header("User-Agent", "Mozilla/5.0")
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                if (!body.contains("\"status\":\"OK\"")) {
                    stats.error = "Codeforces user '" + username + "' not found";
                    return stats;
                }

                // Count unique solved problems by (contestId, index)
                Set<String> solvedSet = new HashSet<>();
                int easy = 0, medium = 0, hard = 0;

                // Parse submissions — look for verdict: "OK"
                String[] submissions = body.split("\"verdict\":\"OK\"");
                for (int i = 1; i < submissions.length; i++) {
                    String chunk = submissions[i];
                    // Go backwards to find the problem info
                    String precedingChunk = submissions[i - 1];
                    
                    // Extract contestId and index from the preceding chunk
                    String contestId = extractField(precedingChunk, "contestId");
                    String index = extractField(precedingChunk, "index");
                    String ratingStr = extractField(precedingChunk, "rating");
                    
                    if (contestId != null && index != null) {
                        String key = contestId + "-" + index;
                        if (!solvedSet.contains(key)) {
                            solvedSet.add(key);
                            int rating = 0;
                            try {
                                if (ratingStr != null) rating = Integer.parseInt(ratingStr);
                            } catch (NumberFormatException ignored) {}
                            
                            if (rating <= 1200) easy++;
                            else if (rating <= 1800) medium++;
                            else hard++;
                        }
                    }
                }

                stats.totalSolved = solvedSet.size();
                stats.easySolved = easy;
                stats.mediumSolved = medium;
                stats.hardSolved = hard;
            } else if (response.statusCode() == 400) {
                stats.error = "Codeforces user '" + username + "' not found";
            } else {
                stats.error = "Codeforces API returned status " + response.statusCode();
            }
        } catch (Exception e) {
            logger.error("Codeforces fetch failed for '{}': {}", username, e.getMessage());
            stats.error = "Codeforces API unavailable";
        }
        return stats;
    }

    // ── CodeChef (Profile page scraping) ──
    private PlatformStats fetchCodeChef(String username) {
        PlatformStats stats = new PlatformStats();

        // Approach 1: Scrape profile page for "Total Problems Solved: XXX"
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.codechef.com/users/" + username))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml")
                    .timeout(Duration.ofSeconds(12))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                
                // Look for "Total Problems Solved: 363"
                java.util.regex.Matcher matcher = java.util.regex.Pattern
                        .compile("Total\\s+Problems\\s+Solved\\s*:\\s*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                        .matcher(body);
                
                if (matcher.find()) {
                    stats.totalSolved = Integer.parseInt(matcher.group(1));
                    logger.info("CodeChef: Found {} total solved for '{}'", stats.totalSolved, username);
                    return stats;
                }
                
                // Alternative pattern: problems-solved section
                matcher = java.util.regex.Pattern
                        .compile("problems-solved[\\s\\S]*?(\\d+)\\s*</h[35]>")
                        .matcher(body);
                
                if (matcher.find()) {
                    stats.totalSolved = Integer.parseInt(matcher.group(1));
                    return stats;
                }
            }
        } catch (Exception e) {
            logger.warn("CodeChef scrape failed for '{}': {}", username, e.getMessage());
        }

        // Approach 2: Community API
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://codechef-api.vercel.app/handle/" + username))
                    .header("User-Agent", "Mozilla/5.0")
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                // Extract fullySolved count
                java.util.regex.Matcher m = java.util.regex.Pattern
                        .compile("\"count\"\\s*:\\s*(\\d+)")
                        .matcher(body);
                
                int total = 0;
                while (m.find()) {
                    int val = Integer.parseInt(m.group(1));
                    if (val > total) total = val;
                }
                
                if (total > 0) {
                    stats.totalSolved = total;
                    return stats;
                }
            }
        } catch (Exception e) {
            logger.warn("CodeChef API failed for '{}': {}", username, e.getMessage());
        }

        stats.error = "CodeChef API unavailable";
        return stats;
    }

    // ── GeeksForGeeks (Profile page scraping + Community API fallback) ──
    private PlatformStats fetchGFG(String username) {
        PlatformStats stats = new PlatformStats();

        // Approach 1: Scrape the GFG profile page directly
        // The page embeds user data in JSON within the HTML
        try {
            // GFG profile URLs: https://www.geeksforgeeks.org/user/{handle}/
            HttpClient scrapeClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .followRedirects(HttpClient.Redirect.ALWAYS)
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.geeksforgeeks.org/user/" + username + "/"))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.5")
                    .timeout(Duration.ofSeconds(12))
                    .GET()
                    .build();

            HttpResponse<String> response = scrapeClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();

                // Pattern 1: Look for "totalProblemsSolved":"195" or totalProblemsSolved":195
                java.util.regex.Matcher m1 = java.util.regex.Pattern
                        .compile("\"totalProblemsSolved\"\\s*:\\s*\"?(\\d+)\"?")
                        .matcher(body);
                if (m1.find()) {
                    stats.totalSolved = Integer.parseInt(m1.group(1));
                    logger.info("GFG scrape: Found totalProblemsSolved={} for '{}'", stats.totalSolved, username);
                    
                    // Try to extract difficulty breakdown
                    extractGFGDifficulty(body, stats);
                    return stats;
                }

                // Pattern 2: Look for "problemsSolved":"195" in embedded JSON
                java.util.regex.Matcher m2 = java.util.regex.Pattern
                        .compile("\"problemsSolved\"\\s*:\\s*\"?(\\d+)\"?")
                        .matcher(body);
                if (m2.find()) {
                    stats.totalSolved = Integer.parseInt(m2.group(1));
                    logger.info("GFG scrape: Found problemsSolved={} for '{}'", stats.totalSolved, username);
                    extractGFGDifficulty(body, stats);
                    return stats;
                }

                // Pattern 3: Look for the score card pattern "solvedProblems":195
                java.util.regex.Matcher m3 = java.util.regex.Pattern
                        .compile("solvedProblems[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)")
                        .matcher(body);
                if (m3.find()) {
                    stats.totalSolved = Integer.parseInt(m3.group(1));
                    extractGFGDifficulty(body, stats);
                    return stats;
                }

                // Pattern 4: Look for "Total Problems Solved" text followed by a number
                java.util.regex.Matcher m4 = java.util.regex.Pattern
                        .compile("(?:Total\\s+Problems?\\s+Solved|Problems?\\s+Solved)\\D*(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                        .matcher(body);
                if (m4.find()) {
                    stats.totalSolved = Integer.parseInt(m4.group(1));
                    extractGFGDifficulty(body, stats);
                    return stats;
                }
                
                logger.warn("GFG scrape: Could not find problem count in profile page for '{}'", username);
            } else {
                logger.warn("GFG scrape returned status {} for '{}'", response.statusCode(), username);
            }
        } catch (Exception e) {
            logger.warn("GFG profile scrape failed for '{}': {}", username, e.getMessage());
        }

        // Approach 2: Community API (primary)
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://geeks-for-geeks-stats-api.vercel.app/?userName=" + username))
                    .header("User-Agent", "Mozilla/5.0")
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                String total = extractJsonString(body, "totalProblemsSolved");
                if (total != null) {
                    stats.totalSolved = Integer.parseInt(total);
                    String easy = extractJsonString(body, "Easy");
                    if (easy == null) easy = extractJsonString(body, "easy");
                    String medium = extractJsonString(body, "Medium");
                    if (medium == null) medium = extractJsonString(body, "medium");
                    String hard = extractJsonString(body, "Hard");
                    if (hard == null) hard = extractJsonString(body, "hard");
                    stats.easySolved = parseIntSafe(easy);
                    stats.mediumSolved = parseIntSafe(medium);
                    stats.hardSolved = parseIntSafe(hard);
                    return stats;
                }
            }
        } catch (Exception e) {
            logger.warn("GFG community API failed for '{}': {}", username, e.getMessage());
        }

        // Approach 3: Alternative community API
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://gfgstatsapi.onrender.com/api/" + username))
                    .header("User-Agent", "Mozilla/5.0")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String body = response.body();
                String total = extractJsonString(body, "totalProblemsSolved");
                if (total != null) {
                    stats.totalSolved = Integer.parseInt(total);
                    stats.easySolved = parseIntSafe(extractJsonString(body, "Easy"));
                    stats.mediumSolved = parseIntSafe(extractJsonString(body, "Medium"));
                    stats.hardSolved = parseIntSafe(extractJsonString(body, "Hard"));
                    return stats;
                }
            }
        } catch (Exception e) {
            logger.warn("GFG API 2 failed for '{}': {}", username, e.getMessage());
        }

        stats.error = "GeeksForGeeks API unavailable";
        return stats;
    }

    /** Extract GFG difficulty breakdown from page HTML */
    private void extractGFGDifficulty(String body, PlatformStats stats) {
        try {
            // Look for patterns like "SCHOOL":"0","BASIC":"170","EASY":"18","MEDIUM":"7","HARD":"0"
            // or "school":0,"basic":170,"easy":18,"medium":7,"hard":0
            java.util.regex.Matcher em = java.util.regex.Pattern
                    .compile("(?:\"EASY\"|\"easy\"|\"Easy\")\\s*[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                    .matcher(body);
            if (em.find()) stats.easySolved = Integer.parseInt(em.group(1));

            java.util.regex.Matcher mm = java.util.regex.Pattern
                    .compile("(?:\"MEDIUM\"|\"medium\"|\"Medium\")\\s*[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                    .matcher(body);
            if (mm.find()) stats.mediumSolved = Integer.parseInt(mm.group(1));

            java.util.regex.Matcher hm = java.util.regex.Pattern
                    .compile("(?:\"HARD\"|\"hard\"|\"Hard\")\\s*[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                    .matcher(body);
            if (hm.find()) stats.hardSolved = Integer.parseInt(hm.group(1));

            // Include BASIC + SCHOOL in easy count if found
            java.util.regex.Matcher bm = java.util.regex.Pattern
                    .compile("(?:\"BASIC\"|\"basic\"|\"Basic\")\\s*[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                    .matcher(body);
            if (bm.find()) stats.easySolved += Integer.parseInt(bm.group(1));

            java.util.regex.Matcher sm = java.util.regex.Pattern
                    .compile("(?:\"SCHOOL\"|\"school\"|\"School\")\\s*[\"']?\\s*[:\\s]+\\s*[\"']?(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE)
                    .matcher(body);
            if (sm.find()) stats.easySolved += Integer.parseInt(sm.group(1));
        } catch (Exception e) {
            logger.warn("Could not extract GFG difficulty breakdown: {}", e.getMessage());
        }
    }

    // ── Utility methods ──

    private int extractCount(String body, String difficulty) {
        try {
            String[] parts = body.split("\"difficulty\":\"" + difficulty + "\",\"count\":");
            if (parts.length > 1) {
                return Integer.parseInt(parts[1].split("[},]")[0].trim());
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private String extractField(String chunk, String fieldName) {
        try {
            int idx = chunk.lastIndexOf("\"" + fieldName + "\":");
            if (idx == -1) return null;
            String after = chunk.substring(idx + fieldName.length() + 3).trim();
            if (after.startsWith("\"")) {
                // String value
                int end = after.indexOf("\"", 1);
                return after.substring(1, end);
            } else {
                // Numeric value
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

    private String extractJsonString(String json, String key) {
        try {
            int idx = json.indexOf("\"" + key + "\"");
            if (idx == -1) return null;
            String after = json.substring(idx + key.length() + 3).trim();
            // Skip colon and whitespace
            if (after.startsWith(":")) after = after.substring(1).trim();
            
            if (after.startsWith("\"")) {
                int end = after.indexOf("\"", 1);
                return after.substring(1, end);
            } else {
                StringBuilder sb = new StringBuilder();
                for (char c : after.toCharArray()) {
                    if (Character.isDigit(c)) sb.append(c);
                    else if (c != ' ') break;
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
