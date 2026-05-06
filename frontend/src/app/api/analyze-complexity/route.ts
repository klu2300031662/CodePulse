import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert algorithm analyst. Analyze the given code and return your analysis in EXACTLY this JSON format, nothing else:
{
  "timeComplexity": "O(...)",
  "timeExplanation": "Brief explanation of time complexity",
  "spaceComplexity": "O(...)",
  "spaceExplanation": "Brief explanation of space complexity",
  "reasoning": "Detailed reasoning for both complexities covering data structures used, loop nesting, recursion, etc."
}

Rules:
- Be accurate for both trivial and advanced algorithms
- Cover edge cases like recursion, memoization, amortized complexity
- Identify common patterns (binary search, BFS/DFS, dynamic programming, etc.)
- Only return valid JSON, no markdown, no code blocks`;

export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json();

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback: use the built-in heuristic analyzer
      return NextResponse.json(analyzeWithHeuristics(code, language));
    }

    // Call Gemini API with retry for rate limits
    const prompt = `Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;

    let aiResponse = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1024,
              }
            })
          }
        );

        if (response.status === 429 && attempt < 3) {
          const delay = (attempt + 1) * 2000; // 2s, 4s, 6s
          console.log(`Gemini rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/4)`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        if (response.ok) {
          aiResponse = await response.json();
          break;
        } else {
          console.error('Gemini API error:', response.status);
        }
      } catch (e) {
        console.error('Gemini fetch error:', e);
      }
    }

    if (!aiResponse) {
      return NextResponse.json(analyzeWithHeuristics(code, language));
    }

    const data = aiResponse;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          timeComplexity: parsed.timeComplexity || 'Unknown',
          timeExplanation: parsed.timeExplanation || '',
          spaceComplexity: parsed.spaceComplexity || 'Unknown',
          spaceExplanation: parsed.spaceExplanation || '',
          reasoning: parsed.reasoning || '',
          source: 'ai'
        });
      } catch {
        return NextResponse.json(analyzeWithHeuristics(code, language));
      }
    }

    return NextResponse.json(analyzeWithHeuristics(code, language));
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

// Fallback heuristic analyzer when no API key is configured
function analyzeWithHeuristics(code: string, language: string) {
  const lower = code.toLowerCase();
  const lines = code.split('\n');

  // Detect patterns
  const hasBinarySearch = lower.includes('binarysearch') || 
    (lower.includes('mid') && (lower.includes('high') || lower.includes('right') || lower.includes('end')));
  const hasSort = /\.sort\(/.test(lower) || lower.includes('arrays.sort') || lower.includes('collections.sort');
  const hasBacktracking = lower.includes('backtrack') || (lower.includes('dfs') && lower.includes('remove'));
  const hasDP = lower.includes('memo') || /dp\[/.test(lower) || lower.includes('tabulation');
  const hasRecursion = lower.includes('recursive') || lower.includes('recurse') || 
    (lower.includes('return') && /(\w+)\s*\([^)]*\)[\s\S]*\1\s*\(/.test(code));
  const hasBFS = lower.includes('queue') && (lower.includes('bfs') || lower.includes('breadth'));
  const hasMatrix = /\[\s*\[/.test(code) || /\[\]\[\]/.test(code) || lower.includes('vector<vector');
  const hasHash = lower.includes('hashmap') || lower.includes('hashset') || lower.includes('dict(') || 
    lower.includes('set(') || lower.includes('map<') || lower.includes('unordered_map') ||
    /=\s*\{\s*\}/.test(code) || lower.includes('new map') || lower.includes('new set') ||
    lower.includes('defaultdict') || lower.includes('counter(') ||
    /\w+\s*=\s*\[.*\]/.test(code) || lower.includes('new array') || lower.includes('= []');

  // Count nested loops — handles both C-style (braces) and Python (indentation)
  let maxNest = 0;
  const isPython = language?.toLowerCase() === 'python';

  if (isPython) {
    // Python: track indentation to determine nesting
    const indentStack: number[] = [];
    for (const line of lines) {
      if (line.trim().length === 0) continue;
      const indent = line.match(/^(\s*)/)?.[1].length || 0;
      // Pop stack entries that are >= current indent (we've dedented)
      while (indentStack.length > 0 && indentStack[indentStack.length - 1] >= indent) {
        indentStack.pop();
      }
      if (/^\s*(for\s+|while\s+)/.test(line)) {
        indentStack.push(indent);
        maxNest = Math.max(maxNest, indentStack.length);
      }
    }
  } else {
    // C-style: use braces and for/while( pattern
    let nest = 0;
    for (const line of lines) {
      const t = line.trim();
      if (/\b(for|while)\s*\(/.test(t)) {
        nest++; maxNest = Math.max(maxNest, nest);
      }
      if (t.includes('}') && nest > 0) nest--;
    }
  }

  let timeComplexity = 'O(1)', timeExplanation = 'Constant time — no significant loops or recursion detected.';
  let spaceComplexity = 'O(1)', spaceExplanation = 'Constant space — no significant dynamic allocations detected.';

  if (hasBacktracking) { timeComplexity = 'O(2^N) or O(N!)'; timeExplanation = 'Backtracking pattern detected — exponential branching.'; }
  else if (hasDP) { timeComplexity = 'O(N×M) or O(N²)'; timeExplanation = 'Dynamic programming detected — depends on state dimensions.'; }
  else if (maxNest >= 3) { timeComplexity = 'O(N³)'; timeExplanation = 'Three levels of nested loops detected.'; }
  else if (maxNest === 2) { timeComplexity = 'O(N²)'; timeExplanation = 'Two levels of nested loops detected.'; }
  else if (hasSort) { timeComplexity = 'O(N log N)'; timeExplanation = 'Sorting operation detected as the dominant factor.'; }
  else if (hasBinarySearch) { timeComplexity = 'O(log N)'; timeExplanation = 'Binary search pattern detected.'; }
  else if (hasBFS) { timeComplexity = 'O(V + E)'; timeExplanation = 'BFS traversal detected — linear in vertices and edges.'; }
  else if (maxNest === 1) { timeComplexity = 'O(N)'; timeExplanation = 'Single loop iterating through input.'; }

  if (hasMatrix) { spaceComplexity = 'O(N²)'; spaceExplanation = '2D array/matrix allocation detected.'; }
  else if (hasHash || hasDP) { spaceComplexity = 'O(N)'; spaceExplanation = 'Dynamic data structure (hash/array/DP table) growing with input.'; }
  else if (hasRecursion) { spaceComplexity = 'O(N)'; spaceExplanation = 'Recursion call stack proportional to input size.'; }

  const reasoning = `Heuristic analysis of ${language} code: detected ${maxNest} level(s) of loop nesting` +
    (hasSort ? ', sorting operation' : '') +
    (hasBinarySearch ? ', binary search pattern' : '') +
    (hasDP ? ', dynamic programming pattern' : '') +
    (hasBacktracking ? ', backtracking/exponential pattern' : '') +
    (hasHash ? ', hash-based data structure' : '') + '.';

  return {
    timeComplexity, timeExplanation,
    spaceComplexity, spaceExplanation,
    reasoning, source: 'heuristic'
  };
}
