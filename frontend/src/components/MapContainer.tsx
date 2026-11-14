import React, { useCallback, useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import Feature, { FeatureLike } from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import CircleGeom from 'ol/geom/Circle';
import { Style, Fill, Stroke, Text, Circle as CircleStyle } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control/defaults';
import { Database, ExternalLink, X, LocateFixed, Navigation, Crosshair, Square, Compass } from 'lucide-react';
import {
  BasemapType,
  ChoroplethMetric,
  LayerVisibility,
  SelectedFeatureData,
  TerritorialRegistry
} from '../types';
import { DivisaoTerritorialRow, EstadoScope, UnidadePolicialRow } from '../types/sigBase';
import {
  FAC_CATALOG,
  FACCAO_PRECISA_GEOJSON,
  CodigoFaccaoPrecisa,
  findCispForCoords,
  findFactionAtCoords,
  getPolygonCentroid
} from '../data/faccoesPrecisas';
import {
  BRASIL_STATES_GEOJSON,
  BRASIL_UFS_INFO,
  UfMetadataInfo
} from '../data/brasilEstadosData';
import { AddressSearchResult, reverseGeocodeFree } from '../utils/geocoding';
import { FaccaoSearchEntry } from '../data/faccoesPrecisas';
import { MapSearchBar } from './MapSearchBar';
import { DELEGACIAS_MG_ES_DATA } from '../data/delegaciasMgEsData';
import { DelegaciaTerritorialMgEs } from '../types/delegaciaTerritorial';

interface MapContainerProps {
  registry: TerritorialRegistry | null;
  estadoScope: EstadoScope;
  layers: LayerVisibility;
  basemap: BasemapType;
  selectedCispId: number | null;
  selectedCommunityName: string | null;
  onSelectFeature: (data: SelectedFeatureData | null) => void;
  mapRefOut: React.MutableRefObject<Map | null>;
  choroplethMetric: ChoroplethMetric;
  layerOpacity: number;
  selectedYear: number;
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
}

const FAC_STYLE_CACHE: Record<string, Style> = {};
const FAC_HIGHLIGHT_CACHE: Record<string, Style> = {};

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getFacStyle(code: CodigoFaccaoPrecisa, highlight: boolean): Style {
  const cache = highlight ? FAC_HIGHLIGHT_CACHE : FAC_STYLE_CACHE;
  if (cache[code]) return cache[code];
  const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
  const fillAlpha = highlight ? 0.62 : code === 'NEU' ? 0.28 : 0.44;
  const style = new Style({
    stroke: new Stroke({
      color: highlight ? '#ffffff' : meta.color,
      width: highlight ? 2.8 : 1.7
    }),
    fill: new Fill({
      color: hexToRgba(meta.color, fillAlpha)
    })
  });
  cache[code] = style;
  return style;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  registry,
  estadoScope,
  layers,
  basemap,
  selectedCispId,
  selectedCommunityName,
  onSelectFeature,
  mapRefOut,
  choroplethMetric,
  layerOpacity,
  selectedYear,
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
  onResetView
}) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);

  const selectedCispIdRef = useRef(selectedCispId);
  const selectedCommunityRef = useRef(selectedCommunityName);
  const selectedDelegaciaIdRef = useRef<string | null>(null);
  const choroplethMetricRef = useRef(choroplethMetric);
  const layerOpacityRef = useRef(layerOpacity);
  const selectedYearRef = useRef(selectedYear);
  const registryRef = useRef(registry);
  const selectedFactionFilterRef = useRef(selectedFactionFilter);
  const estadoScopeRef = useRef(estadoScope);
  const onSelectFeatureRef = useRef(onSelectFeature);

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
    choroplethMetricRef.current = choroplethMetric;
    if (cispVectorRef.current) cispVectorRef.current.changed();
  }, [choroplethMetric]);

  useEffect(() => {
    layerOpacityRef.current = layerOpacity;
    if (cispVectorRef.current) cispVectorRef.current.changed();
  }, [layerOpacity]);

  useEffect(() => {
    selectedYearRef.current = selectedYear;
    if (cispVectorRef.current) cispVectorRef.current.changed();
  }, [selectedYear]);

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

  const hoveredFacFeatureRef = useRef<Feature | null>(null);
  const popupElementRef = useRef<HTMLDivElement | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);
  const lastFocusTsRef = useRef<number>(0);

  const [followUser, setFollowUser] = useState<boolean>(true);
  const followUserRef = useRef<boolean>(true);
  useEffect(() => {
    followUserRef.current = followUser;
  }, [followUser]);

  const [liveGps, setLiveGps] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    speedKmh: number | null;
    updatedAt: string;
    streetAddress: string | null;
    cispLabel: string | null;
    factionLabel: string | null;
    factionColor: string | null;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const lastReverseGeocodeRef = useRef<{ ts: number; lat: number; lng: number }>({ ts: 0, lat: 0, lng: 0 });

  const [mapPopup, setMapPopup] = useState<{
    visible: boolean;
    title: string;
    factionLabel: string;
    factionShort: string;
    color: string;
    cispLabel?: string;
    source: string;
    sourceUrl?: string;
    period: string;
    methodologyNote: string;
  } | null>(null);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    sub: string;
    type: string;
    color?: string;
    source?: string;
    sourceDetail?: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    sub: '',
    type: ''
  });

  // Initialize OpenLayers Map
  useEffect(() => {
    if (!mapElement.current) return;

    const osmLayer = new TileLayer({ source: new OSM(), visible: basemap === 'osm' });
    const voyagerLayer = new TileLayer({
      source: new XYZ({
        url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        attributions: '© CARTO Voyager / OpenStreetMap'
      }),
      visible: basemap === 'voyager'
    });
    const satLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: '© Esri World Imagery'
      }),
      visible: basemap === 'satellite'
    });
    const streetsLayer = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        attributions: '© Google Maps'
      }),
      visible: basemap === 'streets'
    });

    basemapOsmRef.current = osmLayer;
    basemapVoyagerRef.current = voyagerLayer;
    basemapSatRef.current = satLayer;
    basemapStreetsRef.current = streetsLayer;

    // 0. Brasil 27 UFs Vector Layer
    const brasilLayer = new VectorLayer({
      source: brasilSourceRef.current,
      visible: layers.brasilEstados,
      zIndex: 0
    });
    brasilVectorRef.current = brasilLayer;

    // 1. RISP Vector Layer
    const rispLayer = new VectorLayer({
      source: new VectorSource({ url: '/data/risp.geojson', format: new GeoJSON() }),
      visible: layers.risp,
      zIndex: 1,
      style: feature => {
        const id = feature.get('id');
        const colors: Record<number, string> = {
          1: 'rgba(59, 130, 246, 0.14)',
          2: 'rgba(16, 185, 129, 0.14)',
          3: 'rgba(245, 158, 11, 0.14)',
          4: 'rgba(139, 92, 246, 0.14)',
          5: 'rgba(236, 72, 153, 0.14)',
          6: 'rgba(6, 182, 212, 0.14)',
          7: 'rgba(225, 29, 72, 0.14)'
        };
        const borderColors: Record<number, string> = {
          1: '#3b82f6',
          2: '#10b981',
          3: '#f59e0b',
          4: '#8b5cf6',
          5: '#ec4899',
          6: '#06b6d4',
          7: '#e11d48'
        };
        return new Style({
          fill: new Fill({ color: colors[id] || 'rgba(100, 116, 139, 0.1)' }),
          stroke: new Stroke({
            color: borderColors[id] || '#64748b',
            width: 2.5,
            lineDash: [6, 4]
          })
        });
      }
    });
    rispVectorRef.current = rispLayer;

    // 2. AISP Vector Layer
    const aispLayer = new VectorLayer({
      source: new VectorSource({ url: '/data/aisp.geojson', format: new GeoJSON() }),
      visible: layers.aisp,
      zIndex: 2,
      style: () =>
        new Style({
          fill: new Fill({ color: 'rgba(245, 158, 11, 0.08)' }),
          stroke: new Stroke({ color: '#f59e0b', width: 1.8 })
        })
    });
    aispVectorRef.current = aispLayer;

    // 3. CISP Vector Layer (137 CISPs from real KML-derived GeoJSON)
    const cispLayer = new VectorLayer({
      source: new VectorSource({ url: '/data/cisp.geojson', format: new GeoJSON() }),
      visible: layers.cisp,
      zIndex: 3,
      style: (feature, resolution) => {
        const cispNum = feature.get('cisp');
        const isSelected = selectedCispIdRef.current === cispNum;
        const opacity = layerOpacityRef.current;
        const metric = choroplethMetricRef.current;
        const year = selectedYearRef.current;
        const reg = registryRef.current;

        let fillColor = isSelected
          ? `rgba(59, 130, 246, ${Math.min(0.85, opacity + 0.35)})`
          : `rgba(30, 58, 138, ${opacity})`;
        let strokeColor = isSelected ? '#ffffff' : 'rgba(59, 130, 246, 0.85)';

        if (reg && reg.cisps[cispNum]) {
          const rec = reg.cisps[cispNum];
          if (metric === 'faccao') {
            const faccao = rec.dinamica_territorial?.faccao || '';
            const factionFilter = selectedFactionFilterRef.current;
            const matchesFilter =
              !factionFilter ||
              factionFilter === 'all' ||
              (factionFilter === 'CV' && faccao.includes('CV')) ||
              (factionFilter === 'TCP' && faccao.includes('TCP')) ||
              ((factionFilter === 'Milícia' || factionFilter === 'MIL') && faccao.includes('Milícia')) ||
              (factionFilter === 'Disputa' && (faccao.includes('Disputa') || faccao.includes('x'))) ||
              (factionFilter === 'Controle' && (faccao.includes('Controle') || faccao.includes('Sem Domínio')));

            const activeOpacity = matchesFilter ? Math.max(0.45, opacity) : 0.1;
            if (faccao.includes('CV')) {
              fillColor = `rgba(239, 68, 68, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#ef4444' : 'rgba(239, 68, 68, 0.25)';
            } else if (faccao.includes('TCP')) {
              fillColor = `rgba(59, 130, 246, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#3b82f6' : 'rgba(59, 130, 246, 0.25)';
            } else if (faccao.includes('Milícia')) {
              fillColor = `rgba(168, 85, 247, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#a855f7' : 'rgba(168, 85, 247, 0.25)';
            } else if (faccao.includes('Disputa') || faccao.includes('x')) {
              fillColor = `rgba(249, 115, 22, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#f97316' : 'rgba(249, 115, 22, 0.25)';
            } else {
              fillColor = `rgba(16, 185, 129, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#10b981' : 'rgba(16, 185, 129, 0.25)';
            }
          } else if (metric !== 'none') {
            const yrStats = rec.indicadores?.historico?.[year] || rec.indicadores?.atual_2025;
            if (yrStats) {
              const val = (yrStats as any)[metric] || 0;
              let ratio = 0;
              if (metric === 'letalidade_violenta') ratio = Math.min(1, val / 60);
              else if (metric === 'roubo_rua') ratio = Math.min(1, val / 600);
              else if (metric === 'roubo_veiculo') ratio = Math.min(1, val / 450);
              else if (metric === 'roubo_carga') ratio = Math.min(1, val / 120);
              else if (metric === 'fuzis_apreendidos') ratio = Math.min(1, val / 15);

              if (ratio > 0.7) {
                fillColor = `rgba(220, 38, 38, ${Math.max(0.45, opacity)})`;
                strokeColor = '#ef4444';
              } else if (ratio > 0.4) {
                fillColor = `rgba(234, 88, 12, ${Math.max(0.4, opacity)})`;
                strokeColor = '#f97316';
              } else if (ratio > 0.2) {
                fillColor = `rgba(234, 179, 8, ${Math.max(0.35, opacity)})`;
                strokeColor = '#eab308';
              } else {
                fillColor = `rgba(16, 185, 129, ${Math.max(0.28, opacity)})`;
                strokeColor = '#10b981';
              }
            }
          }
        }

        const showLabel = resolution < 260;
        return new Style({
          fill: new Fill({ color: fillColor }),
          stroke: new Stroke({
            color: strokeColor,
            width: isSelected ? 3.5 : 2.0,
            lineDash: isSelected ? undefined : [5, 3]
          }),
          text: showLabel
            ? new Text({
                text: `${cispNum}ª DP`,
                font: "bold 10px 'JetBrains Mono', monospace",
                fill: new Fill({ color: '#f8fafc' }),
                stroke: new Stroke({ color: '#020617', width: 3 })
              })
            : undefined
        });
      }
    });
    cispVectorRef.current = cispLayer;

    // 4. Precise 1,695 Faction Polygons Layer (Dados de Riscos · ago/2026)
    const faccoesPrecisasLayer = new VectorLayer({
      source: faccoesPrecisasSourceRef.current,
      visible: layers.faccoesPrecisas,
      zIndex: 4
    });
    faccoesPrecisasVectorRef.current = faccoesPrecisasLayer;

    // 5. Focos Especiais Vector Layer
    const focosLayer = new VectorLayer({
      source: new VectorSource({ url: '/data/focos_especiais.geojson', format: new GeoJSON() }),
      visible: layers.focos,
      zIndex: 5,
      style: feature => {
        const cor = feature.get('cor') || '#ef4444';
        return new Style({
          fill: new Fill({ color: cor + '55' }),
          stroke: new Stroke({ color: cor, width: 2.5 }),
          text: new Text({
            text: feature.get('nome'),
            font: 'bold 11px sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#000000', width: 3 }),
            offsetY: -10
          })
        });
      }
    });
    focosVectorRef.current = focosLayer;

    // 6. Delegacias Points
    const delegaciasLayer = new VectorLayer({
      source: new VectorSource({ url: '/data/delegacias.geojson', format: new GeoJSON() }),
      visible: layers.delegacias,
      zIndex: 6,
      style: feature => {
        const cispNum = feature.get('cisp');
        const isSelected = selectedCispIdRef.current === cispNum;
        return new Style({
          image: new CircleStyle({
            radius: isSelected ? 14 : 10.5,
            fill: new Fill({ color: isSelected ? '#2563eb' : '#0f172a' }),
            stroke: new Stroke({
              color: isSelected ? '#93c5fd' : '#38bdf8',
              width: isSelected ? 3 : 2
            })
          }),
          text: new Text({
            text: String(cispNum),
            font: isSelected ? 'bold 11px Arial, sans-serif' : 'bold 9px Arial, sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#020617', width: 2.5 }),
            textAlign: 'center',
            textBaseline: 'middle'
          })
        });
      }
    });
    delegaciasVectorRef.current = delegaciasLayer;

    // 7. Batalhões Points
    const batalhoesLayer = new VectorLayer({
      source: new VectorSource({ url: '/data/batalhoes.geojson', format: new GeoJSON() }),
      visible: layers.batalhoes,
      zIndex: 7,
      style: feature => {
        const aispNum = feature.get('aisp');
        return new Style({
          image: new CircleStyle({
            radius: 11,
            fill: new Fill({ color: '#0891b2' }),
            stroke: new Stroke({ color: '#ffffff', width: 2 })
          }),
          text: new Text({
            text: `${aispNum}º`,
            font: 'bold 9px Arial, sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            textAlign: 'center',
            textBaseline: 'middle'
          })
        });
      }
    });
    batalhoesVectorRef.current = batalhoesLayer;

    // 8. MG & ES SIG Layer
    const mgEsLayer = new VectorLayer({
      source: mgEsSourceRef.current,
      visible: layers.mgEs,
      zIndex: 8
    });
    mgEsVectorRef.current = mgEsLayer;

    // 9. Searched Address Marker Layer
    const addressMarkerLayer = new VectorLayer({
      source: addressSourceRef.current,
      zIndex: 10
    });
    addressVectorRef.current = addressMarkerLayer;

    // 10. Real-Time User GPS Location Layer
    const userLocationLayer = new VectorLayer({
      source: userLocSourceRef.current,
      zIndex: 11
    });
    userLocVectorRef.current = userLocationLayer;

    const view = new View({
      center: fromLonLat([-43.28, -22.86]),
      zoom: 10.3,
      minZoom: 3.5,
      maxZoom: 19
    });

    const map = new Map({
      target: mapElement.current,
      layers: [
        osmLayer,
        voyagerLayer,
        satLayer,
        streetsLayer,
        brasilLayer,
        rispLayer,
        aispLayer,
        cispLayer,
        faccoesPrecisasLayer,
        focosLayer,
        delegaciasLayer,
        batalhoesLayer,
        mgEsLayer,
        addressMarkerLayer,
        userLocationLayer
      ],
      view,
      controls: defaultControls({ zoom: true, attribution: true })
    });

    mapInstance.current = map;
    if (mapRefOut) mapRefOut.current = map;

    // Pause GPS auto-follow if the user drags the map manually
    map.on('pointerdrag', () => {
      if (followUserRef.current) {
        setFollowUser(false);
      }
    });

    if (popupElementRef.current) {
      const overlay = new Overlay({
        element: popupElementRef.current,
        positioning: 'bottom-center',
        offset: [0, -12],
        autoPan: {
          animation: { duration: 250 }
        }
      });
      map.addOverlay(overlay);
      popupOverlayRef.current = overlay;
    }

    // Click handler
    map.on('singleclick', evt => {
      let featureFound = false;
      map.forEachFeatureAtPixel(evt.pixel, feature => {
        if (featureFound) return true;
        const props = feature.getProperties();
        const tipo = props.tipo || props.type;

        if (tipo === 'DELEGACIA_MG_ES_POLYGON' || tipo === 'DELEGACIA_MG_ES') {
          featureFound = true;
          const del = props.delegacia as DelegaciaTerritorialMgEs;
          if (selectedDelegaciaIdRef.current === del.id) {
            selectedDelegaciaIdRef.current = null;
            setMapPopup(null);
            popupOverlayRef.current?.setPosition(undefined);
            onSelectFeatureRef.current(null);
            if (mgEsVectorRef.current) mgEsVectorRef.current.changed();
            return true;
          }

          selectedDelegaciaIdRef.current = del.id;
          if (mgEsVectorRef.current) mgEsVectorRef.current.changed();

          setMapPopup({
            visible: true,
            title: del.nomeCurto,
            factionLabel: `${del.orgao} · ${del.municipio} - ${del.uf}`,
            factionShort: del.orgao,
            color: del.cor,
            cispLabel: del.regional,
            source: `${del.totalBairros} Bairros atendidos · Comarca de ${del.municipio}`,
            period: del.plantao24h ? 'Atendimento: Plantão 24 Horas' : del.horarioAtendimento,
            methodologyNote: `Jurisdição: ${del.jurisdicao} | Endereço: ${del.endereco} | Tel: ${del.telefone}`
          });
          popupOverlayRef.current?.setPosition(evt.coordinate);

          onSelectFeatureRef.current({
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
          return true;
        }

        if (tipo === 'MGES_NODE') {
          featureFound = true;
          setMapPopup(null);
          popupOverlayRef.current?.setPosition(undefined);
          onSelectFeatureRef.current({
            tipo: 'MGES_NODE',
            id: props.mgEsInfo.titulo,
            nome: props.mgEsInfo.titulo,
            mgEsInfo: props.mgEsInfo
          });
          return true;
        }

        if (tipo === 'FACCAO_PRECISA') {
          featureFound = true;
          const nome = props.n as string;
          if (selectedCommunityRef.current === nome) {
            setMapPopup(null);
            popupOverlayRef.current?.setPosition(undefined);
            onSelectFeatureRef.current(null);
            return true;
          }
          const code = props.f as CodigoFaccaoPrecisa;
          const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
          const origRing = props.origRing as [number, number][];
          const [cx, cy] = origRing?.length ? getPolygonCentroid(origRing) : [-43.28, -22.86];
          const cispFeatAtClick = cispVectorRef.current?.getSource()?.getFeaturesAtCoordinate(evt.coordinate)?.[0];
          const cispNum = (cispFeatAtClick?.get('cisp') as number | undefined) ?? findCispForCoords(cx, cy);
          const reg = registryRef.current;
          const regRecord = cispNum ? reg?.cisps[cispNum] : undefined;

          setMapPopup({
            visible: true,
            title: nome,
            factionLabel: meta.label,
            factionShort: meta.shortLabel,
            color: meta.color,
            cispLabel: regRecord?.nome_oficial || (cispNum ? `${cispNum}ª DP` : undefined),
            source: 'Dados de Riscos · Mapa RJ Risco Facções',
            sourceUrl: 'https://dadosderiscos.com.br/mapa-rj-risco-faccoes.html',
            period: 'Base Agosto/2026 (1.695 áreas)',
            methodologyNote: 'Mapeamento comunitário compilado a partir de fontes públicas (GENI-UFF, Fogo Cruzado e Disque-Denúncia).'
          });
          popupOverlayRef.current?.setPosition(evt.coordinate);

          onSelectFeatureRef.current({
            tipo: 'FACCAO_COMUNIDADE',
            id: `dr-${nome}`,
            nome,
            faccao: meta.label,
            faccaoCode: code,
            descricao: `Polígono delimitado de "${nome}" (${meta.label}) na circunscrição da ${
              regRecord?.nome_oficial || (cispNum ? `${cispNum}ª DP` : 'Região Metropolitana RJ')
            }.`,
            fonte: 'Dados de Riscos (dadosderiscos.com.br) · GENI-UFF / Fogo Cruzado',
            data_registro: 'Agosto/2026',
            grau_confiabilidade: 'Precisão Poligonal (1.695 áreas)',
            cisp: regRecord?.cisp || cispNum,
            aisp: regRecord?.aisp,
            risp: regRecord?.risp,
            batalhao: regRecord?.batalhao,
            comando: regRecord?.comando_regional,
            municipio: regRecord?.municipio || 'Rio de Janeiro',
            bairros: regRecord?.bairros || [],
            telefone: regRecord?.telefone,
            endereco: regRecord?.endereco,
            marcolegal: regRecord?.marcolegal,
            areakm2: regRecord?.areakm2,
            indicadores: regRecord?.indicadores,
            dinamica_territorial: regRecord?.dinamica_territorial
          });
          return true;
        }

        if (tipo === 'FOCO_ESPECIAL') {
          featureFound = true;
          setMapPopup({
            visible: true,
            title: props.nome,
            factionLabel: props.faccao || 'Foco Especial',
            factionShort: 'FOCO',
            color: props.cor || '#ef4444',
            cispLabel: props.cisp ? `${props.cisp}ª DP` : undefined,
            source: props.fonte || 'Registros Públicos Consolidados',
            period: props.data_registro || 'Atualizado 2026',
            methodologyNote: props.grau_confiabilidade || 'Registro georreferenciado KML / fontes públicas.'
          });
          popupOverlayRef.current?.setPosition(evt.coordinate);

          onSelectFeatureRef.current({
            tipo: 'FOCO_ESPECIAL',
            id: feature.getId() || 'foco',
            nome: props.nome,
            faccao: props.faccao,
            descricao: props.descricao,
            fonte: props.fonte,
            data_registro: props.data_registro,
            grau_confiabilidade: props.grau_confiabilidade,
            alerta_juridico: props.alerta_juridico,
            aisp: props.aisp,
            cisp: props.cisp
          });
          return true;
        }

        if (tipo === 'CISP') {
          featureFound = true;
          const cispNum = props.cisp;
          if (selectedCispIdRef.current === cispNum) {
            setMapPopup(null);
            popupOverlayRef.current?.setPosition(undefined);
            onSelectFeatureRef.current(null);
            return true;
          }
          const reg = registryRef.current;
          const regRecord = reg?.cisps[cispNum];
          let bairrosList = regRecord?.bairros;
          if (!bairrosList || bairrosList.length === 0) {
            if (typeof props.bairros === 'string') {
              bairrosList = props.bairros.split(',').map((s: string) => s.trim());
            } else if (Array.isArray(props.bairros)) {
              bairrosList = props.bairros;
            }
          }
          onSelectFeatureRef.current({
            tipo: 'CISP',
            id: cispNum,
            cisp: cispNum,
            nome: regRecord?.nome_oficial || props.nome,
            aisp: props.aisp,
            risp: props.risp,
            batalhao: props.batalhao,
            municipio: props.municipio,
            bairros: bairrosList || [],
            telefone: regRecord?.telefone || '',
            endereco: regRecord?.endereco || '',
            marcolegal: props.marcolegal,
            areakm2: props.areakm2,
            indicadores: regRecord?.indicadores,
            dinamica_territorial: regRecord?.dinamica_territorial
          });
          return true;
        }

        if (tipo === 'AISP') {
          featureFound = true;
          const aispNum = props.aisp;
          onSelectFeatureRef.current({
            tipo: 'AISP',
            id: aispNum,
            aisp: aispNum,
            nome: props.nome,
            risp: props.risp,
            municipio: props.municipio,
            batalhao: props.batalhao,
            endereco: props.endereco,
            areakm2: props.areakm2
          });
          return true;
        }

        if (tipo === 'RISP') {
          featureFound = true;
          onSelectFeatureRef.current({
            tipo: 'RISP',
            id: props.id,
            risp: props.id,
            nome: props.nome,
            comando: props.cpa,
            areakm2: props.areakm2
          });
          return true;
        }

        if (tipo === 'DELEGACIA') {
          featureFound = true;
          const cispNum = props.cisp;
          if (selectedCispIdRef.current === cispNum) {
            setMapPopup(null);
            popupOverlayRef.current?.setPosition(undefined);
            onSelectFeatureRef.current(null);
            return true;
          }
          const regRecord = registryRef.current?.cisps[cispNum];
          onSelectFeatureRef.current({
            tipo: 'DELEGACIA',
            id: cispNum,
            cisp: cispNum,
            nome: regRecord?.nome_oficial || props.nome,
            batalhao: props.batalhao,
            municipio: props.municipio,
            endereco: regRecord?.endereco || props.endereco,
            telefone: regRecord?.telefone || props.telefone,
            bairros: regRecord?.bairros || [],
            indicadores: regRecord?.indicadores,
            dinamica_territorial: regRecord?.dinamica_territorial
          });
          return true;
        }

        if (tipo === 'BATALHAO') {
          featureFound = true;
          onSelectFeatureRef.current({
            tipo: 'BATALHAO',
            id: props.aisp,
            aisp: props.aisp,
            nome: props.nome,
            municipio: props.municipio,
            endereco: props.endereco,
            risp: props.risp
          });
          return true;
        }

        if (tipo === 'BRASIL_UF') {
          featureFound = true;
          const ufInfo = BRASIL_UFS_INFO[props.uf];
          if (ufInfo) {
            onSelectFeatureRef.current({
              tipo: 'ESTADO_UF',
              id: ufInfo.uf,
              nome: ufInfo.nome,
              ufInfo
            });
          }
          return true;
        }

        return false;
      });

      if (!featureFound) {
        setMapPopup(null);
        popupOverlayRef.current?.setPosition(undefined);
        if (selectedCispIdRef.current || selectedCommunityRef.current) {
          onSelectFeatureRef.current(null);
        }
      }
    });

    // Pointer hover tooltip handler
    map.on('pointermove', evt => {
      if (evt.dragging || (evt.originalEvent as PointerEvent | undefined)?.pointerType === 'touch') {
        setTooltip(prev => ({ ...prev, visible: false }));
        return;
      }

      if (hoveredFacFeatureRef.current) {
        hoveredFacFeatureRef.current.setStyle(undefined);
        hoveredFacFeatureRef.current = null;
      }

      const mapW = mapElement.current?.clientWidth || 1000;
      const mapH = mapElement.current?.clientHeight || 700;
      const safeX = Math.min(evt.pixel[0] + 14, Math.max(12, mapW - 330));
      const safeY = Math.min(evt.pixel[1] + 14, Math.max(12, mapH - 165));

      let hit = false;
      map.forEachFeatureAtPixel(evt.pixel, feature => {
        if (hit) return true;
        const props = feature.getProperties();
        const tipo = props.tipo || props.type;

        if (tipo === 'DELEGACIA_MG_ES_POLYGON' || tipo === 'DELEGACIA_MG_ES') {
          hit = true;
          const del = props.delegacia as DelegaciaTerritorialMgEs;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: del.nomeCurto,
            sub: `${del.municipio} - ${del.uf} • ${del.totalBairros} Bairros na Jurisdição`,
            type: `DELEGACIA · ${del.orgao} (${del.uf})`,
            color: del.cor,
            source: del.jurisdicao,
            sourceDetail: `Principais Bairros: ${del.bairros.slice(0, 5).join(', ')}${del.bairros.length > 5 ? '...' : ''}`
          });
          return true;
        }

        if (tipo === 'MGES_NODE') {
          hit = true;
          const info = props.mgEsInfo;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: `${info.uf} · ${info.titulo}`,
            sub: info.subtitulo,
            type: 'SIG MG·ES',
            source: info.divisao?.Fonte_Legal || info.unidade?.Fonte_Legal || 'SEJUSP-MG / SESP-ES'
          });
          return true;
        }

        if (tipo === 'FACCAO_PRECISA') {
          hit = true;
          const code = props.f as CodigoFaccaoPrecisa;
          const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
          hoveredFacFeatureRef.current = feature as Feature;
          (feature as Feature).setStyle(getFacStyle(code, true));

          const cispFeatAtHover = cispVectorRef.current?.getSource()?.getFeaturesAtCoordinate(evt.coordinate)?.[0];
          const cispNum = cispFeatAtHover?.get('cisp') as number | undefined;
          const regRecord = cispNum ? registryRef.current?.cisps[cispNum] : undefined;
          const cispText = regRecord
            ? `${regRecord.cisp_formatado} (${regRecord.municipio})`
            : cispNum
            ? `${cispNum}ª DP`
            : '';

          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: props.n,
            sub: cispText ? `${meta.label} · ${cispText}` : meta.label,
            type: `FACÇÃO · ${meta.shortLabel}`,
            color: meta.color,
            source: 'Dados de Riscos (dadosderiscos.com.br)',
            sourceDetail: 'Mapa RJ Risco Facções · Base ago/2026 (GENI-UFF / Fogo Cruzado)'
          });
          return true;
        }

        if (tipo === 'FOCO_ESPECIAL') {
          hit = true;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title: props.nome,
            sub: props.faccao || 'Área de Foco Especial',
            type: 'FOCO ESPECIAL',
            color: props.cor || '#ef4444',
            source: props.fonte || 'Fontes Públicas Consolidadas',
            sourceDetail: `${props.data_registro || ''}${props.grau_confiabilidade ? ` · ${props.grau_confiabilidade}` : ''}`
          });
          return true;
        }

        if (tipo === 'BRASIL_UF' && estadoScopeRef.current === 'TODOS') {
          const ufInfo = BRASIL_UFS_INFO[props.uf];
          if (ufInfo) {
            hit = true;
            setTooltip({
              visible: true,
              x: safeX,
              y: safeY,
              title: `${ufInfo.nome} (${ufInfo.uf})`,
              sub: `Região ${ufInfo.regiao} · Capital: ${ufInfo.capital}`,
              type: 'ESTADO (IBGE)',
              source: 'Malha Oficial IBGE'
            });
            return true;
          }
        }

        if (props.nome || props.cisp_formatado) {
          hit = true;
          const cispNum = props.cisp as number | undefined;
          const regRecord = cispNum ? registryRef.current?.cisps[cispNum] : undefined;
          const din = regRecord?.dinamica_territorial;
          const title = props.cisp_formatado ? `${props.cisp_formatado} - ${props.nome}` : props.nome;
          const sub = props.municipio ? `${props.municipio} • ${props.batalhao || ''}` : `${tipo || ''}`;
          setTooltip({
            visible: true,
            x: safeX,
            y: safeY,
            title,
            sub,
            type: tipo || 'TERRITORIO',
            source: din ? `${din.faccao} · Fonte: ${din.fonte}` : undefined,
            sourceDetail: din ? `Ref: ${din.data} · ${din.confiabilidade}` : undefined
          });
          return true;
        }

        return false;
      });

      if (!hit) {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
      const targetEl = map.getTargetElement();
      if (targetEl) targetEl.style.cursor = hit ? 'pointer' : '';
    });

    const resizeObserver = new ResizeObserver(() => map.updateSize());
    if (mapElement.current) resizeObserver.observe(mapElement.current);
    setTimeout(() => map.updateSize(), 150);

    return () => {
      resizeObserver.disconnect();
      map.setTarget(undefined);
    };
  }, []);

  // Update Basemaps
  useEffect(() => {
    if (basemapOsmRef.current) basemapOsmRef.current.setVisible(basemap === 'osm');
    if (basemapVoyagerRef.current) basemapVoyagerRef.current.setVisible(basemap === 'voyager');
    if (basemapSatRef.current) basemapSatRef.current.setVisible(basemap === 'satellite');
    if (basemapStreetsRef.current) basemapStreetsRef.current.setVisible(basemap === 'streets');
  }, [basemap]);

  // Sync layer visibility with EstadoScope + Layer toggles
  useEffect(() => {
    const showRj = estadoScope === 'RJ' || estadoScope === 'TODOS';
    const showMgEsNodes = estadoScope !== 'RJ';
    const showBr = estadoScope === 'TODOS' || layers.brasilEstados;

    if (brasilVectorRef.current) brasilVectorRef.current.setVisible(showBr);
    if (rispVectorRef.current) rispVectorRef.current.setVisible(showRj && layers.risp);
    if (aispVectorRef.current) aispVectorRef.current.setVisible(showRj && layers.aisp);
    if (cispVectorRef.current) cispVectorRef.current.setVisible(showRj && layers.cisp);
    if (faccoesPrecisasVectorRef.current) faccoesPrecisasVectorRef.current.setVisible(showRj && layers.faccoesPrecisas);
    if (focosVectorRef.current) focosVectorRef.current.setVisible(showRj && layers.focos);
    if (delegaciasVectorRef.current) delegaciasVectorRef.current.setVisible(showRj && layers.delegacias);
    if (batalhoesVectorRef.current) batalhoesVectorRef.current.setVisible(showRj && layers.batalhoes);
    if (mgEsVectorRef.current) mgEsVectorRef.current.setVisible(showMgEsNodes && layers.mgEs);
  }, [layers, estadoScope]);

  // Populate Integrated States GeoJSON (RJ, MG, ES)
  useEffect(() => {
    const source = brasilSourceRef.current;
    source.clear();
    const format = new GeoJSON();
    const features = format.readFeatures(BRASIL_STATES_GEOJSON, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });

    features.forEach(feat => {
      const uf = feat.get('uf') as string;
      feat.set('type', 'BRASIL_UF');
      const info = BRASIL_UFS_INFO[uf];
      const status = info?.statusSig;
      const isSelected = selectedUf?.uf === uf;

      const strokeColor = isSelected
        ? '#ffffff'
        : status === 'INTEGRADO_COMPLETO'
        ? '#38bdf8'
        : '#34d399';

      const fillAlpha =
        estadoScope === 'TODOS'
          ? isSelected
            ? 0.28
            : 0.08
          : 0.02;

      feat.setStyle((_f, resolution) => {
        const showLabel = estadoScope === 'TODOS' && resolution > 400;
        return new Style({
          stroke: new Stroke({
            color: strokeColor,
            width: isSelected ? 3 : 2.2
          }),
          fill: new Fill({ color: hexToRgba(strokeColor, fillAlpha) }),
          text: showLabel
            ? new Text({
                text: uf,
                font: "bold 11px 'JetBrains Mono', monospace",
                fill: new Fill({ color: '#ffffff' }),
                stroke: new Stroke({ color: '#020617', width: 3 })
              })
            : undefined
        });
      });
    });

    source.addFeatures(features);
  }, [estadoScope, selectedUf]);

  // Populate 1,695 Precise Faction Polygons (Dados de Riscos ago/2026)
  useEffect(() => {
    const source = faccoesPrecisasSourceRef.current;
    source.clear();
    const format = new GeoJSON();
    const featuresToAdd: Feature[] = [];

    FACCAO_PRECISA_GEOJSON.features.forEach(rawFeat => {
      const code = rawFeat.properties.f;
      if (!visiblePreciseFactions[code]) return;

      if (selectedFactionFilter && selectedFactionFilter !== 'all') {
        if (selectedFactionFilter === 'Milícia' || selectedFactionFilter === 'MIL') {
          if (code !== 'MIL' && code !== 'LJ' && code !== 'MNI') return;
        } else if (selectedFactionFilter === 'Controle' || selectedFactionFilter === 'NEU') {
          if (code !== 'NEU') return;
        } else if (
          selectedFactionFilter === 'CV' ||
          selectedFactionFilter === 'TCP' ||
          selectedFactionFilter === 'ADA' ||
          selectedFactionFilter === 'LJ' ||
          selectedFactionFilter === 'MNI'
        ) {
          if (code !== selectedFactionFilter) return;
        }
      }

      const olFeat = format.readFeature(rawFeat, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      }) as Feature;

      olFeat.setProperties({
        type: 'FACCAO_PRECISA',
        n: rawFeat.properties.n,
        f: code,
        origRing: rawFeat.geometry.coordinates[0]
      });

      featuresToAdd.push(olFeat);
    });

    if (faccoesPrecisasVectorRef.current) {
      faccoesPrecisasVectorRef.current.setStyle((feature: FeatureLike, resolution: number) => {
        const code = feature.get('f') as CodigoFaccaoPrecisa;
        const nome = feature.get('n') as string;
        const isSelected = selectedCommunityRef.current === nome;
        const baseStyle = getFacStyle(code, isSelected);

        if (resolution < 35 || isSelected) {
          const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
          return new Style({
            stroke: baseStyle.getStroke() || undefined,
            fill: baseStyle.getFill() || undefined,
            text: new Text({
              text: `${nome} (${meta.shortLabel})`,
              font: isSelected ? "bold 11px 'Plus Jakarta Sans', sans-serif" : "600 9.5px 'Plus Jakarta Sans', sans-serif",
              fill: new Fill({ color: '#ffffff' }),
              stroke: new Stroke({ color: '#020617', width: 3 }),
              overflow: false
            })
          });
        }
        return baseStyle;
      });
    }

    source.addFeatures(featuresToAdd);
  }, [visiblePreciseFactions, selectedFactionFilter]);

  // Populate MG & ES Nodes and Territorial Delimitations
  useEffect(() => {
    const source = mgEsSourceRef.current;
    source.clear();
    if (estadoScope === 'RJ') return;

    const features: Feature[] = [];

    // 1. Demarcações Territoriais Poligonais das Delegacias (PCES & PCMG)
    DELEGACIAS_MG_ES_DATA.forEach(del => {
      if (estadoScope === 'MG' && del.uf !== 'MG') return;
      if (estadoScope === 'ES' && del.uf !== 'ES') return;

      const polyRings = del.coordinates.map(ring => ring.map(coord => fromLonLat(coord)));
      const polyFeat = new Feature({
        geometry: new Polygon(polyRings),
        type: 'DELEGACIA_MG_ES_POLYGON',
        id: del.id,
        delegacia: del
      });

      polyFeat.setStyle((feature, resolution) => {
        const isSelected = selectedDelegaciaIdRef.current === del.id;
        const showLabel = resolution < 650;
        return new Style({
          fill: new Fill({
            color: hexToRgba(del.cor, isSelected ? 0.45 : 0.22)
          }),
          stroke: new Stroke({
            color: isSelected ? '#ffffff' : del.cor,
            width: isSelected ? 3.5 : 2.0,
            lineDash: isSelected ? undefined : [6, 4]
          }),
          text: showLabel
            ? new Text({
                text: `${del.nomeCurto}\n(${del.totalBairros} bairros)`,
                font: isSelected ? "bold 11px 'Plus Jakarta Sans', sans-serif" : "600 10px 'Plus Jakarta Sans', sans-serif",
                fill: new Fill({ color: isSelected ? '#ffffff' : '#f1f5f9' }),
                stroke: new Stroke({ color: '#090d16', width: 3.5 }),
                textAlign: 'center',
                offsetY: 0
              })
            : undefined
        });
      });

      features.push(polyFeat);

      // 2. Marcador Pontual da Sede da Delegacia
      const markerFeat = new Feature({
        geometry: new Point(fromLonLat([del.longitude, del.latitude])),
        type: 'DELEGACIA_MG_ES',
        id: `sede-${del.id}`,
        delegacia: del
      });

      const isEs = del.uf === 'ES';
      markerFeat.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 9,
            fill: new Fill({ color: isEs ? '#047857' : '#1d4ed8' }),
            stroke: new Stroke({ color: '#ffffff', width: 2 })
          }),
          text: new Text({
            text: del.orgao,
            font: "bold 8px 'JetBrains Mono', monospace",
            fill: new Fill({ color: '#ffffff' }),
            offsetY: 14,
            stroke: new Stroke({ color: '#020617', width: 3 })
          })
        })
      );

      features.push(markerFeat);
    });

    mgEsDivisao.forEach(row => {
      if (estadoScope === 'MG' && row.UF !== 'MG') return;
      if (estadoScope === 'ES' && row.UF !== 'ES') return;
      if (row.Lat_Ref == null || row.Lng_Ref == null) return;

      const isConfirmed = row.Status_Validacao === 'CONFIRMADO_ATO_OFICIAL';
      const feat = new Feature({
        geometry: new Point(fromLonLat([row.Lng_Ref, row.Lat_Ref])),
        type: 'MGES_NODE',
        mgEsInfo: {
          uf: row.UF,
          titulo: `${row.ID_RISP}ª RISP — ${row.Nome_Municipio}`,
          subtitulo: row.Nome_Delegacia_PC,
          divisao: row
        }
      });

      feat.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 10,
            fill: new Fill({ color: row.UF === 'ES' ? '#064e3b' : '#1e1b4b' }),
            stroke: new Stroke({ color: isConfirmed ? '#34d399' : '#fbbf24', width: 2 })
          }),
          text: new Text({
            text: `${row.UF} ${row.ID_RISP}`,
            font: "bold 9px 'JetBrains Mono', monospace",
            fill: new Fill({ color: '#ffffff' }),
            offsetY: -15,
            stroke: new Stroke({ color: '#020617', width: 3 })
          })
        })
      );

      features.push(feat);
    });

    mgEsUnidades.forEach(u => {
      if (estadoScope === 'MG' && u.UF !== 'MG') return;
      if (estadoScope === 'ES' && u.UF !== 'ES') return;
      if (u.Latitude == null || u.Longitude == null) return;

      const feat = new Feature({
        geometry: new Point(fromLonLat([u.Longitude, u.Latitude])),
        type: 'MGES_NODE',
        mgEsInfo: {
          uf: u.UF,
          titulo: u.Nome_Oficial,
          subtitulo: `${u.Orgao} · ${u.Municipio}`,
          unidade: u
        }
      });

      feat.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 7.5,
            fill: new Fill({ color: '#0284c7' }),
            stroke: new Stroke({ color: '#f8fafc', width: 1.5 })
          }),
          text: new Text({
            text: u.Orgao,
            font: "bold 8px 'JetBrains Mono', monospace",
            fill: new Fill({ color: '#7dd3fc' }),
            offsetY: 13,
            stroke: new Stroke({ color: '#020617', width: 2.5 })
          })
        })
      );

      features.push(feat);
    });

    source.addFeatures(features);
  }, [estadoScope, mgEsDivisao, mgEsUnidades]);

  // Auto-frame when estadoScope changes
  useEffect(() => {
    if (!mapInstance.current) return;
    const view = mapInstance.current.getView();
    if (estadoScope === 'TODOS') {
      view.animate({ center: fromLonLat([-43.3, -20.4]), zoom: 6.3, duration: 700 });
    } else if (estadoScope === 'RJ') {
      view.animate({ center: fromLonLat([-43.28, -22.86]), zoom: 10.3, duration: 700 });
    } else if (estadoScope === 'MG') {
      view.animate({ center: fromLonLat([-44.38, -18.80]), zoom: 6.4, duration: 700 });
    } else if (estadoScope === 'ES') {
      view.animate({ center: fromLonLat([-40.45, -19.85]), zoom: 7.7, duration: 700 });
    } else {
      view.animate({ center: fromLonLat([-42.80, -19.20]), zoom: 6.2, duration: 700 });
    }
  }, [estadoScope]);

  // Fly to focusTarget
  useEffect(() => {
    if (!focusTarget || !mapInstance.current) return;
    lastFocusTsRef.current = Date.now();
    mapInstance.current.getView().animate({
      center: fromLonLat([focusTarget.lng, focusTarget.lat]),
      zoom: focusTarget.zoom || 12.0,
      duration: 700
    });
  }, [focusTarget]);

  // Fly to CISP centroid when selected (skip if an address/community focusTarget just fired)
  useEffect(() => {
    if (Date.now() - lastFocusTsRef.current < 1200) return;
    if (selectedCispId && registry && mapInstance.current) {
      const rec = registry.cisps[selectedCispId];
      if (rec && rec.centroide) {
        mapInstance.current.getView().animate({
          center: fromLonLat(rec.centroide),
          zoom: 12.6,
          duration: 750
        });
      }
    }
  }, [selectedCispId, registry]);

  // Render Searched Address Marker + Zoom + Anchored Info Popup
  useEffect(() => {
    const source = addressSourceRef.current;
    source.clear();
    if (!selectedAddress) return;

    const coord = fromLonLat([selectedAddress.lng, selectedAddress.lat]);
    const pinFeature = new Feature({
      geometry: new Point(coord),
      type: 'SEARCHED_ADDRESS'
    });

    pinFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: '#0284c7' }),
          stroke: new Stroke({ color: '#ffffff', width: 3 })
        }),
        text: new Text({
          text: selectedAddress.shortTitle,
          font: "bold 11px 'Plus Jakarta Sans', sans-serif",
          fill: new Fill({ color: '#ffffff' }),
          stroke: new Stroke({ color: '#020617', width: 3.5 }),
          offsetY: -18
        })
      })
    );

    const haloFeature = new Feature({
      geometry: new Point(coord)
    });
    haloFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 19,
          fill: new Fill({ color: 'rgba(14, 165, 233, 0.22)' }),
          stroke: new Stroke({ color: '#38bdf8', width: 1.5 })
        })
      })
    );

    source.addFeatures([haloFeature, pinFeature]);

    const facMatch = findFactionAtCoords(selectedAddress.lng, selectedAddress.lat);
    const cispFeatAtAddr = cispVectorRef.current?.getSource()?.getFeaturesAtCoordinate(coord)?.[0];
    const cispNum = (cispFeatAtAddr?.get('cisp') as number | undefined) ?? findCispForCoords(selectedAddress.lng, selectedAddress.lat);
    const regRecord = cispNum ? registryRef.current?.cisps[cispNum] : undefined;

    setMapPopup({
      visible: true,
      title: selectedAddress.shortTitle,
      factionLabel: facMatch ? `${facMatch.label} (${facMatch.nome})` : 'Sem polígono de facção mapeado neste ponto',
      factionShort: facMatch ? facMatch.shortLabel : 'ENDEREÇO',
      color: facMatch ? facMatch.color : '#0284c7',
      cispLabel: regRecord?.nome_oficial || (cispNum ? `${cispNum}ª DP` : undefined),
      source: facMatch
        ? 'OpenStreetMap (Nominatim) + Dados de Riscos'
        : 'OpenStreetMap Nominatim / Photon (Free)',
      sourceUrl: facMatch ? 'https://dadosderiscos.com.br/mapa-rj-risco-faccoes.html' : undefined,
      period: selectedAddress.subtitle || 'Geocodificação em tempo real (OSM Free)',
      methodologyNote: selectedAddress.displayName
    });
    popupOverlayRef.current?.setPosition(coord);
  }, [selectedAddress]);

  // Real-Time GPS Location Tracking (watchPosition)
  useEffect(() => {
    const source = userLocSourceRef.current;

    if (!isTrackingLocation) {
      source.clear();
      setLiveGps(null);
      setGpsError(null);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocalização não suportada neste navegador.');
      return;
    }

    setFollowUser(true);
    setGpsError(null);
    let isFirstFix = true;

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 0);
        const speedKmh =
          pos.coords.speed != null && !Number.isNaN(pos.coords.speed)
            ? Math.round(pos.coords.speed * 3.6)
            : null;

        const mercatorCoord = fromLonLat([lng, lat]);

        // Update OpenLayers GPS Accuracy Circle + Live Dot
        source.clear();
        const radiusMetersMercator = Math.max(accuracy, 12) / Math.cos((lat * Math.PI) / 180);
        const accuracyFeature = new Feature({
          geometry: new CircleGeom(mercatorCoord, radiusMetersMercator)
        });
        accuracyFeature.setStyle(
          new Style({
            fill: new Fill({ color: 'rgba(16, 185, 129, 0.14)' }),
            stroke: new Stroke({ color: 'rgba(52, 211, 153, 0.7)', width: 1.5 })
          })
        );

        const dotFeature = new Feature({
          geometry: new Point(mercatorCoord)
        });
        dotFeature.setStyle(
          new Style({
            image: new CircleStyle({
              radius: 9,
              fill: new Fill({ color: '#10b981' }),
              stroke: new Stroke({ color: '#ffffff', width: 3 })
            }),
            text: new Text({
              text: 'VOCÊ (AO VIVO)',
              font: "bold 10px 'JetBrains Mono', monospace",
              fill: new Fill({ color: '#6ee7b7' }),
              stroke: new Stroke({ color: '#020617', width: 3 }),
              offsetY: -16
            })
          })
        );

        source.addFeatures([accuracyFeature, dotFeature]);

        // Animate map camera when following user
        if (mapInstance.current && (isFirstFix || followUserRef.current)) {
          const view = mapInstance.current.getView();
          const currentZoom = view.getZoom() || 10;
          view.animate({
            center: mercatorCoord,
            zoom: isFirstFix ? Math.max(currentZoom, 16.2) : currentZoom,
            duration: isFirstFix ? 750 : 350
          });
          isFirstFix = false;
        }

        // Spatial lookup: CISP + Faction at live position
        const cispFeat = cispVectorRef.current?.getSource()?.getFeaturesAtCoordinate(mercatorCoord)?.[0];
        const cispNum = (cispFeat?.get('cisp') as number | undefined) ?? findCispForCoords(lng, lat);
        const regRec = cispNum ? registryRef.current?.cisps[cispNum] : undefined;
        const cispLabel = regRec ? `${regRec.cisp_formatado} · ${regRec.municipio}` : cispNum ? `${cispNum}ª DP` : null;

        const facMatch = findFactionAtCoords(lng, lat);

        const nowTime = new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        setLiveGps(prev => ({
          lat,
          lng,
          accuracy,
          speedKmh,
          updatedAt: nowTime,
          streetAddress: prev?.streetAddress || null,
          cispLabel,
          factionLabel: facMatch ? `${facMatch.nome} (${facMatch.shortLabel})` : null,
          factionColor: facMatch ? facMatch.color : null
        }));
        setGpsError(null);

        // Throttled reverse geocoding (~15s or >50m displacement)
        const nowMs = Date.now();
        const last = lastReverseGeocodeRef.current;
        const movedEnough = Math.abs(lat - last.lat) > 0.0005 || Math.abs(lng - last.lng) > 0.0005;
        if (nowMs - last.ts > 15000 || (last.ts === 0) || movedEnough) {
          lastReverseGeocodeRef.current = { ts: nowMs, lat, lng };
          reverseGeocodeFree(lat, lng).then(street => {
            if (street) {
              setLiveGps(prev => (prev ? { ...prev, streetAddress: street } : prev));
            }
          });
        }
      },
      err => {
        if (err.code === 1) {
          setGpsError('Permissão de localização negada no navegador. Libere o acesso ao GPS para rastrear ao vivo.');
        } else if (err.code === 2) {
          setGpsError('Sinal de localização indisponível no momento.');
        } else {
          setGpsError('Tempo esgotado ao obter localização GPS.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      source.clear();
    };
  }, [isTrackingLocation]);

  const getMapCenter = useCallback(() => {
    const center = mapInstance.current?.getView().getCenter();
    if (!center) return null;
    const [lng, lat] = toLonLat(center);
    return { lat, lng };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      <div ref={mapElement} className="w-full h-full" />

      {/* Floating GPS Real-Time Button directly below OpenLayers Zoom (+ / -) */}
      {onToggleLiveLocation && (
        <button
          onClick={onToggleLiveLocation}
          title={
            isTrackingLocation
              ? 'Desativar localização em tempo real'
              : 'Ativar minha localização em tempo real (GPS)'
          }
          className={`absolute top-[10.1rem] right-3 md:top-[6.25rem] md:right-4 z-20 w-10 h-10 md:w-9 md:h-9 rounded-xl md:rounded-lg border flex items-center justify-center shadow-lg transition-all cursor-pointer ${
            isTrackingLocation
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-600/40 ring-2 ring-emerald-400/40'
              : 'bg-slate-900/95 hover:bg-blue-600 border-slate-700 text-slate-200 hover:text-white hover:border-blue-500'
          }`}
        >
          <LocateFixed className={`w-4 h-4 ${isTrackingLocation ? 'animate-pulse' : ''}`} />
        </button>
      )}

      {/* Mobile-only Reset Scope View (Compass) below GPS */}
      {onResetView && (
        <button
          onClick={onResetView}
          title="Centralizar Escopo Atual"
          className="md:hidden absolute top-[13.1rem] right-3 z-20 w-10 h-10 rounded-xl bg-slate-900/95 hover:bg-blue-600 border border-slate-700 text-blue-400 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
        >
          <Compass className="w-4 h-4" />
        </button>
      )}

      {/* Top Floating Stack: Search Bar (full-width on mobile) + Address Pill + Live GPS HUD */}
      <div className="absolute top-2.5 left-2.5 right-2.5 md:top-3 md:left-3 md:right-auto z-20 flex flex-col gap-2 md:max-w-[420px]">
        {setSearchQuery && onSelectCISP && onSelectCommunity && onSelectAddress && onToggleLiveLocation && (
          <MapSearchBar
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
          />
        )}

        {/* Searched Address Pill (leaves room for zoom/GPS on right on mobile) */}
        {selectedAddress && !isTrackingLocation && (
          <div className="w-[calc(100%-3.5rem)] md:w-[420px] max-w-full bg-slate-900/95 border border-sky-500/50 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-xs flex items-center gap-2.5">
            <Navigation className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white truncate">{selectedAddress.shortTitle}</div>
              <div className="text-[10px] text-slate-400 truncate">{selectedAddress.subtitle}</div>
            </div>
            {onClearAddress && (
              <button
                onClick={() => {
                  onClearAddress();
                  setMapPopup(null);
                  popupOverlayRef.current?.setPosition(undefined);
                }}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer shrink-0"
                title="Remover marcador do endereço"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Live Real-Time GPS Telemetry HUD */}
        {isTrackingLocation && (
          <div className="w-[calc(100%-3.5rem)] md:w-80 max-w-full bg-slate-900/95 border border-emerald-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">
                Localização em Tempo Real
              </span>
            </div>
            <div className="flex items-center gap-1">
              {liveGps && (
                <button
                  onClick={() => {
                    setFollowUser(true);
                    if (mapInstance.current) {
                      mapInstance.current.getView().animate({
                        center: fromLonLat([liveGps.lng, liveGps.lat]),
                        zoom: 16.5,
                        duration: 500
                      });
                    }
                  }}
                  title="Centralizar e seguir minha posição"
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    followUser
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{followUser ? 'Seguindo' : 'Centralizar'}</span>
                </button>
              )}
              {onToggleLiveLocation && (
                <button
                  onClick={onToggleLiveLocation}
                  title="Parar rastreamento GPS"
                  className="p-1 rounded bg-red-500/15 hover:bg-red-500/30 text-red-300 border border-red-500/30 cursor-pointer"
                >
                  <Square className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {gpsError ? (
            <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-lg p-2">
              {gpsError}
            </div>
          ) : liveGps ? (
            <div className="space-y-1.5">
              {liveGps.streetAddress && (
                <div className="text-slate-100 font-semibold leading-snug">{liveGps.streetAddress}</div>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-400">
                <span>
                  {liveGps.lat.toFixed(5)}, {liveGps.lng.toFixed(5)}
                </span>
                <span>±{liveGps.accuracy}m</span>
                {liveGps.speedKmh !== null && <span>{liveGps.speedKmh} km/h</span>}
                <span>{liveGps.updatedAt}</span>
              </div>
              {(liveGps.cispLabel || liveGps.factionLabel) && (
                <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
                  {liveGps.cispLabel && (
                    <div className="text-blue-300 font-medium">
                      Jurisdição: <span className="text-white">{liveGps.cispLabel}</span>
                    </div>
                  )}
                  {liveGps.factionLabel && (
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: liveGps.factionColor || '#ef4444' }}
                      />
                      <span>Área mapeada: {liveGps.factionLabel}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Obtendo sinal GPS em alta precisão...</div>
          )}
        </div>
      )}
      </div>

      {/* Anchored Map Popup (on Click over Demarcated Faction Area or Searched Address) */}
      <div ref={popupElementRef} className="z-30 pointer-events-auto">
        {mapPopup?.visible && (
          <div className="w-[min(18rem,calc(100vw-2rem))] bg-slate-900/98 border border-slate-700 rounded-xl shadow-2xl p-3 text-slate-100 text-xs backdrop-blur-md">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider shrink-0"
                    style={{ backgroundColor: mapPopup.color }}
                  >
                    {mapPopup.factionShort}
                  </span>
                  {mapPopup.cispLabel && (
                    <span className="text-[10px] font-mono text-blue-400 truncate">{mapPopup.cispLabel}</span>
                  )}
                </div>
                <div className="font-bold text-sm text-white leading-snug">{mapPopup.title}</div>
                <div className="text-[11px] text-slate-300 mt-0.5">{mapPopup.factionLabel}</div>
              </div>
              <button
                onClick={() => {
                  setMapPopup(null);
                  popupOverlayRef.current?.setPosition(undefined);
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 cursor-pointer"
                title="Fechar popup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-2 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <Database className="w-3 h-3 shrink-0" />
                <span>Origem dos Dados</span>
              </div>
              <div className="text-slate-200 font-semibold">{mapPopup.source}</div>
              <div className="text-[10px] text-slate-400">{mapPopup.period}</div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{mapPopup.methodologyNote}</p>
              {mapPopup.sourceUrl && (
                <a
                  href={mapPopup.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 underline underline-offset-2 pt-0.5"
                >
                  <span>dadosderiscos.com.br/mapa-rj-risco-faccoes.html</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Hover Tooltip ("hover popup") */}
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none z-30 px-3 py-2 bg-slate-900/95 border border-blue-500/50 rounded-xl shadow-2xl text-slate-100 text-xs backdrop-blur-sm max-w-xs"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            {tooltip.color && (
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: tooltip.color }} />
            )}
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono font-bold uppercase shrink-0">
              {tooltip.type}
            </span>
            <span className="font-semibold text-slate-100 truncate">{tooltip.title}</span>
          </div>
          {tooltip.sub && <div className="text-[11px] text-slate-300 truncate">{tooltip.sub}</div>}
          {tooltip.source && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 space-y-0.5">
              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold">
                <Database className="w-3 h-3 shrink-0 text-amber-400" />
                <span className="truncate">Origem: {tooltip.source}</span>
              </div>
              {tooltip.sourceDetail && (
                <div className="text-[10px] text-slate-400 leading-snug">{tooltip.sourceDetail}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map Attribution badge */}
      <div className="hidden sm:flex absolute bottom-2 left-2 bg-slate-900/85 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none items-center gap-2">
        <span>EPSG:3857 (OpenLayers v9.2.4)</span>
        <span>•</span>
        <span className="text-blue-400 font-medium">ISP-RJ • Dados de Riscos ago/2026 • SIG RJ·MG·ES</span>
      </div>
    </div>
  );
};
