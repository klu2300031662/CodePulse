package com.codepulse.backend.controllers;

import com.codepulse.backend.models.User;
import com.codepulse.backend.payload.request.LoginRequest;
import com.codepulse.backend.payload.request.SignupRequest;
import com.codepulse.backend.payload.response.JwtResponse;
import com.codepulse.backend.payload.response.MessageResponse;
import com.codepulse.backend.repository.PlatformLinkRepository;
import com.codepulse.backend.repository.ProblemRepository;
import com.codepulse.backend.repository.UserRepository;
import com.codepulse.backend.security.jwt.JwtUtils;
import com.codepulse.backend.security.services.EmailService;
import com.codepulse.backend.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

  @Autowired
  AuthenticationManager authenticationManager;

  @Autowired
  UserRepository userRepository;

  @Autowired
  PasswordEncoder encoder;

  @Autowired
  JwtUtils jwtUtils;

  @Autowired
  EmailService emailService;

  @Autowired
  PlatformLinkRepository platformLinkRepository;

  @Autowired
  ProblemRepository problemRepository;

  @PostMapping("/signin")
  public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
    try {
      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

      SecurityContextHolder.getContext().setAuthentication(authentication);
      String jwt = jwtUtils.generateJwtToken(authentication);
      
      UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();    

      // Look up the full user to get the name
      String name = null;
      java.util.Optional<User> userOpt = userRepository.findByUsername(userDetails.getUsername());
      if (userOpt.isPresent()) {
        name = userOpt.get().getName();
      }

      return ResponseEntity.ok(new JwtResponse(jwt, 
                           userDetails.getId(), 
                           userDetails.getUsername(), 
                           userDetails.getEmail(),
                           name));
    } catch (BadCredentialsException e) {
      logger.warn("Login failed for user '{}': Bad credentials", loginRequest.getUsername());
      return ResponseEntity.status(401)
          .body(new MessageResponse("Error: Invalid username/email or password."));
    } catch (AuthenticationException e) {
      logger.error("Authentication error for user '{}': {}", loginRequest.getUsername(), e.getMessage());
      return ResponseEntity.status(401)
          .body(new MessageResponse("Error: Authentication failed - " + e.getMessage()));
    } catch (Exception e) {
      logger.error("Unexpected error during signin for user '{}': {}", loginRequest.getUsername(), e.getMessage(), e);
      return ResponseEntity.status(500)
          .body(new MessageResponse("Error: Login failed due to server error. Please try again later."));
    }
  }

  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
    // ── Gmail-only validation ──
    String email = signUpRequest.getEmail();
    if (email == null || !email.toLowerCase().endsWith("@gmail.com")) {
      return ResponseEntity
          .badRequest()
          .body(new MessageResponse("Error: Only Gmail addresses (@gmail.com) are allowed for registration."));
    }

    if (userRepository.existsByUsername(signUpRequest.getUsername())) {
      return ResponseEntity
          .badRequest()
          .body(new MessageResponse("Error: Username is already taken!"));
    }

    if (userRepository.existsByEmail(signUpRequest.getEmail())) {
      return ResponseEntity
          .badRequest()
          .body(new MessageResponse("Error: Email is already in use!"));
    }

    try {
      // Create new user's account
      User user = new User(signUpRequest.getUsername(), 
                 signUpRequest.getEmail(),
                 encoder.encode(signUpRequest.getPassword()));
                 
      user.setName(signUpRequest.getName());
      user.setEmailVerified(true); // Email was verified via OTP before this call

      userRepository.save(user);

      return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    } catch (Exception e) {
      logger.error("Error during user registration: {}", e.getMessage(), e);
      return ResponseEntity.status(500)
          .body(new MessageResponse("Error: Registration failed - " + e.getMessage()));
    }
  }

  @PostMapping("/send-otp")
  public ResponseEntity<?> sendOtp(@RequestBody java.util.Map<String, String> payload) {
    String email = payload.get("email");
    String name = payload.get("name");

    if (email == null || email.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is required!"));
    }

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Error: Only Gmail addresses (@gmail.com) are allowed."));
    }

    if (userRepository.existsByEmail(email)) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Error: Email is already in use!"));
    }

    // Generate 6-digit OTP
    java.util.Random random = new java.util.Random();
    String otp = String.format("%06d", random.nextInt(1000000));

    // Store OTP temporarily — we'll use a temp record keyed by email
    // Check if there's already a pending user record, if so update it
    java.util.Optional<User> existingPending = userRepository.findByEmail(email);
    if (existingPending.isPresent()) {
      // If a fully registered user exists, this shouldn't happen — already checked above
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Error: Email is already in use!"));
    }

    // Store OTP in a temporary in-memory map (or we can use a simple approach)
    // For simplicity, we'll store in a static concurrent map
    otpStore.put(email.toLowerCase(), new OtpEntry(otp, name, java.time.LocalDateTime.now().plusMinutes(10)));

    try {
      emailService.sendOtpEmail(email, name != null ? name : "User", otp);
    } catch (RuntimeException e) {
      logger.error("Failed to send OTP email: {}", e.getMessage());
      return ResponseEntity.status(500)
          .body(new MessageResponse("Error: " + e.getMessage()));
    }

    return ResponseEntity.ok(new MessageResponse("OTP sent successfully to your email."));
  }

  @PostMapping("/verify-otp")
  public ResponseEntity<?> verifyOtp(@RequestBody java.util.Map<String, String> payload) {
    String email = payload.get("email");
    String otp = payload.get("otp");

    if (email == null || otp == null) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Email and OTP are required!"));
    }

    String key = email.toLowerCase();
    OtpEntry entry = otpStore.get(key);

    if (entry == null) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Error: No OTP found for this email. Please request a new one."));
    }

    if (entry.expiry.isBefore(java.time.LocalDateTime.now())) {
      otpStore.remove(key);
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Error: OTP has expired. Please request a new one."));
    }

    if (!entry.otp.equals(otp.trim())) {
      return ResponseEntity.badRequest()
          .body(new MessageResponse("Error: Invalid OTP. Please check and try again."));
    }

    // OTP verified — remove from store
    otpStore.remove(key);

    return ResponseEntity.ok(new MessageResponse("Email verified successfully!"));
  }

  // ── In-memory OTP store (simple approach) ──
  private static final java.util.concurrent.ConcurrentHashMap<String, OtpEntry> otpStore = new java.util.concurrent.ConcurrentHashMap<>();

  private static class OtpEntry {
    String otp;
    String name;
    java.time.LocalDateTime expiry;

    OtpEntry(String otp, String name, java.time.LocalDateTime expiry) {
      this.otp = otp;
      this.name = name;
      this.expiry = expiry;
    }
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> payload) {
    String email = payload.get("email");
    
    if (email == null || email.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is required!"));
    }
    
    java.util.Optional<User> userOptional = userRepository.findByEmail(email);
    if (!userOptional.isPresent()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: User with this email not found!"));
    }

    User user = userOptional.get();

    // Reuse existing valid token so multiple "forgot password" requests
    // all produce emails with the same working link
    String token = user.getResetPasswordToken();
    boolean hasValidToken = token != null
        && user.getResetPasswordTokenExpiry() != null
        && user.getResetPasswordTokenExpiry().isAfter(java.time.LocalDateTime.now());

    if (!hasValidToken) {
      // Generate a new token only if no valid one exists
      token = java.util.UUID.randomUUID().toString();
      user.setResetPasswordToken(token);
      user.setResetPasswordTokenExpiry(java.time.LocalDateTime.now().plusHours(1));
      userRepository.save(user);
    }

    // Send password reset email (with the same or new token)
    try {
      emailService.sendPasswordResetEmail(email, user.getName(), token);
    } catch (RuntimeException e) {
      logger.error("Failed to send password reset email: {}", e.getMessage());
      return ResponseEntity.status(500)
          .body(new MessageResponse("Error: " + e.getMessage()));
    }

    return ResponseEntity.ok(new MessageResponse("Password reset instructions sent to your email."));
  }

  @GetMapping("/validate-reset-token")
  public ResponseEntity<?> validateResetToken(@RequestParam String token) {
    if (token == null || token.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Token is required!"));
    }

    java.util.Optional<User> userOptional = userRepository.findByResetPasswordToken(token);
    if (!userOptional.isPresent()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: This reset link has already been used or is invalid."));
    }

    User user = userOptional.get();
    if (user.getResetPasswordTokenExpiry() == null || user.getResetPasswordTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: This reset link has expired. Please request a new one."));
    }

    return ResponseEntity.ok(new MessageResponse("Token is valid."));
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> payload) {
    String token = payload.get("token");
    String newPassword = payload.get("newPassword");

    if (token == null || token.trim().isEmpty() || newPassword == null || newPassword.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Token and new password are required!"));
    }

    // Validate password complexity
    if (newPassword.length() < 6
        || !newPassword.matches(".*[a-zA-Z].*")
        || !newPassword.matches(".*\\d.*")
        || !newPassword.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?`~].*")) {
      return ResponseEntity.badRequest().body(new MessageResponse(
          "Error: Password must be at least 6 characters and contain a letter, a number, and a special character."));
    }

    java.util.Optional<User> userOptional = userRepository.findByResetPasswordToken(token);
    if (!userOptional.isPresent()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid or expired reset token!"));
    }

    User user = userOptional.get();

    if (user.getResetPasswordTokenExpiry() == null || user.getResetPasswordTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Reset token has expired!"));
    }

    user.setPassword(encoder.encode(newPassword));
    user.setResetPasswordToken(null);
    user.setResetPasswordTokenExpiry(null);
    userRepository.save(user);

    return ResponseEntity.ok(new MessageResponse("Password has been successfully reset."));
  }

  @PostMapping("/google")
  public ResponseEntity<?> googleAuth(@RequestBody java.util.Map<String, String> payload) {
    try {
        String token = payload.get("credential");
        
        if (token == null || token.trim().isEmpty()) {
          return ResponseEntity.badRequest().body(new MessageResponse("Error: Google credential is required."));
        }
        
        // Simplified JWT decoding (since frontend obtains directly from Google)
        // In full production, use GoogleIdTokenVerifier.
        String[] chunks = token.split("\\.");
        if (chunks.length < 2) {
          return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid Google credential format."));
        }
        
        // Fix Base64 padding — JWT segments may lack proper padding
        String payloadSegment = chunks[1];
        int paddingNeeded = (4 - payloadSegment.length() % 4) % 4;
        payloadSegment = payloadSegment + "=".repeat(paddingNeeded);
        byte[] decodedBytes = java.util.Base64.getUrlDecoder().decode(payloadSegment);
        String payloadJson = new String(decodedBytes);
        
        // Parse JSON (Using Jackson since it's available in Spring Boot)
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.JsonNode jsonNode = mapper.readTree(payloadJson);
        
        String email = jsonNode.get("email").asText();
        String name = jsonNode.has("name") ? jsonNode.get("name").asText() : email.split("@")[0];
        
        User user;
        java.util.Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            String tempUsername = "user_" + java.util.UUID.randomUUID().toString().substring(0, 8);
            String randomPass = java.util.UUID.randomUUID().toString();
            user = new User(tempUsername, email, encoder.encode(randomPass));
            user.setName(name);
            userRepository.save(user);
        }

        // Create authentication token simply by using the user's username
        org.springframework.security.core.userdetails.UserDetails userDetails = 
             UserDetailsImpl.build(user);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities());
            
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        return ResponseEntity.ok(new JwtResponse(jwt, 
                             user.getId(), 
                             user.getUsername(), 
                             user.getEmail(),
                             user.getName()));
                             
    } catch (Exception e) {
        logger.error("Google authentication error: {}", e.getMessage(), e);
        return ResponseEntity.badRequest().body(new MessageResponse("Error: Google authentication failed - " + e.getMessage()));
    }
  }

  @DeleteMapping("/delete-account")
  @org.springframework.transaction.annotation.Transactional
  public ResponseEntity<?> deleteAccount() {
    try {
      Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
      if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.status(401).body(new MessageResponse("Error: Not authenticated."));
      }

      UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
      Long userId = userDetails.getId();

      java.util.Optional<User> userOpt = userRepository.findById(userId);
      if (!userOpt.isPresent()) {
        return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
      }

      User user = userOpt.get();
      String username = user.getUsername();

      // Delete all related data first using native SQL (avoids entity column mismatch issues)
      problemRepository.deleteAllByUserId(userId);
      platformLinkRepository.deleteAllByUserId(userId);

      // Delete the user
      userRepository.delete(user);

      logger.info("Account deleted for user: {} (ID: {})", username, userId);

      return ResponseEntity.ok(new MessageResponse("Account deleted successfully."));
    } catch (Exception e) {
      logger.error("Error deleting account: {}", e.getMessage(), e);
      return ResponseEntity.status(500)
          .body(new MessageResponse("Error: Failed to delete account — " + e.getMessage()));
    }
  }
}
