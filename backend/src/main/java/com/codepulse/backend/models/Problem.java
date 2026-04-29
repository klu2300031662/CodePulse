package com.codepulse.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "problems")
@Data
@NoArgsConstructor
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @NotBlank
    private String title;

    private String url;

    @NotBlank
    private String platform; // LeetCode, Codeforces, HackerRank, Manual, etc.

    @NotBlank
    private String difficulty; // Easy, Medium, Hard

    private String status; // Solved, Attempted

    private LocalDate dateSolved;

    private String notes;
    
    // tags could be stored as comma separated strings or a separate table
    private String tags;
    
    public Problem(User user, String title, String platform, String difficulty, String status, LocalDate dateSolved) {
        this.user = user;
        this.title = title;
        this.platform = platform;
        this.difficulty = difficulty;
        this.status = status;
        this.dateSolved = dateSolved;
    }
}
