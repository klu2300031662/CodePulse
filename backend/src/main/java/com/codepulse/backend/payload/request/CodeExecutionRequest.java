package com.codepulse.backend.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CodeExecutionRequest {
    @NotBlank
    private String language; // "python", "java", "cpp", "javascript"

    @NotBlank
    private String code;

    // Optional input provided to standard input (stdin)
    private String input;
}
