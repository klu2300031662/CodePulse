"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
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
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)

  // Persist code, language, and input to sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.code, code)
  }, [code])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.language, language)
  }, [language])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.input, customInput)
  }, [customInput])

  // Clear sessionStorage on logout (listen for storage event or auth token removal)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        // User logged out — clear terminal session
        sessionStorage.removeItem(STORAGE_KEYS.code)
        sessionStorage.removeItem(STORAGE_KEYS.language)
        sessionStorage.removeItem(STORAGE_KEYS.input)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Detect whether the code expects stdin input
  const needsInput = useMemo(() => {
    const patterns = STDIN_PATTERNS[language] || []
    return patterns.some(p => p.test(code))
  }, [code, language])

  const handleLanguageChange = (val: string) => {
    setLanguage(val)
    setCode(DEFAULT_CODE[val])
    setResult(null)
    setAnalysis(null)
  }

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
    setIsAnalysisOpen(true)
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

  const currentLang = LANGUAGES.find(l => l.value === language)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
            Complexity Analyzer
          </h2>
          <p className="text-muted-foreground text-sm">Write code, run it, and analyze time & space complexity with AI.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={language} onValueChange={handleLanguageChange}>
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

          <Button onClick={runCode} disabled={isExecuting} variant="default" className="flex gap-2">
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isExecuting ? "Running..." : "Run"}
          </Button>

          <Button onClick={analyzeComplexity} disabled={isAnalyzing || !code.trim()}
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
                    <Lightbulb className="h-4 w-4" />
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

      {/* Main content - Vertical layout split (Editor top, Console bottom) */}
      <div className="flex flex-col flex-1 min-h-0 space-y-4">
        {/* Editor Card (60% height) */}
        <Card className="flex-[3] flex flex-col min-h-0 border-zinc-200 dark:border-zinc-800">
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

        {/* Console / Terminal Card (40% height) */}
        <Card className="flex-[2] flex flex-col min-h-0 border-zinc-200 dark:border-zinc-800">
          <CardContent className="flex-1 p-4 min-h-0 flex gap-4 overflow-hidden">
            {/* Stdin (Left Column) */}
            <div className="w-[30%] flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Stdin Input
                </Label>
                {needsInput && !customInput.trim() && (
                  <span className="text-[9px] text-amber-600 dark:text-amber-405 font-semibold px-2 py-0.5 rounded bg-amber-500/10 animate-pulse">
                    Required
                  </span>
                )}
              </div>
              <Textarea
                placeholder="Type input here (one value per line)..."
                className="flex-1 font-mono text-xs resize-none border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 focus-visible:ring-violet-500"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
              />
            </div>

            {/* Output Console (Right Column) */}
            <div className="flex-grow flex flex-col min-h-0 space-y-2">
              <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Console Output
              </Label>
              <div className="flex-1 min-h-0 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-zinc-950 dark:bg-black font-mono text-xs overflow-hidden flex flex-col">
                {/* Console Header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-500 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>interactive-console</span>
                  </div>
                  {result && (
                    <div className="flex items-center gap-3">
                      <span>{result.status}</span>
                      <span>{result.executionTimeMs}ms</span>
                      {result.memoryUsage && <span>{result.memoryUsage}</span>}
                    </div>
                  )}
                </div>
                {/* Console Body */}
                <div className="flex-1 p-3 overflow-auto custom-scrollbar text-zinc-100 select-text leading-relaxed">
                  {isExecuting ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                      <span>Compiling & executing...</span>
                    </div>
                  ) : result ? (
                    <div className="space-y-2">
                      {/* Program output */}
                      {result.output ? (
                        <pre className="whitespace-pre-wrap">{result.output}</pre>
                      ) : result.status === "Success" ? (
                        <div className="text-zinc-500 italic text-[11px]">
                          Process exited with status code 0.
                        </div>
                      ) : null}

                      {/* Program error */}
                      {result.error && (
                        <div className="text-red-400 pt-2 border-t border-zinc-800/30">
                          <pre className="whitespace-pre-wrap">{result.error}</pre>
                        </div>
                      )}

                      {/* Finished message */}
                      <div className="text-emerald-500 dark:text-emerald-400 font-bold text-[10px] pt-2 border-t border-zinc-850/30">
                        {`...Program finished with status ${result.status}`}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-650 text-center py-4 space-y-1">
                      <Terminal className="h-5 w-5 opacity-30" />
                      <p className="text-[11px]">Click Run to execute code</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complexity Analysis Dialog */}
      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#0f0f23]/95 border-zinc-200 dark:border-zinc-800/50 backdrop-blur-xl text-zinc-900 dark:text-zinc-100 overflow-hidden shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500 animate-pulse" />
              AI Complexity Analysis
            </DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Estimated time and space complexity using static analysis and AI model.
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full blur-xl opacity-30 animate-pulse" />
                <Sparkles className="h-10 w-10 text-violet-500 animate-pulse relative" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">AI is analyzing your code structure...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-5 py-2">
              {/* Source badge */}
              <div className="flex justify-end">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide ${
                  analysis.source === 'ai'
                    ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-850'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-850'
                }`}>
                  {analysis.source === 'ai' ? '✨ AI Verified' : '📐 Static Heuristics'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time Complexity */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 dark:from-blue-500/15 dark:to-cyan-500/5 border border-blue-200/50 dark:border-blue-500/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4.5 w-4.5 text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Time Complexity</span>
                  </div>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{analysis.timeComplexity}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400/80 mt-2 leading-relaxed">{analysis.timeExplanation}</p>
                </div>

                {/* Space Complexity */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/15 dark:to-teal-500/5 border border-emerald-200/50 dark:border-emerald-500/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4.5 w-4.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Space Complexity</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">{analysis.spaceComplexity}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400/80 mt-2 leading-relaxed">{analysis.spaceExplanation}</p>
                </div>
              </div>

              {/* Detailed Explanation */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 shadow-inner">
                <div className="flex items-center gap-2 mb-2.5">
                  <FileText className="h-4.5 w-4.5 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Reasoning & Breakdown</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-line">{analysis.reasoning}</p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-500 dark:text-zinc-450 text-sm">
              No analysis data available.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
