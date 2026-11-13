import React, { useState } from 'react';
import { Search, X, RotateCcw, Layers } from 'lucide-react';
import { FilterState } from '../types/territory';
import {
  UNIQUE_RISPS,
  UNIQUE_AISPS,
  UNIQUE_CISPS,
  UNIQUE_MUNICIPIOS,
  UNIQUE_REGIOES
} from '../data/territoryData';
import { FAC_CATALOG, FAC_ORDER, FACCAO_COUNTS } from '../data/faccoesPrecisas';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
  filteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  onReset,
  filteredCount
}) => {
  const [bairroInput, setBairroInput] = useState(filters.bairroSearch);

  const handleBairroChange = (val: string) => {
    setBairroInput(val);
    setFilters(prev => ({ ...prev, bairroSearch: val }));
  };

  const handleClearBairro = () => {
    setBairroInput('');
    setFilters(prev => ({ ...prev, bairroSearch: '' }));
  };

  return (
    <div className="bg-slate-950/95 border-b border-slate-800 p-3 lg:px-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5 items-center">
        {/* RISP Filter */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            RISP
          </label>
          <select
            value={filters.risp}
            onChange={e => setFilters(prev => ({ ...prev, risp: e.target.value === 'all' ? 'all' : Number(e.target.value) }))}
            className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="all">Todas RISP (1-7)</option>
            {UNIQUE_RISPS.map(r => (
              <option key={r} value={r}>
                {r}ª RISP
              </option>
            ))}
          </select>
        </div>

        {/* AISP Filter */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            AISP
          </label>
          <select
            value={filters.aisp}
            onChange={e => setFilters(prev => ({ ...prev, aisp: e.target.value === 'all' ? 'all' : Number(e.target.value) }))}
            className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="all">Todas AISP</option>
            {UNIQUE_AISPS.map(a => (
              <option key={a} value={a}>
                AISP {String(a).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        {/* CISP Filter */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            CISP / Delegacia
          </label>
          <select
            value={filters.cisp}
            onChange={e => setFilters(prev => ({ ...prev, cisp: e.target.value === 'all' ? 'all' : Number(e.target.value) }))}
            className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="all">Todas CISP</option>
            {UNIQUE_CISPS.map(c => (
              <option key={c} value={c}>
                {String(c).padStart(3, '0')}ª DP
              </option>
            ))}
          </select>
        </div>

        {/* Município Filter */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Município
          </label>
          <select
            value={filters.municipio}
            onChange={e => setFilters(prev => ({ ...prev, municipio: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 truncate"
          >
            <option value="all">Todos Municípios</option>
            {UNIQUE_MUNICIPIOS.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Região de Governo */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Região de Governo
          </label>
          <select
            value={filters.regiaoGoverno}
            onChange={e => setFilters(prev => ({ ...prev, regiaoGoverno: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 truncate"
          >
            <option value="all">Todas Regiões</option>
            {UNIQUE_REGIOES.map(rg => (
              <option key={rg} value={rg}>
                {rg}
              </option>
            ))}
          </select>
        </div>

        {/* Bairro / Localidade Search */}
        <div className="lg:col-span-1">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Bairro / Localidade
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Ex: Méier, Copacabana..."
              value={bairroInput}
              onChange={e => handleBairroChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-md pl-8 pr-7 py-1.5 text-xs focus:outline-none focus:border-sky-500"
            />
            {bairroInput && (
              <button
                onClick={handleClearBairro}
                className="absolute right-2 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Facção / Grupo Armado Filter */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-rose-400 mb-1 flex items-center gap-1">
            <span>Facção / Dinâmica</span>
          </label>
          <select
            value={filters.faccao}
            onChange={e => setFilters(prev => ({ ...prev, faccao: e.target.value as any }))}
            className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-rose-500 truncate"
          >
            <option value="all">Todas (1.695 áreas)</option>
            {FAC_ORDER.map(code => (
              <option key={code} value={code}>
                {FAC_CATALOG[code].label} ({FACCAO_COUNTS[code]})
              </option>
            ))}
          </select>
        </div>

        {/* Camada Geográfica */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-sky-400" />
            <span>Camada</span>
          </label>
          <select
            value={filters.camadaAtiva}
            onChange={e => setFilters(prev => ({ ...prev, camadaAtiva: e.target.value as any }))}
            className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="all">Todas as Camadas</option>
            <option value="faccoes">Facções Precisas (1.695 áreas)</option>
            <option value="cisp">Demarcação CISP (Delegacias)</option>
            <option value="aisp">Limites AISP (Batalhões)</option>
          </select>
        </div>

        {/* Período Estatístico & Reset */}
        <div className="flex items-end gap-1.5">
          <div className="flex-1">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Ano ISP
            </label>
            <select
              value={filters.anoEstatistica}
              onChange={e => setFilters(prev => ({ ...prev, anoEstatistica: Number(e.target.value) }))}
              className="w-full bg-slate-900 border border-slate-700/80 text-white rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value={2025}>2025 (Cons.)</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
              <option value={2021}>2021</option>
              <option value={2020}>2020</option>
            </select>
          </div>

          <button
            onClick={onReset}
            title="Limpar todos os filtros"
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Result Counter & Active Filters indicator */}
      <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span>Unidades Filtradas:</span>
          <span className="font-mono font-semibold text-sky-400 tabular-nums">
            {filteredCount}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">
            {filters.risp !== 'all' && `RISP ${filters.risp} · `}
            {filters.aisp !== 'all' && `AISP ${filters.aisp} · `}
            {filters.cisp !== 'all' && `CISP ${filters.cisp} · `}
            {filters.municipio !== 'all' && `${filters.municipio} · `}
            {filters.bairroSearch && `"${filters.bairroSearch}"`}
            {filters.risp === 'all' && filters.aisp === 'all' && filters.cisp === 'all' && filters.municipio === 'all' && !filters.bairroSearch && 'Visão Geral do Estado'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-500">
          <span>Clique em qualquer área ou ponto no mapa para abrir o dossiê da circunscrição</span>
        </div>
      </div>
    </div>
  );
};
