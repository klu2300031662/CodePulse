package com.codepulse.backend.controllers;

import com.codepulse.backend.exception.BadRequestException;
import com.codepulse.backend.exception.ForbiddenException;
import com.codepulse.backend.exception.ResourceNotFoundException;
import com.codepulse.backend.exception.UnauthorizedException;
import com.codepulse.backend.models.PlatformLink;
import com.codepulse.backend.models.User;
import com.codepulse.backend.repository.PlatformLinkRepository;
import com.codepulse.backend.repository.UserRepository;
import com.codepulse.backend.security.services.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(PlatformLinkController.class);

    @Autowired
    private PlatformLinkRepository platformLinkRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException();
        }
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetailsImpl)) {
            throw new UnauthorizedException();
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) principal;
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User account not found. Please log in again."));
    }

    @GetMapping
    public ResponseEntity<?> getUserPlatforms() {
        User user = getCurrentUser();

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
                            } catch (Exception e) {
                                logger.warn("Failed to parse LeetCode stats for user '{}': {}", link.getUsername(), e.getMessage());
                            }
                        }
                    }
                } catch (Exception e) {
                    logger.warn("Failed to sync LeetCode data for user '{}': {}", link.getUsername(), e.getMessage());
                }
            }
        }
        
        return ResponseEntity.ok(links);
    }

    @PostMapping
    public ResponseEntity<?> linkPlatform(@RequestBody PlatformLinkPayload payload) {
        User user = getCurrentUser();

        // Check if platform already linked
        Optional<PlatformLink> existing = platformLinkRepository.findByUserAndPlatformName(user, payload.getPlatformName());
        if (existing.isPresent()) {
            throw new BadRequestException("Platform '" + payload.getPlatformName() + "' is already linked to your account.");
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
                        throw new BadRequestException("LeetCode username '" + payload.getUsername() + "' not found. Please check and try again.");
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
                        } catch (Exception e) {
                            logger.warn("Failed to parse LeetCode stats for user '{}': {}", payload.getUsername(), e.getMessage());
                        }
                        
                        link.setTotalSolved(total);
                        link.setEasySolved(easy);
                        link.setMediumSolved(medium);
                        link.setHardSolved(hard);
                    } else {
                        throw new BadRequestException("Could not fetch LeetCode data. The API may be temporarily unavailable.");
                    }
                }
            } catch (BadRequestException e) {
                throw e; // Re-throw our custom exception
            } catch (Exception e) {
                logger.error("Error fetching LeetCode data for '{}': {}", payload.getUsername(), e.getMessage());
                throw new BadRequestException("Could not connect to LeetCode. Please check the username and try again.");
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

        PlatformLink link = platformLinkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Platform link", "id", id));

        if (!link.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to remove this platform link.");
        }

        platformLinkRepository.deleteById(id);
        return ResponseEntity.ok("Platform link removed successfully");
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
