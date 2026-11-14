import React, { useState } from 'react';
import {
  Layers,
  Filter,
  Building2,
  Flame,
  Compass,
  ChevronRight,
  ShieldAlert,
  Globe,
  X,
  Sliders,
  MapPin
} from 'lucide-react';
import { BasemapType, ChoroplethMetric, LayerVisibility, TerritorialRegistry } from '../types';
import { EstadoScope } from '../types/sigBase';
import {
  FAC_CATALOG,
  FAC_ORDER,
  FACCAO_COUNTS,
  CodigoFaccaoPrecisa
} from '../data/faccoesPrecisas';
import { BRASIL_UFS_LIST, UfMetadataInfo } from '../data/brasilEstadosData';
import { DELEGACIAS_MG_ES_DATA } from '../data/delegaciasMgEsData';
import { DelegaciaTerritorialMgEs } from '../types/delegaciaTerritorial';

export type SidebarSection = 'layers' | 'filters' | 'cisps' | 'legend' | 'states';

interface LeftSidebarProps {
  registry: TerritorialRegistry | null;
  estadoScope: EstadoScope;
  setEstadoScope: (scope: EstadoScope) => void;
  onSelectUf: (uf: UfMetadataInfo) => void;
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  basemap: BasemapType;
  setBasemap: (b: BasemapType) => void;
  selectedRispFilter: number | 'all';
  setSelectedRispFilter: (r: number | 'all') => void;
  selectedMunicipioFilter: string;
  setSelectedMunicipioFilter: (m: string) => void;
  selectedFactionFilter: string;
  setSelectedFactionFilter: (f: string) => void;
  visiblePreciseFactions: Record<CodigoFaccaoPrecisa, boolean>;
  setVisiblePreciseFactions: React.Dispatch<React.SetStateAction<Record<CodigoFaccaoPrecisa, boolean>>>;
  onSelectCISP: (cispId: number) => void;
  selectedCispId: number | null;
  onSelectDelegaciaMgEs?: (delegacia: DelegaciaTerritorialMgEs) => void;
  onResetView: () => void;
  choroplethMetric: ChoroplethMetric;
  setChoroplethMetric: (m: ChoroplethMetric) => void;
  layerOpacity: number;
  setLayerOpacity: (o: number) => void;
  activeSection?: SidebarSection | null;
  onActiveSectionChange?: (section: SidebarSection | null) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  registry,
  estadoScope,
  setEstadoScope,
  onSelectUf,
  layers,
  setLayers,
  basemap,
  setBasemap,
  selectedRispFilter,
  setSelectedRispFilter,
  selectedMunicipioFilter,
  setSelectedMunicipioFilter,
  selectedFactionFilter,
  setSelectedFactionFilter,
  visiblePreciseFactions,
  setVisiblePreciseFactions,
  onSelectCISP,
  selectedCispId,
  onSelectDelegaciaMgEs,
  onResetView,
  choroplethMetric,
  setChoroplethMetric,
  layerOpacity,
  setLayerOpacity,
  activeSection: controlledSection,
  onActiveSectionChange
}) => {
  const [internalSection, setInternalSection] = useState<SidebarSection | null>(null);
  const activeSection = controlledSection !== undefined ? controlledSection : internalSection;
  const setActiveSection = (next: SidebarSection | null) => {
    if (onActiveSectionChange) onActiveSectionChange(next);
    else setInternalSection(next);
  };
  const [ufSearch, setUfSearch] = useState('');

  const municipios = React.useMemo(() => {
    if (!registry) return [];
    const set = new Set<string>();
    Object.values(registry.cisps).forEach(c => set.add(c.municipio));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [registry]);

  const filteredCisps = React.useMemo(() => {
    if (!registry) return [];
    return Object.values(registry.cisps)
      .filter(c => {
        if (selectedRispFilter !== 'all' && c.risp !== selectedRispFilter) return false;
        if (selectedMunicipioFilter && c.municipio !== selectedMunicipioFilter) return false;
        if (selectedFactionFilter) {
          if (!c.dinamica_territorial?.faccao.toLowerCase().includes(selectedFactionFilter.toLowerCase())) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => a.cisp - b.cisp);
  }, [registry, selectedRispFilter, selectedMunicipioFilter, selectedFactionFilter]);

  const filteredUfs = React.useMemo(() => {
    const q = ufSearch.toLowerCase().trim();
    if (!q) return BRASIL_UFS_LIST;
    return BRASIL_UFS_LIST.filter(
      u => u.nome.toLowerCase().includes(q) || u.uf.toLowerCase().includes(q) || u.regiao.toLowerCase().includes(q)
    );
  }, [ufSearch]);

  const filteredDelegaciasMgEs = React.useMemo(() => {
    return DELEGACIAS_MG_ES_DATA.filter(del => {
      if (estadoScope === 'MG' && del.uf !== 'MG') return false;
      if (estadoScope === 'ES' && del.uf !== 'ES') return false;
      if (selectedMunicipioFilter && del.municipio !== selectedMunicipioFilter) return false;
      return true;
    });
  }, [estadoScope, selectedMunicipioFilter]);

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSectionClick = (section: SidebarSection) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const closeIfMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setActiveSection(null);
    }
  };

  return (
    <div className="relative flex h-full z-20 shrink-0">
      {/* 1. Desktop Slim Vertical Rail (hidden on mobile to maximize map viewport) */}
      <nav className="hidden md:flex w-14 bg-slate-950 border-r border-slate-800 flex-col items-center py-3 gap-3 justify-between shadow-xl">
        <div className="flex flex-col items-center gap-2">
          {/* Camadas & Mapa */}
          <button
            onClick={() => handleSectionClick('layers')}
            title="Camadas e Mapas Base"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeSection === 'layers'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Estados com Dados (RJ · MG · ES) */}
          <button
            onClick={() => handleSectionClick('states')}
            title="Estados Integrados (RJ · MG · ES)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
              activeSection === 'states'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span className="absolute bottom-1 right-1 text-[8px] font-mono text-emerald-400 font-bold">3</span>
          </button>

          {/* Filtros Territoriais & Coroplético */}
          <button
            onClick={() => handleSectionClick('filters')}
            title="Filtros Territoriais e Mapa Temático"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
              activeSection === 'filters'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
          >
            <Filter className="w-5 h-5" />
            {(selectedRispFilter !== 'all' || selectedMunicipioFilter || selectedFactionFilter) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5 ring-2 ring-slate-950" />
            )}
          </button>

          {/* Lista de Delegacias (137 CISPs) */}
          <button
            onClick={() => handleSectionClick('cisps')}
            title="Lista de Delegacias (137 CISPs)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
              activeSection === 'cisps'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-400 font-bold">137</span>
          </button>

          {/* Legenda Dinâmica Armada / 1.695 Áreas */}
          <button
            onClick={() => handleSectionClick('legend')}
            title="Facções Precisas (1.695 áreas ago/2026)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeSection === 'legend'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
          >
            <Flame className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Rail Action: Reset View */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onResetView}
            title="Centralizar Escopo Atual"
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* 2. Mobile Backdrop */}
      {activeSection && (
        <div
          onClick={() => setActiveSection(null)}
          className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-30 md:hidden"
        />
      )}

      {/* 3. Drawer Panel: Desktop Side Flyout / Mobile Bottom Sheet */}
      {activeSection && (
        <aside className="fixed inset-x-0 bottom-14 z-40 max-h-[76dvh] rounded-t-3xl border-t border-slate-700 bg-slate-900/98 flex flex-col shadow-2xl backdrop-blur-md md:static md:inset-auto md:max-h-none md:w-80 md:h-full md:rounded-none md:border-t-0 md:border-r md:border-slate-800">
          {/* Mobile Sheet Grab Handle */}
          <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mt-2.5 mb-0.5 md:hidden shrink-0" />

          {/* Mobile Quick Tool Switcher */}
          <div className="flex md:hidden items-center gap-1 px-3 py-2 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
            {(
              [
                { id: 'layers', label: 'Camadas' },
                { id: 'states', label: 'Estados (3)' },
                { id: 'filters', label: 'Filtros' },
                { id: 'cisps', label: `DPs (${filteredCisps.length})` },
                { id: 'legend', label: 'Facções' }
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  activeSection === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/80 text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="px-3.5 py-2.5 md:p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              {activeSection === 'layers' && <Layers className="w-4 h-4 text-blue-400" />}
              {activeSection === 'states' && <Globe className="w-4 h-4 text-emerald-400" />}
              {activeSection === 'filters' && <Filter className="w-4 h-4 text-blue-400" />}
              {activeSection === 'cisps' && <Building2 className="w-4 h-4 text-blue-400" />}
              {activeSection === 'legend' && <Flame className="w-4 h-4 text-red-400" />}
              <span>
                {activeSection === 'layers' && 'Camadas & Mapas Base'}
                {activeSection === 'states' && 'Estados com Dados (RJ · MG · ES)'}
                {activeSection === 'filters' && 'Filtros & Coroplético'}
                {activeSection === 'cisps' && `Delegacias (${filteredCisps.length})`}
                {activeSection === 'legend' && 'Facções (1.695 áreas)'}
              </span>
            </span>
            <button
              onClick={() => setActiveSection(null)}
              className="p-2 md:p-1 rounded-lg md:rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
            {/* --- SEÇÃO CAMADAS & MAPAS BASE --- */}
            {activeSection === 'layers' && (
              <>
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Mapa Base (OpenLayers v9.2.4)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'osm', label: 'OSM Padrão' },
                        { id: 'voyager', label: 'Voyager Color' },
                        { id: 'satellite', label: 'Satélite HD' },
                        { id: 'streets', label: 'Ruas & Vias' }
                      ] as const
                    ).map(bm => (
                      <button
                        key={bm.id}
                        onClick={() => setBasemap(bm.id)}
                        className={`px-2.5 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          basemap === bm.id
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {bm.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Camadas Vetoriais
                  </span>
                  {(
                    [
                      { key: 'faccoesPrecisas', label: 'Facções Precisas (1.695 áreas)', dot: '#E0342C' },
                      { key: 'cisp', label: 'Circunscrições CISP (137 DPs)', dot: '#3b82f6' },
                      { key: 'aisp', label: 'Áreas Integradas AISP (41 BPMs)', dot: '#f59e0b' },
                      { key: 'risp', label: 'Regiões RISP (7 CPAs)', dot: '#10b981' },
                      { key: 'delegacias', label: 'Sedes das Delegacias (PCERJ)', dot: '#38bdf8' },
                      { key: 'batalhoes', label: 'Sedes dos Batalhões (PMERJ)', dot: '#0891b2' },
                      { key: 'focos', label: 'Focos Especiais KML (8)', dot: '#ef4444' },
                      { key: 'mgEs', label: 'Sedes RISP / Regionais (MG·ES)', dot: '#34d399' },
                      { key: 'brasilEstados', label: 'Limites Estaduais (RJ · MG · ES)', dot: '#94a3b8' }
                    ] as const
                  ).map(item => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={layers[item.key]}
                          onChange={() => toggleLayer(item.key)}
                          className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0"
                        />
                        <span className="text-slate-200">{item.label}</span>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.dot }} />
                    </label>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400">
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      Opacidade Polígonos CISP
                    </span>
                    <span className="font-mono text-blue-400">{Math.round(layerOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={0.85}
                    step={0.05}
                    value={layerOpacity}
                    onChange={e => setLayerOpacity(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* --- SEÇÃO ESTADOS INTEGRADOS (RJ, MG, ES) --- */}
            {activeSection === 'states' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'TODOS', label: 'Todos (RJ+MG+ES)' },
                      { id: 'RJ', label: 'Rio de Janeiro' },
                      { id: 'MG', label: 'Minas Gerais' },
                      { id: 'ES', label: 'Espírito Santo' },
                      { id: 'MG_ES', label: 'MG + ES' }
                    ] as const
                  ).map(sc => (
                    <button
                      key={sc.id}
                      onClick={() => setEstadoScope(sc.id)}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        estadoScope === sc.id
                          ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={ufSearch}
                  onChange={e => setUfSearch(e.target.value)}
                  placeholder="Filtrar estado com dados (RJ, MG, ES)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />

                <div className="space-y-1 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
                  {filteredUfs.map(u => {
                    const isIntegrado = u.statusSig !== 'MALHA_IBGE_DISPONIVEL';
                    return (
                      <button
                        key={u.uf}
                        onClick={() => {
                          onSelectUf(u);
                          closeIfMobile();
                        }}
                        className="w-full text-left p-2.5 md:p-2 rounded-lg bg-slate-950/50 hover:bg-slate-800 border border-slate-800/70 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-7 h-7 rounded font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ${
                              u.uf === 'RJ'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                : isIntegrado
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {u.uf}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-200 truncate">{u.nome}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {u.regiao} · {u.orgaoPC} / {u.orgaoPM}
                            </div>
                          </div>
                        </div>
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- SEÇÃO FILTROS & COROPLÉTICO --- */}
            {activeSection === 'filters' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Mapa Temático (Coroplético CISP)
                  </label>
                  <select
                    value={choroplethMetric}
                    onChange={e => setChoroplethMetric(e.target.value as ChoroplethMetric)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">Delimitação Padrão (CISP)</option>
                    <option value="faccao">Dinâmica Territorial / Facção</option>
                    <option value="letalidade_violenta">Letalidade Violenta (ISP-RJ)</option>
                    <option value="roubo_rua">Roubo de Rua (ISP-RJ)</option>
                    <option value="roubo_veiculo">Roubo de Veículo (ISP-RJ)</option>
                    <option value="roubo_carga">Roubo de Carga (ISP-RJ)</option>
                    <option value="fuzis_apreendidos">Fuzis Apreendidos (ISP-RJ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Região Integrada (RISP)
                  </label>
                  <select
                    value={selectedRispFilter}
                    onChange={e => setSelectedRispFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todas as 7 RISPs</option>
                    {[1, 2, 3, 4, 5, 6, 7].map(r => (
                      <option key={r} value={r}>
                        RISP {r} {registry?.risps[r] ? `· ${registry.risps[r].regiao}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Município (RJ)
                  </label>
                  <select
                    value={selectedMunicipioFilter}
                    onChange={e => setSelectedMunicipioFilter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Todos os 92 Municípios</option>
                    {municipios.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dinâmica Armada / Facção
                  </label>
                  <select
                    value={selectedFactionFilter}
                    onChange={e => setSelectedFactionFilter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Todas as Situações</option>
                    <option value="CV">Comando Vermelho (CV)</option>
                    <option value="TCP">Terceiro Comando Puro (TCP)</option>
                    <option value="ADA">Amigos dos Amigos (ADA)</option>
                    <option value="MIL">Milícia</option>
                    <option value="LJ">Liga da Justiça (CL220)</option>
                    <option value="MNI">Milícia de Nova Iguaçu</option>
                    <option value="NEU">Área Neutra</option>
                    <option value="Disputa">Área em Disputa Bélica</option>
                    <option value="Controle">Controle Institucional</option>
                  </select>
                </div>

                {(selectedRispFilter !== 'all' || selectedMunicipioFilter || selectedFactionFilter) && (
                  <button
                    onClick={() => {
                      setSelectedRispFilter('all');
                      setSelectedMunicipioFilter('');
                      setSelectedFactionFilter('');
                    }}
                    className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                  >
                    Limpar Todos os Filtros
                  </button>
                )}

                <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-400">
                  <div className="font-semibold text-slate-300">Filtro Ativo:</div>
                  <div>
                    • {filteredCisps.length} de {registry ? Object.keys(registry.cisps).length : 137} circunscrições
                  </div>
                  <div>• {new Set(filteredCisps.map(c => c.aisp)).size} batalhões abrangidos</div>
                </div>
              </div>
            )}

            {/* --- SEÇÃO DELEGACIAS (RJ, MG ou ES conforme escopo) --- */}
            {activeSection === 'cisps' && (
              <div className="space-y-1.5">
                {(estadoScope === 'MG' || estadoScope === 'ES' || estadoScope === 'MG_ES') && (
                  <div className="space-y-1.5">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                      <span>Delegacias {estadoScope === 'ES' ? 'PCES' : estadoScope === 'MG' ? 'PCMG' : 'MG & ES'}</span>
                      <span className="font-mono text-emerald-400">{filteredDelegaciasMgEs.length} unidades</span>
                    </div>

                    {filteredDelegaciasMgEs.map(del => (
                      <button
                        key={del.id}
                        onClick={() => {
                          onSelectDelegaciaMgEs?.(del);
                          closeIfMobile();
                        }}
                        className="w-full text-left p-2.5 md:p-2 rounded-lg border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/90 hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                del.uf === 'ES'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {del.orgao}
                            </span>
                            <span className="font-bold text-xs text-slate-100 truncate group-hover:text-blue-300">
                              {del.nomeCurto}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {del.municipio} - {del.uf} • {del.regional}
                          </div>
                          <div className="text-[9.5px] text-slate-400/90 truncate mt-0.5">
                            Jurisdição: {del.bairros.slice(0, 3).join(', ')}
                            {del.bairros.length > 3 ? ` (+${del.bairros.length - 3} bairros)` : ''}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-1 group-hover:text-slate-300" />
                      </button>
                    ))}
                  </div>
                )}

                {(estadoScope === 'RJ' || estadoScope === 'TODOS') && (
                  <div className="space-y-1.5">
                    {estadoScope === 'TODOS' && (
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1 mt-3 mb-1">
                        <span>Rio de Janeiro (PCERJ)</span>
                        <span className="font-mono text-blue-400">{filteredCisps.length} CISPs</span>
                      </div>
                    )}
                    {filteredCisps.map(cisp => (
                      <button
                        key={cisp.cisp}
                        onClick={() => {
                          onSelectCISP(cisp.cisp);
                          closeIfMobile();
                        }}
                        className={`w-full text-left p-2.5 md:p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                          selectedCispId === cisp.cisp
                            ? 'bg-blue-600/30 border-blue-500 text-white shadow-sm'
                            : 'bg-slate-800/40 border-slate-800/60 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-blue-400">{cisp.cisp_formatado}</span>
                            <span className="text-[11px] text-slate-200 truncate">
                              {cisp.nome_oficial.replace(`${cisp.cisp_formatado} - `, '')}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {cisp.municipio} • {cisp.batalhao}
                          </div>
                          {cisp.bairros && cisp.bairros.length > 0 && (
                            <div className="text-[9.5px] text-slate-400/90 truncate mt-0.5">
                              Atende: {cisp.bairros.slice(0, 3).join(', ')}
                              {cisp.bairros.length > 3 ? ` (+${cisp.bairros.length - 3})` : ''}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- SEÇÃO LEGENDA & FACÇÕES PRECISAS --- */}
            {activeSection === 'legend' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      Dados de Riscos (ago/2026)
                    </span>
                    <span className="font-mono text-white">1.695 áreas</span>
                  </span>

                  <div className="space-y-1.5 text-[11px]">
                    {FAC_ORDER.map(code => {
                      const meta = FAC_CATALOG[code];
                      const isOn = visiblePreciseFactions[code];
                      return (
                        <label
                          key={code}
                          className={`flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/70 cursor-pointer transition-opacity ${
                            isOn ? 'opacity-100' : 'opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isOn}
                              onChange={e =>
                                setVisiblePreciseFactions(prev => ({
                                  ...prev,
                                  [code]: e.target.checked
                                }))
                              }
                              className="rounded bg-slate-900 border-slate-700 focus:ring-0"
                            />
                            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: meta.color }} />
                            <span className="text-slate-200 font-medium truncate">{meta.label}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">{FACCAO_COUNTS[code]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                  <strong>Fontes Públicas Consolidadas:</strong> Dados de Riscos (base ago/2026 — 1.695 polígonos por comunidade), Observatório GENI-UFF, Instituto Fogo Cruzado, MP-RJ (GAECO) e ISP-RJ.
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
