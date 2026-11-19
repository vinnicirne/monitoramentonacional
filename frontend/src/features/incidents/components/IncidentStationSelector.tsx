import React from 'react';
import { AlertCircle, Building2, RotateCcw, Search, Sparkles } from 'lucide-react';
import { DelegaciaMatchResult } from '../../../utils/delegaciaMatcher';

export interface IncidentStationOption {
  id: string;
  uf: string;
  name: string;
  municipio: string;
}

interface IncidentStationSelectorProps {
  delegacias: IncidentStationOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  ufFilter: 'TODAS' | 'RJ' | 'MG' | 'ES';
  onUfFilterChange: (uf: 'TODAS' | 'RJ' | 'MG' | 'ES') => void;
  search: string;
  onSearchChange: (value: string) => void;
  autoMatchInfo: DelegaciaMatchResult | null;
  manuallyOverridden: boolean;
  onRestoreAutoMatch: () => void;
}

export const IncidentStationSelector: React.FC<IncidentStationSelectorProps> = ({
  delegacias,
  selectedId,
  onSelect,
  ufFilter,
  onUfFilterChange,
  search,
  onSearchChange,
  autoMatchInfo,
  manuallyOverridden,
  onRestoreAutoMatch
}) => (
  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
    <div className="flex items-center justify-between">
      <label className="font-bold text-slate-700 flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 text-[#2D3277]" />
        <span>Delegacia de Polícia Responsável *</span>
      </label>
      <div className="flex items-center gap-1 text-[10px]">
        {(['TODAS', 'RJ', 'MG', 'ES'] as const).map(uf => (
          <button type="button" key={uf} onClick={() => onUfFilterChange(uf)}
            className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
              ufFilter === uf ? 'bg-[#2D3277] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}>
            {uf}
          </button>
        ))}
      </div>
    </div>

    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="relative sm:w-1/3">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        <input type="text" value={search} onChange={event => onSearchChange(event.target.value)}
          placeholder="Buscar por nome ou município..."
          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#3483FA]" />
      </div>
      <div className="relative flex-1">
        <select value={selectedId} onChange={event => onSelect(event.target.value)}
          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-xs text-slate-800 focus:outline-none focus:border-[#3483FA]">
          {delegacias.map(delegacia => (
            <option key={delegacia.id} value={delegacia.id}>
              [{delegacia.uf}] {delegacia.name} ({delegacia.municipio})
            </option>
          ))}
        </select>
      </div>
    </div>

    {autoMatchInfo && selectedId === autoMatchInfo.delegaciaId ? (
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate"><strong className="text-emerald-950 font-extrabold">Delegacia Vinculada pela Localização:</strong> {autoMatchInfo.reason}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold uppercase shrink-0 border border-emerald-300">
          {autoMatchInfo.confidence === 'exact_boundary' ? 'Limite Oficial' : 'Área Mapeada'}
        </span>
      </div>
    ) : manuallyOverridden && autoMatchInfo ? (
      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate">Alterada manualmente. A delegacia oficial da área é <strong>{autoMatchInfo.delegaciaName}</strong>.</span>
        </div>
        <button type="button" onClick={onRestoreAutoMatch}
          className="px-2 py-0.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
          title="Restaurar a delegacia calculada pela localização">
          <RotateCcw className="w-3 h-3" />
          <span>Restaurar DP da Área</span>
        </button>
      </div>
    ) : null}
  </div>
);
