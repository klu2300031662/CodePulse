package com.codepulse.backend.controllers;

import com.codepulse.backend.models.Problem;
import com.codepulse.backend.models.User;
import com.codepulse.backend.repository.ProblemRepository;
import com.codepulse.backend.repository.UserRepository;
import com.codepulse.backend.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return null;
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetailsImpl)) return null;
        UserDetailsImpl userDetails = (UserDetailsImpl) principal;
        return userRepository.findByUsername(userDetails.getUsername()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getAllProblems() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("Not authenticated");

        List<Problem> problems = problemRepository.findByUserOrderByDateSolvedDesc(user);
        return ResponseEntity.ok(problems);
    }

    @PostMapping
    public ResponseEntity<?> addProblem(@RequestBody ProblemPayload payload) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("Not authenticated");

        Problem problem = new Problem(user, payload.getTitle(), payload.getPlatform(), payload.getDifficulty(), payload.getStatus(), payload.getDateSolved() != null ? payload.getDateSolved() : LocalDate.now());
        problem.setUrl(payload.getUrl());
        problem.setNotes(payload.getNotes());
        problem.setTags(payload.getTags());
        
        problemRepository.save(problem);
        return ResponseEntity.ok(problem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProblem(@PathVariable Long id, @RequestBody ProblemPayload payload) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("Not authenticated");

        Optional<Problem> problemOp = problemRepository.findById(id);
        if (problemOp.isPresent()) {
            Problem problem = problemOp.get();
            if (!problem.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body("Not authorized");
            }
            problem.setTitle(payload.getTitle());
            problem.setPlatform(payload.getPlatform());
            problem.setDifficulty(payload.getDifficulty());
            problem.setStatus(payload.getStatus());
            problem.setUrl(payload.getUrl());
            problem.setNotes(payload.getNotes());
            problem.setTags(payload.getTags());
            if (payload.getDateSolved() != null) problem.setDateSolved(payload.getDateSolved());
            
            problemRepository.save(problem);
            return ResponseEntity.ok(problem);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProblem(@PathVariable Long id) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.badRequest().body("Not authenticated");

        Optional<Problem> problemOp = problemRepository.findById(id);
        if (problemOp.isPresent()) {
            if (!problemOp.get().getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body("Not authorized");
            }
            problemRepository.deleteById(id);
            return ResponseEntity.ok("Deleted successfully");
        }
        return ResponseEntity.notFound().build();
    }
}

class ProblemPayload {
    private String title;
    private String url;
    private String platform;
    private String difficulty;
    private String status;
    private String notes;
    private String tags;
    private LocalDate dateSolved;
    
    // Getters
    public String getTitle() { return title; }
    public String getUrl() { return url; }
    public String getPlatform() { return platform; }
    public String getDifficulty() { return difficulty; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public String getTags() { return tags; }
    public LocalDate getDateSolved() { return dateSolved; }
    
    // Setters
    public void setTitle(String t) { title = t; }
    public void setUrl(String u) { url = u; }
    public void setPlatform(String p) { platform = p; }
    public void setDifficulty(String d) { difficulty = d; }
    public void setStatus(String s) { status = s; }
    public void setNotes(String n) { notes = n; }
    public void setTags(String ts) { tags = ts; }
    public void setDateSolved(LocalDate dt) { dateSolved = dt; }
}
