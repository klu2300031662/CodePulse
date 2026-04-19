package com.codepulse.backend.controllers;

import com.codepulse.backend.models.PlatformLink;
import com.codepulse.backend.models.User;
import com.codepulse.backend.repository.PlatformLinkRepository;
import com.codepulse.backend.repository.UserRepository;
import com.codepulse.backend.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/platforms")
public class PlatformLinkController {

    @Autowired
    private PlatformLinkRepository platformLinkRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return null;
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetailsImpl)) return null;
        UserDetailsImpl userDetails = (UserDetailsImpl) principal;
        return userRepository.findByUsername(userDetails.getUsername()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getUserPlatforms() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("Not authenticated");

        List<PlatformLink> links = platformLinkRepository.findByUser(user);
        
        // Sync LeetCode data to update to current date solved problems
        for (PlatformLink link : links) {
            if ("LeetCode".equalsIgnoreCase(link.getPlatformName())) {
                try {
                    String query = "{\"query\":\"query getUserProfile($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count } } } }\",\"variables\":{\"username\":\"" + link.getUsername() + "\"}}";
                    
                    java.net.URI uri = java.net.URI.create("https://leetcode.com/graphql");
                    java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                    java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                            .uri(uri)
                            .header("Content-Type", "application/json")
                            .header("User-Agent", "Mozilla/5.0")
                            .POST(java.net.http.HttpRequest.BodyPublishers.ofString(query))
                            .build();
                            
                    java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
                    
                    if (response.statusCode() == 200) {
                        String body = response.body();
                        if (body.contains("\"acSubmissionNum\"")) {
                            int total = 0, easy = 0, medium = 0, hard = 0;
                            // Basic parsing since we don't want to add Jackson complexity right now if we can avoid it
                            // The response looks like: "acSubmissionNum":[{"difficulty":"All","count":205},{"difficulty":"Easy","count":103},{"difficulty":"Medium","count":98},{"difficulty":"Hard","count":4}]
                            try {
                                String[] parts = body.split("\"difficulty\":\"All\",\"count\":");
                                if(parts.length > 1) total = Integer.parseInt(parts[1].split("}")[0]);
                                
                                parts = body.split("\"difficulty\":\"Easy\",\"count\":");
                                if(parts.length > 1) easy = Integer.parseInt(parts[1].split("}")[0]);
                                
                                parts = body.split("\"difficulty\":\"Medium\",\"count\":");
                                if(parts.length > 1) medium = Integer.parseInt(parts[1].split("}")[0]);
                                
                                parts = body.split("\"difficulty\":\"Hard\",\"count\":");
                                if(parts.length > 1) hard = Integer.parseInt(parts[1].split("}")[0]);
                                
                                link.setTotalSolved(total);
                                link.setEasySolved(easy);
                                link.setMediumSolved(medium);
                                link.setHardSolved(hard);
                                link.setLastSyncedAt(LocalDateTime.now());
                                platformLinkRepository.save(link);
                            } catch (Exception e) {}
                        }
                    }
                } catch (Exception e) {
                    // Ignore errors during background sync
                }
            }
        }
        
        return ResponseEntity.ok(links);
    }

    @PostMapping
    public ResponseEntity<?> linkPlatform(@RequestBody PlatformLinkPayload payload) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("Not authenticated");

        // Check if platform already linked
        Optional<PlatformLink> existing = platformLinkRepository.findByUserAndPlatformName(user, payload.getPlatformName());
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("Platform already linked to this account!");
        }

        PlatformLink link = new PlatformLink(user, payload.getPlatformName(), payload.getUsername(), payload.getProfileUrl());
        
        link.setSynced(true);
        link.setLastSyncedAt(LocalDateTime.now());

        if ("LeetCode".equalsIgnoreCase(payload.getPlatformName())) {
            try {
                String query = "{\"query\":\"query getUserProfile($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count } } } }\",\"variables\":{\"username\":\"" + payload.getUsername() + "\"}}";
                
                java.net.URI uri = java.net.URI.create("https://leetcode.com/graphql");
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                        .uri(uri)
                        .header("Content-Type", "application/json")
                        .header("User-Agent", "Mozilla/5.0")
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(query))
                        .build();
                        
                java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
                
                if (response.statusCode() == 200) {
                    String body = response.body();
                    if (body.contains("\"matchedUser\":null")) {
                        throw new Exception("LeetCode user not found");
                    }
                    if (body.contains("\"acSubmissionNum\"")) {
                        int total = 0, easy = 0, medium = 0, hard = 0;
                        try {
                            String[] parts = body.split("\"difficulty\":\"All\",\"count\":");
                            if(parts.length > 1) total = Integer.parseInt(parts[1].split("}")[0]);
                            
                            parts = body.split("\"difficulty\":\"Easy\",\"count\":");
                            if(parts.length > 1) easy = Integer.parseInt(parts[1].split("}")[0]);
                            
                            parts = body.split("\"difficulty\":\"Medium\",\"count\":");
                            if(parts.length > 1) medium = Integer.parseInt(parts[1].split("}")[0]);
                            
                            parts = body.split("\"difficulty\":\"Hard\",\"count\":");
                            if(parts.length > 1) hard = Integer.parseInt(parts[1].split("}")[0]);
                        } catch (Exception e) {}
                        
                        link.setTotalSolved(total);
                        link.setEasySolved(easy);
                        link.setMediumSolved(medium);
                        link.setHardSolved(hard);
                    } else {
                        throw new Exception("Could not fetch data");
                    }
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Could not fetch LeetCode data. Check username.");
            }
        } else {
            // Mock syncing data for MVP for other platforms
            link.setTotalSolved((int) (Math.random() * 200) + 50);
            link.setEasySolved((int) (link.getTotalSolved() * 0.5));
            link.setMediumSolved((int) (link.getTotalSolved() * 0.3));
            link.setHardSolved(link.getTotalSolved() - link.getEasySolved() - link.getMediumSolved());
        }

        platformLinkRepository.save(link);
        return ResponseEntity.ok(link);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> removePlatform(@PathVariable Long id) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("Not authenticated");

        Optional<PlatformLink> linkOp = platformLinkRepository.findById(id);
        if (linkOp.isPresent()) {
            if (!linkOp.get().getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body("Not authorized");
            }
            platformLinkRepository.deleteById(id);
            return ResponseEntity.ok("Platform link removed successfully");
        }
        return ResponseEntity.notFound().build();
    }
}

class PlatformLinkPayload {
    private String platformName;
    private String username;
    private String profileUrl;

    public String getPlatformName() { return platformName; }
    public void setPlatformName(String platformName) { this.platformName = platformName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getProfileUrl() { return profileUrl; }
    public void setProfileUrl(String profileUrl) { this.profileUrl = profileUrl; }
}
