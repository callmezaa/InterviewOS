'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '../store/useToastStore';

export interface DeviceCheckState {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
  selectedCamera: string | null;
  selectedMicrophone: string | null;
  selectedSpeaker: string | null;
  cameraStream: MediaStream | null;
  cameraError: string | null;
  micStream: MediaStream | null;
  audioLevel: number;
  micError: string | null;
  speakerTestPlayed: boolean;
  speakerTestConfirmed: boolean;
  speakerError: string | null;
  isTestingNetwork: boolean;
  networkLatency: number | null;
  networkError: string | null;
  overallStatus: 'idle' | 'testing' | 'passed' | 'failed';
}

export function useDeviceCheck() {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [speakerTestPlayed, setSpeakerTestPlayed] = useState(false);
  const [speakerTestConfirmed, setSpeakerTestConfirmed] = useState(false);
  const [speakerError, setSpeakerError] = useState<string | null>(null);
  const [isTestingNetwork, setIsTestingNetwork] = useState(false);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'testing' | 'passed' | 'failed'>('idle');

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const formatDeviceError = (e: unknown): string => {
    if (e instanceof DOMException) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        return 'Permission denied. Please allow camera/microphone access in your browser settings.';
      }
      if (e.name === 'NotFoundError') {
        return 'No camera or microphone found on this device.';
      }
      if (e.name === 'NotReadableError') {
        return 'Camera or microphone is in use by another application.';
      }
      if (e.name === 'OverconstrainedError') {
        return 'No device matching the requested constraints found.';
      }
      return `Device error: ${e.message}`;
    }
    return 'An unexpected error occurred while accessing media devices.';
  };

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === 'videoinput');
      const mics = devices.filter((d) => d.kind === 'audioinput');
      const spkrs = devices.filter((d) => d.kind === 'audiooutput');

      setCameras(cams);
      setMicrophones(mics);
      setSpeakers(spkrs);

      if (cams.length > 0 && !selectedCamera) setSelectedCamera(cams[0].deviceId);
      if (mics.length > 0 && !selectedMicrophone) setSelectedMicrophone(mics[0].deviceId);
      if (spkrs.length > 0 && !selectedSpeaker) setSelectedSpeaker(spkrs[0].deviceId);

      return { cameras: cams, microphones: mics, speakers: spkrs };
    } catch {
      return { cameras: [], microphones: [], speakers: [] };
    }
  }, [selectedCamera, selectedMicrophone, selectedSpeaker]);

  const startCameraPreview = useCallback(async (deviceId?: string) => {
    stopCameraPreview();
    setCameraError(null);
    const id = deviceId ?? selectedCamera;
    try {
      const constraints: MediaStreamConstraints = {
        video: id ? { deviceId: { exact: id }, width: { ideal: 640 }, height: { ideal: 480 } }
               : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      setCameraStream(stream);
    } catch (e) {
      setCameraError(formatDeviceError(e));
    }
  }, [selectedCamera]);

  const stopCameraPreview = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraStream(null);
  }, []);

  const startMicTest = useCallback(async (deviceId?: string) => {
    stopMicTest();
    setMicError(null);
    const id = deviceId ?? selectedMicrophone;
    try {
      const constraints: MediaStreamConstraints = {
        audio: id ? { deviceId: { exact: id }, echoCancellation: false, noiseSuppression: false }
               : { echoCancellation: false, noiseSuppression: false },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;
      setMicStream(stream);

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(avg / 128, 1));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      setMicError(formatDeviceError(e));
    }
  }, [selectedMicrophone]);

  const stopMicTest = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setMicStream(null);
    setAudioLevel(0);
  }, []);

  const playSpeakerTest = useCallback(async () => {
    setSpeakerError(null);
    try {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.3;
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await audioCtx.close();
      setSpeakerTestPlayed(true);
    } catch (e) {
      testFallbackBeep();
    }
  }, []);

  const testFallbackBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.value = 0.3;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
      setTimeout(() => ctx.close(), 1500);
      setSpeakerTestPlayed(true);
    } catch {
      setSpeakerError('Could not play test sound. Please check your speakers or headphones.');
    }
  }, []);

  const confirmSpeaker = useCallback(() => {
    setSpeakerTestConfirmed(true);
  }, []);

  const testNetwork = useCallback(async () => {
    setIsTestingNetwork(true);
    setNetworkError(null);
    const start = performance.now();
    const attempts = 3;
    let total = 0;
    let successes = 0;
    for (let i = 0; i < attempts; i++) {
      try {
        const t0 = performance.now();
        await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
        total += performance.now() - t0;
        successes++;
      } catch {
        // try next
      }
    }
    if (successes > 0) {
      setNetworkLatency(Math.round(total / successes));
    } else {
      setNetworkError('Could not measure network latency. Check your connection.');
    }
    setIsTestingNetwork(false);
  }, []);

  const runAllChecks = useCallback(async () => {
    setOverallStatus('testing');
    await enumerateDevices();

    // Camera
    if (cameras.length > 0) {
      await startCameraPreview();
    }

    // Mic
    if (microphones.length > 0) {
      await startMicTest();
    }

    // Network
    await testNetwork();

    setOverallStatus(cameras.length > 0 || microphones.length > 0 ? 'passed' : 'failed');
  }, [enumerateDevices, cameras, microphones, startCameraPreview, startMicTest, testNetwork]);

  const cleanup = useCallback(() => {
    stopCameraPreview();
    stopMicTest();
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }
  }, [stopCameraPreview, stopMicTest]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const state: DeviceCheckState = {
    cameras, microphones, speakers,
    selectedCamera, selectedMicrophone, selectedSpeaker,
    cameraStream, cameraError,
    micStream, audioLevel, micError,
    speakerTestPlayed, speakerTestConfirmed, speakerError,
    isTestingNetwork, networkLatency, networkError,
    overallStatus,
  };

  const actions = {
    enumerateDevices,
    startCameraPreview,
    stopCameraPreview,
    setSelectedCamera,
    setSelectedMicrophone,
    setSelectedSpeaker,
    startMicTest,
    stopMicTest,
    playSpeakerTest,
    confirmSpeaker,
    testNetwork,
    runAllChecks,
    cleanup,
  };

  return { state, actions } as const;
}
