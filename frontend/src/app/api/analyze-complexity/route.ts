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
- Identify common patterns (binary search, BFS/DFS, dynamic programming, divide-and-conquer, merge sort, quick sort, etc.)
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
          const delay = (attempt + 1) * 3000; // 3s, 6s, 9s
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

// ─── Improved Heuristic Analyzer ───────────────────────────────────────────────
function analyzeWithHeuristics(code: string, language: string) {
  const lower = code.toLowerCase();
  const lines = code.split('\n');

  // ── Pattern Detection ────────────────────────────────────────────────────────
  const hasBinarySearch = lower.includes('binarysearch') ||
    (lower.includes('mid') && (lower.includes('high') || lower.includes('right') || lower.includes('end')));
  const hasSort = /\.sort\(/.test(lower) || lower.includes('arrays.sort') || lower.includes('collections.sort');
  const hasBacktracking = lower.includes('backtrack') || (lower.includes('dfs') && lower.includes('remove'));
  const hasDP = lower.includes('memo') || /dp\[/.test(lower) || lower.includes('tabulation');
  const hasBFS = lower.includes('queue') && (lower.includes('bfs') || lower.includes('breadth'));
  const hasMatrix = /\[\s*\[/.test(code) || /\[\]\[\]/.test(code) || lower.includes('vector<vector');
  const hasHash = lower.includes('hashmap') || lower.includes('hashset') || lower.includes('dict(') ||
    lower.includes('set(') || lower.includes('map<') || lower.includes('unordered_map') ||
    /=\s*\{\s*\}/.test(code) || lower.includes('new map') || lower.includes('new set') ||
    lower.includes('defaultdict') || lower.includes('counter(') ||
    /\w+\s*=\s*\[.*\]/.test(code) || lower.includes('new array') || lower.includes('= []');

  // ── Recursion & Divide-and-Conquer Detection ─────────────────────────────────
  const { hasDivideAndConquer, hasSimpleRecursion, hasTreeRecursion, recursionInfo } =
    detectRecursionPatterns(code, lower, language);

  // ── Accurate Loop Nesting Counter ────────────────────────────────────────────
  const maxNest = countLoopNesting(lines, language);

  // ── Determine Time Complexity ────────────────────────────────────────────────
  let timeComplexity = 'O(1)';
  let timeExplanation = 'Constant time — no significant loops or recursion detected.';

  if (hasBacktracking) {
    timeComplexity = 'O(2^N) or O(N!)';
    timeExplanation = 'Backtracking pattern detected — exponential branching.';
  } else if (hasDivideAndConquer) {
    timeComplexity = 'O(N log N)';
    timeExplanation = `Divide-and-conquer recursion detected${recursionInfo ? ` (${recursionInfo})` : ''} — splits input and merges results.`;
  } else if (hasTreeRecursion && !hasDP) {
    timeComplexity = 'O(2^N)';
    timeExplanation = 'Binary tree recursion without memoization — exponential growth.';
  } else if (hasDP) {
    timeComplexity = 'O(N×M) or O(N²)';
    timeExplanation = 'Dynamic programming detected — depends on state dimensions.';
  } else if (maxNest >= 3) {
    timeComplexity = 'O(N³)';
    timeExplanation = 'Three levels of nested loops detected.';
  } else if (maxNest === 2) {
    timeComplexity = 'O(N²)';
    timeExplanation = 'Two levels of nested loops detected.';
  } else if (hasSort) {
    timeComplexity = 'O(N log N)';
    timeExplanation = 'Sorting operation detected as the dominant factor.';
  } else if (hasBinarySearch) {
    timeComplexity = 'O(log N)';
    timeExplanation = 'Binary search pattern detected.';
  } else if (hasBFS) {
    timeComplexity = 'O(V + E)';
    timeExplanation = 'BFS traversal detected — linear in vertices and edges.';
  } else if (hasSimpleRecursion) {
    timeComplexity = 'O(N)';
    timeExplanation = 'Linear recursion detected — single recursive call reducing input.';
  } else if (maxNest === 1) {
    timeComplexity = 'O(N)';
    timeExplanation = 'Single loop iterating through input.';
  }

  // ── Determine Space Complexity ───────────────────────────────────────────────
  let spaceComplexity = 'O(1)';
  let spaceExplanation = 'Constant space — no significant dynamic allocations detected.';

  if (hasMatrix) {
    spaceComplexity = 'O(N²)';
    spaceExplanation = '2D array/matrix allocation detected.';
  } else if (hasHash || hasDP) {
    spaceComplexity = 'O(N)';
    spaceExplanation = 'Dynamic data structure (hash/array/DP table) growing with input.';
  } else if (hasDivideAndConquer) {
    spaceComplexity = 'O(N)';
    spaceExplanation = 'Auxiliary arrays and recursion stack from divide-and-conquer.';
  } else if (hasSimpleRecursion || hasTreeRecursion) {
    spaceComplexity = 'O(N)';
    spaceExplanation = 'Recursion call stack proportional to input size.';
  }

  // ── Build reasoning ──────────────────────────────────────────────────────────
  const facts: string[] = [];
  facts.push(`${maxNest} level(s) of loop nesting`);
  if (hasDivideAndConquer) facts.push('divide-and-conquer recursion');
  if (hasSort) facts.push('sorting operation');
  if (hasBinarySearch) facts.push('binary search pattern');
  if (hasDP) facts.push('dynamic programming pattern');
  if (hasBacktracking) facts.push('backtracking/exponential pattern');
  if (hasHash) facts.push('hash-based data structure');
  if (hasSimpleRecursion && !hasDivideAndConquer) facts.push('simple recursion');
  if (hasTreeRecursion && !hasDivideAndConquer) facts.push('tree recursion');

  const reasoning = `Heuristic analysis of ${language} code: detected ${facts.join(', ')}.`;

  return {
    timeComplexity, timeExplanation,
    spaceComplexity, spaceExplanation,
    reasoning, source: 'heuristic' as const
  };
}

// ─── Recursion Pattern Detector ────────────────────────────────────────────────
function detectRecursionPatterns(code: string, lower: string, language: string) {
  let hasDivideAndConquer = false;
  let hasSimpleRecursion = false;
  let hasTreeRecursion = false;
  let recursionInfo = '';

  // Extract function names (handles Java, C, C++, JS, Python)
  const funcPatterns = [
    /(?:static\s+)?(?:void|int|long|boolean|String|char|float|double|auto|var)\s+(\w+)\s*\(/g,      // Java/C/C++
    /(?:public|private|protected)\s+(?:static\s+)?(?:void|int|long|boolean|String|char)\s+(\w+)\s*\(/g, // Java with access modifier
    /function\s+(\w+)\s*\(/g,                          // JavaScript
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/g,  // JS arrow/anonymous
    /def\s+(\w+)\s*\(/g,                                // Python
  ];

  const functionNamesSet = new Set<string>();
  for (const pattern of funcPatterns) {
    let m;
    while ((m = pattern.exec(code)) !== null) {
      if (m[1] && m[1] !== 'main' && m[1] !== 'if' && m[1] !== 'while' && m[1] !== 'for') {
        functionNamesSet.add(m[1]);
      }
    }
  }

  const functionNames = Array.from(functionNamesSet);

  // Check each function for recursive calls
  for (const fname of functionNames) {
    const callRegex = new RegExp(`\\b${fname}\\s*\\(`, 'g');
    const allCalls = code.match(callRegex);

    if (!allCalls || allCalls.length < 2) continue; // need at least def + 1 call

    const recursiveCalls = allCalls.length - 1; // subtract the definition

    // Check for midpoint division (divide-and-conquer indicator)
    const hasMidpoint = lower.includes('/2') || lower.includes('>> 1') ||
      lower.includes('/ 2') || /\bmid\b/.test(lower) || /\bhalf\b/.test(lower);

    const isSortRelated = fname.toLowerCase().includes('sort') ||
      fname.toLowerCase().includes('merge') ||
      fname.toLowerCase().includes('quick') ||
      fname.toLowerCase().includes('partition');

    if (recursiveCalls >= 2 && hasMidpoint) {
      // Two recursive calls + midpoint = divide-and-conquer (merge sort, quick sort)
      hasDivideAndConquer = true;
      recursionInfo = isSortRelated ? `${fname} — recursive sorting` : `${fname} — divide-and-conquer`;
    } else if (recursiveCalls >= 2) {
      // Two recursive calls without midpoint = tree recursion (fibonacci-like)
      hasTreeRecursion = true;
    } else if (recursiveCalls === 1) {
      if (hasMidpoint) {
        // Single recursive call + midpoint = binary search style
        // Don't override if already detected binary search via other patterns
        hasSimpleRecursion = true;
      } else {
        hasSimpleRecursion = true;
      }
    }
  }

  return { hasDivideAndConquer, hasSimpleRecursion, hasTreeRecursion, recursionInfo };
}

// ─── Accurate Loop Nesting Counter ─────────────────────────────────────────────
function countLoopNesting(lines: string[], language: string): number {
  let maxNest = 0;
  const isPython = language?.toLowerCase() === 'python';

  if (isPython) {
    // Python: track indentation to determine nesting
    const indentStack: number[] = [];
    for (const line of lines) {
      if (line.trim().length === 0) continue;
      const indent = line.match(/^(\s*)/)?.[1].length || 0;
      while (indentStack.length > 0 && indentStack[indentStack.length - 1] >= indent) {
        indentStack.pop();
      }
      if (/^\s*(for\s+|while\s+)/.test(line)) {
        indentStack.push(indent);
        maxNest = Math.max(maxNest, indentStack.length);
      }
    }
  } else {
    // C-style languages: track brace depth and associate loops with brace levels
    let braceDepth = 0;
    let loopDepth = 0;
    const loopBraceLevels: number[] = []; // brace depth at which each loop started

    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) continue;

      const isLoop = /\b(for|while)\s*\(/.test(t);
      const openBraces = (t.match(/{/g) || []).length;
      const closeBraces = (t.match(/}/g) || []).length;

      // Handle closing braces first (for lines like "} else {")
      for (let i = 0; i < closeBraces; i++) {
        braceDepth--;
        // If this closes a loop's brace level, decrease loop depth
        if (loopBraceLevels.length > 0 && braceDepth <= loopBraceLevels[loopBraceLevels.length - 1]) {
          loopBraceLevels.pop();
          loopDepth--;
        }
      }

      // Handle loop detection
      if (isLoop) {
        if (openBraces > 0) {
          // Multi-line loop with brace — track it
          loopDepth++;
          maxNest = Math.max(maxNest, loopDepth);
          loopBraceLevels.push(braceDepth); // record current depth before opening
        } else {
          // Single-line loop (no brace) — temporary nesting
          loopDepth++;
          maxNest = Math.max(maxNest, loopDepth);
          loopDepth--; // immediately close
        }
      }

      // Handle opening braces
      braceDepth += openBraces;
    }
  }

  return maxNest;
}
