"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import Editor from "@monaco-editor/react"
import { Play, Loader2, Info, Sparkles, Zap, Brain, Clock, FileText, Lightbulb, Terminal, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TerminalService, ExecuteResponse, ComplexityAnalysis } from "@/lib/api/terminal.service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip"

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
  const [activeRightTab, setActiveRightTab] = useState("output")

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
    setActiveRightTab("output")
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
    setActiveRightTab("analysis")
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
                <Button variant="outline" className="flex gap-2 opacity-70 cursor-not-allowed" disabled>
                  <Lightbulb className="h-4 w-4" />
                  Optimize
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-900 text-white border-zinc-700 max-w-[220px] text-center">
                <p className="font-semibold">Optimized Version of Your Code</p>
                <p className="text-zinc-400 text-xs mt-1">Coming Soon 🚀</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Editor */}
        <Card className="lg:col-span-2 flex flex-col min-h-0 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
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

        {/* Right panel */}
        <Card className="flex flex-col min-h-0 border-zinc-200 dark:border-zinc-800">
          <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col h-full">
            <CardHeader className="py-2 px-4 border-b space-y-0">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="output">Output</TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Analysis
                </TabsTrigger>
                <TabsTrigger value="input" className="relative">
                  Input
                  {needsInput && !customInput.trim() && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-auto min-h-0">
              {/* Input Tab */}
              <TabsContent value="input" className="h-full m-0">
                <div className="flex flex-col h-full space-y-2">
                  <Label>Standard Input (stdin)</Label>
                  {needsInput && !customInput.trim() && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Your code uses <strong>stdin</strong> — provide input below or it will run with empty input.</span>
                    </div>
                  )}
                  <Textarea
                    placeholder="Enter custom input here (one value per line)..."
                    className="flex-1 font-mono text-sm resize-none"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Tip: Enter input values separated by newlines, just like typing in a terminal.
                  </p>
                </div>
              </TabsContent>

              {/* Output Tab */}
              <TabsContent value="output" className="h-full m-0 space-y-4">
                {result ? (
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      Status:
                      <span className={result.status === 'Success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {result.status}
                      </span>
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground border-b pb-2 flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {result.executionTimeMs} ms</span>
                      {result.memoryUsage && <span>💾 {result.memoryUsage}</span>}
                    </div>

                    {/* Stdin indicator */}
                    {customInput.trim() && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-zinc-100 dark:bg-zinc-900 rounded px-2 py-1 w-fit">
                        <Terminal className="h-3 w-3" /> Custom input provided
                      </div>
                    )}

                    <div className="flex-1 space-y-2 overflow-auto">
                      <Label>Standard Output</Label>
                      <pre className="p-3 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 rounded-lg font-mono text-sm whitespace-pre-wrap min-h-[100px] border border-zinc-200 dark:border-zinc-800">
                        {result.output || (result.status === 'Success' ? 'Process exited with no output.' : '')}
                      </pre>

                      {result.error && (
                        <div className="mt-4">
                          <Label className="text-red-600 dark:text-red-400">Error</Label>
                          <pre className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg font-mono text-sm whitespace-pre-wrap border border-red-200 dark:border-red-900/30">
                            {result.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <Info className="h-8 w-8 opacity-20" />
                    <p className="text-sm">Run your code to see the output here</p>
                    {needsInput && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Your code seems to need input — check the Input tab
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="h-full m-0">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full blur-xl opacity-30 animate-pulse" />
                      <Sparkles className="h-8 w-8 text-violet-500 animate-pulse relative" />
                    </div>
                    <p className="text-sm text-muted-foreground">AI is analyzing your code...</p>
                  </div>
                ) : analysis ? (
                  <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-400">
                    {/* Source badge */}
                    <div className="flex justify-end">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        analysis.source === 'ai'
                          ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {analysis.source === 'ai' ? '✨ AI Analysis' : '📐 Heuristic'}
                      </span>
                    </div>

                    {/* Time Complexity */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Time Complexity</span>
                      </div>
                      <p className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">{analysis.timeComplexity}</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">{analysis.timeExplanation}</p>
                    </div>

                    {/* Space Complexity */}
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Space Complexity</span>
                      </div>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">{analysis.spaceComplexity}</p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">{analysis.spaceExplanation}</p>
                    </div>

                    {/* Reasoning */}
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Explanation</span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{analysis.reasoning}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <Sparkles className="h-8 w-8 opacity-20" />
                    <p className="text-sm text-center">Click <strong>Analyze</strong> to get AI-powered<br />complexity analysis</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
