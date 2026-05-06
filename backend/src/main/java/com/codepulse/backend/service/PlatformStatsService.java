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
                return fetchGFG(username);
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

    // ── GeeksForGeeks (Community APIs) ──
    private PlatformStats fetchGFG(String username) {
        PlatformStats stats = new PlatformStats();

        // Approach 1: Primary community API
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
                
                // Extract totalProblemsSolved
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
            logger.warn("GFG API 1 failed for '{}': {}", username, e.getMessage());
        }

        // Approach 2: Alternative API
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
