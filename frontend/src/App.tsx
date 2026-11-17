import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { LicenseModal } from './components/LicenseModal';
import { CompanyRegisterModal } from './components/CompanyRegisterModal';
import { NavigationDrawer } from './components/NavigationDrawer';
import { AdminDashboardView } from './components/AdminDashboardView';
import { CompanyAdminView } from './components/CompanyAdminView';
import { CorporateIncidentModal } from './components/CorporateIncidentModal';
import { AuthGateModal } from './components/AuthGateModal';
import { useAuth } from './contexts/AuthContext';
import { CorporateCompany, CorporatePackageIncident } from './types/admin';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from './firebase';
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
  X,
  MessageCircle,
  Crown,
  ShieldCheck,
  Award
} from 'lucide-react';

function App() {
  const { userProfile, hasFullAccess, isAdmin, isCompanyAdmin, openAuthModal, logLocationAccess } = useAuth();
  const [registry, setRegistry] = useState<TerritorialRegistry | null>(null);
  const [estadoScope, setEstadoScope] = useState<EstadoScope>('RJ');
  const [activeTab, setActiveTab] = useState<MainActiveTab>('map');
  const [companyAdminDomainOverride, setCompanyAdminDomainOverride] = useState<string>('');
  const [showImporter, setShowImporter] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showCompanyRegisterModal, setShowCompanyRegisterModal] = useState(false);

  // Corporate Incidents & Heatmap State (Strict Multi-tenant by domain)
  const [companyIncidents, setCompanyIncidents] = useState<CorporatePackageIncident[]>([]);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedCorporateIncident, setSelectedCorporateIncident] = useState<CorporatePackageIncident | null>(null);
  const [incidentInitialCoords, setIncidentInitialCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [availableCompanies, setAvailableCompanies] = useState<CorporateCompany[]>([]);

  // Sincronizar lista de empresas corporativas cadastradas
  useEffect(() => {
    if (!hasFullAccess) return;
    const unsub = onSnapshot(
      collection(db, 'corporate_companies'),
      snap => {
        const list = snap.docs.map(d => d.data() as CorporateCompany);
        setAvailableCompanies(list);
      },
      err => {
        console.warn('Não foi possível carregar corporate_companies:', err);
      }
    );
    return () => unsub();
  }, [hasFullAccess]);

  const PUBLIC_EMAIL_DOMAINS = useMemo(
    () => [
      'gmail.com',
      'googlemail.com',
      'hotmail.com',
      'outlook.com',
      'live.com',
      'yahoo.com',
      'yahoo.com.br',
      'bol.com.br',
      'uol.com.br',
      'icloud.com',
      'me.com',
      'msn.com'
    ],
    []
  );

  const effectiveCompanyDomain = useMemo(() => {
    // 1. Override explícito de domínio (selecionado no Painel Empresa ou criado)
    if (companyAdminDomainOverride) {
      return companyAdminDomainOverride.toLowerCase().trim();
    }
    // 2. Se o usuário tem companyDomain corporativo no perfil
    const userCompDomain = (userProfile?.companyDomain || '').toLowerCase().trim();
    if (userCompDomain && !PUBLIC_EMAIL_DOMAINS.includes(userCompDomain)) {
      return userCompDomain;
    }
    // 3. Se for administrador e houver empresas cadastradas no sistema
    if (isAdmin && availableCompanies.length > 0) {
      const activeFirst = availableCompanies.find(c => c.active) || availableCompanies[0];
      return activeFirst.domain.toLowerCase().trim();
    }
    // 4. Se o e-mail do usuário tem domínio corporativo próprio
    const userEmailDomain = (userProfile?.domain || '').toLowerCase().trim();
    if (userEmailDomain && !PUBLIC_EMAIL_DOMAINS.includes(userEmailDomain)) {
      return userEmailDomain;
    }
    // 5. Fallback para empresas cadastradas disponíveis
    if (availableCompanies.length > 0) {
      return availableCompanies[0].domain.toLowerCase().trim();
    }
    return userCompDomain || userEmailDomain || '';
  }, [companyAdminDomainOverride, userProfile?.companyDomain, userProfile?.domain, isAdmin, availableCompanies, PUBLIC_EMAIL_DOMAINS]);

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
  const [isNavigationOpen, setIsNavigationOpen] = useState<boolean>(false);

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
    mgEs: true,
    corporateHeatmap: true,
    corporateIncidents: true
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
      setIsNavigationOpen(false);
    }
  }, [isDossierOpen]);

  useEffect(() => {
    if (!hasFullAccess) {
      setIsDossierOpen(false);
      setSelectedData(null);
      setSelectedCispId(null);
      setSelectedCommunityName(null);
      setSelectedUf(null);
      setShowImporter(false);
      if (activeTab !== 'map' && activeTab !== 'about') {
        setActiveTab('map');
      }
    }
  }, [hasFullAccess, activeTab]);

  const requireApprovedAccess = (reason: string, action: () => void) => {
    if (hasFullAccess) {
      action();
      return;
    }
    openAuthModal(reason, action);
  };

  // Load main territorial registry JSON from repository's /data/territorial_registry.json
  useEffect(() => {
    fetch('/data/territorial_registry.json')
      .then(res => res.json())
      .then((data: TerritorialRegistry) => {
        setRegistry(data);
      })
      .catch(err => console.error('Erro ao carregar registro territorial:', err));
  }, []);

  // Listen to Corporate Incidents in real-time (Strictly isolated by companyDomain)
  useEffect(() => {
    if (!effectiveCompanyDomain || !hasFullAccess) {
      setCompanyIncidents([]);
      return;
    }

    const colRef = collection(db, 'corporate_companies', effectiveCompanyDomain, 'incidents');

    const unsub = onSnapshot(
      colRef,
      snapshot => {
        const list = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as CorporatePackageIncident));

        // Ordenação segura em memória por data decrescente (não exige composite index no Firestore)
        list.sort((a, b) => {
          const tA = (a.createdAt as any)?.toMillis
            ? (a.createdAt as any).toMillis()
            : a.createdAt
            ? new Date(a.createdAt as any).getTime()
            : 0;
          const tB = (b.createdAt as any)?.toMillis
            ? (b.createdAt as any).toMillis()
            : b.createdAt
            ? new Date(b.createdAt as any).getTime()
            : 0;
          return tB - tA;
        });

        setCompanyIncidents(list);
      },
      error => {
        console.warn('Ocorrências corporativas não carregadas ou sem permissão:', error);
        setCompanyIncidents([]);
      }
    );

    return () => unsub();
  }, [effectiveCompanyDomain, hasFullAccess]);

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

    requireApprovedAccess(
      `Para visualizar o dossiê completo da ${cispId}ª DP e seus indicadores, entre ou crie sua conta.`,
      () => {
        setSelectedCispId(cispId);
        setSelectedCommunityName(null);
        setSelectedUf(null);
        const rec = registry?.cisps[cispId];
        if (rec) {
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
        logLocationAccess({
          targetType: 'CISP',
          targetName: rec?.nome_oficial || `${cispId}ª DP`,
          uf: 'RJ',
          municipio: rec?.municipio || '',
          cisp: cispId
        });
      }
    );
  };

  // Select a Dados de Riscos community from Header Search
  const handleSelectCommunity = (entry: FaccaoSearchEntry) => {
    requireApprovedAccess(
      `Para consultar os dados territoriais de "${entry.nome}", entre ou crie sua conta.`,
      () => {
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
        logLocationAccess({
          targetType: 'FACCAO_COMUNIDADE',
          targetName: `${entry.nome} (${meta.shortLabel})`,
          uf: 'RJ',
          municipio: rec?.municipio || 'Rio de Janeiro',
          cisp: rec?.cisp || cispNum || 0
        });
      }
    );
  };

  const handleSelectUf = (ufInfo: UfMetadataInfo) => {
    requireApprovedAccess(
      `Para consultar o panorama territorial de ${ufInfo.nome} (${ufInfo.uf}), entre ou crie sua conta.`,
      () => {
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
        logLocationAccess({
          targetType: 'ESTADO_UF',
          targetName: `${ufInfo.nome} (${ufInfo.uf})`,
          uf: ufInfo.uf,
          municipio: ufInfo.capital
        });
      }
    );
  };

  const selectedDelegaciaMgEsId =
    selectedData?.tipo === 'DELEGACIA_MG_ES' ? String(selectedData.id) : null;

  const handleSelectDelegaciaMgEs = (del: DelegaciaTerritorialMgEs) => {
    if (selectedDelegaciaMgEsId === del.id) {
      setSelectedCispId(null);
      setSelectedCommunityName(null);
      setSelectedUf(null);
      setSelectedData(null);
      setIsDossierOpen(false);
      handleResetView();
      return;
    }

    requireApprovedAccess(
      `Para consultar o dossiê da unidade ${del.nomeCurto} (${del.uf}), entre ou crie sua conta.`,
      () => {
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
        logLocationAccess({
          targetType: 'DELEGACIA_MG_ES',
          targetName: del.nome,
          uf: del.uf,
          municipio: del.municipio
        });
      }
    );
  };

  // Select a free OSM geocoded address, zoom straight to it, and cross-check CISP + Faction polygon
  const handleSelectAddress = (addr: AddressSearchResult) => {
    requireApprovedAccess(
      `Para verificar a delegacia responsável e áreas de risco para "${addr.shortTitle}", entre ou crie sua conta.`,
      () => {
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

        logLocationAccess({
          targetType: 'ENDERECO',
          targetName: addr.shortTitle,
          uf: estadoScope === 'TODOS' ? 'BR' : estadoScope,
          municipio: rec?.municipio || addr.subtitle || '',
          cisp: rec?.cisp || cispNum || 0
        });
      }
    );
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
    <div className="flex flex-col h-[100dvh] w-screen bg-[#F5F5F5] text-slate-900 overflow-hidden font-sans">
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={tab => {
          if (tab === 'map' || tab === 'about') {
            setActiveTab(tab);
            return;
          }
          if (tab === 'admin') {
            if (isAdmin) setActiveTab('admin');
            return;
          }
          if (tab === 'company_admin') {
            if (isCompanyAdmin || isAdmin) setActiveTab('company_admin');
            return;
          }
          if (tab === 'import') {
            requireApprovedAccess(
              'Para importar ou exportar dados territoriais, entre ou crie sua conta.',
              () => setShowImporter(true)
            );
            return;
          }
          requireApprovedAccess(
            'Para acessar este painel de inteligência territorial, entre ou crie sua conta.',
            () => setActiveTab(tab)
          );
        }}
        estadoScope={estadoScope}
        setEstadoScope={sc => {
          setEstadoScope(sc);
          setActiveTab('map');
        }}
        onOpenLicense={() => setShowLicenseModal(true)}
        onOpenCompanyRegister={() => setShowCompanyRegisterModal(true)}
        onOpenNavigation={() => setIsNavigationOpen(true)}
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
              selectedDelegaciaMgEsId={selectedDelegaciaMgEsId}
              onResetView={handleResetView}
              choroplethMetric={choroplethMetric}
              setChoroplethMetric={setChoroplethMetric}
              layerOpacity={layerOpacity}
              setLayerOpacity={setLayerOpacity}
              activeSection={sidebarSection}
              companyDomain={effectiveCompanyDomain}
              totalCompanyIncidents={companyIncidents.length}
              totalCompanyRoubos={companyIncidents.filter(i => i.incidentType === 'roubo_carga' || i.incidentType === 'roubo' || i.incidentType === 'furto').length}
              onOpenIncidentModal={() => {
                setIncidentInitialCoords(undefined);
                setSelectedCorporateIncident(null);
                setIsIncidentModalOpen(true);
              }}
              onOpenNavigation={() => setIsNavigationOpen(true)}
              onActiveSectionChange={next => {
                setSidebarSection(next);
                if (next) {
                  setIsFactionPanelOpen(false);
                  setIsNavigationOpen(false);
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
                selectedDelegaciaMgEsId={selectedDelegaciaMgEsId}
                canViewDetails={hasFullAccess}
                companyIncidents={companyIncidents}
                companyDomain={effectiveCompanyDomain}
                onSelectCorporateIncident={inc => {
                  setSelectedCorporateIncident(inc);
                  setIncidentInitialCoords(undefined);
                  setIsIncidentModalOpen(true);
                }}
                onRequestRegisterIncident={coords => {
                  setIncidentInitialCoords(coords);
                  setSelectedCorporateIncident(null);
                  setIsIncidentModalOpen(true);
                }}
                onSelectFeature={feat => {
                  if (!feat) {
                    setSelectedCispId(null);
                    setSelectedCommunityName(null);
                    setSelectedUf(null);
                    setSelectedData(null);
                    setIsDossierOpen(false);
                    return;
                  }

                  // Clique em ocorrência corporativa -> abre modal com histórico completo
                  if (feat.tipo === 'CORPORATE_INCIDENT') {
                    if (feat.corporateIncident) {
                      setSelectedCorporateIncident(feat.corporateIncident);
                    } else {
                      const found = companyIncidents.find(i => String(i.id) === String(feat.id));
                      setSelectedCorporateIncident(found || null);
                    }
                    setIncidentInitialCoords(undefined);
                    setIsIncidentModalOpen(true);
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

                  const targetLabel =
                    feat.tipo === 'CISP' || feat.tipo === 'DELEGACIA'
                      ? `${feat.cisp ? `${feat.cisp}ª DP` : feat.nome}`
                      : feat.nome;

                  requireApprovedAccess(
                    `Para consultar os detalhes de "${targetLabel}", entre ou crie sua conta.`,
                    () => {
                      if (feat.tipo === 'DELEGACIA_MG_ES') {
                        setSelectedCispId(null);
                        setSelectedCommunityName(null);
                        setSelectedUf(null);
                        setSelectedData(feat);
                        setIsDossierOpen(true);
                        logLocationAccess({
                          targetType: 'DELEGACIA_MG_ES',
                          targetName: feat.nome,
                          uf: feat.delegaciaMgEs?.uf || estadoScope,
                          municipio: feat.municipio || ''
                        });
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
                        logLocationAccess({
                          targetType: feat.tipo,
                          targetName: feat.tipo === 'FACCAO_COMUNIDADE' ? feat.nome : rec.nome_oficial || feat.nome,
                          uf: feat.ufInfo?.uf || 'RJ',
                          municipio: rec.municipio || feat.municipio || '',
                          cisp: cispId
                        });
                      } else {
                        setSelectedData(feat);
                        if (feat.cisp) setSelectedCispId(feat.cisp);
                        logLocationAccess({
                          targetType: feat.tipo,
                          targetName: feat.nome,
                          uf: feat.ufInfo?.uf || (estadoScope === 'TODOS' ? 'BR' : estadoScope),
                          municipio: feat.municipio || '',
                          cisp: feat.cisp || 0
                        });
                      }
                      setIsDossierOpen(true);
                    }
                  );
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
                <div className="pointer-events-auto bg-white/95 border border-slate-200 rounded-2xl px-2.5 py-1.5 md:px-3.5 shadow-lg backdrop-blur-md flex items-center gap-1.5 md:gap-2 text-xs max-w-full overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1.5 text-[#2D3277] font-bold pr-1.5 md:pr-2 border-r border-slate-200 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#3483FA]" />
                    <span className="hidden sm:inline">Ano ISP:</span>
                  </div>

                  <button
                    onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                    title={isPlayingTimeline ? 'Pausar Linha do Tempo' : 'Reproduzir Evolução Temporal'}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                      isPlayingTimeline
                        ? 'bg-[#FFE600] text-[#2D3277] border-[#E6CF00] animate-pulse'
                        : 'bg-slate-100 hover:bg-slate-200 text-[#2D3277] border-slate-200'
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
                            ? 'bg-[#3483FA] text-white shadow-sm'
                            : 'text-slate-600 hover:text-[#2D3277] hover:bg-slate-100'
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
                    className={`hidden md:flex px-3 py-1.5 rounded-2xl border text-xs font-semibold items-center gap-2 shadow-lg backdrop-blur-md transition-all cursor-pointer whitespace-nowrap ${
                      isFactionPanelOpen
                        ? 'bg-red-600 border-red-700 text-white shadow-sm'
                        : 'bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-800 hover:text-[#2D3277]'
                    }`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${isFactionPanelOpen ? 'text-white' : 'text-red-600'}`} />
                    <span>Facções (1.695)</span>
                  </button>

                  {isFactionPanelOpen && (
                    <>
                      <div
                        onClick={() => setIsFactionPanelOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 md:hidden"
                      />
                      <div className="fixed inset-x-0 bottom-14 z-40 rounded-t-3xl border-t border-slate-200 bg-white p-4 shadow-2xl space-y-2.5 text-xs md:absolute md:inset-x-auto md:bottom-full md:right-0 md:mb-2 md:w-80 md:rounded-2xl md:border md:border-slate-200 md:p-3.5">
                        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-1 md:hidden" />
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-red-600" />
                            <span>Dados de Riscos (ago/2026)</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">1.695 polígonos</span>
                        </div>

                        <div className="space-y-1.5 max-h-[45dvh] overflow-y-auto">
                          {FAC_ORDER.map(code => {
                            const meta = FAC_CATALOG[code];
                            const isOn = visiblePreciseFactions[code];
                            return (
                              <label
                                key={code}
                                className={`flex items-center justify-between p-2 md:p-1.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer transition-opacity ${
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
                                    className="rounded border-slate-300 text-[#3483FA] focus:ring-0"
                                  />
                                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: meta.color }} />
                                  <span className="font-medium text-slate-800 truncate">{meta.label}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-600 tabular-nums shrink-0">
                                  {FACCAO_COUNTS[code]}
                                </span>
                              </label>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                          <span>Fonte: Dados de Riscos · GENI-UFF</span>
                          <button
                            onClick={() => setIsFactionPanelOpen(false)}
                            className="text-[#3483FA] hover:text-[#2968C8] font-semibold cursor-pointer py-1 px-2"
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
                  className="absolute bottom-14 right-3 md:bottom-auto md:top-4 md:right-14 z-20 max-w-[calc(100vw-1.5rem)] px-3.5 py-2 rounded-xl bg-white/95 hover:bg-[#FFE600] text-[#2D3277] border border-slate-200 hover:border-[#E6CF00] shadow-lg flex items-center gap-2 text-xs font-bold backdrop-blur-md transition-all cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-[#3483FA] shrink-0" />
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
          <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
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

        {activeTab === 'about' && <AboutMethodologyView onOpenLicense={() => setShowLicenseModal(true)} />}

        {activeTab === 'admin' && isAdmin && (
          <AdminDashboardView
            onOpenCompanyPanel={domain => {
              setCompanyAdminDomainOverride(domain);
              setActiveTab('company_admin');
            }}
            onOpenCompanyRegister={() => setShowCompanyRegisterModal(true)}
          />
        )}

        {activeTab === 'company_admin' && (isCompanyAdmin || isAdmin) && (
          <CompanyAdminView
            registry={registry}
            overrideDomain={companyAdminDomainOverride}
            onSelectOverrideDomain={setCompanyAdminDomainOverride}
            onGoToAdminCompanies={() => setActiveTab('admin')}
            onOpenCompanyRegister={() => setShowCompanyRegisterModal(true)}
            onOpenIncidentModal={inc => {
              setSelectedCorporateIncident(inc || null);
              setIncidentInitialCoords(undefined);
              setIsIncidentModalOpen(true);
            }}
            onLocateOnMap={(lat, lng) => {
              setActiveTab('map');
              setFocusTarget({ lat, lng, zoom: 16, ts: Date.now() });
            }}
          />
        )}
      </main>

      {/* Mobile Thumb-Zone Bottom Tab Bar (< 768px) */}
      <nav className="md:hidden h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center z-40 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => {
            setActiveTab('map');
            setSidebarSection(null);
            setIsFactionPanelOpen(false);
            setIsNavigationOpen(false);
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            activeTab === 'map' && !sidebarSection && !isFactionPanelOpen && !isNavigationOpen
              ? 'text-[#3483FA]'
              : 'text-slate-500 hover:text-[#2D3277]'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Mapa</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('map');
            setIsFactionPanelOpen(false);
            setIsNavigationOpen(false);
            setSidebarSection(prev => (prev ? null : 'layers'));
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            activeTab === 'map' && sidebarSection !== null
              ? 'text-[#2D3277]'
              : 'text-slate-500 hover:text-[#2D3277]'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Camadas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('map');
            setSidebarSection(null);
            setIsNavigationOpen(false);
            setIsFactionPanelOpen(prev => !prev);
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            activeTab === 'map' && isFactionPanelOpen
              ? 'text-red-600'
              : 'text-slate-500 hover:text-[#2D3277]'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Facções</span>
        </button>

        <button
          onClick={() => {
            setSidebarSection(null);
            setIsFactionPanelOpen(false);
            setIsNavigationOpen(false);
            requireApprovedAccess(
              'Para acessar a Base SIG MG·ES, entre ou crie sua conta.',
              () => setActiveTab('sig_mges')
            );
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            activeTab === 'sig_mges'
              ? 'text-[#00A650]'
              : 'text-slate-500 hover:text-[#2D3277]'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">SIG MG·ES</span>
        </button>

        <button
          onClick={() => {
            setSidebarSection(null);
            setIsFactionPanelOpen(false);
            setIsNavigationOpen(prev => !prev);
          }}
          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${
            isNavigationOpen ||
            activeTab === 'stats' ||
            activeTab === 'audit' ||
            activeTab === 'about' ||
            activeTab === 'admin' ||
            activeTab === 'company_admin'
              ? 'text-[#3483FA]'
              : 'text-slate-500 hover:text-[#2D3277]'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Menu</span>
        </button>
      </nav>

      {/* Global Footer — Agência Ícone Digital by Vinicius Cirne & Licença Vinculada */}
      <footer className="bg-white border-t border-slate-200 px-3 md:px-4 py-1.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 text-[10px] md:text-[11px] text-slate-600 shrink-0 z-30 print:hidden shadow-xs select-none">
        <div className="flex items-center gap-2 truncate">
          <span className="hidden md:inline font-semibold text-[#2D3277]">
            Monitoramento Territorial
          </span>
          <span className="hidden md:inline text-slate-300">•</span>
          <span className="truncate">
            © 2026 <strong className="text-[#2D3277] font-bold">Agência Ícone Digital</strong> by <strong className="text-[#3483FA] font-bold">Vinicius Cirne</strong>
          </span>
          <span className="hidden lg:inline text-slate-300">•</span>
          <span className="hidden lg:inline text-slate-500">Todos os direitos reservados</span>
        </div>

        <div className="flex items-center justify-end gap-2 md:gap-3 shrink-0 ml-auto">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00A650]/10 border border-[#00A650]/30 text-[#008744] text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span className="hidden sm:inline">Licença Vinculada</span>
          </div>

          <button
            type="button"
            onClick={() => setShowLicenseModal(true)}
            className="inline-flex items-center gap-1 text-[#2D3277] hover:text-[#3483FA] hover:underline font-semibold transition-colors cursor-pointer text-[10px] md:text-[11px]"
            title="Visualizar Certificado e Termos da Licença Oficial"
          >
            <Award className="w-3.5 h-3.5 text-[#3483FA]" />
            <span>Ver Licença</span>
          </button>

          <a
            href="https://wa.me/5521974976130"
            target="_blank"
            rel="noopener noreferrer"
            title="Conversar via WhatsApp"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00A650]/10 hover:bg-[#00A650]/20 text-[#008744] border border-[#00A650]/25 font-bold transition-colors shrink-0"
          >
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp</span>
          </a>

          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">v2.5.0</span>
        </div>
      </footer>

      {showImporter && <DataImporterModal registry={registry} onClose={() => setShowImporter(false)} />}
      {showPrintModal && <PrintableDossierModal data={selectedData} onClose={() => setShowPrintModal(false)} />}
      {showLicenseModal && <LicenseModal isOpen={showLicenseModal} onClose={() => setShowLicenseModal(false)} />}
      <CompanyRegisterModal
        isOpen={showCompanyRegisterModal}
        onClose={() => setShowCompanyRegisterModal(false)}
        onCompanyCreated={domain => {
          setCompanyAdminDomainOverride(domain);
          setActiveTab('company_admin');
        }}
      />
      {isIncidentModalOpen && (
        <CorporateIncidentModal
          isOpen={isIncidentModalOpen}
          onClose={() => {
            setIsIncidentModalOpen(false);
            setSelectedCorporateIncident(null);
            setIncidentInitialCoords(undefined);
          }}
          companyDomain={effectiveCompanyDomain}
          availableCompanies={availableCompanies}
          onSelectCompanyDomain={domain => setCompanyAdminDomainOverride(domain)}
          existingIncident={selectedCorporateIncident}
          initialCoords={incidentInitialCoords}
          registry={registry}
          onSaved={() => {
            // Real-time snapshot automatically updates companyIncidents
          }}
        />
      )}
      <AuthGateModal
        onOpenAdmin={() => setActiveTab('admin')}
        onOpenCompanyAdmin={() => setActiveTab('company_admin')}
        onOpenCompanyRegister={() => setShowCompanyRegisterModal(true)}
      />

      {/* Menu Lateral Estruturado por Assuntos Relacionados */}
      <NavigationDrawer
        isOpen={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
        activeTab={activeTab}
        onSelectTab={tab => {
          setIsNavigationOpen(false);
          if (tab === 'map' || tab === 'about') {
            setActiveTab(tab);
            return;
          }
          if (tab === 'admin') {
            if (isAdmin) setActiveTab('admin');
            return;
          }
          if (tab === 'company_admin') {
            if (isCompanyAdmin || isAdmin) setActiveTab('company_admin');
            return;
          }
          if (tab === 'import') {
            requireApprovedAccess(
              'Para importar ou exportar dados territoriais, entre ou crie sua conta.',
              () => setShowImporter(true)
            );
            return;
          }
          requireApprovedAccess(
            'Para acessar este painel de inteligência territorial, entre ou crie sua conta.',
            () => setActiveTab(tab)
          );
        }}
        estadoScope={estadoScope}
        setEstadoScope={sc => {
          setEstadoScope(sc);
          setActiveTab('map');
        }}
        onOpenImport={() => {
          setIsNavigationOpen(false);
          requireApprovedAccess(
            'Para importar ou exportar dados territoriais, entre ou crie sua conta.',
            () => setShowImporter(true)
          );
        }}
        onOpenCompanyRegister={() => {
          setIsNavigationOpen(false);
          setShowCompanyRegisterModal(true);
        }}
        onOpenLicense={() => {
          setIsNavigationOpen(false);
          setShowLicenseModal(true);
        }}
      />
    </div>
  );
}

export default App;
