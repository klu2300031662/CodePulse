package com.codepulse.backend.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "platform_links")
@Data
@NoArgsConstructor
public class PlatformLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String platformName; // "LeetCode", "HackerRank", "Codeforces", "GeeksForGeeks"

    @Column(nullable = false)
    private String username;

    private String profileUrl;

    private boolean isSynced = false;
    private LocalDateTime lastSyncedAt;
    
    // Cached stats from platform
    private Integer totalSolved = 0;
    private Integer easySolved = 0;
    private Integer mediumSolved = 0;
    private Integer hardSolved = 0;

    public PlatformLink(User user, String platformName, String username, String profileUrl) {
        this.user = user;
        this.platformName = platformName;
        this.username = username;
        this.profileUrl = profileUrl;
    }
}
