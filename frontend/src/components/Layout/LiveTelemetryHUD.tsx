import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  ChevronUp, 
  ChevronDown, 
  Sparkles,
  Globe,
  Database,
  Radio
} from 'lucide-react';

interface LiveTelemetryHUDProps {
  activeBrand: string;
  onTriggerAudit: () => void;
  isAuditing: boolean;
  onOpenCommandPalette: () => void;
}

export const LiveTelemetryHUD: React.FC<LiveTelemetryHUDProps> = ({
  activeBrand,
  onTriggerAudit,
  isAuditing,
  onOpenCommandPalette
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* Expanded Telemetry Drawer */}
      {isExpanded && (
        <div className="mb-2 w-80 sm:w-96 bg-[#0a0f1d]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl shadow-black/80 space-y-3.5 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-live" />
              <span className="text-xs font-bold text-white tracking-tight uppercase font-mono">
                Real-Time Telemetry HUD
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              v2.0-PROD
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                <span>Dynamic Cache</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base font-bold text-white font-mono">64.2% Hit</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">97.1% Gross Margin</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                <span>Residential Mesh</span>
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-base font-bold text-white font-mono">4,250 IPs</div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">JA3/JA4 Spoofing Active</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                <span>P99 Query Latency</span>
                <Database className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-base font-bold text-white font-mono">38.4ms</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">16 Hash Partitions</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                <span>SOC2 Compliance</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-emerald-400 font-mono">18/18 Pass</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Merkle Chain Sealed</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              onClick={onTriggerAudit}
              disabled={isAuditing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all shadow-sm"
            >
              <Radio className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Auditing 7 Engines...' : 'Probe Engines'}</span>
            </button>
            <button
              onClick={onOpenCommandPalette}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 text-xs font-mono transition-colors"
            >
              ⌘K
            </button>
          </div>
        </div>
      )}

      {/* Floating Status Pill */}
      <div className="flex items-center gap-2 bg-[#090e1c]/90 backdrop-blur-xl border border-slate-700/80 rounded-full px-3.5 py-1.5 shadow-xl hover:border-slate-600 transition-all cursor-pointer group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 text-xs text-slate-300"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-live" />
          <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">EDGE:</span>
          <span className="font-semibold text-white font-mono text-[11px]">{activeBrand} (87.4)</span>
          <span className="h-3.5 w-px bg-slate-700 mx-0.5" />
          <span className="text-emerald-400 font-mono text-[11px]">97.1% MARGIN</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
};
