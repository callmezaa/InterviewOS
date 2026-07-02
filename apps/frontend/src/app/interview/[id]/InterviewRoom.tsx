'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Radio, Award, Loader2, LogOut, Code, Palette, Scan, PanelRightClose, PanelRightOpen, Beaker } from 'lucide-react';
import { EditorSkeleton, WhiteboardSkeleton } from '../../../components/ui/Skeleton';
import { useInterviewRoom } from '../../../hooks/useInterviewRoom';
import { Header } from '../../../components/ui/Header';
import { Button } from '../../../components/ui/Button';
import { AIQuestionGeneratorModal } from '../../../components/ui/AIQuestionGeneratorModal';
import { ConsolePanel } from './components/ConsolePanel';
import { RightPanel } from './components/RightPanel';
import { TestPanel } from './components/TestPanel';
import { RoomSkeleton } from './components/RoomSkeleton';
import { VideoGrid } from '../../../components/interview/VideoGrid';
import { ProctoringWarningModal } from '../../../components/interview/ProctoringWarningModal';
import { WebRTCConnectingOverlay } from '../../../components/interview/WebRTCConnectingOverlay';
import { DeviceCheckModal } from '../../../components/interview/DeviceCheckModal';
import { useDeviceCheck } from '../../../hooks/useDeviceCheck';
import { useInterviewStore } from '../../../store/useInterviewStore';
import { ConnectionHealth } from '../../../components/ui/ConnectionHealth';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
import { KeyboardShortcutsSheet } from '../../../components/ui/KeyboardShortcutsSheet';
import { GuidedTour, INTERVIEW_ROOM_INTERVIEWER_TOUR, INTERVIEW_ROOM_CANDIDATE_TOUR } from '../../../components/ui/GuidedTour';

// Lazy load heavy components (Monaco Editor ~2MB + Whiteboard canvas)
const WorkspaceEditor = dynamic(
  () => import('../../../components/ui/WorkspaceEditor').then((mod) => mod.WorkspaceEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

const Whiteboard = dynamic(
  () => import('../../../components/ui/Whiteboard').then((mod) => mod.Whiteboard),
  {
    ssr: false,
    loading: () => <WhiteboardSkeleton />,
  }
);

export default function InterviewRoom() {
  const {
    roomId, user, isInterviewer, isMobile,
    mounted, loading, activeInterview,
    localStream, screenStream, peers,
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

    pipMode, togglePipMode,
    rightPanelOpen, toggleRightPanel,

    isAiModalOpen, setIsAiModalOpen,
    confirmAction, setConfirmAction,
    elapsedSeconds, formatTime,
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
    socket, connectionStatus,
    webrtcPhase, exitRoom,
  } = useInterviewRoom();

  const [focusMode, setFocusMode] = useState(!isInterviewer);
  const toggleFocusMode = useCallback(() => setFocusMode((p) => !p), []);
  const [shortcutsSheetOpen, setShortcutsSheetOpen] = useState(false);
  const [showConnectingOverlay, setShowConnectingOverlay] = useState(true);
  const [showDeviceCheck, setShowDeviceCheck] = useState(true);
  const [showTour, setShowTour] = useState(false);

  const tourSteps = isInterviewer ? INTERVIEW_ROOM_INTERVIEWER_TOUR : INTERVIEW_ROOM_CANDIDATE_TOUR;

  const deviceCheck = useDeviceCheck();

  useEffect(() => {
    if (showDeviceCheck && activeInterview) {
      deviceCheck.actions.enumerateDevices();
    }
  }, [showDeviceCheck, activeInterview]);

  useEffect(() => {
    const handler = () => setShowTour(true);
    window.addEventListener('room-tour:restart', handler);
    return () => window.removeEventListener('room-tour:restart', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const el = document.activeElement;
        const isTyping = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.getAttribute('contenteditable') === 'true');
        if (!isTyping) {
          e.preventDefault();
          setShortcutsSheetOpen((p) => !p);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleDeviceCheckComplete = useCallback(() => {
    const { selectedCamera, selectedMicrophone, selectedSpeaker } = deviceCheck.state;
    if (selectedCamera || selectedMicrophone || selectedSpeaker) {
      useInterviewStore.getState().setDevicePreferences({
        cameraId: selectedCamera ?? undefined,
        microphoneId: selectedMicrophone ?? undefined,
        speakerId: selectedSpeaker ?? undefined,
      });
    }
    setShowDeviceCheck(false);

    const tourKey = isInterviewer ? 'room_tour_interviewer_done' : 'room_tour_candidate_done';
    if (!localStorage.getItem(tourKey)) {
      setTimeout(() => setShowTour(true), 400);
    }
  }, [deviceCheck.state, isInterviewer]);

  if (!mounted || !user || !activeInterview) {
    return <RoomSkeleton />;
  }

  return (
    <main id="main-content" className="h-screen w-full bg-surface-black text-white flex flex-col font-sans overflow-hidden select-none">
      <Header
        subTitle={activeInterview.title}
        subActions={
          <>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.06] text-body-muted/70 rounded-full text-[12px] font-mono select-none">
              <Clock className="w-3.5 h-3.5 text-primary-on-dark/60 animate-pulse" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
            <ConnectionHealth status={connectionStatus} peers={peers} />
            <button
              onClick={toggleRightPanel}
              data-tour="room-right-panel"
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label={rightPanelOpen ? 'Close side panel' : 'Open side panel'}
            >
              {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleFocusMode}
              data-tour="room-focus-mode"
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
                focusMode
                  ? 'bg-primary text-white'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}
              aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
            >
              <Scan className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShortcutsSheetOpen(true)}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.08] transition-all font-mono text-[15px] font-semibold"
              aria-label="Keyboard shortcuts"
            >
              ?
            </button>
            {!focusMode && isRecording && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-pill text-[12px]">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-semibold text-[10px]">Rec</span>
              </div>
            )}
            {!focusMode && isInterviewer && (
              <Button
                variant="ghost"
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-8 py-0 px-3 flex items-center gap-1.5 font-normal ${
                  isRecording
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                    : 'bg-white/[0.04] text-white/80 border-white/[0.06] hover:bg-white/[0.08]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isRecording ? 'Stop Rec' : 'Record'}</span>
              </Button>
            )}
            {!focusMode && isInterviewer && (
              <Button
                variant="primary"
                disabled={evaluating}
                onClick={() => setConfirmAction('evaluate')}
                className="h-8 py-0 px-3 flex items-center gap-1.5 text-[12px]"
              >
                {evaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                <span>Evaluate Session</span>
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setConfirmAction('exit')}
              className="h-8 py-0 px-3 flex items-center gap-1.5 border border-white/[0.06] hover:bg-white/[0.04]"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Exit</span>
            </Button>
          </>
        }
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4">
        {/* Panel 1: Video Sidebar (hidden in PIP mode) */}
        {!pipMode && (
          <ErrorBoundary name="VideoGrid" onError={() => console.warn('VideoGrid crashed — recovering gracefully')}>
            <div data-tour="room-video">
            <VideoGrid
              localStream={localStream}
              screenStream={screenStream}
              peers={peers}
              user={user}
              isLocalAudioMuted={isLocalAudioMuted}
              isLocalVideoMuted={isLocalVideoMuted}
              isLocalSpeaking={isLocalSpeaking}
              isScreenSharing={isScreenSharing}
              hideSelfVideo={user.role === 'CANDIDATE'}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={toggleScreenShare}
              onTogglePipMode={togglePipMode}
            />
            </div>
          </ErrorBoundary>
        )}

        {/* Panel 2: Main Content (Editor/Whiteboard + Console) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div data-tour="room-tabs" className="flex items-center gap-2 border-b border-white/[0.06] pb-2 shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
              <button
                id="tab-editor"
                role="tab"
                aria-selected={activeMainTab === 'editor'}
                aria-controls="panel-editor"
                onClick={() => setActiveMainTab('editor')}
                className={`px-3 sm:px-4 py-1.5 rounded-pill text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeMainTab === 'editor'
                    ? 'bg-primary text-white'
                    : 'text-white/55 hover:text-white/80 hover:bg-white/[0.02]'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Code Editor</span>
                <span className="inline xs:hidden sm:hidden">Editor</span>
              </button>
              <button
                id="tab-tests"
                role="tab"
                aria-selected={activeMainTab === 'tests'}
                aria-controls="panel-tests"
                onClick={() => setActiveMainTab('tests')}
                className={`px-3 sm:px-4 py-1.5 rounded-pill text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeMainTab === 'tests'
                    ? 'bg-primary text-white'
                    : 'text-white/55 hover:text-white/80 hover:bg-white/[0.02]'
                }`}
              >
                <Beaker className="w-3.5 h-3.5" />
                <span>Tests</span>
              </button>
              <button
                id="tab-whiteboard"
                role="tab"
                aria-selected={activeMainTab === 'whiteboard'}
                aria-controls="panel-whiteboard"
                onClick={() => setActiveMainTab('whiteboard')}
                className={`px-3 sm:px-4 py-1.5 rounded-pill text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeMainTab === 'whiteboard'
                    ? 'bg-primary text-white'
                    : 'text-white/55 hover:text-white/80 hover:bg-white/[0.02]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Whiteboard</span>
              </button>
            </div>

            {activeMainTab === 'editor' ? (
              <>
                <div id="panel-editor" data-tour="room-editor" role="tabpanel" aria-labelledby="tab-editor" className="flex-1 min-h-0">
                  <ErrorBoundary name="WorkspaceEditor">
                    <WorkspaceEditor
                      value={activeInterview.codeContent}
                      onChange={handleCodeChangeLocal}
                      language={activeInterview.language}
                      onLanguageChange={handleLanguageChangeLocal}
                      onRun={runCodeSandbox}
                      isRunning={isRunningCode}
                      showAiGenerator={isInterviewer}
                      onOpenAiGenerator={() => setIsAiModalOpen(true)}
                      remoteCursors={peerEditorCursors}
                      onCursorChange={handleEditorCursorMove}
                      testResults={testResults}
                    />
                  </ErrorBoundary>
                </div>
                {(!focusMode || !isInterviewer) && (
                  <ConsolePanel
                    isConsoleOpen={isConsoleOpen}
                    setIsConsoleOpen={setIsConsoleOpen}
                    consoleTab={consoleTab}
                    setConsoleTab={setConsoleTab}
                    isRunningCode={isRunningCode}
                    consoleOutput={consoleOutput}
                    setConsoleOutput={setConsoleOutput}
                    telemetry={telemetry}
                  />
                )}
              </>
            ) : activeMainTab === 'tests' ? (
              <div id="panel-tests" role="tabpanel" aria-labelledby="tab-tests" className="flex-1 min-h-0">
                <ErrorBoundary name="TestPanel">
                  <TestPanel
                    testCode={testCode}
                    onTestCodeChange={setTestCode}
                    onRunTests={runTests}
                    isRunning={isRunningTests}
                    results={testResults}
                    language={activeInterview.language}
                    onClearResults={clearTestResults}
                    watchMode={testWatchMode}
                    onToggleWatch={toggleTestWatchMode}
                  />
                </ErrorBoundary>
              </div>
            ) : (
              <div id="panel-whiteboard" role="tabpanel" aria-labelledby="tab-whiteboard" className="flex-1 min-h-0">
                <ErrorBoundary name="Whiteboard">
                  <Whiteboard
                    shapes={whiteboardShapes}
                    onDraw={handleWhiteboardDraw}
                    onClear={handleWhiteboardClear}
                    onCursorMove={handleWhiteboardCursorMove}
                    peerCursors={peerCursors}
                  />
                </ErrorBoundary>
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Collapsible Info Panel (hidden in focus mode or when toggled off) */}
        {rightPanelOpen && !focusMode && (isMobile ? (
          <AnimatePresence>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={toggleRightPanel}
            />
            <motion.div
              key="panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-surface-tile-1 border-t border-white/[0.06] rounded-t-2xl overflow-hidden"
            >
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-2 mb-1" />
              <RightPanel
                socket={socket}
                roomId={roomId}
                isRecording={isRecording}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                copilotQuestions={copilotQuestions}
                isGeneratingCopilot={isGeneratingCopilot}
                fetchCopilotSuggestions={fetchCopilotSuggestions}
                expandedCopilotIdx={expandedCopilotIdx}
                setExpandedCopilotIdx={setExpandedCopilotIdx}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <RightPanel
            socket={socket}
            roomId={roomId}
            isRecording={isRecording}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            copilotQuestions={copilotQuestions}
            isGeneratingCopilot={isGeneratingCopilot}
            fetchCopilotSuggestions={fetchCopilotSuggestions}
            expandedCopilotIdx={expandedCopilotIdx}
            setExpandedCopilotIdx={setExpandedCopilotIdx}
          />
        ))}
      </div>

      {pipMode && (
        <ErrorBoundary name="VideoGrid" onError={() => console.warn('VideoGrid crashed — recovering gracefully')}>
          <div data-tour="room-video">
          <VideoGrid
            localStream={localStream}
            screenStream={screenStream}
            peers={peers}
            user={user}
            isLocalAudioMuted={isLocalAudioMuted}
            isLocalVideoMuted={isLocalVideoMuted}
            isLocalSpeaking={isLocalSpeaking}
            isScreenSharing={isScreenSharing}
            hideSelfVideo={user.role === 'CANDIDATE'}
            pipMode
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={toggleScreenShare}
            onTogglePipMode={togglePipMode}
          />
          </div>
        </ErrorBoundary>
      )}

      {isAiModalOpen && (
        <AIQuestionGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onApplyChallenge={handleApplyChallenge}
          
        />
      )}

      <ConfirmDialog
        isOpen={confirmAction === 'exit'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { setConfirmAction(null); exitRoom(); }}
        title="Exit interview room?"
        description="Are you sure you want to exit the call? You can rejoin later as long as the session is not completed."
        confirmText="Yes, Exit"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmAction === 'evaluate'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { setConfirmAction(null); triggerAiEvaluation(); }}
        title="Evaluate & End Session?"
        description="This will immediately terminate the collaborative workspace and execute the post-session AI review. This action cannot be undone."
        confirmText={evaluating ? 'Evaluating...' : 'End & Evaluate'}
        isLoading={evaluating}
        variant="warning"
      />

      <KeyboardShortcutsSheet
        isOpen={shortcutsSheetOpen}
        onClose={() => setShortcutsSheetOpen(false)}
      />

      <ProctoringWarningModal
        show={showProctoringWarning}
        onAcknowledge={handleProctoringAcknowledge}
      />

      <AnimatePresence>
        {showDeviceCheck && activeInterview && (
          <DeviceCheckModal
            state={deviceCheck.state}
            actions={deviceCheck.actions}
            onComplete={handleDeviceCheckComplete}
            onSkip={handleDeviceCheckComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConnectingOverlay && webrtcPhase !== 'connected' && webrtcPhase !== 'idle' && (
          <WebRTCConnectingOverlay
            phase={webrtcPhase}
            interviewTitle={activeInterview?.title}
            onDismiss={() => setShowConnectingOverlay(false)}
          />
        )}
      </AnimatePresence>

      {showTour && (
        <GuidedTour
          steps={tourSteps}
          onComplete={() => {
            const tourKey = isInterviewer ? 'room_tour_interviewer_done' : 'room_tour_candidate_done';
            localStorage.setItem(tourKey, 'true');
            setShowTour(false);
          }}
          onSkip={() => {
            const tourKey = isInterviewer ? 'room_tour_interviewer_done' : 'room_tour_candidate_done';
            localStorage.setItem(tourKey, 'true');
            setShowTour(false);
          }}
          role={isInterviewer ? 'INTERVIEWER' : 'CANDIDATE'}
        />
      )}
    </main>
  );
}
