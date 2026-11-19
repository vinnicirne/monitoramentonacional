import GeoJSON from 'ol/format/GeoJSON';
import Feature, { type FeatureLike } from 'ol/Feature';
import type VectorSource from 'ol/source/Vector';
import type VectorLayer from 'ol/layer/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { FAC_CATALOG, FACCAO_PRECISA_GEOJSON, type CodigoFaccaoPrecisa } from '../../../data/faccoesPrecisas';
import type { getFactionStyle } from '../factionStyles';

type FactionStyleFactory = typeof getFactionStyle;

interface PreciseFactionLayerOptions {
  source: VectorSource;
  layer: VectorLayer<any> | null;
  visibleFactions: Record<CodigoFaccaoPrecisa, boolean>;
  selectedFactionFilter: string;
  getSelectedCommunity: () => string | null;
  getFactionStyle: FactionStyleFactory;
}

function matchesFactionFilter(code: CodigoFaccaoPrecisa, filter: string) {
  if (!filter || filter === 'all') return true;
  if (filter === 'Milícia' || filter === 'MIL') return code === 'MIL' || code === 'LJ' || code === 'MNI';
  if (filter === 'Controle' || filter === 'NEU') return code === 'NEU';
  if (['CV', 'TCP', 'ADA', 'LJ', 'MNI'].includes(filter)) return code === filter;
  return true;
}

export function populatePreciseFactionLayer({
  source,
  layer,
  visibleFactions,
  selectedFactionFilter,
  getSelectedCommunity,
  getFactionStyle
}: PreciseFactionLayerOptions) {
  source.clear();
  const format = new GeoJSON();
  const features: Feature[] = [];

  FACCAO_PRECISA_GEOJSON.features.forEach(rawFeature => {
    const code = rawFeature.properties.f;
    if (!visibleFactions[code] || !matchesFactionFilter(code, selectedFactionFilter)) return;

    const feature = format.readFeature(rawFeature, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    }) as Feature;
    feature.setProperties({
      type: 'FACCAO_PRECISA',
      n: rawFeature.properties.n,
      f: code,
      origRing: rawFeature.geometry.coordinates[0]
    });
    features.push(feature);
  });

  layer?.setStyle((feature: FeatureLike, resolution: number) => {
    const code = feature.get('f') as CodigoFaccaoPrecisa;
    const name = feature.get('n') as string;
    const isSelected = getSelectedCommunity() === name;
    const baseStyle = getFactionStyle(code, isSelected);
    if (resolution >= 35 && !isSelected) return baseStyle;

    const metadata = FAC_CATALOG[code] || FAC_CATALOG.NEU;
    return new Style({
      stroke: baseStyle.getStroke() || undefined,
      fill: baseStyle.getFill() || undefined,
      text: new Text({
        text: `${name} (${metadata.shortLabel})`,
        font: isSelected ? "bold 11px 'Plus Jakarta Sans', sans-serif" : "600 9.5px 'Plus Jakarta Sans', sans-serif",
        fill: new Fill({ color: '#ffffff' }),
        stroke: new Stroke({ color: '#020617', width: 3 }),
        overflow: false
      })
    });
  });

  source.addFeatures(features);
}
