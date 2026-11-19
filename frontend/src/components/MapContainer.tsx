import React, { useCallback, useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import { toLonLat } from 'ol/proj';
import { Database, Lock, Flame } from 'lucide-react';
import {
  BasemapType,
  ChoroplethMetric,
  LayerVisibility,
  SelectedFeatureData,
  TerritorialRegistry
} from '../types';
import { DivisaoTerritorialRow, EstadoScope, UnidadePolicialRow } from '../types/sigBase';
import { CorporatePackageIncident } from '../types/admin';
import { INCIDENT_TYPE_META } from '../utils/corporateIncidentMetadata';
import {
  FAC_CATALOG,
  CodigoFaccaoPrecisa,
} from '../data/faccoesPrecisas';
import { BRASIL_UFS_INFO, UfMetadataInfo } from '../data/brasilEstadosData';
import { AddressSearchResult } from '../utils/geocoding';
import { FaccaoSearchEntry } from '../data/faccoesPrecisas';
import { MapFloatingControls } from '../features/map/components/MapFloatingControls';
import { MapFeaturePopup, MapFeaturePopupData } from '../features/map/components/MapFeaturePopup';
import { MapHoverTooltip, MapHoverTooltipData } from '../features/map/components/MapHoverTooltip';

import { focusMapAt } from '../features/map/services/mapCamera';
import { useLiveGpsTracking } from '../features/map/hooks/useLiveGpsTracking';
import { useMapLayerSynchronization } from '../features/map/hooks/useMapLayerSynchronization';
import { useMapCameraNavigation } from '../features/map/hooks/useMapCameraNavigation';
import { useSearchedAddressLayer } from '../features/map/hooks/useSearchedAddressLayer';
import { useOpenLayersMap } from '../features/map/hooks/useOpenLayersMap';
import { DelegaciaTerritorialMgEs } from '../types/delegaciaTerritorial';

interface MapContainerProps {
  registry: TerritorialRegistry | null;
  estadoScope: EstadoScope;
  layers: LayerVisibility;
  basemap: BasemapType;
  selectedCispId: number | null;
  selectedCommunityName: string | null;
  selectedDelegaciaMgEsId?: string | null;
  onSelectFeature: (data: SelectedFeatureData | null) => void;
  mapRefOut: React.MutableRefObject<Map | null>;
  choroplethMetric: ChoroplethMetric;
  layerOpacity: number;
  selectedFactionFilter: string;
  visiblePreciseFactions: Record<CodigoFaccaoPrecisa, boolean>;
  mgEsDivisao: DivisaoTerritorialRow[];
  mgEsUnidades: UnidadePolicialRow[];
  selectedUf?: UfMetadataInfo | null;
  focusTarget?: { lat: number; lng: number; zoom?: number; ts: number } | null;
  selectedAddress?: (AddressSearchResult & { ts: number }) | null;
  onClearAddress?: () => void;
  isTrackingLocation?: boolean;
  onToggleLiveLocation?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onSelectCISP?: (cispId: number) => void;
  onSelectCommunity?: (entry: FaccaoSearchEntry) => void;
  onSelectAddress?: (address: AddressSearchResult) => void;
  onSelectDelegaciaMgEs?: (delegacia: DelegaciaTerritorialMgEs) => void;
  onResetView?: () => void;
  canViewDetails?: boolean;
  companyIncidents?: CorporatePackageIncident[];
  companyDomain?: string;
  onSelectCorporateIncident?: (incident: CorporatePackageIncident) => void;
  onRequestRegisterIncident?: (coords?: { lat: number; lng: number }) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  registry,
  estadoScope,
  layers,
  basemap,
  selectedCispId,
  selectedCommunityName,
  selectedDelegaciaMgEsId = null,
  onSelectFeature,
  mapRefOut,
  choroplethMetric,
  layerOpacity,
  selectedFactionFilter,
  visiblePreciseFactions,
  mgEsDivisao,
  mgEsUnidades,
  selectedUf,
  focusTarget,
  selectedAddress,
  onClearAddress,
  isTrackingLocation = false,
  onToggleLiveLocation,
  searchQuery = '',
  setSearchQuery,
  onSelectCISP,
  onSelectCommunity,
  onSelectAddress,
  onSelectDelegaciaMgEs,
  onResetView,
  canViewDetails = true,
  companyIncidents = [],
  companyDomain = '',
  onSelectCorporateIncident,
  onRequestRegisterIncident
}) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);

  const selectedCispIdRef = useRef(selectedCispId);
  const selectedCommunityRef = useRef(selectedCommunityName);
  const selectedDelegaciaIdRef = useRef<string | null>(selectedDelegaciaMgEsId);
  const choroplethMetricRef = useRef(choroplethMetric);
  const layerOpacityRef = useRef(layerOpacity);
  const registryRef = useRef(registry);
  const selectedFactionFilterRef = useRef(selectedFactionFilter);
  const estadoScopeRef = useRef(estadoScope);
  const onSelectFeatureRef = useRef(onSelectFeature);
  const onResetViewRef = useRef(onResetView);
  const canViewDetailsRef = useRef(canViewDetails);

  useEffect(() => {
    selectedCispIdRef.current = selectedCispId;
    if (cispVectorRef.current) cispVectorRef.current.changed();
    if (delegaciasVectorRef.current) delegaciasVectorRef.current.changed();
  }, [selectedCispId]);

  useEffect(() => {
    selectedCommunityRef.current = selectedCommunityName;
    if (faccoesPrecisasVectorRef.current) faccoesPrecisasVectorRef.current.changed();
  }, [selectedCommunityName]);

  useEffect(() => {
    selectedDelegaciaIdRef.current = selectedDelegaciaMgEsId;
    if (mgEsVectorRef.current) mgEsVectorRef.current.changed();
  }, [selectedDelegaciaMgEsId]);

  useEffect(() => {
    choroplethMetricRef.current = choroplethMetric;
    if (cispVectorRef.current) cispVectorRef.current.changed();
  }, [choroplethMetric]);

  useEffect(() => {
    layerOpacityRef.current = layerOpacity;
    if (cispVectorRef.current) cispVectorRef.current.changed();
  }, [layerOpacity]);

  useEffect(() => {
    registryRef.current = registry;
    if (cispVectorRef.current) cispVectorRef.current.changed();
    if (delegaciasVectorRef.current) delegaciasVectorRef.current.changed();
  }, [registry]);

  useEffect(() => {
    selectedFactionFilterRef.current = selectedFactionFilter;
    if (cispVectorRef.current) cispVectorRef.current.changed();
    if (focosVectorRef.current) focosVectorRef.current.changed();
  }, [selectedFactionFilter]);

  useEffect(() => {
    estadoScopeRef.current = estadoScope;
    if (brasilVectorRef.current) brasilVectorRef.current.changed();
  }, [estadoScope]);

  useEffect(() => {
    onSelectFeatureRef.current = onSelectFeature;
  }, [onSelectFeature]);

  useEffect(() => {
    onResetViewRef.current = onResetView;
  }, [onResetView]);

  useEffect(() => {
    canViewDetailsRef.current = canViewDetails;
    if (!canViewDetails) {
      setMapPopup(null);
      popupOverlayRef.current?.setPosition(undefined);
    }
  }, [canViewDetails]);

  // Basemap refs
  const basemapOsmRef = useRef<TileLayer<OSM> | null>(null);
  const basemapVoyagerRef = useRef<TileLayer<XYZ> | null>(null);
  const basemapSatRef = useRef<TileLayer<XYZ> | null>(null);
  const basemapStreetsRef = useRef<TileLayer<XYZ> | null>(null);

  // Vector layer refs
  const brasilSourceRef = useRef<VectorSource>(new VectorSource());
  const brasilVectorRef = useRef<VectorLayer<any> | null>(null);
  const rispVectorRef = useRef<VectorLayer<any> | null>(null);
  const aispVectorRef = useRef<VectorLayer<any> | null>(null);
  const cispVectorRef = useRef<VectorLayer<any> | null>(null);
  const faccoesPrecisasSourceRef = useRef<VectorSource>(new VectorSource());
  const faccoesPrecisasVectorRef = useRef<VectorLayer<any> | null>(null);
  const focosVectorRef = useRef<VectorLayer<any> | null>(null);
  const delegaciasVectorRef = useRef<VectorLayer<any> | null>(null);
  const batalhoesVectorRef = useRef<VectorLayer<any> | null>(null);
  const mgEsSourceRef = useRef<VectorSource>(new VectorSource());
  const mgEsVectorRef = useRef<VectorLayer<any> | null>(null);
  const addressSourceRef = useRef<VectorSource>(new VectorSource());
  const addressVectorRef = useRef<VectorLayer<any> | null>(null);
  const userLocSourceRef = useRef<VectorSource>(new VectorSource());
  const userLocVectorRef = useRef<VectorLayer<any> | null>(null);

  // Corporate Heatmap & Incidents Refs (Confidential to company)
  const corporateIncidentsSourceRef = useRef<VectorSource>(new VectorSource());
  const corporateHeatmapRef = useRef<any>(null);
  const corporatePinsRef = useRef<VectorLayer<any> | null>(null);
  const onSelectCorporateIncidentRef = useRef<((inc: CorporatePackageIncident) => void) | undefined>(undefined);
  const onRequestRegisterIncidentRef = useRef<((coords?: { lat: number; lng: number }) => void) | undefined>(undefined);

  useEffect(() => {
    onSelectCorporateIncidentRef.current = onSelectCorporateIncident;
  }, [onSelectCorporateIncident]);

  useEffect(() => {
    onRequestRegisterIncidentRef.current = onRequestRegisterIncident;
  }, [onRequestRegisterIncident]);

  const hoveredFacFeatureRef = useRef<Feature | null>(null);
  const overlayContainerRef = useRef<HTMLDivElement | null>(null);
  if (!overlayContainerRef.current && typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.className = 'ol-popup-react-portal notranslate';
    overlayContainerRef.current = el;
  }
  const popupOverlayRef = useRef<Overlay | null>(null);

  const [followUser, setFollowUser] = useState<boolean>(true);
  const followUserRef = useRef<boolean>(true);
  useEffect(() => {
    followUserRef.current = followUser;
  }, [followUser]);

  const { liveGps, gpsError } = useLiveGpsTracking({
    isTracking: isTrackingLocation,
    mapRef: mapInstance,
    source: userLocSourceRef.current,
    cispLayerRef: cispVectorRef,
    registryRef,
    followUserRef,
    setFollowUser
  });

  const [mapPopup, setMapPopup] = useState<MapFeaturePopupData | null>(null);

  const [tooltip, setTooltip] = useState<MapHoverTooltipData>({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    sub: '',
    type: ''
  });

  useOpenLayersMap({
    mapElement,
    mapInstance,
    mapRefOut,
    basemap,
    layers,
    sources: {
      brasil: brasilSourceRef.current,
      preciseFactions: faccoesPrecisasSourceRef.current,
      mgEs: mgEsSourceRef.current,
      address: addressSourceRef.current,
      userLocation: userLocSourceRef.current,
      corporateIncidents: corporateIncidentsSourceRef.current
    },
    basemapOsmRef,
    basemapVoyagerRef,
    basemapSatRef,
    basemapStreetsRef,
    brasilVectorRef,
    rispVectorRef,
    aispVectorRef,
    cispVectorRef,
    faccoesPrecisasVectorRef,
    focosVectorRef,
    delegaciasVectorRef,
    batalhoesVectorRef,
    mgEsVectorRef,
    addressVectorRef,
    userLocVectorRef,
    corporateHeatmapRef,
    corporatePinsRef,
    selectedCispIdRef,
    selectedCommunityRef,
    selectedDelegaciaIdRef,
    choroplethMetricRef,
    layerOpacityRef,
    registryRef,
    selectedFactionFilterRef,
    estadoScopeRef,
    onSelectFeatureRef,
    onResetViewRef,
    canViewDetailsRef,
    followUserRef,
    setFollowUser,
    onSelectCorporateIncidentRef,
    hoveredFacFeatureRef,
    overlayContainerRef,
    popupOverlayRef,
    setMapPopup,
    setTooltip
  });

  // Update Basemaps
  useEffect(() => {
    if (basemapOsmRef.current) basemapOsmRef.current.setVisible(basemap === 'osm');
    if (basemapVoyagerRef.current) basemapVoyagerRef.current.setVisible(basemap === 'voyager');
    if (basemapSatRef.current) basemapSatRef.current.setVisible(basemap === 'satellite');
    if (basemapStreetsRef.current) basemapStreetsRef.current.setVisible(basemap === 'streets');
  }, [basemap]);

  useMapLayerSynchronization({
    layers,
    estadoScope,
    selectedUf,
    visiblePreciseFactions,
    selectedFactionFilter,
    mgEsDivisao,
    mgEsUnidades,
    companyIncidents,
    brasilSource: brasilSourceRef.current,
    brasilLayerRef: brasilVectorRef,
    preciseFactionSource: faccoesPrecisasSourceRef.current,
    preciseFactionLayerRef: faccoesPrecisasVectorRef,
    mgEsSource: mgEsSourceRef.current,
    mgEsLayerRef: mgEsVectorRef,
    corporateIncidentSource: corporateIncidentsSourceRef.current,
    corporateHeatmapRef,
    corporatePinsRef,
    rispLayerRef: rispVectorRef,
    aispLayerRef: aispVectorRef,
    cispLayerRef: cispVectorRef,
    focosLayerRef: focosVectorRef,
    delegaciasLayerRef: delegaciasVectorRef,
    batalhoesLayerRef: batalhoesVectorRef,
    selectedCommunityRef,
    selectedDelegaciaIdRef
  });

  useMapCameraNavigation({
    mapRef: mapInstance,
    estadoScope,
    focusTarget,
    selectedCispId,
    registry
  });

  useSearchedAddressLayer({
    selectedAddress,
    addressSource: addressSourceRef.current,
    cispLayerRef: cispVectorRef,
    registryRef,
    canViewDetailsRef,
    popupOverlayRef,
    setMapPopup
  });

  const getMapCenter = useCallback(() => {
    const center = mapInstance.current?.getView().getCenter();
    if (!center) return null;
    const [lng, lat] = toLonLat(center);
    return { lat, lng };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#E8ECF1] overflow-hidden">
      <div ref={mapElement} className="w-full h-full" />

      <MapFloatingControls
        mapRef={mapInstance}
        registry={registry}
        estadoScope={estadoScope}
        getMapCenter={getMapCenter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectCISP={onSelectCISP}
        onSelectCommunity={onSelectCommunity}
        onSelectAddress={onSelectAddress}
        onSelectDelegaciaMgEs={onSelectDelegaciaMgEs}
        isTrackingLocation={isTrackingLocation}
        onToggleLiveLocation={onToggleLiveLocation}
        onResetView={onResetView}
        selectedAddress={selectedAddress}
        onClearAddress={onClearAddress}
        clearAddressPopup={() => {
          setMapPopup(null);
          popupOverlayRef.current?.setPosition(undefined);
        }}
        liveGps={liveGps}
        gpsError={gpsError}
        followUser={followUser}
        setFollowUser={setFollowUser}
        companyDomain={companyDomain}
        companyIncidents={companyIncidents}
        onRequestRegisterIncident={onRequestRegisterIncident}
      />

      {/* Popup ancorado no overlay de OpenLayers, com DOM gerenciado por portal React. */}
      <MapFeaturePopup
        container={overlayContainerRef.current}
        popup={mapPopup}
        onClose={() => {
          setMapPopup(null);
          popupOverlayRef.current?.setPosition(undefined);
        }}
      />

      <MapHoverTooltip tooltip={tooltip} />

      {/* Map Attribution badge */}
      <div className="hidden sm:flex absolute bottom-2 left-2 bg-white/90 border border-slate-300 text-[10px] text-slate-600 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none items-center gap-2 shadow-xs">
        <span>EPSG:3857 (OpenLayers v9.2.4)</span>
        <span>•</span>
        <span className="text-[#2D3277] font-semibold">GIS Territorial • ISP-RJ • Dados de Riscos ago/2026</span>
      </div>
    </div>
  );
};
