'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { EditorSkeleton, WhiteboardSkeleton } from '../../../components/ui/Skeleton';
import { useInterviewRoom } from '../../../hooks/useInterviewRoom';
import { InterviewRoomHeader } from '../../../components/interview/InterviewRoomHeader';
import { InterviewToolbar } from '../../../components/interview/InterviewToolbar';
import { AIQuestionGeneratorModal } from '../../../components/ui/AIQuestionGeneratorModal';
import { ConsolePanel } from './components/ConsolePanel';
import { RightPanel } from './components/RightPanel';
import { TestPanel } from './components/TestPanel';
import { RoomSkeleton } from './components/RoomSkeleton';
import { VideoGrid } from '../../../components/interview/VideoGrid';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
import { KeyboardShortcutsSheet } from '../../../components/ui/KeyboardShortcutsSheet';

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
    exitRoom,
  } = useInterviewRoom();

  const [focusMode, setFocusMode] = useState(!isInterviewer);
  const toggleFocusMode = useCallback(() => setFocusMode((p) => !p), []);
  const [shortcutsSheetOpen, setShortcutsSheetOpen] = useState(false);

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

  if (!mounted || !user || !activeInterview) {
    return <RoomSkeleton />;
  }

  return (
    <main id="main-content" className="h-screen w-full bg-surface-black text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Minimal Header */}
      <InterviewRoomHeader
        title={activeInterview.title}
        elapsedSeconds={elapsedSeconds}
        formatTime={formatTime}
        connectionStatus={connectionStatus}
        peers={peers}
        onExit={() => setConfirmAction('exit')}
      />

      {/* Compact Toolbar */}
      <InterviewToolbar
        activeMainTab={activeMainTab}
        onTabChange={setActiveMainTab}
        isInterviewer={isInterviewer}
        isRecording={isRecording}
        focusMode={focusMode}
        onToggleFocusMode={toggleFocusMode}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={toggleRightPanel}
        onShowShortcuts={() => setShortcutsSheetOpen(true)}
        onEvaluate={() => setConfirmAction('evaluate')}
        onExit={() => setConfirmAction('exit')}
      />

      {/* Main Content Area: Video + Editor + Right Panel */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Video Sidebar (left, top/bottom stacked) */}
        <div className="w-[240px] flex flex-col gap-2 p-2 shrink-0 border-r border-white/[0.06] overflow-y-auto">
          <ErrorBoundary name="VideoGrid" onError={() => console.warn('VideoGrid crashed — recovering gracefully')}>
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
          </ErrorBoundary>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col min-h-0">
            {activeMainTab === 'editor' ? (
              <>
                <div className="flex-1 min-h-0">
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
              <div className="flex-1 min-h-0">
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
              <div className="flex-1 min-h-0">
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

        {/* Right Panel (collapsible) */}
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
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-surface-black border-t border-white/[0.06] rounded-t-2xl overflow-hidden"
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

      {/* Modals */}
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
    </main>
  );
}
