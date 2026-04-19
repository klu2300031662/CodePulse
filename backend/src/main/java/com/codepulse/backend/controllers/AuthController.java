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

    return ResponseEntity.ok(new JwtResponse(jwt, 
                         userDetails.getId(), 
                         userDetails.getUsername(), 
                         userDetails.getEmail()));
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
    System.out.println("http://localhost:3000/reset-password?token=" + token);
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

  @PostMapping("/google-demo")
  public ResponseEntity<?> googleDemo() {
    String mockEmail = "demo.google." + java.util.UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    String mockUsername = "GoogleDemoUser_" + java.util.UUID.randomUUID().toString().substring(0, 5);
    String mockPassword = "GoogleDemoPassword!123";

    User user = new User(mockUsername, mockEmail, encoder.encode(mockPassword));
    user.setName("Demo User");
    userRepository.save(user);

    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(mockUsername, mockPassword));

    SecurityContextHolder.getContext().setAuthentication(authentication);
    String jwt = jwtUtils.generateJwtToken(authentication);
    
    UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();    

    return ResponseEntity.ok(new JwtResponse(jwt, 
                         userDetails.getId(), 
                         userDetails.getUsername(), 
                         userDetails.getEmail()));
  }
}
