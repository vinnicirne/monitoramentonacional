import React, { useState, useEffect, useRef, useMemo } from 'react';
import type Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import { getSedeDelegacia } from './data/delegaciaSedes';
import type {
  BasemapType,
  ChoroplethMetric,
  LayerVisibility,
  SelectedFeatureData,
  TerritorialRegistry
} from './types';
import type { EstadoScope, DivisaoTerritorialRow, UnidadePolicialRow, RelacionamentoTerritorialRow } from './types/sigBase';
import { useAppNavigation } from './app/useAppNavigation';
import { useRouteAccess } from './app/useRouteAccess';
import { AppLayout } from './app/components/AppLayout';
import { AppRoutes } from './app/components/AppRoutes';
import { AppGlobalDialogs } from './app/components/AppGlobalDialogs';
import type { MainActiveTab } from './app/routes';
import type { SidebarSection } from './components/LeftSidebar';
import { useAuth } from './contexts/AuthContext';
import type { CorporatePackageIncident } from './types/admin';
import { useCorporateCompanyDirectory } from './features/company-admin/hooks/useCorporateCompanyDirectory';
import { useCorporateIncidentFeed } from './features/incidents/hooks/useCorporateIncidentFeed';
import { useTerritorialSelection } from './features/map/hooks/useTerritorialSelection';
import type { CodigoFaccaoPrecisa } from './data/faccoesPrecisas';
import type { AddressSearchResult } from './utils/geocoding';
import type { UfMetadataInfo } from './data/brasilEstadosData';
import {
  INITIAL_DIVISAO_TERRITORIAL,
  INITIAL_UNIDADES_POLICIAIS,
  INITIAL_RELACIONAMENTO_TERRITORIAL
} from './data/mgEsData';

const MapWorkspace = React.lazy(() => import('./features/map/pages/MapWorkspace').then(module => ({ default: module.MapWorkspace })));

const PUBLIC_EMAIL_DOMAINS = new Set([
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
]);

function App() {
  const { firebaseUser, userProfile, hasFullAccess, authLoading, isAdmin, isCompanyAdmin, openAuthModal, logLocationAccess } = useAuth();
  const { activeTab, setActiveTab, location, navigate, route } = useAppNavigation();
  const [registry, setRegistry] = useState<TerritorialRegistry | null>(null);
  const [estadoScope, setEstadoScope] = useState<EstadoScope>('RJ');
  const [companyAdminDomainOverride, setCompanyAdminDomainOverride] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showCompanyRegisterModal, setShowCompanyRegisterModal] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const { companies: availableCompanies, loaded: companyDirectoryLoaded } = useCorporateCompanyDirectory(
    isAdmin && !authLoading && (route?.tab === 'map' || route?.tab === 'company_admin')
  );

  // Corporate Incidents & Heatmap State (Strict Multi-tenant by domain)
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedCorporateIncident, setSelectedCorporateIncident] = useState<CorporatePackageIncident | null>(null);
  const [incidentInitialCoords, setIncidentInitialCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);

  const incidentId = route?.incidentId;
  const requestedCompanyDomain = incidentId && isAdmin
    ? new URLSearchParams(location.search).get('empresa')?.trim().toLowerCase() || ''
    : '';
  const invalidRequestedDomain = requestedCompanyDomain.includes('/') || requestedCompanyDomain === '.' || requestedCompanyDomain === '..';

  const effectiveCompanyDomain = useMemo(() => {
    if (isAdmin) {
      if (invalidRequestedDomain) return '';
      if (requestedCompanyDomain) return requestedCompanyDomain;
      if (companyAdminDomainOverride) return companyAdminDomainOverride.toLowerCase().trim();
      const activeCompany = availableCompanies.find(company => company.active);
      return activeCompany?.domain.toLowerCase().trim() || '';
    }

    // Non-admins are always scoped to their assigned company. A previous
    // admin override or another company's first record must never set the tenant.
    const assignedDomain = (userProfile?.companyDomain || userProfile?.domain || '')
      .toLowerCase()
      .trim();
    return PUBLIC_EMAIL_DOMAINS.has(assignedDomain) ? '' : assignedDomain;
  }, [invalidRequestedDomain, requestedCompanyDomain, companyAdminDomainOverride, userProfile?.companyDomain, userProfile?.domain, isAdmin, availableCompanies]);

  const canViewCompanyIncidents = Boolean(effectiveCompanyDomain) && (
    isAdmin || (hasFullAccess && firebaseUser?.emailVerified && userProfile?.licenseStatus !== 'suspended')
  );
  const canEditCompanyIncidents = canViewCompanyIncidents &&
    (isAdmin || isCompanyAdmin || userProfile?.incidentAccess === 'edit');
  const { incidents: companyIncidents, loaded: companyIncidentsLoaded } = useCorporateIncidentFeed(
    effectiveCompanyDomain,
    canViewCompanyIncidents && !authLoading && route?.tab === 'map',
    userProfile?.uid
  );
  const visibleCompanyIncidents = useMemo(() => {
    if (!canViewCompanyIncidents) return [];
    return companyIncidents.filter(
      incident => incident.companyDomain?.toLowerCase().trim() === effectiveCompanyDomain
    );
  }, [companyIncidents, canViewCompanyIncidents, effectiveCompanyDomain]);

  const { canRenderRoute, showImporter } = useRouteAccess({
    route,
    authLoading,
    signedIn: Boolean(firebaseUser),
    hasFullAccess,
    isAdmin,
    isCompanyAdmin,
    setAccessDeniedMessage,
    openAuthModal
  });

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
  const dossierIncident = incidentId ? visibleCompanyIncidents.find(item => item.id === incidentId) : undefined;
  const isCorporateDossierOpen = Boolean(dossierIncident) && !isIncidentModalOpen;

  useEffect(() => {
    if ((isDossierOpen || isCorporateDossierOpen) && window.innerWidth < 768) {
      setSidebarSection(null);
      setIsFactionPanelOpen(false);
      setIsNavigationOpen(false);
    }
  }, [isDossierOpen, isCorporateDossierOpen]);

  useEffect(() => {
    if (authLoading) return;
    if (!hasFullAccess) {
      setIsDossierOpen(false);
      setSelectedData(null);
      setSelectedCispId(null);
      setSelectedCommunityName(null);
      setSelectedUf(null);
    }
  }, [authLoading, hasFullAccess]);

  const requireApprovedAccess = (reason: string, action: () => void) => {
    if (hasFullAccess) {
      action();
      return;
    }
    openAuthModal(reason, action);
  };

  const handleNavigateToTab = (tab: MainActiveTab) => {
    setAccessDeniedMessage(null);
    if (tab === 'map' || tab === 'about') {
      setActiveTab(tab);
      return;
    }
    if (tab === 'admin') {
      if (isAdmin) setActiveTab(tab);
      return;
    }
    if (tab === 'company_admin') {
      if (isCompanyAdmin || isAdmin) setActiveTab(tab);
      return;
    }
    if (tab === 'sig_mges') {
      requireApprovedAccess(
        'Para acessar a Base SIG MG·ES, entre ou crie sua conta.',
        () => setActiveTab(tab)
      );
      return;
    }
    if (tab === 'import') {
      requireApprovedAccess(
        'Para importar ou exportar dados territoriais, entre ou crie sua conta.',
        () => setActiveTab(tab)
      );
      return;
    }
    requireApprovedAccess(
      'Para acessar este painel de inteligência territorial, entre ou crie sua conta.',
      () => setActiveTab(tab)
    );
  };

  const openCorporateIncidentDossier = (incident: CorporatePackageIncident) => {
    const domain = incident.companyDomain?.trim().toLowerCase();
    if (!hasFullAccess || !domain || (!isAdmin && domain !== effectiveCompanyDomain)) return;

    const incidentPath = `/ocorrencias/${encodeURIComponent(incident.id)}${isAdmin ? `?empresa=${encodeURIComponent(domain)}` : ''}`;
    if (`${location.pathname}${location.search}` !== incidentPath) navigate(incidentPath);
  };

  useEffect(() => {
    if (!incidentId || !canRenderRoute) return;
    if (invalidRequestedDomain || (!canViewCompanyIncidents && (!isAdmin || companyDirectoryLoaded))) {
      navigate('/', { replace: true });
      return;
    }
    if (companyIncidentsLoaded && !dossierIncident) {
      navigate(isAdmin ? '/admin' : isCompanyAdmin ? '/empresa' : '/', { replace: true });
    }
  }, [incidentId, canRenderRoute, invalidRequestedDomain, canViewCompanyIncidents, isAdmin, isCompanyAdmin,
    companyDirectoryLoaded, companyIncidentsLoaded, dossierIncident, navigate]);

  const closeDossier = () => {
    setIsDossierOpen(false);
    setSelectedCorporateIncident(null);
    if (route?.incidentId) navigate('/');
  };

  const centerOnCorporateIncident = () => {
    const lat = Number(dossierIncident?.lat);
    const lng = Number(dossierIncident?.lng);
    if (!mapRef.current || !Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return;

    mapRef.current.getView().animate({
      center: fromLonLat([lng, lat]),
      zoom: 15,
      duration: 450
    });
  };

  const editCorporateIncident = () => {
    if (!canEditCompanyIncidents || !dossierIncident) return;
    setSelectedCorporateIncident(dossierIncident);
    setIncidentInitialCoords(undefined);
    setIsIncidentModalOpen(true);
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

  const selectedDelegaciaMgEsId = selectedData?.tipo === 'DELEGACIA_MG_ES'
    ? String(selectedData.id)
    : null;
  const {
    handleSelectCISP,
    handleSelectCommunity,
    handleSelectUf,
    handleSelectDelegaciaMgEs,
    handleSelectAddress,
    handleSelectFeature
  } = useTerritorialSelection({
    registry,
    estadoScope,
    selectedCispId,
    selectedCommunityName,
    selectedDelegaciaMgEsId,
    setSelectedCispId,
    setSelectedCommunityName,
    setSelectedUf,
    setSelectedData,
    setIsDossierOpen,
    setFocusTarget,
    setSelectedAddress,
    requireApprovedAccess,
    logLocationAccess,
    onResetView: handleResetView
  });

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
    if (selectedData.cisp) {
      const station = selectedData.tipo === 'DELEGACIA' ? getSedeDelegacia(selectedData.cisp)?.coordenadas : undefined;
      const coord = station ?? registry?.cisps[selectedData.cisp]?.centroide;
      if (!coord) return;
      mapRef.current.getView().animate({
        center: fromLonLat(coord),
        zoom: station ? 16 : 13,
        duration: 700
      });
    }
  };

  const openLicense = () => setShowLicenseModal(true);
  const openCompanyRegister = () => setShowCompanyRegisterModal(true);
  const openCompanyPanel = (domain: string) => {
    setCompanyAdminDomainOverride(domain);
    setActiveTab('company_admin');
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onNavigate={handleNavigateToTab}
      estadoScope={estadoScope}
      onChangeScope={scope => {
        setEstadoScope(scope);
        setActiveTab('map');
      }}
      sidebarSection={sidebarSection}
      setSidebarSection={setSidebarSection}
      isFactionPanelOpen={isFactionPanelOpen}
      setIsFactionPanelOpen={setIsFactionPanelOpen}
      isNavigationOpen={isNavigationOpen}
      setIsNavigationOpen={setIsNavigationOpen}
      onOpenLicense={openLicense}
      onOpenCompanyRegister={isAdmin ? openCompanyRegister : undefined}
      accessDeniedMessage={accessDeniedMessage}
      onDismissAccessDenied={() => setAccessDeniedMessage(null)}
      dialogs={
        <AppGlobalDialogs
          registry={registry}
          showImporter={showImporter}
          showPrintModal={showPrintModal}
          showLicenseModal={showLicenseModal}
          showCompanyRegisterModal={showCompanyRegisterModal}
          showIncidentModal={isIncidentModalOpen}
          printableData={selectedData}
          selectedIncident={selectedCorporateIncident}
          incidentInitialCoords={incidentInitialCoords}
          companyDomain={effectiveCompanyDomain}
          availableCompanies={availableCompanies}
          registeredCarrierOptions={Array.from(new Set(companyIncidents.map(incident => incident.carrierName?.trim()).filter((name): name is string => Boolean(name))))}
          isAdmin={isAdmin}
          onCloseImporter={() => setActiveTab('map')}
          onClosePrint={() => setShowPrintModal(false)}
          onCloseLicense={() => setShowLicenseModal(false)}
          onCloseCompanyRegister={() => setShowCompanyRegisterModal(false)}
          onCompanyCreated={openCompanyPanel}
          onCloseIncident={() => {
            setIsIncidentModalOpen(false);
            setSelectedCorporateIncident(null);
            setIncidentInitialCoords(undefined);
          }}
          onSelectCompanyDomain={setCompanyAdminDomainOverride}
          onOpenAdmin={() => setActiveTab('admin')}
          onOpenCompanyAdmin={() => setActiveTab('company_admin')}
          onOpenCompanyRegister={openCompanyRegister}
        />
      }
    >
      <AppRoutes
        route={route}
        canRenderRoute={canRenderRoute}
        onGoHome={() => setActiveTab('map')}
        onOpenLicense={openLicense}
        territorialView={{
          registry,
          onSelectCISP: handleSelectCISP,
          onSwitchToMap: () => setActiveTab('map')
        }}
        sigPanel={{
          divisaoRows,
          setDivisaoRows,
          unidadeRows,
          setUnidadeRows,
          relacionamentoRows,
          setRelacionamentoRows,
          onLocateOnMap: (uf, lat, lng) => {
            setEstadoScope(uf);
            setActiveTab('map');
            if (lat != null && lng != null) {
              setFocusTarget({ lat, lng, zoom: 11.5, ts: Date.now() });
            }
          }
        }}
        adminPanel={{
          onOpenCompanyPanel: openCompanyPanel,
          onOpenCompanyRegister: openCompanyRegister
        }}
        companyPanel={{
          registry,
          availableCompanies,
          overrideDomain: companyAdminDomainOverride,
          onSelectOverrideDomain: setCompanyAdminDomainOverride,
          onGoToAdminCompanies: () => setActiveTab('admin'),
          onOpenIncidentModal: incident => {
            setSelectedCorporateIncident(incident || null);
            setIncidentInitialCoords(undefined);
            setIsIncidentModalOpen(true);
          },
          onViewIncidentDossier: openCorporateIncidentDossier,
          onLocateOnMap: (lat, lng) => {
            setActiveTab('map');
            setFocusTarget({ lat, lng, zoom: 16, ts: Date.now() });
          }
        }}
        map={route?.tab === 'map' && (
          <MapWorkspace
            fleetUser={isAdmin || isCompanyAdmin ? firebaseUser ?? undefined : undefined}
            sidebarProps={{
              registry,
              estadoScope,
              setEstadoScope,
              onSelectUf: handleSelectUf,
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
              onSelectCISP: handleSelectCISP,
              selectedCispId,
              onSelectDelegaciaMgEs: handleSelectDelegaciaMgEs,
              selectedDelegaciaMgEsId,
              onResetView: handleResetView,
              choroplethMetric,
              setChoroplethMetric,
              layerOpacity,
              setLayerOpacity,
              activeSection: sidebarSection,
              companyDomain: effectiveCompanyDomain,
              totalCompanyIncidents: visibleCompanyIncidents.length,
              totalCompanyRoubos: visibleCompanyIncidents.filter(i => i.incidentType === 'roubo_carga' || i.incidentType === 'roubo' || i.incidentType === 'furto').length,
              onOpenIncidentModal: canEditCompanyIncidents ? () => {
                setIncidentInitialCoords(undefined);
                setSelectedCorporateIncident(null);
                setIsIncidentModalOpen(true);
              } : undefined,
              onOpenNavigation: () => setIsNavigationOpen(true),
              onActiveSectionChange: next => {
                setSidebarSection(next);
                if (next) {
                  setIsFactionPanelOpen(false);
                  setIsNavigationOpen(false);
                }
              }
            }}
            mapProps={{
              registry,
              estadoScope,
              layers,
              basemap,
              selectedCispId,
              selectedCommunityName,
              selectedDelegaciaMgEsId,
              canViewDetails: hasFullAccess,
              companyIncidents: visibleCompanyIncidents,
              companyDomain: effectiveCompanyDomain,
              onSelectCorporateIncident: openCorporateIncidentDossier,
              onRequestRegisterIncident: canEditCompanyIncidents ? coords => {
                setIncidentInitialCoords(coords);
                setSelectedCorporateIncident(null);
                setIsIncidentModalOpen(true);
              } : undefined,
              onSelectFeature: feature => {
                if (feature?.tipo === 'CORPORATE_INCIDENT') {
                  const incident = feature.corporateIncident ?? visibleCompanyIncidents.find(item => item.id === String(feature.id));
                  if (incident) openCorporateIncidentDossier(incident);
                  return;
                }
                if (incidentId) navigate('/');
                handleSelectFeature(feature);
              },
              mapRefOut: mapRef,
              choroplethMetric,
              layerOpacity,
              selectedFactionFilter,
              visiblePreciseFactions,
              mgEsDivisao: divisaoRows,
              mgEsUnidades: unidadeRows,
              selectedUf,
              focusTarget,
              selectedAddress,
              onClearAddress: () => setSelectedAddress(null),
              isTrackingLocation,
              onToggleLiveLocation: () => setIsTrackingLocation(prev => !prev),
              searchQuery,
              setSearchQuery,
              onSelectCISP: handleSelectCISP,
              onSelectCommunity: handleSelectCommunity,
              onSelectAddress: handleSelectAddress,
              onSelectDelegaciaMgEs: handleSelectDelegaciaMgEs,
              onResetView: handleResetView
            }}
            selectedData={incidentId ? null : selectedData}
            isDossierOpen={!incidentId && isDossierOpen}
            setIsDossierOpen={setIsDossierOpen}
            isFactionPanelOpen={isFactionPanelOpen}
            onCloseFactionPanel={() => setIsFactionPanelOpen(false)}
            visiblePreciseFactions={visiblePreciseFactions}
            setVisiblePreciseFactions={setVisiblePreciseFactions}
            selectedCorporateIncident={isCorporateDossierOpen ? dossierIncident : null}
            onCloseDossier={closeDossier}
            onCenterOnCorporateIncident={centerOnCorporateIncident}
            onEditCorporateIncident={canEditCompanyIncidents ? editCorporateIncident : undefined}
            onPrintDossier={() => setShowPrintModal(true)}
            onCenterOnSelected={handleCenterOnSelected}
            onSelectEstadoScope={setEstadoScope}
            onOpenImport={() => setActiveTab('import')}
          />
        )}
      />
    </AppLayout>
  );
}

export default App;
