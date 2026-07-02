'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Monitor, Camera, ChevronDown } from 'lucide-react';

interface RecordingPlayerProps {
  recordingUrl?: string | null;
  title?: string;
}

export function RecordingPlayer({ recordingUrl, title }: RecordingPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);

  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = (parseFloat(e.target.value) / 100) * duration;
    v.currentTime = t;
    setCurrentTime(t);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setFullscreen(false);
    } else {
      await el.requestFullscreen();
      setFullscreen(true);
    }
  };

  const changeSpeed = (s: number) => {
    if (videoRef.current) videoRef.current.playbackRate = s;
    setSpeed(s);
    setSpeedOpen(false);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    const onEnd = () => setPlaying(false);
    const onProgress = () => {
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1) / (v.duration || 1));
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('ended', onEnd);
    v.addEventListener('progress', onProgress);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);

    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('ended', onEnd);
      v.removeEventListener('progress', onProgress);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [recordingUrl]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  if (!recordingUrl) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-white/[0.06] bg-surface-black overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2.5">
        <Monitor className="w-4 h-4 text-primary-on-dark" />
        <h3 className="font-display font-semibold text-[14px] text-white">Session Recording</h3>
        {duration > 0 && (
          <span className="ml-auto text-[11px] text-body-muted/40 font-mono">{formatTime(duration)}</span>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative group bg-black cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => playing && setShowControls(false)}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={recordingUrl}
          className="w-full max-h-[480px] object-contain bg-black"
          playsInline
          preload="metadata"
        />

        {/* Large center play button when paused */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all">
              <Play className="w-6 h-6 text-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-3 px-4 transition-opacity duration-300 ${
            showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seek bar */}
          <div className="flex items-center gap-3 mb-2.5">
            <span className="text-[11px] font-mono text-white/60 w-10 tabular-nums">{formatTime(currentTime)}</span>
            <div className="flex-1 relative h-1 group/seek">
              <div className="absolute inset-0 rounded-full bg-white/10" />
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/20" style={{ width: `${buffered * 100}%` }} />
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Seek"
              />
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary-on-dark transition-all" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover/seek:opacity-100 transition-opacity" style={{ left: `calc(${progress}% - 6px)` }} />
            </div>
            <span className="text-[11px] font-mono text-white/60 w-10 tabular-nums text-right">{formatTime(duration)}</span>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-all"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <div className="flex items-center gap-1.5 w-20 group/vol">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 rounded-full appearance-none bg-white/20 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  aria-label="Volume"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Speed */}
              <div className="relative">
                <button
                  onClick={() => setSpeedOpen(!speedOpen)}
                  className="px-2 py-1 rounded-md text-[11px] font-mono text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  {speed}x
                </button>
                {speedOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSpeedOpen(false)} />
                    <div className="absolute bottom-full right-0 mb-1 z-20 bg-surface-tile-2 border border-white/[0.06] rounded-lg shadow-lg overflow-hidden">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => changeSpeed(s)}
                          className={`block w-full px-4 py-1.5 text-[11px] font-mono text-left transition-colors ${
                            speed === s ? 'text-white bg-white/[0.04] font-semibold' : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all"
                aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {fullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {title && (
        <div className="px-5 py-2.5 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-body-muted/50 font-mono">
          <Camera className="w-3 h-3" />
          <span>{title}</span>
        </div>
      )}
    </motion.div>
  );
}
