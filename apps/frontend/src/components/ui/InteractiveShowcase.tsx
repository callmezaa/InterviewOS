'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Code, Play, CheckCircle2, Shield, User, Loader2, Mic, Brain, TrendingUp } from 'lucide-react';
import { Waveform } from './Waveform';
import { Badge } from './Badge';

type Tab = 'editor' | 'whisper' | 'scorecard';

/* ── Script for Tab 1: Collaborative Editor ── */
interface ScriptAction {
  type: 'speech' | 'type' | 'run' | 'wait';
  speaker?: 'sarah' | 'alex' | 'system';
  text?: string;
  duration?: number;
}

const SCRIPT: ScriptAction[] = [
  { type: 'speech', speaker: 'sarah', text: "Welcome Alex. Let's write a function to reverse a singly linked list in-place.", duration: 3200 },
  { type: 'speech', speaker: 'alex', text: "I'll use an iterative approach with three pointers: prev, curr, and next.", duration: 2800 },
  { type: 'type', speaker: 'alex', text: `function reverseList(head: Node | null): Node | null {\n  let prev = null;\n  let curr = head;\n  while (curr !== null) {\n    let next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`, duration: 8000 },
  { type: 'speech', speaker: 'alex', text: "That should reverse it. I'll run the compiler and test suites now.", duration: 2500 },
  { type: 'run', speaker: 'system', text: "Running compiler...", duration: 3500 },
  { type: 'speech', speaker: 'sarah', text: "Brilliant. Correct O(N) time and O(1) space. Well done!", duration: 3000 },
  { type: 'wait', duration: 2500 },
];

/* ── Data for Tab 2: Whisper Audio Feed ── */
const WHISPER_LINES = [
  { time: '00:12', speaker: 'Sarah', color: 'text-sky-400', text: "Welcome to the interview. Let's reverse a singly linked list." },
  { time: '00:18', speaker: 'Alex', color: 'text-primary-on-dark', text: "I'll use an iterative approach with three pointers." },
  { time: '00:34', speaker: 'Alex', color: 'text-primary-on-dark', text: "Initialize prev as null, curr as the head node." },
  { time: '00:51', speaker: 'Alex', color: 'text-primary-on-dark', text: "Store the next pointer before overwriting it each iteration." },
  { time: '01:14', speaker: 'Sarah', color: 'text-sky-400', text: "What's the time complexity of your solution?" },
  { time: '01:19', speaker: 'Alex', color: 'text-primary-on-dark', text: "O(N) time and O(1) space — only pointer variables used." },
  { time: '01:30', speaker: 'Sarah', color: 'text-sky-400', text: "Brilliant. Clean implementation. Well done!" },
];

/* ── Data for Tab 3: AI Scorecard ── */
const SCORES = [
  { label: 'Problem Solving',  score: 92, bar: 'from-sky-500 to-cyan-400' },
  { label: 'Code Quality',     score: 88, bar: 'from-blue-600 to-sky-400' },
  { label: 'Communication',    score: 95, bar: 'from-blue-500 to-sky-300' },
  { label: 'Time Complexity',  score: 90, bar: 'from-blue-700 to-sky-500' },
  { label: 'Edge Case Coverage', score: 78, bar: 'from-blue-400 to-sky-200' },
];

/* ── Tab definitions ── */
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'editor',    label: 'Collaborative Editor', icon: <Code className="w-3.5 h-3.5" /> },
  { id: 'whisper',   label: 'Whisper Audio Feed',   icon: <Mic className="w-3.5 h-3.5" /> },
  { id: 'scorecard', label: 'AI Scorecard',          icon: <Brain className="w-3.5 h-3.5" /> },
];

/* ── Shared fade variant ── */
const fade = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

/* ══════════════════════════════════════════════════════════════ */
export const InteractiveShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  /* ── Editor tab state ── */
  const [currentStep, setCurrentStep] = useState(0);
  const [typedCode, setTypedCode] = useState('');
  const [speechBubble, setSpeechBubble] = useState({ speaker: '', text: '' });
  const [activeSpeaker, setActiveSpeaker] = useState<'sarah' | 'alex' | null>(null);
  const [consoleStatus, setConsoleStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  /* ── Whisper tab state ── */
  const [visibleLines, setVisibleLines] = useState(0);
  const [whisperActive, setWhisperActive] = useState(false);

  /* ── Scorecard tab state ── */
  const [scoresVisible, setScoresVisible] = useState(false);

  /* ── Editor script runner ── */
  useEffect(() => {
    let scriptTimer: NodeJS.Timeout;
    let typeInterval: NodeJS.Timeout;

    const executeStep = (stepIndex: number) => {
      const step = SCRIPT[stepIndex];
      if (!step) {
        setCurrentStep(0); setTypedCode(''); setSpeechBubble({ speaker: '', text: '' });
        setActiveSpeaker(null); setConsoleStatus('idle'); setConsoleLogs([]);
        return;
      }
      if (step.type === 'speech') {
        const sp = step.speaker;
        setActiveSpeaker(sp === 'sarah' || sp === 'alex' ? sp : null);
        setSpeechBubble({ speaker: step.speaker === 'sarah' ? 'Sarah (Interviewer)' : 'Alex (Candidate)', text: step.text || '' });
        scriptTimer = setTimeout(() => setCurrentStep(p => p + 1), step.duration || 2000);
      } else if (step.type === 'type') {
        setActiveSpeaker('alex');
        setSpeechBubble({ speaker: 'Alex (Candidate)', text: 'Writing the iterative solution...' });
        const full = step.text || '';
        let idx = 0;
        setTypedCode('');
        typeInterval = setInterval(() => {
          if (idx < full.length) { setTypedCode(p => p + full.charAt(idx)); idx++; }
          else { clearInterval(typeInterval); setCurrentStep(p => p + 1); }
        }, Math.floor((step.duration || 6000) / full.length));
      } else if (step.type === 'run') {
        setActiveSpeaker(null);
        setSpeechBubble({ speaker: 'System Compiler', text: 'Executing test runner...' });
        setConsoleStatus('running');
        setConsoleLogs(['> tsc reverseList.ts --noEmit', '> jest test-suites/reverse.test.ts']);
        const extra = [
          '● Running unit tests...',
          '  ✔ [1→2→3] ⟹ [3→2→1]  (0.10ms)',
          '  ✔ [null]  ⟹ [null]    (0.05ms)',
          '  ✔ [10]    ⟹ [10]      (0.08ms)',
          '\nTests: 3 passed, 3 total | Time: 0.86s',
        ];
        let li = 0;
        const logInt = setInterval(() => {
          if (li < extra.length) {
            setConsoleLogs(p => [...p, extra[li]]); li++;
            setTimeout(() => { if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight; }, 50);
          } else { clearInterval(logInt); setConsoleStatus('success'); setCurrentStep(p => p + 1); }
        }, 420);
      } else if (step.type === 'wait') {
        setActiveSpeaker(null); setSpeechBubble({ speaker: '', text: '' });
        scriptTimer = setTimeout(() => setCurrentStep(p => p + 1), step.duration || 3000);
      }
    };

    executeStep(currentStep);
    return () => { clearTimeout(scriptTimer); clearInterval(typeInterval); };
  }, [currentStep]);

  /* ── Whisper tab: reveal lines progressively ── */
  useEffect(() => {
    if (activeTab !== 'whisper') return;
    setVisibleLines(0); setWhisperActive(false);
    const timers: NodeJS.Timeout[] = [];
    WHISPER_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), i * 900 + 300));
    });
    timers.push(setTimeout(() => setWhisperActive(true), 500));
    return () => timers.forEach(clearTimeout);
  }, [activeTab]);

  /* ── Scorecard tab: animate bars in ── */
  useEffect(() => {
    if (activeTab !== 'scorecard') return;
    setScoresVisible(false);
    const t = setTimeout(() => setScoresVisible(true), 200);
    return () => clearTimeout(t);
  }, [activeTab]);

  /* ── Syntax highlighter ── */
  const renderCode = (code: string) => {
    if (!code) return <span className="text-zinc-600 italic">// Waiting for candidate input...</span>;
    return code.split('\n').map((line, idx) => {
      const indent = line.match(/^\s*/)?.[0] || '';
      const content = line.substring(indent.length);
      const tokens = content.split(/(\s+|\(|\)|\{|\}|:|=|\.|;)/);
      return (
        <div key={idx} className="font-mono text-[13px] leading-6 min-h-[24px]">
          <span className="text-zinc-600/50 select-none mr-4 inline-block w-4 text-right">{idx + 1}</span>
          <span>{indent}</span>
          {tokens.map((t, ti) => {
            if (['function','let','while','return','const'].includes(t)) return <span key={ti} className="text-purple-400 font-medium">{t}</span>;
            if (['null','Node'].includes(t)) return <span key={ti} className="text-amber-300">{t}</span>;
            if (['head','prev','curr','next'].includes(t)) return <span key={ti} className="text-sky-300">{t}</span>;
            if (['='].includes(t)) return <span key={ti} className="text-pink-400">{t}</span>;
            return <span key={ti} className="text-white/85">{t}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="w-full flex flex-col bg-surface-tile-3/60 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.05)] rounded-lg overflow-hidden">

      {/* ── Top Window Bar ── */}
      <div className="h-11 bg-surface-tile-2 flex items-center justify-between px-4 select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="text-[11px] font-mono text-body-muted/55 ml-2 tracking-tight">Cinematic workspace v1.0</span>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full text-[11px] font-medium text-primary-on-dark">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>Live call in progress</span>
        </div>
      </div>

      {/* ── Interactive Tab Bar ── */}
      <div className="h-10 bg-surface-tile-2/80 flex items-end px-4 gap-0 select-none shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 h-full text-[12px] font-medium border-b-2 transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-primary text-white'
                : 'border-transparent text-body-muted/55 hover:text-body-muted/70'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="relative min-h-[480px] flex flex-col">
        <AnimatePresence mode="wait">

          {/* ════ TAB 1: Collaborative Editor ════ */}
          {activeTab === 'editor' && (
            <motion.div key="editor" variants={fade} initial="hidden" animate="visible" exit="exit"
              className="flex flex-col md:flex-row flex-1 absolute inset-0"
            >
              {/* Video feeds */}
              <div className="w-full md:w-[220px] bg-surface-tile-2/60 p-3 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible shrink-0">
                {(['sarah', 'alex'] as const).map(person => (
                  <div key={person} className={`w-[180px] md:w-full aspect-[4/3] rounded-lg relative overflow-hidden border transition-all duration-300 bg-surface-black/60 ${
                    activeSpeaker === person ? 'border-green-500 shadow-[0_0_14px_rgba(34,197,94,0.28)] scale-[1.02]' : 'border-white/[0.06]'
                  }`}>
                    <div className={`absolute inset-0 flex items-center justify-center ${person === 'sarah' ? 'bg-gradient-to-tr from-indigo-950/40 via-surface-black to-slate-900/40' : 'bg-gradient-to-tl from-emerald-950/30 via-surface-black to-slate-900/40'}`}>
                      <User className="w-10 h-10 text-white/5" />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                      <span className="bg-black/65 backdrop-blur-sm border border-white/[0.06] px-2 py-0.5 rounded text-[10px] font-semibold text-white/90">
                        {person === 'sarah' ? 'Sarah (Interviewer)' : 'Alex (Candidate)'}
                      </span>
                      <Waveform isActive={activeSpeaker === person} barCount={5} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Code editor + console */}
              <div className="flex-1 flex flex-col min-w-0 bg-surface-black">
                <div className="h-9 bg-surface-tile-2/60 px-4 flex items-center justify-between select-none shrink-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-body-muted/65">
                    <Code className="w-3.5 h-3.5 text-primary" />
                    <span>reverseList.ts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded font-mono text-body-muted/60">TypeScript</span>
                    {consoleStatus === 'running' ? (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-yellow-500"><Loader2 className="w-3 h-3 animate-spin" /><span>Compiling...</span></div>
                    ) : consoleStatus === 'success' ? (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-green-400"><CheckCircle2 className="w-3 h-3" /><span>Tests Passed</span></div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-body-muted/55"><Play className="w-3 h-3" /><span>Run Sandbox</span></div>
                    )}
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto min-h-[200px]">{renderCode(typedCode)}</div>
                <div className="h-[130px] bg-surface-tile-3 flex flex-col shrink-0">
                  <div className="h-[26px] bg-surface-tile-2/70 px-4 flex items-center gap-1.5 text-[10px] font-mono text-body-muted/55 tracking-tight select-none shrink-0">
                    <Terminal className="w-3 h-3" /><span>Compiler & test logs</span>
                  </div>
                  <div ref={consoleRef} className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-5">
                    {consoleLogs.length === 0 ? (
                      <span className="text-zinc-600">// Waiting for build trigger...</span>
                    ) : consoleLogs.map((log, i) => {
                      if (!log) return null;
                      const isCmd = log.startsWith('>');
                      const isSuccess = log.includes('✔') || log.includes('passed');
                      return (
                        <div key={i} className={isCmd ? 'text-primary-on-dark font-semibold' : isSuccess ? 'text-emerald-400' : 'text-zinc-400'}>
                          {log}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ TAB 2: Whisper Audio Feed ════ */}
          {activeTab === 'whisper' && (
            <motion.div key="whisper" variants={fade} initial="hidden" animate="visible" exit="exit"
              className="absolute inset-0 flex flex-col bg-surface-black p-5 gap-4 overflow-hidden"
            >
              {/* Live audio waveform header */}
              <div className="flex items-center gap-3 pb-4">
                <Badge variant="danger" dot>Live Whisper AI</Badge>
                <div className="flex items-end gap-0.5 h-5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div key={i} className="w-[3px] rounded-full bg-primary-on-dark/60"
                      animate={{ height: whisperActive ? ['8px', `${12 + Math.sin(i * 0.9) * 10}px`, '6px'] : '4px' }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.07, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-body-muted/55 ml-auto">2-channel stereo · 16kHz</span>
              </div>

              {/* Transcript lines */}
              <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                {WHISPER_LINES.slice(0, visibleLines).map((line, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-[10px] font-mono text-body-muted/50 mt-0.5 w-10 shrink-0">{line.time}</span>
                    <span className={`text-[11px] font-semibold font-mono shrink-0 ${line.color}`}>{line.speaker}:</span>
                    <p className="text-[13px] text-body-muted/75 leading-relaxed">{line.text}</p>
                  </motion.div>
                ))}
                {visibleLines < WHISPER_LINES.length && (
                  <div className="flex items-center gap-2 text-[12px] text-body-muted/50 font-mono">
                    <span>▋</span>
                    <span>Transcribing...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════ TAB 3: AI Scorecard ════ */}
          {activeTab === 'scorecard' && (
            <motion.div key="scorecard" variants={fade} initial="hidden" animate="visible" exit="exit"
              className="absolute inset-0 flex flex-col bg-surface-black p-6 gap-5 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-mono text-body-muted/55 tracking-tight mb-1">AI Evaluation Report</p>
                  <h3 className="text-white font-display font-semibold text-[18px] tracking-tight">Alex (Candidate)</h3>
                  <p className="text-body-muted/50 text-[12px] mt-0.5">Linked List Reversal · TypeScript · 01:32 session</p>
                </div>
                <div className="flex flex-col items-center bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                  <span className="text-primary-on-dark font-display font-semibold text-[28px] leading-none">89</span>
                  <span className="text-[10px] text-primary-on-dark/70 font-mono tracking-tight mt-0.5">Overall</span>
                </div>
              </div>

              {/* Score bars */}
              <div className="flex flex-col gap-4">
                {SCORES.map((s, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-body-muted/75 font-medium">{s.label}</span>
                      <span className="text-[13px] font-mono font-semibold text-white">{s.score}</span>
                    </div>
                    <div className="h-[5px] w-full bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${s.bar}`}
                        initial={{ width: '0%' }}
                        animate={{ width: scoresVisible ? `${s.score}%` : '0%' }}
                        transition={{ duration: 0.9, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: scoresVisible ? 1 : 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-auto flex items-center gap-3 bg-primary/[0.07] border border-primary/20 rounded-lg px-4 py-3"
              >
                <TrendingUp className="w-5 h-5 text-primary-on-dark shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-sky-300">Strong Hire Recommended</p>
                  <p className="text-[11px] text-body-muted/50 mt-0.5">Candidate demonstrated clean algorithmic thinking and clear communication throughout the session.</p>
                </div>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Bottom AI Transcript Bar (editor tab only) ── */}
      <AnimatePresence>
        {activeTab === 'editor' && speechBubble.text && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="bg-surface-tile-2/70 px-5 py-3 flex items-start gap-3 shrink-0"
          >
            <Badge variant="primary" size="sm" className="tracking-tight shrink-0 rounded">
              <Shield className="w-2.5 h-2.5" /><span>AI transcript</span>
            </Badge>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-white text-[12px] mr-2">{speechBubble.speaker}:</span>
              <span className="text-[12px] text-body-muted leading-relaxed">{speechBubble.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
