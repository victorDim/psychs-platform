import React, { useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  BarChart3, 
  ShieldAlert, 
  GitBranch, 
  Clock, 
  CreditCard,
  Layers,
  ChevronRight,
  Compass
} from 'lucide-react';
import { NavTab } from '../Layout/Sidebar';

export interface TourStep {
  id: string;
  tab: NavTab;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  keyHighlights: string[];
  executiveTakeaway: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'overview-scoring',
    tab: 'overview',
    title: '7-Dimension Perception & Mathematical Scoring',
    badge: 'Core Engine (FR-PER-01)',
    icon: BarChart3,
    description: 'Computes continuous enterprise perception scores (0-100) across 7 weighted dimensions, penalized rigorously by Bayesian Semantic Entropy uncertainty.',
    keyHighlights: [
      'Seven weighted pillars: Entity Authority, GSoV, Citations, Category Positioning, Fact Density, Framing, Trust.',
      'Uncertainty Penalty: High entropy (H_sem > 0.45) directly degrades aggregate perception score.',
      'Grade A (87.4/100) with instantaneous drilldowns into key drivers and urgent deficits.'
    ],
    executiveTakeaway: 'Provides board-level quant metrics on how frontier LLMs and AI search engines view your enterprise.'
  },
  {
    id: 'competitive-gsov',
    tab: 'competitive',
    title: 'Cross-Competitor Generative Share of Voice (GSoV)',
    badge: 'Market Mindshare (FR-INT-01)',
    icon: Layers,
    description: 'Benchmarks your brand head-to-head against direct competitors across cold commercial intent queries on ChatGPT, Perplexity, Claude 3.7, and Google AI Overviews.',
    keyHighlights: [
      'GSoV % mindshare tracker across buyer-intent prompt panels.',
      'Citation Gap Explorer: Identifies high-authority domains citing competitors but missing your brand.',
      'Win/Loss Prompt Diagnoses: Root-cause analysis of winning vs losing query states.'
    ],
    executiveTakeaway: 'Uncovers citation leakage to competitors and quantifies market share capture in AI answer engines.'
  },
  {
    id: 'semantic-entropy',
    tab: 'panels',
    title: 'Semantic Entropy & Hallucination Defense',
    badge: 'Farquhar et al. 2024 (FR-PER-03)',
    icon: ShieldAlert,
    description: 'Detects parametric hallucination risk in real-time by clustering sampled generations via bi-directional entailment without ground-truth labels.',
    keyHighlights: [
      'Computes semantic entropy H_sem across 5-20 temperature-perturbed LLM completions.',
      'Divergence Alerting: Flags high hallucination risk when H_sem exceeds the 0.45 safety threshold.',
      'Sub-35ms vector cluster classification using PostgreSQL pgvector partitioning.'
    ],
    executiveTakeaway: 'Protects enterprise brand reputation before inaccurate or hallucinated AI answers reach buyers.'
  },
  {
    id: 'kdd-optimization',
    tab: 'optimizer',
    title: 'Princeton KDD-2024 Optimization & Autonomous CMS',
    badge: 'Autonomous AEO (FR-OPT-01)',
    icon: GitBranch,
    description: 'Applies peer-reviewed content optimization levers (Citation Injection, Stat Corroboration, Entity Anchoring) with multi-sig cryptographic approvals.',
    keyHighlights: [
      'Empirical Lift Calculator: Predicted +26.8% citation visibility gain across AI search answers.',
      'Dual AST-diff viewer highlighting semantic changes before staging.',
      'ECDSA multisig verification preventing unauthorized CMS deployments.'
    ],
    executiveTakeaway: 'Transforms passive SEO into closed-loop generative engine optimization with provable empirical lift.'
  },
  {
    id: 'async-scheduler',
    tab: 'scheduler',
    title: '24/7 Async Background Queue & Webhook Alerts',
    badge: 'Mission-Critical Ops',
    icon: Clock,
    description: 'High-concurrency priority task queue, automated recurring cron perception audits, and HMAC-SHA256 authenticated multi-channel alert dispatchers.',
    keyHighlights: [
      'Priority job executor (CRITICAL, HIGH, NORMAL) with real-time SSE progress telemetry.',
      'Automated recurring audit scheduler (Daily, Weekly, Monthly cron sweeps).',
      'Multi-channel webhooks for Slack, Microsoft Teams, and PagerDuty with signature verification.'
    ],
    executiveTakeaway: 'Continuous 24/7 brand defense with zero manual overhead and instant incident alerting.'
  },
  {
    id: 'security-billing',
    tab: 'security',
    title: 'Enterprise Single Sign-On (SSO) & Stripe Billing',
    badge: 'Enterprise Security & Metering',
    icon: CreditCard,
    description: 'Production-ready SAML 2.0 / Okta federation, 5-tier role-based access control (RBAC), and metered token quota tracking with two-tier cache ROI.',
    keyHighlights: [
      '5-Tier RBAC (Super Admin, Security Admin, Optimization Engineer, Brand Analyst, Viewer).',
      'Cryptographic JWT session vault with remote session killswitches.',
      'Token quota tracking & ROI calculator highlighting $4,400+/mo saved via semantic caching.'
    ],
    executiveTakeaway: 'Full SOC 2 Type II compliance and transparent B2B usage metering with verifiable cost savings.'
  }
];

interface ExecutiveProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const ExecutiveProductTour: React.FC<ExecutiveProductTourProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange
}) => {
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0);

  // Sync tab with step if tour opens
  useEffect(() => {
    if (isOpen) {
      const step = TOUR_STEPS[currentStepIndex];
      if (step && activeTab !== step.tab) {
        onTabChange(step.tab);
      }
    }
  }, [isOpen, currentStepIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      onTabChange(TOUR_STEPS[nextIdx].tab);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      onTabChange(TOUR_STEPS[prevIdx].tab);
    }
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    onTabChange(TOUR_STEPS[index].tab);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end sm:justify-center items-center p-4 sm:p-6">
      {/* Dimmed Background Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-[2px] transition-opacity pointer-events-auto"
        onClick={onClose}
      />

      {/* Spotlight Tour Card */}
      <div className="relative w-full max-w-2xl bg-[#090d16]/95 border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 backdrop-blur-xl pointer-events-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                  Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-500/30">
                  {currentStep.badge}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Tour (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tour Step Body */}
        <div className="py-5 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Key Capabilities */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Enterprise Architectural Superpowers
            </div>
            <div className="space-y-2">
              {currentStep.keyHighlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Takeaway Box */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg px-4 py-3 flex items-start gap-3">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold uppercase text-emerald-400 block font-mono">
                Executive Takeaway
              </span>
              <p className="text-xs text-emerald-200/90 leading-relaxed mt-0.5">
                {currentStep.executiveTakeaway}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Progress */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          {/* Step Dots Tracker */}
          <div className="flex items-center gap-2">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => handleJumpToStep(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentStepIndex
                    ? 'w-8 bg-emerald-400 shadow-lg shadow-emerald-500/50'
                    : idx < currentStepIndex
                    ? 'w-2.5 bg-emerald-700/80 hover:bg-emerald-600'
                    : 'w-2.5 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Go to step ${idx + 1}: ${step.title}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                isFirstStep
                  ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                  : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all duration-150"
            >
              <span>{isLastStep ? 'Complete Tour' : 'Next Step'}</span>
              {isLastStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="mt-3 text-center text-[11px] text-slate-500 font-mono hidden sm:block">
          Use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">←</kbd> and <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">→</kbd> to navigate &bull; <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">Esc</kbd> to exit
        </div>
      </div>
    </div>
  );
};
