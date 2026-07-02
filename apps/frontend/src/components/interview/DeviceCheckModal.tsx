'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Volume2, Wifi, Check, ChevronRight, Loader2, AlertTriangle, Monitor, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import type { DeviceCheckState } from '../../hooks/useDeviceCheck';

interface DeviceCheckModalProps {
  state: DeviceCheckState;
  actions: {
    startCameraPreview: (deviceId?: string) => Promise<void>;
    stopCameraPreview: () => void;
    setSelectedCamera: (id: string) => void;
    setSelectedMicrophone: (id: string) => void;
    setSelectedSpeaker: (id: string) => void;
    startMicTest: (deviceId?: string) => Promise<void>;
    stopMicTest: () => void;
    playSpeakerTest: () => Promise<void>;
    confirmSpeaker: () => void;
    testNetwork: () => Promise<void>;
    cleanup: () => void;
  };
  onComplete: () => void;
  onSkip: () => void;
}

type Step = 'camera' | 'microphone' | 'speaker' | 'network' | 'summary';

export function DeviceCheckModal({ state, actions, onComplete, onSkip }: DeviceCheckModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('camera');
  const [stepStatus, setStepStatus] = useState<Record<Step, 'pending' | 'testing' | 'passed' | 'failed'>>({
    camera: 'pending', microphone: 'pending', speaker: 'pending', network: 'pending', summary: 'pending',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const meterRafRef = useRef<number>(0);

  useEffect(() => {
    if (videoRef.current && state.cameraStream) {
      videoRef.current.srcObject = state.cameraStream;
    }
  }, [state.cameraStream]);

  const steps: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: 'camera', label: 'Camera', icon: Camera },
    { key: 'microphone', label: 'Microphone', icon: Mic },
    { key: 'speaker', label: 'Speaker', icon: Volume2 },
    { key: 'network', label: 'Network', icon: Wifi },
  ];

  const stepOrder: Step[] = ['camera', 'microphone', 'speaker', 'network', 'summary'];

  const goTo = (step: Step) => {
    setCurrentStep(step);
  };

  const markStep = (step: Step, status: 'passed' | 'failed') => {
    setStepStatus((prev) => ({ ...prev, [step]: status }));
  };

  const handleCameraNext = async () => {
    setStepStatus((prev) => ({ ...prev, camera: 'testing' }));
    await actions.startCameraPreview();
    if (!state.cameraError) {
      markStep('camera', 'passed');
    } else {
      markStep('camera', 'failed');
    }
    goTo('microphone');
  };

  const handleMicNext = async () => {
    setStepStatus((prev) => ({ ...prev, microphone: 'testing' }));
    await actions.startMicTest();
    if (!state.micError) {
      markStep('microphone', 'passed');
    } else {
      markStep('microphone', 'failed');
    }
    goTo('speaker');
  };

  const handleSpeakerNext = async () => {
    goTo('network');
  };

  const handleNetworkNext = async () => {
    goTo('summary');
    setStepStatus((prev) => ({ ...prev, summary: 'passed' }));
  };

  const handleFinish = () => {
    actions.cleanup();
    onComplete();
  };

  const isStepAccessible = (stepKey: Step): boolean => {
    if (stepKey === 'camera') return true;
    const idx = stepOrder.indexOf(stepKey);
    const prev = stepOrder[idx - 1];
    if (!prev) return true;
    return stepStatus[prev] === 'passed' || stepStatus[prev] === 'failed';
  };

  const barColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-emerald-500';
      case 'failed': return 'bg-red-500';
      case 'testing': return 'bg-amber-500';
      default: return 'bg-white/10';
    }
  };

  const stepBadge = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'testing': return <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[560px] mx-4 bg-surface-black border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-1">
            <Monitor className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold text-[16px] text-white">Pre-Interview Device Check</h2>
          </div>
          <p className="text-[12px] text-body-muted/55 mt-1">
            Test your camera, microphone, speakers, and network connection before joining.
          </p>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = currentStep === s.key;
              const stat = stepStatus[s.key];
              const accessible = isStepAccessible(s.key);
              return (
                <button
                  key={s.key}
                  disabled={!accessible}
                  onClick={() => accessible && goTo(s.key)}
                  className={`flex flex-col items-center gap-1.5 group transition-opacity ${!accessible ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : stat === 'passed'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : stat === 'failed'
                          ? 'border-red-500/30 bg-red-500/10 text-red-400'
                          : 'border-white/[0.1] bg-white/[0.03] text-white/30'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${
                    isActive ? 'text-white' : 'text-white/30'
                  }`}>{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-1">
            {steps.map((s, i) => (
              <div key={s.key} className={`flex-1 h-0.5 rounded-full transition-colors ${
                i === 0 ? '' : 'ml-0.5'
              } ${barColor(stepStatus[s.key])}`} />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-6 min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ── Camera Step ── */}
              {currentStep === 'camera' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-semibold text-white">Camera Test</h3>
                  </div>
                  <p className="text-[12px] text-body-muted/55">
                    Ensure your camera is working and select the right device.
                  </p>

                  {state.cameras.length > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-body-muted/50 shrink-0">Camera:</label>
                      <select
                        value={state.selectedCamera ?? ''}
                        onChange={(e) => {
                          actions.setSelectedCamera(e.target.value);
                          if (e.target.value) actions.startCameraPreview(e.target.value);
                        }}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-white font-mono outline-none focus:border-primary/40"
                      >
                        {state.cameras.map((cam) => (
                          <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/[0.08]">
                    {state.cameraStream ? (
                      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <Camera className="w-8 h-8 text-white/15" />
                        {state.cameraError ? (
                          <div className="flex flex-col items-center gap-1.5 px-4 text-center">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <p className="text-[11px] text-red-400/80">{state.cameraError}</p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-white/25">Preview will appear here</p>
                        )}
                      </div>
                    )}
                    {state.cameraStream && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Camera active
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    {state.cameraError && (
                      <button
                        onClick={() => actions.startCameraPreview()}
                        className="flex items-center gap-1.5 text-[11px] text-primary/70 hover:text-primary transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    )}
                    <Button variant="primary" onClick={handleCameraNext} className="ml-auto text-[12px] px-4 py-1.5">
                      Continue <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Microphone Step ── */}
              {currentStep === 'microphone' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-semibold text-white">Microphone Test</h3>
                  </div>
                  <p className="text-[12px] text-body-muted/55">
                    Speak into your microphone to verify it is working.
                  </p>

                  {state.microphones.length > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-body-muted/50 shrink-0">Microphone:</label>
                      <select
                        value={state.selectedMicrophone ?? ''}
                        onChange={(e) => {
                          actions.setSelectedMicrophone(e.target.value);
                          if (e.target.value) actions.startMicTest(e.target.value);
                        }}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-white font-mono outline-none focus:border-primary/40"
                      >
                        {state.microphones.map((mic) => (
                          <option key={mic.deviceId} value={mic.deviceId}>{mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-body-muted/40">Input level</span>
                      {state.audioLevel > 0.05 ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                          <Check className="w-3 h-3" /> Detected
                        </span>
                      ) : state.micStream ? (
                        <span className="text-[10px] text-body-muted/30">Speak to test...</span>
                      ) : null}
                    </div>
                    <div className="flex items-end gap-0.5 h-10">
                      {Array.from({ length: 32 }).map((_, i) => {
                        const barHeight = Math.min(state.audioLevel * 100 * (i + 1) / 32, 100);
                        const isLoud = state.audioLevel > 0.3;
                        return (
                          <div key={i} className="flex-1 rounded-t-sm transition-all duration-75" style={{
                            height: `${Math.max(barHeight, 4)}%`,
                            backgroundColor: !state.micStream
                              ? 'rgba(255,255,255,0.04)'
                              : isLoud && i > 20
                                ? `rgba(239,68,68,${state.audioLevel})`
                                : `rgba(16,185,129,${Math.max(state.audioLevel, 0.08)})`,
                          }} />
                        );
                      })}
                    </div>
                    {state.micStream && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-body-muted/30">Level: {Math.round(state.audioLevel * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {state.micError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <p className="text-[11px] text-red-400/80">{state.micError}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    {state.micError && (
                      <button
                        onClick={() => actions.startMicTest()}
                        className="flex items-center gap-1.5 text-[11px] text-primary/70 hover:text-primary transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    )}
                    <Button variant="primary" onClick={handleMicNext} className="ml-auto text-[12px] px-4 py-1.5">
                      Continue <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Speaker Step ── */}
              {currentStep === 'speaker' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-semibold text-white">Speaker Test</h3>
                  </div>
                  <p className="text-[12px] text-body-muted/55">
                    We will play a short tone. Confirm if you can hear it.
                  </p>

                  <div className="flex flex-col items-center gap-4 py-6">
                    {!state.speakerTestPlayed ? (
                      <button
                        onClick={actions.playSpeakerTest}
                        className="flex flex-col items-center gap-3 group"
                      >
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/25 group-hover:bg-primary/15 transition-colors">
                          <Volume2 className="w-7 h-7 text-primary" />
                        </div>
                        <span className="text-[13px] text-white font-medium group-hover:text-primary transition-colors">Play Test Sound</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                          <Volume2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <p className="text-[13px] text-white font-medium">Did you hear the tone?</p>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="primary"
                            onClick={actions.confirmSpeaker}
                            className="text-[12px] px-5 py-1.5"
                          >
                            Yes, I heard it
                          </Button>
                          <button
                            onClick={actions.playSpeakerTest}
                            className="text-[12px] text-body-muted/50 hover:text-white underline underline-offset-2 transition-colors"
                          >
                            Play again
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {state.speakerError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <p className="text-[11px] text-red-400/80">{state.speakerError}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    {state.speakerError && (
                      <button
                        onClick={actions.playSpeakerTest}
                        className="flex items-center gap-1.5 text-[11px] text-primary/70 hover:text-primary transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    )}
                    <Button
                      variant="primary"
                      onClick={handleSpeakerNext}
                      className="ml-auto text-[12px] px-4 py-1.5"
                    >
                      {state.speakerTestConfirmed ? 'Continue' : 'Skip'} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Network Step ── */}
              {currentStep === 'network' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-semibold text-white">Network Check</h3>
                  </div>
                  <p className="text-[12px] text-body-muted/55">
                    Measuring your connection quality to ensure smooth video calls.
                  </p>

                  <div className="flex flex-col items-center gap-4 py-6">
                    {state.networkLatency === null && !state.isTestingNetwork ? (
                      <button
                        onClick={actions.testNetwork}
                        className="flex flex-col items-center gap-3 group"
                      >
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/25 group-hover:bg-primary/15 transition-colors">
                          <Wifi className="w-7 h-7 text-primary" />
                        </div>
                        <span className="text-[13px] text-white font-medium group-hover:text-primary transition-colors">Test Connection</span>
                      </button>
                    ) : state.isTestingNetwork ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-[12px] text-body-muted/50">Testing network...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border ${
                          state.networkLatency !== null && state.networkLatency < 100
                            ? 'bg-emerald-500/10 border-emerald-500/25'
                            : state.networkLatency !== null && state.networkLatency < 300
                              ? 'bg-amber-500/10 border-amber-500/25'
                              : 'bg-red-500/10 border-red-500/25'
                        }`}>
                          <Wifi className={`w-5 h-5 ${
                            state.networkLatency !== null && state.networkLatency < 100
                              ? 'text-emerald-400'
                              : state.networkLatency !== null && state.networkLatency < 300
                                ? 'text-amber-400'
                                : 'text-red-400'
                          }`} />
                        </div>
                        {state.networkLatency !== null && (
                          <div className="text-center">
                            <p className="text-[20px] font-mono font-semibold text-white">{state.networkLatency} <span className="text-[12px] text-body-muted/40 font-normal">ms</span></p>
                            <p className="text-[11px] text-body-muted/50 mt-0.5">
                              {state.networkLatency < 50
                                ? 'Excellent connection'
                                : state.networkLatency < 100
                                  ? 'Good connection'
                                  : state.networkLatency < 200
                                    ? 'Fair connection'
                                    : state.networkLatency < 300
                                      ? 'Weak connection — may affect call quality'
                                      : 'Poor connection — video calls may be unstable'}
                            </p>
                          </div>
                        )}
                        <button
                          onClick={actions.testNetwork}
                          className="text-[11px] text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
                        >
                          Test again
                        </button>
                      </div>
                    )}
                  </div>

                  {state.networkError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <p className="text-[11px] text-amber-400/80">{state.networkError}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button variant="primary" onClick={handleNetworkNext} className="text-[12px] px-4 py-1.5">
                      Continue <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Summary Step ── */}
              {currentStep === 'summary' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-semibold text-white">Check Complete</h3>
                  </div>
                  <p className="text-[12px] text-body-muted/55">
                    Here is a summary of your device setup. You can go back to retest any step.
                  </p>

                  <div className="flex flex-col gap-2">
                    {steps.map((s) => {
                      const Icon = s.icon;
                      const stat = stepStatus[s.key];
                      return (
                        <button
                          key={s.key}
                          onClick={() => goTo(s.key)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                        >
                          <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
                            stat === 'passed' ? 'bg-emerald-500/10 text-emerald-400' :
                            stat === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-white/[0.04] text-white/30'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="flex-1 text-[13px] text-white text-left">{s.label}</span>
                          {stat === 'passed' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : stat === 'failed' ? (
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-400/70 leading-relaxed">
                      You can still join the interview even if some checks show warnings. Your interviewer will see your status.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button onClick={onSkip} className="text-[11px] text-body-muted/40 hover:text-white transition-colors underline underline-offset-2">
                      Skip device check
                    </button>
                    <Button variant="primary" onClick={handleFinish} className="text-[12px] px-5 py-1.5">
                      Enter Room
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
