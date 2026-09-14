import React, { useState } from 'react';
import { EntitySchemaResult } from '../../types';
import { FileCode, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  schemaData: EntitySchemaResult;
}

export const SchemaJsonLdViewer: React.FC<Props> = ({ schemaData }) => {
  const [activeSchemaTab, setActiveSchemaTab] = useState<'org' | 'service' | 'faq'>('org');
  const [copied, setCopied] = useState<boolean>(false);

  const currentPayload = 
    activeSchemaTab === 'org'
      ? schemaData.organization_jsonld
      : activeSchemaTab === 'service'
      ? schemaData.service_jsonld
      : schemaData.faqpage_jsonld;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            Machine-Readable Schema.org JSON-LD Compiler (FR-OPT-02)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Standardized microdata with explicit sameAs arrays linking Wikidata, LinkedIn, and Wikipedia knowledge graphs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> {schemaData.validation_status}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied JSON-LD' : 'Copy Code'}
          </button>
        </div>
      </div>

      {/* Schema Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveSchemaTab('org')}
          className={`text-xs px-3 py-1.5 rounded-md font-mono transition-all ${
            activeSchemaTab === 'org'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Organization (sameAs)
        </button>
        <button
          onClick={() => setActiveSchemaTab('service')}
          className={`text-xs px-3 py-1.5 rounded-md font-mono transition-all ${
            activeSchemaTab === 'service'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Service &amp; Offers
        </button>
        <button
          onClick={() => setActiveSchemaTab('faq')}
          className={`text-xs px-3 py-1.5 rounded-md font-mono transition-all ${
            activeSchemaTab === 'faq'
              ? 'bg-cyan-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          FAQPage (Passages)
        </button>
      </div>

      {/* JSON Code Viewer */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 max-h-96 overflow-y-auto">
        <pre>{JSON.stringify(currentPayload, null, 2)}</pre>
      </div>
    </div>
  );
};
