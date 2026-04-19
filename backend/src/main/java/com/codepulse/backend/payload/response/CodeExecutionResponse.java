package com.codepulse.backend.payload.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CodeExecutionResponse {
    private String status; // "Success", "Error"
    private String output; // Standard output
    private String error;  // Standard error
    private long executionTimeMs; // Runtime
    private String memoryUsage; // Memory usage (e.g. "45.2 MB")
    private String spaceComplexityEstimate; 
    private String timeComplexityEstimate;
}
