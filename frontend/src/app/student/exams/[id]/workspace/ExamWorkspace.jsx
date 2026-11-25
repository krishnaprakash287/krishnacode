'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '../../../../../lib/api';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Send,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  FileCode2,
  Lock
} from 'lucide-react';
import { handleDisableCopyPaste, MONACO_NO_COPY_OPTIONS } from '../../../../../lib/monaco';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function ExamWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id;

  const [exam, setExam] = useState(null);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [language, setLanguage] = useState('python');
  
  // Server Timer
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Execution state inside exam
  const [executing, setExecuting] = useState(false);
  const [runResult, setRunResult] = useState(null);

  useEffect(() => {
    if (examId) {
      fetchExamDetails();
    }
  }, [examId]);

  useEffect(() => {
    // Server-controlled Timer Countdown
    if (remainingSeconds === null || remainingSeconds <= 0 || submitted) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, submitted]);

  const fetchExamDetails = async () => {
    try {
      const resp = await api.get(`/exams/${examId}`);
      setExam(resp.data);

      // Initialize default answer templates
      const initialAns = {};
      resp.data.problems.forEach((p) => {
        initialAns[String(p.problem_id)] = {
          code: `# Python 3 Solution for ${p.title}\nimport sys\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()\n`,
          language: 'python'
        };
      });
      setAnswers(initialAns);
    } catch (err) {
      console.error('Failed to load exam details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    try {
      const resp = await api.post(`/exams/${examId}/start`);
      setRemainingSeconds(resp.data.remaining_seconds);
      setStarted(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not start exam session');
    }
  };

  const handleCodeChange = (newCode) => {
    if (!exam || !exam.problems[currentProblemIdx]) return;
    const currentProbId = String(exam.problems[currentProblemIdx].problem_id);
    setAnswers((prev) => ({
      ...prev,
      [currentProbId]: {
        code: newCode,
        language
      }
    }));
  };

  const handleRunCode = async () => {
    if (!exam || !exam.problems[currentProblemIdx]) return;
    setExecuting(true);
    setRunResult(null);

    const prob = exam.problems[currentProblemIdx];
    const currentProbId = String(prob.problem_id);
    const userCode = answers[currentProbId]?.code || '';

    try {
      const resp = await api.post('/submissions/run', {
        problem_id: prob.problem_id,
        language,
        code: userCode
      });
      setRunResult(resp.data);
    } catch (err) {
      setRunResult({ overall_status: 'Error', error: 'Execution error' });
    } finally {
      setExecuting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!confirm('Are you sure you want to finalize and submit your examination?')) return;
    await submitExamToServer(true);
  };

  const handleAutoSubmit = async () => {
    await submitExamToServer(true);
  };

  const submitExamToServer = async (isFinal) => {
    try {
      const resp = await api.post(`/exams/${examId}/submit`, {
        answers,
        is_final: isFinal
      });
      setSubmitted(true);
      alert(`Exam submitted successfully! Total score: ${resp.data.total_score}/${exam.total_marks}`);
      router.push('/student/exams');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit exam');
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center my-12">
        <div className="h-16 w-16 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Clock className="h-8 w-8" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          {exam.name}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {exam.description}
        </p>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left space-y-2 text-xs">
          <h4 className="font-bold uppercase text-slate-400">Examination Instructions</h4>
          <pre className="font-sans whitespace-pre-wrap text-slate-700 dark:text-slate-300">
            {exam.instructions}
          </pre>
        </div>

        <div className="flex justify-around p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs font-bold text-blue-900 dark:text-blue-300">
          <span>Duration: {exam.duration_minutes} Minutes</span>
          <span>Questions: {exam.problems.length}</span>
          <span>Total Marks: {exam.total_marks}</span>
        </div>

        <button
          onClick={handleStartExam}
          className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 text-lg transition-all"
        >
          Begin Examination Attempt Now
        </button>
      </div>
    );
  }

  const currentProblem = exam.problems[currentProblemIdx];
  const currentProbId = String(currentProblem.problem_id);
  const currentCode = answers[currentProbId]?.code || '';

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] gap-4">
      {/* Top Examination Navigation Banner */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-4">
          <h2 className="font-black text-lg text-blue-400">{exam.name}</h2>
          <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300">
            Question {currentProblemIdx + 1} of {exam.problems.length}
          </span>
        </div>

        {/* Server Countdown Timer */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono font-black text-xl px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse">
            <Clock className="h-5 w-5" />
            {remainingSeconds !== null ? formatTimer(remainingSeconds) : '--:--'}
          </div>

          <button
            onClick={handleFinalSubmit}
            className="px-5 py-2 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
          >
            Submit Final Exam
          </button>
        </div>
      </div>

      {/* Main Workspace Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
        {/* Left Column: Question Navigator */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400">Question Palette</h3>
          <div className="grid grid-cols-4 gap-2">
            {exam.problems.map((p, idx) => {
              const pid = String(p.problem_id);
              const isAnswered = answers[pid]?.code && answers[pid].code.trim().length > 40;
              const isCurrent = idx === currentProblemIdx;

              return (
                <button
                  key={p.problem_id}
                  onClick={() => setCurrentProblemIdx(idx)}
                  className={`py-3 rounded-xl text-xs font-bold font-mono transition-all border ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : isAnswered
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Q{idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-blue-600"></span> Active Question
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-500"></span> Attempted
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-slate-300 dark:bg-slate-800"></span> Unattempted
            </div>
          </div>
        </div>

        {/* Center/Right Column: Problem & Monaco Editor */}
        <div className="lg:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Problem Statement */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentProblem.title}
              </h3>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg font-mono">
                {currentProblem.marks} Marks
              </span>
            </div>

            <div className="leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm">
              {currentProblem.description}
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase block mb-1">Input Format</span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono">{currentProblem.input_format}</pre>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase block mb-1">Output Format</span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono">{currentProblem.output_format}</pre>
            </div>
          </div>

          {/* Monaco Code Editor */}
          <div className="flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-800 text-white px-2.5 py-1 rounded font-bold uppercase"
              >
                <option value="python">Python 3</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </select>

              <button
                onClick={handleRunCode}
                disabled={executing}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 text-xs"
              >
                <Play className="h-3.5 w-3.5 fill-white" /> Run
              </button>

              <span className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-[11px] ml-auto">
                <Lock className="h-3 w-3" /> Anti-Cheat Mode
              </span>
            </div>

            <div className="flex-1 min-h-[300px]">
              <MonacoEditor
                height="100%"
                language={language === 'python' ? 'python' : 'cpp'}
                theme="vs-dark"
                value={currentCode}
                onChange={(v) => handleCodeChange(v || '')}
                onMount={handleDisableCopyPaste}
                options={MONACO_NO_COPY_OPTIONS}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
