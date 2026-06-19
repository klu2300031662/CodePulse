"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import Editor from "@monaco-editor/react"
import { Play, Loader2, Info, Sparkles, Brain, Clock, FileText, Lightbulb, Terminal, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TerminalService, ExecuteResponse, ComplexityAnalysis } from "@/lib/api/terminal.service"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"

const LANGUAGES = [
  { value: "c",          label: "C",          icon: "🔵", monacoLang: "c" },
  { value: "cpp",        label: "C++",        icon: "🔷", monacoLang: "cpp" },
  { value: "java",       label: "Java 17",    icon: "☕", monacoLang: "java" },
  { value: "python",     label: "Python",     icon: "🐍", monacoLang: "python" },
  { value: "javascript", label: "JavaScript", icon: "🟨", monacoLang: "javascript" },
]

const DEFAULT_CODE: Record<string, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, CodePulse!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, CodePulse!" << std::endl;\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodePulse!");\n    }\n}\n',
  python: 'print("Hello, CodePulse!")\n',
  javascript: 'console.log("Hello, CodePulse!");\n',
}

// Detect if code uses stdin functions
const STDIN_PATTERNS: Record<string, RegExp[]> = {
  c:          [/scanf\s*\(/, /gets\s*\(/, /fgets\s*\(/, /getchar\s*\(/],
  cpp:        [/cin\s*>>/, /getline\s*\(/, /scanf\s*\(/],
  java:       [/Scanner/, /BufferedReader/, /System\.in/, /readLine\s*\(/],
  python:     [/input\s*\(/],
  javascript: [/readline\s*\(/, /prompt\s*\(/, /process\.stdin/],
}

const STORAGE_KEYS = {
  code: 'codepulse_terminal_code',
  language: 'codepulse_terminal_lang',
  input: 'codepulse_terminal_input',
}

export default function TerminalPage() {
  // Restore from sessionStorage on mount (persists across tab switches)
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEYS.language) || 'javascript'
    }
    return 'javascript'
  })
  const [code, setCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEYS.code) || DEFAULT_CODE['javascript']
    }
    return DEFAULT_CODE['javascript']
  })
  const [customInput, setCustomInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEYS.input) || ''
    }
    return ''
  })
  const [isExecuting, setIsExecuting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ExecuteResponse | null>(null)
  const [analysis, setAnalysis] = useState<ComplexityAnalysis | null>(null)
  
  // Drawer states
  const [activeDrawer, setActiveDrawer] = useState<"input" | "output" | "analysis" | null>(null)
  const [drawerHeight, setDrawerHeight] = useState(380)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.code, code)
  }, [code])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.language, language)
  }, [language])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.input, customInput)
  }, [customInput])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        sessionStorage.removeItem(STORAGE_KEYS.code)
        sessionStorage.removeItem(STORAGE_KEYS.language)
        sessionStorage.removeItem(STORAGE_KEYS.input)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const needsInput = useMemo(() => {
    const patterns = STDIN_PATTERNS[language] || []
    return patterns.some(p => p.test(code))
  }, [code, language])

  const runCode = async () => {
    setIsExecuting(true)
    setResult(null)
    try {
      const res = await TerminalService.execute({ language, code, input: customInput })
      setResult(res)
    } catch (err) {
      const error = err as any
      setResult({
        status: "Error", output: "",
        error: error.message || "Failed to execute code.",
        executionTimeMs: 0, memoryUsage: "0 MB",
        timeComplexityEstimate: "N/A", spaceComplexityEstimate: "N/A"
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const analyzeComplexity = async () => {
    if (!code.trim()) return
    setIsAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await TerminalService.analyzeComplexity(code, language)
      setAnalysis(res)
    } catch {
      setAnalysis({
        timeComplexity: "Error", timeExplanation: "Analysis failed",
        spaceComplexity: "Error", spaceExplanation: "Analysis failed",
        reasoning: "Could not analyze the code. Please try again.",
        source: "heuristic"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartHeight.current = drawerHeight
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const deltaY = e.clientY - dragStartY.current
    const newHeight = Math.max(200, Math.min(window.innerHeight - 120, dragStartHeight.current - deltaY))
    setDrawerHeight(newHeight)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    if (drawerHeight < 220) {
      setActiveDrawer(null)
      setDrawerHeight(380)
    }
  }

  const handleRunClick = () => {
    setActiveDrawer("input")
  }

  const handleEnterInput = () => {
    setActiveDrawer("output")
    runCode()
  }

  const handleAnalyzeClick = () => {
    setActiveDrawer("analysis")
    analyzeComplexity()
  }

  const currentLang = LANGUAGES.find(l => l.value === language)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Complexity Analyzer
          </h2>
          <p className="text-muted-foreground text-sm">Write code, run it, and analyze time & space complexity with AI.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={language} onValueChange={(val) => { setLanguage(val); setCode(DEFAULT_CODE[val]); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => (
                <SelectItem key={l.value} value={l.value}>
                  <span className="flex items-center gap-2">{l.icon} {l.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleRunClick} disabled={isExecuting} variant="default" className="flex gap-2">
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isExecuting ? "Running..." : "Run"}
          </Button>

          <Button onClick={handleAnalyzeClick} disabled={isAnalyzing || !code.trim()}
            variant="outline"
            className="flex gap-2 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button variant="outline" className="flex gap-2 border-dashed border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30" disabled>
                    <Lightbulb className="h-4 w-4 text-zinc-400 dark:text-zinc-600" />
                    Optimize
                  </Button>
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm whitespace-nowrap">
                    SOON 🚀
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-900 text-white border-zinc-700 max-w-[220px] text-center">
                <p className="font-semibold">Optimized Version of Your Code</p>
                <p className="text-zinc-400 text-xs mt-1">Coming Soon 🚀</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <Card className="flex-1 flex flex-col min-h-0 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span>{currentLang?.icon}</span> {currentLang?.label} Editor
            </CardTitle>
            <span className="text-[10px] text-muted-foreground font-mono">
              {code.split('\n').length} lines
            </span>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <Editor
              height="100%"
              language={currentLang?.monacoLang || "javascript"}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                renderLineHighlight: 'all',
                bracketPairColorization: { enabled: true },
                cursorBlinking: 'smooth',
                smoothScrolling: true,
              }}
            />
          </CardContent>
        </Card>
      </div>

      {activeDrawer && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 transition-opacity animate-in fade-in-0 duration-300 cursor-pointer"
            onClick={() => {
              setActiveDrawer(null)
              setDrawerHeight(380)
            }}
          />

          <div 
            style={{ height: `${drawerHeight}px` }}
            className={`fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#0f0f23]/95 border-t border-zinc-200 dark:border-zinc-800/80 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] flex flex-col select-none transition-all duration-75 ${
              isDragging ? '' : 'transition-height'
            }`}
          >
            <div 
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full py-3.5 flex flex-col items-center justify-center cursor-ns-resize touch-none active:bg-zinc-50 dark:active:bg-white/[0.02] rounded-t-3xl border-b border-zinc-100/50 dark:border-zinc-800/20"
            >
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setActiveDrawer(null)
                setDrawerHeight(380)
              }}
              className="absolute right-4 top-3 h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>

            <div className="flex-grow p-5 overflow-auto select-text min-h-0 flex flex-col">
              {activeDrawer === "input" && (
                <div className="flex flex-col h-full space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      Standard Input (stdin)
                    </h3>
                    {needsInput && !customInput.trim() && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 animate-pulse">
                        ⚠️ Input expected by code
                      </span>
                    )}
                  </div>
                  <Textarea
                    placeholder="Enter custom input values here (one value per line)..."
                    className="flex-1 font-mono text-sm resize-none border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 focus-visible:ring-violet-500"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setActiveDrawer(null)
                        setDrawerHeight(380)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg"
                      onClick={handleEnterInput}
                    >
                      Enter & Run
                    </Button>
                  </div>
                </div>
              )}

              {activeDrawer === "output" && (
                <div className="flex-grow flex flex-col min-h-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      Console Output
                    </h3>
                    {result && (
                      <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {result.executionTimeMs}ms
                        </span>
                        {result.memoryUsage && <span>💾 {result.memoryUsage}</span>}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 dark:bg-black font-mono text-xs overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-500 select-none">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>interactive-console</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-800">
                        {result ? result.status : "executing"}
                      </span>
                    </div>
                    <div className="flex-grow p-4 overflow-auto custom-scrollbar text-zinc-100 leading-relaxed select-text">
                      {isExecuting ? (
                        <div className="h-full flex items-center justify-center text-zinc-500 gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                          <span>Compiling & executing code...</span>
                        </div>
                      ) : result ? (
                        <div className="space-y-3">
                          {result.output ? (
                            <pre className="whitespace-pre-wrap">{result.output}</pre>
                          ) : result.status === "Success" ? (
                            <div className="text-zinc-500 italic text-[11px]">
                              Process exited with status code 0.
                            </div>
                          ) : null}

                          {result.error && (
                            <div className="text-red-400 pt-2 border-t border-zinc-800/30">
                              <pre className="whitespace-pre-wrap">{result.error}</pre>
                            </div>
                          )}

                          <div className="text-emerald-500 dark:text-emerald-400 font-bold text-[10px] pt-2 border-t border-zinc-800/30">
                            {`...Program finished with status ${result.status}`}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {activeDrawer === "analysis" && (
                <div className="flex-grow flex flex-col min-h-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      AI Complexity Analysis
                    </h3>
                    {analysis && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        analysis.source === 'ai'
                          ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {analysis.source === 'ai' ? '✨ AI Analysis' : '📐 Heuristic'}
                      </span>
                    )}
                  </div>

                  {isAnalyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full blur-xl opacity-30 animate-pulse" />
                        <Sparkles className="h-8 w-8 text-violet-500 animate-pulse relative" />
                      </div>
                      <p className="text-xs text-muted-foreground">AI is analyzing your code structure...</p>
                    </div>
                  ) : analysis ? (
                    <div className="flex-1 overflow-auto custom-scrollbar space-y-4 pr-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Time Complexity</span>
                          </div>
                          <p className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono leading-tight">{analysis.timeComplexity}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">{analysis.timeExplanation}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-500/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Brain className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Space Complexity</span>
                          </div>
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono leading-tight">{analysis.spaceComplexity}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">{analysis.spaceExplanation}</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <FileText className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-450" />
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Reasoning & Explanation</span>
                        </div>
                        <p className="text-[11px] text-zinc-650 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-line">{analysis.reasoning}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
