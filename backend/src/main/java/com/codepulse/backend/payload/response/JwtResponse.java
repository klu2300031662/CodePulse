package com.codepulse.backend.payload.response;

import lombok.Data;

@Data
public class JwtResponse {
  private String token;
  private String type = "Bearer";
  private Long id;
  private String username;
  private String email;
  private String name;

  public JwtResponse(String accessToken, Long id, String username, String email) {
    this.token = accessToken;
    this.id = id;
    this.username = username;
    this.email = email;
  }

  public JwtResponse(String accessToken, Long id, String username, String email, String name) {
    this.token = accessToken;
    this.id = id;
    this.username = username;
    this.email = email;
    this.name = name;
  }
}
