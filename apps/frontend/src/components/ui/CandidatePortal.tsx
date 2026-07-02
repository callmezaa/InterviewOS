'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { Button } from './Button';
import { 
  Camera, CameraOff, Mic, MicOff, CheckSquare, Square, 
  Play, ShieldCheck, Clock, Terminal, ChevronRight, Video
} from 'lucide-react';
import { IlustrationCalendar } from './Illustrations';

interface InterviewDetails {
  id: string;
  title: string;
  description?: string;
  status: string;
  scheduledTime: string;
}

interface CandidatePortalProps {
  interviews: InterviewDetails[];
  onJoin: (id: string) => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({ interviews, onJoin }) => {
  // Device Test states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [deviceError, setDeviceError] = useState('');

  // Practice Sandbox states
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('// Practice typing here before your interview begins!\nfunction helloWorld() {\n  console.log("Welcome to InterviewOS!");\n}');
  const [sandboxLang, setSandboxLang] = useState('javascript');

  // Checklist states
  const [checklist, setChecklist] = useState({
    hardware: false,
    environment: false,
    network: false,
    focus: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Find next upcoming interview
  const upcoming = interviews
    .filter(int => int.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())[0];

  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!upcoming) return;

    const updateCountdown = () => {
      const diff = new Date(upcoming.scheduledTime).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Started — Enter room now!');
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 65)) / 1000);
      
      if (hrs > 0) {
        setCountdown(`${hrs}h ${mins}m remaining`);
      } else {
        setCountdown(`${mins}m ${secs}s remaining`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [upcoming]);

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const startDeviceTest = async () => {
    try {
      setDeviceError('');
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: true
      });
      
      setStream(media);
      setCameraActive(true);
      setChecklist(prev => ({ ...prev, hardware: true }));

      // Attach stream to video component
      if (videoRef.current) {
        videoRef.current.srcObject = media;
      }

      // Audio level analyser setup
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(media);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Map volume scale (0 to 100)
        setAudioLevel(Math.min(100, Math.round(average * 1.8)));
        animationRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();

    } catch (err: any) {
      console.error(err);
      setDeviceError('Permission denied. Please check browser settings to enable camera and mic.');
      setCameraActive(false);
    }
  };

  const stopDeviceTest = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setCameraActive(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      stopDeviceTest();
    };
  }, []);

  return (
    <Card variant="default" className="flex flex-col gap-6 p-6">
      {/* Countdown header */}
      {upcoming ? (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-primary font-semibold font-mono">Next Session</span>
            <h4 className="text-[15px] font-semibold text-white truncate max-w-[200px]">{upcoming.title}</h4>
            <div className="flex items-center gap-1.5 text-body-muted/60 text-[12px]">
              <Clock className="w-3.5 h-3.5" />
              <span>{countdown}</span>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => onJoin(upcoming.id)}
            className="flex items-center gap-1 py-2 px-3 text-[12px]"
          >
            <span>Enter Room</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 flex flex-col items-center gap-3"
        >
          <div className="w-[64px] h-[46px] text-white/12">
            <IlustrationCalendar className="w-full h-full" />
          </div>
          <div className="flex flex-col gap-1 text-center">
            <p className="text-[14px] font-display font-semibold text-white/55 tracking-tight">No upcoming interviews</p>
            <p className="text-[11px] text-body-muted/50 leading-relaxed max-w-[220px]">
              Scheduled sessions will appear here with a countdown.
            </p>
          </div>
        </motion.div>
      )}

      {/* Device Check Panel */}
      <div className="flex flex-col gap-3">
        <h4 className="text-[13px] text-body-muted/80 font-semibold font-mono flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          <span>Hardware validation</span>
        </h4>

        {cameraActive ? (
          <div className="relative rounded-lg overflow-hidden border border-white/[0.06] bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-[180px] object-cover scale-x-[-1]" />
            
            {/* Status badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-pill bg-primary/15 border border-primary/25 text-primary-on-dark text-[10px] font-semibold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-on-dark shadow-[0_0_6px_rgba(41,151,255,0.6)]" />
                  Camera active
                </span>
                {audioLevel > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-pill bg-primary/15 border border-primary/25 text-primary-on-dark text-[10px] font-semibold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-on-dark shadow-[0_0_6px_rgba(41,151,255,0.6)]" />
                    Microphone detected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-pill bg-white/[0.04] border border-white/[0.06] text-white/50 text-[10px] font-semibold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    Microphone waiting...
                  </span>
                )}
            </div>

            <button
              onClick={stopDeviceTest}
              className="absolute bottom-3 right-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-pill p-2 active:scale-95 transition-all"
              title="Turn off camera"
              aria-label="Toggle camera"
            >
              <CameraOff className="w-4 h-4" />
            </button>

            {/* Audio Meter overlay */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm border border-white/[0.06] px-3 py-1.5 rounded-pill flex items-center gap-2 max-w-[150px]">
              <Mic className="w-3.5 h-3.5 text-primary" />
              <div className="w-20 h-1.5 bg-white/10 rounded-pill overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-white/[0.06] bg-white/[0.005] rounded-lg p-6 text-center flex flex-col items-center gap-3">
            <Camera className="w-8 h-8 text-body-muted/50" />
            <p className="text-[13px] text-body-muted/50 leading-relaxed max-w-[280px]">
              Test your camera & microphone feeds to verify that hardware permissions are working.
            </p>
            <Button
              onClick={startDeviceTest}
              variant="ghost"
              className="py-1.5 px-4 text-[12px] border border-white/[0.06] bg-white/[0.02]"
            >
              Start Device Test
            </Button>
            {deviceError && (
              <p className="text-[11px] text-red-400 mt-1 max-w-[260px]">{deviceError}</p>
            )}
          </div>
        )}
      </div>

      {/* Checklist items */}
      <div className="flex flex-col gap-3">
        <h4 className="text-[13px] text-body-muted/80 font-semibold font-mono flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Preparation checklist</span>
        </h4>
        <div className="flex flex-col gap-2 bg-white/[0.01] border border-white/[0.06] p-3 rounded-lg">
          {[
            { key: 'hardware' as const, label: 'Tested camera and microphone audio' },
            { key: 'environment' as const, label: 'Quiet, well-lit desk space with no interruptions' },
            { key: 'network' as const, label: 'Verified internet speed and router stability' },
            { key: 'focus' as const, label: 'Closed other applications and background notifications' },
          ].map((item) => {
            const checked = checklist[item.key];
            const Icon = checked ? CheckSquare : Square;
            return (
              <div 
                key={item.key} 
                onClick={() => toggleChecklistItem(item.key)}
                className="flex items-center gap-2.5 cursor-pointer text-body-muted/70 hover:text-white transition-all text-[13px]"
              >
                <Icon className={`w-4 h-4 ${checked ? 'text-primary' : 'text-body-muted/55'}`} />
                <span className={checked ? 'line-through opacity-55' : ''}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Local practice sandbox */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => setShowSandbox(!showSandbox)}
          variant="ghost"
          className="w-full flex items-center justify-center gap-2 py-2 text-[13px] border border-white/[0.06]"
        >
          <Terminal className="w-4 h-4 text-primary" />
          <span>{showSandbox ? 'Hide Sandbox Practice' : 'Open Code Practice Sandbox'}</span>
        </Button>

        {showSandbox && (
          <div className="flex flex-col gap-2 border border-white/[0.06] bg-surface-black rounded-lg p-3 mt-1 animate-slide-up">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-[11px] text-body-muted/55 font-mono">practice_area.js</span>
              <select
                value={sandboxLang}
                onChange={(e) => setSandboxLang(e.target.value)}
                className="bg-ink text-[11px] text-body-muted border border-white/[0.06] rounded px-1 py-0.5 font-mono"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
              </select>
            </div>
            <textarea
              value={sandboxCode}
              onChange={(e) => setSandboxCode(e.target.value)}
              className="w-full h-32 bg-transparent text-[13px] font-mono text-white/90 border-0 outline-none resize-none leading-relaxed"
              placeholder="// Write practice code here..."
            />
            <p className="text-[10px] text-body-muted/50 font-sans italic text-right mt-1">
              Your practice sandbox changes are completely local and not recorded.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
