package com.codepulse.backend.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/contests")
public class ContestController {

    private static final Logger logger = LoggerFactory.getLogger(ContestController.class);

    private final RestTemplate restTemplate;
    private List<Map<String, Object>> cachedContests = null;
    private long cacheExpiry = 0;
    private static final long CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

    public ContestController() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllContests() {
        long now = System.currentTimeMillis();
        if (cachedContests != null && now < cacheExpiry) {
            return ResponseEntity.ok(cachedContests);
        }

        List<Map<String, Object>> allContests = new ArrayList<>();

        // 🔵 CODEFORCES
        try {
            String cfUrl = "https://codeforces.com/api/contest.list";
            Map cfResponse = restTemplate.getForObject(cfUrl, Map.class);
            if (cfResponse != null && "OK".equalsIgnoreCase((String) cfResponse.get("status"))) {
                List<Map<String, Object>> cfContests = (List<Map<String, Object>>) cfResponse.get("result");
                if (cfContests != null) {
                    for (Map<String, Object> contest : cfContests) {
                        if ("BEFORE".equals(contest.get("phase"))) {
                            Map<String, Object> c = new HashMap<>();
                            c.put("platform", "Codeforces");
                            c.put("title", contest.get("name"));
                            c.put("startTime", contest.get("startTimeSeconds"));
                            c.put("url", "https://codeforces.com/contests");
                            allContests.add(c);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to fetch Codeforces contests: {}", e.getMessage());
        }

        // 🟡 LEETCODE
        try {
            String lcUrl = "https://leetcode.com/graphql";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "Mozilla/5.0");

            String body = "{ \"query\": \"{ upcomingContests { title startTime duration titleSlug } }\" }";
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> lcResponse = restTemplate.postForEntity(lcUrl, entity, Map.class);
            if (lcResponse.getStatusCode() == HttpStatus.OK && lcResponse.getBody() != null) {
                Map data = (Map) lcResponse.getBody().get("data");
                if (data != null && data.get("upcomingContests") != null) {
                    List<Map<String, Object>> lcContests = (List<Map<String, Object>>) data.get("upcomingContests");
                    for (Map<String, Object> contest : lcContests) {
                        Map<String, Object> c = new HashMap<>();
                        c.put("platform", "LeetCode");
                        c.put("title", contest.get("title"));
                        c.put("startTime", contest.get("startTime"));
                        c.put("url", "https://leetcode.com/contest/" + contest.get("titleSlug"));
                        allContests.add(c);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to fetch LeetCode contests: {}", e.getMessage());
        }

        if (!allContests.isEmpty()) {
            this.cachedContests = allContests;
            this.cacheExpiry = now + CACHE_TTL_MS;
        } else if (cachedContests != null) {
            return ResponseEntity.ok(cachedContests);
        }

        return ResponseEntity.ok(allContests);
    }
}