import React from 'react';
import { Terminal, CheckCircle2, Clock, Globe } from 'lucide-react';

interface LogEvent {
  time: string;
  engine: string;
  message: string;
  progress: number;
}

interface Props {
  isAuditing: boolean;
  progress: number;
  events: LogEvent[];
}

export const LiveActivityStream: React.FC<Props> = ({ isAuditing, progress, events }) => {
  return (
    <div className="glass-panel p-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Live Execution Stream & Engine Fan-Out Monitor
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isAuditing && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Streaming SSE (5 Engines)...
            </span>
          )}
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {progress}% Done
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-1.5 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Console Feed */}
      <div className="bg-slate-950/90 rounded-lg p-3.5 font-mono text-xs text-slate-300 border border-slate-800 max-h-48 overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <div className="text-slate-500 flex items-center gap-2 py-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Standing by. Click &quot;Run Cold Perception Audit&quot; to stream multi-engine evaluation.</span>
          </div>
        ) : (
          events.map((ev, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-slate-500 text-[11px] shrink-0">{ev.time}</span>
              <span className="text-cyan-400 font-semibold shrink-0">[{ev.engine}]</span>
              <span className="text-slate-200">{ev.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
