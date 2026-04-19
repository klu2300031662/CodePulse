package com.codepulse.backend.controllers;

import com.codepulse.backend.models.User;
import com.codepulse.backend.models.PlatformLink;
import com.codepulse.backend.repository.ProblemRepository;
import com.codepulse.backend.repository.PlatformLinkRepository;
import com.codepulse.backend.repository.UserRepository;
import com.codepulse.backend.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlatformLinkRepository platformLinkRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return null;
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<User> user = userRepository.findByUsername(userDetails.getUsername());
        return user.orElse(null);
    }

    @GetMapping("/overview")
    public ResponseEntity<?> getOverviewStats() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("User not authenticated");

        long totalSolved = problemRepository.countByUser(user);
        long easyCount = problemRepository.countByUserAndDifficultyIgnoreCase(user, "Easy");
        long mediumCount = problemRepository.countByUserAndDifficultyIgnoreCase(user, "Medium");
        long hardCount = problemRepository.countByUserAndDifficultyIgnoreCase(user, "Hard");

        List<PlatformLink> platformLinks = platformLinkRepository.findByUser(user);
        for (PlatformLink link : platformLinks) {
            totalSolved += (link.getTotalSolved() == null ? 0 : link.getTotalSolved());
            easyCount += (link.getEasySolved() == null ? 0 : link.getEasySolved());
            mediumCount += (link.getMediumSolved() == null ? 0 : link.getMediumSolved());
            hardCount += (link.getHardSolved() == null ? 0 : link.getHardSolved());
        }

        // Calculate Streak
        List<LocalDate> sortedDates = problemRepository.findDistinctSolvedDatesDesc(user);
        int currentStreak = 0;
        int longestStreak = 0;
        int tempStreak = 0;
        LocalDate prevDate = null;

        for (int i = 0; i < sortedDates.size(); i++) {
            LocalDate date = sortedDates.get(i);
            
            if (prevDate == null) {
                tempStreak = 1;
            } else {
                long daysBetween = ChronoUnit.DAYS.between(date, prevDate);
                if (daysBetween == 1) {
                    tempStreak++;
                } else if (daysBetween > 1) {
                    if (tempStreak > longestStreak) longestStreak = tempStreak;
                    tempStreak = 1;
                }
            }
            prevDate = date;
            
            // Check if current streak extends to today or yesterday
            if (i == 0 && (date.equals(LocalDate.now()) || date.equals(LocalDate.now().minusDays(1)))) {
                // Keep counting current streak
            } else if (i == 0) {
                 // First date is too long ago, no current streak
            }
        }
        
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        
        // Finalize current streak based on top dates
        if (sortedDates.isEmpty() || 
            (!sortedDates.get(0).equals(LocalDate.now()) && !sortedDates.get(0).equals(LocalDate.now().minusDays(1)))) {
            currentStreak = 0;
        } else {
            // Count backwards from 0
            currentStreak = 1;
            for(int i = 1; i < sortedDates.size(); i++){
                if(ChronoUnit.DAYS.between(sortedDates.get(i), sortedDates.get(i-1)) == 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSolved", totalSolved);
        stats.put("easy", easyCount);
        stats.put("medium", mediumCount);
        stats.put("hard", hardCount);
        stats.put("currentStreak", currentStreak);
        stats.put("longestStreak", Math.max(longestStreak, currentStreak));

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/platforms")
    public ResponseEntity<?> getPlatformDistrib() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("User not authenticated");
        
        List<Map<String, Object>> platformStats = problemRepository.countProblemsByPlatform(user);
        
        Map<String, Long> mergedStats = new HashMap<>();
        for (Map<String, Object> stat : platformStats) {
            String platform = (String) stat.get("platform");
            Long count = ((Number) stat.get("count")).longValue();
            mergedStats.put(platform, count);
        }
        
        List<PlatformLink> platformLinks = platformLinkRepository.findByUser(user);
        for (PlatformLink link : platformLinks) {
            if (link.getTotalSolved() != null && link.getTotalSolved() > 0) {
                String platformName = link.getPlatformName();
                mergedStats.put(platformName, mergedStats.getOrDefault(platformName, 0L) + link.getTotalSolved());
            }
        }
        
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Map.Entry<String, Long> entry : mergedStats.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("platform", entry.getKey());
            map.put("count", entry.getValue());
            result.add(map);
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/heatmap")
    public ResponseEntity<?> getHeatmap() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("User not authenticated");

        List<Map<String, Object>> heatmapData = problemRepository.getProblemActivityHeatmap(user);
        return ResponseEntity.ok(heatmapData);
    }
}
