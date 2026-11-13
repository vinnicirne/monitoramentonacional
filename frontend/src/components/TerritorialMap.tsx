import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import Feature, { FeatureLike } from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import { defaults as defaultControls } from 'ol/control/defaults';
import Attribution from 'ol/control/Attribution';

import { PoliceUnitRecord, FocoEspecialArea, FilterState } from '../types/territory';
import { DivisaoTerritorialRow, EstadoScope, UnidadePolicialRow } from '../types/sigBase';
import { AISP_GEOJSON, CISP_GEOJSON } from '../data/geoBoundaries';
import {
  FAC_CATALOG,
  FAC_ORDER,
  FACCAO_COUNTS,
  FACCAO_PRECISA_GEOJSON,
  FACCAO_SEARCH_INDEX,
  CodigoFaccaoPrecisa,
  findCispForCoords,
  getPolygonCentroid
} from '../data/faccoesPrecisas';
import {
  BRASIL_STATES_GEOJSON,
  BRASIL_UFS_INFO,
  BRASIL_UFS_LIST,
  UfMetadataInfo
} from '../data/brasilEstadosData';
import { Layers, Compass, Globe, Search, X, MapPin } from 'lucide-react';

export interface MgEsSelectedInfo {
  uf: 'MG' | 'ES';
  titulo: string;
  subtitulo: string;
  divisao?: DivisaoTerritorialRow;
  unidade?: UnidadePolicialRow;
}

interface TerritorialMapProps {
  estadoScope: EstadoScope;
  filteredUnits: PoliceUnitRecord[];
  allUnits: PoliceUnitRecord[];
  focosEspeciais: FocoEspecialArea[];
  selectedUnit: PoliceUnitRecord | null;
  onSelectUnit: (unit: PoliceUnitRecord) => void;
  onSelectFocoEspecial?: (foco: FocoEspecialArea) => void;
  filters: FilterState;
  mgEsDivisao: DivisaoTerritorialRow[];
  mgEsUnidades: UnidadePolicialRow[];
  selectedMgEs: MgEsSelectedInfo | null;
  onSelectMgEs: (info: MgEsSelectedInfo) => void;
  selectedUf?: UfMetadataInfo | null;
  onSelectUf?: (info: UfMetadataInfo) => void;
  focusTarget: { lat: number; lng: number; zoom?: number; ts: number } | null;
}

const RISP_COLORS: Record<number, string> = {
  1: '#0284c7', // Sky dark
  2: '#4f46e5', // Indigo
  3: '#059669', // Emerald
  4: '#d97706', // Amber
  5: '#db2777', // Pink
  6: '#ea580c', // Orange
  7: '#7c3aed'  // Purple
};

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Style cache for the 1,695 precise faction polygons (60fps canvas rendering)
const FAC_STYLE_CACHE: Record<string, Style> = {};
const FAC_HIGHLIGHT_STYLE_CACHE: Record<string, Style> = {};

function getFacStyle(code: CodigoFaccaoPrecisa, highlight: boolean): Style {
  const cache = highlight ? FAC_HIGHLIGHT_STYLE_CACHE : FAC_STYLE_CACHE;
  if (cache[code]) return cache[code];

  const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
  const fillAlpha = highlight ? 0.62 : code === 'NEU' ? 0.28 : 0.42;
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

export const TerritorialMap: React.FC<TerritorialMapProps> = ({
  estadoScope,
  filteredUnits,
  allUnits,
  focosEspeciais,
  selectedUnit,
  onSelectUnit,
  onSelectFocoEspecial,
  filters,
  mgEsDivisao,
  mgEsUnidades,
  selectedMgEs,
  onSelectMgEs,
  selectedUf,
  onSelectUf,
  focusTarget
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const tooltipElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  // Refs for latest callbacks inside OpenLayers event listeners
  const allUnitsRef = useRef(allUnits);
  allUnitsRef.current = allUnits;
  const onSelectUnitRef = useRef(onSelectUnit);
  onSelectUnitRef.current = onSelectUnit;
  const onSelectFocoRef = useRef(onSelectFocoEspecial);
  onSelectFocoRef.current = onSelectFocoEspecial;
  const onSelectMgEsRef = useRef(onSelectMgEs);
  onSelectMgEsRef.current = onSelectMgEs;
  const onSelectUfRef = useRef(onSelectUf);
  onSelectUfRef.current = onSelectUf;
  const estadoScopeRef = useRef(estadoScope);
  estadoScopeRef.current = estadoScope;

  // Basemap style state: 'osm' (free official OpenLayers / OSM), 'dark', 'satellite'
  const [baseMapType, setBaseMapType] = useState<'osm' | 'dark' | 'satellite'>('osm');
  const baseTileLayerRef = useRef<TileLayer<OSM | XYZ> | null>(null);

  // OpenLayers Vector Sources and Layers (API v9.2.4)
  const brasilSourceRef = useRef<VectorSource>(new VectorSource());
  const brasilLayerRef = useRef<VectorLayer<any>>(new VectorLayer({ source: brasilSourceRef.current, zIndex: 0 }));
  const cispPolySourceRef = useRef<VectorSource>(new VectorSource());
  const cispPolyLayerRef = useRef<VectorLayer<any>>(new VectorLayer({ source: cispPolySourceRef.current, zIndex: 1 }));

  const aispSourceRef = useRef<VectorSource>(new VectorSource());
  const aispLayerRef = useRef<VectorLayer<any>>(new VectorLayer({ source: aispSourceRef.current, zIndex: 2 }));

  // 1,695 Precise Faction Polygons from Dados de Riscos (base ago/2026)
  const faccoesPrecisasSourceRef = useRef<VectorSource>(new VectorSource());
  const faccoesPrecisasLayerRef = useRef<VectorLayer<any>>(
    new VectorLayer({ source: faccoesPrecisasSourceRef.current, zIndex: 3 })
  );

  // Supplemental Focos Especiais
  const focoSourceRef = useRef<VectorSource>(new VectorSource());
  const focoLayerRef = useRef<VectorLayer<any>>(new VectorLayer({ source: focoSourceRef.current, zIndex: 4 }));

  // CISP Delegacias Points (Markers)
  const cispSourceRef = useRef<VectorSource>(new VectorSource());
  const cispLayerRef = useRef<VectorLayer<any>>(new VectorLayer({ source: cispSourceRef.current, zIndex: 5 }));

  // MG & ES Confirmed RISP Hubs & Regional Units
  const mgEsSourceRef = useRef<VectorSource>(new VectorSource());
  const mgEsLayerRef = useRef<VectorLayer<any>>(new VectorLayer({ source: mgEsSourceRef.current, zIndex: 6 }));

  const overlayRef = useRef<Overlay | null>(null);
  const hoveredFeatureRef = useRef<Feature | null>(null);

  // Layer visibility toggles
  const [showBrasilLayer, setShowBrasilLayer] = useState(true);
  const [showCispPolys, setShowCispPolys] = useState(true);
  const [showAispLayer, setShowAispLayer] = useState(false);
  const [showCispPoints, setShowCispPoints] = useState(true);
  const [showFaccoesPrecisas, setShowFaccoesPrecisas] = useState(true);
  const [showMgEsLayer, setShowMgEsLayer] = useState(true);

  // Per-faction visibility toggle state (Dados de Riscos interactive legend)
  const [visibleFactions, setVisibleFactions] = useState<Record<CodigoFaccaoPrecisa, boolean>>({
    CV: true,
    TCP: true,
    ADA: true,
    MIL: true,
    LJ: true,
    MNI: true,
    NEU: true
  });

  // Community / Faction Search box inside map
  const [communityQuery, setCommunityQuery] = useState('');
  const [selectedCommunityName, setSelectedCommunityName] = useState<string | null>(null);

  const communityHits = useMemo(() => {
    const q = communityQuery
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    if (q.length < 2) return [];
    return FACCAO_SEARCH_INDEX.filter(item => item.normNome.includes(q)).slice(0, 20);
  }, [communityQuery]);

  // Tooltip content state
  const [tooltipContent, setTooltipContent] = useState<{
    title: string;
    subtitle: string;
    extra?: string;
    color?: string;
  } | null>(null);

  // Helper to build FocoEspecialArea object from a Dados de Riscos polygon
  const selectPreciseFactionArea = (
    nome: string,
    code: CodigoFaccaoPrecisa,
    ring: [number, number][],
    flyTo = false
  ) => {
    const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
    const [cx, cy] = getPolygonCentroid(ring);
    const detectedCisp = findCispForCoords(cx, cy);
    const matchingUnit =
      (detectedCisp ? allUnitsRef.current.find(u => u.cisp === detectedCisp) : undefined) ||
      allUnitsRef.current.reduce<PoliceUnitRecord | undefined>((best, u) => {
        const d = Math.hypot(u.lng - cx, u.lat - cy);
        if (!best) return u;
        const bestD = Math.hypot(best.lng - cx, best.lat - cy);
        return d < bestD ? u : best;
      }, undefined);

    const focoObj: FocoEspecialArea = {
      id: `dr-${nome}`,
      nome,
      municipio: matchingUnit?.municipio || 'Rio de Janeiro',
      aisp: matchingUnit?.aisp || 1,
      cisp: matchingUnit?.cisp || detectedCisp || 1,
      natureza: code === 'NEU' ? 'Área Mapeada como Neutra' : `Área com Presença Mapeada: ${meta.label}`,
      grupoArmado: code,
      faccaoInfo: {
        grupo: code,
        nomeGrupo: meta.label,
        situacao: code === 'NEU' ? 'Área Neutra' : 'Predomínio Documentado',
        fonte: 'Dados de Riscos (Mapa RJ Risco Facções · base ago/2026) — Fontes Públicas',
        dataReferencia: 'Agosto/2026',
        grauConfiabilidade: 'Cartografia Georreferenciada Precisa (1.695 áreas)',
        detalhes: `Polígono delimitado de "${nome}" (${meta.label}) na circunscrição da ${
          matchingUnit?.delegaciaNome || `CISP ${detectedCisp || '-'}`
        } (${matchingUnit?.batalhaoPMERJ || ''}). Dados informativos baseados em mapeamento público.`
      },
      dataRegistro: '2026-08-01',
      fonteOficial: 'Dados de Riscos · Fontes Públicas Consolidadas',
      grauConfiabilidade: 'Documentado em Base Oficial',
      observacoes: 'Geometria poligonal exata importada para consulta territorial de precisão.',
      coordinates: [ring]
    };

    setSelectedCommunityName(nome);
    if (onSelectFocoRef.current) onSelectFocoRef.current(focoObj);
    if (matchingUnit) onSelectUnitRef.current(matchingUnit);

    if (flyTo && mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat([cx, cy]),
        zoom: 14.2,
        duration: 600
      });
    }
  };

  // 1. Initialize OpenLayers Map (v9.2.4 API)
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current) return;

    const createBaseSource = () => {
      if (baseMapType === 'osm') {
        return new OSM({
          attributions: '© OpenStreetMap · OpenLayers v9.2.4'
        });
      } else if (baseMapType === 'satellite') {
        return new XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attributions: 'Esri Satellite · OpenLayers'
        });
      } else {
        return new XYZ({
          url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          attributions: 'CartoDB Dark · OpenLayers · ISP-RJ'
        });
      }
    };

    baseTileLayerRef.current = new TileLayer({
      source: createBaseSource()
    });

    if (tooltipElementRef.current) {
      overlayRef.current = new Overlay({
        element: tooltipElementRef.current,
        offset: [0, -14],
        positioning: 'bottom-center',
        stopEvent: false
      });
    }

    // Center on Rio de Janeiro Metropolitan Area at zoom 10.3 so demarcations & factions are clearly visible!
    const rjMetroCenter = fromLonLat([-43.28, -22.86]);

    const map = new Map({
      target: mapElementRef.current,
      layers: [
        baseTileLayerRef.current,
        brasilLayerRef.current,
        cispPolyLayerRef.current,
        aispLayerRef.current,
        faccoesPrecisasLayerRef.current,
        focoLayerRef.current,
        cispLayerRef.current,
        mgEsLayerRef.current
      ],
      view: new View({
        center: rjMetroCenter,
        zoom: 10.3,
        minZoom: 3.5,
        maxZoom: 18
      }),
      controls: defaultControls({
        zoom: true,
        attribution: false
      }).extend([
        new Attribution({
          collapsible: false
        })
      ]),
      overlays: overlayRef.current ? [overlayRef.current] : []
    });

    // Pointer move listener for hover tooltips, highlight, and cursor
    map.on('pointermove', evt => {
      if (evt.dragging) {
        if (overlayRef.current) overlayRef.current.setPosition(undefined);
        return;
      }

      if (hoveredFeatureRef.current) {
        const prevProps = hoveredFeatureRef.current.getProperties();
        if (prevProps.type === 'FACCAO_PRECISA') {
          hoveredFeatureRef.current.setStyle(undefined); // revert to layer style
        }
        hoveredFeatureRef.current = null;
      }

      const pixel = evt.pixel;
      let hit = false;

      map.forEachFeatureAtPixel(pixel, feature => {
        const props = feature.getProperties();
        if (props.type === 'MGES_NODE') {
          const info = props.mgEsInfo as MgEsSelectedInfo;
          setTooltipContent({
            title: `${info.uf} · ${info.titulo}`,
            subtitle: info.subtitulo,
            extra: info.divisao
              ? `IBGE ${info.divisao.Codigo_IBGE_Municipio} · ${info.divisao.Status_Validacao}`
              : info.unidade?.Endereco_Completo
          });
          if (overlayRef.current) overlayRef.current.setPosition(evt.coordinate);
          hit = true;
          return true;
        } else if (props.type === 'CISP') {
          const unit = props.unitRecord as PoliceUnitRecord;
          setTooltipContent({
            title: unit.delegaciaNome,
            subtitle: `AISP ${unit.aisp} · ${unit.batalhaoPMERJ}`,
            extra: unit.unidadeTerritorial
          });
          if (overlayRef.current) overlayRef.current.setPosition(evt.coordinate);
          hit = true;
          return true;
        } else if (props.type === 'FACCAO_PRECISA') {
          const nome = props.n as string;
          const code = props.f as CodigoFaccaoPrecisa;
          const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
          hoveredFeatureRef.current = feature as Feature;
          (feature as Feature).setStyle(getFacStyle(code, true));

          setTooltipContent({
            title: nome,
            subtitle: meta.label,
            extra: 'Base Dados de Riscos (ago/2026) · Clique para ver Dossiê e CISP',
            color: meta.color
          });
          if (overlayRef.current) overlayRef.current.setPosition(evt.coordinate);
          hit = true;
          return true;
        } else if (props.type === 'FOCO') {
          const foco = props.focoRecord as FocoEspecialArea;
          const faccaoLabel = foco.faccaoInfo ? `[${foco.faccaoInfo.nomeGrupo}]` : '';
          setTooltipContent({
            title: `${faccaoLabel} ${foco.nome}`,
            subtitle: foco.natureza,
            extra: `Fonte: ${foco.faccaoInfo?.fonte || foco.fonteOficial}`
          });
          if (overlayRef.current) overlayRef.current.setPosition(evt.coordinate);
          hit = true;
          return true;
        } else if (props.tipo === 'CISP') {
          const matching = allUnitsRef.current.find(u => u.cisp === props.cisp);
          if (matching) {
            setTooltipContent({
              title: matching.delegaciaNome,
              subtitle: `Circunscrição CISP · AISP ${matching.aisp} (${matching.batalhaoPMERJ})`,
              extra: `${matching.municipio} — ${matching.unidadeTerritorial}`
            });
            if (overlayRef.current) overlayRef.current.setPosition(evt.coordinate);
            hit = true;
            return true;
          }
        } else if (props.tipo === 'AISP') {
          setTooltipContent({
            title: props.nome,
            subtitle: `RISP ${props.risp} · ${props.municipio}`,
            extra: 'Clique para selecionar a circunscrição'
          });
          if (overlayRef.current) overlayRef.current.setPosition(evt.coordinate);
          hit = true;
          return true;
        } else if (props.type === 'BRASIL_UF' && estadoScopeRef.current === 'TODOS') {
          const ufInfo = BRASIL_UFS_INFO[props.uf];
          if (ufInfo) {
            setTooltipContent({
              title: `${ufInfo.nome} (${ufInfo.uf})`,
              subtitle: `Região ${ufInfo.regiao} · Capital: ${ufInfo.capital}`,
              extra: ufInfo.statusSig === 'INTEGRADO_COMPLETO'
                ? 'Base Integrada Completa · Clique para abrir dossiê'
                : ufInfo.statusSig === 'BASE_SIG_INTEGRADA'
                ? 'Base SIG MG/ES Integrada · Clique para abrir dossiê'
                : 'Malha Estadual IBGE · Clique para ver ficha'
            });
            if (overlayRef.current) overlayRef.current.setPosition(evt.coordinate);
            hit = true;
            return true;
          }
        }
        return false;
      });

      const targetEl = map.getTargetElement();
      if (targetEl) targetEl.style.cursor = hit ? 'pointer' : '';

      if (!hit && overlayRef.current) {
        overlayRef.current.setPosition(undefined);
      }
    });

    // Single click listener for feature selection
    map.on('singleclick', evt => {
      const pixel = evt.pixel;
      map.forEachFeatureAtPixel(pixel, feature => {
        const props = feature.getProperties();
        if (props.type === 'MGES_NODE') {
          onSelectMgEsRef.current(props.mgEsInfo as MgEsSelectedInfo);
          return true;
        } else if (props.type === 'CISP') {
          onSelectUnitRef.current(props.unitRecord as PoliceUnitRecord);
          return true;
        } else if (props.type === 'FACCAO_PRECISA') {
          const geom = feature.getGeometry() as Polygon;
          // Extract lon/lat ring from GeoJSON stored prop or transform back
          const origRing = props.origRing as [number, number][];
          if (origRing && origRing.length > 0) {
            selectPreciseFactionArea(props.n, props.f, origRing, false);
          } else if (geom) {
            selectPreciseFactionArea(props.n, props.f, [[-43.28, -22.86]], false);
          }
          return true;
        } else if (props.type === 'FOCO') {
          const foco = props.focoRecord as FocoEspecialArea;
          if (onSelectFocoRef.current) onSelectFocoRef.current(foco);
          const matching = allUnitsRef.current.find(u => u.cisp === foco.cisp);
          if (matching) onSelectUnitRef.current(matching);
          return true;
        } else if (props.tipo === 'CISP') {
          const matching = allUnitsRef.current.find(u => u.cisp === props.cisp);
          if (matching) {
            onSelectUnitRef.current(matching);
            return true;
          }
        } else if (props.tipo === 'AISP') {
          const matching = allUnitsRef.current.find(u => u.aisp === props.aisp);
          if (matching) onSelectUnitRef.current(matching);
          return true;
        } else if (props.type === 'BRASIL_UF') {
          const ufInfo = BRASIL_UFS_INFO[props.uf];
          if (ufInfo && onSelectUfRef.current) {
            onSelectUfRef.current(ufInfo);
            return true;
          }
        }
        return false;
      });
    });

    map.updateSize();
    const timer = setTimeout(() => map.updateSize(), 150);

    const resizeObserver = new ResizeObserver(() => map.updateSize());
    resizeObserver.observe(mapElementRef.current);

    mapInstanceRef.current = map;

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Map Source on toggle change
  useEffect(() => {
    if (!baseTileLayerRef.current) return;
    if (baseMapType === 'osm') {
      baseTileLayerRef.current.setSource(
        new OSM({ attributions: '© OpenStreetMap · OpenLayers v9.2.4' })
      );
    } else if (baseMapType === 'satellite') {
      baseTileLayerRef.current.setSource(
        new XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attributions: 'Esri Satellite · OpenLayers v9.2.4'
        })
      );
    } else {
      baseTileLayerRef.current.setSource(
        new XYZ({
          url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          attributions: 'CartoDB Dark · OpenLayers v9.2.4 · ISP-RJ'
        })
      );
    }
  }, [baseMapType]);

  // 2. Sync Layer Visibilities with Estado Scope, Filter State & Toggles
  useEffect(() => {
    const showRj = estadoScope === 'RJ' || estadoScope === 'TODOS';
    const showMgEs = estadoScope !== 'RJ';
    const showBr = estadoScope === 'TODOS' || showBrasilLayer;

    if (brasilLayerRef.current) {
      brasilLayerRef.current.setVisible(showBr);
    }
    if (cispPolyLayerRef.current) {
      const isVisible =
        showRj &&
        showCispPolys &&
        filters.camadaAtiva !== 'aisp' &&
        filters.camadaAtiva !== 'focoEspecial' &&
        filters.camadaAtiva !== 'faccoes';
      cispPolyLayerRef.current.setVisible(isVisible);
    }
    if (aispLayerRef.current) {
      const isVisible =
        showRj &&
        showAispLayer &&
        filters.camadaAtiva !== 'cisp' &&
        filters.camadaAtiva !== 'focoEspecial' &&
        filters.camadaAtiva !== 'faccoes';
      aispLayerRef.current.setVisible(isVisible);
    }
    if (cispLayerRef.current) {
      const isVisible =
        showRj &&
        showCispPoints &&
        filters.camadaAtiva !== 'aisp' &&
        filters.camadaAtiva !== 'focoEspecial' &&
        filters.camadaAtiva !== 'faccoes';
      cispLayerRef.current.setVisible(isVisible);
    }
    if (faccoesPrecisasLayerRef.current) {
      const isVisible =
        showRj && showFaccoesPrecisas && filters.camadaAtiva !== 'aisp' && filters.camadaAtiva !== 'cisp';
      faccoesPrecisasLayerRef.current.setVisible(isVisible);
    }
    if (focoLayerRef.current) {
      focoLayerRef.current.setVisible(false); // Replaced by the 1,695 accurate Dados de Riscos polygons!
    }
    if (mgEsLayerRef.current) {
      mgEsLayerRef.current.setVisible(showMgEs && showMgEsLayer);
    }
  }, [estadoScope, showBrasilLayer, showCispPolys, showAispLayer, showCispPoints, showFaccoesPrecisas, showMgEsLayer, filters.camadaAtiva]);

  // 2B. Render All 27 Brazilian States (Malha Estadual IBGE)
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
      const isSelected = selectedUf?.uf === uf;
      const isCurrentScope =
        estadoScope === uf || (estadoScope === 'MG_ES' && (uf === 'MG' || uf === 'ES')) || (estadoScope === 'TODOS' && (uf === 'RJ' || uf === 'MG' || uf === 'ES'));
      const info = BRASIL_UFS_INFO[uf];
      const status = info?.statusSig;

      const strokeColor = isSelected
        ? '#ffffff'
        : status === 'INTEGRADO_COMPLETO'
        ? '#38bdf8'
        : status === 'BASE_SIG_INTEGRADA'
        ? '#34d399'
        : '#64748b';

      const fillAlpha = isCurrentScope ? 0.04 : 0.0;

      feat.setStyle((_f, resolution) => {
        const showLabel = estadoScope === 'TODOS' && resolution > 400;
        return new Style({
          stroke: new Stroke({
            color: strokeColor,
            width: isSelected ? 3 : status !== 'MALHA_IBGE_DISPONIVEL' ? 2.2 : 1.4,
            lineDash: status === 'MALHA_IBGE_DISPONIVEL' ? [4, 3] : undefined
          }),
          fill: new Fill({
            color: hexToRgba(strokeColor, fillAlpha)
          }),
          text: showLabel
            ? new Text({
                text: uf,
                font: "bold 11px 'JetBrains Mono', monospace",
                fill: new Fill({ color: status !== 'MALHA_IBGE_DISPONIVEL' ? '#ffffff' : baseMapType === 'dark' ? '#cbd5e1' : '#1e293b' }),
                stroke: new Stroke({ color: status !== 'MALHA_IBGE_DISPONIVEL' ? '#020617' : baseMapType === 'dark' ? '#020617' : '#ffffff', width: 3 })
              })
            : undefined
        });
      });
    });

    source.addFeatures(features);
  }, [estadoScope, selectedUf, baseMapType]);

  // 3. Render CISP Contiguous Jurisdictions (137 Delegacias) with HIGH CONTRAST Borders & Labels
  useEffect(() => {
    const source = cispPolySourceRef.current;
    source.clear();

    const activeCisps = new Set(filteredUnits.map(u => u.cisp));
    const format = new GeoJSON();

    const features = format.readFeatures(CISP_GEOJSON, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });

    features.forEach(feat => {
      const cispNum = feat.get('cisp');
      const rispNum = feat.get('risp');
      const muni = feat.get('municipio') || '';
      const isFiltered = activeCisps.has(cispNum);
      const isSelected = selectedUnit?.cisp === cispNum;
      const baseColor = RISP_COLORS[rispNum] || '#0284c7';

      feat.setStyle((_f, resolution) => {
        const showLabel = resolution < 350; // Show CISP label when zoom >= ~9
        return new Style({
          stroke: new Stroke({
            color: isSelected ? '#0f172a' : isFiltered ? baseColor : '#64748b',
            width: isSelected ? 4 : isFiltered ? 2.4 : 1.1,
            lineDash: isSelected ? undefined : isFiltered ? [6, 3] : undefined
          }),
          fill: new Fill({
            color: hexToRgba(baseColor, isSelected ? 0.24 : isFiltered ? 0.08 : 0.02)
          }),
          text: showLabel && isFiltered
            ? new Text({
                text: `${cispNum}ª DP · ${muni}`,
                font: "bold 10px 'JetBrains Mono', monospace",
                fill: new Fill({ color: baseMapType === 'dark' ? '#e2e8f0' : '#0f172a' }),
                stroke: new Stroke({ color: baseMapType === 'dark' ? '#020617' : '#ffffff', width: 3 })
              })
            : undefined
        });
      });
    });

    source.addFeatures(features);
  }, [filteredUnits, selectedUnit, baseMapType]);

  // 4. Render AISP Polygons
  useEffect(() => {
    const source = aispSourceRef.current;
    source.clear();

    const activeAisps = new Set(filteredUnits.map(u => u.aisp));
    const format = new GeoJSON();

    const features = format.readFeatures(AISP_GEOJSON, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });

    features.forEach(feat => {
      const aispNum = feat.get('aisp');
      const rispNum = feat.get('risp');
      const isFiltered = activeAisps.has(aispNum);
      const isSelected = selectedUnit?.aisp === aispNum;
      const baseColor = RISP_COLORS[rispNum] || '#4f46e5';

      feat.setStyle(
        new Style({
          stroke: new Stroke({
            color: isSelected ? '#ffffff' : baseColor,
            width: isSelected ? 3.5 : isFiltered ? 2.4 : 1
          }),
          fill: new Fill({
            color: hexToRgba(baseColor, isSelected ? 0.34 : isFiltered ? 0.16 : 0.04)
          })
        })
      );
    });

    source.addFeatures(features);
  }, [filteredUnits, selectedUnit]);

  // 5. Render 1,695 Accurate RJ Faction Polygons (Dados de Riscos · base ago/2026)
  useEffect(() => {
    const source = faccoesPrecisasSourceRef.current;
    source.clear();

    const format = new GeoJSON();
    const featuresToAdd: Feature[] = [];

    // Sync filter dropdown (filters.faccao) + per-faction checkboxes
    const filterCode = filters.faccao;

    FACCAO_PRECISA_GEOJSON.features.forEach(rawFeat => {
      const code = rawFeat.properties.f;

      // Apply interactive legend toggle
      if (!visibleFactions[code]) return;

      // Apply FilterBar dropdown filter if active
      if (filterCode !== 'all') {
        if (filterCode === 'MILICIA') {
          if (code !== 'MIL' && code !== 'LJ' && code !== 'MNI') return;
        } else if (filterCode === 'SEM_REGISTRO') {
          if (code !== 'NEU') return;
        } else if (filterCode !== code) {
          return;
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

    // Dynamic Layer Style Function (super fast cached style + labels on zoom >= 12.2)
    faccoesPrecisasLayerRef.current.setStyle((feature: FeatureLike, resolution: number) => {
      const code = feature.get('f') as CodigoFaccaoPrecisa;
      const nome = feature.get('n') as string;
      const isSelected = selectedCommunityName === nome;
      const baseStyle = getFacStyle(code, isSelected);

      // Show crisp community name labels when zoomed in (resolution < 35m/px ~ zoom >= 12.2)
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

    source.addFeatures(featuresToAdd);
  }, [visibleFactions, filters.faccao, selectedCommunityName]);

  // 6. Render CISP / Delegacias Points
  useEffect(() => {
    const source = cispSourceRef.current;
    source.clear();

    const features: Feature<Point>[] = [];

    filteredUnits.forEach(unit => {
      const isSelected = selectedUnit?.cisp === unit.cisp;
      const rispColor = RISP_COLORS[unit.risp] || '#0284c7';

      const pointCoord = fromLonLat([unit.lng, unit.lat]);
      const feat = new Feature({
        geometry: new Point(pointCoord),
        type: 'CISP',
        unitRecord: unit
      });

      feat.setStyle(
        new Style({
          image: new CircleStyle({
            radius: isSelected ? 12.5 : 8.5,
            fill: new Fill({
              color: isSelected ? '#38bdf8' : '#0f172a'
            }),
            stroke: new Stroke({
              color: isSelected ? '#ffffff' : rispColor,
              width: isSelected ? 2.5 : 1.8
            })
          }),
          text: new Text({
            text: String(unit.cisp),
            font: `${isSelected ? 'bold 10.5px' : 'bold 8px'} 'JetBrains Mono', monospace`,
            fill: new Fill({
              color: isSelected ? '#020617' : '#ffffff'
            })
          })
        })
      );

      features.push(feat);
    });

    source.addFeatures(features);
  }, [filteredUnits, selectedUnit]);

  // 7. Render MG & ES Confirmed RISP Hubs & Regional Units
  useEffect(() => {
    const source = mgEsSourceRef.current;
    source.clear();
    if (estadoScope === 'RJ') return;

    const features: Feature<Point>[] = [];

    mgEsDivisao.forEach(row => {
      if (estadoScope === 'MG' && row.UF !== 'MG') return;
      if (estadoScope === 'ES' && row.UF !== 'ES') return;
      if (row.Lat_Ref == null || row.Lng_Ref == null) return;

      const isConfirmed = row.Status_Validacao === 'CONFIRMADO_ATO_OFICIAL';
      const isSelected =
        selectedMgEs?.divisao?.Codigo_IBGE_Municipio === row.Codigo_IBGE_Municipio &&
        selectedMgEs?.divisao?.ID_RISP === row.ID_RISP;

      const info: MgEsSelectedInfo = {
        uf: row.UF,
        titulo: `${row.ID_RISP}ª RISP — ${row.Nome_Municipio}`,
        subtitulo: row.Nome_Delegacia_PC,
        divisao: row
      };

      const feat = new Feature({
        geometry: new Point(fromLonLat([row.Lng_Ref, row.Lat_Ref])),
        type: 'MGES_NODE',
        mgEsInfo: info
      });

      feat.setStyle(
        new Style({
          image: new CircleStyle({
            radius: isSelected ? 14 : 10,
            fill: new Fill({
              color: isSelected ? '#38bdf8' : row.UF === 'ES' ? '#064e3b' : '#1e1b4b'
            }),
            stroke: new Stroke({
              color: isSelected ? '#ffffff' : isConfirmed ? '#34d399' : '#fbbf24',
              width: isSelected ? 3 : 2
            })
          }),
          text: new Text({
            text: `${row.UF} ${row.ID_RISP}`,
            font: "bold 9px 'JetBrains Mono', monospace",
            fill: new Fill({ color: '#ffffff' }),
            offsetY: -16,
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

      const isSelected = selectedMgEs?.unidade?.ID_Unidade === u.ID_Unidade;
      const info: MgEsSelectedInfo = {
        uf: u.UF,
        titulo: u.Nome_Oficial,
        subtitulo: `${u.Orgao} · ${u.Municipio}`,
        unidade: u
      };

      const feat = new Feature({
        geometry: new Point(fromLonLat([u.Longitude, u.Latitude])),
        type: 'MGES_NODE',
        mgEsInfo: info
      });

      feat.setStyle(
        new Style({
          image: new CircleStyle({
            radius: isSelected ? 11 : 7.5,
            fill: new Fill({ color: isSelected ? '#ffffff' : '#0284c7' }),
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
  }, [estadoScope, mgEsDivisao, mgEsUnidades, selectedMgEs]);

  // 8. Auto-frame View when estadoScope changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const view = mapInstanceRef.current.getView();
    if (estadoScope === 'TODOS') {
      view.animate({ center: fromLonLat([-43.3, -20.4]), zoom: 6.3, duration: 600 });
    } else if (estadoScope === 'RJ') {
      view.animate({ center: fromLonLat([-43.28, -22.86]), zoom: 10.3, duration: 600 });
    } else if (estadoScope === 'MG') {
      view.animate({ center: fromLonLat([-44.38, -18.80]), zoom: 6.4, duration: 600 });
    } else if (estadoScope === 'ES') {
      view.animate({ center: fromLonLat([-40.45, -19.85]), zoom: 7.7, duration: 600 });
    } else {
      view.animate({ center: fromLonLat([-42.80, -19.20]), zoom: 6.2, duration: 600 });
    }
  }, [estadoScope]);

  // 9. Fly to focusTarget triggered from SIG Base Table
  useEffect(() => {
    if (!focusTarget || !mapInstanceRef.current) return;
    mapInstanceRef.current.getView().animate({
      center: fromLonLat([focusTarget.lng, focusTarget.lat]),
      zoom: focusTarget.zoom || 11.5,
      duration: 600
    });
  }, [focusTarget]);

  // 10. Smooth View Animation when Selected Unit changes from FilterBar/Stats
  const prevUnitCispRef = useRef<number | null>(null);
  useEffect(() => {
    if (!selectedUnit || !mapInstanceRef.current || (estadoScope !== 'RJ' && estadoScope !== 'TODOS')) return;
    // Skip fly if clicking a community already zoomed into that CISP
    if (prevUnitCispRef.current === selectedUnit.cisp) return;
    prevUnitCispRef.current = selectedUnit.cisp;
    mapInstanceRef.current.getView().animate({
      center: fromLonLat([selectedUnit.lng, selectedUnit.lat]),
      zoom: 12.6,
      duration: 500
    });
  }, [selectedUnit, estadoScope]);

  const handleResetView = (macro = false) => {
    if (!mapInstanceRef.current) return;
    const view = mapInstanceRef.current.getView();
    if (estadoScope === 'TODOS') {
      view.animate({ center: fromLonLat([-43.3, -20.4]), zoom: 6.3, duration: 600 });
    } else if (estadoScope === 'MG') {
      view.animate({ center: fromLonLat([-44.38, -18.80]), zoom: 6.4, duration: 600 });
    } else if (estadoScope === 'ES') {
      view.animate({ center: fromLonLat([-40.45, -19.85]), zoom: 7.7, duration: 600 });
    } else if (estadoScope === 'MG_ES') {
      view.animate({ center: fromLonLat([-42.80, -19.20]), zoom: 6.2, duration: 600 });
    } else if (macro) {
      view.animate({ center: fromLonLat([-43.10, -22.50]), zoom: 8.5, duration: 600 });
    } else {
      view.animate({ center: fromLonLat([-43.28, -22.86]), zoom: 10.3, duration: 600 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 bg-slate-950 overflow-hidden">
      {/* OpenLayers Map Canvas Container */}
      <div ref={mapElementRef} className="absolute inset-0 w-full h-full" style={{ minHeight: '500px' }} />

      {/* OpenLayers HTML Tooltip Overlay DOM element */}
      <div ref={tooltipElementRef} className="ol-popup-tooltip">
        {tooltipContent && (
          <div className="text-xs">
            <div className="font-bold text-white flex items-center gap-1.5">
              {tooltipContent.color && (
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: tooltipContent.color }} />
              )}
              <span>{tooltipContent.title}</span>
            </div>
            <div className="text-[11px] text-sky-400 mt-0.5">{tooltipContent.subtitle}</div>
            {tooltipContent.extra && (
              <div className="text-[10px] text-slate-400 mt-0.5 max-w-[260px] truncate">
                {tooltipContent.extra}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Map Controls & Layer Selector */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-[280px]">
        {/* Quick Jump Selector across Integrated States (RJ, MG, ES) */}
        {estadoScope === 'TODOS' && (
          <div className="bg-slate-950/95 backdrop-blur border border-slate-700/80 rounded-lg p-2 shadow-xl text-xs">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-sky-400 mb-1">
              Selecionar Estado Integrado (3 UFs)
            </label>
            <select
              value={selectedUf?.uf || ''}
              onChange={e => {
                const uf = e.target.value;
                const info = BRASIL_UFS_INFO[uf];
                if (info) {
                  if (onSelectUf) onSelectUf(info);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.getView().animate({
                      center: fromLonLat([info.lng, info.lat]),
                      zoom: info.zoom,
                      duration: 600
                    });
                  }
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="">Escolher UF para enquadrar...</option>
              {BRASIL_UFS_LIST.map(u => (
                <option key={u.uf} value={u.uf}>
                  {u.uf} · {u.nome} ({u.statusSig === 'INTEGRADO_COMPLETO' ? 'Integrado RJ' : 'SIG MG/ES'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Direct Search across 1,695 Communities (RJ / TODOS) */}
        {(estadoScope === 'RJ' || estadoScope === 'TODOS') && (
          <div className="bg-slate-950/95 backdrop-blur border border-slate-700/80 rounded-lg shadow-xl text-xs">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-sky-400 absolute left-2.5" />
              <input
                type="text"
                value={communityQuery}
                onChange={e => setCommunityQuery(e.target.value)}
                placeholder="Buscar comunidade RJ (1.695 áreas)..."
                className="w-full bg-transparent text-white pl-8 pr-7 py-2 text-xs focus:outline-none placeholder:text-slate-500"
              />
              {communityQuery && (
                <button
                  onClick={() => setCommunityQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {communityHits.length > 0 && (
              <div className="max-h-48 overflow-y-auto border-t border-slate-800 divide-y divide-slate-800/60">
                {communityHits.map((hit, i) => {
                  const meta = FAC_CATALOG[hit.f];
                  return (
                    <button
                      key={`${hit.nome}-${i}`}
                      onClick={() => {
                        selectPreciseFactionArea(hit.nome, hit.f, hit.ring, true);
                        setCommunityQuery('');
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-slate-900 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                        <span className="text-white font-medium truncate">{hit.nome}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{meta.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Basemap Switcher */}
        <div className="bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-1.5 shadow-xl text-xs flex items-center gap-1">
          <div className="flex items-center gap-1 text-slate-400 font-semibold px-1">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
          </div>

          <button
            onClick={() => setBaseMapType('osm')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              baseMapType === 'osm' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            OSM
          </button>

          <button
            onClick={() => setBaseMapType('dark')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              baseMapType === 'dark' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Escuro
          </button>

          <button
            onClick={() => setBaseMapType('satellite')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              baseMapType === 'satellite'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            Satélite
          </button>
        </div>

        {/* Layer Panel */}
        <div className="bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 shadow-xl text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between text-slate-300 font-semibold pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Camadas ({estadoScope === 'TODOS' ? 'RJ+MG+ES' : estadoScope === 'MG_ES' ? 'MG+ES' : estadoScope})
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={estadoScope === 'TODOS' ? true : showBrasilLayer}
              disabled={estadoScope === 'TODOS'}
              onChange={e => setShowBrasilLayer(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span className="flex-1">Limites Estaduais (RJ·MG·ES)</span>
            <span className="w-2.5 h-2.5 rounded-sm border border-slate-400 bg-slate-700/40" />
          </label>

          {(estadoScope === 'RJ' || estadoScope === 'TODOS') && (
            <>
              <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showFaccoesPrecisas}
                  onChange={e => setShowFaccoesPrecisas(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0"
                />
                <span className="flex-1 font-semibold text-white">Facções Precisas RJ (1.695 áreas)</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E0342C]" />
              </label>

              <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCispPolys}
                  onChange={e => setShowCispPolys(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span className="flex-1">Demarcação CISP RJ (137 DPs)</span>
                <span className="w-2.5 h-2.5 rounded-sm border border-sky-400 bg-sky-500/30" />
              </label>

              <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAispLayer}
                  onChange={e => setShowAispLayer(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
                />
                <span className="flex-1">Limites AISP RJ (Batalhões)</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              </label>

              <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCispPoints}
                  onChange={e => setShowCispPoints(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span className="flex-1">Sedes das Delegacias RJ (DP)</span>
                <span className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-slate-900" />
              </label>
            </>
          )}

          {estadoScope !== 'RJ' && (
            <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showMgEsLayer}
                onChange={e => setShowMgEsLayer(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
              <span className="flex-1 font-semibold text-white">Sedes RISP & Regionais (MG·ES)</span>
              <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 bg-slate-900" />
            </label>
          )}
        </div>

        {/* Quick Map Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleResetView(false)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950/90 backdrop-blur hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-md text-[11px] shadow-md transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {estadoScope === 'TODOS'
                ? 'RJ + MG + ES'
                : estadoScope === 'RJ'
                ? 'Metrópole'
                : `Enquadrar ${estadoScope === 'MG_ES' ? 'MG+ES' : estadoScope}`}
            </span>
          </button>

          {estadoScope === 'RJ' && (
            <button
              onClick={() => handleResetView(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950/90 backdrop-blur hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-md text-[11px] shadow-md transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Todo RJ</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Faction Legend (RJ / TODOS) or MG-ES Legend */}
      <div className="absolute bottom-4 left-3 z-10 bg-slate-950/95 backdrop-blur border border-slate-800 rounded-lg p-2.5 shadow-xl text-[11px] hidden sm:block w-64">
        <div className="font-semibold text-slate-300 mb-1.5 flex items-center justify-between gap-2 pb-1 border-b border-slate-800">
          <span>
            {estadoScope === 'RJ' || estadoScope === 'TODOS'
              ? 'Facções Mapeadas RJ (1.695 áreas)'
              : 'Status Territorial (MG / ES)'}
          </span>
          <span className="text-[9px] font-mono text-slate-500">
            {estadoScope === 'RJ' || estadoScope === 'TODOS' ? 'ago/2026' : 'SIG'}
          </span>
        </div>

        {estadoScope === 'RJ' || estadoScope === 'TODOS' ? (
          <div className="space-y-1">
            {FAC_ORDER.map(code => {
              const meta = FAC_CATALOG[code];
              const isOn = visibleFactions[code];
              return (
                <label
                  key={code}
                  className={`flex items-center gap-2 cursor-pointer select-none py-0.5 transition-opacity ${
                    isOn ? 'text-slate-200' : 'text-slate-500 opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={e =>
                      setVisibleFactions(prev => ({
                        ...prev,
                        [code]: e.target.checked
                      }))
                    }
                    className="rounded bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span
                    className="w-3 h-3 rounded-sm shrink-0 border"
                    style={{ backgroundColor: hexToRgba(meta.color, 0.45), borderColor: meta.color }}
                  />
                  <span className="flex-1 truncate">{meta.label}</span>
                  <span className="font-mono text-[10px] text-slate-400 tabular-nums">{FACCAO_COUNTS[code]}</span>
                </label>
              );
            })}
            <div className="pt-1.5 mt-1 border-t border-slate-800 text-[9.5px] text-slate-500 flex items-center justify-between">
              <span>Fonte: Dados de Riscos (Público)</span>
              <a
                href="https://dadosderiscos.com.br/mapa-rj-risco-faccoes.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline"
              >
                Referência
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-emerald-400 bg-emerald-950" />
              <span>Ato Oficial Confirmado (RISP / Regional)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-amber-400 bg-indigo-950" />
              <span>Sede Confirmada (Subordinados pendentes)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-white bg-sky-600" />
              <span>Unidade Física PCMG / PCES (Tabela B)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
