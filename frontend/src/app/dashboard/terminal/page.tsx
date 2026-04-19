"use client"

import { useState } from "react"
import Editor from "@monaco-editor/react"
import { Play, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TerminalService, ExecuteResponse } from "@/lib/api/terminal.service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const DEFAULT_CODE: Record<string, string> = {
  javascript: "console.log('Hello, CodePulse!');\n",
  python: "print('Hello, CodePulse!')\n",
  java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, CodePulse!\");\n    }\n}\n",
  cpp: "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, CodePulse!\" << std::endl;\n    return 0;\n}\n"
}

export default function TerminalPage() {
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState(DEFAULT_CODE["javascript"])
  const [customInput, setCustomInput] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<ExecuteResponse | null>(null)

  const handleLanguageChange = (val: string) => {
    setLanguage(val)
    setCode(DEFAULT_CODE[val])
  }

  const runCode = async () => {
    setIsExecuting(true)
    setResult(null)
    try {
      const res = await TerminalService.execute({
        language,
        code,
        input: customInput
      })
      setResult(res)
    } catch (err) {
      const error = err as any;
      setResult({
        status: "Error",
        output: "",
        error: error.response?.data?.error || error.message || "Failed to execute code.",
        executionTimeMs: 0,
        memoryUsage: "0 MB",
        timeComplexityEstimate: "N/A",
        spaceComplexityEstimate: "N/A"
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Interactive Terminal</h2>
          <p className="text-muted-foreground">Write, run, and test your code securely.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java 17</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={runCode} disabled={isExecuting} className="flex gap-2">
            {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isExecuting ? "Running..." : "Run Code"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <Card className="lg:col-span-2 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b space-y-0">
            <CardTitle className="text-sm font-medium">Editor</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col min-h-0">
          <Tabs defaultValue="output" className="flex flex-col h-full">
            <CardHeader className="py-2 px-4 border-b space-y-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="output">Output</TabsTrigger>
                <TabsTrigger value="input">Input</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-auto min-h-0">
              <TabsContent value="input" className="h-full m-0">
                <div className="flex flex-col h-full space-y-2">
                  <Label>Standard Input</Label>
                  <Textarea 
                    placeholder="Enter custom input here..."
                    className="flex-1 font-mono text-sm resize-none"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="output" className="h-full m-0 space-y-4">
                {result ? (
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      Status: 
                      <span className={result.status === 'Success' ? 'text-green-500' : 'text-red-500'}>
                        {result.status}
                      </span>
                    </div>
                    
                    <div className="flex gap-4 text-xs text-muted-foreground border-b pb-2">
                       <span>Runtime: {result.executionTimeMs} ms</span>
                       {result.memoryUsage && <span>Memory: {result.memoryUsage}</span>}
                       <span>Time: {result.timeComplexityEstimate}</span>
                       <span>Space: {result.spaceComplexityEstimate}</span>
                     </div>
                    
                    <div className="flex-1 space-y-2 overflow-auto">
                      <Label>Standard Output</Label>
                      <pre className="p-3 bg-zinc-950 text-zinc-50 rounded-md font-mono text-sm whitespace-pre-wrap min-h-[100px]">
                        {result.output || (result.status === 'Success' ? 'Process exited with no output.' : '')}
                      </pre>
                      
                      {result.error && (
                        <div className="mt-4">
                          <Label className="text-red-500">Error</Label>
                          <pre className="p-3 bg-red-950/20 text-red-500 rounded-md font-mono text-sm whitespace-pre-wrap">
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
