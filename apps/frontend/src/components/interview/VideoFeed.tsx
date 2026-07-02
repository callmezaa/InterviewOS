'use client';

import React, { useRef, useEffect } from 'react';

interface VideoFeedProps {
  stream?: MediaStream;
  muted?: boolean;
  isLocal?: boolean;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ stream, muted = false, isLocal = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    el.play().catch((err) => console.debug('[VideoFeed] autoplay blocked:', err));
    return () => { el.srcObject = null; };
  }, [stream, stream?.id]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`absolute inset-0 w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
    />
  );
};
