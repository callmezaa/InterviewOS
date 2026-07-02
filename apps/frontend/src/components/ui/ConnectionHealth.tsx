'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import type { ConnectionStatus } from '../../hooks/useSocket';
import type { PeerConnectionState } from '../../store/useInterviewStore';

interface ConnectionHealthProps {
  status: ConnectionStatus;
  peers: PeerConnectionState[];
}

function pingColor(ping: number): string {
  if (ping < 50) return 'text-emerald-400';
  if (ping < 150) return 'text-amber-400';
  return 'text-red-400';
}

function pingDotColor(ping: number): string {
  if (ping < 50) return 'bg-emerald-400 shadow-[0_0_6px_var(--color-success-soft)]';
  if (ping < 150) return 'bg-amber-400 shadow-[0_0_6px_var(--color-warning-soft)]';
  return 'bg-red-500 shadow-[0_0_6px_var(--color-danger)]';
}

export const ConnectionHealth: React.FC<ConnectionHealthProps> = ({ status, peers }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open]);

  const avgPing = peers.length > 0
    ? peers.reduce((sum, p) => sum + (p.ping ?? 0), 0) / peers.length
    : null;

  const isDisconnected = status !== 'connected';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
          isDisconnected
            ? 'bg-red-500/10 text-red-400'
            : open
              ? 'bg-primary/15 text-primary-on-dark'
              : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
        }`}
        aria-label="Connection health"
        aria-expanded={open}
      >
        {isDisconnected ? (
          <WifiOff className="w-4 h-4" />
        ) : (
          <span className="relative">
            <Wifi className="w-4 h-4" />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse ${
              avgPing !== null && avgPing < 50 ? 'bg-emerald-400' :
              avgPing !== null && avgPing < 150 ? 'bg-amber-400' :
              'bg-emerald-400'
            }`} />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-1.5 z-50 w-[240px] bg-surface-tile-3 border border-white/[0.08] rounded-lg shadow-xl overflow-hidden"
          >
            {/* WebSocket status */}
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-body-muted/40 mb-1.5">Connection</div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-400' : status === 'reconnecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-[12px] font-mono text-white/70">
                  {status === 'connected' ? 'WebSocket Connected' :
                   status === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
                </span>
                {(status === 'reconnecting' || status === 'disconnected') && (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400 ml-auto" />
                )}
              </div>
            </div>

            {/* Peer connection stats */}
            <div className="px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-body-muted/40 mb-1.5">Network</div>
              {peers.length === 0 ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-[11px] text-body-muted/50 font-mono">Waiting for peer...</span>
                </div>
              ) : (
                peers.map((peer) => (
                  <div key={peer.socketId} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[9px] font-mono text-white/50 shrink-0">
                        {peer.userName?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                      <span className="text-[12px] text-white/70 truncate">{peer.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {peer.ping !== undefined && (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pingDotColor(peer.ping)}`} />
                          <span className={`text-[11px] font-mono font-semibold ${pingColor(peer.ping)}`}>
                            {peer.ping}ms
                          </span>
                        </>
                      )}
                      {peer.packetLoss !== undefined && (
                        <span className="text-[10px] font-mono text-body-muted/50">
                          {peer.packetLoss.toFixed(1)}% loss
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
