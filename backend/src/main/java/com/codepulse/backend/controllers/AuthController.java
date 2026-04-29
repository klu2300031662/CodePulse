package com.codepulse.backend.controllers;

import com.codepulse.backend.models.User;
import com.codepulse.backend.payload.request.LoginRequest;
import com.codepulse.backend.payload.request.SignupRequest;
import com.codepulse.backend.payload.response.JwtResponse;
import com.codepulse.backend.payload.response.MessageResponse;
import com.codepulse.backend.repository.UserRepository;
import com.codepulse.backend.security.jwt.JwtUtils;
import com.codepulse.backend.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
  @Autowired
  AuthenticationManager authenticationManager;

  @Autowired
  UserRepository userRepository;

  @Autowired
  PasswordEncoder encoder;

  @Autowired
  JwtUtils jwtUtils;

  @PostMapping("/signin")
  public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

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
  }

  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
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

    // Create new user's account
    User user = new User(signUpRequest.getUsername(), 
               signUpRequest.getEmail(),
               encoder.encode(signUpRequest.getPassword()));
               
    user.setName(signUpRequest.getName());

    userRepository.save(user);

    return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> payload) {
    String email = payload.get("email");
    
    if (email == null || email.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is required!"));
    }
    
    java.util.Optional<com.codepulse.backend.models.User> userOptional = userRepository.findByEmail(email);
    if (!userOptional.isPresent()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: User with this email not found!"));
    }

    com.codepulse.backend.models.User user = userOptional.get();
    String token = java.util.UUID.randomUUID().toString();
    user.setResetPasswordToken(token);
    user.setResetPasswordTokenExpiry(java.time.LocalDateTime.now().plusHours(1));
    userRepository.save(user);

    System.out.println("=================================================");
    System.out.println("SIMULATED EMAIL SENT TO: " + email);
    System.out.println("Reset Password Link:");
    String frontendUrl = System.getenv("FRONTEND_URL") != null ? System.getenv("FRONTEND_URL") : "http://localhost:3000";
    System.out.println(frontendUrl + "/reset-password?token=" + token);
    System.out.println("=================================================");

    java.util.Map<String, String> response = new java.util.HashMap<>();
    response.put("message", "Password reset instructions sent to your email.");
    response.put("resetToken", token); // for demo purpose

    return ResponseEntity.ok(response);
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> payload) {
    String token = payload.get("token");
    String newPassword = payload.get("newPassword");

    if (token == null || token.trim().isEmpty() || newPassword == null || newPassword.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Token and new password are required!"));
    }

    java.util.Optional<com.codepulse.backend.models.User> userOptional = userRepository.findByResetPasswordToken(token);
    if (!userOptional.isPresent()) {
      return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid or expired reset token!"));
    }

    com.codepulse.backend.models.User user = userOptional.get();

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
        
        // Simplified JWT decoding (since frontend obtains directly from Google)
        // In full production, use GoogleIdTokenVerifier.
        String[] chunks = token.split("\\.");
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
             com.codepulse.backend.security.services.UserDetailsImpl.build(user);

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
        e.printStackTrace();
        return ResponseEntity.badRequest().body(new MessageResponse("Error: Google authentication failed."));
    }
  }
}
