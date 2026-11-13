import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { BasemapType, ChoroplethMetric, LayerVisibility, SelectedFeatureData, TerritorialRegistry } from '../types';

interface MapContainerProps {
  registry: TerritorialRegistry | null;
  layers: LayerVisibility;
  basemap: BasemapType;
  selectedCispId: number | null;
  onSelectFeature: (data: SelectedFeatureData) => void;
  mapRefOut?: React.MutableRefObject<Map | null>;
  choroplethMetric: ChoroplethMetric;
  layerOpacity: number;
  selectedYear: number;
  selectedFactionFilter?: string;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  registry,
  layers,
  basemap,
  selectedCispId,
  onSelectFeature,
  mapRefOut,
  choroplethMetric,
  layerOpacity,
  selectedYear,
  selectedFactionFilter = ''
}) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);

  // Dynamic Refs for real-time styling without recreating map
  const choroplethMetricRef = useRef(choroplethMetric);
  const layerOpacityRef = useRef(layerOpacity);
  const selectedYearRef = useRef(selectedYear);
  const selectedCispIdRef = useRef(selectedCispId);
  const selectedFactionFilterRef = useRef(selectedFactionFilter);
  const registryRef = useRef(registry);

  useEffect(() => { choroplethMetricRef.current = choroplethMetric; }, [choroplethMetric]);
  useEffect(() => { layerOpacityRef.current = layerOpacity; }, [layerOpacity]);
  useEffect(() => { selectedYearRef.current = selectedYear; }, [selectedYear]);
  useEffect(() => { selectedCispIdRef.current = selectedCispId; }, [selectedCispId]);
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
  useEffect(() => { registryRef.current = registry; }, [registry]);

  // Layer references
  const basemapOsmRef = useRef<TileLayer<OSM> | null>(null);
  const basemapVoyagerRef = useRef<TileLayer<XYZ> | null>(null);
  const basemapSatRef = useRef<TileLayer<XYZ> | null>(null);
  const basemapStreetsRef = useRef<TileLayer<XYZ> | null>(null);

  const rispVectorRef = useRef<VectorLayer<any> | null>(null);
  const aispVectorRef = useRef<VectorLayer<any> | null>(null);
  const cispVectorRef = useRef<VectorLayer<any> | null>(null);
  const focosVectorRef = useRef<VectorLayer<any> | null>(null);
  const delegaciasVectorRef = useRef<VectorLayer<any> | null>(null);
  const batalhoesVectorRef = useRef<VectorLayer<any> | null>(null);

  // Hover Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    sub: string;
    type: string;
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

    // Basemaps - Luminous, Colorful, Real Maps (Zero Watermarks, 100% Reliable)
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: basemap === 'osm'
    });

    // Carto Voyager - Clean, Vibrant, Modern Color GIS Basemap
    const voyagerLayer = new TileLayer({
      source: new XYZ({
        url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        attributions: '© CARTO Voyager / OpenStreetMap'
      }),
      visible: basemap === 'voyager'
    });

    // Real High-Resolution Aerial Satellite Photography (Esri World Imagery)
    const satLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: '© Esri World Imagery'
      }),
      visible: basemap === 'satellite'
    });

    // Detailed Street & Road Map (Avenues, Neighborhoods & Landmarks)
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

    // 1. RISP Vector Layer
    const rispSource = new VectorSource({
      url: '/data/risp.geojson',
      format: new GeoJSON()
    });
    const rispLayer = new VectorLayer({
      source: rispSource,
      visible: layers.risp,
      style: (feature) => {
        const id = feature.get('id');
        const colors: Record<number, string> = {
          1: 'rgba(59, 130, 246, 0.15)',
          2: 'rgba(16, 185, 129, 0.15)',
          3: 'rgba(245, 158, 11, 0.15)',
          4: 'rgba(139, 92, 246, 0.15)',
          5: 'rgba(236, 72, 153, 0.15)',
          6: 'rgba(6, 182, 212, 0.15)',
          7: 'rgba(225, 29, 72, 0.15)'
        };
        const borderColors: Record<number, string> = {
          1: '#3b82f6', 2: '#10b981', 3: '#f59e0b', 4: '#8b5cf6', 5: '#ec4899', 6: '#06b6d4', 7: '#e11d48'
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
    const aispSource = new VectorSource({
      url: '/data/aisp.geojson',
      format: new GeoJSON()
    });
    const aispLayer = new VectorLayer({
      source: aispSource,
      visible: layers.aisp,
      style: (feature) => {
        return new Style({
          fill: new Fill({ color: 'rgba(245, 158, 11, 0.08)' }),
          stroke: new Stroke({
            color: '#f59e0b',
            width: 1.8
          })
        });
      }
    });
    aispVectorRef.current = aispLayer;

    // 3. CISP Vector Layer - Polígonos das Delegacias com Rótulo do Número
    const cispSource = new VectorSource({
      url: '/data/cisp.geojson',
      format: new GeoJSON()
    });
    const cispLayer = new VectorLayer({
      source: cispSource,
      visible: layers.cisp,
      style: (feature) => {
        const cispNum = feature.get('cisp');
        const isSelected = selectedCispIdRef.current === cispNum;
        const opacity = layerOpacityRef.current;
        const metric = choroplethMetricRef.current;
        const year = selectedYearRef.current;
        const reg = registryRef.current;

        let fillColor = isSelected ? `rgba(59, 130, 246, ${Math.min(0.9, opacity + 0.3)})` : `rgba(30, 58, 138, ${opacity})`;
        let strokeColor = isSelected ? '#93c5fd' : 'rgba(96, 165, 250, 0.6)';

        if (reg && reg.cisps[cispNum]) {
          const rec = reg.cisps[cispNum];

          if (metric === 'faccao') {
            const faccao = rec.dinamica_territorial?.faccao || '';
            const factionFilter = selectedFactionFilterRef.current;
            const matchesFilter = !factionFilter || factionFilter === 'all' ||
              (factionFilter === 'CV' && faccao.includes('CV')) ||
              (factionFilter === 'TCP' && faccao.includes('TCP')) ||
              (factionFilter === 'Milícia' && faccao.includes('Milícia')) ||
              (factionFilter === 'Disputa' && (faccao.includes('Disputa') || faccao.includes('x'))) ||
              (factionFilter === 'Controle' && (faccao.includes('Controle') || faccao.includes('Sem Domínio')));

            const activeOpacity = matchesFilter ? Math.max(0.45, opacity) : 0.12;

            if (faccao.includes('CV')) {
              fillColor = `rgba(239, 68, 68, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#ef4444' : 'rgba(239, 68, 68, 0.2)';
            } else if (faccao.includes('TCP')) {
              fillColor = `rgba(59, 130, 246, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)';
            } else if (faccao.includes('Milícia')) {
              fillColor = `rgba(168, 85, 247, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#a855f7' : 'rgba(168, 85, 247, 0.2)';
            } else if (faccao.includes('Disputa') || faccao.includes('x')) {
              fillColor = `rgba(249, 115, 22, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#f97316' : 'rgba(249, 115, 22, 0.2)';
            } else {
              fillColor = `rgba(16, 185, 129, ${activeOpacity})`;
              strokeColor = matchesFilter ? '#10b981' : 'rgba(16, 185, 129, 0.2)';
            }
          } else if (metric !== 'none') {
            const stats = rec.indicadores.historico[year] || rec.indicadores.atual_2025;
            const val = stats[metric as keyof typeof stats] || 0;

            if (metric === 'letalidade_violenta') {
              if (val <= 10) fillColor = `rgba(16, 185, 129, ${opacity})`;
              else if (val <= 20) fillColor = `rgba(234, 179, 8, ${opacity})`;
              else if (val <= 35) fillColor = `rgba(249, 115, 22, ${opacity})`;
              else if (val <= 50) fillColor = `rgba(239, 68, 68, ${opacity})`;
              else fillColor = `rgba(127, 29, 29, ${opacity})`;
            } else if (metric === 'roubo_rua') {
              if (val <= 100) fillColor = `rgba(16, 185, 129, ${opacity})`;
              else if (val <= 250) fillColor = `rgba(234, 179, 8, ${opacity})`;
              else if (val <= 450) fillColor = `rgba(249, 115, 22, ${opacity})`;
              else fillColor = `rgba(239, 68, 68, ${opacity})`;
            } else if (metric === 'roubo_carga') {
              if (val <= 3) fillColor = `rgba(16, 185, 129, ${opacity})`;
              else if (val <= 10) fillColor = `rgba(234, 179, 8, ${opacity})`;
              else if (val <= 20) fillColor = `rgba(249, 115, 22, ${opacity})`;
              else fillColor = `rgba(239, 68, 68, ${opacity})`;
            } else if (metric === 'roubo_veiculo') {
              if (val <= 30) fillColor = `rgba(16, 185, 129, ${opacity})`;
              else if (val <= 80) fillColor = `rgba(234, 179, 8, ${opacity})`;
              else if (val <= 160) fillColor = `rgba(249, 115, 22, ${opacity})`;
              else fillColor = `rgba(239, 68, 68, ${opacity})`;
            } else if (metric === 'fuzis_apreendidos') {
              if (val <= 1) fillColor = `rgba(16, 185, 129, ${opacity})`;
              else if (val <= 4) fillColor = `rgba(234, 179, 8, ${opacity})`;
              else if (val <= 8) fillColor = `rgba(249, 115, 22, ${opacity})`;
              else fillColor = `rgba(239, 68, 68, ${opacity})`;
            }
          }
        }

        if (isSelected) {
          strokeColor = '#ffffff';
        }

        return new Style({
          fill: new Fill({ color: fillColor }),
          stroke: new Stroke({
            color: strokeColor,
            width: isSelected ? 2.8 : 1.2
          }),
          text: new Text({
            text: `${cispNum}ª DP`,
            font: isSelected ? 'bold 12px sans-serif' : 'bold 9.5px sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#090d16', width: 3 }),
            overflow: true
          }),
          zIndex: isSelected ? 25 : 2
        });
      }
    });
    cispVectorRef.current = cispLayer;

    // 4. Focos Especiais Vector Layer
    const focosSource = new VectorSource({
      url: '/data/focos_especiais.geojson',
      format: new GeoJSON()
    });
    const focosLayer = new VectorLayer({
      source: focosSource,
      visible: layers.focos,
      style: (feature) => {
        const cor = feature.get('cor') || '#ef4444';
        return new Style({
          fill: new Fill({ color: cor + '55' }),
          stroke: new Stroke({
            color: cor,
            width: 2.5
          }),
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

    // 5. Delegacias Points com o Número Oficial da Delegacia
    const delegaciasSource = new VectorSource({
      url: '/data/delegacias.geojson',
      format: new GeoJSON()
    });
    const delegaciasLayer = new VectorLayer({
      source: delegaciasSource,
      visible: layers.delegacias,
      style: (feature) => {
        const cispNum = feature.get('cisp');
        const isSelected = selectedCispIdRef.current === cispNum;
        return new Style({
          image: new CircleStyle({
            radius: isSelected ? 16 : 13,
            fill: new Fill({ color: isSelected ? '#2563eb' : '#0f172a' }),
            stroke: new Stroke({ 
              color: isSelected ? '#93c5fd' : '#38bdf8', 
              width: isSelected ? 3.5 : 2.5 
            })
          }),
          text: new Text({
            text: String(cispNum),
            font: isSelected ? 'bold 12px Arial, sans-serif' : 'bold 10px Arial, sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#020617', width: 2.5 }),
            textAlign: 'center',
            textBaseline: 'middle',
            offsetY: 0
          }),
          zIndex: isSelected ? 999 : 50
        });
      }
    });
    delegaciasVectorRef.current = delegaciasLayer;

    // 6. Batalhões Points com o Número do Batalhão
    const batalhoesSource = new VectorSource({
      url: '/data/batalhoes.geojson',
      format: new GeoJSON()
    });
    const batalhoesLayer = new VectorLayer({
      source: batalhoesSource,
      visible: layers.batalhoes,
      style: (feature) => {
        const aispNum = feature.get('aisp');
        return new Style({
          image: new CircleStyle({
            radius: 13,
            fill: new Fill({ color: '#0891b2' }),
            stroke: new Stroke({ color: '#ffffff', width: 2 })
          }),
          text: new Text({
            text: `${aispNum}º`,
            font: 'bold 10px Arial, sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            textAlign: 'center',
            textBaseline: 'middle',
            offsetY: 0
          }),
          zIndex: 40
        });
      }
    });
    batalhoesVectorRef.current = batalhoesLayer;

    // Initial View centered on Rio de Janeiro State (-43.20, -22.90)
    const view = new View({
      center: fromLonLat([-43.25, -22.75]),
      zoom: 9.3,
      minZoom: 7.5,
      maxZoom: 18
    });

    const map = new Map({
      target: mapElement.current,
      layers: [
        osmLayer,
        voyagerLayer,
        satLayer,
        streetsLayer,
        rispLayer,
        aispLayer,
        cispLayer,
        focosLayer,
        delegaciasLayer,
        batalhoesLayer
      ],
      view: view,
      controls: []
    });

    mapInstance.current = map;
    if (mapRefOut) {
      mapRefOut.current = map;
    }

    // Single Click Handler
    map.on('singleclick', (evt) => {
      let featureFound = false;

      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (featureFound) return;
        const props = feature.getProperties();
        const tipo = props.tipo;

        if (tipo === 'FOCO_ESPECIAL') {
          featureFound = true;
          onSelectFeature({
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
        } else if (tipo === 'CISP') {
          featureFound = true;
          const cispNum = props.cisp;
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

          onSelectFeature({
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
        } else if (tipo === 'AISP') {
          featureFound = true;
          const aispNum = props.aisp;
          const reg = registryRef.current;
          const info = reg?.aisps[aispNum];
          onSelectFeature({
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
        } else if (tipo === 'RISP') {
          featureFound = true;
          const rispId = props.id;
          const reg = registryRef.current;
          const info = reg?.risps[rispId];
          onSelectFeature({
            tipo: 'RISP',
            id: rispId,
            risp: rispId,
            nome: props.nome,
            comando: props.cpa,
            areakm2: props.areakm2
          });
        } else if (tipo === 'DELEGACIA') {
          featureFound = true;
          const cispNum = props.cisp;
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

          onSelectFeature({
            tipo: 'DELEGACIA',
            id: cispNum,
            cisp: cispNum,
            nome: regRecord?.nome_oficial || props.nome,
            batalhao: props.batalhao,
            municipio: props.municipio,
            endereco: regRecord?.endereco || props.endereco,
            telefone: regRecord?.telefone || props.telefone,
            bairros: bairrosList || [],
            indicadores: regRecord?.indicadores,
            dinamica_territorial: regRecord?.dinamica_territorial
          });
        } else if (tipo === 'BATALHAO') {
          featureFound = true;
          const aispNum = props.aisp;
          onSelectFeature({
            tipo: 'BATALHAO',
            id: aispNum,
            aisp: aispNum,
            nome: props.nome,
            municipio: props.municipio,
            endereco: props.endereco,
            risp: props.risp
          });
        }
      });
    });

    // Pointer Move / Hover Tooltip Handler
    map.on('pointermove', (evt) => {
      if (evt.dragging) {
        setTooltip(prev => ({ ...prev, visible: false }));
        return;
      }

      let hit = false;
      map.forEachFeatureAtPixel(evt.pixel, (feature) => {
        if (hit) return;
        const props = feature.getProperties();
        if (props.nome || props.cisp_formatado) {
          hit = true;
          const title = props.cisp_formatado 
            ? `${props.cisp_formatado} - ${props.nome}` 
            : props.nome;
          const sub = props.municipio 
            ? `${props.municipio} • ${props.batalhao || ''}` 
            : `${props.tipo || ''}`;

          setTooltip({
            visible: true,
            x: evt.pixel[0] + 12,
            y: evt.pixel[1] + 12,
            title: title,
            sub: sub,
            type: props.tipo || 'TERRITORIO'
          });
        }
      });

      if (!hit) {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    const resizeObserver = new ResizeObserver(() => {
      map.updateSize();
    });
    if (mapElement.current) {
      resizeObserver.observe(mapElement.current);
    }

    setTimeout(() => {
      map.updateSize();
    }, 150);

    return () => {
      resizeObserver.disconnect();
      map.setTarget(undefined);
    };
  }, []);

  // Update Basemap Visibility
  useEffect(() => {
    if (basemapOsmRef.current) basemapOsmRef.current.setVisible(basemap === 'osm');
    if (basemapVoyagerRef.current) basemapVoyagerRef.current.setVisible(basemap === 'voyager');
    if (basemapSatRef.current) basemapSatRef.current.setVisible(basemap === 'satellite');
    if (basemapStreetsRef.current) basemapStreetsRef.current.setVisible(basemap === 'streets');
  }, [basemap]);

  // Update Vector Layers Visibility
  useEffect(() => {
    if (rispVectorRef.current) rispVectorRef.current.setVisible(layers.risp);
    if (aispVectorRef.current) aispVectorRef.current.setVisible(layers.aisp);
    if (cispVectorRef.current) cispVectorRef.current.setVisible(layers.cisp);
    if (focosVectorRef.current) focosVectorRef.current.setVisible(layers.focos);
    if (delegaciasVectorRef.current) delegaciasVectorRef.current.setVisible(layers.delegacias);
    if (batalhoesVectorRef.current) batalhoesVectorRef.current.setVisible(layers.batalhoes);
  }, [layers]);

  // Re-style CISP and Delegacias when selection, choropleth, opacity, year or faction filter changes
  useEffect(() => {
    if (cispVectorRef.current) {
      cispVectorRef.current.changed();
    }
    if (delegaciasVectorRef.current) {
      delegaciasVectorRef.current.changed();
    }
  }, [selectedCispId, choroplethMetric, layerOpacity, selectedYear, selectedFactionFilter]);

  // Fly to CISP centroid if selected
  useEffect(() => {
    if (selectedCispId && registry && mapInstance.current) {
      const rec = registry.cisps[selectedCispId];
      if (rec && rec.centroide) {
        const view = mapInstance.current.getView();
        view.animate({
          center: fromLonLat(rec.centroide),
          zoom: 12.8,
          duration: 900
        });
      }
    }
  }, [selectedCispId, registry]);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      {/* OpenLayers Map Canvas */}
      <div ref={mapElement} className="w-full h-full" />

      {/* Floating Faction Map On-Screen Legend */}
      {choroplethMetric === 'faccao' && (
        <div className="absolute top-4 right-4 z-20 bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 max-w-[220px]">
          <div className="font-bold text-slate-100 flex items-center justify-between pb-1 border-b border-slate-800">
            <span>Mapa das Facções</span>
            <span className="text-[10px] text-red-400 font-mono">RJ GIS</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-200">
            <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-300 shrink-0" />
            <span className="font-semibold">Comando Vermelho (CV)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-200">
            <span className="w-3.5 h-3.5 rounded bg-blue-500 border border-blue-300 shrink-0" />
            <span className="font-semibold">Terceiro Comando (TCP)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-200">
            <span className="w-3.5 h-3.5 rounded bg-purple-500 border border-purple-300 shrink-0" />
            <span className="font-semibold">Milícia Paramilitar</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-200">
            <span className="w-3.5 h-3.5 rounded bg-orange-500 border border-orange-300 shrink-0" />
            <span className="font-semibold">Área em Disputa Bélica</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-200">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-300 shrink-0" />
            <span className="font-semibold">Controle Institucional</span>
          </div>
          <div className="pt-1 text-[9px] text-slate-400 border-t border-slate-800/80">
            Fontes: GENI-UFF • Fogo Cruzado • GAECO MP-RJ
          </div>
        </div>
      )}

      {/* Floating Tactical Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none z-30 px-3 py-1.5 bg-slate-900/95 border border-blue-500/50 rounded-lg shadow-xl text-slate-100 text-xs backdrop-blur-sm max-w-xs transition-all duration-75"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono font-bold uppercase">
              {tooltip.type}
            </span>
            <span className="font-semibold text-slate-100 truncate">{tooltip.title}</span>
          </div>
          {tooltip.sub && (
            <div className="text-[11px] text-slate-400 truncate">{tooltip.sub}</div>
          )}
        </div>
      )}

      {/* Map Attribution and Coordinates overlay */}
      <div className="absolute bottom-2 left-2 bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none flex items-center gap-2">
        <span>EPSG:3857 (WGS84 Web Mercator)</span>
        <span>•</span>
        <span className="text-blue-400 font-medium">ISP-RJ • SEPM • PCERJ</span>
      </div>
    </div>
  );
};
