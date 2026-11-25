'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '../../../../lib/api';
import {
  Code2,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Star,
  FileCode2,
  Terminal,
  AlertTriangle,
  ArrowLeft,
  Lock,
  Flame
} from 'lucide-react';
import { handleDisableCopyPaste, MONACO_NO_COPY_OPTIONS } from '../../../../lib/monaco';
import StreakModal from '../../../../components/StreakModal';

// Dynamic import for Monaco Editor to prevent SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const STARTER_TEMPLATES = {
  python: `# Python 3 Solution
import sys

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Write your logic here
    print("Output result")

if __name__ == "__main__":
    main()
`,
  cpp: `// C++ Solution
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Write your logic here
    return 0;
}
`,
  c: `// C Solution
#include <stdio.h>

int main() {
    // Write your logic here
    return 0;
}
`,
  java: `// Java Solution
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your logic here
    }
}
`,
  javascript: `// JavaScript (Node.js) Solution
const fs = require('fs');

function main() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0) return;
    // Write your logic here
}

main();
`
};

export default function ProblemWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params?.id;

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  
  // Execution states
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('problem');
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakData, setStreakData] = useState({ streak: 1, streakIncreased: true });

  useEffect(() => {
    if (problemId) {
      fetchProblemDetails();
    }
  }, [problemId]);

  useEffect(() => {
    if (language && STARTER_TEMPLATES[language]) {
      setCode(STARTER_TEMPLATES[language]);
    }
  }, [language]);

  const fetchProblemDetails = async () => {
    try {
      const resp = await api.get(`/problems/${problemId}`);
      setProblem(resp.data);
    } catch (err) {
      console.error('Failed to load problem details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setRunResult(null);
    setSubmitResult(null);
    setActiveTab('results');

    try {
      const resp = await api.post('/submissions/run', {
        problem_id: Number(problemId),
        language,
        code
      });
      setRunResult(resp.data);
    } catch (err) {
      setRunResult({
        overall_status: 'Internal Error',
        error: err.response?.data?.detail || 'Execution error'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmitCode = async () => {
    setExecuting(true);
    setRunResult(null);
    setSubmitResult(null);
    setActiveTab('results');

    try {
      const resp = await api.post('/submissions', {
        problem_id: Number(problemId),
        language,
        code
      });
      setSubmitResult(resp.data);

      // Trigger Streak Animation Modal if submission succeeds and returns streak
      if (resp.data && resp.data.streak) {
        setStreakData({
          streak: resp.data.streak,
          streakIncreased: resp.data.streak_increased ?? true
        });
        setShowStreakModal(true);
      }
    } catch (err) {
      setSubmitResult({
        status: 'Internal Error',
        error: err.response?.data?.detail || 'Submission failed'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleResetCode = () => {
    if (STARTER_TEMPLATES[language]) {
      setCode(STARTER_TEMPLATES[language]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!problem) {
    return <div className="p-8 text-center text-slate-400">Problem not found.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/student/problems')}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {problem.title}
          </h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            problem.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
            problem.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}>
            {problem.difficulty}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-500 flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> {problem.points} pts
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold uppercase focus:outline-none"
          >
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="c">C (GCC)</option>
            <option value="java">Java 17</option>
            <option value="javascript">JavaScript (Node.js)</option>
          </select>

          <button
            onClick={handleResetCode}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Reset Code"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={handleRunCode}
            disabled={executing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
          >
            <Play className="h-4 w-4 text-emerald-500 fill-emerald-500" /> Run Code
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={executing}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Submit Solution
          </button>
        </div>
      </div>

      {/* Main Split Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Left Panel: Problem Statement */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4">
            <button
              onClick={() => setActiveTab('problem')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'problem'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Description & Examples
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'results'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Terminal className="h-4 w-4" /> Execution Console
              {(runResult || submitResult) && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>}
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'problem' ? (
              <>
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Problem Description</h3>
                  <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {problem.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <span className="font-bold text-slate-400 block mb-1">Time Limit</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{problem.time_limit} Seconds</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <span className="font-bold text-slate-400 block mb-1">Memory Limit</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{problem.memory_limit} MB</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Input Format</h3>
                  <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap">
                    {problem.input_format}
                  </pre>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Output Format</h3>
                  <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap">
                    {problem.output_format}
                  </pre>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Constraints</h3>
                  <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap">
                    {problem.constraints}
                  </pre>
                </div>

                {problem.examples && problem.examples.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Examples</h3>
                    <div className="space-y-3">
                      {problem.examples.map((ex, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-2 text-xs">
                          <div><span className="font-bold text-slate-500">Input:</span> <code className="font-mono font-bold text-slate-900 dark:text-white">{ex.input}</code></div>
                          <div><span className="font-bold text-slate-500">Output:</span> <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{ex.output}</code></div>
                          {ex.explanation && <div><span className="font-bold text-slate-500">Explanation:</span> {ex.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Execution Console Tab */
              <div className="space-y-4">
                {executing && (
                  <div className="p-6 text-center text-slate-400 space-y-2">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm font-semibold">Executing solution in sandboxed container...</p>
                  </div>
                )}

                {/* Run Code Results */}
                {runResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        {runResult.overall_status === 'Accepted' ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{runResult.overall_status}</h4>
                          <span className="text-xs text-slate-500">Public Test Cases: {runResult.passed_test_cases}/{runResult.total_test_cases} Passed</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">{runResult.total_execution_time_ms} ms</span>
                    </div>

                    {runResult.test_results && runResult.test_results.map((tr, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span>Test Case #{idx + 1}</span>
                          <span className={tr.passed ? 'text-emerald-500' : 'text-red-500'}>{tr.status}</span>
                        </div>
                        <div><span className="text-slate-400">Input:</span> <code className="font-mono text-slate-900 dark:text-white">{tr.input_data}</code></div>
                        <div><span className="text-slate-400">Expected:</span> <code className="font-mono text-emerald-600">{tr.expected_output}</code></div>
                        <div><span className="text-slate-400">Actual:</span> <code className="font-mono text-slate-900 dark:text-white">{tr.actual_output}</code></div>
                        {tr.error_message && (
                          <div className="p-2 bg-red-950/40 text-red-400 rounded font-mono mt-2">{tr.error_message}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Submit Results */}
                {submitResult && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black">{submitResult.status}</h3>
                        <span className="text-xl font-bold text-amber-400">+{submitResult.score} pts</span>
                      </div>
                      <p className="text-sm text-blue-200">
                        Passed {submitResult.passed_test_cases} of {submitResult.total_test_cases} test cases.
                      </p>
                      <div className="flex items-center gap-4 text-xs font-mono text-blue-300 pt-2 border-t border-blue-800">
                        <span>Execution Time: {submitResult.execution_time_ms} ms</span>
                        <span>Memory: {submitResult.memory_kb} KB</span>
                      </div>
                    </div>

                    {/* Streak Celebration Banner */}
                    {submitResult.streak && (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-orange-950/60 to-amber-950/40 border border-orange-500/30 text-orange-300 shadow-md">
                        <div className="flex items-center gap-2.5 font-bold text-sm">
                          <Flame className="h-6 w-6 text-orange-400 fill-orange-500 animate-bounce" />
                          <span>{submitResult.streak} Day Coding Streak Active!</span>
                        </div>
                        <button
                          onClick={() => setShowStreakModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-xs font-bold text-orange-200 border border-orange-500/30 transition-all hover:scale-105"
                        >
                          View Animation 🔥
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!executing && !runResult && !submitResult && (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Click <strong>Run Code</strong> to test against public examples, or <strong>Submit Solution</strong> to run against all hidden test cases.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Monaco Code Editor */}
        <div className="flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-2 font-bold text-white">
              <FileCode2 className="h-4 w-4 text-blue-400" /> main.{language}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-[11px]">
              <Lock className="h-3 w-3" /> Anti-Cheat (Copy-Paste Disabled)
            </span>
          </div>
          <div className="flex-1 w-full h-full min-h-[400px]">
            <MonacoEditor
              height="100%"
              language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : 'cpp'}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleDisableCopyPaste}
              options={MONACO_NO_COPY_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Streak Celebration Modal Animation */}
      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streak={streakData.streak}
        streakIncreased={streakData.streakIncreased}
        problemTitle={problem?.title}
      />
    </div>
  );
}
