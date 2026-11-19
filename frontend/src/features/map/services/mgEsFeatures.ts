import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import type { EstadoScope, DivisaoTerritorialRow, UnidadePolicialRow } from '../../../types/sigBase';
import { DELEGACIAS_MG_ES_DATA } from '../../../data/delegaciasMgEsData';
import type { DelegaciaTerritorialMgEs } from '../../../types/delegaciaTerritorial';
import { hexToRgba } from '../factionStyles';

interface MgEsFeaturesOptions {
  estadoScope: EstadoScope;
  divisao: DivisaoTerritorialRow[];
  unidades: UnidadePolicialRow[];
  selectedDelegaciaId: () => string | null;
}

function isInScope(uf: string, estadoScope: EstadoScope) {
  return estadoScope === 'TODOS' || estadoScope === 'RJ' || estadoScope === uf;
}

export function createMgEsFeatures({ estadoScope, divisao, unidades, selectedDelegaciaId }: MgEsFeaturesOptions): Feature[] {
  if (estadoScope === 'RJ') return [];
  const features: Feature[] = [];

  DELEGACIAS_MG_ES_DATA.forEach((station: DelegaciaTerritorialMgEs) => {
    if (!isInScope(station.uf, estadoScope)) return;

    const polygon = new Feature({
      geometry: new Polygon(station.coordinates.map(ring => ring.map(coord => fromLonLat(coord)))),
      type: 'DELEGACIA_MG_ES_POLYGON',
      id: station.id,
      delegacia: station
    });
    polygon.setStyle((_feature, resolution) => {
      const isSelected = selectedDelegaciaId() === station.id;
      return new Style({
        fill: new Fill({ color: hexToRgba(station.cor, isSelected ? 0.45 : 0.22) }),
        stroke: new Stroke({ color: isSelected ? '#ffffff' : station.cor, width: isSelected ? 3.5 : 2, lineDash: isSelected ? undefined : [6, 4] }),
        text: resolution < 650 ? new Text({
          text: `${station.nomeCurto}\n(${station.totalBairros} bairros)`,
          font: isSelected ? "bold 11px 'Plus Jakarta Sans', sans-serif" : "600 10px 'Plus Jakarta Sans', sans-serif",
          fill: new Fill({ color: isSelected ? '#ffffff' : '#f1f5f9' }),
          stroke: new Stroke({ color: '#090d16', width: 3.5 }),
          textAlign: 'center',
          offsetY: 0
        }) : undefined
      });
    });
    features.push(polygon);

    const isEs = station.uf === 'ES';
    const marker = new Feature({
      geometry: new Point(fromLonLat([station.longitude, station.latitude])),
      type: 'DELEGACIA_MG_ES',
      id: `sede-${station.id}`,
      delegacia: station
    });
    marker.setStyle(new Style({
      image: new CircleStyle({ radius: 9, fill: new Fill({ color: isEs ? '#047857' : '#1d4ed8' }), stroke: new Stroke({ color: '#ffffff', width: 2 }) }),
      text: new Text({ text: station.orgao, font: "bold 8px 'JetBrains Mono', monospace", fill: new Fill({ color: '#ffffff' }), offsetY: 14, stroke: new Stroke({ color: '#020617', width: 3 }) })
    }));
    features.push(marker);
  });

  divisao.forEach(row => {
    if (!isInScope(row.UF, estadoScope) || row.Lat_Ref == null || row.Lng_Ref == null) return;
    const confirmed = row.Status_Validacao === 'CONFIRMADO_ATO_OFICIAL';
    const feature = new Feature({
      geometry: new Point(fromLonLat([row.Lng_Ref, row.Lat_Ref])),
      type: 'MGES_NODE',
      mgEsInfo: { uf: row.UF, titulo: `${row.ID_RISP}ª RISP — ${row.Nome_Municipio}`, subtitulo: row.Nome_Delegacia_PC, divisao: row }
    });
    feature.setStyle(new Style({
      image: new CircleStyle({ radius: 10, fill: new Fill({ color: row.UF === 'ES' ? '#064e3b' : '#1e1b4b' }), stroke: new Stroke({ color: confirmed ? '#34d399' : '#fbbf24', width: 2 }) }),
      text: new Text({ text: `${row.UF} ${row.ID_RISP}`, font: "bold 9px 'JetBrains Mono', monospace", fill: new Fill({ color: '#ffffff' }), offsetY: -15, stroke: new Stroke({ color: '#020617', width: 3 }) })
    }));
    features.push(feature);
  });

  unidades.forEach(unit => {
    if (!isInScope(unit.UF, estadoScope) || unit.Latitude == null || unit.Longitude == null) return;
    const feature = new Feature({
      geometry: new Point(fromLonLat([unit.Longitude, unit.Latitude])),
      type: 'MGES_NODE',
      mgEsInfo: { uf: unit.UF, titulo: unit.Nome_Oficial, subtitulo: `${unit.Orgao} · ${unit.Municipio}`, unidade: unit }
    });
    feature.setStyle(new Style({
      image: new CircleStyle({ radius: 7.5, fill: new Fill({ color: '#0284c7' }), stroke: new Stroke({ color: '#f8fafc', width: 1.5 }) }),
      text: new Text({ text: unit.Orgao, font: "bold 8px 'JetBrains Mono', monospace", fill: new Fill({ color: '#7dd3fc' }), offsetY: 13, stroke: new Stroke({ color: '#020617', width: 2.5 }) })
    }));
    features.push(feature);
  });

  return features;
}
