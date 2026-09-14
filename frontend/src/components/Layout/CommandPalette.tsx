import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Radio,
  TrendingUp,
  Swords,
  Scale,
  Share2,
  FlaskConical,
  ShieldAlert,
  MessageSquareCode,
  Activity,
  Flame,
  FileText,
  Globe,
  FileDiff,
  Share2 as ShareIcon,
  FileCode,
  Send,
  Zap,
  Bot,
  GitPullRequest,
  BarChart3,
  ShieldCheck,
  Cpu,
  Clock,
  Lock,
  CreditCard,
  Building2,
  Key,
  Database,
  Terminal,
  Shield,
  Sparkles,
  ArrowRight,
  Command,
  CornerDownLeft,
  X
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onSelectBrand: (brand: string) => void;
  onTriggerAudit: () => void;
  activeBrand: string;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Modules' | 'Brands' | 'Actions';
  subtitle?: string;
  badge?: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSelectBrand,
  onTriggerAudit,
  activeBrand
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const allCommands: CommandItem[] = [
    // Quick Actions
    {
      id: 'action-audit',
      title: 'Trigger Real-Time GEO Audit',
      category: 'Actions',
      subtitle: 'Fan-out synthetic probes across all 7 frontier AI engines',
      badge: 'PROBE ALL',
      icon: Sparkles,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      action: () => {
        onTriggerAudit();
        onClose();
      }
    },
    {
      id: 'action-crawler',
      title: 'Run Headless AST Web Crawler',
      category: 'Actions',
      subtitle: 'Crawl domain and synthesize /llms-full.txt context bundle',
      badge: 'CRAWLER',
      icon: Globe,
      color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      action: () => {
        onSelectTab('ingestion');
        onClose();
      }
    },
    {
      id: 'action-soc2',
      title: 'Verify AICPA SOC2 Merkle Proof Chain',
      category: 'Actions',
      subtitle: 'Cryptographic SHA-256 validation across 18 automated controls',
      badge: 'SOC2 PROOF',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      action: () => {
        onSelectTab('soc2compliance');
        onClose();
      }
    },
    {
      id: 'action-pdf',
      title: 'Generate C-Suite Executive Board PDF',
      category: 'Actions',
      subtitle: 'Mint signed compliance dossier with KDD impact diffs',
      badge: 'EXPORT',
      icon: FileText,
      color: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40',
      action: () => {
        onSelectTab('reporting');
        onClose();
      }
    },

    // Brands
    {
      id: 'brand-psychs',
      title: 'Switch to Psychs (Primary Workspace)',
      category: 'Brands',
      subtitle: 'Enterprise GEO Platform • Perception: 87.4 • SOV: 84.5%',
      badge: activeBrand === 'Psychs' ? 'CURRENT' : 'SELECT',
      icon: Sparkles,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      action: () => {
        onSelectBrand('Psychs');
        onClose();
      }
    },
    {
      id: 'brand-stripe',
      title: 'Switch to Stripe Benchmark',
      category: 'Brands',
      subtitle: 'Fintech & Global Payments • Perception: 89.6 • SOV: 82.1%',
      badge: activeBrand === 'Stripe' ? 'CURRENT' : 'SELECT',
      icon: CreditCard,
      color: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40',
      action: () => {
        onSelectBrand('Stripe');
        onClose();
      }
    },
    {
      id: 'brand-snowflake',
      title: 'Switch to Snowflake Benchmark',
      category: 'Brands',
      subtitle: 'Data Cloud & Lakehouse • Perception: 86.2 • SOV: 79.4%',
      badge: activeBrand === 'Snowflake' ? 'CURRENT' : 'SELECT',
      icon: Database,
      color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      action: () => {
        onSelectBrand('Snowflake');
        onClose();
      }
    },
    {
      id: 'brand-vercel',
      title: 'Switch to Vercel Benchmark',
      category: 'Brands',
      subtitle: 'Frontend Cloud & Next.js • Perception: 91.8 • SOV: 88.7%',
      badge: activeBrand === 'Vercel' ? 'CURRENT' : 'SELECT',
      icon: Globe,
      color: 'text-rose-400 bg-rose-950/60 border-rose-500/40',
      action: () => {
        onSelectBrand('Vercel');
        onClose();
      }
    },

    // Modules
    {
      id: 'mod-overview',
      title: 'Executive Command Center',
      category: 'Modules',
      subtitle: '7-Dimensional Composite Perception & Semantic Entropy (H_sem)',
      icon: LayoutDashboard,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      action: () => {
        onSelectTab('overview');
        onClose();
      }
    },
    {
      id: 'mod-panels',
      title: 'Cold Prompt Panels & Fan-Out Matrix',
      category: 'Modules',
      subtitle: 'Real-time multi-engine probe evaluation across 50 query vectors',
      icon: Radio,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
      action: () => {
        onSelectTab('panels');
        onClose();
      }
    },
    {
      id: 'mod-competitive',
      title: 'Competitive Intelligence & GSoV',
      category: 'Modules',
      subtitle: 'Generative Share of Voice, Citation Gaps, and Peer Triangulation',
      icon: TrendingUp,
      color: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
      action: () => {
        onSelectTab('competitive');
        onClose();
      }
    },
    {
      id: 'mod-counterpositioning',
      title: 'Counter-Positioning & Search Siphoning',
      category: 'Modules',
      subtitle: 'Automated /vs/ comparative routes and Schema.org Table synthesis',
      icon: Swords,
      color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      action: () => {
        onSelectTab('counterpositioning');
        onClose();
      }
    },
    {
      id: 'mod-tribunal',
      title: 'Multi-Model Dispute Tribunal & Errata Dispatch',
      category: 'Modules',
      subtitle: 'Fleiss Kappa consensus, S_dispute index, and ClaimReview JSON-LD',
      icon: Scale,
      color: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
      action: () => {
        onSelectTab('tribunal');
        onClose();
      }
    },
    {
      id: 'mod-citationseeds',
      title: 'Authority Citation Seed Network',
      category: 'Modules',
      subtitle: 'High-authority community seeding on Reddit, GitHub, and arXiv',
      icon: Share2,
      color: 'text-teal-400 bg-teal-950/40 border-teal-500/30',
      action: () => {
        onSelectTab('citationseeds');
        onClose();
      }
    },
    {
      id: 'mod-abautopilot',
      title: 'A/B Variant Autopilot & Bayesian Evaluator',
      category: 'Modules',
      subtitle: 'Statistical edge routing with SPRT samplers and GitOps promotion',
      icon: FlaskConical,
      color: 'text-pink-400 bg-pink-950/40 border-pink-500/30',
      action: () => {
        onSelectTab('abautopilot');
        onClose();
      }
    },
    {
      id: 'mod-poisoningsentinel',
      title: 'Negative SEO Sentinel & KG Defense',
      category: 'Modules',
      subtitle: 'Adversarial Wikidata poisoning scanning and instant rollback triples',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
      action: () => {
        onSelectTab('poisoningsentinel');
        onClose();
      }
    },
    {
      id: 'mod-buyerjourney',
      title: 'Conversational Buyer Journey Simulator',
      category: 'Modules',
      subtitle: '5-Persona multi-turn intent simulation and CSoR funnel metrics',
      icon: MessageSquareCode,
      color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
      action: () => {
        onSelectTab('buyerjourney');
        onClose();
      }
    },
    {
      id: 'mod-seismograph',
      title: 'Frontier AI Query Seismograph & Push Center',
      category: 'Modules',
      subtitle: 'Real-time volatility tracking and multi-channel webhook dispatch',
      icon: Activity,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      action: () => {
        onSelectTab('seismograph');
        onClose();
      }
    },
    {
      id: 'mod-indexwatch',
      title: 'Algorithm Volatility Radar (IndexWatch)',
      category: 'Modules',
      subtitle: 'Frontier model update detection, V_algo, and automated hedge playbooks',
      icon: Flame,
      color: 'text-orange-400 bg-orange-950/40 border-orange-500/30',
      action: () => {
        onSelectTab('indexwatch');
        onClose();
      }
    },
    {
      id: 'mod-reporting',
      title: 'Boardroom Decks & C-Suite Reports',
      category: 'Modules',
      subtitle: 'Executive PDF generation and verifiable SHA-256 compliance receipts',
      icon: FileText,
      color: 'text-slate-300 bg-slate-800/40 border-slate-700/30',
      action: () => {
        onSelectTab('reporting');
        onClose();
      }
    },
    {
      id: 'mod-ingestion',
      title: 'Autonomous Headless Crawler & Ingestion',
      category: 'Modules',
      subtitle: 'Zero-trust AST DOM parser and master /llms-full.txt context synthesis',
      icon: Globe,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
      action: () => {
        onSelectTab('ingestion');
        onClose();
      }
    },
    {
      id: 'mod-optimizer',
      title: 'Princeton KDD-2024 Content Optimizer',
      category: 'Modules',
      subtitle: 'Statistical addition, quote corroboration, and AST DOM transformations',
      icon: FileDiff,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      action: () => {
        onSelectTab('optimizer');
        onClose();
      }
    },
    {
      id: 'mod-knowledgegraph',
      title: 'Knowledge Graph & Wikidata Sync Hub',
      category: 'Modules',
      subtitle: 'Schema.org JSON-LD microdata, SPARQL query endpoint, and triples',
      icon: ShareIcon,
      color: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
      action: () => {
        onSelectTab('knowledgegraph');
        onClose();
      }
    },
    {
      id: 'mod-machinereadable',
      title: 'Machine-Readable Files Hub (/llms.txt)',
      category: 'Modules',
      subtitle: 'Programmatic synthesis of /llms.txt, schema.json, and robots.txt',
      icon: FileCode,
      color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
      action: () => {
        onSelectTab('machinereadable');
        onClose();
      }
    },
    {
      id: 'mod-cms',
      title: 'Autonomous CMS & Edge Publisher',
      category: 'Modules',
      subtitle: 'Direct Cloudflare Workers KV edge cache injection and webhook publish',
      icon: Send,
      color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      action: () => {
        onSelectTab('cms');
        onClose();
      }
    },
    {
      id: 'mod-canaries',
      title: 'Canary Probe & Engine Drift Monitor',
      category: 'Modules',
      subtitle: '24/7 background canary probes detecting LLM engine output divergence',
      icon: Zap,
      color: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30',
      action: () => {
        onSelectTab('canaries');
        onClose();
      }
    },
    {
      id: 'mod-sampler',
      title: 'Adaptive SPRT Sampler & Budget Gate',
      category: 'Modules',
      subtitle: 'Wald Sequential Probability Ratio Test for optimal token expenditure',
      icon: Bot,
      color: 'text-teal-400 bg-teal-950/40 border-teal-500/30',
      action: () => {
        onSelectTab('sampler');
        onClose();
      }
    },
    {
      id: 'mod-gitops',
      title: 'GitOps PR Automation & Multi-Sig Studio',
      category: 'Modules',
      subtitle: 'Automated GitHub pull requests with Princeton KDD diffs & cryptographic seals',
      icon: GitPullRequest,
      color: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
      action: () => {
        onSelectTab('gitops');
        onClose();
      }
    },
    {
      id: 'mod-attribution',
      title: 'Econometric Causal Attribution (BSTS)',
      category: 'Modules',
      subtitle: 'Bayesian Structural Time Series isolating generative engine revenue lift',
      icon: BarChart3,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      action: () => {
        onSelectTab('attribution');
        onClose();
      }
    },
    {
      id: 'mod-pentest',
      title: 'Adversarial Pen-Test Studio',
      category: 'Modules',
      subtitle: 'Simulate prompt injection attacks and verify zero-trust defensive filters',
      icon: ShieldAlert,
      color: 'text-red-400 bg-red-950/40 border-red-500/30',
      action: () => {
        onSelectTab('pentest');
        onClose();
      }
    },
    {
      id: 'mod-botarmor',
      title: 'AI Bot Traffic Armor & WAF Rules',
      category: 'Modules',
      subtitle: 'Inspect AI search crawler traffic and synthesize Cloudflare WAF policies',
      icon: ShieldCheck,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
      action: () => {
        onSelectTab('botarmor');
        onClose();
      }
    },
    {
      id: 'mod-network',
      title: 'Residential Proxy Mesh & JA4 Egress',
      category: 'Modules',
      subtitle: '4,250+ rotating residential IPs with JA3/JA4 TLS fingerprint spoofing',
      icon: Cpu,
      color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
      action: () => {
        onSelectTab('network');
        onClose();
      }
    },
    {
      id: 'mod-scheduler',
      title: 'Automated Audit Scheduler & Workers',
      category: 'Modules',
      subtitle: '24/7 background worker queue with cron cadence and HMAC webhooks',
      icon: Clock,
      color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      action: () => {
        onSelectTab('scheduler');
        onClose();
      }
    },
    {
      id: 'mod-security',
      title: 'Enterprise RBAC, SSO SAML & KMS Shredding',
      category: 'Modules',
      subtitle: 'Sub-60s GDPR Article 17 cryptographic key destruction & audit logs',
      icon: Lock,
      color: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
      action: () => {
        onSelectTab('security');
        onClose();
      }
    },
    {
      id: 'mod-billing',
      title: 'Metered Token Quota & Cost Tracking',
      category: 'Modules',
      subtitle: 'High-throughput metered API ledger and semantic Redis cache savings',
      icon: CreditCard,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      action: () => {
        onSelectTab('billing');
        onClose();
      }
    },
    {
      id: 'mod-agency',
      title: 'Agency Multi-Tenancy & White-Label Portals',
      category: 'Modules',
      subtitle: 'Custom CNAME domains, edge SSL provisioning, and automated dispatch',
      icon: Building2,
      color: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
      action: () => {
        onSelectTab('agency');
        onClose();
      }
    },
    {
      id: 'mod-settings',
      title: 'Live API Connectors & Key Vault',
      category: 'Modules',
      subtitle: 'Configure real-time credentials for GPT-6 Astra, Gemini 3.7, Claude Fable 5.1',
      icon: Key,
      color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      action: () => {
        onSelectTab('settings');
        onClose();
      }
    },
    {
      id: 'mod-economics',
      title: 'Dynamic Model Routing & Unit Economics',
      category: 'Modules',
      subtitle: '3-Tier prompt classification delivering 97.1% verified gross margins',
      icon: Database,
      color: 'text-teal-400 bg-teal-950/40 border-teal-500/30',
      action: () => {
        onSelectTab('economics');
        onClose();
      }
    },
    {
      id: 'mod-mcp',
      title: 'Autonomous Model Context Protocol (MCP) Console',
      category: 'Modules',
      subtitle: '5-Level security enforcement and real-time JSON-RPC tool orchestration',
      icon: Terminal,
      color: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
      action: () => {
        onSelectTab('mcp');
        onClose();
      }
    },
    {
      id: 'mod-audit',
      title: 'Immutable WORM Audit Vault & Compliance Logs',
      category: 'Modules',
      subtitle: 'Cryptographic SHA-256 Merkle chain and tamper-proof verification',
      icon: Shield,
      color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30',
      action: () => {
        onSelectTab('audit');
        onClose();
      }
    },
    {
      id: 'mod-soc2compliance',
      title: 'SOC2 Type II Continuous Compliance & Merkle Studio',
      category: 'Modules',
      subtitle: 'AICPA Trust Services Criteria (TSC) evaluation & tamper-proof dossier',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      action: () => {
        onSelectTab('soc2compliance');
        onClose();
      }
    }
  ];

  const filteredCommands = allCommands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.badge && cmd.badge.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0a0f1d] border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[80vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 blur-sm" />

        {/* Search Header Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/50">
          <Search className="w-5 h-5 text-emerald-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search all 31 enterprise modules, benchmark brands, or actions (e.g. 'crawler', 'soc2', 'audit')..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-400 hover:text-slate-200 font-mono border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-medium text-slate-400">No matching modules or actions found</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for &quot;perception&quot;, &quot;soc2&quot;, &quot;probes&quot;, or &quot;Stripe&quot;</p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-slate-800/90 text-white border border-emerald-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg border shrink-0 ${cmd.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-tight">{cmd.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                          {cmd.category}
                        </span>
                      </div>
                      {cmd.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{cmd.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {cmd.badge && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {cmd.badge}
                      </span>
                    )}
                    {isSelected && (
                      <div className="flex items-center text-xs text-emerald-400 font-mono">
                        <CornerDownLeft className="w-3.5 h-3.5 ml-1" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 py-2.5 bg-[#070b16] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="kbd-shortcut">↑</span>
              <span className="kbd-shortcut">↓</span> to navigate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="kbd-shortcut">↵</span> to select
            </span>
            <span className="flex items-center gap-1.5">
              <span className="kbd-shortcut">ESC</span> to close
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-live" />
            <span>31 Enterprise Modules Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
