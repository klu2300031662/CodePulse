package com.codepulse.backend.controllers;

import com.codepulse.backend.exception.BadRequestException;
import com.codepulse.backend.exception.UnauthorizedException;
import com.codepulse.backend.models.Feedback;
import com.codepulse.backend.models.User;
import com.codepulse.backend.repository.FeedbackRepository;
import com.codepulse.backend.repository.UserRepository;
import com.codepulse.backend.security.services.EmailService;
import com.codepulse.backend.security.services.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private static final Logger logger = LoggerFactory.getLogger(FeedbackController.class);

    private static final List<String> VALID_CATEGORIES = Arrays.asList(
            "bug", "feature", "improvement", "general"
    );

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

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

    // ── POST /api/feedback — Submit feedback ──
    @PostMapping
    public ResponseEntity<?> submitFeedback(@RequestBody FeedbackPayload payload) {
        User user = getCurrentUser();

        // Validate category
        if (payload.getCategory() == null || !VALID_CATEGORIES.contains(payload.getCategory().toLowerCase())) {
            throw new BadRequestException("Invalid category. Must be one of: " + String.join(", ", VALID_CATEGORIES));
        }

        // Validate rating
        if (payload.getRating() == null || payload.getRating() < 1 || payload.getRating() > 5) {
            throw new BadRequestException("Rating must be between 1 and 5.");
        }

        // Validate message
        if (payload.getMessage() == null || payload.getMessage().trim().isEmpty()) {
            throw new BadRequestException("Feedback message cannot be empty.");
        }
        if (payload.getMessage().length() > 500) {
            throw new BadRequestException("Feedback message cannot exceed 500 characters.");
        }

        // Check for duplicate feedback (same user, same exact message)
        if (feedbackRepository.existsByUserAndMessage(user, payload.getMessage().trim())) {
            throw new BadRequestException("You have already submitted this exact feedback. Please share something new!");
        }

        Feedback feedback = new Feedback(
                user,
                payload.getCategory().toLowerCase(),
                payload.getRating(),
                payload.getMessage().trim()
        );

        feedbackRepository.save(feedback);
        logger.info("Feedback submitted by user '{}': category={}, rating={}",
                user.getUsername(), payload.getCategory(), payload.getRating());

        // Send email notification to admin asynchronously to prevent blocking the response
        final String senderName = user.getName();
        final String senderUsername = user.getUsername();
        final String senderEmail = user.getEmail();
        final String feedbackCategory = payload.getCategory();
        final Integer feedbackRating = payload.getRating();
        final String feedbackMessage = payload.getMessage();

        new Thread(() -> {
            try {
                emailService.sendFeedbackEmail(
                        senderName,
                        senderUsername,
                        senderEmail,
                        feedbackCategory,
                        feedbackRating,
                        feedbackMessage
                );
            } catch (Exception e) {
                logger.error("Error sending feedback email to admin: {}", e.getMessage(), e);
            }
        }).start();

        return ResponseEntity.ok(Map.of(
                "message", "Thank you for your feedback!",
                "feedbackId", feedback.getId()
        ));
    }

    // ── GET /api/feedback — Get current user's feedback history ──
    @GetMapping
    public ResponseEntity<?> getMyFeedback() {
        User user = getCurrentUser();
        List<Feedback> feedbacks = feedbackRepository.findByUserOrderByCreatedAtDesc(user);
        return ResponseEntity.ok(feedbacks);
    }
}

class FeedbackPayload {
    private String category;
    private Integer rating;
    private String message;

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
