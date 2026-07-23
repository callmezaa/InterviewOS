'use client';

import React, { useState, useCallback } from 'react';
import { Video, VideoOff, MicOff, Monitor, MonitorOff, Loader2, AlertTriangle, Mic, Eye, EyeOff, PictureInPicture2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { Waveform } from '../ui/Waveform';
import { VideoFeed } from './VideoFeed';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { PeerConnectionState } from '../../store/useInterviewStore';

interface VideoGridProps {
  localStream: MediaStream | null;
  screenStream?: MediaStream | null;
  peers: PeerConnectionState[];
  user: { name: string };
  isLocalAudioMuted: boolean;
  isLocalVideoMuted: boolean;
  isLocalSpeaking: boolean;
  isScreenSharing: boolean;
  hideSelfVideo?: boolean;
  pipMode?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onTogglePipMode?: () => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream, screenStream, peers, user,
  isLocalAudioMuted, isLocalVideoMuted, isLocalSpeaking,
  isScreenSharing, hideSelfVideo = false, pipMode = false,
  onToggleAudio, onToggleVideo, onToggleScreenShare,
  onTogglePipMode,
}) => {
  const isMobile = useIsMobile();
  const [showSelfVideo, setShowSelfVideo] = useState(!hideSelfVideo);
  const peer = peers[0];

  const videoCard = useCallback((opts: {
    stream: MediaStream | null | undefined;
    videoMuted: boolean | undefined;
    isLocal: boolean;
    name: string;
    audioMuted: boolean | undefined;
    isSpeaking: boolean | undefined;
    isFocusLost?: boolean;
    isTabSwitched?: boolean;
    className?: string;
    overlayCorner?: React.ReactNode;
    noBadges?: boolean;
  }) => (
    <div className={`relative overflow-hidden flex items-center justify-center shrink-0 bg-surface-tile-2 ${opts.className || ''}`}>
      {!opts.videoMuted ? (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/40 via-zinc-950/60 to-black flex items-center justify-center">
          <Video className="w-12 h-12 text-white/5" />
          {opts.stream && <VideoFeed stream={opts.stream} muted={opts.isLocal} isLocal={opts.isLocal} />}
        </div>
      ) : (
        <div className="w-full h-full bg-surface-black flex flex-col items-center justify-center gap-2 text-white/20">
          <VideoOff className="w-8 h-8" />
          <span className="text-[12px] font-mono">Camera Disabled</span>
        </div>
      )}
      {!opts.noBadges && (
        <AnimatePresence>
          {opts.isFocusLost && (
            <motion.div
              key="focus-lost-badge"
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-red-500/20 backdrop-blur-md border border-red-500/35 px-2 py-1 rounded-lg text-[10px] font-mono text-red-400 font-semibold shadow-lg"
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>{opts.isTabSwitched ? 'TAB SWITCHED' : 'UNPINNED / FOCUS LOST'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
        <span className="bg-black/60 backdrop-blur-sm border border-white/[0.06] px-2.5 py-1 rounded-pill text-[11px] font-semibold text-white flex items-center gap-1.5">
          {opts.audioMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
          {opts.name}
        </span>
        <Waveform isActive={!opts.audioMuted && opts.isSpeaking} level={opts.isSpeaking ? 40 : 0} barCount={8} />
      </div>
      {opts.overlayCorner}
    </div>
  ), []);

  if (pipMode) {
    const controlBtnClass = "flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150";

    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Local video (self) — top */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-lg overflow-hidden border border-white/[0.08] bg-surface-black aspect-square flex flex-col"
        >
          {/* Video area */}
          <div className="flex-1 relative min-h-0">
            {!isLocalVideoMuted && showSelfVideo ? (
              <div className="absolute inset-0 bg-black">
                {localStream && <VideoFeed stream={localStream} muted={true} isLocal={true} />}
              </div>
            ) : (
              <div className="w-full h-full bg-surface-black flex flex-col items-center justify-center gap-1 text-white/20">
                <VideoOff className="w-6 h-6" />
                <span className="text-[10px] font-mono">Camera Off</span>
              </div>
            )}
            {/* Speaking indicator */}
            {isLocalSpeaking && !isLocalAudioMuted && (
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>

          {/* Control bar — always visible */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-black/60 border-t border-white/[0.06]">
            <div className="flex items-center gap-1">
              {/* Mic toggle */}
              <button
                onClick={onToggleAudio}
                className={`${controlBtnClass} ${
                  !isLocalAudioMuted
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
                aria-label={!isLocalAudioMuted ? 'Mute microphone' : 'Unmute microphone'}
              >
                {!isLocalAudioMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>

              {/* Camera toggle */}
              <button
                onClick={onToggleVideo}
                className={`${controlBtnClass} ${
                  !isLocalVideoMuted
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
                aria-label={!isLocalVideoMuted ? 'Turn off camera' : 'Turn on camera'}
              >
                {!isLocalVideoMuted ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              </button>

              {/* Screen share toggle */}
              <button
                onClick={onToggleScreenShare}
                className={`${controlBtnClass} ${
                  isScreenSharing
                    ? 'bg-primary text-white hover:bg-primary-focus'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                aria-label={!isScreenSharing ? 'Share screen' : 'Stop sharing'}
              >
                {!isScreenSharing ? <Monitor className="w-3.5 h-3.5" /> : <MonitorOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Name + speaking */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-medium text-white truncate">{user.name}</span>
              <Waveform isActive={!isLocalAudioMuted && isLocalSpeaking} level={isLocalSpeaking ? 40 : 0} barCount={5} />
            </div>
          </div>
        </motion.div>

        {/* Peer video — bottom */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-lg overflow-hidden border border-white/[0.08] bg-surface-black aspect-square flex flex-col"
        >
          {/* Video area */}
          <div className="flex-1 relative min-h-0">
            {peer ? (
              <>
                {!peer.videoMuted ? (
                  <div className="absolute inset-0 bg-black">
                    {peer.stream && <VideoFeed stream={peer.stream} muted={false} isLocal={false} />}
                  </div>
                ) : (
                  <div className="w-full h-full bg-surface-black flex flex-col items-center justify-center gap-1 text-white/20">
                    <VideoOff className="w-6 h-6" />
                    <span className="text-[10px] font-mono">Camera Off</span>
                  </div>
                )}
                {/* Speaking indicator */}
                {peer.isSpeaking && !peer.audioMuted && (
                  <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </>
            ) : (
              <div className="w-full h-full bg-surface-black flex flex-col items-center justify-center gap-1 text-white/20">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-[10px] font-mono">Waiting...</span>
              </div>
            )}
          </div>

          {/* Info bar — display only */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-black/60 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Peer status icons */}
              <div className="flex items-center gap-1">
                {peer?.audioMuted && <MicOff className="w-3 h-3 text-red-400/70" />}
                {peer?.videoMuted && <VideoOff className="w-3 h-3 text-red-400/70" />}
              </div>
              <span className="text-[10px] font-medium text-white truncate">
                {peer?.userName ?? 'Peer'}
              </span>
            </div>
            <Waveform isActive={!!peer?.isSpeaking && !peer?.audioMuted} level={peer?.isSpeaking ? 40 : 0} barCount={5} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[280px] lg:w-[380px] flex flex-row md:flex-col gap-2 sm:gap-4 overflow-x-auto md:overflow-y-auto pr-0 md:pr-1 pb-2 md:pb-0 shrink-0">
      {showSelfVideo ? (
        <Card
          variant="default"
          padding="none"
          className={`w-[280px] md:w-full aspect-[1/1] bg-surface-tile-2 border rounded-lg relative overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300 ${
              isLocalSpeaking && !isLocalAudioMuted
                ? 'border-primary-on-dark shadow-[0_0_15px_var(--color-primary-on-dark-glow)] scale-[1.02]'
              : 'border-white/[0.06]'
          }`}
        >
          {!isLocalVideoMuted ? (
            <div className="w-full h-full bg-black relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black flex items-center justify-center">
                <Video className="w-12 h-12 text-white/5" />
              </div>
              {localStream && <VideoFeed stream={localStream} muted={true} isLocal={true} />}
            </div>
          ) : (
            <div className="w-full h-full bg-surface-black flex flex-col items-center justify-center gap-2 text-white/20">
              <VideoOff className="w-8 h-8" />
              <span className="text-[12px] font-mono">Camera Disabled</span>
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
            <span className="bg-black/60 backdrop-blur-sm border border-white/[0.06] px-2.5 py-1 rounded-pill text-[11px] font-semibold text-white flex items-center gap-1.5">
              {isLocalAudioMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
              {user.name} (You)
            </span>
            <Waveform isActive={!isLocalAudioMuted && isLocalSpeaking} level={isLocalSpeaking ? 40 : 0} barCount={8} />
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowSelfVideo(true)}
          className="w-[280px] md:w-full aspect-[1/1] bg-surface-tile-2/40 border border-dashed border-white/[0.06] rounded-lg flex flex-col items-center justify-center gap-2 text-body-muted/50 hover:text-white hover:bg-white/[0.02] hover:border-white/[0.12] transition-all shrink-0 group"
          aria-label="Show self video"
        >
          <EyeOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-mono">Self view hidden</span>
          <span className="text-[10px] font-mono text-body-muted/30 group-hover:text-body-muted/50 transition-colors">Click to show</span>
        </button>
      )}

      {peers.length === 0 ? (
        <Card
          variant="default"
          padding="none"
          className="w-[280px] md:w-full aspect-[1/1] bg-surface-tile-2/40 border border-dashed border-white/[0.06] rounded-lg flex flex-col items-center justify-center text-center p-4 text-body-muted/70 shrink-0"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
          <p className="text-[13px] tracking-tight">Waiting for participant...</p>
        </Card>
      ) : (
        peers.map((peer) => (
          <Card
            key={peer.socketId}
            variant="default"
            padding="none"
            className={`w-[280px] md:w-full aspect-[1/1] bg-surface-tile-2 border rounded-lg relative overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300 ${
              peer.isSpeaking && !peer.audioMuted
                ? 'border-primary-on-dark shadow-[0_0_15px_var(--color-primary-on-dark-glow)] scale-[1.02]'
                : 'border-white/[0.06]'
            }`}
          >
            {!peer.videoMuted ? (
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/40 via-zinc-950/60 to-black flex items-center justify-center">
                <Video className="w-12 h-12 text-white/5" />
                {peer.stream && <VideoFeed stream={peer.stream} muted={false} isLocal={false} />}
              </div>
            ) : (
              <div className="w-full h-full bg-surface-black flex flex-col items-center justify-center gap-2 text-white/20">
                <VideoOff className="w-8 h-8" />
                <span className="text-[12px] font-mono">Camera Disabled</span>
              </div>
            )}

            <AnimatePresence>
              {peer.isFocusLost && (
                <motion.div
                  key="focus-lost-badge"
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-red-500/20 backdrop-blur-md border border-red-500/35 px-2 py-1 rounded-lg text-[10px] font-mono text-red-400 font-semibold shadow-lg"
                >
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  <span>{peer.isTabSwitched ? 'TAB SWITCHED' : 'UNPINNED / FOCUS LOST'}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
              <span className="bg-black/60 backdrop-blur-sm border border-white/[0.06] px-2.5 py-1 rounded-pill text-[11px] font-semibold text-white flex items-center gap-1.5">
                {peer.audioMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                {peer.userName}
              </span>
              <Waveform isActive={!peer.audioMuted && peer.isSpeaking} level={peer.isSpeaking ? 40 : 0} barCount={8} />
            </div>
          </Card>
        ))
      )}

      {/* Media Controls — sidebar on desktop, floating bar on mobile */}
      <div className={`${isMobile ? 'flex md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-surface-tile-2/90 backdrop-blur-lg border border-white/[0.12] shadow-2xl' : 'hidden md:flex'} justify-around items-center rounded-full p-2 sm:p-3 gap-1 sm:gap-2`}>
        <Tooltip content={!isLocalAudioMuted ? 'Mute mic' : 'Unmute mic'} shortcut="M">
          <button
            onClick={onToggleAudio}
            className={`p-2.5 sm:p-3 rounded-full active:scale-95 transition-all ${
              !isLocalAudioMuted ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-danger/10 border border-danger/20 text-danger-soft'
            }`}
            aria-label={!isLocalAudioMuted ? 'Mute microphone' : 'Unmute microphone'}
          >
            {!isLocalAudioMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </Tooltip>
        <Tooltip content={!isLocalVideoMuted ? 'Disable camera' : 'Enable camera'} shortcut="V">
          <button
            onClick={onToggleVideo}
            className={`p-2.5 sm:p-3 rounded-full active:scale-95 transition-all ${
              !isLocalVideoMuted ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-danger/10 border border-danger/20 text-danger-soft'
            }`}
            aria-label={!isLocalVideoMuted ? 'Disable camera' : 'Enable camera'}
          >
            {!isLocalVideoMuted ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
        </Tooltip>
        <Tooltip content={showSelfVideo ? 'Hide self video' : 'Show self video'}>
          <button
            onClick={() => setShowSelfVideo((v) => !v)}
            className={`p-2.5 sm:p-3 rounded-full active:scale-95 transition-all ${
              showSelfVideo ? 'bg-primary text-white hover:bg-primary-focus' : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08]'
            }`}
            aria-label={showSelfVideo ? 'Hide self video' : 'Show self video'}
          >
            {showSelfVideo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </Tooltip>
        <Tooltip content={isScreenSharing ? 'Stop sharing' : 'Share screen'} shortcut="S">
          <button
            onClick={onToggleScreenShare}
            className={`p-2.5 sm:p-3 rounded-full active:scale-95 transition-all ${
              isScreenSharing ? 'bg-success text-white' : 'bg-white/[0.04] text-white/80 hover:bg-white/[0.08]'
            }`}
            aria-label="Toggle screen sharing"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </Tooltip>
        <div className="w-px h-5 bg-white/[0.06] hidden sm:block" />
        <Tooltip content="Picture in Picture mode">
          <button
            onClick={onTogglePipMode}
            className="p-2.5 sm:p-3 rounded-full active:scale-95 transition-all bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"
            aria-label="Toggle picture-in-picture mode"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
