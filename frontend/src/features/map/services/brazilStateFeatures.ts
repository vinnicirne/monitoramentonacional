import GeoJSON from 'ol/format/GeoJSON';
import type Feature from 'ol/Feature';
import { Fill, Stroke, Style, Text } from 'ol/style';
import type { EstadoScope } from '../../../types/sigBase';
import type { UfMetadataInfo } from '../../../data/brasilEstadosData';
import { BRASIL_STATES_GEOJSON, BRASIL_UFS_INFO } from '../../../data/brasilEstadosData';
import { hexToRgba } from '../factionStyles';

export function createBrazilStateFeatures(estadoScope: EstadoScope, selectedUf?: UfMetadataInfo | null): Feature[] {
  const features = new GeoJSON().readFeatures(BRASIL_STATES_GEOJSON, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  });

  features.forEach(feature => {
    const uf = feature.get('uf') as string;
    feature.set('type', 'BRASIL_UF');
    const status = BRASIL_UFS_INFO[uf]?.statusSig;
    const isSelected = selectedUf?.uf === uf;
    const strokeColor = isSelected ? '#ffffff' : status === 'INTEGRADO_COMPLETO' ? '#38bdf8' : '#34d399';
    const fillAlpha = estadoScope === 'TODOS' ? (isSelected ? 0.28 : 0.08) : 0.02;

    feature.setStyle((_currentFeature, resolution) => {
      const showLabel = estadoScope === 'TODOS' && resolution > 400;
      return new Style({
        stroke: new Stroke({ color: strokeColor, width: isSelected ? 3 : 2.2 }),
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

  return features as Feature[];
}
