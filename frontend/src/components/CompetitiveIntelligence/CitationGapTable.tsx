import React from 'react';
import { CitationGapAnalysisResult } from '../../types';
import { Layers, AlertTriangle, CheckCircle, ExternalLink, ArrowUpRight } from 'lucide-react';

interface Props {
  gapData: CitationGapAnalysisResult;
}

export const CitationGapTable: React.FC<Props> = ({ gapData }) => {
  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Citation Source Gap Analysis & High-Value Authority Targets (FR-INT-02)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Third-party domains cited by generative answer engines when evaluating competitors.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-800">
            {gapData.critical_gaps_count} Critical Gaps
          </span>
          <span className="text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800">
            {gapData.secured_domains_count} Secured
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Authority Domain</th>
              <th className="py-3 px-4">Domain Authority</th>
              <th className="py-3 px-4">Engine Citation Frequency</th>
              <th className="py-3 px-4">Featured Competitors</th>
              <th className="py-3 px-4">Status / Tier</th>
              <th className="py-3 px-4">Recommended GEO Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {gapData.ranked_opportunities.map((gap, i) => {
              const isCritical = gap.opportunity_tier === 'CRITICAL_GAP';
              const isSecured = gap.opportunity_tier === 'SECURED';

              return (
                <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-1.5">
                    {gap.domain}
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">{gap.domain_authority_score}/100</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">{gap.engine_citation_frequency} citations</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {gap.competitors_featured.map((c, ci) => (
                        <span key={ci} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isSecured
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isCritical
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {gap.opportunity_tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs">{gap.recommended_outreach}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
        <strong className="text-cyan-400 font-mono">Strategic Impact: </strong>
        {gapData.strategic_takeaway}
      </div>
    </div>
  );
};
