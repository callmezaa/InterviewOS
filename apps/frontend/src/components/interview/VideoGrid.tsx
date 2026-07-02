'use client';

import React, { useState, useCallback } from 'react';
import { Video, VideoOff, MicOff, Monitor, Loader2, AlertTriangle, Mic, Eye, EyeOff, PictureInPicture2, X } from 'lucide-react';
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
    return (
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        className="fixed bottom-6 right-6 z-50 w-[160px] rounded-lg overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing group"
        style={{ aspectRatio: '1 / 1' }}
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {peer ? (
          videoCard({
            stream: peer.stream,
            videoMuted: peer.videoMuted,
            isLocal: false,
            name: peer.userName,
            audioMuted: peer.audioMuted,
            isSpeaking: peer.isSpeaking,
            isFocusLost: peer.isFocusLost,
            isTabSwitched: peer.isTabSwitched,
            className: 'w-full h-full border border-white/[0.12] rounded-lg',
            noBadges: false,
            overlayCorner: (
              <div className="absolute bottom-3 right-3 z-20 w-[56px] rounded-md overflow-hidden border border-white/[0.15] shadow-lg bg-surface-black">
                {!isLocalVideoMuted && showSelfVideo ? (
                  <div className="aspect-[1/1] relative bg-black">
                    {localStream && <VideoFeed stream={localStream} muted={true} isLocal={true} />}
                  </div>
                ) : (
                  <div className="aspect-[1/1] flex items-center justify-center bg-surface-black">
                    <VideoOff className="w-3.5 h-3.5 text-white/20" />
                  </div>
                )}
              </div>
            ),
          })
        ) : (
          <div className="w-full h-full bg-surface-tile-2 border border-white/[0.12] rounded-lg flex flex-col items-center justify-center gap-2 text-body-muted/70">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-[10px] font-mono">Waiting...</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Tooltip content={!isLocalAudioMuted ? 'Mute mic' : 'Unmute mic'} shortcut="M">
            <button
              onClick={onToggleAudio}
              className={`p-1.5 rounded-full transition-all ${
                !isLocalAudioMuted ? 'bg-primary text-white' : 'bg-danger/30 text-danger-soft'
              }`}
              aria-label={!isLocalAudioMuted ? 'Mute microphone' : 'Unmute microphone'}
            >
              {!isLocalAudioMuted ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            </button>
          </Tooltip>
          <Tooltip content={!isLocalVideoMuted ? 'Disable camera' : 'Enable camera'} shortcut="V">
            <button
              onClick={onToggleVideo}
              className={`p-1.5 rounded-full transition-all ${
                !isLocalVideoMuted ? 'bg-primary text-white' : 'bg-danger/30 text-danger-soft'
              }`}
              aria-label={!isLocalVideoMuted ? 'Disable camera' : 'Enable camera'}
            >
              {!isLocalVideoMuted ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
            </button>
          </Tooltip>
          <Tooltip content="Exit PIP mode">
            <button
              onClick={onTogglePipMode}
              className="p-1.5 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-all"
              aria-label="Exit picture-in-picture mode"
            >
              <X className="w-3 h-3" />
            </button>
          </Tooltip>
        </div>
      </motion.div>
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
