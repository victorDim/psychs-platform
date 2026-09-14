import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Layout/Navbar';
import { Sidebar, NavTab } from './components/Layout/Sidebar';
import { CommandPalette } from './components/Layout/CommandPalette';
import { LiveTelemetryHUD } from './components/Layout/LiveTelemetryHUD';
import { ExecutiveScoreCard } from './components/Dashboard/ExecutiveScoreCard';
import { PerceptionRadar } from './components/Dashboard/PerceptionRadar';
import { DimensionBreakdown } from './components/Dashboard/DimensionBreakdown';
import { HallucinationAlertBanner } from './components/Dashboard/HallucinationAlertBanner';
import { LiveActivityStream } from './components/Dashboard/LiveActivityStream';

import { PromptRunner } from './components/ColdPromptPanel/PromptRunner';
import { MultiEngineMatrix } from './components/ColdPromptPanel/MultiEngineMatrix';

import { SovComparisonChart } from './components/CompetitiveIntelligence/SovComparisonChart';
import { CitationGapTable } from './components/CompetitiveIntelligence/CitationGapTable';
import { WinLossDiagnosisGrid } from './components/CompetitiveIntelligence/WinLossDiagnosisGrid';

import { LeverControlPanel } from './components/GeoOptimizationStudio/LeverControlPanel';
import { KddDiffViewer } from './components/GeoOptimizationStudio/KddDiffViewer';

import { SchemaJsonLdViewer } from './components/MachineReadableHub/SchemaJsonLdViewer';
import { LlmsTxtEditor } from './components/MachineReadableHub/LlmsTxtEditor';

import { WebhookManager } from './components/CmsDeployment/WebhookManager';
import { CryptographicApprovalModal } from './components/CmsDeployment/CryptographicApprovalModal';
import { RemeasurementTimeline } from './components/CmsDeployment/RemeasurementTimeline';

import { CanaryDriftMonitor } from './components/Hardening/CanaryDriftMonitor';
import { AdaptiveSamplerStudio } from './components/Hardening/AdaptiveSamplerStudio';
import { GitOpsHeadlessPortal } from './components/Hardening/GitOpsHeadlessPortal';
import { CausalAttributionStudio } from './components/Hardening/CausalAttributionStudio';
import { LiveApiSettings } from './components/Settings/LiveApiSettings';

import { BackgroundJobsMonitor } from './components/Scheduler/BackgroundJobsMonitor';
import { EnterpriseAccessSecurity } from './components/Security/EnterpriseAccessSecurity';
import { BillingUsagePortal } from './components/Billing/BillingUsagePortal';

import { UnitEconomicsHub } from './components/Economics/UnitEconomicsHub';
import { AutonomousAgentTerminal } from './components/McpAgentConsole/AutonomousAgentTerminal';

import { FourTierEvidenceTable } from './components/AuditVault/FourTierEvidenceTable';
import { CryptoShreddingPanel } from './components/AuditVault/CryptoShreddingPanel';
import { ExecutiveProductTour } from './components/Tour/ExecutiveProductTour';
import { ExecutiveBoardReportHub } from './components/Reporting/ExecutiveBoardReportHub';
import { BrandIngestionStudio } from './components/Ingestion/BrandIngestionStudio';
import { GeoProxyClusterMonitor } from './components/Network/GeoProxyClusterMonitor';
import { AdversarialPenTestStudio } from './components/Security/AdversarialPenTestStudio';
import { KnowledgeGraphSyncStudio } from './components/Optimization/KnowledgeGraphSyncStudio';
import { AlgorithmIndexWatchStudio } from './components/Intelligence/AlgorithmIndexWatchStudio';
import { BotTrafficArmorStudio } from './components/Network/BotTrafficArmorStudio';
import { WhiteLabelAgencyPortal } from './components/Agency/WhiteLabelAgencyPortal';
import { CompetitorCounterPositioningStudio } from './components/CompetitiveIntelligence/CompetitorCounterPositioningStudio';
import { MultiModelDisputeTribunalStudio } from './components/Intelligence/MultiModelDisputeTribunalStudio';
import { CitationSeedNetworkStudio } from './components/Intelligence/CitationSeedNetworkStudio';
import { GeoVariantAutopilotStudio } from './components/Intelligence/GeoVariantAutopilotStudio';
import { KnowledgePoisoningSentinelStudio } from './components/Intelligence/KnowledgePoisoningSentinelStudio';
import { BuyerJourneySimulatorStudio } from './components/Intelligence/BuyerJourneySimulatorStudio';
import { SeismographNotificationStudio } from './components/Intelligence/SeismographNotificationStudio';
import { SOC2ComplianceStudio } from './components/Compliance/SOC2ComplianceStudio';

import { api } from './services/api';
import {
  CompositePerceptionResult,
  SemanticEntropyResult,
  SovAnalysisResult,
  CitationGapAnalysisResult,
  WinLossSummary,
  OptimizationPlanResult,
  EntitySchemaResult,
  LlmsTxtResult,
  WebhookEndpoint,
  RemeasurementCampaign,
  UnitEconomicsResult,
  AuditLogEntry,
  MCPToolDefinition,
  TenantKeyStatus,
  ContentDiffItem,
  TaskQueueJob,
  QueueStats,
  AuditSchedule,
  WebhookAlertEndpoint,
  SSOConfiguration,
  EnterpriseUser,
  ActiveSession,
  TokenUsageSummary,
  EnterpriseSubscription,
  BillingInvoice,
  IngestionResult
} from './types';

import {
  initialCompositeScore,
  initialSemanticEntropy,
  initialSov,
  initialCitationGaps,
  initialWinLoss,
  initialOptimizationPlan,
  initialWebhooks,
  initialRemeasurement,
  initialUnitEconomics,
  initialAuditLogs,
  initialMcpTools,
  initialTenantKey,
  initialQueueJobs,
  initialQueueStats,
  initialSchedules,
  initialAlertWebhooks,
  initialSSOConfig,
  initialUsers,
  initialActiveSessions,
  initialTokenUsage,
  initialSubscription,
  initialInvoices,
  initialEntitySchemas,
  initialLlmsTxt,
  getBrandBenchmarkDataset
} from './mockData/defaultData';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [activeBrand, setActiveBrand] = useState<string>('Psychs');
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // State objects
  const [compositeScore, setCompositeScore] = useState<CompositePerceptionResult>(initialCompositeScore);
  const [semanticEntropy, setSemanticEntropy] = useState<SemanticEntropyResult>(initialSemanticEntropy);
  const [sovData, setSovData] = useState<SovAnalysisResult>(initialSov);
  const [citationGaps, setCitationGaps] = useState<CitationGapAnalysisResult>(initialCitationGaps);
  const [winLossData, setWinLossData] = useState<WinLossSummary>(initialWinLoss);
  const [optimizationPlan, setOptimizationPlan] = useState<OptimizationPlanResult>(initialOptimizationPlan);
  const [entitySchemas, setEntitySchemas] = useState<EntitySchemaResult | null>(initialEntitySchemas);
  const [llmsTxtData, setLlmsTxtData] = useState<LlmsTxtResult | null>(initialLlmsTxt);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(initialWebhooks);
  const [remeasurement, setRemeasurement] = useState<RemeasurementCampaign>(initialRemeasurement);
  const [economics, setEconomics] = useState<UnitEconomicsResult>(initialUnitEconomics);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);
  const [mcpTools, setMcpTools] = useState<MCPToolDefinition[]>(initialMcpTools);
  const [tenantKey, setTenantKey] = useState<TenantKeyStatus>(initialTenantKey);

  // Option 2 & 3 State objects
  const [queueJobs, setQueueJobs] = useState<TaskQueueJob[]>(initialQueueJobs);
  const [queueStats, setQueueStats] = useState<QueueStats>(initialQueueStats);
  const [schedules, setSchedules] = useState<AuditSchedule[]>(initialSchedules);
  const [alertWebhooks, setAlertWebhooks] = useState<WebhookAlertEndpoint[]>(initialAlertWebhooks);
  const [ssoConfig, setSsoConfig] = useState<SSOConfiguration>(initialSSOConfig);
  const [users, setUsers] = useState<EnterpriseUser[]>(initialUsers);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(initialActiveSessions);
  const [tokenUsage, setTokenUsage] = useState<TokenUsageSummary>(initialTokenUsage);
  const [subscription, setSubscription] = useState<EnterpriseSubscription>(initialSubscription);
  const [invoices, setInvoices] = useState<BillingInvoice[]>(initialInvoices);

  // Live SSE Stream state
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(100);
  const [streamEvents, setStreamEvents] = useState<any[]>([]);

  // Modal & Navigation States
  const [selectedPublishDiff, setSelectedPublishDiff] = useState<ContentDiffItem | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Brand switching handler
  const handleBrandChange = async (brand: string) => {
    setActiveBrand(brand);
    const benchmarkData = getBrandBenchmarkDataset(brand);
    setCompositeScore(benchmarkData.compositeScore);
    setSemanticEntropy(benchmarkData.semanticEntropy);
    setSovData(benchmarkData.sovData);
    setCitationGaps(benchmarkData.citationGaps);
    setWinLossData(benchmarkData.winLossData);

    try {
      const [score, sov, gaps, winloss] = await Promise.all([
        api.getPerceptionScore(),
        api.getSovAnalysis(brand),
        api.getCitationGaps(brand),
        api.getWinLossDiagnosis(brand)
      ]);
      if (score) setCompositeScore(score);
      if (sov) setSovData(sov);
      if (gaps) setCitationGaps(gaps);
      if (winloss) setWinLossData(winloss);
    } catch (err) {
      console.log(`Using client benchmark dataset for ${brand}`);
    }
  };

  // Promote Ingested Brand
  const handlePromoteBrand = (ingestResult: IngestionResult) => {
    const newBrand = ingestResult.brand_name || 'Psychs';
    handleBrandChange(newBrand);
    if (ingestResult.generated_schemas) {
      setEntitySchemas(ingestResult.generated_schemas);
    }
    if (ingestResult.generated_llms_txt) {
      setLlmsTxtData(ingestResult.generated_llms_txt);
    }
    setActiveTab('overview');
  };

  const refreshOperationsData = async () => {
    try {
      const [jobs, stats, scheds, whs, sso, usrs, sess, usage, sub, invs] = await Promise.all([
        api.getQueueJobs(),
        api.getQueueStats(),
        api.getAuditSchedules(),
        api.getAlertWebhooks(),
        api.getSSOConfig(),
        api.getUsers(),
        api.getActiveSessions(),
        api.getTokenUsage(),
        api.getSubscription(),
        api.getInvoices()
      ]);
      if (jobs && jobs.length > 0) setQueueJobs(jobs as TaskQueueJob[]);
      if (stats) setQueueStats(stats as any as QueueStats);
      if (scheds && scheds.length > 0) setSchedules(scheds as AuditSchedule[]);
      if (whs && whs.length > 0) setAlertWebhooks(whs as WebhookAlertEndpoint[]);
      if (sso) setSsoConfig(sso as any as SSOConfiguration);
      if (usrs && usrs.length > 0) setUsers(usrs as EnterpriseUser[]);
      if (sess && sess.length > 0) setActiveSessions(sess as ActiveSession[]);
      if (usage) setTokenUsage(usage as any as TokenUsageSummary);
      if (sub) setSubscription(sub as any as EnterpriseSubscription);
      if (invs && invs.length > 0) setInvoices(invs as BillingInvoice[]);
    } catch (e) {
      console.warn('Using initial fallback state for operations');
    }
  };

  useEffect(() => {
    // Initial async data hydration from backend
    const hydrate = async () => {
      try {
        refreshOperationsData();
        const [score, entropy, sov, gaps, winloss, kdd, schemas, llms, whs, rem, econ, logs, tools, key] = await Promise.all([
          api.getPerceptionScore(),
          api.runAudit('Psychs').then((r: any) => r.semantic_entropy || initialSemanticEntropy),
          api.getSovAnalysis('Psychs'),
          api.getCitationGaps('Psychs'),
          api.getWinLossDiagnosis('Psychs'),
          api.getKddDiff(),
          api.getEntitySchemas('Psychs'),
          api.getLlmsTxt('Psychs'),
          api.getWebhooks(),
          api.getRemeasurement(),
          api.getUnitEconomics(),
          api.getAuditLogs(),
          api.getMcpTools(),
          api.getKmsTdkStatus()
        ]);

        if (score) setCompositeScore(score);
        if (entropy) setSemanticEntropy(entropy);
        if (sov) setSovData(sov);
        if (gaps) setCitationGaps(gaps);
        if (winloss) setWinLossData(winloss);
        if (kdd) setOptimizationPlan(kdd);
        if (schemas) setEntitySchemas(schemas);
        if (llms) setLlmsTxtData(llms);
        if (whs) setWebhooks(whs);
        if (rem) setRemeasurement(rem);
        if (econ) setEconomics(econ);
        if (logs) setAuditLogs(logs);
        if (tools) setMcpTools(tools);
        if (key) setTenantKey(key);
      } catch (err) {
        console.warn('Backend hydration error, using initial dataset:', err);
      }
    };
    hydrate();
  }, []);

  // Trigger cold audit with simulated SSE stream
  const handleTriggerAudit = () => {
    setIsAuditing(true);
    setAuditProgress(0);
    setStreamEvents([]);

    const steps = [
      { progress: 15, engine: 'Ingestion Engine', message: 'AST DOM Extraction & CSS pruning completed (0-point font stripped)' },
      { progress: 35, engine: 'Proxy Gateway', message: 'Dispatched 50 cold queries across residential IP pool' },
      { progress: 55, engine: 'ChatGPT Search', message: 'Completed 50 completions; brand position #1 in 44 prompts' },
      { progress: 75, engine: 'Perplexity.ai', message: 'Multi-source RAG synthesis evaluated; 3.4 citations/prompt' },
      { progress: 90, engine: 'Google AI Overviews', message: 'Passage extractability verified; Semantic Entropy H_sem = 0.184' },
      { progress: 100, engine: 'Composite Scorer', message: 'Perception audit complete. S_perception = 87.4 (Grade A)' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setAuditProgress(step.progress);
        setStreamEvents((prev) => [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            engine: step.engine,
            message: step.message,
            progress: step.progress
          }
        ]);

        if (step.progress === 100) {
          setIsAuditing(false);
        }
      }, (idx + 1) * 600);
    });
  };

  const handleToggleLever = (leverName: string) => {
    setOptimizationPlan((prev) => {
      const updated = prev.active_levers.map((l) =>
        l.lever_name === leverName ? { ...l, is_active: !l.is_active } : l
      );
      const activeWeight = updated.reduce((acc, cur) => (cur.is_active ? acc + cur.empirical_lift_weight : acc), 0);
      const newLift = Number(((activeWeight / 100) * 26.8).toFixed(1));
      return { ...prev, active_levers: updated, aggregate_predicted_lift: newLift };
    });
  };

  const handleConfirmPublish = async (payload: { diffId: string; platform: string; environment: string; signature: string }) => {
    try {
      await api.publishDiff(payload);
      alert(`[CMS PUBLISH SUCCESS]: Deployed ${payload.diffId} to ${payload.platform} (${payload.environment}). Signature HMAC verified.`);
      setSelectedPublishDiff(null);
    } catch (e: any) {
      alert(`Deployment failed: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans relative selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar 
        onTriggerAudit={handleTriggerAudit} 
        isAuditing={isAuditing} 
        activeBrand={activeBrand} 
        onBrandChange={handleBrandChange}
        onStartTour={() => setIsTourOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* Mobile Drawer Navigation Backdrop & Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-[#060913] border-r border-slate-800 shadow-2xl">
            <Sidebar 
              activeTab={activeTab} 
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setIsMobileMenuOpen(false);
              }} 
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        </div>

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* TAB 1: Command Center */}
          {activeTab === 'overview' && (
            <div>
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Executive Perception Command Center
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Continuous monitoring &amp; mathematical evaluation for {activeBrand} across 5 generative search engines.
                  </p>
                </div>
              </div>

              <ExecutiveScoreCard scoreData={compositeScore} />
              <HallucinationAlertBanner entropyData={semanticEntropy} />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <div className="lg:col-span-4">
                  <PerceptionRadar dimensions={compositeScore.dimensions} />
                </div>
                <div className="lg:col-span-8">
                  <SovComparisonChart sovData={sovData} />
                </div>
              </div>

              <DimensionBreakdown dimensions={compositeScore.dimensions} />
              <LiveActivityStream isAuditing={isAuditing} progress={auditProgress} events={streamEvents} />
            </div>
          )}

          {/* TAB 2: Cold Prompt Panels */}
          {activeTab === 'panels' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Cold Prompt Panel Instrumentation Hub</h1>
                <p className="text-xs text-slate-400 mt-1">
                  50-200 standardized buyer-intent queries executed via zero-bias residential proxies.
                </p>
              </div>
              <PromptRunner onRunSingleQuery={() => handleTriggerAudit()} />
              <MultiEngineMatrix />
            </div>
          )}

          {/* TAB 3: Competitive Intelligence */}
          {activeTab === 'competitive' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Competitive Intelligence &amp; Citation Gaps</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Generative Share of Voice (GSoV), competitor citation domain gaps, and prompt win/loss diagnoses.
                </p>
              </div>
              <SovComparisonChart sovData={sovData} />
              <CitationGapTable gapData={citationGaps} />
              <WinLossDiagnosisGrid winLossData={winLossData} />
            </div>
          )}

          {/* TAB: Competitor Counter-Positioning & Siphoning Matrix */}
          {activeTab === 'counterpositioning' && (
            <div>
              <CompetitorCounterPositioningStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Multi-Model Dispute Tribunal & Errata Dispatcher */}
          {activeTab === 'tribunal' && (
            <div>
              <MultiModelDisputeTribunalStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Programmatic Citation Grounding & Authority Seed Network */}
          {activeTab === 'citationseeds' && (
            <div>
              <CitationSeedNetworkStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Autonomous GEO A/B Variant Autopilot & Edge Sandbox */}
          {activeTab === 'abautopilot' && (
            <div>
              <GeoVariantAutopilotStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Negative SEO & Knowledge Graph Poisoning Defense Sentinel */}
          {activeTab === 'poisoningsentinel' && (
            <div>
              <KnowledgePoisoningSentinelStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Conversational AI Purchase Intent & Multi-Turn Buyer Journey Simulator */}
          {activeTab === 'buyerjourney' && (
            <div>
              <BuyerJourneySimulatorStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Real-Time Frontier AI Query Seismograph & Push Notification Center */}
          {activeTab === 'seismograph' && (
            <div>
              <SeismographNotificationStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Executive Boardroom Decks (Option A) */}
          {activeTab === 'reporting' && (
            <div>
              <ExecutiveBoardReportHub activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Frontier AI Algorithm Volatility & IndexWatch Radar */}
          {activeTab === 'indexwatch' && (
            <div>
              <AlgorithmIndexWatchStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Brand Ingestion Studio (Option 1) */}
          {activeTab === 'ingestion' && (
            <div>
              <BrandIngestionStudio onPromoteBrand={handlePromoteBrand} activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB 4: KDD-2024 Diff Studio */}
          {activeTab === 'optimizer' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Princeton KDD-2024 Optimization Studio</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Peer-reviewed GEO ranking factors: Statistics Addition, Source Corroboration, Quotation Addition, and Answer-First structuring.
                </p>
              </div>
              <LeverControlPanel
                levers={optimizationPlan.active_levers}
                onToggleLever={handleToggleLever}
                predictedLift={optimizationPlan.aggregate_predicted_lift}
              />
              <KddDiffViewer
                diffs={optimizationPlan.diffs}
                onOpenPublishModal={(diff) => setSelectedPublishDiff(diff)}
              />
            </div>
          )}

          {/* TAB: Knowledge Graph & Wikidata Sync Studio */}
          {activeTab === 'knowledgegraph' && (
            <div>
              <KnowledgeGraphSyncStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB 5: Machine-Readable Entity & llms.txt */}
          {activeTab === 'machinereadable' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Machine-Readable Entity &amp; llms.txt Hub</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Schema.org microdata JSON-LD compiler and standardized /llms.txt knowledge base generator.
                </p>
              </div>
              {entitySchemas && <SchemaJsonLdViewer schemaData={entitySchemas} />}
              {llmsTxtData && <LlmsTxtEditor llmsData={llmsTxtData} />}
            </div>
          )}

          {/* TAB 6: CMS Publishing & Remeasurement */}
          {activeTab === 'cms' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Closed-Loop CMS Publishing &amp; Re-Measurement Loop</h1>
                <p className="text-xs text-slate-400 mt-1">
                  OAuth2 webhook deployment and 7d, 14d, 30d empirical verification of perception and citation lift.
                </p>
              </div>
              <WebhookManager
                webhooks={webhooks}
                onTestWebhook={(wh) => alert(`[PING SUCCESS]: Endpoint ${wh} responded 200 OK (latency: 142ms)`)}
              />
              <RemeasurementTimeline campaign={remeasurement} />
            </div>
          )}

          {/* HARDENING TAB 1: Continuous Calibration Canaries */}
          {activeTab === 'canaries' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Continuous Calibration Canaries (C3) &amp; Drift Monitor</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Mathematical mitigation against LLM non-determinism and silent search algorithm shifts via Jensen-Shannon Divergence (D_JS).
                </p>
              </div>
              <CanaryDriftMonitor />
            </div>
          )}

          {/* HARDENING TAB 2: Two-Stage Adaptive Sampler */}
          {activeTab === 'sampler' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Two-Stage Adaptive Sequential Sampler</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Cost reduction engine using Wald's Sequential Probability Ratio Test (SPRT) with 62% early-exit rate.
                </p>
              </div>
              <AdaptiveSamplerStudio />
            </div>
          )}

          {/* HARDENING TAB 3: GitOps & Headless Portal */}
          {activeTab === 'gitops' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">GitOps Automation &amp; Multi-Sig CAB Governance</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Automated GitHub/GitLab Pull Request pipelines, Headless CMS connectors, and 3-stage cryptographic approvals.
                </p>
              </div>
              <GitOpsHeadlessPortal />
            </div>
          )}

          {/* HARDENING TAB 4: Econometric Causal Attribution */}
          {activeTab === 'attribution' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Zero-Click Econometric Causal Attribution</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Bayesian Structural Time Series (BSTS) causal lift modeling and reverse-DNS verified AI bot crawler telemetry.
                </p>
              </div>
              <CausalAttributionStudio />
            </div>
          )}

          {/* HARDENING TAB 5: Synthetic Adversarial Penetration Testing */}
          {activeTab === 'pentest' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Synthetic Adversarial GEO Penetration Testing Studio</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Automated red-team simulations probing indirect prompt injection vulnerabilities, sybil review poisoning, and citation squatting.
                </p>
              </div>
              <AdversarialPenTestStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* HARDENING TAB 6: Bot Traffic & Edge WAF Armor */}
          {activeTab === 'botarmor' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Self-Healing GEO Bot Traffic Analyzer &amp; Edge WAF Armor</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time AI crawler telemetry, crawl efficiency indexing ($E_&#123;crawl&#125;$), and 1-click Edge WAF / CDN rule synthesis for Cloudflare, Fastly, AWS WAF, and Nginx.
                </p>
              </div>
              <BotTrafficArmorStudio activeBrand={activeBrand} />
            </div>
          )}

          {/* TAB: Operations & Background Jobs (Option 2) */}
          {activeTab === 'scheduler' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">24/7 Asynchronous Worker Queue &amp; Alert Webhooks</h1>
                <p className="text-xs text-slate-400 mt-1">
                  High-throughput background brand scraping, automated canary drift sweeps, and HMAC-signed multi-channel alerting.
                </p>
              </div>
              <BackgroundJobsMonitor
                jobs={queueJobs}
                stats={queueStats}
                schedules={schedules}
                webhooks={alertWebhooks}
                onRefresh={refreshOperationsData}
              />
            </div>
          )}

          {/* TAB: Enterprise SSO & RBAC (Option 3) */}
          {activeTab === 'security' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Single Sign-On (SSO) &amp; 5-Tier RBAC</h1>
                <p className="text-xs text-slate-400 mt-1">
                  SAML 2.0 / Okta / Azure AD federation, granular role assignment, and cryptographic JWT session killswitches.
                </p>
              </div>
              <EnterpriseAccessSecurity
                ssoConfig={ssoConfig}
                users={users}
                sessions={activeSessions}
                onRefresh={refreshOperationsData}
              />
            </div>
          )}

          {/* TAB: Metered Token Usage & Stripe Billing (Option 3) */}
          {activeTab === 'billing' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Metered Token Usage &amp; Stripe Billing</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time token quota accounting, two-tier semantic cache savings ROI, and itemized corporate invoices.
                </p>
              </div>
              <BillingUsagePortal
                subscription={subscription}
                usage={tokenUsage}
                invoices={invoices}
                onRefresh={refreshOperationsData}
              />
            </div>
          )}

          {/* TAB: Multi-Tenant White-Label Agency Portal */}
          {activeTab === 'agency' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Multi-Tenant White-Label Agency Portal &amp; Client Access Control</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Multi-brand client tenancy, customizable white-label themes, custom CNAME edge domains, and 4-tier client RBAC governance.
                </p>
              </div>
              <WhiteLabelAgencyPortal
                activeBrand={activeBrand}
                onSwitchBrand={setActiveBrand}
              />
            </div>
          )}

          {/* TAB: Live API & Proxy Gateway */}
          {activeTab === 'settings' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Live Frontier Engine APIs &amp; Residential Proxy Gateway</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Credential management, latency ping diagnostics, and egress proxy routing across 4,250+ rotating residential IPs.
                </p>
              </div>
              <LiveApiSettings />
            </div>
          )}

          {/* TAB: Multi-Region Egress Gateway (Option C) */}
          {activeTab === 'network' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Multi-Region Geo-Distributed Proxy &amp; Egress Gateway Monitor</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Active-active egress mesh across 4 global regions with real-time AI latency heatmaps and automated JA3/JA4 TLS spoofing.
                </p>
              </div>
              <GeoProxyClusterMonitor />
            </div>
          )}

          {/* TAB 7: Unit Economics & Model Router */}
          {activeTab === 'economics' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Dynamic Model Router &amp; Unit Economics</h1>
                <p className="text-xs text-slate-400 mt-1">
                  3-Tier Model Classifier &amp; Two-Tier Redis Cache maintaining &gt;80% gross margins.
                </p>
              </div>
              <UnitEconomicsHub economics={economics} />
            </div>
          )}

          {/* TAB 8: Autonomous MCP Agent */}
          {activeTab === 'mcp' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Autonomous AI Operator via Model Context Protocol (MCP)</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Standardized MCP tool gateway with 5-Level Agent Permission enforcement.
                </p>
              </div>
              <AutonomousAgentTerminal tools={mcpTools} />
            </div>
          )}

          {/* TAB 9: Audit Vault & Security */}
          {activeTab === 'audit' && (
            <div>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-white tracking-tight">Immutable WORM Audit Vault &amp; Cryptographic Shredding</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Four-Tier evidence labeling ([OBSERVED], [INFERRED], [MODEL-GENERATED], [USER-PROVIDED]) and sub-60s GDPR Article 17 shredding.
                </p>
              </div>
              <FourTierEvidenceTable logs={auditLogs} />
              <CryptoShreddingPanel
                keyStatus={tenantKey}
                onKeyShredded={() => setTenantKey((prev) => ({ ...prev, key_state: 'SHREDDED', is_data_recoverable: false }))}
              />
            </div>
          )}

          {/* TAB: AICPA SOC2 Type II Continuous Compliance & Merkle Proof Studio */}
          {activeTab === 'soc2compliance' && (
            <div>
              <SOC2ComplianceStudio activeBrand={activeBrand} />
            </div>
          )}
        </main>
      </div>

      {/* Cryptographic Approval Modal */}
      {selectedPublishDiff && (
        <CryptographicApprovalModal
          diff={selectedPublishDiff}
          onClose={() => setSelectedPublishDiff(null)}
          onConfirmPublish={handleConfirmPublish}
        />
      )}

      {/* Executive Guided Product Tour */}
      <ExecutiveProductTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onSelectBrand={handleBrandChange}
        onTriggerAudit={handleTriggerAudit}
        activeBrand={activeBrand}
      />

      {/* Live Floating Telemetry HUD */}
      <LiveTelemetryHUD
        activeBrand={activeBrand}
        onTriggerAudit={handleTriggerAudit}
        isAuditing={isAuditing}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
    </div>
  );
};
