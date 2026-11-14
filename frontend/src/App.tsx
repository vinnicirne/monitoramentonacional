import React, { useState, useEffect, useRef } from 'react';
import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import {
  BasemapType,
  ChoroplethMetric,
  LayerVisibility,
  SelectedFeatureData,
  TerritorialRegistry
} from './types';
import { EstadoScope, DivisaoTerritorialRow, UnidadePolicialRow, RelacionamentoTerritorialRow } from './types/sigBase';
import { Header, MainActiveTab } from './components/Header';
import { LeftSidebar, SidebarSection } from './components/LeftSidebar';
import { MapContainer } from './components/MapContainer';
import { RightDossier } from './components/RightDossier';
import { InconsistencyAuditView } from './components/InconsistencyAuditView';
import { StatisticsRankingView } from './components/StatisticsRankingView';
import { AboutMethodologyView } from './components/AboutMethodologyView';
import { DataImporterModal } from './components/DataImporterModal';
import { PrintableDossierModal } from './components/PrintableDossierModal';
import { SigBaseMgEsPanel } from './components/SigBaseMgEsPanel';
import {
  FAC_CATALOG,
  FAC_ORDER,
  FACCAO_COUNTS,
  CodigoFaccaoPrecisa,
  FaccaoSearchEntry,
  findCispForCoords,
  findFactionAtCoords
} from './data/faccoesPrecisas';
import { AddressSearchResult } from './utils/geocoding';
import { UfMetadataInfo } from './data/brasilEstadosData';
import { DelegaciaTerritorialMgEs } from './types/delegaciaTerritorial';
import {
  INITIAL_DIVISAO_TERRITORIAL,
  INITIAL_UNIDADES_POLICIAIS,
  INITIAL_RELACIONAMENTO_TERRITORIAL
} from './data/mgEsData';
import {
  Shield,
  Play,
  Pause,
  Clock,
  Flame,
  Layers,
  Building2,
  Menu,
  BarChart3,
  AlertTriangle,
  Database,
  Info,
  X
} from 'lucide-react';

function App() {
  const [registry, setRegistry] = useState<TerritorialRegistry | null>(null);
  const [estadoScope, setEstadoScope] = useState<EstadoScope>('RJ');
  const [activeTab, setActiveTab] = useState<MainActiveTab>('map');
  const [showImporter, setShowImporter] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRispFilter, setSelectedRispFilter] = useState<number | 'all'>('all');
  const [selectedMunicipioFilter, setSelectedMunicipioFilter] = useState('');
  const [selectedFactionFilter, setSelectedFactionFilter] = useState('');

  // Precise Dados de Riscos per-faction visibility toggles (1,695 areas)
  const [visiblePreciseFactions, setVisiblePreciseFactions] = useState<Record<CodigoFaccaoPrecisa, boolean>>({
    CV: true,
    TCP: true,
    ADA: true,
    MIL: true,
    LJ: true,
    MNI: true,
    NEU: true
  });

  // Thematic Choropleth, Opacity, Timeline & Factions Panel
  const [choroplethMetric, setChoroplethMetric] = useState<ChoroplethMetric>('none');
  const [layerOpacity, setLayerOpacity] = useState<number>(0.18);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [isFactionPanelOpen, setIsFactionPanelOpen] = useState<boolean>(false);
  const [sidebarSection, setSidebarSection] = useState<SidebarSection | null>(null);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);

  // Map layers and basemap
  const [basemap, setBasemap] = useState<BasemapType>('osm');
  const [layers, setLayers] = useState<LayerVisibility>({
    brasilEstados: true,
    risp: false,
    aisp: false,
    cisp: true,
    faccoesPrecisas: true,
    delegacias: true,
    batalhoes: false,
    focos: false,
    mgEs: true
  });

  // MG & ES SIG Base State
  const [divisaoRows, setDivisaoRows] = useState<DivisaoTerritorialRow[]>(INITIAL_DIVISAO_TERRITORIAL);
  const [unidadeRows, setUnidadeRows] = useState<UnidadePolicialRow[]>(INITIAL_UNIDADES_POLICIAIS);
  const [relacionamentoRows, setRelacionamentoRows] = useState<RelacionamentoTerritorialRow[]>(
    INITIAL_RELACIONAMENTO_TERRITORIAL
  );

  // Selected feature & right dossier panel (starts closed until clicked)
  const [selectedCispId, setSelectedCispId] = useState<number | null>(null);
  const [selectedCommunityName, setSelectedCommunityName] = useState<string | null>(null);
  const [selectedUf, setSelectedUf] = useState<UfMetadataInfo | null>(null);
  const [selectedData, setSelectedData] = useState<SelectedFeatureData | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number; zoom?: number; ts: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<(AddressSearchResult & { ts: number }) | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState<boolean>(false);

  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (isDossierOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarSection(null);
      setIsFactionPanelOpen(false);
      setIsMobileMoreOpen(false);
    }
  }, [isDossierOpen]);

  // Load main territorial registry JSON from repository's /data/territorial_registry.json
  useEffect(() => {
    fetch('/data/territorial_registry.json')
      .then(res => res.json())
      .then((data: TerritorialRegistry) => {
        setRegistry(data);
      })
      .catch(err => console.error('Erro ao carregar registro territorial:', err));
  }, []);

  // Timeline Auto-Play effect
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    const timer = setInterval(() => {
      setSelectedYear(prev => {
        const idx = years.indexOf(prev);
        return years[(idx + 1) % years.length];
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [isPlayingTimeline]);

  // Select a CISP programmatically (toggle: unselect if already active)
  const handleSelectCISP = (cispId: number) => {
    if (selectedCispId === cispId) {
      setSelectedCispId(null);
      setSelectedCommunityName(null);
      setSelectedUf(null);
      setSelectedData(null);
      setIsDossierOpen(false);
      handleResetView();
      return;
    }

    setSelectedCispId(cispId);
    setSelectedCommunityName(null);
    setSelectedUf(null);
    if (registry && registry.cisps[cispId]) {
      const rec = registry.cisps[cispId];
      setSelectedData({
        tipo: 'CISP',
        id: rec.cisp,
        cisp: rec.cisp,
        nome: rec.nome_oficial,
        aisp: rec.aisp,
        risp: rec.risp,
        batalhao: rec.batalhao,
        comando: rec.comando_regional,
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

  // Select a Dados de Riscos community from Header Search
  const handleSelectCommunity = (entry: FaccaoSearchEntry) => {
    const meta = FAC_CATALOG[entry.f];
    const cispNum = findCispForCoords(entry.lng, entry.lat);
    const rec = cispNum && registry ? registry.cisps[cispNum] : undefined;

    setSelectedCommunityName(entry.nome);
    setSelectedUf(null);
    if (cispNum) setSelectedCispId(cispNum);

    setSelectedData({
      tipo: 'FACCAO_COMUNIDADE',
      id: `dr-${entry.nome}`,
      nome: entry.nome,
      faccao: meta.label,
      faccaoCode: entry.f,
      descricao: `Polígono delimitado de "${entry.nome}" (${meta.label}) na circunscrição da ${
        rec?.nome_oficial || (cispNum ? `${cispNum}ª DP` : 'Rio de Janeiro')
      }.`,
      fonte: 'Dados de Riscos · Mapa RJ Risco Facções',
      data_registro: 'Agosto/2026',
      grau_confiabilidade: 'Precisão Poligonal (1.695 áreas)',
      cisp: rec?.cisp || cispNum,
      aisp: rec?.aisp,
      risp: rec?.risp,
      batalhao: rec?.batalhao,
      comando: rec?.comando_regional,
      municipio: rec?.municipio || 'Rio de Janeiro',
      bairros: rec?.bairros || [],
      telefone: rec?.telefone,
      endereco: rec?.endereco,
      marcolegal: rec?.marcolegal,
      areakm2: rec?.areakm2,
      indicadores: rec?.indicadores,
      dinamica_territorial: rec?.dinamica_territorial
    });
    setIsDossierOpen(true);
    setFocusTarget({ lat: entry.lat, lng: entry.lng, zoom: 14.2, ts: Date.now() });
  };

  const handleSelectUf = (ufInfo: UfMetadataInfo) => {
    setSelectedUf(ufInfo);
    setSelectedCispId(null);
    setSelectedCommunityName(null);
    setSelectedData({
      tipo: 'ESTADO_UF',
      id: ufInfo.uf,
      nome: ufInfo.nome,
      ufInfo
    });
    setIsDossierOpen(true);
    setFocusTarget({ lat: ufInfo.lat, lng: ufInfo.lng, zoom: ufInfo.zoom, ts: Date.now() });
  };

  const handleSelectDelegaciaMgEs = (del: DelegaciaTerritorialMgEs) => {
    setSelectedCispId(null);
    setSelectedCommunityName(null);
    setSelectedUf(null);
    setSelectedData({
      tipo: 'DELEGACIA_MG_ES',
      id: del.id,
      nome: del.nome,
      municipio: del.municipio,
      bairros: del.bairros,
      telefone: del.telefone,
      endereco: del.endereco,
      comando: `${del.regional} • ${del.departamentoOuRisp}`,
      delegaciaMgEs: del
    });
    setIsDossierOpen(true);
    setFocusTarget({ lat: del.latitude, lng: del.longitude, zoom: 13.5, ts: Date.now() });
  };

  // Select a free OSM geocoded address, zoom straight to it, and cross-check CISP + Faction polygon
  const handleSelectAddress = (addr: AddressSearchResult) => {
    const ts = Date.now();
    setSelectedAddress({ ...addr, ts });
    setFocusTarget({ lat: addr.lat, lng: addr.lng, zoom: 16.5, ts });

    const facMatch = findFactionAtCoords(addr.lng, addr.lat);
    const cispNum = findCispForCoords(addr.lng, addr.lat);
    const rec = cispNum && registry ? registry.cisps[cispNum] : undefined;

    if (facMatch) {
      setSelectedCommunityName(facMatch.nome);
      if (cispNum) setSelectedCispId(cispNum);
      setSelectedData({
        tipo: 'FACCAO_COMUNIDADE',
        id: `addr-${ts}`,
        nome: `${addr.shortTitle} (${facMatch.nome})`,
        faccao: facMatch.label,
        faccaoCode: facMatch.code,
        descricao: `Endereço pesquisado (${addr.displayName}) localizado dentro da área "${facMatch.nome}" (${facMatch.label}), na circunscrição da ${
          rec?.nome_oficial || (cispNum ? `${cispNum}ª DP` : 'Rio de Janeiro')
        }.`,
        fonte: 'OpenStreetMap Nominatim + Dados de Riscos (ago/2026)',
        data_registro: 'Agosto/2026',
        grau_confiabilidade: 'Geocodificação OSM + Polígono Direto',
        cisp: rec?.cisp || cispNum,
        aisp: rec?.aisp,
        risp: rec?.risp,
        batalhao: rec?.batalhao,
        comando: rec?.comando_regional,
        municipio: rec?.municipio || 'Rio de Janeiro',
        bairros: rec?.bairros || [],
        telefone: rec?.telefone,
        endereco: addr.displayName,
        marcolegal: rec?.marcolegal,
        areakm2: rec?.areakm2,
        indicadores: rec?.indicadores,
        dinamica_territorial: rec?.dinamica_territorial
      });
      setIsDossierOpen(true);
    } else if (rec) {
      setSelectedCommunityName(null);
      setSelectedCispId(rec.cisp);
      setSelectedData({
        tipo: 'CISP',
        id: rec.cisp,
        cisp: rec.cisp,
        nome: rec.nome_oficial,
        aisp: rec.aisp,
        risp: rec.risp,
        batalhao: rec.batalhao,
        comando: rec.comando_regional,
        municipio: rec.municipio,
        bairros: rec.bairros,
        telefone: rec.telefone,
        endereco: addr.displayName,
        marcolegal: rec.marcolegal,
        areakm2: rec.areakm2,
        indicadores: rec.indicadores,
        dinamica_territorial: rec.dinamica_territorial
      });
      setIsDossierOpen(true);
    }
  };

  // Reset Map View for current scope
  const handleResetView = () => {
    if (!mapRef.current) return;
    const view = mapRef.current.getView();
    if (estadoScope === 'TODOS') {
      view.animate({ center: fromLonLat([-43.3, -20.4]), zoom: 6.3, duration: 700 });
    } else if (estadoScope === 'MG') {
      view.animate({ center: fromLonLat([-44.38, -18.8]), zoom: 6.4, duration: 700 });
    } else if (estadoScope === 'ES') {
      view.animate({ center: fromLonLat([-40.45, -19.85]), zoom: 7.7, duration: 700 });
    } else if (estadoScope === 'MG_ES') {
      view.animate({ center: fromLonLat([-42.8, -19.2]), zoom: 6.2, duration: 700 });
    } else {
      view.animate({ center: fromLonLat([-43.28, -22.86]), zoom: 10.3, duration: 700 });
    }
  };

  const handleCenterOnSelected = () => {
    if (!selectedData || !mapRef.current) return;
    if (selectedData.delegaciaMgEs) {
      mapRef.current.getView().animate({
        center: fromLonLat([selectedData.delegaciaMgEs.longitude, selectedData.delegaciaMgEs.latitude]),
        zoom: 13.2,
        duration: 700
      });
      return;
    }
    if (selectedData.cisp && registry?.cisps[selectedData.cisp]?.centroide) {
      const coord = registry.cisps[selectedData.cisp].centroide;
      mapRef.current.getView().animate({
        center: fromLonLat(coord),
        zoom: 13,
        duration: 700
      });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={tab => {
          if (tab === 'import') {
            setShowImporter(true);
          } else {
            setActiveTab(tab);
          }
        }}
        estadoScope={estadoScope}
        setEstadoScope={sc => {
          setEstadoScope(sc);
          setActiveTab('map');
        }}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        {activeTab === 'map' && (
          <div className="flex-1 flex w-full h-full overflow-hidden relative">
            {/* Left: Slim Vertical Rail (Desktop) + Responsive Bottom Sheet / Flyout Drawer */}
            <LeftSidebar
              registry={registry}
              estadoScope={estadoScope}
              setEstadoScope={setEstadoScope}
              onSelectUf={handleSelectUf}
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
              visiblePreciseFactions={visiblePreciseFactions}
              setVisiblePreciseFactions={setVisiblePreciseFactions}
              onSelectCISP={handleSelectCISP}
              selectedCispId={selectedCispId}
              onSelectDelegaciaMgEs={handleSelectDelegaciaMgEs}
              onResetView={handleResetView}
              choroplethMetric={choroplethMetric}
              setChoroplethMetric={setChoroplethMetric}
              layerOpacity={layerOpacity}
              setLayerOpacity={setLayerOpacity}
              activeSection={sidebarSection}
              onActiveSectionChange={next => {
                setSidebarSection(next);
                if (next) {
                  setIsFactionPanelOpen(false);
                  setIsMobileMoreOpen(false);
                }
              }}
            />

            {/* Center: OpenLayers v9.2.4 Map */}
            <div className="flex-1 h-full relative overflow-hidden">
              <MapContainer
                registry={registry}
                estadoScope={estadoScope}
                layers={layers}
                basemap={basemap}
                selectedCispId={selectedCispId}
                selectedCommunityName={selectedCommunityName}
                onSelectFeature={feat => {
                  if (!feat) {
                    setSelectedCispId(null);
                    setSelectedCommunityName(null);
                    setSelectedUf(null);
                    setSelectedData(null);
                    setIsDossierOpen(false);
                    return;
                  }

                  // Toggle se clicar na mesma DP (CISP ou DELEGACIA) já selecionada
                  const cispId = feat.cisp;
                  if (
                    cispId &&
                    selectedCispId === cispId &&
                    (feat.tipo === 'CISP' || feat.tipo === 'DELEGACIA')
                  ) {
                    setSelectedCispId(null);
                    setSelectedCommunityName(null);
                    setSelectedUf(null);
                    setSelectedData(null);
                    setIsDossierOpen(false);
                    handleResetView();
                    return;
                  }

                  // Toggle se clicar na mesma comunidade já selecionada
                  if (feat.tipo === 'FACCAO_COMUNIDADE' && selectedCommunityName === feat.nome) {
                    setSelectedCommunityName(null);
                    setSelectedCispId(null);
                    setSelectedData(null);
                    setIsDossierOpen(false);
                    return;
                  }

                  // Toggle se clicar na mesma Delegacia de MG/ES
                  if (
                    feat.tipo === 'DELEGACIA_MG_ES' &&
                    selectedData?.tipo === 'DELEGACIA_MG_ES' &&
                    selectedData?.id === feat.id
                  ) {
                    setSelectedCispId(null);
                    setSelectedCommunityName(null);
                    setSelectedUf(null);
                    setSelectedData(null);
                    setIsDossierOpen(false);
                    return;
                  }

                  if (feat.tipo === 'DELEGACIA_MG_ES') {
                    setSelectedCispId(null);
                    setSelectedCommunityName(null);
                    setSelectedUf(null);
                    setSelectedData(feat);
                    setIsDossierOpen(true);
                    return;
                  }

                  if (feat.tipo === 'FACCAO_COMUNIDADE') {
                    setSelectedCommunityName(feat.nome);
                  } else {
                    setSelectedCommunityName(null);
                  }
                  if (feat.tipo === 'ESTADO_UF' && feat.ufInfo) {
                    setSelectedUf(feat.ufInfo);
                  } else {
                    setSelectedUf(null);
                  }
                  if (cispId && registry && registry.cisps[cispId]) {
                    const rec = registry.cisps[cispId];
                    setSelectedData({
                      ...feat,
                      nome: feat.tipo === 'FACCAO_COMUNIDADE' ? feat.nome : rec.nome_oficial || feat.nome,
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
                  setIsDossierOpen(true);
                }}
                mapRefOut={mapRef}
                choroplethMetric={choroplethMetric}
                layerOpacity={layerOpacity}
                selectedYear={selectedYear}
                selectedFactionFilter={selectedFactionFilter}
                visiblePreciseFactions={visiblePreciseFactions}
                mgEsDivisao={divisaoRows}
                mgEsUnidades={unidadeRows}
                selectedUf={selectedUf}
                focusTarget={focusTarget}
                selectedAddress={selectedAddress}
                onClearAddress={() => setSelectedAddress(null)}
                isTrackingLocation={isTrackingLocation}
                onToggleLiveLocation={() => setIsTrackingLocation(prev => !prev)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectCISP={handleSelectCISP}
                onSelectCommunity={handleSelectCommunity}
                onSelectAddress={handleSelectAddress}
                onSelectDelegaciaMgEs={handleSelectDelegaciaMgEs}
                onResetView={handleResetView}
              />

              {/* Floating Bottom Command Bar: Timeline ISP + Quadro das Facções */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-20 flex items-center justify-center gap-2 pointer-events-none">
                {/* 1. Timeline ISP Bar */}
                <div className="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl px-2.5 py-1.5 md:px-3.5 shadow-2xl backdrop-blur-md flex items-center gap-1.5 md:gap-2 text-xs max-w-full overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold pr-1.5 md:pr-2 border-r border-slate-800 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Ano ISP:</span>
                  </div>

                  <button
                    onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                    title={isPlayingTimeline ? 'Pausar Linha do Tempo' : 'Reproduzir Evolução Temporal'}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                      isPlayingTimeline
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                      <button
                        key={y}
                        onClick={() => {
                          setSelectedYear(y);
                          setIsPlayingTimeline(false);
                        }}
                        className={`px-2 py-1 md:py-0.5 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer shrink-0 ${
                          selectedYear === y
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                        }`}
                      >
                        <span className="sm:hidden">&apos;{String(y).slice(2)}</span>
                        <span className="hidden sm:inline">{y}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Quadro das Facções (desktop button; mobile uses dedicated bottom tab) */}
                <div className="relative pointer-events-auto">
                  <button
                    onClick={() => setIsFactionPanelOpen(!isFactionPanelOpen)}
                    className={`hidden md:flex px-3 py-1.5 rounded-2xl border text-xs font-semibold items-center gap-2 shadow-2xl backdrop-blur-md transition-all cursor-pointer whitespace-nowrap ${
                      isFactionPanelOpen
                        ? 'bg-red-600/30 border-red-500/70 text-white ring-2 ring-red-500/30'
                        : 'bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    <span>Facções (1.695)</span>
                  </button>

                  {isFactionPanelOpen && (
                    <>
                      <div
                        onClick={() => setIsFactionPanelOpen(false)}
                        className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-30 md:hidden"
                      />
                      <div className="fixed inset-x-0 bottom-14 z-40 rounded-t-3xl border-t border-slate-700 bg-slate-900/98 p-4 shadow-2xl backdrop-blur-md space-y-2.5 text-xs md:absolute md:inset-x-auto md:bottom-full md:right-0 md:mb-2 md:w-80 md:rounded-2xl md:border md:p-3.5">
                        <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-1 md:hidden" />
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-slate-100 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-red-400" />
                            <span>Dados de Riscos (ago/2026)</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">1.695 polígonos</span>
                        </div>

                        <div className="space-y-1.5 max-h-[45dvh] overflow-y-auto">
                          {FAC_ORDER.map(code => {
                            const meta = FAC_CATALOG[code];
                            const isOn = visiblePreciseFactions[code];
                            return (
                              <label
                                key={code}
                                className={`flex items-center justify-between p-2 md:p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer transition-opacity ${
                                  isOn ? 'opacity-100' : 'opacity-45'
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
                                  <span className="font-medium text-slate-200 truncate">{meta.label}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 tabular-nums shrink-0">
                                  {FACCAO_COUNTS[code]}
                                </span>
                              </label>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                          <span>Fonte: Dados de Riscos · GENI-UFF</span>
                          <button
                            onClick={() => setIsFactionPanelOpen(false)}
                            className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer py-1 px-2"
                          >
                            Fechar ▼
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Floating Reopen Dossier pill */}
              {!isDossierOpen && selectedData && (
                <button
                  onClick={() => setIsDossierOpen(true)}
                  className="absolute bottom-14 right-3 md:bottom-auto md:top-4 md:right-14 z-20 max-w-[calc(100vw-1.5rem)] px-3.5 py-2 rounded-xl bg-slate-900/95 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="truncate">Ver Dossiê: {selectedData.nome}</span>
                </button>
              )}
            </div>

            {/* Right: 4-Tab Territorial Dossier */}
            <RightDossier
              data={selectedData}
              isOpen={isDossierOpen}
              onClose={() => setIsDossierOpen(false)}
              onPrintDossier={() => setShowPrintModal(true)}
              onCenterOnMap={handleCenterOnSelected}
              onSelectEstadoScope={sc => setEstadoScope(sc)}
              onOpenImport={() => setShowImporter(true)}
            />
          </div>
        )}

        {activeTab === 'sig_mges' && (
          <div className="flex-1 overflow-y-auto bg-slate-950">
            <SigBaseMgEsPanel
              divisaoRows={divisaoRows}
              setDivisaoRows={setDivisaoRows}
              unidadeRows={unidadeRows}
              setUnidadeRows={setUnidadeRows}
              relacionamentoRows={relacionamentoRows}
              setRelacionamentoRows={setRelacionamentoRows}
              onLocateOnMap={(uf, lat, lng) => {
                setEstadoScope(uf);
                setActiveTab('map');
                if (lat != null && lng != null) {
                  setFocusTarget({ lat, lng, zoom: 11.5, ts: Date.now() });
                }
              }}
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

        {activeTab === 'about' && <AboutMethodologyView />}
      </main>

      {/* Mobile "Mais" Navigation Bottom Sheet */}
      {isMobileMoreOpen && (
        <>
          <div
            onClick={() => setIsMobileMoreOpen(false)}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-30 md:hidden"
          />
          <div className="fixed inset-x-0 bottom-14 z-40 bg-slate-900/98 border-t border-slate-700 rounded-t-3xl p-4 shadow-2xl backdrop-blur-md md:hidden space-y-3">
            <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Módulos & Ferramentas
              </span>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => {
                  setActiveTab('stats');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 font-semibold cursor-pointer ${
                  activeTab === 'stats'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Estatísticas ISP</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('audit');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 font-semibold cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Auditoria</span>
              </button>

              <button
                onClick={() => {
                  setShowImporter(true);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-slate-200 flex items-center gap-2.5 font-semibold cursor-pointer"
              >
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Importar Dados</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('about');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 font-semibold cursor-pointer ${
                  activeTab === 'about'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-200'
                }`}
              >
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Metodologia</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Thumb-Zone Bottom Tab Bar (< 768px) */}
      <nav className="md:hidden h-14 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 items-center z-40 shrink-0">
        <button
          onClick={() => {
            setActiveTab('map');
            setSidebarSection(null);
            setIsFactionPanelOpen(false);
            setIsMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            activeTab === 'map' && !sidebarSection && !isFactionPanelOpen && !isMobileMoreOpen
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Mapa</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('map');
            setIsFactionPanelOpen(false);
            setIsMobileMoreOpen(false);
            setSidebarSection(prev => (prev ? null : 'layers'));
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            activeTab === 'map' && sidebarSection !== null
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Camadas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('map');
            setSidebarSection(null);
            setIsMobileMoreOpen(false);
            setIsFactionPanelOpen(prev => !prev);
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            activeTab === 'map' && isFactionPanelOpen
              ? 'text-red-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Facções</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('sig_mges');
            setSidebarSection(null);
            setIsFactionPanelOpen(false);
            setIsMobileMoreOpen(false);
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            activeTab === 'sig_mges'
              ? 'text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">SIG MG·ES</span>
        </button>

        <button
          onClick={() => {
            setSidebarSection(null);
            setIsFactionPanelOpen(false);
            setIsMobileMoreOpen(prev => !prev);
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            isMobileMoreOpen || activeTab === 'stats' || activeTab === 'audit' || activeTab === 'about'
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Menu</span>
        </button>
      </nav>

      {showImporter && <DataImporterModal registry={registry} onClose={() => setShowImporter(false)} />}
      {showPrintModal && <PrintableDossierModal data={selectedData} onClose={() => setShowPrintModal(false)} />}
    </div>
  );
}

export default App;
