import React, { useState } from 'react';
import { Layers, Filter, Building2, Flame, Compass, Globe, X, Menu } from 'lucide-react';
import { BasemapType, ChoroplethMetric, LayerVisibility, TerritorialRegistry } from '../types';
import { EstadoScope } from '../types/sigBase';
import { CodigoFaccaoPrecisa } from '../data/faccoesPrecisas';
import { BRASIL_UFS_LIST, UfMetadataInfo } from '../data/brasilEstadosData';
import { DELEGACIAS_MG_ES_DATA } from '../data/delegaciasMgEsData';
import { DelegaciaTerritorialMgEs } from '../types/delegaciaTerritorial';
import { LayerControls } from '../features/map/components/sidebar/LayerControls';
import { StateControls } from '../features/map/components/sidebar/StateControls';
import { TerritorialFilters } from '../features/map/components/sidebar/TerritorialFilters';
import { StationDirectory } from '../features/map/components/sidebar/StationDirectory';
import { FactionLegend } from '../features/map/components/sidebar/FactionLegend';

export type SidebarSection = 'layers' | 'filters' | 'cisps' | 'legend' | 'states';

export interface LeftSidebarProps {
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
  selectedDelegaciaMgEsId?: string | null;
  onResetView: () => void;
  choroplethMetric: ChoroplethMetric;
  setChoroplethMetric: (m: ChoroplethMetric) => void;
  layerOpacity: number;
  setLayerOpacity: (o: number) => void;
  activeSection?: SidebarSection | null;
  onActiveSectionChange?: (section: SidebarSection | null) => void;
  companyDomain?: string;
  totalCompanyIncidents?: number;
  totalCompanyRoubos?: number;
  onOpenIncidentModal?: () => void;
  onOpenNavigation?: () => void;
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
  selectedDelegaciaMgEsId = null,
  onResetView,
  choroplethMetric,
  setChoroplethMetric,
  layerOpacity,
  setLayerOpacity,
  activeSection: controlledSection,
  onActiveSectionChange,
  companyDomain = '',
  totalCompanyIncidents = 0,
  totalCompanyRoubos = 0,
  onOpenIncidentModal,
  onOpenNavigation
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
      <div className={`relative flex h-full shrink-0 ${activeSection ? 'z-40 md:z-20' : 'z-20'}`}>
      {/* 1. Desktop Slim Vertical Rail (hidden on mobile to maximize map viewport) */}
      <nav className="hidden md:flex w-14 bg-white border-r border-slate-200 flex-col items-center py-3 gap-3 justify-between shadow-sm">
        <div className="flex flex-col items-center gap-2">
          {/* Menu Lateral Geral (Módulos & Submenus) */}
          {onOpenNavigation && (
            <button
              onClick={onOpenNavigation}
              title="Abrir Menu de Módulos (SIG MG e ES, Estatística, Auditoria, Importar, Metodologia)"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-[#2D3277] text-[#FFE600] hover:bg-[#1E2258] shadow-sm mb-1 ring-1 ring-[#1E2258]"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Camadas & Mapa */}
          <button
            onClick={() => handleSectionClick('layers')}
            title="Camadas e Mapas Base"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeSection === 'layers'
                ? 'bg-[#3483FA] text-white shadow-md shadow-[#3483FA]/25 ring-2 ring-[#3483FA]/30'
                : 'text-slate-600 hover:text-[#2D3277] hover:bg-slate-100'
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
                ? 'bg-[#00A650] text-white shadow-md shadow-[#00A650]/25 ring-2 ring-[#00A650]/30'
                : 'text-slate-600 hover:text-[#2D3277] hover:bg-slate-100'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span
              className={`absolute bottom-1 right-1 text-[8px] font-mono font-bold ${
                activeSection === 'states' ? 'text-white' : 'text-[#008744]'
              }`}
            >
              3
            </span>
          </button>

          {/* Filtros Territoriais & Coroplético */}
          <button
            onClick={() => handleSectionClick('filters')}
            title="Filtros Territoriais e Mapa Temático"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
              activeSection === 'filters'
                ? 'bg-[#3483FA] text-white shadow-md shadow-[#3483FA]/25 ring-2 ring-[#3483FA]/30'
                : 'text-slate-600 hover:text-[#2D3277] hover:bg-slate-100'
            }`}
          >
            <Filter className="w-5 h-5" />
            {(selectedRispFilter !== 'all' || selectedMunicipioFilter || selectedFactionFilter) && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFE600] border border-[#2D3277] absolute top-1.5 right-1.5" />
            )}
          </button>

          {/* Lista de Delegacias (137 CISPs) */}
          <button
            onClick={() => handleSectionClick('cisps')}
            title="Lista de Delegacias (137 CISPs)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
              activeSection === 'cisps'
                ? 'bg-[#2D3277] text-white shadow-md shadow-[#2D3277]/25 ring-2 ring-[#2D3277]/30'
                : 'text-slate-600 hover:text-[#2D3277] hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span
              className={`absolute bottom-0.5 right-1 text-[8px] font-mono font-bold ${
                activeSection === 'cisps' ? 'text-[#FFE600]' : 'text-slate-500'
              }`}
            >
              137
            </span>
          </button>

          {/* Legenda Dinâmica Armada / 1.695 Áreas */}
          <button
            onClick={() => handleSectionClick('legend')}
            title="Facções Precisas (1.695 áreas ago/2026)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeSection === 'legend'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-400/40'
                : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
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
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-[#2D3277] hover:bg-[#FFE600] hover:border-[#E6CF00] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* 2. Mobile Backdrop */}
      {activeSection && (
        <div
          onClick={() => setActiveSection(null)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 md:hidden"
        />
      )}

      {/* 3. Drawer Panel: Desktop Side Flyout / Mobile Bottom Sheet */}
      {activeSection && (
        <aside className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 max-h-[76dvh] overscroll-contain rounded-t-3xl border-t border-slate-200 bg-white flex flex-col shadow-2xl md:static md:inset-auto md:max-h-none md:w-80 md:h-full md:rounded-none md:border-t-0 md:border-r md:border-slate-200">
          {/* Mobile Sheet Grab Handle */}
          <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 mb-0.5 md:hidden shrink-0" />

          {/* Mobile Quick Tool Switcher */}
          <div className="flex md:hidden items-center gap-1 px-3 py-2 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
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
                    ? 'bg-[#2D3277] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="px-3.5 py-2.5 md:p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D3277] flex items-center gap-2">
              {activeSection === 'layers' && <Layers className="w-4 h-4 text-[#3483FA]" />}
              {activeSection === 'states' && <Globe className="w-4 h-4 text-[#00A650]" />}
              {activeSection === 'filters' && <Filter className="w-4 h-4 text-[#3483FA]" />}
              {activeSection === 'cisps' && <Building2 className="w-4 h-4 text-[#2D3277]" />}
              {activeSection === 'legend' && <Flame className="w-4 h-4 text-red-600" />}
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
              className="p-2 md:p-1 rounded-lg md:rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
            {/* --- SEÇÃO CAMADAS & MAPAS BASE --- */}
            {activeSection === 'layers' && (
              <LayerControls
                layers={layers}
                setLayers={setLayers}
                basemap={basemap}
                setBasemap={setBasemap}
                layerOpacity={layerOpacity}
                setLayerOpacity={setLayerOpacity}
                companyDomain={companyDomain}
                totalCompanyIncidents={totalCompanyIncidents}
                totalCompanyRoubos={totalCompanyRoubos}
                onOpenIncidentModal={onOpenIncidentModal}
                toggleLayer={toggleLayer}
              />
            )}

            {/* --- SEÇÃO ESTADOS INTEGRADOS (RJ, MG, ES) --- */}
            {activeSection === 'states' && (
              <StateControls
                estadoScope={estadoScope}
                setEstadoScope={setEstadoScope}
                onSelectUf={onSelectUf}
                filteredUfs={filteredUfs}
                ufSearch={ufSearch}
                setUfSearch={setUfSearch}
                closeIfMobile={closeIfMobile}
              />
            )}

            {/* --- SEÇÃO FILTROS & COROPLÉTICO --- */}
            {activeSection === 'filters' && (
              <TerritorialFilters
                selectedRispFilter={selectedRispFilter}
                setSelectedRispFilter={setSelectedRispFilter}
                selectedMunicipioFilter={selectedMunicipioFilter}
                setSelectedMunicipioFilter={setSelectedMunicipioFilter}
                selectedFactionFilter={selectedFactionFilter}
                setSelectedFactionFilter={setSelectedFactionFilter}
                registry={registry}
                choroplethMetric={choroplethMetric}
                setChoroplethMetric={setChoroplethMetric}
                municipios={municipios}
                filteredCisps={filteredCisps}
              />
            )}

            {/* --- SEÇÃO DELEGACIAS (RJ, MG ou ES conforme escopo) --- */}
            {activeSection === 'cisps' && (
              <StationDirectory
                estadoScope={estadoScope}
                onSelectDelegaciaMgEs={onSelectDelegaciaMgEs}
                selectedDelegaciaMgEsId={selectedDelegaciaMgEsId}
                onSelectCISP={onSelectCISP}
                selectedCispId={selectedCispId}
                filteredCisps={filteredCisps}
                filteredDelegaciasMgEs={filteredDelegaciasMgEs}
                closeIfMobile={closeIfMobile}
              />
            )}

            {/* --- SEÇÃO LEGENDA & FACÇÕES PRECISAS --- */}
            {activeSection === 'legend' && (
              <FactionLegend
                visiblePreciseFactions={visiblePreciseFactions}
                setVisiblePreciseFactions={setVisiblePreciseFactions}
              />
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
