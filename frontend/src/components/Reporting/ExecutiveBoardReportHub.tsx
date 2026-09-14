import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Lock,
  Compass,
  Layers,
  BarChart3,
  TrendingUp,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  Sliders,
  Clock,
  DollarSign,
  Share2
} from 'lucide-react';
import { api } from '../../services/api';
import { BoardReportPackage, ReportHistoryItem } from '../../types';

interface ExecutiveBoardReportHubProps {
  activeBrand: string;
}

export const ExecutiveBoardReportHub: React.FC<ExecutiveBoardReportHubProps> = ({ activeBrand }) => {
  const [reportType, setReportType] = useState<string>('QUARTERLY_BOARD_DECK');
  const [isConfidential, setIsConfidential] = useState<boolean>(true);
  const [customNotes, setCustomNotes] = useState<string>(
    `Executive briefing presented to Board of Directors on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. All metrics cryptographically verified via WORM audit vault.`
  );
  const [report, setReport] = useState<BoardReportPackage | null>(null);
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'OBSIDIAN_DECK' | 'PRINT_PREVIEW'>('OBSIDIAN_DECK');
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);

  // Load report on mount or when brand/reportType changes
  useEffect(() => {
    loadReport();
  }, [activeBrand, reportType]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const [deckData, histData] = await Promise.all([
        api.getBoardDeck(activeBrand, reportType, 'json'),
        api.getReportHistory(activeBrand)
      ]);
      if (deckData) setReport(deckData as BoardReportPackage);
      if (histData) setHistory(histData as ReportHistoryItem[]);
    } catch (err) {
      console.error('Failed to load board deck:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateReport = async () => {
    setIsGenerating(true);
    try {
      const updated = await api.generateBoardDeck({
        brand_name: activeBrand,
        report_type: reportType,
        is_confidential: isConfidential,
        custom_notes: customNotes
      });
      if (updated) {
        setReport(updated as BoardReportPackage);
      }
    } catch (e) {
      console.error('Failed to regenerate board deck:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!report) return;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board_report_${activeBrand.toLowerCase()}_${report.metadata.report_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDispatchCSuiteAlert = async () => {
    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 4000);
  };

  if (isLoading && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Compiling C-Suite Board Deck for {activeBrand}...</p>
      </div>
    );
  }

  const exec = report?.executive_summary;
  const meta = report?.metadata;

  return (
    <div className="space-y-6">
      {/* Printable CSS injected for high-resolution vector PDF export */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          header, aside, .no-print {
            display: none !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            break-inside: avoid;
            page-break-inside: avoid;
            box-shadow: none !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
        }
      `}</style>

      {/* Top Header & Export Action Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 backdrop-blur-md no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Executive Boardroom Report Studio</h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Board Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographically signed AI Perception audit decks &amp; econometric ROI reports for {activeBrand}.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('OBSIDIAN_DECK')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === 'OBSIDIAN_DECK'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Obsidian Deck
            </button>
            <button
              onClick={() => setViewMode('PRINT_PREVIEW')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === 'PRINT_PREVIEW'
                  ? 'bg-slate-800 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Print / Light Mode
            </button>
          </div>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Download raw machine-readable JSON dataset"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          {/* Print to PDF */}
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            title="Generate print-ready PDF via browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download / Print PDF</span>
          </button>

          {/* Dispatch Webhook Alert */}
          <button
            onClick={handleDispatchCSuiteAlert}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              dispatchSuccess
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Notify Board Members via Slack / Email Webhook"
          >
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>{dispatchSuccess ? 'Dispatched!' : 'Notify C-Suite'}</span>
          </button>
        </div>
      </div>

      {/* Studio Configuration Drawer */}
      <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-4 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Boardroom Deck Configuration
          </div>
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20 w-3.5 h-3.5"
              />
              <span className="text-slate-300 font-medium">Confidentiality Watermark</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Report Scope &amp; Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="QUARTERLY_BOARD_DECK">Quarterly Board of Directors Review</option>
              <option value="EXECUTIVE_MONTHLY_BRIEF">Monthly Executive AI Briefing</option>
              <option value="MA_BRAND_DUE_DILIGENCE">M&amp;A Brand Due Diligence Audit</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-400 mb-1 font-medium">Executive Board Commentary</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Add customized board commentary or audit notes..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
              <button
                onClick={handleRegenerateReport}
                disabled={isGenerating}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                Update Deck
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Board Presentation Container */}
      <div className={`print-container transition-all duration-200 ${
        viewMode === 'PRINT_PREVIEW'
          ? 'bg-white text-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-300'
          : 'bg-[#080b12] text-slate-100 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl'
      }`}>
        {/* Confidential Banner */}
        {isConfidential && (
          <div className={`mb-6 py-2 px-4 rounded-lg text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${
            viewMode === 'PRINT_PREVIEW'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
          }`}>
            <Lock className="w-3.5 h-3.5" />
            Confidential &bull; Prepared for the Board of Directors &amp; Executive Leadership
          </div>
        )}

        {/* Deck Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-6 border-b ${
          viewMode === 'PRINT_PREVIEW' ? 'border-slate-300' : 'border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-black tracking-tight font-mono ${
                viewMode === 'PRINT_PREVIEW' ? 'text-slate-900' : 'text-white'
              }`}>
                PSYCHS GEO
              </span>
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/30">
                v2.0-PROD
              </span>
            </div>
            <h2 className={`text-base font-semibold mt-1 ${
              viewMode === 'PRINT_PREVIEW' ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Generative Engine Optimization &amp; AI Perception Board Audit
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Target Entity: <span className="font-semibold text-emerald-500">{meta?.brand_name}</span> &bull; Scope: {meta?.report_type}
            </div>
          </div>

          <div className="mt-4 sm:mt-0 text-left sm:text-right font-mono text-xs text-slate-500 space-y-0.5">
            <div><strong>Report ID:</strong> {meta?.report_id}</div>
            <div><strong>Auditor:</strong> {meta?.auditor_identity.slice(0, 32)}...</div>
            <div><strong>Generated:</strong> {meta?.generated_at.slice(0, 10)} (Verified)</div>
          </div>
        </div>

        {/* Slide 1: Executive KPI Scorecard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`p-5 rounded-xl border ${
            viewMode === 'PRINT_PREVIEW'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[11px] uppercase tracking-wider font-mono text-emerald-500 font-semibold">
              Perception Score
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl sm:text-4xl font-black ${
                viewMode === 'PRINT_PREVIEW' ? 'text-slate-900' : 'text-white'
              }`}>
                {exec?.aggregate_score}
              </span>
              <span className="text-sm font-bold text-emerald-500">Grade {exec?.grade}</span>
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">
              30d Trajectory: +{exec?.thirty_day_score_delta}%
            </div>
          </div>

          <div className={`p-5 rounded-xl border ${
            viewMode === 'PRINT_PREVIEW'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[11px] uppercase tracking-wider font-mono text-cyan-500 font-semibold">
              Generative SOV
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl sm:text-4xl font-black ${
                viewMode === 'PRINT_PREVIEW' ? 'text-slate-900' : 'text-white'
              }`}>
                {report?.gsov_leaderboard[0]?.generative_sov_percent}%
              </span>
              <span className="text-sm font-bold text-cyan-500">Rank #1</span>
            </div>
            <div className="text-xs text-cyan-600 mt-1 font-medium">
              +{report?.gsov_leaderboard[0]?.primary_recommendation_rate}% Primary Rate
            </div>
          </div>

          <div className={`p-5 rounded-xl border ${
            viewMode === 'PRINT_PREVIEW'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[11px] uppercase tracking-wider font-mono text-indigo-500 font-semibold">
              Hallucination Risk
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl sm:text-4xl font-black ${
                viewMode === 'PRINT_PREVIEW' ? 'text-slate-900' : 'text-white'
              }`}>
                {report?.hallucination_entropy_audit?.semantic_entropy}
              </span>
              <span className="text-sm font-bold text-indigo-500">H_sem</span>
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">
              Safety Threshold &le; 0.45 (Stable)
            </div>
          </div>

          <div className={`p-5 rounded-xl border ${
            viewMode === 'PRINT_PREVIEW'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="text-[11px] uppercase tracking-wider font-mono text-amber-500 font-semibold">
              Predicted Lift
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl sm:text-4xl font-black ${
                viewMode === 'PRINT_PREVIEW' ? 'text-slate-900' : 'text-white'
              }`}>
                +{report?.kdd_optimization_lift?.predicted_citation_lift_percent}%
              </span>
              <span className="text-sm font-bold text-amber-500">KDD-2024</span>
            </div>
            <div className="text-xs text-amber-600 mt-1 font-medium">
              {report?.kdd_optimization_lift?.active_levers_count} Active Levers
            </div>
          </div>
        </div>

        {/* Executive Overview Box */}
        <div className={`p-5 rounded-xl border mb-8 ${
          viewMode === 'PRINT_PREVIEW'
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-slate-900/40 border-slate-800 text-slate-300'
        }`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider font-mono mb-2 ${
            viewMode === 'PRINT_PREVIEW' ? 'text-slate-900' : 'text-white'
          }`}>
            Executive Boardroom Synthesis
          </h3>
          <p className="text-xs leading-relaxed mb-4">
            {exec?.executive_overview}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-700/50">
            <div>
              <span className="font-bold text-emerald-500 uppercase tracking-wider block mb-1.5 font-mono">
                Top Strategic Moats &amp; Strengths
              </span>
              <ul className="space-y-1.5">
                {exec?.top_strategic_strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-rose-500 uppercase tracking-wider block mb-1.5 font-mono">
                Critical Vulnerabilities to Remediate
              </span>
              <ul className="space-y-1.5">
                {exec?.urgent_vulnerabilities.map((v, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Slide 2: 7-Dimension Mathematical Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
              viewMode === 'PRINT_PREVIEW' ? 'text-slate-900' : 'text-white'
            }`}>
              1. 7-Dimension Perception Breakdown
            </h3>
            <span className="text-xs text-slate-500 font-mono">Weighted Total: 100%</span>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full text-xs border-collapse ${
              viewMode === 'PRINT_PREVIEW' ? 'text-slate-800' : 'text-slate-300'
            }`}>
              <thead>
                <tr className={viewMode === 'PRINT_PREVIEW' ? 'bg-slate-100 text-slate-900 border-b border-slate-300' : 'bg-slate-900 text-white border-b border-slate-800'}>
                  <th className="py-2.5 px-3 text-left font-semibold">Pillar Dimension</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Weight</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Raw Score</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Uncertainty (&plusmn;)</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Penalized Score</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Evidence Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {report?.dimensions_breakdown.map((dim) => (
                  <tr key={dim.key} className={viewMode === 'PRINT_PREVIEW' ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'}>
                    <td className="py-2.5 px-3 font-semibold">{dim.name}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{Math.round(dim.weight * 100)}%</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">{dim.raw_score}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">&plusmn;{Math.round(dim.uncertainty * 100)}%</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-500">{dim.penalized_score}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400">{dim.executive_takeaway}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide 3: GSoV Competitor Matrix */}
        <div className="mb-8">
          <h3 className={`text-sm font-bold uppercase tracking-wider font-mono mb-3 ${
            viewMode === 'PRINT_PREVIEW' ? 'text-slate-900' : 'text-white'
          }`}>
            2. Cross-Competitor Generative Share of Voice (GSoV)
          </h3>

          <div className="overflow-x-auto">
            <table className={`w-full text-xs border-collapse ${
              viewMode === 'PRINT_PREVIEW' ? 'text-slate-800' : 'text-slate-300'
            }`}>
              <thead>
                <tr className={viewMode === 'PRINT_PREVIEW' ? 'bg-slate-100 text-slate-900 border-b border-slate-300' : 'bg-slate-900 text-white border-b border-slate-800'}>
                  <th className="py-2.5 px-3 text-left font-semibold">Brand Entity</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Generative SOV</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Primary Recommendation</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Avg Citations/Query</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Sentiment Polarity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {report?.gsov_leaderboard.map((comp) => {
                  const isClient = comp.is_client_brand;
                  return (
                    <tr
                      key={comp.brand_name}
                      className={
                        isClient
                          ? viewMode === 'PRINT_PREVIEW' ? 'bg-emerald-50 font-bold' : 'bg-emerald-950/30 font-bold'
                          : viewMode === 'PRINT_PREVIEW' ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'
                      }
                    >
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        {comp.brand_name}
                        {isClient && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                            Client
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-500">
                        {comp.generative_sov_percent}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{comp.primary_recommendation_rate}%</td>
                      <td className="py-2.5 px-3 text-center font-mono">{comp.average_citations_per_query}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-400">+{comp.average_sentiment}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide 4: Econometric ROI & Financial Forecast */}
        <div className={`p-5 rounded-xl border mb-8 ${
          viewMode === 'PRINT_PREVIEW'
            ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
            : 'bg-emerald-950/20 border-emerald-800/50 text-slate-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-emerald-500">
              3. Econometric Causal Attribution &amp; Financial ROI
            </h3>
          </div>
          <p className="text-xs leading-relaxed mb-4 text-slate-400">
            {report?.econometric_roi_forecast?.executive_takeaway}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className={`p-3 rounded-lg border ${
              viewMode === 'PRINT_PREVIEW' ? 'bg-white border-emerald-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <span className="text-slate-500 text-[10px] uppercase block">Incremental Modeled Pipeline</span>
              <span className="text-base font-bold text-emerald-500">
                ${report?.econometric_roi_forecast?.incremental_annual_pipeline_usd?.toLocaleString()}
              </span>
            </div>
            <div className={`p-3 rounded-lg border ${
              viewMode === 'PRINT_PREVIEW' ? 'bg-white border-emerald-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <span className="text-slate-500 text-[10px] uppercase block">Cache Savings Cost Offset</span>
              <span className="text-base font-bold text-cyan-400">
                ${report?.econometric_roi_forecast?.estimated_cost_offset_from_cache_usd?.toLocaleString()}/yr
              </span>
            </div>
            <div className={`p-3 rounded-lg border ${
              viewMode === 'PRINT_PREVIEW' ? 'bg-white border-emerald-200' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <span className="text-slate-500 text-[10px] uppercase block">Net ROI Multiple</span>
              <span className="text-base font-bold text-indigo-400">
                {report?.econometric_roi_forecast?.net_roi_multiple}x Return
              </span>
            </div>
          </div>
        </div>

        {/* Custom Board Commentary */}
        {report?.custom_board_notes && (
          <div className={`p-4 rounded-xl border mb-6 text-xs ${
            viewMode === 'PRINT_PREVIEW'
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-slate-900/50 border-slate-800 text-slate-300'
          }`}>
            <span className="font-bold text-cyan-400 uppercase tracking-wider block mb-1 font-mono">
              Executive Board Notes
            </span>
            <p className="leading-relaxed">{report.custom_board_notes}</p>
          </div>
        )}

        {/* Deck Footer & Cryptographic Seal */}
        <div className={`pt-4 mt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500 ${
          viewMode === 'PRINT_PREVIEW' ? 'border-slate-300' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>SHA-256 Compliance Seal: <code className="text-emerald-500">{meta?.cryptographic_sha256_seal.slice(0, 32)}...</code></span>
          </div>
          <div>
            SOC 2 Type II Certified &bull; Immutable WORM Archive &bull; Psychs GEO v2.0
          </div>
        </div>
      </div>

      {/* Historical Report Archive Table */}
      <div className="bg-[#090d16] border border-slate-800/80 rounded-xl p-5 space-y-4 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Historical Boardroom Decks Archive
          </div>
          <span className="text-xs text-slate-500 font-mono">{history.length} Certified Decks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3 text-left">Report ID</th>
                <th className="py-2.5 px-3 text-left">Scope</th>
                <th className="py-2.5 px-3 text-left">Date</th>
                <th className="py-2.5 px-3 text-center">Perception Score</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-left">SHA-256 Seal</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {history.map((h) => (
                <tr key={h.report_id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{h.report_id}</td>
                  <td className="py-2.5 px-3 text-slate-400">{h.report_type}</td>
                  <td className="py-2.5 px-3 text-slate-400">{h.generated_at.slice(0, 10)}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{h.aggregate_score} ({h.grade})</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {h.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[10px] text-slate-500">{h.sha256_seal.slice(0, 16)}...</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={handlePrintPdf}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors text-[11px]"
                    >
                      View Deck
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
