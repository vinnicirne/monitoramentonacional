import React from 'react';
import {
  Shield,
  BarChart3,
  AlertTriangle,
  Database,
  Info,
  Layers,
  Building2
} from 'lucide-react';
import { EstadoScope } from '../types/sigBase';

export type MainActiveTab = 'map' | 'sig_mges' | 'stats' | 'audit' | 'import' | 'about';

interface HeaderProps {
  activeTab: MainActiveTab;
  setActiveTab: (tab: MainActiveTab) => void;
  estadoScope: EstadoScope;
  setEstadoScope: (scope: EstadoScope) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  estadoScope,
  setEstadoScope
}) => {
  return (
    <header className="h-[52px] md:h-16 bg-slate-900/95 border-b border-slate-800 px-2.5 sm:px-4 lg:px-5 flex items-center justify-between gap-2 md:gap-3 z-30 shrink-0">
      {/* 1. Brand Identity — Clean, never clipped on mobile */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
          <Shield className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <h1 className="font-bold text-sm lg:text-[15px] text-slate-100 tracking-tight whitespace-nowrap">
            <span className="hidden md:inline">Monitoramento Territorial</span>
            <span className="md:hidden">Territorial</span>
          </h1>
          <span className="hidden lg:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
            RJ · MG · ES
          </span>
        </div>
      </div>

      {/* 2. State Scope Segmented Control — Fits cleanly on 375px+ mobile */}
      <div className="flex items-center gap-0.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800 min-w-0 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'TODOS', label: 'Todos' },
            { id: 'RJ', label: 'RJ' },
            { id: 'MG', label: 'MG' },
            { id: 'ES', label: 'ES' },
            { id: 'MG_ES', label: 'MG+ES' }
          ] as const
        ).map(uf => (
          <button
            key={uf.id}
            onClick={() => {
              setEstadoScope(uf.id);
              if (activeTab === 'sig_mges' && (uf.id === 'RJ' || uf.id === 'TODOS')) {
                setActiveTab('map');
              }
            }}
            className={`px-2.5 py-1.5 md:py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              estadoScope === uf.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {uf.label}
          </button>
        ))}
      </div>

      {/* 3. Desktop Navigation Tabs (on mobile, handled by Thumb-Zone Bottom Tab Bar) */}
      <nav className="hidden md:flex items-center gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('map')}
          title="Mapa & Dossiê"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'map'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>Mapa</span>
        </button>

        <button
          onClick={() => setActiveTab('sig_mges')}
          title="Base SIG MG & ES"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'sig_mges'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Building2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'sig_mges' ? 'text-white' : 'text-emerald-400'}`} />
          <span className="hidden lg:inline">SIG MG·ES</span>
          <span className="lg:hidden">SIG</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          title="Estatísticas ISP-RJ"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'stats'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden lg:inline">Estatísticas</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          title="Auditoria Territorial"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'audit' ? 'text-white' : 'text-amber-300'}`} />
          <span className="hidden lg:inline">Auditoria</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          title="Importar Planilhas & GeoJSON"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer whitespace-nowrap"
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden lg:inline">Importar</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          title="Metodologia & Fontes"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'about'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden lg:inline">Metodologia</span>
        </button>
      </nav>
    </header>
  );
};
