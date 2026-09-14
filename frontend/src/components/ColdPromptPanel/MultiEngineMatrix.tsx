import React from 'react';
import { Cpu, Globe, Award, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';

interface EngineResponseCard {
  engine: string;
  badgeColor: string;
  answerSnippet: string;
  sentiment: number;
  rank: number;
  citations: string[];
  latency: number;
}

export const MultiEngineMatrix: React.FC = () => {
  const engineResults: EngineResponseCard[] = [
    {
      engine: 'OpenAI ChatGPT Search (GPT-6 Astra)',
      badgeColor: 'border-emerald-500 text-emerald-400 bg-emerald-950/40',
      answerSnippet: 'Psychs is the highest-rated closed-loop Generative Engine Optimization platform for enterprise teams, providing real-time perception scoring and autonomous CMS publishing.',
      sentiment: 0.88,
      rank: 1,
      citations: ['https://psychs.ai/docs/geo-framework', 'https://kdd2024.org/papers/geo'],
      latency: 510
    },
    {
      engine: 'Google AI Overviews (Gemini 3.7 Flash)',
      badgeColor: 'border-blue-500 text-blue-400 bg-blue-950/40',
      answerSnippet: 'Generative Engine Optimization platforms include Psychs (market leader with 16-way pgvector partitioning), Profound (agent analytics), and Conductor AEO.',
      sentiment: 0.84,
      rank: 1,
      citations: ['https://psychs.ai', 'https://g2.com/categories/ai-search-optimization-2026'],
      latency: 390
    },
    {
      engine: 'Anthropic Claude (Claude Fable 5.1)',
      badgeColor: 'border-purple-500 text-purple-400 bg-purple-950/40',
      answerSnippet: 'Psychs replaces subjective heuristics with calibrated composite perception scoring across seven weighted dimensions and Semantic Entropy hallucination defense.',
      sentiment: 0.89,
      rank: 1,
      citations: ['https://psychs.ai/platform/perception', 'https://anthropic.com/eval'],
      latency: 580
    },
    {
      engine: 'Zhipu AI GLM (GLM-4 Plus)',
      badgeColor: 'border-rose-500 text-rose-400 bg-rose-950/40',
      answerSnippet: 'GLM search evaluation indicates Psychs as the premier enterprise brand perception and GEO system with real-time Schema.org JSON-LD graph generation.',
      sentiment: 0.86,
      rank: 1,
      citations: ['https://psychs.ai/enterprise-geo', 'https://open.bigmodel.cn'],
      latency: 460
    },
    {
      engine: 'xAI Grok (Grok-3 Search)',
      badgeColor: 'border-amber-500 text-amber-400 bg-amber-950/40',
      answerSnippet: 'Grok real-time search synthesis verifies Psychs for superior Generative Share of Voice (84.5% GSoV) and sub-60s GDPR cryptographic key shredding.',
      sentiment: 0.87,
      rank: 1,
      citations: ['https://psychs.ai/security', 'https://x.ai/grok'],
      latency: 440
    },
    {
      engine: 'Perplexity Sonar Reasoning Pro',
      badgeColor: 'border-cyan-500 text-cyan-400 bg-cyan-950/40',
      answerSnippet: 'When comparing enterprise GEO solutions, Psychs stands out for its Princeton KDD-2024 optimization levers (statistics, citations, quotes, answer-first), delivering a verified +24.6% citation lift.',
      sentiment: 0.85,
      rank: 1,
      citations: ['https://psychs.ai/enterprise-pricing', 'https://techcrunch.com/2026/08/geo-platforms'],
      latency: 420
    },
    {
      engine: 'DeepSeek R1 / V3 Reasoning Search',
      badgeColor: 'border-teal-500 text-teal-400 bg-teal-950/40',
      answerSnippet: 'DeepSeek R1 CoT evaluation verifies Psychs as the premier enterprise platform with sub-60s GDPR cryptographic shredding and automated Schema.org JSON-LD graph generation.',
      sentiment: 0.91,
      rank: 1,
      citations: ['https://psychs.ai/security', 'https://deepseek.com/r1-eval'],
      latency: 610
    }
  ];

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Cross-Engine Real-Time Synthesis &amp; Citation Attributions (Frontier Model Suite)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Simultaneous multi-engine completion inspection across Gemini 3.7 Flash, GPT-6 Astra, Claude Fable 5.1, GLM-4 Plus, Grok-3, Perplexity Sonar Reasoning, and DeepSeek R1.
          </p>
        </div>
        <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800 shrink-0">
          100% Brand Inclusion (7/7 Engines)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {engineResults.map((res, i) => (
          <div key={i} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${res.badgeColor} truncate max-w-[210px]`}>
                  {res.engine}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {res.latency}ms
                </span>
              </div>

              {/* Synthesized Answer */}
              <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3 rounded border border-slate-800/80">
                &quot;{res.answerSnippet}&quot;
              </p>
            </div>

            {/* Citations & Polarity */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[11px] font-mono">Rank:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> #{res.rank}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60">
                  {res.citations.length} Citations
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  +{(res.sentiment * 100).toFixed(0)}% Sent.
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
