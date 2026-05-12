package com.codepulse.backend.controllers;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/contests")
public class ContestController {

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/all")
    public ResponseEntity<?> getAllContests() {

        List<Map<String, Object>> allContests = new ArrayList<>();

        try {
            // 🔵 CODEFORCES
            String cfUrl = "https://codeforces.com/api/contest.list";
            Map cfResponse = restTemplate.getForObject(cfUrl, Map.class);

            List<Map<String, Object>> cfContests = (List<Map<String, Object>>) cfResponse.get("result");

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

            // 🟡 LEETCODE
            String lcUrl = "https://leetcode.com/graphql";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String body = "{ \"query\": \"{ upcomingContests { title startTime duration titleSlug } }\" }";

            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> lcResponse = restTemplate.postForEntity(lcUrl, entity, Map.class);

            Map data = (Map) lcResponse.getBody().get("data");
            List<Map<String, Object>> lcContests = (List<Map<String, Object>>) data.get("upcomingContests");

            for (Map<String, Object> contest : lcContests) {
                Map<String, Object> c = new HashMap<>();
                c.put("platform", "LeetCode");
                c.put("title", contest.get("title"));
                c.put("startTime", contest.get("startTime"));
                c.put("url", "https://leetcode.com/contest/" + contest.get("titleSlug"));
                allContests.add(c);
            }

            return ResponseEntity.ok(allContests);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching contests");
        }
    }
}