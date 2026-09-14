import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Globe,
  Palette,
  ShieldCheck,
  Send,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Lock,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Sliders,
  Check,
  Zap,
  Clock,
  Briefcase
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AgencyOrganization,
  ClientWorkspace,
  WhiteLabelConfig,
  CustomDomainStatus,
  ClientUserAccess,
  ReportDispatchSchedule
} from '../../types';

interface WhiteLabelAgencyPortalProps {
  activeBrand: string;
  onSwitchBrand?: (brand: string) => void;
}

export const WhiteLabelAgencyPortal: React.FC<WhiteLabelAgencyPortalProps> = ({
  activeBrand,
  onSwitchBrand
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'workspaces' | 'branding' | 'domains' | 'users' | 'reports'>('workspaces');
  const [agencyOrg, setAgencyOrg] = useState<AgencyOrganization | null>(null);
  const [clients, setClients] = useState<ClientWorkspace[]>([]);
  const [users, setUsers] = useState<ClientUserAccess[]>([]);
  const [schedules, setSchedules] = useState<ReportDispatchSchedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState<boolean>(false);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);
  
  // Theme Form State
  const [themeForm, setThemeForm] = useState<Partial<WhiteLabelConfig>>({});
  const [isSavingTheme, setIsSavingTheme] = useState<boolean>(false);
  const [themeSaveSuccess, setThemeSaveSuccess] = useState<boolean>(false);

  // New Client Modal
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState<boolean>(false);
  const [newClientBrand, setNewClientBrand] = useState<string>('');
  const [newClientDomain, setNewClientDomain] = useState<string>('');
  const [newClientIndustry, setNewClientIndustry] = useState<string>('Developer Infrastructure');
  const [newClientTokens, setNewClientTokens] = useState<number>(3000000);

  // Invite User Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('CLIENT_EXECUTIVE');
  const [inviteClient, setInviteClient] = useState<string>('c-psychs');

  // Test Dispatch Modal
  const [testDispatchResult, setTestDispatchResult] = useState<any | null>(null);
  const [isDispatchingTest, setIsDispatchingTest] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [orgData, clientsData, usersData, schedulesData] = await Promise.all([
        api.getAgencyOrganization(),
        api.getClientWorkspaces(),
        api.getAgencyUsers(),
        api.getReportDispatchSchedules()
      ]);
      setAgencyOrg(orgData);
      setThemeForm(orgData.white_label_config);
      setClients(clientsData);
      setUsers(usersData);
      setSchedules(schedulesData);
    } catch (err) {
      console.error('Failed to load agency portal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTheme(true);
    try {
      const updated = await api.updateWhiteLabelConfig(themeForm);
      if (agencyOrg) {
        setAgencyOrg({
          ...agencyOrg,
          white_label_config: updated
        });
      }
      setThemeSaveSuccess(true);
      setTimeout(() => setThemeSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save white-label theme:', err);
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!agencyOrg) return;
    setIsVerifyingDomain(true);
    try {
      const res = await api.verifyCustomDomain(agencyOrg.custom_domain_status.custom_cname_domain);
      setAgencyOrg({
        ...agencyOrg,
        custom_domain_status: res
      });
      setVerificationSuccess(true);
      setTimeout(() => setVerificationSuccess(null), 4000);
    } catch (err) {
      setVerificationSuccess(false);
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientBrand || !newClientDomain) return;
    try {
      const created = await api.createClientWorkspace({
        brand_name: newClientBrand,
        client_domain: newClientDomain,
        primary_industry: newClientIndustry,
        allocated_monthly_tokens: newClientTokens
      });
      setClients(prev => [...prev, created]);
      if (agencyOrg) {
        setAgencyOrg({
          ...agencyOrg,
          active_client_workspaces: agencyOrg.active_client_workspaces + 1
        });
      }
      setIsNewClientModalOpen(false);
      setNewClientBrand('');
      setNewClientDomain('');
    } catch (err) {
      console.error('Failed to create client workspace:', err);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;
    try {
      const invited = await api.inviteAgencyUser({
        email: inviteEmail,
        full_name: inviteName,
        role: inviteRole,
        assigned_client_ids: inviteRole.startsWith('AGENCY_') ? ['*'] : [inviteClient]
      });
      setUsers(prev => [...prev, invited]);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
    } catch (err) {
      console.error('Failed to invite user:', err);
    }
  };

  const handleTriggerTestDispatch = async (scheduleId: string) => {
    setIsDispatchingTest(true);
    try {
      const res = await api.triggerTestReportDispatch(scheduleId);
      setTestDispatchResult(res);
    } catch (err) {
      console.error('Failed to dispatch test digest:', err);
    } finally {
      setIsDispatchingTest(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const accentColors = [
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Cyan', hex: '#06B6D4' },
    { name: 'Rose', hex: '#F43F5E' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Purple', hex: '#A855F7' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Agency Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {agencyOrg?.agency_name || 'Acrobat GEO Global Partners'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {agencyOrg?.tier || 'AGENCY_ENTERPRISE'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  White-Label Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Multi-Tenant Client Brand Management, Custom CNAME Routing, and 4-Tier Client Access Governance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Provision Client Account
            </button>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Managed Client Accounts</span>
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {agencyOrg?.active_client_workspaces || 6}{' '}
              <span className="text-xs font-normal text-slate-500">/ {agencyOrg?.max_client_workspaces || 25} limit</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${((agencyOrg?.active_client_workspaces || 6) / (agencyOrg?.max_client_workspaces || 25)) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Aggregated Monthly Tokens</span>
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {((agencyOrg?.total_consumed_tokens || 9650000) / 1000000).toFixed(2)}M{' '}
              <span className="text-xs font-normal text-slate-500">/ {((agencyOrg?.total_allocated_tokens || 25000000) / 1000000).toFixed(0)}M Cap</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full"
                style={{ width: `${((agencyOrg?.total_consumed_tokens || 9650000) / (agencyOrg?.total_allocated_tokens || 25000000)) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Custom CNAME &amp; SSL</span>
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-sm font-semibold text-white mt-1 truncate">
              {agencyOrg?.custom_domain_status.custom_cname_domain || 'geo.acrobatgeo.io'}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-mono">SSL ACTIVE &bull; 256-bit TLS</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Active Client Users &amp; Stakeholders</span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {users.length || 5}{' '}
              <span className="text-xs font-normal text-slate-500">across 4 roles</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              Zero-Trust MFA Enforced &bull; 100%
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-800 bg-[#070a11] px-4 rounded-t-xl gap-2 overflow-x-auto">
        {[
          { id: 'workspaces', label: 'Client Workspaces', icon: Building2, count: clients.length },
          { id: 'branding', label: 'White-Label Branding & Theme', icon: Palette, badge: 'Live Preview' },
          { id: 'domains', label: 'Custom Domain & SSL (CNAME)', icon: Globe, badge: 'Active' },
          { id: 'users', label: 'Client Access & 4-Tier RBAC', icon: Users, count: users.length },
          { id: 'reports', label: 'Automated Report Dispatch', icon: Send, count: schedules.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: CLIENT WORKSPACES */}
      {activeSubTab === 'workspaces' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">Client Brand Workspaces</h2>
              <p className="text-xs text-slate-400">
                Isolated multi-tenant brand environments with dedicated perception indexing, token quotas, and cold prompt test suites.
              </p>
            </div>
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Client Workspace
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(client => {
              const isCurrentActive = client.brand_name.toLowerCase() === activeBrand.toLowerCase();
              const tokenUsagePct = (client.tokens_consumed_month / client.allocated_monthly_tokens) * 100;
              return (
                <div
                  key={client.client_id}
                  className={`bg-slate-900/80 border rounded-xl p-4 transition-all ${
                    isCurrentActive
                      ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{client.brand_name}</span>
                        {isCurrentActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Active Brand View
                          </span>
                        )}
                      </div>
                      <a
                        href={`https://${client.client_domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 mt-0.5"
                      >
                        {client.client_domain}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {client.subscription_tier}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-4 p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400">Composite Score</span>
                      <div className="text-sm font-bold text-emerald-400">{client.composite_perception_score.toFixed(1)} / 100</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Generative SOV</span>
                      <div className="text-sm font-bold text-cyan-400">{client.generative_sov_pct.toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Cold Prompts</span>
                      <div className="text-xs font-semibold text-slate-200">{client.total_cold_prompts_active} Active</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Client Users</span>
                      <div className="text-xs font-semibold text-slate-200">{client.active_users_count} Members</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Monthly Quota</span>
                      <span>{(client.tokens_consumed_month / 1000000).toFixed(2)}M / {(client.allocated_monthly_tokens / 1000000).toFixed(1)}M tok</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tokenUsagePct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(tokenUsagePct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex gap-2">
                    <button
                      onClick={() => onSwitchBrand && onSwitchBrand(client.brand_name)}
                      disabled={isCurrentActive}
                      className={`w-full py-1.5 px-3 rounded text-xs font-semibold transition-all ${
                        isCurrentActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isCurrentActive ? 'Currently Loaded' : 'Switch Brand View'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BRANDING & THEME */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Theme Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">White-Label Branding Customizer</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your agency display identity, brand colors, and legal headers/footers applied across all client views and exported PDF boardroom decks.
              </p>
            </div>

            <form onSubmit={handleSaveTheme} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Agency Platform Display Name
                </label>
                <input
                  type="text"
                  value={themeForm.agency_display_name || ''}
                  onChange={e => setThemeForm({ ...themeForm, agency_display_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Acrobat GEO Intelligence"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Agency Logo URL (SVG / PNG)
                  </label>
                  <input
                    type="text"
                    value={themeForm.logo_url || ''}
                    onChange={e => setThemeForm({ ...themeForm, logo_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="https://assets.domain.com/logo.svg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={themeForm.email_sender_name || ''}
                    onChange={e => setThemeForm({ ...themeForm, email_sender_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Acrobat GEO Intelligence Team"
                  />
                </div>
              </div>

              {/* Accent Color Palette Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Primary Accent Color
                </label>
                <div className="flex items-center gap-3">
                  {accentColors.map(c => {
                    const isSelected = themeForm.primary_accent_hex?.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setThemeForm({ ...themeForm, primary_accent_hex: c.hex })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                          isSelected
                            ? 'border-white text-white shadow-lg'
                            : 'border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                        style={{ backgroundColor: `${c.hex}15` }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <input
                  type="checkbox"
                  id="removeWatermark"
                  checked={themeForm.remove_watermark || false}
                  onChange={e => setThemeForm({ ...themeForm, remove_watermark: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="removeWatermark" className="text-xs text-slate-300 cursor-pointer">
                  <span className="font-semibold text-white">Suppress "Powered by Psychs" Watermark</span>
                  <p className="text-[11px] text-slate-500">Completely hides original platform marks on executive exports, client dashboards, and email dispatches.</p>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Legal &amp; Confidentiality Footer Disclaimer
                </label>
                <textarea
                  rows={2}
                  value={themeForm.custom_footer_text || ''}
                  onChange={e => setThemeForm({ ...themeForm, custom_footer_text: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={isSavingTheme}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSavingTheme ? 'Saving Theme...' : 'Apply White-Label Branding'}
                </button>
                {themeSaveSuccess && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Branding applied successfully!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Live Theme Preview Box */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live White-Label Preview</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Client Viewport
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Real-time simulation of how client stakeholders experience the dashboard.</p>
            </div>

            {/* Mock Header */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs text-black"
                    style={{ backgroundColor: themeForm.primary_accent_hex || '#10B981' }}
                  >
                    {(themeForm.agency_display_name || 'A')[0]}
                  </div>
                  <span className="font-bold text-white text-xs">
                    {themeForm.agency_display_name || 'Acrobat GEO Intelligence'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Client: Psychs</span>
              </div>

              {/* Mock Scorecard */}
              <div
                className="p-3 rounded-lg border text-xs"
                style={{
                  backgroundColor: `${themeForm.primary_accent_hex || '#10B981'}0d`,
                  borderColor: `${themeForm.primary_accent_hex || '#10B981'}30`
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Generative Perception Score</span>
                  <span
                    className="font-bold text-xs"
                    style={{ color: themeForm.primary_accent_hex || '#10B981' }}
                  >
                    87.4 / 100
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Verified by {themeForm.email_sender_name || 'Acrobat GEO Intelligence Team'}
                </div>
              </div>

              {/* Mock Footer */}
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center leading-tight">
                {themeForm.custom_footer_text || 'Confidential Strategic GEO Audit'}
                {!themeForm.remove_watermark && (
                  <div className="mt-1 text-[9px] text-slate-600">Powered by Psychs GEO Platform</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CUSTOM DOMAIN & CNAME */}
      {activeSubTab === 'domains' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Custom CNAME Domain &amp; SSL Routing</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Serve the platform from your own agency domain (e.g. <span className="text-emerald-400 font-mono">geo.acrobatgeo.io</span>) with automated edge SSL certificate provisioning and zero-downtime routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Agency Hostname
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agencyOrg?.custom_domain_status.custom_cname_domain || ''}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                  />
                  <button
                    onClick={handleVerifyDomain}
                    disabled={isVerifyingDomain}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingDomain ? 'animate-spin' : ''}`} />
                    {isVerifyingDomain ? 'Verifying...' : 'Verify DNS'}
                  </button>
                </div>
                {verificationSuccess === true && (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> DNS CNAME and SSL certificate successfully verified at edge!
                  </p>
                )}
              </div>

              {/* DNS Instructions Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Required DNS Records</h4>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 font-mono">Type: </span>
                      <span className="text-emerald-400 font-bold">CNAME</span>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">Host: geo &bull; Points to: edge.psychs.ai</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Matched
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded flex justify-between items-center">
                    <div className="truncate pr-2">
                      <span className="text-slate-400 font-mono">Type: </span>
                      <span className="text-cyan-400 font-bold">TXT (Ownership)</span>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                        {agencyOrg?.custom_domain_status.dns_txt_verification_token}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(agencyOrg?.custom_domain_status.dns_txt_verification_token || '')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 shrink-0"
                      title="Copy Token"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Edge SSL Status Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Edge SSL / TLS Telemetry</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">SSL Certificate Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE (Let's Encrypt Wildcard)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">HTTP/2 &amp; HTTP/3 (QUIC)</span>
                  <span className="text-slate-200 font-mono">Enabled at Edge</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Auto-HTTPS 301 Redirect</span>
                  <span className="text-emerald-400 font-semibold">Strict Enforce</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Last Verified</span>
                  <span className="text-slate-400 font-mono text-[11px]">{agencyOrg?.custom_domain_status.last_verified_at.substring(0, 19).replace('T', ' ')} UTC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CLIENT ACCESS & 4-TIER RBAC */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">Client Access &amp; 4-Tier RBAC Directory</h2>
              <p className="text-xs text-slate-400">
                Grant client C-suite read-only executive portals or allow technical teams to review schema diffs and GitOps PRs.
              </p>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Invite Team Member / Client
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-medium">User Name &amp; Email</th>
                  <th className="p-3.5 font-medium">Role &amp; Privilege Level</th>
                  <th className="p-3.5 font-medium">Assigned Client Scope</th>
                  <th className="p-3.5 font-medium">MFA / Security</th>
                  <th className="p-3.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map(u => (
                  <tr key={u.user_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{u.full_name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-semibold border ${
                        u.role === 'AGENCY_SUPERADMIN'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : u.role === 'AGENCY_ACCOUNT_MANAGER'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : u.role === 'CLIENT_EXECUTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.assigned_client_ids.map(cid => (
                          <span key={cid} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {cid === '*' ? 'All Agency Clients' : cid}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> FIDO2 / 2FA Enforced
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: AUTOMATED REPORT DISPATCH */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">Automated Scheduled Executive Report Dispatch</h2>
              <p className="text-xs text-slate-400">
                Automated weekly and monthly white-labeled PDF boardroom digests emailed directly to client executives and stakeholders.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map(sch => (
              <div key={sch.schedule_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white text-sm">{sch.client_brand_name}</span>
                      <div className="text-[11px] text-slate-400 font-mono">{sch.schedule_id}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {sch.cadence.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="my-3 space-y-1.5 text-xs text-slate-300">
                    <div className="text-[11px] text-slate-400">Recipients ({sch.recipient_emails.length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {sch.recipient_emails.map(email => (
                        <span key={email} className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-300 font-mono truncate max-w-[220px]">
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Executive Summary Scorecard
                    </div>
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <CheckCircle2 className="w-3 h-3" /> Generative SOV Leaderboard
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <CheckCircle2 className="w-3 h-3" /> White-Labeled PDF Formatting
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                  <div className="text-[10px] text-slate-500 font-mono">
                    Next: {sch.next_dispatch_at.substring(0, 10)}
                  </div>
                  <button
                    onClick={() => handleTriggerTestDispatch(sch.schedule_id)}
                    disabled={isDispatchingTest}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    Trigger Test Dispatch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROVISION NEW CLIENT MODAL */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Provision New Client Workspace
              </h3>
              <button
                onClick={() => setIsNewClientModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Client Brand Name</label>
                <input
                  type="text"
                  required
                  value={newClientBrand}
                  onChange={e => setNewClientBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  placeholder="e.g. Stripe"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Domain</label>
                <input
                  type="text"
                  required
                  value={newClientDomain}
                  onChange={e => setNewClientDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  placeholder="e.g. stripe.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Industry Sector</label>
                <input
                  type="text"
                  value={newClientIndustry}
                  onChange={e => setNewClientIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Allocated Monthly Token Quota</label>
                <select
                  value={newClientTokens}
                  onChange={e => setNewClientTokens(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value={2500000}>2,500,000 Tokens / Mo</option>
                  <option value={5000000}>5,000,000 Tokens / Mo</option>
                  <option value={10000000}>10,000,000 Tokens / Mo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow-md"
                >
                  Create Client Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE USER MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Invite Team Member / Client Stakeholder
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  placeholder="name@client.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name &amp; Title</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  placeholder="e.g. Rachel Zhang (VP of Growth)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role &amp; Privilege Tier</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="CLIENT_EXECUTIVE">CLIENT_EXECUTIVE (C-Suite Read-Only)</option>
                  <option value="CLIENT_TECHNICAL_LEAD">CLIENT_TECHNICAL_LEAD (Schema, /llms.txt, GitOps)</option>
                  <option value="AGENCY_ACCOUNT_MANAGER">AGENCY_ACCOUNT_MANAGER (Multi-Brand Operator)</option>
                  <option value="AGENCY_SUPERADMIN">AGENCY_SUPERADMIN (Full Tenant Control)</option>
                </select>
              </div>

              {!inviteRole.startsWith('AGENCY_') && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assign Client Brand Scope</label>
                  <select
                    value={inviteClient}
                    onChange={e => setInviteClient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {clients.map(c => (
                      <option key={c.client_id} value={c.client_id}>
                        {c.brand_name} ({c.client_domain})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow-md"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEST DISPATCH SUCCESS MODAL */}
      {testDispatchResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Executive Report Digest Dispatched
              </h3>
              <button
                onClick={() => setTestDispatchResult(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300">
                A white-labeled executive PDF audit deck was synthesized and successfully dispatched.
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">PDF Asset:</span>
                  <span className="text-white">{testDispatchResult.pdf_digest_filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sender:</span>
                  <span className="text-emerald-400">{testDispatchResult.white_label_sender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivery Status:</span>
                  <span className="text-emerald-400">{testDispatchResult.status}</span>
                </div>
                <div>
                  <span className="text-slate-400">Cryptographic Seal:</span>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {testDispatchResult.cryptographic_delivery_seal}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setTestDispatchResult(null)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
