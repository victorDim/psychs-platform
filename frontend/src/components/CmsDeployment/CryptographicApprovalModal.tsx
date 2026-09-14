import React, { useState } from 'react';
import { ContentDiffItem } from '../../types';
import { Lock, ShieldCheck, CheckCircle2, X, AlertTriangle } from 'lucide-react';

interface Props {
  diff: ContentDiffItem | null;
  onClose: () => void;
  onConfirmPublish: (payload: { diffId: string; platform: string; environment: string; signature: string }) => void;
}

export const CryptographicApprovalModal: React.FC<Props> = ({ diff, onClose, onConfirmPublish }) => {
  const [platform, setPlatform] = useState<string>('WordPress');
  const [environment, setEnvironment] = useState<string>('PRODUCTION');
  const [email, setEmail] = useState<string>('vp_marketing@brand.com');
  const [signatureKey, setSignatureKey] = useState<string>('HMAC-SIG-AUTH-77B2149A90');

  if (!diff) return null;

  const handlePublish = () => {
    onConfirmPublish({
      diffId: diff.section_id,
      platform,
      environment,
      signature: signatureKey
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Level 4 Cryptographic Approval &amp; Dispatch</h3>
            <p className="text-xs text-slate-400">Enterprise guardrail requirement before modifying live CMS state.</p>
          </div>
        </div>

        {/* Selected Diff Details */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs mb-4 space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Target Section:</span>
            <span className="text-cyan-400 font-bold">{diff.section_id} - {diff.section_title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Expected Citation Lift:</span>
            <span className="text-emerald-400 font-bold">+{diff.expected_citation_lift_delta}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Extractability Score:</span>
            <span className="text-white font-bold">{diff.extractability_score}/100</span>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-3 mb-6 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target CMS Platform:</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="WordPress">WordPress REST API</option>
              <option value="Webflow">Webflow Collections API v2</option>
              <option value="Shopify">Shopify Headless Storefronts</option>
              <option value="Ghost">Ghost Admin API</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Deployment Environment:</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="env"
                  value="PRODUCTION"
                  checked={environment === 'PRODUCTION'}
                  onChange={() => setEnvironment('PRODUCTION')}
                  className="accent-emerald-500"
                />
                Production
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="env"
                  value="STAGING"
                  checked={environment === 'STAGING'}
                  onChange={() => setEnvironment('STAGING')}
                  className="accent-emerald-500"
                />
                Staging
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Approver Cryptographic Key Signature:</label>
            <input
              type="text"
              value={signatureKey}
              onChange={(e) => setSignatureKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-emerald-400 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 rounded-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <ShieldCheck className="w-4 h-4" /> Cryptographically Sign &amp; Deploy
          </button>
        </div>
      </div>
    </div>
  );
};
