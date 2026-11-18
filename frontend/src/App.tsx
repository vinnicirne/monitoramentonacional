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
const InconsistencyAuditView = React.lazy(() => import('./components/InconsistencyAuditView').then(module => ({ default: module.InconsistencyAuditView })));
const StatisticsRankingView = React.lazy(() => import('./components/StatisticsRankingView').then(module => ({ default: module.StatisticsRankingView })));
const AboutMethodologyView = React.lazy(() => import('./components/AboutMethodologyView').then(module => ({ default: module.AboutMethodologyView })));
const DataImporterModal = React.lazy(() => import('./components/DataImporterModal').then(module => ({ default: module.DataImporterModal })));
const PrintableDossierModal = React.lazy(() => import('./components/PrintableDossierModal').then(module => ({ default: module.PrintableDossierModal })));
const SigBaseMgEsPanel = React.lazy(() => import('./components/SigBaseMgEsPanel').then(module => ({ default: module.SigBaseMgEsPanel })));
import { LicenseModal } from './components/LicenseModal';
import { CompanyRegisterModal } from './components/CompanyRegisterModal';
import { NavigationDrawer } from './components/NavigationDrawer';
const AdminDashboardView = React.lazy(() => import('./components/AdminDashboardView').then(module => ({ default: module.AdminDashboardView })));
const CompanyAdminView = React.lazy(() => import('./components/CompanyAdminView').then(module => ({ default: module.CompanyAdminView })));
const CorporateIncidentModal = React.lazy(() => import('./components/CorporateIncidentModal').then(module => ({ default: module.CorporateIncidentModal })));
const CorporateIncidentDossier = React.lazy(() => import('./components/CorporateIncidentDossier').then(module => ({ default: module.CorporateIncidentDossier })));
import { AuthGateModal } from './components/AuthGateModal';
import { useAuth } from './contexts/AuthContext';
import { CorporateCompany, CorporatePackageIncident } from './types/admin';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
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

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function App() {
  const { userProfile, hasFullAccess, isAdmin, isCompanyAdmin, openAuthModal, logLocationAccess } = useAuth();
  const canEditCompanyIncidents = Boolean(
    isAdmin || isCompanyAdmin || userProfile?.incidentAccess === 'edit'
  );
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
  const migratingIncidentIdsRef = useRef(new Set<string>());

  // Sincronizar lista de empresas corporativas cadastradas
  useEffect(() => {
    if (!isAdmin) return;
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
  }, [isAdmin]);

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
    if (isAdmin) {
      if (companyAdminDomainOverride) return companyAdminDomainOverride.toLowerCase().trim();
      const activeCompany = availableCompanies.find(company => company.active);
      return activeCompany?.domain.toLowerCase().trim() || '';
    }

    // Non-admins are always scoped to their assigned company. A previous
    // admin override or another company's first record must never set the tenant.
    const assignedDomain = (userProfile?.companyDomain || userProfile?.domain || '')
      .toLowerCase()
      .trim();
    return assignedDomain && !PUBLIC_EMAIL_DOMAINS.includes(assignedDomain)
      ? assignedDomain
      : '';
  }, [companyAdminDomainOverride, userProfile?.companyDomain, userProfile?.domain, isAdmin, availableCompanies, PUBLIC_EMAIL_DOMAINS]);

  const canViewCompanyIncidents = Boolean(
    hasFullAccess &&
      effectiveCompanyDomain &&
      (isAdmin ||
        ((userProfile?.companyDomain || userProfile?.domain || '').toLowerCase().trim() ===
          effectiveCompanyDomain))
  );
  const visibleCompanyIncidents = useMemo(() => {
    if (!canViewCompanyIncidents) return [];
    return companyIncidents.filter(
      incident => incident.companyDomain?.toLowerCase().trim() === effectiveCompanyDomain
    );
  }, [companyIncidents, canViewCompanyIncidents, effectiveCompanyDomain]);

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

  // Thematic Choropleth, Opacity & Factions Panel
  const [choroplethMetric, setChoroplethMetric] = useState<ChoroplethMetric>('none');
  const [layerOpacity, setLayerOpacity] = useState<number>(0.18);
  const [isFactionPanelOpen, setIsFactionPanelOpen] = useState<boolean>(false);
  const [sidebarSection, setSidebarSection] = useState<SidebarSection | null>(null);
  const [isNavigationOpen, setIsNavigationOpen] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.warn('Não foi possível ativar o modo PWA:', error);
      });
    }
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
  };

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

  const openCorporateIncidentDossier = (incident: CorporatePackageIncident) => {
    if (
      !canViewCompanyIncidents ||
      incident.companyDomain?.toLowerCase().trim() !== effectiveCompanyDomain
    ) return;
    setSelectedCorporateIncident(incident);
    setIncidentInitialCoords(undefined);
    setSelectedData(null);
    setSelectedCispId(null);
    setSelectedCommunityName(null);
    setSelectedUf(null);
    setIsIncidentModalOpen(false);
    setIsDossierOpen(true);
  };

  const closeDossier = () => {
    setIsDossierOpen(false);
    setSelectedCorporateIncident(null);
  };

  const centerOnCorporateIncident = () => {
    const lat = Number(selectedCorporateIncident?.lat);
    const lng = Number(selectedCorporateIncident?.lng);
    if (!mapRef.current || !Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return;

    mapRef.current.getView().animate({
      center: fromLonLat([lng, lat]),
      zoom: 15,
      duration: 450
    });
  };

  const editCorporateIncident = () => {
    if (!canEditCompanyIncidents || !selectedCorporateIncident) return;
    setIsDossierOpen(false);
    setIsIncidentModalOpen(true);
  };

  const viewCorporateIncidentFromCompanyPanel = (incident: CorporatePackageIncident) => {
    if (!isAdmin && incident.companyDomain?.toLowerCase().trim() !== effectiveCompanyDomain) return;
    setCompanyAdminDomainOverride(incident.companyDomain);
    setActiveTab('map');
    openCorporateIncidentDossier(incident);
  };

  useEffect(() => {
    if (
      selectedCorporateIncident &&
      (!canViewCompanyIncidents ||
        selectedCorporateIncident.companyDomain?.toLowerCase().trim() !== effectiveCompanyDomain)
    ) {
      setSelectedCorporateIncident(null);
      setIsDossierOpen(false);
      setIsIncidentModalOpen(false);
      setIncidentInitialCoords(undefined);
    }
  }, [selectedCorporateIncident, canViewCompanyIncidents, effectiveCompanyDomain]);

  // Load main territorial registry JSON from repository's /data/territorial_registry.json
  useEffect(() => {
    fetch('/data/territorial_registry.json')
      .then(res => res.json())
      .then((data: TerritorialRegistry) => {
        setRegistry(data);
      })
      .catch(err => console.error('Erro ao carregar registro territorial:', err));
  }, []);

  // Listen to Corporate Incidents in real-time (Strictly isolated by companyDomain with resilient local cache fallback)
  useEffect(() => {
    setCompanyIncidents([]);
    if (!canViewCompanyIncidents) {
      setCompanyIncidents([]);
      return;
    }

    const readLocalIncidents = (domain: string): CorporatePackageIncident[] => {
      try {
        const raw = localStorage.getItem(`PMT_CORP_INCIDENTS_${domain}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const sortIncidentsDesc = (items: CorporatePackageIncident[]) => {
      return [...items].sort((a, b) => {
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
    };

    const colRef = collection(db, 'corporate_companies', effectiveCompanyDomain, 'incidents');

    const unsub = onSnapshot(
      colRef,
      snapshot => {
        const remoteList = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id
        } as CorporatePackageIncident));
        setCompanyIncidents(sortIncidentsDesc(remoteList));

        // Recover legacy browser-only records, but only when they belong to
        // the signed-in user and do not already exist in Firestore.
        const localOnly = readLocalIncidents(effectiveCompanyDomain).filter(item =>
          item.createdByUid === userProfile?.uid &&
          !snapshot.docs.some(remote => remote.id === item.id) &&
          !migratingIncidentIdsRef.current.has(item.id)
        );
        localOnly.forEach(item => {
          migratingIncidentIdsRef.current.add(item.id);
          const cloudRecord = {
            id: item.id,
            companyDomain: effectiveCompanyDomain,
            trackingCode: item.trackingCode,
            carrierName: item.carrierName || '',
            packageQuantity: Number(item.packageQuantity) || 1,
            estimatedUnitValue: Number(item.estimatedUnitValue) || (Number(item.estimatedValue) || 0) / Math.max(1, Number(item.packageQuantity) || 1),
            incidentType: item.incidentType,
            boNumber: item.boNumber || '',
            delegaciaId: item.delegaciaId,
            delegaciaName: item.delegaciaName,
            delegaciaUf: item.delegaciaUf,
            delegaciaMunicipio: item.delegaciaMunicipio || '',
            packageAtStation: Boolean(item.packageAtStation),
            custodyStatus: item.custodyStatus,
            estimatedValue: Number(item.estimatedValue) || 0,
            notes: item.notes || '',
            ...(typeof item.lat === 'number' ? { lat: item.lat } : {}),
            ...(typeof item.lng === 'number' ? { lng: item.lng } : {}),
            ...(item.address ? { address: item.address } : {}),
            ...(item.bairro ? { bairro: item.bairro } : {}),
            history: Array.isArray(item.history) ? item.history : [],
            createdByUid: item.createdByUid,
            createdByName: item.createdByName || 'Usuário',
            // Firestore rules require server timestamps for newly created records.
            // Keep the original local creation time as migration metadata.
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            legacyCreatedAt: String(item.createdAt || '').slice(0, 64)
          };
          setDoc(doc(db, 'corporate_companies', effectiveCompanyDomain, 'incidents', item.id), cloudRecord)
            .catch(error => console.error(`Falha ao recuperar ocorrência local ${item.id} no Firebase:`, error))
            .finally(() => migratingIncidentIdsRef.current.delete(item.id));
        });
      },
      error => {
        console.error('Não foi possível carregar ocorrências do Firebase:', error);
        setCompanyIncidents([]);
      }
    );

    return () => {
      unsub();
    };
  }, [effectiveCompanyDomain, canViewCompanyIncidents, userProfile?.uid]);

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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-2 focus:left-2 focus:bg-white focus:text-[#2D3277] focus:px-4 focus:py-3 focus:rounded-lg">
        Pular para o conteúdo principal
      </a>
      {!isOnline && (
        <div role="status" className="fixed z-[60] bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] left-3 right-3 md:bottom-4 md:left-auto md:right-4 md:w-auto rounded-xl bg-slate-900 text-white px-4 py-3 text-xs shadow-xl">
          Sem conexão. O mapa base, busca e sincronização de ocorrências precisam de internet.
        </div>
      )}
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
        onOpenCompanyRegister={isAdmin ? () => setShowCompanyRegisterModal(true) : undefined}
        onOpenNavigation={() => setIsNavigationOpen(true)}
        isFactionPanelOpen={isFactionPanelOpen}
        onToggleFactions={() => {
          setSidebarSection(null);
          setIsNavigationOpen(false);
          setIsFactionPanelOpen(prev => !prev);
        }}
      />

      {/* Main Workspace */}
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        <React.Suspense fallback={<div className="flex-1 grid place-items-center text-sm text-slate-500" role="status">Carregando painel…</div>}>
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
              totalCompanyIncidents={visibleCompanyIncidents.length}
              totalCompanyRoubos={visibleCompanyIncidents.filter(i => i.incidentType === 'roubo_carga' || i.incidentType === 'roubo' || i.incidentType === 'furto').length}
              onOpenIncidentModal={canEditCompanyIncidents ? () => {
                setIncidentInitialCoords(undefined);
                setSelectedCorporateIncident(null);
                setIsIncidentModalOpen(true);
              } : undefined}
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
                companyIncidents={visibleCompanyIncidents}
                companyDomain={effectiveCompanyDomain}
                onSelectCorporateIncident={openCorporateIncidentDossier}
                onRequestRegisterIncident={canEditCompanyIncidents ? coords => {
                  setIncidentInitialCoords(coords);
                  setSelectedCorporateIncident(null);
                  setIsIncidentModalOpen(true);
                } : undefined}
                onSelectFeature={feat => {
                  if (!feat) {
                    setSelectedCispId(null);
                    setSelectedCommunityName(null);
                    setSelectedUf(null);
                    setSelectedData(null);
                    setIsDossierOpen(false);
                    return;
                  }

                  // Clique em ocorrência corporativa -> abre o dossier com o registro completo
                  if (feat.tipo === 'CORPORATE_INCIDENT') {
                    const incident = feat.corporateIncident || visibleCompanyIncidents.find(i => String(i.id) === String(feat.id));
                    if (incident) openCorporateIncidentDossier(incident);
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

              {/* Floating map controls */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-20 flex items-center justify-center gap-2 pointer-events-none">
                {/* Painel de Facções aberto pelo cabeçalho principal */}
                <div className="relative pointer-events-auto">
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
            {selectedCorporateIncident ? (
              <CorporateIncidentDossier
                incident={selectedCorporateIncident}
                onClose={closeDossier}
                onCenterOnMap={centerOnCorporateIncident}
                onEdit={canEditCompanyIncidents ? editCorporateIncident : undefined}
              />
            ) : (
              <RightDossier
                data={selectedData}
                isOpen={isDossierOpen}
                onClose={closeDossier}
                onPrintDossier={() => setShowPrintModal(true)}
                onCenterOnMap={handleCenterOnSelected}
                onSelectEstadoScope={sc => setEstadoScope(sc)}
                onOpenImport={() => setShowImporter(true)}
              />
            )}
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
            onOpenIncidentModal={inc => {
              setSelectedCorporateIncident(inc || null);
              setIncidentInitialCoords(undefined);
              setIsIncidentModalOpen(true);
            }}
            onViewIncidentDossier={viewCorporateIncidentFromCompanyPanel}
            onLocateOnMap={(lat, lng) => {
              setActiveTab('map');
              setFocusTarget({ lat, lng, zoom: 16, ts: Date.now() });
            }}
          />
        )}
        </React.Suspense>
      </main>

      {/* Mobile Thumb-Zone Bottom Tab Bar (< 768px) */}
      <nav aria-label="Navegação principal" className="md:hidden h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center z-40 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
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
      <footer className="hidden md:flex bg-white border-t border-slate-200 px-3 md:px-4 py-1.5 flex-wrap md:flex-nowrap items-center justify-between gap-2 text-[10px] md:text-[11px] text-slate-600 shrink-0 z-30 print:hidden shadow-xs select-none">
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

      <React.Suspense fallback={null}>
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
          registeredCarrierOptions={Array.from(new Set(companyIncidents.map(incident => incident.carrierName?.trim()).filter((name): name is string => Boolean(name))))}
          onSelectCompanyDomain={domain => setCompanyAdminDomainOverride(domain)}
          existingIncident={selectedCorporateIncident}
          initialCoords={incidentInitialCoords}
          registry={registry}
          onSaved={() => {
            // Real-time snapshot automatically updates companyIncidents
          }}
        />
      )}
      </React.Suspense>
      <AuthGateModal
        onOpenAdmin={() => setActiveTab('admin')}
        onOpenCompanyAdmin={() => setActiveTab('company_admin')}
        onOpenCompanyRegister={isAdmin ? () => setShowCompanyRegisterModal(true) : undefined}
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
          if (isAdmin) {
            setIsNavigationOpen(false);
            setShowCompanyRegisterModal(true);
          }
        }}
        onOpenLicense={() => {
          setIsNavigationOpen(false);
          setShowLicenseModal(true);
        }}
        canInstall={Boolean(installPrompt)}
        onInstall={handleInstallApp}
      />
    </div>
  );
}

export default App;
