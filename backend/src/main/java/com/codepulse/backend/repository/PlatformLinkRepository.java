package com.codepulse.backend.repository;

import com.codepulse.backend.models.PlatformLink;
import com.codepulse.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformLinkRepository extends JpaRepository<PlatformLink, Long> {
    List<PlatformLink> findByUser(User user);
    Optional<PlatformLink> findByUserAndPlatformName(User user, String platformName);

    @Modifying
    @Query(value = "DELETE FROM platform_links WHERE user_id = :userId", nativeQuery = true)
    void deleteAllByUserId(Long userId);
}
