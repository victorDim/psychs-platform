import React, { useState } from 'react';
import { LlmsTxtResult } from '../../types';
import { FileText, Download, Copy, Check, Globe } from 'lucide-react';

interface Props {
  llmsData: LlmsTxtResult;
}

export const LlmsTxtEditor: React.FC<Props> = ({ llmsData }) => {
  const [tab, setTab] = useState<'standard' | 'full'>('standard');
  const [content, setContent] = useState<string>(llmsData.llms_txt_content);
  const [copied, setCopied] = useState<boolean>(false);

  const activeContent = tab === 'standard' ? llmsData.llms_txt_content : llmsData.llms_full_txt_content;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = tab === 'standard' ? 'llms.txt' : 'llms-full.txt';
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Standardized /llms.txt &amp; /llms-full.txt Generator (FR-OPT-02)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Machine-readable brand fact files optimized for LLM RAG crawlers (GPTBot, ClaudeBot, PerplexityBot).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download {tab === 'standard' ? 'llms.txt' : 'llms-full.txt'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab('standard')}
          className={`text-xs px-3 py-1.5 rounded-md font-mono transition-all ${
            tab === 'standard'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          /llms.txt (Core Facts &amp; Index)
        </button>
        <button
          onClick={() => setTab('full')}
          className={`text-xs px-3 py-1.5 rounded-md font-mono transition-all ${
            tab === 'full'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          /llms-full.txt (Full Knowledge Base)
        </button>
      </div>

      {/* Markdown Text Area */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
        <textarea
          rows={16}
          value={activeContent}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-transparent p-4 font-mono text-xs text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
        />
      </div>
    </div>
  );
};
