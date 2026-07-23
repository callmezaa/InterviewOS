import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Radio, ChevronDown } from 'lucide-react';
import { hoverScale } from '../../../../lib/motion';

interface ConsolePanelProps {
  isConsoleOpen: boolean;
  setIsConsoleOpen: (open: boolean) => void;
  consoleTab: 'output' | 'telemetry';
  setConsoleTab: (tab: 'output' | 'telemetry') => void;
  isRunningCode: boolean;
  consoleOutput: {
    stdout?: string;
    stderr?: string;
    error?: string;
    code?: number;
    hasRun: boolean;
  };
  setConsoleOutput: (out: any) => void;
  telemetry: {
    executionTimeMs: number;
    memoryMb: number;
    cpuPoints: number[];
    memoryPoints: number[];
    timeComplexity: string;
    spaceComplexity: string;
    optimizations: string[];
  } | null;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  isConsoleOpen,
  setIsConsoleOpen,
  consoleTab,
  setConsoleTab,
  isRunningCode,
  consoleOutput,
  setConsoleOutput,
  telemetry,
}) => {
  return (
    <div className="bg-surface-black border-t border-white/[0.06] overflow-hidden flex flex-col">
      {/* Console Header Tabs */}
      <div 
        onClick={() => setIsConsoleOpen(!isConsoleOpen)}
        className="h-8 bg-surface-black border-b border-white/[0.06] px-3 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex gap-4 h-full items-center" role="tablist">
          <motion.button
            role="tab"
            aria-selected={consoleTab === 'output' && isConsoleOpen}
            aria-controls="panel-console-output"
            onClick={(e) => {
              e.stopPropagation();
              setConsoleTab('output');
              setIsConsoleOpen(true);
            }}
            className={`h-full text-[11px] font-semibold tracking-tight font-mono px-1 border-b-2 transition-all flex items-center gap-1.5 ${
              consoleTab === 'output' && isConsoleOpen
                ? 'text-white border-primary'
                : 'text-body-muted/70 border-transparent hover:text-body-muted'
            }`}
            {...hoverScale}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isRunningCode ? 'bg-primary-on-dark animate-pulse' : consoleOutput.hasRun ? (consoleOutput.stderr || consoleOutput.error ? 'text-red-500' : 'text-primary-on-dark') : 'bg-white/20'}`} />
            <span className="hidden xs:inline sm:inline">Terminal</span>
            <span className="inline xs:hidden sm:hidden">Out</span>
          </motion.button>
          
          <motion.button
            role="tab"
            aria-selected={consoleTab === 'telemetry' && isConsoleOpen}
            aria-controls="panel-console-telemetry"
            onClick={(e) => {
              e.stopPropagation();
              setConsoleTab('telemetry');
              setIsConsoleOpen(true);
            }}
            className={`h-full text-[11px] font-semibold tracking-tight font-mono px-1 border-b-2 transition-all flex items-center gap-1.5 ${
              consoleTab === 'telemetry' && isConsoleOpen
                ? 'text-white border-primary'
                : 'text-body-muted/70 border-transparent hover:text-body-muted'
            }`}
            {...hoverScale}
          >
            <Radio className="w-3 h-3 text-primary-on-dark" />
            <span className="hidden xs:inline sm:inline">Code Telemetry</span>
            <span className="inline xs:hidden sm:hidden">Tele</span>
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          {consoleOutput.hasRun && consoleTab === 'output' && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setConsoleOutput({ hasRun: false });
              }}
              className="text-[10px] text-primary-on-dark hover:text-white font-mono"
              {...hoverScale}
            >
              Clear
            </motion.button>
          )}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setIsConsoleOpen(!isConsoleOpen);
            }}
            className="flex items-center gap-1 text-[10px] text-body-muted/70 hover:text-white font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 rounded transition-colors"
            {...hoverScale}
          >
            <span>{isConsoleOpen ? 'Console' : 'Console'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isConsoleOpen ? 'rotate-180' : ''}`} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isConsoleOpen && (
          <motion.div
            key="console-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 180, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              role="tabpanel"
              id={`panel-console-${consoleTab}`}
              className="h-[180px] bg-surface-black p-3 font-mono text-[11px] overflow-y-auto flex flex-col gap-1 leading-5 text-white/80"
            >
          {consoleTab === 'output' ? (
            /* Traditional Terminal Output View */
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="overflow-y-auto pr-2 flex-1">
                {!consoleOutput.hasRun ? (
                  <div className="h-full flex items-center justify-center text-white/25 text-[11px] py-4">
                    <span>No output. Click "Run" on the editor toolbar to compile and execute.</span>
                  </div>
                ) : isRunningCode ? (
                  <div className="flex items-center gap-2 text-yellow-500/80 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling and running on isolated sandbox...</span>
                  </div>
                ) : consoleOutput.error ? (
                  <div className="text-red-400">
                    <span className="text-red-500 font-bold">[SYSTEM ERROR]</span> {consoleOutput.error}
                  </div>
                ) : (
                  <>
                    {consoleOutput.stdout && (
                      <div className="text-emerald-400 whitespace-pre-wrap">{consoleOutput.stdout}</div>
                    )}
                    {consoleOutput.stderr && (
                      <div className="text-red-400 whitespace-pre-wrap">{consoleOutput.stderr}</div>
                    )}
                  </>
                )}
              </div>
              {consoleOutput.hasRun && !isRunningCode && !consoleOutput.error && (
                <div className="text-white/55 mt-2 pt-2 border-t border-white/[0.06] text-[10px] flex justify-between shrink-0">
                  <span>Process exited with code: {consoleOutput.code}</span>
                  <span>Execution Environment: Isolated Sandboxed Engine</span>
                </div>
              )}
            </div>
          ) : (
            /* Beautiful Visual Telemetry Panel */
            <div className="flex-1 flex flex-col h-full gap-3 justify-center">
              {!telemetry ? (
                <div className="h-full flex flex-col items-center justify-center text-white/25 text-[11px] text-center gap-2 py-4">
                  <Radio className="w-6 h-6 text-white/10" />
                  <span>No metrics yet. Run code in the editor to trigger performance telemetry analysis.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 h-full">
                   
                  {/* Left telemetry segment: Realtime visual meters */}
                  <div className="flex flex-col gap-2.5 bg-white/[0.02] border border-white/[0.06] p-2 sm:p-3 rounded-lg">
                    <div className="text-[9px] sm:text-[10px] font-semibold tracking-tight text-body-muted/60 mb-0.5">Execution Resource</div>
                    
                    <div className="flex items-center gap-4">
                      {/* Speed ring gauge */}
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-white/5" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-emerald-500" strokeDasharray="75, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute text-[10px] font-bold text-primary-on-dark font-mono">{telemetry.executionTimeMs}ms</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-white leading-3">Execution Speed</div>
                        <span className="text-[9px] text-body-muted/50">Optimal sandbox speed</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Memory ring gauge */}
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-white/5" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-amber-500" strokeDasharray={`${(telemetry.memoryMb / 40) * 100}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute text-[9px] font-bold text-primary-on-dark font-mono">{telemetry.memoryMb}M</div>

                        <div className="text-[11px] font-semibold text-white leading-3">Memory Footprint</div>
                        <span className="text-[9px] text-body-muted/50">RAM allocated internally</span>
                      </div>
                    </div>
                  </div>

                  {/* Center telemetry segment: Realtime neon SVG timelines */}
                  <div className="flex flex-col gap-1 bg-white/[0.02] border border-white/[0.06] p-2 sm:p-3 rounded-lg relative overflow-hidden">
                    <div className="text-[9px] sm:text-[10px] font-semibold tracking-tight text-body-muted/60">Execution Wave</div>
                    
                    {/* Draw custom dynamic SVG graphs */}
                    <div className="flex-1 relative w-full h-[85px] mt-1">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                        {/* Grid Lines */}
                        <line x1="0" y1="10" x2="100" y2="10" stroke="white" strokeWidth="0.1" strokeDasharray="1,2" opacity="0.2" />
                        <line x1="0" y1="20" x2="100" y2="20" stroke="white" strokeWidth="0.1" strokeDasharray="1,2" opacity="0.2" />
                        <line x1="0" y1="30" x2="100" y2="30" stroke="white" strokeWidth="0.1" strokeDasharray="1,2" opacity="0.2" />
                        
                        {/* CPU Spike wave */}
                        <path 
                          d={`M 0 ${40 - (telemetry.cpuPoints[0] || 0) / 2.5} 
                              L 14 ${40 - (telemetry.cpuPoints[1] || 0) / 2.5} 
                              L 28 ${40 - (telemetry.cpuPoints[2] || 0) / 2.5} 
                              L 42 ${40 - (telemetry.cpuPoints[3] || 0) / 2.5} 
                              L 56 ${40 - (telemetry.cpuPoints[4] || 0) / 2.5} 
                              L 70 ${40 - (telemetry.cpuPoints[5] || 0) / 2.5} 
                              L 84 ${40 - (telemetry.cpuPoints[6] || 0) / 2.5} 
                              L 100 ${40 - (telemetry.cpuPoints[7] || 0) / 2.5}`}
                          fill="none" 
                          style={{ stroke: 'var(--color-success)' }} 
                          strokeWidth="1.2" 
                          strokeLinecap="round"
                          className="drop-shadow-[0_0_2px_var(--color-success)]"
                        />
                        
                        {/* Memory Allocation line */}
                        <path 
                          d={`M 0 ${40 - (telemetry.memoryPoints[0] || 0) * 1.2} 
                              L 14 ${40 - (telemetry.memoryPoints[1] || 0) * 1.2} 
                              L 28 ${40 - (telemetry.memoryPoints[2] || 0) * 1.2} 
                              L 42 ${40 - (telemetry.memoryPoints[3] || 0) * 1.2} 
                              L 56 ${40 - (telemetry.memoryPoints[4] || 0) * 1.2} 
                              L 70 ${40 - (telemetry.memoryPoints[5] || 0) * 1.2} 
                              L 84 ${40 - (telemetry.memoryPoints[6] || 0) * 1.2} 
                              L 100 ${40 - (telemetry.memoryPoints[7] || 0) * 1.2}`}
                          fill="none" 
                          style={{ stroke: 'var(--color-warning)' }} 
                          strokeWidth="0.8" 
                          strokeDasharray="2,1"
                          opacity="0.8"
                        />
                      </svg>
                    </div>
                    <div className="flex justify-between items-center text-[8px] text-body-muted/70 font-mono mt-0.5 select-none">
                      <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-primary-on-dark" /> CPU Load Wave</span>
                      <span className="flex items-center gap-1"><span className="w-1 h-1 rounded bg-amber-500" /> Mem Allocation</span>
                    </div>
                  </div>

                  {/* Right telemetry segment: Complexity Metrics & Optimization Suggestions */}
                  <div className="flex flex-col gap-2 bg-white/[0.02] border border-white/[0.06] p-2 sm:p-3 rounded-lg">
                    <div className="text-[9px] sm:text-[10px] font-semibold tracking-tight text-body-muted/60 mb-0.5">Big-O Complexity</div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/[0.01] border border-white/[0.06] p-1.5 rounded flex flex-col items-center">
                        <span className="text-[8px] text-body-muted/70">Time Complexity</span>
                        <span className="text-primary-on-dark font-bold text-[13px] font-mono mt-0.5">{telemetry.timeComplexity}</span>
                      </div>
                      <div className="flex-1 bg-white/[0.01] border border-white/[0.06] p-1.5 rounded flex flex-col items-center">
                        <span className="text-[8px] text-body-muted/70">Space Complexity</span>
                        <span className="text-primary-on-dark font-bold text-[13px] font-mono mt-0.5">{telemetry.spaceComplexity}</span>
                      </div>
                    </div>

                    <div className="mt-0.5 flex flex-col gap-0.5 overflow-y-auto max-h-[50px] pr-1">
                      <div className="text-[8px] font-semibold text-white/55">Optimization Suggestions:</div>
                      {telemetry.optimizations.slice(0, 2).map((op, idx) => (
                        <div key={idx} className="text-[9px] leading-3 text-white/70 flex gap-1 select-text">
                          <span className="text-primary">•</span>
                          <span>{op}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
