import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  Cpu, 
  RefreshCw, 
  Sparkles, 
  ChevronDown, 
  Check, 
  Compass, 
  Building2, 
  CreditCard, 
  Database, 
  Globe,
  Search,
  Menu,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface BrandOption {
  id: string;
  name: string;
  industry: string;
  score: number;
  icon: React.ElementType;
  color: string;
}

const BENCHMARK_BRANDS: BrandOption[] = [
  {
    id: 'Psychs',
    name: 'Psychs',
    industry: 'Enterprise GEO Platform',
    score: 87.4,
    icon: Sparkles,
    color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50'
  },
  {
    id: 'Stripe',
    name: 'Stripe',
    industry: 'Fintech & Global Payments',
    score: 89.6,
    icon: CreditCard,
    color: 'text-indigo-400 bg-indigo-950/60 border-indigo-700/50'
  },
  {
    id: 'Snowflake',
    name: 'Snowflake',
    industry: 'Data Cloud & Lakehouse',
    score: 86.2,
    icon: Database,
    color: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50'
  },
  {
    id: 'Vercel',
    name: 'Vercel',
    industry: 'Frontend Cloud & Next.js',
    score: 91.8,
    icon: Globe,
    color: 'text-rose-400 bg-rose-950/60 border-rose-700/50'
  }
];

interface NavbarProps {
  onTriggerAudit: () => void;
  isAuditing: boolean;
  activeBrand: string;
  onBrandChange: (brand: string) => void;
  onStartTour: () => void;
  onOpenCommandPalette?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onTriggerAudit, 
  isAuditing, 
  activeBrand,
  onBrandChange,
  onStartTour,
  onOpenCommandPalette,
  onToggleMobileMenu
}) => {
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentBrandObj = BENCHMARK_BRANDS.find(b => b.id === activeBrand) || BENCHMARK_BRANDS[0];
  const CurrentIcon = currentBrandObj.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6">
      {/* Brand Identity & Multi-Brand Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0 border border-white/20">
            <Sparkles className="w-5 h-5 text-slate-950 font-black" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                PSYCHS
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                GEO v2.0-PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Generative Engine Optimization &amp; AI Perception</p>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-slate-800 mx-1 hidden lg:block" />

        {/* Multi-Brand Benchmark Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
            className="flex items-center gap-2 text-xs text-slate-200 bg-slate-900/80 hover:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-sm transition-all duration-150"
          >
            <div className={`p-1 rounded-lg ${currentBrandObj.color}`}>
              <CurrentIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">{currentBrandObj.name}</span>
                <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {currentBrandObj.score}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isBrandDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-[#090e1c] border border-slate-700/80 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Switch Benchmark Simulation
              </div>
              {BENCHMARK_BRANDS.map((brand) => {
                const Icon = brand.icon;
                const isSelected = brand.id === activeBrand;
                return (
                  <button
                    key={brand.id}
                    onClick={() => {
                      onBrandChange(brand.id);
                      setIsBrandDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors ${
                      isSelected ? 'bg-emerald-950/40 text-white' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${brand.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-1.5 text-slate-100">
                          {brand.name}
                          <span className="text-[10px] font-mono text-emerald-400">
                            {brand.score}/100
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{brand.industry}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center Command Palette Trigger Button */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
              Search 31 modules, brands, or actions...
            </span>
          </div>
          <span className="kbd-shortcut group-hover:border-slate-600 transition-colors">
            ⌘K
          </span>
        </button>
      </div>

      {/* System Actions & Live Indicators */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Memory & Cache Indicator */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800/80 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 font-mono text-[11px]">SOC2:</span>
          <span className="font-mono text-emerald-400 font-semibold text-[11px]">SEALED</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">Mesh:</span>
          <span className="font-mono text-cyan-400 font-semibold text-[11px]">4,250 IPs</span>
        </div>

        {/* Quick Search Icon for Tablets/Mobile */}
        <button
          onClick={onOpenCommandPalette}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 md:hidden"
          title="Open Command Palette (⌘K)"
        >
          <Search className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Guided Product Tour Button */}
        <button
          onClick={onStartTour}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 shadow-md shadow-cyan-950/40 transition-all duration-150 active:scale-95"
          title="Start Guided Executive Product Tour"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">Product Tour</span>
        </button>

        {/* Live Audit Trigger Button */}
        <button
          onClick={onTriggerAudit}
          disabled={isAuditing}
          className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 shadow-md ${
            isAuditing
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 cursor-wait'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing...' : 'Run Perception Audit'}</span>
        </button>
      </div>
    </header>
  );
};


