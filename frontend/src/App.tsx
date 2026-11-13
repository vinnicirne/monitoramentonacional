import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { MapContainer } from './components/MapContainer';
import { RightDossier } from './components/RightDossier';
import { DataImporterModal } from './components/DataImporterModal';
import { InconsistencyAuditView } from './components/InconsistencyAuditView';
import { StatisticsRankingView } from './components/StatisticsRankingView';
import { AboutMethodologyView } from './components/AboutMethodologyView';
import { PrintableDossierModal } from './components/PrintableDossierModal';
import { 
  BasemapType, 
  ChoroplethMetric,
  LayerVisibility, 
  SelectedFeatureData, 
  TerritorialRegistry 
} from './types';
import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import { Shield, Clock, Play, Pause, ChevronDown, ChevronUp, X } from 'lucide-react';

export function App() {
  const [registry, setRegistry] = useState<TerritorialRegistry | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'import' | 'audit' | 'stats' | 'about'>('map');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 3-Column Map Controls - Default to OpenStreetMap (Clean, 100% Guaranteed Luminous Tiles)
  const [basemap, setBasemap] = useState<BasemapType>('osm');
  const [layers, setLayers] = useState<LayerVisibility>({
    risp: true,
    aisp: true,
    cisp: true,
    delegacias: true,
    batalhoes: true,
    focos: true
  });

  // GIS Analytics - Choropleth & Opacity & Timeline - DEFAULT TO MAPA DAS FACÇÕES
  const [choroplethMetric, setChoroplethMetric] = useState<ChoroplethMetric>('faccao');
  const [layerOpacity, setLayerOpacity] = useState<number>(0.55);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // Filters
  const [selectedRispFilter, setSelectedRispFilter] = useState<number | 'all'>('all');
  const [selectedMunicipioFilter, setSelectedMunicipioFilter] = useState<string>('');
  const [selectedFactionFilter, setSelectedFactionFilter] = useState<string>('');
  const [isFactionPanelOpen, setIsFactionPanelOpen] = useState<boolean>(false);

  // Selected Territory & Dossier state - starts closed until clicked!
  const [selectedCispId, setSelectedCispId] = useState<number | null>(null);
  const [selectedData, setSelectedData] = useState<SelectedFeatureData | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  // Modals
  const [showImporter, setShowImporter] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Map instance ref
  const mapRef = useRef<Map | null>(null);

  // Load Registry JSON
  useEffect(() => {
    fetch('/data/territorial_registry.json')
      .then(res => res.json())
      .then((data: TerritorialRegistry) => {
        setRegistry(data);
      })
      .catch(err => console.error('Erro ao carregar banco territorial:', err));
  }, []);

  // Timeline playback loop
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const interval = setInterval(() => {
      setSelectedYear((prev) => (prev >= 2025 ? 2020 : prev + 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  // When a CISP is chosen by id or search
  const handleSelectCISP = (cispId: number) => {
    setSelectedCispId(cispId);
    if (registry && registry.cisps[cispId]) {
      const rec = registry.cisps[cispId];
      setSelectedData({
        tipo: 'CISP',
        id: cispId,
        cisp: cispId,
        nome: rec.nome_oficial,
        aisp: rec.aisp,
        risp: rec.risp,
        batalhao: rec.batalhao,
        municipio: rec.municipio,
        bairros: rec.bairros,
        telefone: rec.telefone,
        endereco: rec.endereco,
        marcolegal: rec.marcolegal,
        areakm2: rec.areakm2,
        indicadores: rec.indicadores,
        dinamica_territorial: rec.dinamica_territorial
      });
      setIsDossierOpen(true);
    }
  };

  // Reset Map View to state of RJ
  const handleResetView = () => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      view.animate({
        center: fromLonLat([-43.25, -22.75]),
        zoom: 9.3,
        duration: 800
      });
    }
  };

  // Center Map on currently selected item
  const handleCenterOnSelected = () => {
    if (!selectedData || !mapRef.current) return;
    if (selectedData.cisp && registry?.cisps[selectedData.cisp]?.centroide) {
      const coord = registry.cisps[selectedData.cisp].centroide;
      mapRef.current.getView().animate({
        center: fromLonLat(coord),
        zoom: 13,
        duration: 800
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Universal Header */}
      <Header
        registry={registry}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'import') {
            setShowImporter(true);
          } else {
            setActiveTab(tab);
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectCISP={handleSelectCISP}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'map' && (
          <div className="flex-1 flex w-full h-full overflow-hidden relative">
            {/* Left: Menu com trilho de ícones (só abre se tiver a seção clicada) */}
            <LeftSidebar
              registry={registry}
              layers={layers}
              setLayers={setLayers}
              basemap={basemap}
              setBasemap={setBasemap}
              selectedRispFilter={selectedRispFilter}
              setSelectedRispFilter={setSelectedRispFilter}
              selectedMunicipioFilter={selectedMunicipioFilter}
              setSelectedMunicipioFilter={setSelectedMunicipioFilter}
              selectedFactionFilter={selectedFactionFilter}
              setSelectedFactionFilter={setSelectedFactionFilter}
              onSelectCISP={handleSelectCISP}
              selectedCispId={selectedCispId}
              onResetView={handleResetView}
              choroplethMetric={choroplethMetric}
              setChoroplethMetric={setChoroplethMetric}
              layerOpacity={layerOpacity}
              setLayerOpacity={setLayerOpacity}
            />

            {/* Center: OpenLayers v9.2.4 Map com Mapa Real de Alta Resolução */}
            <div className="flex-1 h-full relative overflow-hidden">
              <MapContainer
                registry={registry}
                layers={layers}
                basemap={basemap}
                selectedCispId={selectedCispId}
                onSelectFeature={(feat) => {
                  const cispId = feat.cisp;
                  if (cispId && registry && registry.cisps[cispId]) {
                    const rec = registry.cisps[cispId];
                    setSelectedData({
                      ...feat,
                      nome: rec.nome_oficial || feat.nome,
                      bairros: rec.bairros && rec.bairros.length > 0 ? rec.bairros : feat.bairros,
                      telefone: rec.telefone || feat.telefone,
                      endereco: rec.endereco || feat.endereco,
                      indicadores: rec.indicadores || feat.indicadores,
                      dinamica_territorial: rec.dinamica_territorial || feat.dinamica_territorial
                    });
                    setSelectedCispId(cispId);
                  } else {
                    setSelectedData(feat);
                    if (feat.cisp) setSelectedCispId(feat.cisp);
                  }
                  setIsDossierOpen(true); // Abre a seção do lado direito ao clicar no mapa!
                }}
                mapRefOut={mapRef}
                choroplethMetric={choroplethMetric}
                layerOpacity={layerOpacity}
                selectedYear={selectedYear}
                selectedFactionFilter={selectedFactionFilter}
              />

              {/* Floating Bottom Command Bar: Timeline ISP + Quadro das Facções (Ao lado, abre para cima) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 max-w-[95vw]">
                {/* 1. Timeline ISP Bar */}
                <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl px-3.5 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold pr-2 border-r border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Ano ISP:</span>
                  </div>

                  <button
                    onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                    title={isPlayingTimeline ? "Pausar Linha do Tempo" : "Reproduzir Evolução Temporal"}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isPlayingTimeline
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-1">
                    {[2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          setSelectedYear(y);
                          setIsPlayingTimeline(false);
                        }}
                        className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
                          selectedYear === y
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Quadro das Facções (Ao lado do Ano ISP, abre para CIMA) */}
                <div className="relative">
                  <button
                    onClick={() => setIsFactionPanelOpen(!isFactionPanelOpen)}
                    className={`px-3 py-1.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all cursor-pointer ${
                      isFactionPanelOpen
                        ? 'bg-red-600/30 border-red-500/70 text-white ring-2 ring-red-500/30'
                        : 'bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:text-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <span className="font-bold">Quadro de Facções</span>
                    {isFactionPanelOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Popover que ABRE PARA CIMA */}
                  {isFactionPanelOpen && (
                    <div className="absolute bottom-full mb-3 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-80 sm:w-96 bg-slate-900/98 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl z-30 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
                      {/* Header do Quadro */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-400" />
                          <div>
                            <div className="font-bold text-xs text-slate-100 leading-none">Quadro de Facções & Controle</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Dinâmica Armada do Estado do Rio de Janeiro</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsFactionPanelOpen(false)}
                          title="Fechar quadro"
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Filtros rápidos por Facção */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Filtrar no Mapa:</span>
                          {selectedFactionFilter && (
                            <button
                              onClick={() => setSelectedFactionFilter('')}
                              className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                            >
                              Limpar filtro
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-xs">
                          <button
                            onClick={() => {
                              setChoroplethMetric('faccao');
                              setSelectedFactionFilter('');
                            }}
                            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                              choroplethMetric === 'faccao' && !selectedFactionFilter
                                ? 'bg-slate-700 text-white font-bold border-slate-500 shadow-sm'
                                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span>Todas</span>
                          </button>
                          <button
                            onClick={() => {
                              setChoroplethMetric('faccao');
                              setSelectedFactionFilter(selectedFactionFilter === 'CV' ? '' : 'CV');
                            }}
                            className={`p-1.5 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              selectedFactionFilter === 'CV'
                                ? 'bg-red-600 text-white font-bold border-red-400 shadow-md shadow-red-600/30'
                                : 'bg-slate-800/80 border-slate-700/60 text-red-300 hover:bg-red-950/40 hover:text-red-200'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            <span>CV</span>
                          </button>
                          <button
                            onClick={() => {
                              setChoroplethMetric('faccao');
                              setSelectedFactionFilter(selectedFactionFilter === 'TCP' ? '' : 'TCP');
                            }}
                            className={`p-1.5 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              selectedFactionFilter === 'TCP'
                                ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-md shadow-blue-600/30'
                                : 'bg-slate-800/80 border-slate-700/60 text-blue-300 hover:bg-blue-950/40 hover:text-blue-200'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <span>TCP</span>
                          </button>
                          <button
                            onClick={() => {
                              setChoroplethMetric('faccao');
                              setSelectedFactionFilter(selectedFactionFilter === 'Milícia' ? '' : 'Milícia');
                            }}
                            className={`p-1.5 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              selectedFactionFilter === 'Milícia'
                                ? 'bg-purple-600 text-white font-bold border-purple-400 shadow-md shadow-purple-600/30'
                                : 'bg-slate-800/80 border-slate-700/60 text-purple-300 hover:bg-purple-950/40 hover:text-purple-200'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                            <span>Milícia</span>
                          </button>
                          <button
                            onClick={() => {
                              setChoroplethMetric('faccao');
                              setSelectedFactionFilter(selectedFactionFilter === 'Disputa' ? '' : 'Disputa');
                            }}
                            className={`p-1.5 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              selectedFactionFilter === 'Disputa'
                                ? 'bg-orange-600 text-white font-bold border-orange-400 shadow-md shadow-orange-600/30'
                                : 'bg-slate-800/80 border-slate-700/60 text-orange-300 hover:bg-orange-950/40 hover:text-orange-200'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                            <span>Disputa</span>
                          </button>
                          <button
                            onClick={() => {
                              setChoroplethMetric('faccao');
                              setSelectedFactionFilter(selectedFactionFilter === 'Controle' ? '' : 'Controle');
                            }}
                            className={`p-1.5 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              selectedFactionFilter === 'Controle'
                                ? 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-md shadow-emerald-600/30'
                                : 'bg-slate-800/80 border-slate-700/60 text-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-200'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Instituc.</span>
                          </button>
                        </div>
                      </div>

                      {/* Legenda detalhada de Cores e Classificação */}
                      <div className="space-y-1.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
                        <div className="flex items-center justify-between text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-red-500 border border-red-300 shrink-0" />
                            <span className="font-semibold">Comando Vermelho (CV)</span>
                          </div>
                          <span className="text-[10px] text-red-400 font-mono">Hegemonia</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-blue-500 border border-blue-300 shrink-0" />
                            <span className="font-semibold">Terceiro Comando (TCP)</span>
                          </div>
                          <span className="text-[10px] text-blue-400 font-mono">Fortificado</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-purple-500 border border-purple-300 shrink-0" />
                            <span className="font-semibold">Milícia Paramilitar</span>
                          </div>
                          <span className="text-[10px] text-purple-400 font-mono">Extorsão</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-orange-500 border border-orange-300 shrink-0" />
                            <span className="font-semibold">Área em Disputa Bélica</span>
                          </div>
                          <span className="text-[10px] text-orange-400 font-mono">Conflito</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-300 shrink-0" />
                            <span className="font-semibold">Controle Institucional</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono">Policial</span>
                        </div>
                      </div>

                      {/* Rodapé com fontes */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                        <span>Fontes: GENI-UFF • Fogo Cruzado • MP-RJ</span>
                        <button
                          onClick={() => setIsFactionPanelOpen(false)}
                          className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                        >
                          Fechar ▼
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Reopen Dossier pill if selected and closed */}
              {!isDossierOpen && selectedData && (
                <button
                  onClick={() => setIsDossierOpen(true)}
                  className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-slate-900/95 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all animate-in fade-in duration-150"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Ver Dossiê: {selectedData.nome}</span>
                </button>
              )}
            </div>

            {/* Right: Dossiê Territorial Lateral (só abre quando clicado!) */}
            <RightDossier
              data={selectedData}
              isOpen={isDossierOpen}
              onClose={() => setIsDossierOpen(false)}
              onPrintDossier={() => setShowPrintModal(true)}
              onCenterOnMap={handleCenterOnSelected}
            />
          </div>
        )}

        {activeTab === 'audit' && (
          <InconsistencyAuditView
            registry={registry}
            onSelectCISP={handleSelectCISP}
            onSwitchToMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'stats' && (
          <StatisticsRankingView
            registry={registry}
            onSelectCISP={handleSelectCISP}
            onSwitchToMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'about' && (
          <AboutMethodologyView />
        )}
      </main>

      {/* Data Importer Modal */}
      {showImporter && (
        <DataImporterModal
          registry={registry}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* Printable PDF Dossier Modal */}
      {showPrintModal && (
        <PrintableDossierModal
          data={selectedData}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}

export default App;
