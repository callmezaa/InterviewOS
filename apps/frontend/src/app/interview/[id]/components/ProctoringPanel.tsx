import React, { useState } from 'react';
import { useInterviewStore } from '../../../../store/useInterviewStore';
import { Shield } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../../components/ui/EmptyState';

export const ProctoringPanel: React.FC = () => {
  const { proctoringLogs, clearProctoringLogs } = useInterviewStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="text-[11px] text-white/55 font-mono">Real-time Integrity Stream</div>
        {proctoringLogs.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-[10px] text-white/50 hover:text-white/70 font-mono transition-all focus:outline-none focus:ring-1 focus:ring-white/30 rounded"
          >
            Clear Logs
          </button>
        )}
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => { clearProctoringLogs(); setShowClearConfirm(false); }}
        title="Clear integrity logs?"
        description="This will permanently remove all proctoring event records for this session."
        confirmText="Clear All"
        variant="info"
      />
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 font-mono text-xs">
        {proctoringLogs.length === 0 ? (
          <EmptyState
            icon={<Shield className="w-4 h-4" />}
            description="No integrity flags or tab switches detected."
            compact
          />
        ) : (
          proctoringLogs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-lg border flex flex-col gap-1 transition-all ${
                log.eventType === 'tab-switch'
                  ? 'bg-red-500/5 border-red-500/10 text-red-300'
                  : log.eventType === 'focus-lost'
                  ? 'bg-primary/5 border-primary/10 text-primary-on-dark'
                  : 'bg-white/[0.04] border-white/[0.06] text-white/60'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] text-white/55">
                <span className="font-semibold text-white/80">{log.userName}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-1.5 font-sans font-medium text-[11px]">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  log.eventType === 'tab-switch' ? 'bg-red-400' : log.eventType === 'focus-lost' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                {log.eventType === 'tab-switch' && <span>Switched tab or minimized browser window</span>}
                {log.eventType === 'focus-lost' && <span>Clicked out / lost browser focus</span>}
                {log.eventType === 'focus-gained' && <span>Returned to the active workspace</span>}
              </div>
              {log.reason && (
                <div className="text-[11px] font-sans italic text-white/55 border-t border-white/5 mt-1 pt-1.5">
                  "{log.reason}"
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
