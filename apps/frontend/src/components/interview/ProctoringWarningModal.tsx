'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProctoringWarningModalProps {
  show: boolean;
  onAcknowledge: (reason: string) => void;
}

export const ProctoringWarningModal: React.FC<ProctoringWarningModalProps> = ({ show, onAcknowledge }) => {
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (show) setReason('');
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="proctoring-title"
            aria-describedby="proctoring-desc"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[420px] bg-[#1e1414] border border-red-500/25 rounded-lg p-6 shadow-[0_12px_40px_rgba(239,68,68,0.15)] flex flex-col gap-5 text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 id="proctoring-title" className="font-display font-semibold text-[20px] text-red-400">
                Integrity Advisory Alert
              </h3>
              <p id="proctoring-desc" className="text-red-200/60 text-[13px] leading-relaxed">
                We detected that you switched tabs or left the active interview window. All page focus events are logged and reported to the interviewer in real-time.
              </p>
              <div className="text-[11px] font-mono bg-red-500/5 border border-red-500/10 px-3 py-1.5 rounded-lg text-red-400/80 max-w-full overflow-hidden text-ellipsis whitespace-nowrap mt-1">
                Event: Page Focus Lost (Tab Switched)
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full text-left">
              <label className="text-[11px] font-mono text-white/55">
                Explain your reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 200))}
                placeholder="E.g.: I need to check my notes, there's a technical issue, etc."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-[12px] text-white/80 placeholder-white/30 resize-none h-[72px] focus:outline-none focus:ring-1 focus:ring-red-500/40 focus:border-red-500/40 transition-colors"
              />
              <span className="text-[10px] text-white/50 text-right">{reason.length}/200</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Button
                variant="primary"
                onClick={() => onAcknowledge(reason)}
                className="w-full bg-red-500 hover:bg-red-600 text-white border-none py-2 text-[13px] font-medium shadow-[0_0_12px_rgba(239,68,68,0.3)] active:scale-98 transition-all"
              >
                Submit & Return
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
