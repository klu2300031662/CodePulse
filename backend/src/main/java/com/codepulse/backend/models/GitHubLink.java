package com.codepulse.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "github_links")
@Data
@NoArgsConstructor
public class GitHubLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @Column(nullable = false)
    private String githubUsername;

    @Column(name = "linked_at")
    private LocalDateTime linkedAt = LocalDateTime.now();

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    public GitHubLink(User user, String githubUsername) {
        this.user = user;
        this.githubUsername = githubUsername;
        this.linkedAt = LocalDateTime.now();
    }
}
