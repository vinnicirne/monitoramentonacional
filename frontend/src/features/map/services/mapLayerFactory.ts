import type { MutableRefObject } from 'react';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Heatmap from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import type { BasemapType, ChoroplethMetric, LayerVisibility, TerritorialRegistry } from '../../../types';
import type { CorporateIncidentGroup } from './corporateIncidentFeatures';

interface MapLayerFactoryOptions {
  basemap: BasemapType;
  layers: LayerVisibility;
  sources: {
    brasil: VectorSource;
    preciseFactions: VectorSource;
    mgEs: VectorSource;
    address: VectorSource;
    userLocation: VectorSource;
    corporateIncidents: VectorSource;
  };
  selectedCispIdRef: MutableRefObject<number | null>;
  layerOpacityRef: MutableRefObject<number>;
  choroplethMetricRef: MutableRefObject<ChoroplethMetric>;
  registryRef: MutableRefObject<TerritorialRegistry | null>;
  selectedFactionFilterRef: MutableRefObject<string>;
}

export function createMapLayerBundle({
  basemap,
  layers,
  sources,
  selectedCispIdRef,
  layerOpacityRef,
  choroplethMetricRef,
  registryRef,
  selectedFactionFilterRef
}: MapLayerFactoryOptions) {
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


    // 0. Brasil 27 UFs Vector Layer
    const brasilLayer = new VectorLayer({
      source: sources.brasil,
      visible: layers.brasilEstados,
      zIndex: 0
    });

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
        const year = 2025;
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

    // 4. Precise 1,695 Faction Polygons Layer (Dados de Riscos · ago/2026)
    const faccoesPrecisasLayer = new VectorLayer({
      source: sources.preciseFactions,
      visible: layers.faccoesPrecisas,
      zIndex: 4
    });

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
            fill: new Fill({ color: isSelected ? '#3483FA' : '#2D3277' }),
            stroke: new Stroke({
              color: isSelected ? '#FFE600' : '#ffffff',
              width: isSelected ? 3.2 : 2
            })
          }),
          text: new Text({
            text: String(cispNum),
            font: isSelected ? 'bold 11px Arial, sans-serif' : 'bold 9px Arial, sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            stroke: new Stroke({ color: '#1E2258', width: 2.5 }),
            textAlign: 'center',
            textBaseline: 'middle'
          })
        });
      }
    });

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

    // 8. MG & ES SIG Layer
    const mgEsLayer = new VectorLayer({
      source: sources.mgEs,
      visible: layers.mgEs,
      zIndex: 8
    });

    // 9. Searched Address Marker Layer
    const addressMarkerLayer = new VectorLayer({
      source: sources.address,
      zIndex: 10
    });

    // 10. Real-Time User GPS Location Layer
    const userLocationLayer = new VectorLayer({
      source: sources.userLocation,
      zIndex: 11
    });

    // 11. Corporate Incidents Heatmap Layer (confidential to company)
    const corporateHeatmapLayer = new Heatmap({
      source: sources.corporateIncidents,
      blur: 24,
      radius: 18,
      weight: feature => {
        const incType = feature.get('incidentType');
        if (incType === 'roubo_carga') return 1.0;
        if (incType === 'roubo') return 0.9;
        if (incType === 'furto') return 0.7;
        if (incType === 'fraude') return 0.6;
        if (incType === 'ameaca') return 0.65;
        if (incType === 'apreensao') return 0.5;
        return 0.5;
      },
      visible: layers.corporateHeatmap !== false,
      zIndex: 9
    });

    // 12. Corporate incident counts by district
    const countStyles = new Map<string, Style>();
    const isRobbery = (type: string) => type === 'roubo_carga' || type === 'roubo';
    const corporatePinsLayer = new VectorLayer({
      source: new VectorSource(),
      visible: layers.corporateIncidents !== false,
      zIndex: 9.5,
      style: feature => {
        const group = feature.get('group') as CorporateIncidentGroup | undefined;
        const count = String(group?.incidents.length ?? 1);
        const hasRobbery = group
          ? group.incidents.some(incident => isRobbery(incident.incidentType))
          : isRobbery(feature.get('incidentType'));
        const color = hasRobbery ? '#dc2626' : '#ea580c';
        const key = color + count;
        const cached = countStyles.get(key);
        if (cached) return cached;
        const style = new Style({
          image: new CircleStyle({
            radius: Math.max(10, 5 + count.length * 3.5),
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#ffffff', width: 2.5 })
          }),
          text: new Text({
            text: count,
            font: 'bold 12px Arial, sans-serif',
            fill: new Fill({ color: '#ffffff' }),
            offsetY: 1
          })
        });
        countStyles.set(key, style);
        return style;
      }
    });

    return {
      basemaps: { osm: osmLayer, voyager: voyagerLayer, satellite: satLayer, streets: streetsLayer },
      vectors: {
        brasil: brasilLayer, risp: rispLayer, aisp: aispLayer, cisp: cispLayer,
        preciseFactions: faccoesPrecisasLayer, focos: focosLayer, delegacias: delegaciasLayer,
        batalhoes: batalhoesLayer, mgEs: mgEsLayer, address: addressMarkerLayer,
        userLocation: userLocationLayer, corporatePins: corporatePinsLayer
      },
      corporateHeatmap: corporateHeatmapLayer,
      orderedLayers: [
        osmLayer, voyagerLayer, satLayer, streetsLayer, brasilLayer, rispLayer, aispLayer,
        cispLayer, faccoesPrecisasLayer, focosLayer, delegaciasLayer, batalhoesLayer,
        mgEsLayer, corporateHeatmapLayer, corporatePinsLayer, addressMarkerLayer, userLocationLayer
      ]
    };
}
