import { NextRequest, NextResponse } from 'next/server';

const WANDBOX_API = 'https://wandbox.org/api/compile.json';

// Map our language values to Wandbox compiler names
const LANGUAGE_MAP: Record<string, { compiler: string; filename: string }> = {
  c:          { compiler: 'gcc-13.2.0-c',     filename: 'prog.c' },
  cpp:        { compiler: 'gcc-13.2.0',        filename: 'prog.cc' },
  java:       { compiler: 'openjdk-jdk-22+36', filename: 'prog.java' },
  python:     { compiler: 'cpython-3.12.7',    filename: 'prog.py' },
  javascript: { compiler: 'nodejs-20.17.0',    filename: 'prog.js' },
};

export async function POST(request: NextRequest) {
  try {
    const { language, code, input } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json(
        { status: 'Error', output: '', error: 'Code is required', executionTimeMs: 0 },
        { status: 400 }
      );
    }

    const langConfig = LANGUAGE_MAP[language?.toLowerCase()];
    if (!langConfig) {
      return NextResponse.json(
        { status: 'Error', output: '', error: `Unsupported language: ${language}`, executionTimeMs: 0 },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Pre-process code for language-specific quirks
    let processedCode = code;

    // Java: Wandbox names the file 'prog.java', so 'public class Xxx' causes
    // a filename mismatch. Strip the 'public' keyword from class declarations.
    if (language?.toLowerCase() === 'java') {
      processedCode = processedCode.replace(/public\s+class\s+/g, 'class ');
    }

    // Wandbox API format
    const wandboxPayload: Record<string, string> = {
      compiler: langConfig.compiler,
      code: processedCode,
      'compiler-option-raw': '',
      'runtime-option-raw': '',
    };

    // Add stdin if provided
    if (input && input.trim()) {
      wandboxPayload.stdin = input;
    }

    const response = await fetch(WANDBOX_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wandboxPayload),
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        status: 'Error',
        output: '',
        error: `Execution service error (${response.status}): ${errorText}`,
        executionTimeMs,
      });
    }

    const result = await response.json();

    // Wandbox response fields:
    // - program_output: stdout from the program
    // - program_error: stderr from the program
    // - compiler_output: stdout from compiler (if any)
    // - compiler_error: stderr from compiler (errors/warnings)
    // - compiler_message: combined compiler messages
    // - program_message: combined program messages
    // - status: exit code (string "0" for success)

    const compilerError = result.compiler_error || '';
    const programOutput = result.program_output || '';
    const programError = result.program_error || '';
    const exitCode = result.status || '0';

    // Handle compilation errors (non-zero compiler exit)
    if (compilerError && !programOutput && exitCode !== '0') {
      return NextResponse.json({
        status: 'Error',
        output: '',
        error: `Compilation Error:\n${compilerError}`,
        executionTimeMs,
      });
    }

    // Handle signal (timeout, segfault, etc.)
    if (result.signal) {
      return NextResponse.json({
        status: 'Error',
        output: programOutput,
        error: `Process terminated by signal: ${result.signal}`,
        executionTimeMs,
      });
    }

    // Handle runtime errors
    if (exitCode !== '0') {
      return NextResponse.json({
        status: 'Error',
        output: programOutput,
        error: programError || compilerError || 'Runtime error (non-zero exit code)',
        executionTimeMs,
      });
    }

    return NextResponse.json({
      status: 'Success',
      output: programOutput,
      error: programError || '',
      executionTimeMs,
      memoryUsage: '—',
    });
  } catch (error: any) {
    console.error('Execute route error:', error);
    return NextResponse.json({
      status: 'Error',
      output: '',
      error: error.message || 'An unexpected error occurred during execution.',
      executionTimeMs: 0,
    });
  }
}
