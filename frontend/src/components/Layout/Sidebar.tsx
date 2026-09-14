import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Radio,
  TrendingUp,
  FileDiff,
  FileCode,
  Send,
  Zap,
  Bot,
  ShieldCheck,
  ShieldAlert,
  Activity,
  GitPullRequest,
  BarChart3,
  Key,
  Clock,
  Lock,
  CreditCard,
  FileText,
  Globe,
  Share2,
  Flame,
  Building2,
  Swords,
  Scale,
  FlaskConical,
  MessageSquareCode,
  Search,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

export type NavTab = 
  | 'overview'
  | 'panels'
  | 'competitive'
  | 'counterpositioning'
  | 'tribunal'
  | 'citationseeds'
  | 'abautopilot'
  | 'poisoningsentinel'
  | 'buyerjourney'
  | 'seismograph'
  | 'reporting'
  | 'indexwatch'
  | 'ingestion'
  | 'optimizer'
  | 'knowledgegraph'
  | 'machinereadable'
  | 'cms'
  | 'canaries'
  | 'sampler'
  | 'gitops'
  | 'attribution'
  | 'pentest'
  | 'botarmor'
  | 'scheduler'
  | 'security'
  | 'billing'
  | 'agency'
  | 'settings'
  | 'network'
  | 'economics'
  | 'mcp'
  | 'audit'
  | 'soc2compliance';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const navSections = [
    {
      title: 'Perception & Intelligence',
      items: [
        {
          id: 'overview' as NavTab,
          label: 'Command Center',
          sublabel: '7-Dim Perception & H_sem',
          icon: LayoutDashboard,
          badge: 'Score: 87.4'
        },
        {
          id: 'panels' as NavTab,
          label: 'Cold Prompt Panels',
          sublabel: 'Multi-Engine Fan-out (50)',
          icon: Radio,
          badge: '7 Engines'
        },
        {
          id: 'competitive' as NavTab,
          label: 'Competitive Intel',
          sublabel: 'GSoV & Citation Gaps',
          icon: TrendingUp,
          badge: '84.5% SOV'
        },
        {
          id: 'counterpositioning' as NavTab,
          label: 'Counter-Positioning Matrix',
          sublabel: 'Search Siphoning & /vs/ Schema',
          icon: Swords,
          badge: '+24.8% SOV'
        },
        {
          id: 'tribunal' as NavTab,
          label: 'Dispute Tribunal & Errata',
          sublabel: 'Consensus & ClaimReview',
          icon: Scale,
          badge: '3 Cases'
        },
        {
          id: 'citationseeds' as NavTab,
          label: 'Authority Seed Network',
          sublabel: 'Grounding Graph & Outreach',
          icon: Share2,
          badge: '+31.4% Lift'
        },
        {
          id: 'abautopilot' as NavTab,
          label: 'A/B Variant Autopilot',
          sublabel: 'Bayesian Edge Testing Sandbox',
          icon: FlaskConical,
          badge: '+28.6% Lift'
        },
        {
          id: 'poisoningsentinel' as NavTab,
          label: 'Negative SEO Sentinel',
          sublabel: 'KG Poisoning & QuickStatements',
          icon: ShieldAlert,
          badge: '1 Threat'
        },
        {
          id: 'buyerjourney' as NavTab,
          label: 'Buyer Journey Simulator',
          sublabel: '5-Persona Intent & CSoR Funnel',
          icon: MessageSquareCode,
          badge: '84.0% CSoR'
        },
        {
          id: 'seismograph' as NavTab,
          label: 'Seismograph & Push Center',
          sublabel: 'Real-Time Volatility & Push Matrix',
          icon: Activity,
          badge: 'V_algo: 74.8'
        },
        {
          id: 'indexwatch' as NavTab,
          label: 'Algorithm Volatility Radar',
          sublabel: 'Frontier AI Volatility V_algo',
          icon: Flame,
          badge: 'IndexWatch'
        },
        {
          id: 'reporting' as NavTab,
          label: 'Boardroom Decks',
          sublabel: 'Executive PDF & C-Suite Export',
          icon: FileText,
          badge: 'C-Suite'
        }
      ]
    },
    {
      title: 'Autonomous Ingestion & Optimization',
      items: [
        {
          id: 'ingestion' as NavTab,
          label: 'Headless Web Crawler',
          sublabel: 'Recursive Ingest & /llms-full.txt',
          icon: Globe,
          badge: 'Recursive AST'
        },
        {
          id: 'optimizer' as NavTab,
          label: 'Princeton KDD Optimizer',
          sublabel: 'Empirical Lift Levers (+24.6%)',
          icon: FileDiff,
          badge: '+24.6% Lift'
        },
        {
          id: 'knowledgegraph' as NavTab,
          label: 'Wikidata & Schema Hub',
          sublabel: 'JSON-LD & SPARQL Endpoint',
          icon: Share2,
          badge: 'Graph Sync'
        },
        {
          id: 'machinereadable' as NavTab,
          label: 'Machine-Readable Files',
          sublabel: '/llms.txt, schema, robots.txt',
          icon: FileCode,
          badge: '/llms.txt'
        },
        {
          id: 'cms' as NavTab,
          label: 'Edge CMS Publisher',
          sublabel: 'Cloudflare KV & Git Webhooks',
          icon: Send,
          badge: 'Instant Live'
        }
      ]
    },
    {
      title: 'Statistical Drift & Attribution',
      items: [
        {
          id: 'canaries' as NavTab,
          label: 'Canary Probe Monitor',
          sublabel: '24/7 Drift Divergence Probes',
          icon: Zap,
          badge: '24/7 Active'
        },
        {
          id: 'sampler' as NavTab,
          label: 'Adaptive SPRT Sampler',
          sublabel: 'Sequential Budget Control',
          icon: Bot,
          badge: '68% Savings'
        },
        {
          id: 'gitops' as NavTab,
          label: 'GitOps PR Automation',
          sublabel: 'Multi-Sig Pull Requests',
          icon: GitPullRequest,
          badge: 'Multi-Sig'
        },
        {
          id: 'attribution' as NavTab,
          label: 'Causal Attribution (BSTS)',
          sublabel: 'Bayesian Revenue Isolation',
          icon: BarChart3,
          badge: 'BSTS Model'
        }
      ]
    },
    {
      title: 'Adversarial Defense & Network',
      items: [
        {
          id: 'pentest' as NavTab,
          label: 'Adversarial Pen-Test',
          sublabel: 'Prompt Injection Defense',
          icon: ShieldAlert,
          badge: '98.4/100'
        },
        {
          id: 'botarmor' as NavTab,
          label: 'AI Bot Traffic Armor',
          sublabel: 'WAF Rule Synthesis & Telemetry',
          icon: ShieldCheck,
          badge: 'Cloudflare WAF'
        },
        {
          id: 'scheduler' as NavTab,
          label: 'Audit Task Scheduler',
          sublabel: 'Worker Queue & Webhooks',
          icon: Clock,
          badge: 'HMAC Webhook'
        },
        {
          id: 'security' as NavTab,
          label: 'RBAC & Enterprise SSO',
          sublabel: 'SAML, MFA & Audit Trails',
          icon: Lock,
          badge: 'Zero-Trust'
        },
        {
          id: 'billing' as NavTab,
          label: 'Metered Token Quota',
          sublabel: 'Usage Billing & Ledger',
          icon: CreditCard,
          badge: 'Metered'
        },
        {
          id: 'agency' as NavTab,
          label: 'Agency White-Label',
          sublabel: 'Multi-Client Portals & CNAME',
          icon: Building2,
          badge: 'Enterprise'
        }
      ]
    },
    {
      title: 'Architecture & Egress',
      items: [
        {
          id: 'settings' as NavTab,
          label: 'API & Proxy Gateway',
          sublabel: 'Frontier Keys & 4,250 IPs',
          icon: Key,
          badge: 'Live Pool'
        },
        {
          id: 'network' as NavTab,
          label: 'Multi-Region Egress',
          sublabel: '4 Clusters & JA3/JA4 Mesh',
          icon: Globe,
          badge: '4 Regions'
        },
        {
          id: 'economics' as NavTab,
          label: 'Model Router & Cache',
          sublabel: 'Unit Economics & Margins',
          icon: Zap,
          badge: '97% Margin'
        },
        {
          id: 'mcp' as NavTab,
          label: 'Autonomous MCP Agent',
          sublabel: '5-Level Permission Control',
          icon: Bot,
          badge: 'Level 4'
        },
        {
          id: 'audit' as NavTab,
          label: 'Audit Vault & Security',
          sublabel: 'WORM Logs & Crypto-Shred',
          icon: ShieldCheck,
          badge: '4-Tier'
        },
        {
          id: 'soc2compliance' as NavTab,
          label: 'SOC2 Type II Compliance',
          sublabel: 'Continuous Audit & Merkle Proofs',
          icon: ShieldCheck,
          badge: 'SOC2: 100%'
        }
      ]
    }
  ];

  const filteredSections = useMemo(() => {
    if (!filterQuery.trim()) return navSections;
    const q = filterQuery.toLowerCase();
    return navSections
      .map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            item.label.toLowerCase().includes(q) ||
            item.sublabel.toLowerCase().includes(q) ||
            item.badge.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q)
        )
      }))
      .filter(section => section.items.length > 0);
  }, [filterQuery]);

  return (
    <aside className="w-64 bg-[#060913]/95 border-r border-slate-800/80 flex flex-col justify-between p-3 shrink-0 h-screen overflow-y-auto custom-scrollbar">
      <div className="space-y-3.5">
        {/* In-Sidebar Search Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter 31 modules..."
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        {filteredSections.map((section, sIdx) => {
          const isCollapsed = collapsedSections[section.title] && !filterQuery;
          return (
            <div key={sIdx} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-200 uppercase transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-transform" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-transform" />
                  )}
                  <span>{section.title}</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 font-normal">
                  ({section.items.length})
                </span>
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 animate-in fade-in duration-150">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-all group cursor-pointer relative ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500/20 via-slate-800/80 to-slate-900/60 text-white border border-emerald-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-r-full shadow-sm shadow-emerald-400/80" />
                        )}

                        <div className="flex items-center gap-2.5 min-w-0 pl-0.5">
                          <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                          <div className="truncate">
                            <div className={`text-xs font-medium leading-none truncate ${isActive ? 'text-white font-semibold' : ''}`}>
                              {item.label}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 leading-none truncate">{item.sublabel}</div>
                          </div>
                        </div>

                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ml-1 border ${
                          isActive 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold' 
                            : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                        }`}>
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Security Badge */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 px-2 text-[10px] text-slate-400 shrink-0 bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/40">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Compliance:</span>
          </span>
          <span className="text-emerald-400 font-mono font-semibold">SOC2 Type II</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>GDPR Crypto-Shred:</span>
          </span>
          <span className="text-cyan-400 font-mono font-semibold">&lt;60s SLA</span>
        </div>
      </div>
    </aside>
  );
};
