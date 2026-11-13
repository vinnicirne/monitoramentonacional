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
import { Shield, Clock, Play, Pause } from 'lucide-react';

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

              {/* Floating Quick Faction Intelligence Bar (Top Center) */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-xs max-w-[95vw] overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-300 px-2 flex items-center gap-1 shrink-0">
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Facções:</span>
                </span>

                <button
                  onClick={() => {
                    setChoroplethMetric('faccao');
                    setSelectedFactionFilter('');
                  }}
                  className={`px-2.5 py-1 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 ${
                    choroplethMetric === 'faccao' && !selectedFactionFilter
                      ? 'bg-slate-700 text-white font-bold ring-1 ring-slate-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>Todas</span>
                </button>

                <button
                  onClick={() => {
                    setChoroplethMetric('faccao');
                    setSelectedFactionFilter(selectedFactionFilter === 'CV' ? '' : 'CV');
                  }}
                  className={`px-2.5 py-1 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 ${
                    choroplethMetric === 'faccao' && selectedFactionFilter === 'CV'
                      ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/30 ring-1 ring-red-400'
                      : 'text-red-300 hover:bg-red-950/60 hover:text-red-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  <span>CV</span>
                </button>

                <button
                  onClick={() => {
                    setChoroplethMetric('faccao');
                    setSelectedFactionFilter(selectedFactionFilter === 'TCP' ? '' : 'TCP');
                  }}
                  className={`px-2.5 py-1 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 ${
                    choroplethMetric === 'faccao' && selectedFactionFilter === 'TCP'
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                      : 'text-blue-300 hover:bg-blue-950/60 hover:text-blue-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span>TCP</span>
                </button>

                <button
                  onClick={() => {
                    setChoroplethMetric('faccao');
                    setSelectedFactionFilter(selectedFactionFilter === 'Milícia' ? '' : 'Milícia');
                  }}
                  className={`px-2.5 py-1 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 ${
                    choroplethMetric === 'faccao' && selectedFactionFilter === 'Milícia'
                      ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                      : 'text-purple-300 hover:bg-purple-950/60 hover:text-purple-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span>Milícia</span>
                </button>

                <button
                  onClick={() => {
                    setChoroplethMetric('faccao');
                    setSelectedFactionFilter(selectedFactionFilter === 'Disputa' ? '' : 'Disputa');
                  }}
                  className={`px-2.5 py-1 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 ${
                    choroplethMetric === 'faccao' && selectedFactionFilter === 'Disputa'
                      ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30 ring-1 ring-orange-400'
                      : 'text-orange-300 hover:bg-orange-950/60 hover:text-orange-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                  <span>Disputa</span>
                </button>

                <button
                  onClick={() => {
                    setChoroplethMetric('faccao');
                    setSelectedFactionFilter(selectedFactionFilter === 'Controle' ? '' : 'Controle');
                  }}
                  className={`px-2.5 py-1 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 ${
                    choroplethMetric === 'faccao' && selectedFactionFilter === 'Controle'
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                      : 'text-emerald-300 hover:bg-emerald-950/60 hover:text-emerald-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Institucional</span>
                </button>
              </div>

              {/* Floating Interactive Timeline Bar (ISP-RJ 2020 - 2025) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 border border-slate-700/80 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold pr-2 border-r border-slate-800">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Ano ISP:</span>
                </div>

                <button
                  onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                  title={isPlayingTimeline ? "Pausar Linha do Tempo" : "Reproduzir Evolução Temporal"}
                  className={`p-1.5 rounded-lg border transition-all ${
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
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all ${
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
