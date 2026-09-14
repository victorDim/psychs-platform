import React, { useState } from 'react';
import { TenantKeyStatus } from '../../types';
import { Key, ShieldAlert, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  keyStatus: TenantKeyStatus;
  onKeyShredded: () => void;
}

export const CryptoShreddingPanel: React.FC<Props> = ({ keyStatus, onKeyShredded }) => {
  const [isShredding, setIsShredding] = useState<boolean>(false);
  const [shredResult, setShredResult] = useState<any>(null);

  const handleShred = async () => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to trigger KMS Tenant Data Key (TDK) destruction? All vector embeddings and records will be cryptographically unrecoverable within 60 seconds pursuant to GDPR Article 17.')) {
      return;
    }

    setIsShredding(true);
    try {
      const res = await api.executeCryptoShred(keyStatus.tenant_id);
      setShredResult(res);
      onKeyShredded();
    } catch (e) {
      console.error(e);
    } finally {
      setIsShredding(false);
    }
  };

  const isShredded = keyStatus.key_state === 'SHREDDED' || Boolean(shredResult);

  return (
    <div className="glass-panel p-6 border-rose-950/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-rose-400" />
            KMS Envelope Encryption &amp; Sub-60s Cryptographic Shredding (NFR-SEC-02)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Compliant with GDPR Article 17 (&quot;Right to be Forgotten&quot;) and ISO 27001 Cryptographic Erasure standards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded border ${
              isShredded
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
            }`}
          >
            Key State: {isShredded ? 'DESTROYED / SHREDDED' : keyStatus.key_state}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Tenant Data Key (TDK) ARN:</span>
            <span className="text-cyan-400 font-bold truncate max-w-sm">{keyStatus.kms_tdk_arn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Key Created Timestamp:</span>
            <span className="text-slate-200">{keyStatus.created_at}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Last 90-Day Rotation:</span>
            <span className="text-slate-200">{keyStatus.last_rotated_at}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Data Cryptographically Recoverable:</span>
            <span className={isShredded ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isShredded ? 'NO (Irrevocably Indecipherable)' : 'YES (AES-256 GCM Active)'}
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between">
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            Triggering key destruction permanently purges the KMS root Tenant Data Key, leaving all 16 hash partitions across PostgreSQL unreadable.
          </p>

          <button
            onClick={handleShred}
            disabled={isShredding || isShredded}
            className={`w-full py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              isShredded
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 active:scale-95'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            {isShredded ? 'Tenant Cryptographically Shredded' : 'Execute Sub-60s Crypto-Shred'}
          </button>
        </div>
      </div>

      {shredResult && (
        <div className="mt-4 p-3 bg-rose-950/40 rounded-lg border border-rose-800/60 text-xs text-rose-300 font-mono">
          ✓ {shredResult.message} (Shred Time: {shredResult.shred_time_seconds}s - SLA Met: &lt;60s)
        </div>
      )}
    </div>
  );
};
