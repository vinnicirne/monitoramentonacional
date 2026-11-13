import aispRaw from './geoBoundaries.json';
import cispRaw from './cispBoundaries.json';

export interface GeoFeature {
  type: 'Feature';
  properties: {
    aisp?: number;
    cisp?: number;
    nome?: string;
    delegaciaNome?: string;
    municipio?: string;
    risp?: number;
    batalhaoPMERJ?: string;
    unidadeTerritorial?: string;
    tipo: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export const AISP_GEOJSON: GeoFeatureCollection = aispRaw as GeoFeatureCollection;
export const CISP_GEOJSON: GeoFeatureCollection = cispRaw as GeoFeatureCollection;

export function getFeatureByAisp(aisp: number): GeoFeature | undefined {
  return AISP_GEOJSON.features.find(f => f.properties.aisp === aisp);
}

export function getFeatureByCisp(cisp: number): GeoFeature | undefined {
  return CISP_GEOJSON.features.find(f => f.properties.cisp === cisp);
}
