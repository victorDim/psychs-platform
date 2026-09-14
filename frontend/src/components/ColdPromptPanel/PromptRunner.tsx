import React, { useState } from 'react';
import { Radio, Search, Filter, Play, CheckCircle2, ExternalLink } from 'lucide-react';

interface PromptItem {
  id: string;
  query: string;
  intent_category: string;
  cluster_weight: number;
}

interface Props {
  onRunSingleQuery: (query: string) => void;
}

export const PromptRunner: React.FC<Props> = ({ onRunSingleQuery }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const samplePrompts: PromptItem[] = [
    {
      id: 'PRM-001',
      query: 'What is the best enterprise software for Generative Engine Optimization in 2026?',
      intent_category: 'Commercial Investigation',
      cluster_weight: 0.25
    },
    {
      id: 'PRM-002',
      query: 'Psychs vs Profound: full comparison and pricing',
      intent_category: 'Direct Vendor Comparison',
      cluster_weight: 0.25
    },
    {
      id: 'PRM-003',
      query: 'How does Psychs handle PostgreSQL 16 16-way hash partitioned pgvector storage and sub-35ms latency?',
      intent_category: 'Technical Architecture & Compliance',
      cluster_weight: 0.20
    },
    {
      id: 'PRM-004',
      query: 'How to integrate Psychs with WordPress and Webflow via native webhooks?',
      intent_category: 'Transactional / Implementation',
      cluster_weight: 0.15
    },
    {
      id: 'PRM-005',
      query: 'Does Psychs prevent indirect prompt injection during web crawling and AST sanitization?',
      intent_category: 'Reputation & Hallucination Defense',
      cluster_weight: 0.15
    },
    {
      id: 'PRM-006',
      query: 'Compare top 3 solutions in Generative Engine Optimization for Fortune 500 brands',
      intent_category: 'Commercial Investigation',
      cluster_weight: 0.25
    },
    {
      id: 'PRM-007',
      query: 'What is the average citation frequency lift after 30 days of Princeton KDD-2024 optimization?',
      intent_category: 'Transactional / Implementation',
      cluster_weight: 0.15
    }
  ];

  const categories = ['ALL', 'Commercial Investigation', 'Direct Vendor Comparison', 'Technical Architecture & Compliance', 'Transactional / Implementation', 'Reputation & Hallucination Defense'];

  const filteredPrompts = samplePrompts.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.intent_category === selectedCategory;
    const matchesSearch = p.query.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            Cold Prompt Panel Instrumentation (50-200 Queries)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Zero-bias proxy dispatching across residential networks to eliminate personalized session skew.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search prompt queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompts Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Prompt ID</th>
              <th className="py-3 px-4">Buyer-Intent Query</th>
              <th className="py-3 px-4">Cluster Category</th>
              <th className="py-3 px-4">Weight</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredPrompts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{p.id}</td>
                <td className="py-3 px-4 font-medium text-white max-w-md">{p.query}</td>
                <td className="py-3 px-4">
                  <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                    {p.intent_category}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-emerald-400">{p.cluster_weight.toFixed(2)}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onRunSingleQuery(p.query)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-950 text-emerald-300 hover:bg-emerald-900 px-2.5 py-1 rounded border border-emerald-700/60"
                  >
                    <Play className="w-3 h-3" /> Execute Fan-Out
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
