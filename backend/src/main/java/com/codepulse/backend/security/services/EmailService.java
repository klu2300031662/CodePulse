package com.codepulse.backend.security.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${brevo.api.key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

    @Value("${mail.from:${MAIL_FROM:noreply@codepulse.app}}")
    private String fromEmail;

    @Value("${mail.from.name:CodePulse}")
    private String fromName;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Send a password reset email via Brevo HTTP API.
     * This uses HTTPS (port 443) which works on ALL hosting platforms
     * including Render free tier (unlike SMTP ports 465/587 which are blocked).
     */
    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        String displayName = (userName != null && !userName.isBlank()) ? userName : "User";

        String htmlContent = buildEmailTemplate(displayName, resetLink);

        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            logger.error("BREVO_API_KEY is not configured! Cannot send email.");
            throw new RuntimeException("Email service is not configured. Please set BREVO_API_KEY environment variable.");
        }

        try {
            String cleanApiKey = brevoApiKey.trim().replaceAll("[\\r\\n\\t]", "");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", cleanApiKey);

            // Brevo Send Transactional Email API
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("sender", Map.of("name", fromName, "email", fromEmail));
            body.put("to", List.of(Map.of("email", toEmail, "name", displayName)));
            body.put("subject", "CodePulse - Reset Your Password");
            body.put("htmlContent", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            logger.info("Sending password reset email to {} via Brevo API", toEmail);

            ResponseEntity<String> response = restTemplate.exchange(
                "https://api.brevo.com/v3/smtp/email",
                HttpMethod.POST,
                request,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Password reset email sent successfully to: {} — response: {}", toEmail, response.getBody());
            } else {
                logger.error("Brevo API returned non-2xx: {} — {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Email service returned status " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("Failed to send email to {}: {} — {}", toEmail, e.getClass().getSimpleName(), e.getMessage(), e);
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage());
        }
    }

    private String buildEmailTemplate(String userName, String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0; padding:0; background-color:#f4f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f8; padding:40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #7c3aed, #3b82f6); padding:32px 40px; text-align:center;">
                          <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">
                            &lt;/&gt; CodePulse
                          </h1>
                          <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:13px;">
                            Track, Analyze &amp; Master Your Coding Journey
                          </p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:36px 40px 24px;">
                          <h2 style="margin:0 0 8px; color:#1a1a2e; font-size:20px; font-weight:600;">
                            Password Reset Request
                          </h2>
                          <p style="margin:0 0 20px; color:#64748b; font-size:14px; line-height:1.6;">
                            Hi <strong style="color:#334155;">%s</strong>, we received a request to reset the password for your CodePulse account.
                          </p>

                          <!-- CTA Button -->
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding:8px 0 24px;">
                                <a href="%s"
                                   style="display:inline-block; background:linear-gradient(135deg, #7c3aed, #3b82f6); color:#ffffff; text-decoration:none; padding:14px 36px; border-radius:10px; font-size:15px; font-weight:600; letter-spacing:0.3px; box-shadow:0 4px 14px rgba(124,58,237,0.3);">
                                  Reset My Password
                                </a>
                              </td>
                            </tr>
                          </table>

                          <p style="margin:0 0 16px; color:#94a3b8; font-size:12px; line-height:1.5;">
                            This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
                          </p>

                          <!-- Fallback link -->
                          <div style="background-color:#f8fafc; border-radius:8px; padding:14px 16px; border:1px solid #e2e8f0;">
                            <p style="margin:0 0 6px; color:#64748b; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                              Or copy this link:
                            </p>
                            <p style="margin:0; color:#7c3aed; font-size:12px; word-break:break-all; line-height:1.4;">
                              %s
                            </p>
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding:20px 40px 28px; border-top:1px solid #f1f5f9; text-align:center;">
                          <p style="margin:0; color:#94a3b8; font-size:11px;">
                            &copy; 2026 CodePulse. Built for developers, by developers.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(userName, resetLink, resetLink);
    }
}
