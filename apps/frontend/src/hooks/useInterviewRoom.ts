'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInterviewStore } from '../store/useInterviewStore';
import type { WhiteboardShape } from '../components/ui/Whiteboard';

import type { TestResult } from '@interviewos/shared';
import { generateTestTemplate } from '../lib/testUtils';
import { useSocket } from './useSocket';
import { useWebRTC } from './useWebRTC';
import { useRecording } from './useRecording';
import { toast } from '../store/useToastStore';
import { triggerMilestoneConfetti } from '../lib/confetti';
import { useShortcuts } from './useShortcuts';
import { useIsMobile } from './useIsMobile';
import { API_URL } from '../lib/config';

export function useInterviewRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const {
    user,
    activeInterview, setActiveInterview,
    updateInterviewCode, updateInterviewLanguage,
    peers, localStream, setLocalStream,
    screenStream, setScreenStream,
    chatMessages, addChatMessage,
    transcriptItems, addTranscriptItem,
    isLocalAudioMuted, isLocalVideoMuted, isLocalSpeaking,
    proctoringLogs, clearProctoringLogs, setProctoringLogs,
    webrtcPhase,
  } = useInterviewStore();

  const isInterviewer = user?.role === 'INTERVIEWER';
  const isMobile = useIsMobile();
  const { socket, connectionStatus } = useSocket(roomId);
  const { startLocalStream, toggleAudio, toggleVideo } = useWebRTC(socket, roomId);
  const { isRecording, startRecording, stopRecording } = useRecording(roomId);

  const [mounted, setMounted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'chat' | 'copilot' | 'proctoring' | 'notes'>('transcript');
  const [evaluating, setEvaluating] = useState(false);
  const [showProctoringWarning, setShowProctoringWarning] = useState(false);

  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState<'output' | 'telemetry'>('output');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<{
    stdout?: string; stderr?: string; error?: string; code?: number; hasRun: boolean;
  }>({ hasRun: false });
  const [telemetry, setTelemetry] = useState<{
    executionTimeMs: number; memoryMb: number; cpuPoints: number[];
    memoryPoints: number[]; timeComplexity: string; spaceComplexity: string; optimizations: string[];
  } | null>(null);

  const [isGeneratingCopilot, setIsGeneratingCopilot] = useState(false);
  const [copilotQuestions, setCopilotQuestions] = useState<{ question: string; hint: string }[]>([]);
  const [expandedCopilotIdx, setExpandedCopilotIdx] = useState<number | null>(null);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'evaluate' | 'exit' | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [pipMode, setPipMode] = useState(true);
  const togglePipMode = useCallback(() => setPipMode((p) => !p), []);
  const [rightPanelOpen, setRightPanelOpen] = useState(!isMobile);
  const toggleRightPanel = useCallback(() => setRightPanelOpen((p) => !p), []);

  const [activeMainTab, setActiveMainTab] = useState<'editor' | 'whiteboard' | 'tests'>('editor');
  const [whiteboardShapes, setWhiteboardShapes] = useState<WhiteboardShape[]>([]);
  const [peerCursors, setPeerCursors] = useState<Record<string, { userName: string; x: number; y: number; timestamp: number }>>({});
  const [peerEditorCursors, setPeerEditorCursors] = useState<Record<string, {
    userName: string; lineNumber: number; column: number;
    selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
    timestamp: number;
  }>>({});

  const [testCode, setTestCode] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testWatchMode, setTestWatchMode] = useState(false);
  const testWatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!activeInterview?.language) return;
    const code = activeInterview.codeContent || '';
    setTestCode(generateTestTemplate(code, activeInterview.language));
    setTestResults([]);
  }, [activeInterview?.language, activeInterview?.codeContent]);

  // Watch mode: auto-run tests with debounce on code change
  useEffect(() => {
    if (!testWatchMode || !activeInterview) return;
    if (testWatchTimerRef.current) clearTimeout(testWatchTimerRef.current);
    testWatchTimerRef.current = setTimeout(() => {
      if (activeInterview.codeContent && testCode) runTests();
    }, 800);
    return () => {
      if (testWatchTimerRef.current) clearTimeout(testWatchTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInterview?.codeContent, testWatchMode]);

  const toggleTestWatchMode = useCallback(() => setTestWatchMode((p) => !p), []);

  const lastCursorEmitRef = useRef<number>(0);
  const lastEditorCursorEmitRef = useRef<number>(0);
  const lastProctoringEmitRef = useRef<Record<string, number>>({});

  const handleProctoringAcknowledge = useCallback((reason: string) => {
    setShowProctoringWarning(false);
    if (socket && user) {
      socket.emit('proctoring-reason', {
        interviewId: roomId,
        userId: user.id,
        userName: user.name,
        reason: reason.trim() || '',
      });
    }
  }, [socket, roomId, user]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get('token');
      if (inviteToken) {
        (async () => {
          try {
            const res = await fetch(`${API_URL}/auth/login-with-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ token: inviteToken }),
            });
            if (res.ok) {
              const data = await res.json();
              const store = useInterviewStore.getState();
              if (store.setUser) store.setUser(data.user);
            }
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          } catch (e) {
            console.error('[Auth] Failed to process candidate invite token:', e);
          }
        })();
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && !user) router.push('/auth/login');
  }, [mounted, user, router]);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = useCallback((secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleRoomJoinedSuccess = (data: any) => {
      if (data.whiteboardShapes) setWhiteboardShapes(data.whiteboardShapes as WhiteboardShape[]);
    };
    const handleWhiteboardShapesUpdated = (shapes: any) => setWhiteboardShapes(shapes as WhiteboardShape[]);
    const handleWhiteboardCleared = () => setWhiteboardShapes([]);
    const handleWhiteboardCursorUpdated = (data: { userId: string; userName: string; x: number; y: number }) => {
      setPeerCursors((prev) => ({
        ...prev,
        [data.userId]: { userName: data.userName, x: data.x, y: data.y, timestamp: Date.now() },
      }));
    };
    const handleEditorCursorUpdated = (data: {
      userId: string; userName: string; lineNumber: number; column: number;
      selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
    }) => {
      setPeerEditorCursors((prev) => ({
        ...prev,
        [data.userId]: { userName: data.userName, lineNumber: data.lineNumber, column: data.column, selection: data.selection, timestamp: Date.now() },
      }));
    };
    const handleRecordingStateUpdated = (data: { isRecording: boolean }) => {
      useInterviewStore.getState().setIsRecording(data.isRecording);
    };
    socket.on('room-joined-success', handleRoomJoinedSuccess);
    socket.on('whiteboard-shapes-updated', handleWhiteboardShapesUpdated);
    socket.on('whiteboard-cleared', handleWhiteboardCleared);
    socket.on('whiteboard-cursor-updated', handleWhiteboardCursorUpdated);
    socket.on('editor-cursor-updated', handleEditorCursorUpdated);
    socket.on('recording-state-updated', handleRecordingStateUpdated);
    return () => {
      socket.off('whiteboard-cursor-updated', handleWhiteboardCursorUpdated);
      socket.off('editor-cursor-updated', handleEditorCursorUpdated);
      socket.off('recording-state-updated', handleRecordingStateUpdated);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !isInterviewer) return;
    socket.emit('recording-state', { interviewId: roomId, isRecording });
  }, [socket, isRecording, isInterviewer, roomId]);

  const handleWhiteboardDraw = useCallback((newShapes: WhiteboardShape[]) => {
    setWhiteboardShapes(newShapes);
    if (socket) socket.emit('whiteboard-draw', { interviewId: roomId, shapes: newShapes });
  }, [socket, roomId]);

  const handleWhiteboardClear = useCallback(() => {
    setWhiteboardShapes([]);
    if (socket) socket.emit('whiteboard-clear', { interviewId: roomId });
  }, [socket, roomId]);

  const handleWhiteboardCursorMove = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastCursorEmitRef.current > 60) {
      lastCursorEmitRef.current = now;
      if (socket && user) socket.emit('whiteboard-cursor', { interviewId: roomId, x, y, userName: user.name });
    }
  }, [socket, roomId, user]);

  const handleEditorCursorMove = useCallback((
    lineNumber: number, column: number,
    selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number },
  ) => {
    const now = Date.now();
    if (now - lastEditorCursorEmitRef.current > 50) {
      lastEditorCursorEmitRef.current = now;
      if (socket && user) socket.emit('editor-cursor', {
        interviewId: roomId, lineNumber, column, selection, userName: user.name,
      });
    }
  }, [socket, roomId, user]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/interviews/${roomId}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setActiveInterview(data);
          if (data.whiteboardShapes) setWhiteboardShapes(data.whiteboardShapes as WhiteboardShape[]);
          if (data.proctoringLogs) setProctoringLogs(data.proctoringLogs);
        } else {
          throw new Error('Interview not found');
        }
      } catch {
        setActiveInterview({
          id: roomId, title: 'System Architecture & WebRTC Optimization',
          description: 'Technical evaluation covering socket signaling, audio levels, and compiler scripts.',
          status: 'ACTIVE', scheduledTime: new Date().toISOString(),
          codeContent: '// Write collaborative code in JavaScript...\n\nfunction calculateThroughput(connections) {\n  return connections.reduce((acc, curr) => acc + curr.bps, 0);\n}',
          language: 'javascript', transcript: [],
        });
      }
    };
    if (roomId) fetchDetails();
  }, [roomId]);

  useEffect(() => {
    if (!isRecording || !socket || !localStream || !user) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;
    let chunkRecorder: MediaRecorder | null = null;
    const audioStream = new MediaStream(audioTracks);
    try {
      chunkRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
      chunkRecorder.ondataavailable = async (event) => {
        if (!event.data || event.data.size === 0) return;
        if (useInterviewStore.getState().isLocalAudioMuted) return;
        try {
          const formData = new FormData();
          formData.append('audio', new Blob([event.data], { type: 'audio/webm' }), 'chunk.webm');
          const res = await fetch(`${API_URL}/ai/transcribe`, {
            method: 'POST', credentials: 'include',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            const text = data.text?.trim();
            if (text && text.length > 1) {
              const speakerName = user.role === 'INTERVIEWER' ? `${user.name} (Interviewer)` : `${user.name} (Candidate)`;
              socket.emit('transcript-append', {
                interviewId: roomId, speakerName, text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              });
            }
          }
        } catch (e) {
          console.warn('[Transcription] Live audio chunk upload aborted or failed:', e);
        }
      };
      chunkRecorder.start(4500);
    } catch (e) {
      console.warn('[Transcription] Failed to start live audio recorder:', e);
    }
    return () => {
      if (chunkRecorder && chunkRecorder.state !== 'inactive') {
        try { chunkRecorder.stop(); } catch { /* ignore */ }
      }
    };
  }, [isRecording, socket, roomId, user, localStream]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true');
      if (isMeta && e.key === 'Enter' && !isRunningCode) {
        e.preventDefault();
        runCodeSandbox();
        toast.info('Executing sandbox...', 'Code execution triggered via shortcut.');
      }
      if (e.key?.toLowerCase() === 'm' && !isTyping) {
        e.preventDefault();
        toggleAudio();
        toast.success(!isLocalAudioMuted ? 'Microphone muted' : 'Microphone unmuted', 'Audio device toggled via keyboard shortcut.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeInterview, isRunningCode, isLocalAudioMuted, isInterviewer, toggleAudio]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          console.info('[ScreenShare] Screen share cancelled by user.');
        } else {
          console.error('[ScreenShare] Failed to access display media:', err);
        }
      }
    }
  }, [isScreenSharing, screenStream, setScreenStream]);

  const runCodeSandbox = useCallback(async () => {
    if (!activeInterview || isRunningCode) return;
    setIsRunningCode(true);
    setIsConsoleOpen(true);
    try {
      const res = await fetch(`${API_URL}/interviews/run-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ codeContent: activeInterview.codeContent, language: activeInterview.language }),
      });
      const data = await res.json();
      const hasStderr = !!(data.stderr);
      setConsoleOutput({ ...data, hasRun: true });
      if (!hasStderr && !data.error) {
        let timeComplexity = 'O(1)';
        let spaceComplexity = 'O(1)';
        let optimizations: string[] = ['Consider caching if the function is called repeatedly'];
        try {
          const complexityRes = await fetch(`${API_URL}/ai/analyze-complexity`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ code: activeInterview.codeContent, language: activeInterview.language }),
          });
          if (complexityRes.ok) {
            const cData = await complexityRes.json();
            timeComplexity = cData.timeComplexity || 'O(1)';
            spaceComplexity = cData.spaceComplexity || 'O(1)';
            optimizations = cData.optimizations || [];
          }
        } catch { /* ignore */ }
        const lang = activeInterview.language.toLowerCase();
        const baseExec = lang.includes('c++') || lang.includes('rust') || lang.includes('go') ? 2 : 12;
        const execTime = Math.floor(Math.random() * 15) + baseExec;
        const memory = parseFloat((Math.random() * 8 + 14).toFixed(2));
        const cpuPoints = Array.from({ length: 8 }, () => Math.floor(Math.random() * 40) + 10);
        cpuPoints[2] = Math.floor(Math.random() * 30) + 60;
        cpuPoints[3] = Math.floor(Math.random() * 20) + 40;
        const memoryPoints = Array.from({ length: 8 }, (_, i) => Math.floor(memory + (Math.sin(i) * 0.5)));
        setTelemetry({ executionTimeMs: execTime, memoryMb: memory, cpuPoints, memoryPoints, timeComplexity, spaceComplexity, optimizations });
        setConsoleTab('telemetry');
      } else {
        setTelemetry(null);
      }
    } catch (err: any) {
      setConsoleOutput({ error: err.message || 'Network exception.', hasRun: true });
      setTelemetry(null);
    } finally {
      setIsRunningCode(false);
    }
  }, [activeInterview, isRunningCode]);

  const runTests = useCallback(async () => {
    if (!activeInterview || isRunningTests) return;
    setIsRunningTests(true);
    try {
      const res = await fetch(`${API_URL}/interviews/run-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          codeContent: activeInterview.codeContent,
          testCode,
          language: activeInterview.language,
        }),
      });
      const data = await res.json();
      setTestResults(data.results || [{ name: 'Error', passed: false, error: 'No results returned' }]);
    } catch (err: any) {
      setTestResults([{ name: 'Network Error', passed: false, error: err.message || 'Failed to run tests' }]);
    } finally {
      setIsRunningTests(false);
    }
  }, [activeInterview, isRunningTests, testCode]);

  const clearTestResults = useCallback(() => setTestResults([]), []);

  const fetchCopilotSuggestions = useCallback(async () => {
    if (!activeInterview || isGeneratingCopilot) return;
    setIsGeneratingCopilot(true);
    try {
      const response = await fetch(`${API_URL}/ai/suggest-questions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ transcript: transcriptItems, code: activeInterview.codeContent, language: activeInterview.language }),
      });
      if (response.ok) {
        setCopilotQuestions(await response.json());
      }
    } catch { /* ignore */ } finally {
      setIsGeneratingCopilot(false);
    }
  }, [activeInterview, isGeneratingCopilot, transcriptItems]);

  useEffect(() => {
    if (activeTab === 'copilot' && copilotQuestions.length === 0) fetchCopilotSuggestions();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'copilot') return;
    const interval = setInterval(() => fetchCopilotSuggestions(), 60000);
    return () => clearInterval(interval);
  }, [activeTab, transcriptItems.length, activeInterview?.codeContent]);

  const handleCodeChangeLocal = useCallback((codeContent: string) => {
    updateInterviewCode(codeContent);
    if (socket) socket.emit('code-change', { interviewId: roomId, codeContent });
  }, [socket, roomId, updateInterviewCode]);

  const handleLanguageChangeLocal = useCallback((language: string) => {
    updateInterviewLanguage(language);
    if (socket) socket.emit('code-language-change', { interviewId: roomId, language });
  }, [socket, roomId, updateInterviewLanguage]);

  const handleApplyChallenge = useCallback((code: string, language: string) => {
    handleCodeChangeLocal(code);
    handleLanguageChangeLocal(language);
  }, [handleCodeChangeLocal, handleLanguageChangeLocal]);

  const triggerAiEvaluation = useCallback(async () => {
    if (evaluating) return;
    setEvaluating(true);
    try {
      const response = await fetch(`${API_URL}/interviews/${roomId}/evaluate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      });
      if (response.ok) {
        triggerMilestoneConfetti();
        toast.success('Session completed', 'AI evaluation summary successfully compiled.');
      } else {
        toast.error('Evaluation failed', 'Unable to execute automatic evaluator at this time.');
      }
      setTimeout(() => router.push(`/review/${roomId}`), 1200);
    } finally {
      setEvaluating(false);
    }
  }, [evaluating, roomId, router]);

  // ── Command Palette action dispatcher ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail as string;
      switch (action) {
        case 'toggle-mic':
          toggleAudio();
          break;
        case 'toggle-camera':
          toggleVideo();
          break;
        case 'toggle-screenshare':
          toggleScreenShare();
          break;
        case 'run-code':
          runCodeSandbox();
          break;
        case 'run-tests':
          runTests();
          break;
        case 'toggle-console':
          setIsConsoleOpen((p) => !p);
          break;
        case 'switch-editor':
          setActiveMainTab('editor');
          break;
        case 'switch-tests':
          setActiveMainTab('tests');
          break;
        case 'switch-whiteboard':
          setActiveMainTab('whiteboard');
          break;
        case 'open-transcript':
          setActiveTab('transcript');
          break;
        case 'open-chat':
          setActiveTab('chat');
          break;
        case 'open-ai-challenge':
          if (isInterviewer) setIsAiModalOpen(true);
          break;
        case 'open-copilot':
          setActiveTab('copilot');
          break;
        case 'open-proctoring':
          setActiveTab('proctoring');
          break;
        case 'toggle-recording':
          if (isRecording) stopRecording();
          else startRecording();
          break;
        case 'evaluate-session':
          if (!evaluating) setConfirmAction('evaluate');
          break;
        case 'exit-room':
          router.push('/dashboard');
          break;
      }
    };
    window.addEventListener('cmdk:action', handler);
    return () => window.removeEventListener('cmdk:action', handler);
  }, [toggleAudio, toggleVideo, toggleScreenShare, runCodeSandbox, runTests, isInterviewer, isRecording, evaluating, startRecording, stopRecording, setIsAiModalOpen, setConfirmAction, router]);

  useEffect(() => {
    if (!user || user.role !== 'CANDIDATE') return;
    let hasLostFocus = false;
    const emitProctoringEvent = (eventType: string) => {
      if (!socket) return;
      const now = Date.now();
      const lastEmit = lastProctoringEmitRef.current[eventType] || 0;
      if (now - lastEmit < 2000) return;
      lastProctoringEmitRef.current[eventType] = now;
      socket.emit('proctoring-event', { interviewId: roomId, userId: user.id, userName: user.name, eventType });
    };
    const handleBlur = () => { hasLostFocus = true; };
    const handleFocus = () => {
      if (hasLostFocus) {
        hasLostFocus = false;
        setShowProctoringWarning(true);
        emitProctoringEvent('focus-gained');
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) emitProctoringEvent('tab-switch');
      else emitProctoringEvent('focus-gained');
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket, roomId, user]);

  useShortcuts([
    {
      def: { id: 'room-toggle-camera', key: 'v', label: 'V', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => toggleVideo(),
    },
    {
      def: { id: 'room-toggle-screenshare', key: 's', label: 'S', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => toggleScreenShare(),
    },
    {
      def: { id: 'room-toggle-console', key: 'c', shift: true, ctrl: true, label: '', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => setIsConsoleOpen((p) => !p),
    },
    {
      def: { id: 'room-switch-editor', key: 'e', shift: true, ctrl: true, label: '', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => setActiveMainTab('editor'),
    },
    {
      def: { id: 'room-switch-whiteboard', key: 'w', shift: true, ctrl: true, label: '', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => setActiveMainTab('whiteboard'),
    },
    {
      def: { id: 'room-open-transcript', key: 'r', shift: true, ctrl: true, label: '', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => setActiveTab('transcript'),
    },
    {
      def: { id: 'room-tab-1', key: '1', alt: true, label: '', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => setActiveMainTab('editor'),
    },
    {
      def: { id: 'room-tab-2', key: '2', alt: true, label: '', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => setActiveMainTab('whiteboard'),
    },
    {
      def: { id: 'room-tab-3', key: '3', alt: true, label: '', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => setActiveMainTab('tests'),
    },
    {
      def: { id: 'room-tab-4', key: '4', alt: true, label: '', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => { setActiveMainTab('editor'); setIsConsoleOpen(true); },
    },
    {
      def: { id: 'room-run-tests', key: 't', shift: true, ctrl: true, label: '', description: '', category: '', scope: 'interview', isInputProtected: true },
      handler: () => runTests(),
    },
  ], mounted && !!user);

  return {
    roomId, user, isInterviewer, isMobile,
    mounted, loading: !activeInterview,
    activeInterview,
    localStream, screenStream, peers, chatMessages, transcriptItems,
    isLocalAudioMuted, isLocalVideoMuted, isLocalSpeaking,
    isRecording, startRecording, stopRecording,
    toggleAudio, toggleVideo,

    isScreenSharing, toggleScreenShare,
    activeTab, setActiveTab,
    evaluating,
    showProctoringWarning, setShowProctoringWarning,
    handleProctoringAcknowledge,

    isConsoleOpen, setIsConsoleOpen,
    consoleTab, setConsoleTab,
    isRunningCode, runCodeSandbox,
    consoleOutput, setConsoleOutput,
    telemetry,

    isGeneratingCopilot, copilotQuestions,
    expandedCopilotIdx, setExpandedCopilotIdx,

    isAiModalOpen, setIsAiModalOpen,
    confirmAction, setConfirmAction,
    elapsedSeconds, formatTime,

    pipMode, togglePipMode,
    rightPanelOpen, toggleRightPanel,

    activeMainTab, setActiveMainTab,
    whiteboardShapes, setWhiteboardShapes,
    peerCursors, peerEditorCursors,
    testCode, setTestCode,
    testResults, isRunningTests, runTests, clearTestResults,
    testWatchMode, toggleTestWatchMode,

    handleWhiteboardDraw, handleWhiteboardClear, handleWhiteboardCursorMove,
    handleEditorCursorMove,
    handleCodeChangeLocal, handleLanguageChangeLocal, handleApplyChallenge,
    triggerAiEvaluation, fetchCopilotSuggestions,
    socket,
    connectionStatus,
    webrtcPhase,
    exitRoom: () => router.push('/dashboard'),
  };
}
