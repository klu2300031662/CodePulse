package com.codepulse.backend.security.services;

import com.codepulse.backend.payload.request.CodeExecutionRequest;
import com.codepulse.backend.payload.response.CodeExecutionResponse;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

@Service
public class CodeExecutionService {

    private static final String TEMP_DIR = System.getProperty("java.io.tmpdir");
    private final Semaphore executionSemaphore = new Semaphore(10); // Limit to 10 concurrent processes

    public CodeExecutionResponse executeCode(CodeExecutionRequest request) {
        String lang = request.getLanguage().toLowerCase();
        
        try {
            if (!executionSemaphore.tryAcquire(5, TimeUnit.SECONDS)) {
                return CodeExecutionResponse.builder()
                        .status("Error")
                        .error("Server is busy. Please try again in a few seconds.")
                        .build();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return CodeExecutionResponse.builder()
                    .status("Error")
                    .error("Execution interrupted.")
                    .build();
        }
        
        try {
            return switch (lang) {
                case "python" -> runPython(request.getCode(), request.getInput());
                case "javascript", "js", "node" -> runJavaScript(request.getCode(), request.getInput());
                case "java" -> runJava(request.getCode(), request.getInput());
                case "c" -> runC(request.getCode(), request.getInput());
                case "cpp", "c++" -> runCpp(request.getCode(), request.getInput());
                default -> CodeExecutionResponse.builder()
                        .status("Error")
                        .error("Unsupported language: " + lang)
                        .build();
            };
        } catch (Exception e) {
            return CodeExecutionResponse.builder()
                    .status("Error")
                    .error("Execution failed: " + e.getMessage())
                    .build();
        } finally {
            executionSemaphore.release();
        }
    }

    private void deleteDirectory(File dir) {
        if (dir != null && dir.exists()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    f.delete();
                }
            }
            dir.delete();
        }
    }

    private CodeExecutionResponse runPython(String code, String input) throws Exception {
        File file = createTempFile("Main", ".py", code);
        File dir = file.getParentFile();
        try {
            return executeProcess(new String[]{"python", file.getAbsolutePath()}, dir, input, code);
        } finally {
            deleteDirectory(dir);
        }
    }
    
    private CodeExecutionResponse runJavaScript(String code, String input) throws Exception {
        File file = createTempFile("main", ".js", code);
        File dir = file.getParentFile();
        try {
            return executeProcess(new String[]{"node", file.getAbsolutePath()}, dir, input, code);
        } finally {
            deleteDirectory(dir);
        }
    }

    private CodeExecutionResponse runJava(String code, String input) throws Exception {
        // Java requires class name to match file name. Assume class Main.
        File file = createTempFile("Main", ".java", code);
        File dir = file.getParentFile();
        Process compileProc = null;
        try {
            // Compile
            ProcessBuilder pbCompile = new ProcessBuilder("javac", file.getName());
            pbCompile.directory(dir);
            compileProc = pbCompile.start();
            boolean compiled = compileProc.waitFor(10, TimeUnit.SECONDS);
            
            if (!compiled) {
                compileProc.destroyForcibly();
                return CodeExecutionResponse.builder().status("Error").error("Compilation Error:\nCompilation Timeout (10 seconds)").build();
            }
            
            if (compileProc.exitValue() != 0) {
                String error = new String(compileProc.getErrorStream().readAllBytes());
                return CodeExecutionResponse.builder().status("Error").error("Compilation Error:\n" + error).build();
            }

            // Run
            return executeProcess(new String[]{"java", "Main"}, dir, input, code);
        } finally {
            if (compileProc != null && compileProc.isAlive()) {
                compileProc.destroyForcibly();
            }
            deleteDirectory(dir);
        }
    }

    private CodeExecutionResponse runC(String code, String input) throws Exception {
        File sourceFile = createTempFile("main", ".c", code);
        File dir = sourceFile.getParentFile();
        String exeName = System.getProperty("os.name").toLowerCase().contains("win") ? "main.exe" : "./main";
        Process compileProc = null;
        try {
            // Compile with gcc
            ProcessBuilder pbCompile = new ProcessBuilder("gcc", sourceFile.getName(), "-o", "main");
            pbCompile.directory(dir);
            compileProc = pbCompile.start();
            boolean compiled = compileProc.waitFor(10, TimeUnit.SECONDS);

            if (!compiled) {
                compileProc.destroyForcibly();
                return CodeExecutionResponse.builder().status("Error").error("Compilation Error:\nCompilation Timeout (10 seconds)").build();
            }

            if (compileProc.exitValue() != 0) {
                String error = new String(compileProc.getErrorStream().readAllBytes());
                return CodeExecutionResponse.builder().status("Error").error("Compilation Error:\n" + error).build();
            }

            return executeProcess(new String[]{exeName}, dir, input, code);
        } finally {
            if (compileProc != null && compileProc.isAlive()) {
                compileProc.destroyForcibly();
            }
            deleteDirectory(dir);
        }
    }

    private CodeExecutionResponse runCpp(String code, String input) throws Exception {
        File sourceFile = createTempFile("main", ".cpp", code);
        File dir = sourceFile.getParentFile();
        String exeName = System.getProperty("os.name").toLowerCase().contains("win") ? "main.exe" : "./main";
        Process compileProc = null;
        try {
            // Compile
            ProcessBuilder pbCompile = new ProcessBuilder("g++", sourceFile.getName(), "-o", "main");
            pbCompile.directory(dir);
            compileProc = pbCompile.start();
            boolean compiled = compileProc.waitFor(10, TimeUnit.SECONDS);
            
            if (!compiled) {
                compileProc.destroyForcibly();
                return CodeExecutionResponse.builder().status("Error").error("Compilation Error:\nCompilation Timeout (10 seconds)").build();
            }

            if (compileProc.exitValue() != 0) {
                String error = new String(compileProc.getErrorStream().readAllBytes());
                return CodeExecutionResponse.builder().status("Error").error("Compilation Error:\n" + error).build();
            }

            // Run
            return executeProcess(new String[]{exeName}, dir, input, code);
        } finally {
            if (compileProc != null && compileProc.isAlive()) {
                compileProc.destroyForcibly();
            }
            deleteDirectory(dir);
        }
    }

    private File createTempFile(String prefix, String suffix, String content) throws IOException {
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        Path dir = Files.createTempDirectory("exe_" + uniqueId);
        File file = new File(dir.toFile(), prefix + suffix);
        Files.writeString(file.toPath(), content);
        return file;
    }

    private CodeExecutionResponse executeProcess(String[] command, File dir, String input, final String code) {
        StringBuilder output = new StringBuilder();
        StringBuilder error = new StringBuilder();
        long startTime = System.currentTimeMillis();
        Process process = null;
        Thread outThread = null;
        Thread errThread = null;
        
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(dir);
            process = pb.start();
            final Process finalProcess = process;

            // Write input
            if (input != null && !input.isEmpty()) {
                try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()))) {
                    writer.write(input);
                    writer.flush();
                }
            }

            // Read output
            outThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        output.append(line).append("\n");
                    }
                } catch (IOException ignored) {}
            });
            
            // Read error
            errThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        error.append(line).append("\n");
                    }
                } catch (IOException ignored) {}
            });

            outThread.start();
            errThread.start();

            // Wait with timeout
            boolean finished = process.waitFor(15, TimeUnit.SECONDS);
            long endTime = System.currentTimeMillis();

            if (!finished) {
                process.destroyForcibly();
                return CodeExecutionResponse.builder()
                        .status("Error")
                        .error("Time Limit Exceeded (15 seconds)")
                        .executionTimeMs(15000)
                        .build();
            }
            
            outThread.join(1000);
            errThread.join(1000);

            return CodeExecutionResponse.builder()
                    .status(process.exitValue() == 0 ? "Success" : "Error")
                    .output(output.toString())
                    .error(error.toString())
                    .executionTimeMs(endTime - startTime)
                    .memoryUsage(String.format("%.1f MB", 25.0 + Math.random() * 20.0)) // Mock memory usage
                    .timeComplexityEstimate(estimateTimeComplexity(code)) 
                    .spaceComplexityEstimate(estimateSpaceComplexity(code))
                    .build();

        } catch (Exception e) {
            return CodeExecutionResponse.builder()
                    .status("Error")
                    .error(e.getMessage())
                    .build();
        } finally {
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
            if (outThread != null && outThread.isAlive()) {
                outThread.interrupt();
            }
            if (errThread != null && errThread.isAlive()) {
                errThread.interrupt();
            }
        }
    }

    private String estimateTimeComplexity(String code) {
        if (code == null || code.isEmpty()) return "O(1)";
        
        String lowerCode = code.toLowerCase();
        
        // Checking for different DSA patterns
        boolean hasBinarySearch = lowerCode.contains("binarysearch") || 
            (lowerCode.contains("mid") && (lowerCode.contains("high") || lowerCode.contains("right") || lowerCode.contains("end")));
        
        boolean hasSort = lowerCode.matches(".*\\.sort\\(.*") || lowerCode.matches(".*sort\\(.*") || lowerCode.contains("arrays.sort") || lowerCode.contains("collections.sort");
        
        boolean hasBacktracking = lowerCode.contains("backtrack") || (lowerCode.contains("dfs") && lowerCode.contains("remove"));

        int maxNestedLoops = 0;
        int currentNest = 0;
        
        String[] lines = code.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.matches(".*(for\\s*\\(|while\\s*\\().*") || line.contains(" for ") || line.contains(" while ")) {
                currentNest++;
                maxNestedLoops = Math.max(maxNestedLoops, currentNest);
            }
            if (line.contains("}") || line.equals("") || line.contains("end")) {
                if (currentNest > 0) currentNest--;
            }
        }
        
        if (hasBacktracking) return "O(2^N) or O(N!)";
        if (maxNestedLoops >= 3) return "O(N^3)";
        if (maxNestedLoops == 2) return "O(N^2)";
        if (hasSort) return "O(N log N)";
        if (hasBinarySearch) return "O(log N)";
        if (maxNestedLoops == 1) return "O(N)";
        
        return "O(1)";
    }

    private String estimateSpaceComplexity(String code) {
        if (code == null || code.isEmpty()) return "O(1)";
        String lowerCode = code.toLowerCase();
        
        // 2D Arrays or Matrices
        if (lowerCode.matches(".*(\\[\\]\\[\\]|vector\\s*<\\s*vector|list\\s*<\\s*list|\\[\\[.*?\\]\\]).*")) {
            return "O(N^2)";
        }
        
        // 1D Arrays, Hashes, Queues, Stacks
        if (lowerCode.matches(".*(new\\s+[a-z]+\\[|vector\\s*<|hashmap|hashset|queue|stack|dict\\(|set\\(|map\\s*<|unordered_map).*")) {
            return "O(N)";
        }
        
        // Check for basic recursion indicating call stack size
        if (lowerCode.contains("return") && lowerCode.matches(".*\\b([a-zA-Z_]\\w*)\\s*\\(.*\\b\\1\\s*\\(.*")) {
             return "O(N) (Call Stack)";
        }

        return "O(1)";
    }
}
