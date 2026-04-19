package com.codepulse.backend.repository;

import com.codepulse.backend.models.Problem;
import com.codepulse.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    
    List<Problem> findByUser(User user);
    
    List<Problem> findByUserOrderByDateSolvedDesc(User user);
    
    long countByUser(User user);

    long countByUserAndDifficultyIgnoreCase(User user, String difficulty);
    
    @Query("SELECT p.platform AS platform, COUNT(p) AS count FROM Problem p WHERE p.user = :user GROUP BY p.platform")
    List<Map<String, Object>> countProblemsByPlatform(User user);
    
    @Query("SELECT p.dateSolved AS date, COUNT(p) AS count FROM Problem p WHERE p.user = :user GROUP BY p.dateSolved ORDER BY p.dateSolved")
    List<Map<String, Object>> getProblemActivityHeatmap(User user);
    
    @Query("SELECT DISTINCT p.dateSolved FROM Problem p WHERE p.user = :user ORDER BY p.dateSolved DESC")
    List<LocalDate> findDistinctSolvedDatesDesc(User user);
}
