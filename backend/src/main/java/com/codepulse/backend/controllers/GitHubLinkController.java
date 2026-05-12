package com.codepulse.backend.controllers;

import com.codepulse.backend.exception.BadRequestException;
import com.codepulse.backend.exception.UnauthorizedException;
import com.codepulse.backend.models.GitHubLink;
import com.codepulse.backend.models.User;
import com.codepulse.backend.repository.GitHubLinkRepository;
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
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/github")
public class GitHubLinkController {

    private static final Logger logger = LoggerFactory.getLogger(GitHubLinkController.class);

    @Autowired
    private GitHubLinkRepository gitHubLinkRepository;

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

    // ── GET /api/github — Get linked GitHub username (if any) ──
    @GetMapping
    public ResponseEntity<?> getGitHubLink() {
        User user = getCurrentUser();
        Optional<GitHubLink> link = gitHubLinkRepository.findByUser(user);

        if (link.isPresent()) {
            return ResponseEntity.ok(Map.of(
                    "linked", true,
                    "githubUsername", link.get().getGithubUsername(),
                    "linkedAt", link.get().getLinkedAt().toString(),
                    "lastSyncedAt", link.get().getLastSyncedAt() != null ? link.get().getLastSyncedAt().toString() : ""
            ));
        }

        return ResponseEntity.ok(Map.of("linked", false));
    }

    // ── POST /api/github — Link a GitHub account ──
    @PostMapping
    public ResponseEntity<?> linkGitHub(@RequestBody Map<String, String> payload) {
        User user = getCurrentUser();
        String githubUsername = payload.get("githubUsername");

        if (githubUsername == null || githubUsername.trim().isEmpty()) {
            throw new BadRequestException("GitHub username is required.");
        }

        githubUsername = githubUsername.trim();

        // Check if already linked — update the username if so
        Optional<GitHubLink> existing = gitHubLinkRepository.findByUser(user);
        if (existing.isPresent()) {
            GitHubLink link = existing.get();
            link.setGithubUsername(githubUsername);
            link.setLastSyncedAt(LocalDateTime.now());
            gitHubLinkRepository.save(link);
            logger.info("Updated GitHub link for user '{}': {}", user.getUsername(), githubUsername);
            return ResponseEntity.ok(Map.of(
                    "linked", true,
                    "githubUsername", link.getGithubUsername(),
                    "linkedAt", link.getLinkedAt().toString(),
                    "lastSyncedAt", link.getLastSyncedAt().toString()
            ));
        }

        // Create new link
        GitHubLink link = new GitHubLink(user, githubUsername);
        link.setLastSyncedAt(LocalDateTime.now());
        gitHubLinkRepository.save(link);

        logger.info("Linked GitHub for user '{}': {}", user.getUsername(), githubUsername);

        return ResponseEntity.ok(Map.of(
                "linked", true,
                "githubUsername", link.getGithubUsername(),
                "linkedAt", link.getLinkedAt().toString(),
                "lastSyncedAt", link.getLastSyncedAt().toString()
        ));
    }

    // ── DELETE /api/github — Unlink GitHub account ──
    @DeleteMapping
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> unlinkGitHub() {
        User user = getCurrentUser();
        Optional<GitHubLink> link = gitHubLinkRepository.findByUser(user);

        if (link.isEmpty()) {
            throw new BadRequestException("No GitHub account is linked.");
        }

        gitHubLinkRepository.delete(link.get());
        logger.info("Unlinked GitHub for user '{}'", user.getUsername());

        return ResponseEntity.ok(Map.of("message", "GitHub unlinked successfully."));
    }

    // ── PUT /api/github/sync — Update last synced timestamp ──
    @PutMapping("/sync")
    public ResponseEntity<?> updateSyncTime() {
        User user = getCurrentUser();
        Optional<GitHubLink> linkOpt = gitHubLinkRepository.findByUser(user);

        if (linkOpt.isEmpty()) {
            throw new BadRequestException("No GitHub account is linked.");
        }

        GitHubLink link = linkOpt.get();
        link.setLastSyncedAt(LocalDateTime.now());
        gitHubLinkRepository.save(link);

        return ResponseEntity.ok(Map.of(
                "linked", true,
                "githubUsername", link.getGithubUsername(),
                "lastSyncedAt", link.getLastSyncedAt().toString()
        ));
    }
}
