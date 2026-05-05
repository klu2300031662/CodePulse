package com.codepulse.backend.security.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

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

    /**
     * Send a password reset email via Brevo HTTP API using raw HttpURLConnection.
     * Uses HTTPS (port 443) — works on ALL hosting platforms.
     */
    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        String displayName = (userName != null && !userName.isBlank()) ? userName : "User";

        // Clean the API key — remove ALL whitespace and control characters
        String cleanKey = brevoApiKey.replaceAll("\\s+", "").trim();

        if (cleanKey.isEmpty()) {
            logger.error("BREVO_API_KEY is not configured!");
            throw new RuntimeException("Email service not configured. Set BREVO_API_KEY on Render.");
        }

        logger.info("Sending password reset email to: {} (key length: {}, starts with: {}...)",
                toEmail, cleanKey.length(), cleanKey.substring(0, Math.min(12, cleanKey.length())));

        String htmlContent = buildEmailTemplate(displayName, resetLink);

        // Unique identifiers to prevent Gmail from threading all resets together
        String uniqueId = java.util.UUID.randomUUID().toString();
        String timestamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, hh:mm a"));

        // Build JSON body manually (no external dependencies needed)
        String jsonBody = String.format("""
            {
              "sender": {"name": "%s", "email": "%s"},
              "to": [{"email": "%s", "name": "%s"}],
              "subject": "Reset Your CodePulse Password — %s",
              "htmlContent": %s,
              "headers": {
                "X-Entity-Ref-ID": "%s",
                "X-Mailer": "CodePulse/%s"
              }
            }
            """,
            escapeJson(fromName),
            escapeJson(fromEmail),
            escapeJson(toEmail),
            escapeJson(displayName),
            timestamp,
            toJsonString(htmlContent),
            uniqueId,
            uniqueId
        );

        try {
            URL url = new URL("https://api.brevo.com/v3/smtp/email");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("api-key", cleanKey);

            // Write body
            try (OutputStream os = conn.getOutputStream()) {
                os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int status = conn.getResponseCode();
            String responseBody;

            if (status >= 200 && status < 300) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    responseBody = sb.toString();
                }
                logger.info("Email sent successfully to {} — status: {}, response: {}", toEmail, status, responseBody);
            } else {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    responseBody = sb.toString();
                }
                logger.error("Brevo API error — status: {}, response: {}", status, responseBody);
                throw new RuntimeException("Email API returned " + status + ": " + responseBody);
            }

            conn.disconnect();

        } catch (IOException e) {
            logger.error("Failed to send email to {}: {} — {}", toEmail, e.getClass().getSimpleName(), e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private String toJsonString(String s) {
        return "\"" + escapeJson(s) + "\"";
    }

    private String buildEmailTemplate(String userName, String resetLink) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>"
            + "<body style='margin:0;padding:0;background-color:#f4f4f8;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;'>"
            + "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f4f4f8;padding:40px 20px;'><tr><td align='center'>"
            + "<table width='100%' cellpadding='0' cellspacing='0' style='max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>"
            // Header
            + "<tr><td style='background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:32px 40px;text-align:center;'>"
            + "<h1 style='margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;'>&lt;/&gt; CodePulse</h1>"
            + "<p style='margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;'>Track, Analyze &amp; Master Your Coding Journey</p>"
            + "</td></tr>"
            // Body
            + "<tr><td style='padding:36px 40px 24px;'>"
            + "<h2 style='margin:0 0 8px;color:#1a1a2e;font-size:20px;font-weight:600;'>Password Reset Request</h2>"
            + "<p style='margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;'>Hi <strong style='color:#334155;'>" + escapeHtml(userName) + "</strong>, we received a request to reset your CodePulse password.</p>"
            // CTA Button
            + "<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:8px 0 24px;'>"
            + "<a href='" + resetLink + "' style='display:inline-block;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(124,58,237,0.3);'>Reset My Password</a>"
            + "</td></tr></table>"
            + "<p style='margin:0 0 16px;color:#94a3b8;font-size:12px;line-height:1.5;'>This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.</p>"
            // Fallback link
            + "<div style='background-color:#f8fafc;border-radius:8px;padding:14px 16px;border:1px solid #e2e8f0;'>"
            + "<p style='margin:0 0 6px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'>Or copy this link:</p>"
            + "<p style='margin:0;color:#7c3aed;font-size:12px;word-break:break-all;line-height:1.4;'>" + resetLink + "</p>"
            + "</div></td></tr>"
            // Footer
            + "<tr><td style='padding:20px 40px 28px;border-top:1px solid #f1f5f9;text-align:center;'>"
            + "<p style='margin:0;color:#94a3b8;font-size:11px;'>&copy; 2026 CodePulse. Built for developers, by developers.</p>"
            + "</td></tr></table></td></tr></table></body></html>";
    }

    private String escapeHtml(String s) {
        if (s == null) return "User";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
