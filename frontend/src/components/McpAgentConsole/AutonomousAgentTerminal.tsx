import React, { useState } from 'react';
import { MCPToolDefinition } from '../../types';
import { Bot, Terminal, Shield, Play, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  tools: MCPToolDefinition[];
}

export const AutonomousAgentTerminal: React.FC<Props> = ({ tools }) => {
  const [selectedTool, setSelectedTool] = useState<string>('score_perception');
  const [permissionLevel, setPermissionLevel] = useState<number>(4);
  const [signature, setSignature] = useState<string>('SIG-APPROVE-EXEC');
  const [terminalOutput, setTerminalOutput] = useState<string>('MCP Agent Gateway initialized. Ready for dispatch.');
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const activeToolDef = tools.find((t) => t.name === selectedTool);

  const handleExecute = async () => {
    setIsRunning(true);
    try {
      const res = await api.executeMcpTool(
        selectedTool,
        { brand_name: 'Psychs', domain: 'psychs.ai', diff_id: 'DIFF-KDD-01', platform: 'WordPress' },
        permissionLevel,
        signature
      );
      setTerminalOutput(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setTerminalOutput(`Error executing MCP tool: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Permission Level Selector */}
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              Autonomous Model Context Protocol (MCP) Agent Framework (Section 3)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Five-Level Agent Permission Model with cryptographic signature verification.
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded border border-emerald-800">
            Current Session Level: {permissionLevel}
          </div>
        </div>

        {/* 5 Levels Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { lvl: 1, name: 'Level 1 (Read-Only)', desc: 'Crawl, Inspect, Score' },
            { lvl: 2, name: 'Level 2 (Diagnostic)', desc: 'Gap Diagnosis, Benchmarks' },
            { lvl: 3, name: 'Level 3 (Drafting)', desc: 'Diffs, Schema.org, llms.txt' },
            { lvl: 4, name: 'Level 4 (Approved Execution)', desc: 'Human Signature Required' },
            { lvl: 5, name: 'Level 5 (Autonomous)', desc: 'Daily Staging Refreshes' }
          ].map((item) => (
            <button
              key={item.lvl}
              onClick={() => setPermissionLevel(item.lvl)}
              className={`p-3 rounded-xl border text-left transition-all ${
                permissionLevel === item.lvl
                  ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold font-mono mb-1">{item.name}</div>
              <div className="text-[10px] text-slate-400">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tool Dispatcher & Terminal */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-emerald-400" />
          MCP Secure Tool Gateway
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Registered MCP Tool:</label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {tools.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} (Requires Level {t.required_permission_level})
                  </option>
                ))}
              </select>
            </div>

            {activeToolDef && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 text-[10px] font-mono uppercase">Tool Description:</span>
                <p className="text-slate-300">{activeToolDef.description}</p>
                <div className="pt-2 text-[10px] font-mono text-cyan-400">
                  Min Clearance: Level {activeToolDef.required_permission_level}
                </div>
              </div>
            )}

            {permissionLevel === 4 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Approver Cryptographic Signature:</label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-emerald-400 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 rounded-lg shadow-md active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5" /> Execute MCP Tool
            </button>
          </div>

          {/* Terminal Output */}
          <div className="lg:col-span-8">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 max-h-80 overflow-y-auto">
              <div className="text-slate-500 mb-2">// MCP Output Stream</div>
              <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
