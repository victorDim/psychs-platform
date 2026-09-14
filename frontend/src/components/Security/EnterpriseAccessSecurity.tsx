import React, { useState } from 'react';
import {
  Shield,
  Key,
  Users,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  UserCheck,
  ShieldAlert,
  Server,
  Fingerprint
} from 'lucide-react';
import { SSOConfiguration, EnterpriseUser, ActiveSession } from '../../types';
import { api } from '../../services/api';

interface EnterpriseAccessSecurityProps {
  ssoConfig: SSOConfiguration;
  users: EnterpriseUser[];
  sessions: ActiveSession[];
  onRefresh: () => void;
}

export const EnterpriseAccessSecurity: React.FC<EnterpriseAccessSecurityProps> = ({
  ssoConfig,
  users,
  sessions,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'sso' | 'sessions'>('users');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setFeedbackMsg(`Updated role for user [${userId}] to ${newRole}`);
      setTimeout(() => {
        onRefresh();
        setUpdatingUserId(null);
      }, 500);
    } catch (e) {
      setFeedbackMsg('Failed to update user role.');
      setUpdatingUserId(null);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await api.revokeSession(sessionId);
      setFeedbackMsg(`Cryptographically revoked session token [${sessionId}] in Session Vault.`);
      setTimeout(() => {
        onRefresh();
        setRevokingSessionId(null);
      }, 500);
    } catch (e) {
      setFeedbackMsg('Failed to revoke session.');
      setRevokingSessionId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-pulse" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Enterprise Single Sign-On (SSO) & 5-Tier RBAC Access Security
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              SAML 2.0 / Okta / Azure AD federation, granular role-based policy enforcement, and cryptographic JWT session management.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-mono rounded-lg">
              IdP: {ssoConfig.provider_type} (Active)
            </span>
            <button
              onClick={onRefresh}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Refresh Security Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mt-4 p-3 bg-purple-950/40 border border-purple-500/40 rounded-lg text-purple-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              {feedbackMsg}
            </span>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white font-bold ml-4">
              ×
            </button>
          </div>
        )}

        {/* 5-Tier RBAC Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-rose-400">SUPER_ADMIN</div>
            <div className="text-xs text-slate-300 mt-1">Full Root & KMS Shred</div>
            <div className="text-[10px] text-slate-500 mt-0.5">16 / 16 Permissions</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-amber-400">SECOPS_ADMIN</div>
            <div className="text-xs text-slate-300 mt-1">SSO & WORM Audit</div>
            <div className="text-[10px] text-slate-500 mt-0.5">8 / 16 Permissions</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-cyan-400">BRAND_MANAGER</div>
            <div className="text-xs text-slate-300 mt-1">Audits & Optimization</div>
            <div className="text-[10px] text-slate-500 mt-0.5">7 / 16 Permissions</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-indigo-400">CAB_APPROVER</div>
            <div className="text-xs text-slate-300 mt-1">Multi-Sig Sign-off</div>
            <div className="text-[10px] text-slate-500 mt-0.5">4 / 16 Permissions</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] font-bold text-slate-400">ANALYST_VIEWER</div>
            <div className="text-xs text-slate-300 mt-1">Telemetry & Reports</div>
            <div className="text-[10px] text-slate-500 mt-0.5">2 / 16 Permissions</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Enterprise Team & RBAC ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('sso')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'sso'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          SAML 2.0 / IdP Federation Config
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'sessions'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          Active JWT Session Vault ({sessions.length})
        </button>
      </div>

      {/* Tab 1: Users & RBAC */}
      {activeTab === 'users' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Authenticated Enterprise Team Members
            </h3>
            <span className="text-xs text-slate-400">JIT SCIM Provisioned via Okta SSO</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 bg-slate-950/60 uppercase tracking-wider border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Auth Method</th>
                  <th className="py-3 px-4">Current RBAC Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Role Assignment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-xs border border-purple-500/30">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                        {u.auth_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : u.role === 'SECOPS_ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : u.role === 'BRAND_MANAGER'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : u.role === 'CAB_APPROVER'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{u.last_active}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        disabled={updatingUserId === u.user_id}
                        onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-purple-300 focus:outline-none focus:border-purple-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="SECOPS_ADMIN">SECOPS_ADMIN</option>
                        <option value="BRAND_MANAGER">BRAND_MANAGER</option>
                        <option value="CAB_APPROVER">CAB_APPROVER</option>
                        <option value="ANALYST_VIEWER">ANALYST_VIEWER</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: SAML 2.0 / IdP Federation */}
      {activeTab === 'sso' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              Identity Provider (IdP) Metadata Endpoints
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">IdP Entity ID (Issuer URI):</label>
                <input
                  type="text"
                  readOnly
                  value={ssoConfig.idp_entity_id}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">IdP Single Sign-On URL (SAML ACS Target):</label>
                <input
                  type="text"
                  readOnly
                  value={ssoConfig.idp_sso_url}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">X.509 Certificate SHA-256 Fingerprint:</label>
                <div className="bg-slate-950 border border-slate-800 rounded p-2 text-purple-300 font-mono text-[11px] flex items-center justify-between">
                  <span>{ssoConfig.x509_cert_fingerprint}</span>
                  <Fingerprint className="w-4 h-4 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Service Provider (SP) Endpoints (Psychs Platform)
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">SP Entity ID (Audience URI):</label>
                <input
                  type="text"
                  readOnly
                  value={ssoConfig.sp_entity_id}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">SP Assertion Consumer Service (ACS URL):</label>
                <input
                  type="text"
                  readOnly
                  value={ssoConfig.sp_acs_url}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 font-mono text-[11px]"
                />
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-lg text-xs space-y-1">
                <div className="text-purple-300 font-semibold">Automatic Just-In-Time (JIT) Provisioning</div>
                <div className="text-slate-400 text-[11px]">
                  New enterprise domain members logging in via Okta or Azure AD are automatically provisioned with role{' '}
                  <strong className="text-white font-mono">{ssoConfig.default_provisioning_role}</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Active JWT Session Vault */}
      {activeTab === 'sessions' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                Active Cryptographic JWT Sessions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant cryptographic token killswitch invalidates JWTs immediately across all distributed nodes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((sess) => (
              <div
                key={sess.session_id}
                className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-purple-300 font-bold">{sess.session_id}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded font-medium border border-emerald-500/20">
                      {sess.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-white font-semibold">{sess.user_email}</div>
                    <div className="text-slate-400 text-[11px]">Role: <span className="text-cyan-300 font-mono">{sess.role}</span></div>
                    <div className="text-slate-400 text-[11px]">Client IP: <span className="font-mono text-slate-300">{sess.ip_address}</span></div>
                    <div className="text-slate-400 text-[11px]">User Agent: <span className="text-slate-300">{sess.user_agent}</span></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">Created: {sess.created_at.replace('T', ' ').replace('Z', '')}</span>
                  <button
                    onClick={() => handleRevokeSession(sess.session_id)}
                    disabled={revokingSessionId === sess.session_id}
                    className="flex items-center gap-1 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-3 h-3" />
                    {revokingSessionId === sess.session_id ? 'Revoking...' : 'Revoke Token'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
