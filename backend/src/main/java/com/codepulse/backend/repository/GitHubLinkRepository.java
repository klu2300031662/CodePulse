package com.codepulse.backend.repository;

import com.codepulse.backend.models.GitHubLink;
import com.codepulse.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GitHubLinkRepository extends JpaRepository<GitHubLink, Long> {
    Optional<GitHubLink> findByUser(User user);

    @Modifying
    @Query(value = "DELETE FROM github_links WHERE user_id = :userId", nativeQuery = true)
    void deleteByUserId(Long userId);
}
