import React, { useState } from 'react';
import { 
  Layers, 
  Map as MapIcon, 
  Filter, 
  Eye, 
  EyeOff, 
  Building2, 
  ShieldAlert, 
  ChevronRight,
  Flame,
  Maximize2,
  X,
  Compass,
  Satellite,
  Sun
} from 'lucide-react';
import { BasemapType, ChoroplethMetric, LayerVisibility, TerritorialRegistry } from '../types';

interface LeftSidebarProps {
  registry: TerritorialRegistry | null;
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
  onSelectCISP: (cispId: number) => void;
  selectedCispId: number | null;
  onResetView: () => void;
  choroplethMetric: ChoroplethMetric;
  setChoroplethMetric: (m: ChoroplethMetric) => void;
  layerOpacity: number;
  setLayerOpacity: (o: number) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  registry,
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
  onSelectCISP,
  selectedCispId,
  onResetView,
  choroplethMetric,
  setChoroplethMetric,
  layerOpacity,
  setLayerOpacity
}) => {
  // Only opens if a section is clicked! Initially null (closed)
  const [activeSection, setActiveSection] = useState<'layers' | 'filters' | 'cisps' | 'legend' | null>(null);

  // Municipalities list
  const municipios = React.useMemo(() => {
    if (!registry) return [];
    const set = new Set<string>();
    Object.values(registry.cisps).forEach(c => set.add(c.municipio));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [registry]);

  // Filtered CISPs
  const filteredCisps = React.useMemo(() => {
    if (!registry) return [];
    return Object.values(registry.cisps).filter(c => {
      if (selectedRispFilter !== 'all' && c.risp !== selectedRispFilter) return false;
      if (selectedMunicipioFilter && c.municipio !== selectedMunicipioFilter) return false;
      if (selectedFactionFilter) {
        if (!c.dinamica_territorial?.faccao.toLowerCase().includes(selectedFactionFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => a.cisp - b.cisp);
  }, [registry, selectedRispFilter, selectedMunicipioFilter, selectedFactionFilter]);

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSectionClick = (section: 'layers' | 'filters' | 'cisps' | 'legend') => {
    setActiveSection(prev => prev === section ? null : section);
  };

  return (
    <div className="relative flex h-[calc(100vh-4rem)] z-20 shrink-0">
      {/* 1. Compact Vertical Rail - Always visible, slim and clean */}
      <nav className="w-14 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-3 gap-3 justify-between shadow-xl">
        <div className="flex flex-col items-center gap-2">
          {/* Section: Camadas & Mapa */}
          <button
            onClick={() => handleSectionClick('layers')}
            title="Camadas e Mapas Base"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeSection === 'layers'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Section: Filtros Territoriais */}
          <button
            onClick={() => handleSectionClick('filters')}
            title="Filtros Territoriais"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
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

          {/* Section: Lista de Delegacias (CISPs) */}
          <button
            onClick={() => handleSectionClick('cisps')}
            title="Lista de Delegacias (137 CISPs)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
              activeSection === 'cisps'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-400 font-bold">137</span>
          </button>

          {/* Section: Legenda Dinâmica Armada */}
          <button
            onClick={() => handleSectionClick('legend')}
            title="Legenda de Facções e Dinâmica Armada"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeSection === 'legend'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
          >
            <Flame className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Rail Action: Reset View to RJ */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onResetView}
            title="Centralizar Todo o Estado do RJ"
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* 2. Flyout Drawer Panel - ONLY renders when a section is clicked! */}
      {activeSection && (
        <aside className="w-80 h-full bg-slate-900/98 border-r border-slate-800 flex flex-col shadow-2xl backdrop-blur-md animate-in slide-in-from-left-2 duration-200">
          {/* Drawer Top Header with Close Button */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              {activeSection === 'layers' && <Layers className="w-4 h-4 text-blue-400" />}
              {activeSection === 'filters' && <Filter className="w-4 h-4 text-blue-400" />}
              {activeSection === 'cisps' && <Building2 className="w-4 h-4 text-blue-400" />}
              {activeSection === 'legend' && <Flame className="w-4 h-4 text-red-400" />}
              <span>
                {activeSection === 'layers' && 'Camadas & Mapas'}
                {activeSection === 'filters' && 'Filtros Territoriais'}
                {activeSection === 'cisps' && `Delegacias (${filteredCisps.length})`}
                {activeSection === 'legend' && 'Dinâmica de Facções'}
              </span>
            </span>
            <button
              onClick={() => setActiveSection(null)}
              title="Fechar Painel (Recolher Menu)"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
            {/* --- SEÇÃO CAMADAS --- */}
            {activeSection === 'layers' && (
              <div className="space-y-4">
                {/* Real Basemap Switcher */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Mapa Base Real (Tiles de Alta Resolução)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Real Satellite */}
                    <button
                      onClick={() => setBasemap('satellite')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        basemap === 'satellite'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Satellite className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-100">Satélite Real</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Imagens aéreas com nomes de ruas e avenidas</div>
                    </button>

                    {/* Real Streets Map */}
                    <button
                      onClick={() => setBasemap('streets')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        basemap === 'streets'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MapIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-slate-100">Ruas & Vias</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Mapa viário com comunidades e marcos</div>
                    </button>

                    {/* Carto Voyager (Claro & Nítido) */}
                    <button
                      onClick={() => setBasemap('voyager')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        basemap === 'voyager'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3.5 h-3.5 rounded bg-sky-400 border border-sky-300" />
                        <span className="text-xs font-bold text-slate-100">Carto Voyager</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Mapa claro, iluminado e vibrante</div>
                    </button>

                    {/* OpenStreetMap */}
                    <button
                      onClick={() => setBasemap('osm')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        basemap === 'osm'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-100">OpenStreet</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Padrão claro internacional</div>
                    </button>
                  </div>
                </div>

                {/* Opacity Slider */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Opacidade dos Polígonos</span>
                    <span className="font-mono text-blue-400">{Math.round(layerOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity}
                    onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Ver mais satélite</span>
                    <span>Sólido</span>
                  </div>
                </div>

                {/* Choropleth Mode */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                    Modo Coroplético (Colorir Polígonos)
                  </label>
                  <select
                    value={choroplethMetric}
                    onChange={(e) => setChoroplethMetric(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">Padrão Territorial (Azul)</option>
                    <option value="letalidade_violenta">Letalidade Violenta (ISP)</option>
                    <option value="roubo_rua">Roubos de Rua (ISP)</option>
                    <option value="roubo_carga">Roubo de Carga (ISP)</option>
                    <option value="roubo_veiculo">Roubo de Veículo (ISP)</option>
                    <option value="fuzis_apreendidos">Apreensão de Fuzis (ISP)</option>
                    <option value="faccao">Dinâmica de Facções (CV, TCP, Milícia)</option>
                  </select>

                  {/* Dynamic Color Scale preview */}
                  {choroplethMetric !== 'none' && choroplethMetric !== 'faccao' && (
                    <div className="pt-1">
                      <div className="h-2 rounded-full w-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-700" />
                      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                        <span>Menor Incidência</span>
                        <span>Média</span>
                        <span>Alerta Máximo</span>
                      </div>
                    </div>
                  )}

                  {choroplethMetric === 'faccao' && (
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600"/> CV</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"/> TCP</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600"/> Milícia</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"/> Disputa</span>
                    </div>
                  )}
                </div>

                {/* Camadas Poligonais */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Camadas Vetoriais Oficiais
                  </label>
                  <div className="space-y-1.5">
                    {/* CISP */}
                    <div 
                      onClick={() => toggleLayer('cisp')}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        layers.cisp ? 'bg-blue-950/40 border-blue-600/60 text-slate-100' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-blue-500 border border-blue-300 shrink-0"></span>
                        <div>
                          <div className="font-semibold text-xs">CISP — Delegacias PCERJ</div>
                          <div className="text-[10px] text-slate-400">137 Polígonos de Demarcação</div>
                        </div>
                      </div>
                      {layers.cisp ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                    </div>

                    {/* AISP */}
                    <div 
                      onClick={() => toggleLayer('aisp')}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        layers.aisp ? 'bg-amber-950/40 border-amber-600/60 text-slate-100' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-amber-500 border border-amber-300 shrink-0"></span>
                        <div>
                          <div className="font-semibold text-xs">AISP — Batalhões PMERJ</div>
                          <div className="text-[10px] text-slate-400">41 Áreas Integradas</div>
                        </div>
                      </div>
                      {layers.aisp ? <Eye className="w-4 h-4 text-amber-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                    </div>

                    {/* RISP */}
                    <div 
                      onClick={() => toggleLayer('risp')}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        layers.risp ? 'bg-purple-950/40 border-purple-600/60 text-slate-100' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-purple-500 border border-purple-300 shrink-0"></span>
                        <div>
                          <div className="font-semibold text-xs">RISP — Comandos Regionais</div>
                          <div className="text-[10px] text-slate-400">7 CPAs do Estado</div>
                        </div>
                      </div>
                      {layers.risp ? <Eye className="w-4 h-4 text-purple-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                    </div>

                    {/* Focos Especiais */}
                    <div 
                      onClick={() => toggleLayer('focos')}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        layers.focos ? 'bg-red-950/40 border-red-600/60 text-slate-100' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-xs text-red-300">Focos Especiais & Facções</div>
                          <div className="text-[10px] text-slate-400">Maré, Israel, Alemão, Milícia...</div>
                        </div>
                      </div>
                      {layers.focos ? <Eye className="w-4 h-4 text-red-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                    </div>

                    {/* Pontos Delegacias */}
                    <div 
                      onClick={() => toggleLayer('delegacias')}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        layers.delegacias ? 'bg-emerald-950/40 border-emerald-600/60 text-slate-100' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shrink-0"></span>
                        <div>
                          <div className="font-semibold text-xs">Sedes de Delegacias (DP)</div>
                          <div className="text-[10px] text-slate-400">Pontos das Unidades Policiais</div>
                        </div>
                      </div>
                      {layers.delegacias ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                    </div>

                    {/* Pontos Batalhões */}
                    <div 
                      onClick={() => toggleLayer('batalhoes')}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        layers.batalhoes ? 'bg-cyan-950/40 border-cyan-600/60 text-slate-100' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white shrink-0"></span>
                        <div>
                          <div className="font-semibold text-xs">Sedes de Batalhões (BPM)</div>
                          <div className="text-[10px] text-slate-400">Pontos dos Batalhões da PMERJ</div>
                        </div>
                      </div>
                      {layers.batalhoes ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- SEÇÃO FILTROS --- */}
            {activeSection === 'filters' && (
              <div className="space-y-3">
                {/* Filter by RISP */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Região Integrada (RISP)
                  </label>
                  <select
                    value={selectedRispFilter}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                      setSelectedRispFilter(val);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todas as 7 RISPs</option>
                    <option value="1">RISP 1 - Capital Centro & Zona Sul (1º CPA)</option>
                    <option value="2">RISP 2 - Capital Zona Norte & Oeste (2º CPA)</option>
                    <option value="3">RISP 3 - Baixada Fluminense (3º CPA)</option>
                    <option value="4">RISP 4 - Leste Fluminense & Lagos (4º CPA)</option>
                    <option value="5">RISP 5 - Sul Fluminense & Costa Verde (5º CPA)</option>
                    <option value="6">RISP 6 - Norte & Noroeste Fluminense (6º CPA)</option>
                    <option value="7">RISP 7 - Região Serrana (7º CPA)</option>
                  </select>
                </div>

                {/* Filter by Município */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Município do RJ
                  </label>
                  <select
                    value={selectedMunicipioFilter}
                    onChange={(e) => setSelectedMunicipioFilter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Todos os 92 Municípios</option>
                    {municipios.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Faction Dynamics */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dinâmica Armada / Facção
                  </label>
                  <select
                    value={selectedFactionFilter}
                    onChange={(e) => setSelectedFactionFilter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Todas as Situações</option>
                    <option value="CV">Comando Vermelho (CV)</option>
                    <option value="TCP">Terceiro Comando Puro (TCP)</option>
                    <option value="Milícia">Milícia Paramilitar</option>
                    <option value="Disputa">Área em Disputa Bélica</option>
                    <option value="Controle Policial">Controle Institucional</option>
                  </select>
                </div>

                {(selectedRispFilter !== 'all' || selectedMunicipioFilter || selectedFactionFilter) && (
                  <button
                    onClick={() => {
                      setSelectedRispFilter('all');
                      setSelectedMunicipioFilter('');
                      setSelectedFactionFilter('');
                    }}
                    className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
                  >
                    Limpar Todos os Filtros
                  </button>
                )}

                <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-400">
                  <div className="font-semibold text-slate-300">Filtro Ativo:</div>
                  <div>• {filteredCisps.length} de {registry ? Object.keys(registry.cisps).length : 137} circunscrições</div>
                  <div>• {new Set(filteredCisps.map(c => c.aisp)).size} batalhões abrangidos</div>
                </div>
              </div>
            )}

            {/* --- SEÇÃO DELEGACIAS (CISPS) --- */}
            {activeSection === 'cisps' && (
              <div className="space-y-1.5">
                {filteredCisps.map(cisp => (
                  <button
                    key={cisp.cisp}
                    onClick={() => onSelectCISP(cisp.cisp)}
                    className={`w-full text-left p-2 rounded-lg border flex items-center justify-between transition-all ${
                      selectedCispId === cisp.cisp
                        ? 'bg-blue-600/30 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-800/40 border-slate-800/60 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-blue-400">{cisp.cisp_formatado}</span>
                        <span className="text-[11px] text-slate-200 truncate">{cisp.nome_oficial.replace(`${cisp.cisp_formatado} - `, '')}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {cisp.municipio} • {cisp.batalhao}
                      </div>
                      {cisp.bairros && cisp.bairros.length > 0 && (
                        <div className="text-[9.5px] text-slate-400/90 truncate mt-0.5">
                          Atende: {cisp.bairros.slice(0, 3).join(', ')}{cisp.bairros.length > 3 ? ` (+${cisp.bairros.length - 3})` : ''}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            )}

            {/* --- SEÇÃO LEGENDA --- */}
            {activeSection === 'legend' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    Classificação de Dinâmica Armada
                  </span>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-400/30"></span>
                      <div>
                        <div className="text-slate-200 font-semibold">Comando Vermelho (CV)</div>
                        <div className="text-[10px] text-slate-400">Hegemonia histórica em complexos e favelas</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-400/30"></span>
                      <div>
                        <div className="text-slate-200 font-semibold">Terceiro Comando Puro (TCP)</div>
                        <div className="text-[10px] text-slate-400">Complexo de Israel, Maré e Senador Camará</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-600 ring-2 ring-purple-400/30"></span>
                      <div>
                        <div className="text-slate-200 font-semibold">Milícia Paramilitar</div>
                        <div className="text-[10px] text-slate-400">Extorsão, Curicica, Muzema e Zona Oeste</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-400/30"></span>
                      <div>
                        <div className="text-slate-200 font-semibold">Área em Disputa Bélica</div>
                        <div className="text-[10px] text-slate-400">Praça Seca, Gardênia Azul e divisas</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-400/30"></span>
                      <div>
                        <div className="text-slate-200 font-semibold">Sem Domínio / Controle Institucional</div>
                        <div className="text-[10px] text-slate-400">Áreas comerciais e centros urbanos regulares</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                  <strong>Fontes Documentais Homologadas:</strong> Observatório de Segurança GENI-UFF, Instituto Fogo Cruzado, Ministério Público do Rio de Janeiro (GAECO) e Instituto de Segurança Pública (ISP-RJ).
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
