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
- Identify common patterns: binary search, BFS/DFS, dynamic programming, divide-and-conquer, merge sort, quick sort, heap sort, etc.
- For recursive sorting (merge sort, quick sort): average case is O(N log N)
- Only return valid JSON, no markdown, no code blocks`;

export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json();

    if (!code || code.trim().length === 0) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const prompt = `Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;

    // ── Strategy: Try AI providers in order, fall back to heuristic ──────────
    // 1. Try OpenAI (ChatGPT) if key is available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      console.log('[Analyze] Trying OpenAI...');
      const result = await tryOpenAI(openaiKey, prompt);
      if (result) {
        console.log('[Analyze] OpenAI succeeded:', result.timeComplexity);
        return NextResponse.json(result);
      }
      console.log('[Analyze] OpenAI failed, trying next provider...');
    } else {
      console.log('[Analyze] No OPENAI_API_KEY found');
    }

    // 2. Try Gemini if key is available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      console.log('[Analyze] Trying Gemini...');
      const result = await tryGemini(geminiKey, prompt);
      if (result) {
        console.log('[Analyze] Gemini succeeded:', result.timeComplexity);
        return NextResponse.json(result);
      }
      console.log('[Analyze] Gemini failed, falling back to heuristic...');
    } else {
      console.log('[Analyze] No GEMINI_API_KEY found');
    }

    // 3. Final fallback: improved heuristic analyzer
    return NextResponse.json(analyzeWithHeuristics(code, language));
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

// ─── OpenAI (ChatGPT) Provider ─────────────────────────────────────────────────
async function tryOpenAI(apiKey: string, prompt: string) {
  try {
    // Try gpt-4o-mini first, then gpt-3.5-turbo as fallback
    const models = ['gpt-4o-mini', 'gpt-3.5-turbo'];
    
    for (const model of models) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 1024,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.error(`OpenAI API error (${model}):`, response.status, errBody);
          continue; // try next model
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content || '';
        const result = parseAIResponse(text, 'ai');
        if (result) return result;
      } catch (e) {
        console.error(`OpenAI fetch error (${model}):`, e);
      }
    }
    return null;
  } catch (e) {
    console.error('OpenAI provider error:', e);
    return null;
  }
}

// ─── Gemini Provider ────────────────────────────────────────────────────────────
async function tryGemini(apiKey: string, prompt: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
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
            generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
          })
        }
      );

      if (response.status === 429 && attempt < 2) {
        const delay = (attempt + 1) * 3000;
        console.log(`Gemini rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/3)`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (!response.ok) {
        const errBody = await response.text();
        console.error('Gemini API error:', response.status, errBody);
        return null;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseAIResponse(text, 'ai');
    } catch (e) {
      console.error('Gemini fetch error:', e);
      return null;
    }
  }
  return null;
}

// ─── Parse AI JSON response ─────────────────────────────────────────────────────
function parseAIResponse(text: string, source: 'ai' | 'heuristic') {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.timeComplexity) return null;
    return {
      timeComplexity: parsed.timeComplexity,
      timeExplanation: parsed.timeExplanation || '',
      spaceComplexity: parsed.spaceComplexity || 'Unknown',
      spaceExplanation: parsed.spaceExplanation || '',
      reasoning: parsed.reasoning || '',
      source,
    };
  } catch {
    return null;
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
  const hasHeap = lower.includes('priorityqueue') || lower.includes('heapq') || lower.includes('heap') ||
    lower.includes('priority_queue');

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
    timeExplanation = `Divide-and-conquer recursion detected${recursionInfo ? ` (${recursionInfo})` : ''} — splits input and processes sub-problems.`;
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
  } else if (hasSort || hasHeap) {
    timeComplexity = 'O(N log N)';
    timeExplanation = hasHeap ? 'Heap operations detected (N insertions × log N each).' : 'Sorting operation detected as the dominant factor.';
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
  if (hasHeap) facts.push('heap/priority queue');
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
function detectRecursionPatterns(code: string, lower: string, _language: string) {
  let hasDivideAndConquer = false;
  let hasSimpleRecursion = false;
  let hasTreeRecursion = false;
  let recursionInfo = '';

  // Extract function names (handles Java, C, C++, JS, Python)
  const funcPatterns = [
    /(?:static\s+)?(?:void|int|long|boolean|String|char|float|double|auto|var)\s+(\w+)\s*\(/g,
    /(?:public|private|protected)\s+(?:static\s+)?(?:void|int|long|boolean|String|char)\s+(\w+)\s*\(/g,
    /function\s+(\w+)\s*\(/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/g,
    /def\s+(\w+)\s*\(/g,
  ];

  const reserved = new Set(['main', 'if', 'while', 'for', 'switch', 'catch', 'return', 'print', 'println', 'printf', 'log']);
  const functionNamesSet = new Set<string>();
  for (const pattern of funcPatterns) {
    let m;
    while ((m = pattern.exec(code)) !== null) {
      if (m[1] && !reserved.has(m[1])) {
        functionNamesSet.add(m[1]);
      }
    }
  }
  const functionNames = Array.from(functionNamesSet);

  // Global indicators for divide-and-conquer patterns
  const hasMidpoint = lower.includes('/2') || lower.includes('>> 1') ||
    lower.includes('/ 2') || /\bmid\b/.test(lower) || /\bhalf\b/.test(lower);

  const hasPartition = lower.includes('partition') || lower.includes('pivot') ||
    lower.includes('lomuto') || lower.includes('hoare');

  const hasSwapAndCompare = (lower.includes('swap') || /\btemp\b/.test(lower)) &&
    (lower.includes('arr[') || lower.includes('arr (') || lower.includes('nums['));

  // Check each function for recursive calls
  for (const fname of functionNames) {
    const callRegex = new RegExp(`\\b${fname}\\s*\\(`, 'g');
    const allCalls = code.match(callRegex);
    if (!allCalls || allCalls.length < 2) continue;

    const recursiveCalls = allCalls.length - 1;

    const fnLower = fname.toLowerCase();
    const isSortRelated = fnLower.includes('sort') || fnLower.includes('merge') ||
      fnLower.includes('quick') || fnLower.includes('partition');

    const isDivideConquer = fnLower.includes('divide') || fnLower.includes('conquer') ||
      fnLower.includes('binary') || fnLower.includes('split');

    if (recursiveCalls >= 2) {
      // Two+ recursive calls — check if it's divide-and-conquer or tree recursion
      const isDnC = hasMidpoint || hasPartition || isSortRelated || isDivideConquer || hasSwapAndCompare;

      if (isDnC) {
        hasDivideAndConquer = true;
        if (isSortRelated) {
          recursionInfo = `${fname} — recursive sorting`;
        } else {
          recursionInfo = `${fname} — divide-and-conquer`;
        }
      } else {
        // Check if function parameters suggest array range splitting (e.g., low/high, l/r, start/end)
        const funcDefRegex = new RegExp(`\\b${fname}\\s*\\([^)]*\\)`, 'g');
        const funcDef = code.match(funcDefRegex);
        const paramStr = funcDef?.[0] || '';
        const paramLower = paramStr.toLowerCase();
        const hasRangeParams = (paramLower.includes('low') && paramLower.includes('high')) ||
          (paramLower.includes('left') && paramLower.includes('right')) ||
          (paramLower.includes('start') && paramLower.includes('end')) ||
          (/\bl\b/.test(paramLower) && /\br\b/.test(paramLower));

        if (hasRangeParams) {
          hasDivideAndConquer = true;
          recursionInfo = `${fname} — range-splitting recursion`;
        } else {
          hasTreeRecursion = true;
        }
      }
    } else if (recursiveCalls === 1) {
      hasSimpleRecursion = true;
    }
  }

  // Extra check: if any function is named with sort-related keywords AND there's recursion, it's likely O(N log N)
  if (!hasDivideAndConquer && (hasSimpleRecursion || hasTreeRecursion)) {
    for (const fname of functionNames) {
      const fnLower = fname.toLowerCase();
      if (fnLower.includes('sort') || fnLower.includes('merge') || fnLower.includes('quick')) {
        hasDivideAndConquer = true;
        hasTreeRecursion = false;
        recursionInfo = `${fname} — recursive sorting algorithm`;
        break;
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
    let braceDepth = 0;
    let loopDepth = 0;
    const loopBraceLevels: number[] = [];

    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) continue;

      const isLoop = /\b(for|while)\s*\(/.test(t);
      const openBraces = (t.match(/{/g) || []).length;
      const closeBraces = (t.match(/}/g) || []).length;

      for (let i = 0; i < closeBraces; i++) {
        braceDepth--;
        if (loopBraceLevels.length > 0 && braceDepth <= loopBraceLevels[loopBraceLevels.length - 1]) {
          loopBraceLevels.pop();
          loopDepth--;
        }
      }

      if (isLoop) {
        if (openBraces > 0) {
          loopDepth++;
          maxNest = Math.max(maxNest, loopDepth);
          loopBraceLevels.push(braceDepth);
        } else {
          loopDepth++;
          maxNest = Math.max(maxNest, loopDepth);
          loopDepth--;
        }
      }

      braceDepth += openBraces;
    }
  }

  return maxNest;
}
