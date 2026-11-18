import { CISP_GEOJSON } from '../data/geoBoundaries';
import { DELEGACIAS_MG_ES_DATA } from '../data/delegaciasMgEsData';
import { POLICE_UNITS } from '../data/territoryData';
import { TerritorialRegistry } from '../types';

export interface DelegaciaMatchResult {
  delegaciaId: string; // Ex: 'RJ_CISP_75' ou 'ES-PCES-VIT-01'
  delegaciaName: string;
  uf: 'RJ' | 'MG' | 'ES';
  municipio: string;
  confidence: 'exact_boundary' | 'bairro_match' | 'address_text' | 'nearest_proximity';
  reason: string;
}

/**
 * Normaliza texto para comparações geográficas (minúsculo, sem acentos, sem pontuação excessiva).
 */
export function normalizeGeoText(text?: string | null): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Algoritmo Point-in-Polygon (Ray-Casting) para coordenadas [lng, lat].
 */
export function pointInRing(lng: number, lat: number, ring: [number, number][] | number[][]): boolean {
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

export interface MatchDelegaciaOptions {
  lat?: number | string | null;
  lng?: number | string | null;
  bairro?: string | null;
  municipio?: string | null;
  addressText?: string | null;
  targetUf?: 'RJ' | 'MG' | 'ES' | 'TODAS' | string | null;
  registry?: TerritorialRegistry | null;
}

/**
 * Identifica automaticamente a delegacia responsável por uma localização informada.
 * Avalia em 4 níveis de precisão:
 * 1. Limite Territorial Oficial (Polígono GeoJSON de CISP/DP)
 * 2. Correspondência Oficial de Bairro / Localidade
 * 3. Análise semântica do texto do endereço informado
 * 4. Proximidade espacial (centróide de delegacia mais próxima)
 */
export function findResponsibleDelegacia(options: MatchDelegaciaOptions): DelegaciaMatchResult | null {
  const numLat = typeof options.lat === 'number' ? options.lat : parseFloat(String(options.lat || '').replace(',', '.'));
  const numLng = typeof options.lng === 'number' ? options.lng : parseFloat(String(options.lng || '').replace(',', '.'));
  const hasValidCoords = !Number.isNaN(numLat) && !Number.isNaN(numLng) && numLat !== 0 && numLng !== 0;

  const cleanBairro = normalizeGeoText(options.bairro);
  const cleanMunicipio = normalizeGeoText(options.municipio);
  const cleanAddress = normalizeGeoText(options.addressText);
  const filterUf = options.targetUf && options.targetUf !== 'TODAS' ? options.targetUf : null;

  // -------------------------------------------------------------------------
  // PRIORIDADE 1: Point-in-Polygon (Limite Territorial Oficial)
  // -------------------------------------------------------------------------
  if (hasValidCoords) {
    // 1.A) Checa polígonos das CISPs do Estado do Rio de Janeiro
    if (!filterUf || filterUf === 'RJ') {
      for (const feat of CISP_GEOJSON.features) {
        const ring = feat.geometry?.coordinates?.[0];
        if (ring && pointInRing(numLng, numLat, ring)) {
          const cispNum = feat.properties.cisp;
          const reg = options.registry?.cisps?.[cispNum];
          const name = reg?.nome_oficial || feat.properties.delegaciaNome || `${cispNum}ª DP`;
          const mun = reg?.municipio || feat.properties.municipio || 'Rio de Janeiro';
          return {
            delegaciaId: `RJ_CISP_${cispNum}`,
            delegaciaName: `${cispNum}ª DP — ${name}`,
            uf: 'RJ',
            municipio: mun,
            confidence: 'exact_boundary',
            reason: `Ponto geográfico dentro da circunscrição da ${cispNum}ª DP (${mun}).`
          };
        }
      }
    }

    // 1.B) Checa polígonos de Delegacias em MG e ES
    if (!filterUf || filterUf === 'MG' || filterUf === 'ES') {
      for (const del of DELEGACIAS_MG_ES_DATA) {
        if (filterUf && del.uf !== filterUf) continue;
        const ring = del.coordinates?.[0];
        if (ring && pointInRing(numLng, numLat, ring)) {
          return {
            delegaciaId: del.id,
            delegaciaName: `${del.nomeCurto} — ${del.nome}`,
            uf: del.uf,
            municipio: del.municipio,
            confidence: 'exact_boundary',
            reason: `Ponto geográfico dentro da área de cobertura da ${del.nomeCurto} (${del.municipio} - ${del.uf}).`
          };
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // PRIORIDADE 2: Correspondência por Bairro / Localidade Oficial
  // -------------------------------------------------------------------------
  if (cleanBairro) {
    // 2.A) Busca nos bairros das CISPs do Rio de Janeiro
    if (!filterUf || filterUf === 'RJ') {
      // Prioridade com município coincidente se informado
      let bestRjMatch: { cisp: number; name: string; mun: string; matchedBairro: string } | null = null;
      for (const unit of POLICE_UNITS) {
        const munMatch = !cleanMunicipio || normalizeGeoText(unit.municipio) === cleanMunicipio;
        for (const b of unit.bairros || []) {
          const nb = normalizeGeoText(b);
          if (nb && (cleanBairro === nb || cleanBairro.includes(nb) || nb.includes(cleanBairro))) {
            if (munMatch) {
              const reg = options.registry?.cisps?.[unit.cisp];
              return {
                delegaciaId: `RJ_CISP_${unit.cisp}`,
                delegaciaName: `${unit.cisp}ª DP — ${reg?.nome_oficial || unit.delegaciaNome}`,
                uf: 'RJ',
                municipio: unit.municipio,
                confidence: 'bairro_match',
                reason: `Bairro "${b}" sob circunscrição da ${unit.cisp}ª DP (${unit.municipio}).`
              };
            }
            if (!bestRjMatch) {
              bestRjMatch = { cisp: unit.cisp, name: unit.delegaciaNome, mun: unit.municipio, matchedBairro: b };
            }
          }
        }
      }

      if (bestRjMatch && (!filterUf || filterUf === 'RJ')) {
        const reg = options.registry?.cisps?.[bestRjMatch.cisp];
        return {
          delegaciaId: `RJ_CISP_${bestRjMatch.cisp}`,
          delegaciaName: `${bestRjMatch.cisp}ª DP — ${reg?.nome_oficial || bestRjMatch.name}`,
          uf: 'RJ',
          municipio: bestRjMatch.mun,
          confidence: 'bairro_match',
          reason: `Bairro "${bestRjMatch.matchedBairro}" atendido pela ${bestRjMatch.cisp}ª DP (${bestRjMatch.mun}).`
        };
      }
    }

    // 2.B) Busca nos bairros das Delegacias de MG e ES
    if (!filterUf || filterUf === 'MG' || filterUf === 'ES') {
      for (const del of DELEGACIAS_MG_ES_DATA) {
        if (filterUf && del.uf !== filterUf) continue;
        const munMatch = !cleanMunicipio || normalizeGeoText(del.municipio) === cleanMunicipio;
        for (const b of del.bairros || []) {
          const nb = normalizeGeoText(b);
          if (nb && (cleanBairro === nb || cleanBairro.includes(nb) || nb.includes(cleanBairro))) {
            if (munMatch) {
              return {
                delegaciaId: del.id,
                delegaciaName: `${del.nomeCurto} — ${del.nome}`,
                uf: del.uf,
                municipio: del.municipio,
                confidence: 'bairro_match',
                reason: `Bairro "${b}" sob circunscrição da ${del.nomeCurto} (${del.municipio} - ${del.uf}).`
              };
            }
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // PRIORIDADE 3: Análise Semântica do Endereço (se contém nome de bairro conhecido)
  // -------------------------------------------------------------------------
  if (cleanAddress && cleanAddress.length > 3) {
    if (!filterUf || filterUf === 'RJ') {
      for (const unit of POLICE_UNITS) {
        for (const b of unit.bairros || []) {
          const nb = normalizeGeoText(b);
          if (nb && nb.length >= 4 && cleanAddress.includes(nb)) {
            const reg = options.registry?.cisps?.[unit.cisp];
            return {
              delegaciaId: `RJ_CISP_${unit.cisp}`,
              delegaciaName: `${unit.cisp}ª DP — ${reg?.nome_oficial || unit.delegaciaNome}`,
              uf: 'RJ',
              municipio: unit.municipio,
              confidence: 'address_text',
              reason: `Endereço cita a localidade "${b}", atribuída à ${unit.cisp}ª DP (${unit.municipio}).`
            };
          }
        }
      }
    }

    if (!filterUf || filterUf === 'MG' || filterUf === 'ES') {
      for (const del of DELEGACIAS_MG_ES_DATA) {
        if (filterUf && del.uf !== filterUf) continue;
        for (const b of del.bairros || []) {
          const nb = normalizeGeoText(b);
          if (nb && nb.length >= 4 && cleanAddress.includes(nb)) {
            return {
              delegaciaId: del.id,
              delegaciaName: `${del.nomeCurto} — ${del.nome}`,
              uf: del.uf,
              municipio: del.municipio,
              confidence: 'address_text',
              reason: `Endereço cita a localidade "${b}", atendida pela ${del.nomeCurto} (${del.municipio} - ${del.uf}).`
            };
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // PRIORIDADE 4: Proximidade Espacial ao Centróide mais Próximo
  // -------------------------------------------------------------------------
  if (hasValidCoords) {
    let closestMatch: DelegaciaMatchResult | null = null;
    let minDistance = Infinity;

    // Checa CISPs RJ
    if (!filterUf || filterUf === 'RJ') {
      for (const unit of POLICE_UNITS) {
        if (typeof unit.lat === 'number' && typeof unit.lng === 'number') {
          const d = Math.hypot(numLng - unit.lng, numLat - unit.lat);
          if (d < minDistance) {
            minDistance = d;
            const reg = options.registry?.cisps?.[unit.cisp];
            closestMatch = {
              delegaciaId: `RJ_CISP_${unit.cisp}`,
              delegaciaName: `${unit.cisp}ª DP — ${reg?.nome_oficial || unit.delegaciaNome}`,
              uf: 'RJ',
              municipio: unit.municipio,
              confidence: 'nearest_proximity',
              reason: `Delegacia mais próxima por proximidade geográfica (${unit.municipio}).`
            };
          }
        }
      }
    }

    // Checa Delegacias MG e ES
    if (!filterUf || filterUf === 'MG' || filterUf === 'ES') {
      for (const del of DELEGACIAS_MG_ES_DATA) {
        if (filterUf && del.uf !== filterUf) continue;
        if (typeof del.latitude === 'number' && typeof del.longitude === 'number') {
          const d = Math.hypot(numLng - del.longitude, numLat - del.latitude);
          if (d < minDistance) {
            minDistance = d;
            closestMatch = {
              delegaciaId: del.id,
              delegaciaName: `${del.nomeCurto} — ${del.nome}`,
              uf: del.uf,
              municipio: del.municipio,
              confidence: 'nearest_proximity',
              reason: `Delegacia mais próxima por proximidade geográfica (${del.municipio} - ${del.uf}).`
            };
          }
        }
      }
    }

    if (closestMatch) {
      return closestMatch;
    }
  }

  return null;
}
