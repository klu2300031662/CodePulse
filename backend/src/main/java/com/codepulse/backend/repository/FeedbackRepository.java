package com.codepulse.backend.repository;

import com.codepulse.backend.models.Feedback;
import com.codepulse.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUserOrderByCreatedAtDesc(User user);
    
    List<Feedback> findAllByOrderByCreatedAtDesc();

    boolean existsByUserAndMessage(User user, String message);
}
