import { NextRequest, NextResponse } from 'next/server';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const BACKEND_EXECUTE_API = `${rawApiUrl.replace(/\/+$/, '')}/api/execute`;

export async function POST(request: NextRequest) {
  try {
    const { language, code, input } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json(
        { status: 'Error', output: '', error: 'Code is required', executionTimeMs: 0 },
        { status: 400 }
      );
    }

    if (!language) {
      return NextResponse.json(
        { status: 'Error', output: '', error: 'Language is required', executionTimeMs: 0 },
        { status: 400 }
      );
    }

    console.log(`[Execute Route] Proxying code execution request to backend: ${BACKEND_EXECUTE_API}`);

    const response = await fetch(BACKEND_EXECUTE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language, code, input }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Execute Route] Backend error (${response.status}):`, errorText);
      return NextResponse.json({
        status: 'Error',
        output: '',
        error: `Execution service error (${response.status}): ${errorText || 'Internal Server Error'}`,
        executionTimeMs: 0,
      });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Execute Route] Error proxying code execution:', error);
    return NextResponse.json({
      status: 'Error',
      output: '',
      error: error.message || 'An unexpected error occurred during execution.',
      executionTimeMs: 0,
    });
  }
}
