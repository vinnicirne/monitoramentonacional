import faccoesRaw from './faccoesRjPreciso.json';
import { CISP_GEOJSON } from './geoBoundaries';

export type CodigoFaccaoPrecisa = 'CV' | 'TCP' | 'ADA' | 'MIL' | 'LJ' | 'MNI' | 'NEU';

export interface FaccaoMeta {
  code: CodigoFaccaoPrecisa;
  label: string;
  shortLabel: string;
  color: string;
  risk: boolean;
}

export const FAC_CATALOG: Record<CodigoFaccaoPrecisa, FaccaoMeta> = {
  CV: {
    code: 'CV',
    label: 'Comando Vermelho (CV)',
    shortLabel: 'CV',
    color: '#E0342C',
    risk: true
  },
  TCP: {
    code: 'TCP',
    label: 'Terceiro Comando Puro (TCP)',
    shortLabel: 'TCP',
    color: '#2FA46B',
    risk: true
  },
  ADA: {
    code: 'ADA',
    label: 'Amigos dos Amigos (ADA)',
    shortLabel: 'ADA',
    color: '#EDB72B',
    risk: true
  },
  MIL: {
    code: 'MIL',
    label: 'Milícia',
    shortLabel: 'Milícia',
    color: '#4E9DE0',
    risk: true
  },
  LJ: {
    code: 'LJ',
    label: 'Liga da Justiça (CL220)',
    shortLabel: 'Liga da Justiça',
    color: '#2B5BC7',
    risk: true
  },
  MNI: {
    code: 'MNI',
    label: 'Milícia de Nova Iguaçu',
    shortLabel: 'Milícia NI',
    color: '#9B6BD6',
    risk: true
  },
  NEU: {
    code: 'NEU',
    label: 'Área Neutra',
    shortLabel: 'Neutra',
    color: '#8C97A3',
    risk: false
  }
};

export const FAC_ORDER: CodigoFaccaoPrecisa[] = ['CV', 'TCP', 'ADA', 'MIL', 'LJ', 'MNI', 'NEU'];

export interface FaccaoPrecisaFeature {
  type: 'Feature';
  properties: {
    n: string;
    f: CodigoFaccaoPrecisa;
  };
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
}

export interface FaccaoPrecisaCollection {
  type: 'FeatureCollection';
  features: FaccaoPrecisaFeature[];
}

export const FACCAO_PRECISA_GEOJSON: FaccaoPrecisaCollection = faccoesRaw as FaccaoPrecisaCollection;

export interface FaccaoSearchEntry {
  nome: string;
  normNome: string;
  f: CodigoFaccaoPrecisa;
  lat: number;
  lng: number;
  ring: [number, number][];
}

function normStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export const FACCAO_COUNTS: Record<CodigoFaccaoPrecisa, number> = {
  CV: 0,
  TCP: 0,
  ADA: 0,
  MIL: 0,
  LJ: 0,
  MNI: 0,
  NEU: 0
};

export const FACCAO_SEARCH_INDEX: FaccaoSearchEntry[] = FACCAO_PRECISA_GEOJSON.features.map(feat => {
  const code = feat.properties.f;
  if (FACCAO_COUNTS[code] !== undefined) {
    FACCAO_COUNTS[code]++;
  }
  const ring = feat.geometry.coordinates[0] || [];
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < ring.length; i++) {
    sx += ring[i][0];
    sy += ring[i][1];
  }
  const len = ring.length || 1;
  return {
    nome: feat.properties.n,
    normNome: normStr(feat.properties.n),
    f: code,
    lng: sx / len,
    lat: sy / len,
    ring
  };
});

export function getPolygonCentroid(ring: [number, number][]): [number, number] {
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < ring.length; i++) {
    sx += ring[i][0];
    sy += ring[i][1];
  }
  const len = ring.length || 1;
  return [sx / len, sy / len];
}

function pointInRing(lng: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Identifica o código da CISP (Delegacia) que contém o polígono da comunidade clicada.
 */
export function findCispForCoords(lng: number, lat: number): number | undefined {
  for (const feat of CISP_GEOJSON.features) {
    const ring = feat.geometry.coordinates[0];
    if (ring && pointInRing(lng, lat, ring)) {
      return feat.properties.cisp;
    }
  }
  return undefined;
}

/**
 * Verifica se uma coordenada [lng, lat] está dentro de alguma das 1.695 áreas mapeadas de facções.
 */
export function findFactionAtCoords(
  lng: number,
  lat: number
): { nome: string; code: CodigoFaccaoPrecisa; label: string; shortLabel: string; color: string } | undefined {
  for (const feat of FACCAO_PRECISA_GEOJSON.features) {
    const ring = feat.geometry.coordinates[0];
    if (ring && pointInRing(lng, lat, ring)) {
      const code = feat.properties.f;
      const meta = FAC_CATALOG[code] || FAC_CATALOG.NEU;
      return {
        nome: feat.properties.n,
        code,
        label: meta.label,
        shortLabel: meta.shortLabel,
        color: meta.color
      };
    }
  }
  return undefined;
}

export interface CispFaccaoSummary {
  cisp: number;
  total: number;
  counts: Partial<Record<CodigoFaccaoPrecisa, number>>;
  areas: { nome: string; f: CodigoFaccaoPrecisa }[];
}

export const CISP_FACCAO_STATS: Record<number, CispFaccaoSummary> = (() => {
  const map: Record<number, CispFaccaoSummary> = {};
  for (const entry of FACCAO_SEARCH_INDEX) {
    const cisp = findCispForCoords(entry.lng, entry.lat);
    if (!cisp) continue;
    if (!map[cisp]) {
      map[cisp] = { cisp, total: 0, counts: {}, areas: [] };
    }
    map[cisp].total++;
    map[cisp].counts[entry.f] = (map[cisp].counts[entry.f] || 0) + 1;
    map[cisp].areas.push({ nome: entry.nome, f: entry.f });
  }
  return map;
})();

