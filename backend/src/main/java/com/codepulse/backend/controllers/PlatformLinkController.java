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
import com.codepulse.backend.service.PlatformStatsService;
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

    @Autowired
    private PlatformStatsService platformStatsService;

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

    // ── GET /api/platforms — List all linked platforms with live sync ──
    @GetMapping
    public ResponseEntity<?> getUserPlatforms() {
        User user = getCurrentUser();
        List<PlatformLink> links = platformLinkRepository.findByUser(user);

        // Auto-sync all platforms that haven't been synced in 5+ minutes
        for (PlatformLink link : links) {
            boolean shouldSync = link.getLastSyncedAt() == null ||
                    link.getLastSyncedAt().isBefore(LocalDateTime.now().minusMinutes(5));

            if (shouldSync) {
                syncPlatformData(link);
            }
        }

        return ResponseEntity.ok(links);
    }

    // ── POST /api/platforms — Link a new platform ──
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

        // Fetch real stats from the platform
        PlatformStatsService.PlatformStats stats = platformStatsService.fetchStats(
                payload.getPlatformName(), payload.getUsername()
        );

        if (stats.error != null && "LeetCode".equalsIgnoreCase(payload.getPlatformName())) {
            // Only block linking if LeetCode username is definitely invalid
            if (stats.error.contains("not found")) {
                throw new BadRequestException("LeetCode username '" + payload.getUsername() + "' not found. Please check and try again.");
            }
        }

        if (stats.notPublic) {
            // HackerRank/InterviewBit — set zeros, mark as synced
            link.setTotalSolved(0);
            link.setEasySolved(0);
            link.setMediumSolved(0);
            link.setHardSolved(0);
        } else if (stats.error == null) {
            // Successfully fetched real stats
            link.setTotalSolved(stats.totalSolved);
            link.setEasySolved(stats.easySolved);
            link.setMediumSolved(stats.mediumSolved);
            link.setHardSolved(stats.hardSolved);
        } else {
            // API failed — set to 0 initially, user can sync later
            logger.warn("Could not fetch stats for {} user '{}': {}", payload.getPlatformName(), payload.getUsername(), stats.error);
            link.setTotalSolved(0);
            link.setEasySolved(0);
            link.setMediumSolved(0);
            link.setHardSolved(0);
        }

        platformLinkRepository.save(link);
        return ResponseEntity.ok(link);
    }

    // ── PUT /api/platforms/{id}/sync — Manual sync for a single platform ──
    @PutMapping("/{id}/sync")
    public ResponseEntity<?> syncPlatform(@PathVariable Long id) {
        User user = getCurrentUser();

        PlatformLink link = platformLinkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Platform link", "id", id));

        if (!link.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to sync this platform.");
        }

        syncPlatformData(link);
        return ResponseEntity.ok(link);
    }

    // ── DELETE /api/platforms/{id} — Remove a platform ──
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

    // ── Internal: Sync stats from platform API and persist to DB ──
    private void syncPlatformData(PlatformLink link) {
        try {
            PlatformStatsService.PlatformStats stats = platformStatsService.fetchStats(
                    link.getPlatformName(), link.getUsername()
            );

            if (stats.notPublic) {
                // HackerRank/InterviewBit — just update sync timestamp
                link.setLastSyncedAt(LocalDateTime.now());
                link.setSynced(true);
                platformLinkRepository.save(link);
                return;
            }

            if (stats.error == null) {
                link.setTotalSolved(stats.totalSolved);
                link.setEasySolved(stats.easySolved);
                link.setMediumSolved(stats.mediumSolved);
                link.setHardSolved(stats.hardSolved);
                link.setLastSyncedAt(LocalDateTime.now());
                link.setSynced(true);
                platformLinkRepository.save(link);
                logger.info("Synced {} for '{}': {} total solved",
                        link.getPlatformName(), link.getUsername(), stats.totalSolved);
            } else {
                logger.warn("Sync failed for {} user '{}': {}",
                        link.getPlatformName(), link.getUsername(), stats.error);
                // Don't update stats if sync failed — keep old values
            }
        } catch (Exception e) {
            logger.error("Error syncing {} for '{}': {}",
                    link.getPlatformName(), link.getUsername(), e.getMessage());
        }
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
