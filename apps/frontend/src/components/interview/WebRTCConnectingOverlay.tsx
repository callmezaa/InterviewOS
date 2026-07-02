'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle, Camera, Wifi, Shield, X } from 'lucide-react';

type Phase = 'idle' | 'requesting-media' | 'media-ready' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

interface WebRTCConnectingOverlayProps {
  phase: Phase;
  interviewTitle?: string;
  onDismiss: () => void;
}

interface StepState {
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'in-progress' | 'done' | 'error';
}

function useDerivedSteps(phase: Phase): StepState[] {
  const cameraStatus: StepState['status'] =
    phase === 'idle' ? 'pending' :
    phase === 'requesting-media' ? 'in-progress' :
    phase === 'failed' ? 'error' :
    'done';

  const signalingStatus: StepState['status'] =
    phase === 'idle' || phase === 'requesting-media' ? 'pending' :
    phase === 'media-ready' ? 'in-progress' :
    phase === 'connecting' ? 'in-progress' :
    phase === 'failed' ? 'error' :
    'done';

  const connectionStatus: StepState['status'] =
    phase === 'idle' || phase === 'requesting-media' || phase === 'media-ready' ? 'pending' :
    phase === 'connecting' ? 'in-progress' :
    phase === 'failed' ? 'error' :
    'done';

  return [
    {
      label: 'Camera & Microphone',
      icon: <Camera className="w-4 h-4" />,
      status: cameraStatus,
    },
    {
      label: 'Signaling Server',
      icon: <Wifi className="w-4 h-4" />,
      status: signalingStatus,
    },
    {
      label: 'Secure Connection',
      icon: <Shield className="w-4 h-4" />,
      status: connectionStatus,
    },
  ];
}

function StatusIcon({ status }: { status: StepState['status'] }) {
  if (status === 'in-progress') {
    return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
  }
  if (status === 'done') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <div className="w-5 h-5 rounded-full bg-success/20 border border-success/40 flex items-center justify-center">
          <Check className="w-3 h-3 text-success-soft" />
        </div>
      </motion.div>
    );
  }
  if (status === 'error') {
    return (
      <div className="w-5 h-5 rounded-full bg-danger/20 border border-danger/40 flex items-center justify-center">
        <AlertCircle className="w-3 h-3 text-danger-soft" />
      </div>
    );
  }
  return <div className="w-4 h-4 rounded-full border border-white/15" />;
}

function StepRow({ step, index }: { step: StepState; index: number }) {
  const isActive = step.status === 'in-progress';
  const isDone = step.status === 'done';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, duration: 0.3, ease: 'easeOut' }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        isActive
          ? 'bg-primary/5 border border-primary/15'
          : isDone
            ? 'bg-white/[0.02] border border-transparent'
            : 'bg-white/[0.02] border border-transparent'
      }`}
    >
      <div className="w-5 flex items-center justify-center shrink-0">
        <StatusIcon status={step.status} />
      </div>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`shrink-0 ${isActive ? 'text-primary' : isDone ? 'text-success-soft' : 'text-white/30'}`}>
          {step.icon}
        </span>
        <span className={`text-[13px] font-medium font-sans ${
          isActive ? 'text-white' : isDone ? 'text-white/70' : 'text-white/35'
        }`}>
          {step.label}
        </span>
      </div>
      {isActive && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-auto text-[11px] text-primary/60 font-mono"
        >
          In progress...
        </motion.span>
      )}
      {isDone && (
        <span className="ml-auto text-[11px] text-success-soft/60 font-mono">Ready</span>
      )}
      {step.status === 'pending' && (
        <span className="ml-auto text-[11px] text-white/20 font-mono">Pending</span>
      )}
    </motion.div>
  );
}

export const WebRTCConnectingOverlay: React.FC<WebRTCConnectingOverlayProps> = ({
  phase,
  interviewTitle,
  onDismiss,
}) => {
  const [showDismiss, setShowDismiss] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === 'connected' || phase === 'failed') {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (phase === 'connected') {
        const t = setTimeout(() => onDismiss(), 600);
        dismissTimerRef.current = t;
      }
      return;
    }

    if (!showDismiss) {
      const t = setTimeout(() => setShowDismiss(true), 5000);
      dismissTimerRef.current = t;
    }

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [phase, showDismiss, onDismiss]);

  const steps = useDerivedSteps(phase);

  const isReconnecting = phase === 'reconnecting';
  const isFailed = phase === 'failed';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-surface-black/95 backdrop-blur-sm"
    >
      <div className="w-full max-w-[420px] mx-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-[12px] font-bold font-mono text-white shadow-lg shadow-primary/20">
            &gt;_
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">InterviewOS</span>
        </div>

        {/* Title */}
        <h1 className="text-[17px] font-semibold text-white text-center mb-1 tracking-tight">
          Joining Interview Room
        </h1>
        {interviewTitle && (
          <p className="text-[13px] text-body-muted/60 text-center mb-8 font-mono truncate px-4">
            {interviewTitle}
          </p>
        )}

        {/* Reconnecting banner */}
        <AnimatePresence>
          {isReconnecting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-warning/10 border border-warning/20 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-warning-soft shrink-0" />
                <span className="text-[12px] text-warning font-medium">
                  Connection lost. Reconnecting...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner */}
        <AnimatePresence>
          {isFailed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-danger/10 border border-danger/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-danger-soft shrink-0" />
                <span className="text-[12px] text-danger font-medium">
                  Connection failed. You can still use the room.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps */}
        <div className="flex flex-col gap-2 mb-8">
          {steps.map((step, i) => (
            <StepRow key={step.label} step={step} index={i} />
          ))}
        </div>

        {/* Dismiss button */}
        <div className="flex justify-center">
          {showDismiss && !isReconnecting ? (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onDismiss}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] text-[12px] font-medium transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Continue to Room</span>
            </motion.button>
          ) : (
            <div className="flex items-center gap-2 text-body-muted/40 text-[11px] font-mono">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Setting up your session...</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
