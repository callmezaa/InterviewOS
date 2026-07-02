'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Loader2 } from 'lucide-react';
import type { ConnectionStatus } from '../../hooks/useSocket';

interface WebSocketBannerProps {
  status: ConnectionStatus;
}

export function WebSocketBanner({ status }: WebSocketBannerProps) {
  const show = status !== 'connected';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 40, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 h-full bg-primary/15 border-b border-primary/20 px-4">
            {status === 'reconnecting' ? (
              <Loader2 className="w-3.5 h-3.5 text-primary-on-dark animate-spin shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-primary-on-dark shrink-0" />
            )}
            <span className="text-[12px] font-medium text-primary-on-dark/90">
              {status === 'reconnecting'
                ? 'Reconnecting — attempting to restore connection...'
                : 'Connection lost — please check your network'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
