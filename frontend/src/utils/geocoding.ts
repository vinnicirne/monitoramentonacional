import { EstadoScope } from '../types/sigBase';

export interface AddressSearchResult {
  id: string;
  displayName: string;
  shortTitle: string;
  subtitle: string;
  lat: number;
  lng: number;
  category?: string;
  uf?: string;
}

export interface AddressSearchOptions {
  scope?: EstadoScope;
  centerLat?: number;
  centerLng?: number;
}

const SCOPE_CONFIG: Record<
  EstadoScope,
  { lat: number; lng: number; viewbox: string; targetUfs: string[] }
> = {
  RJ: {
    lat: -22.86,
    lng: -43.28,
    viewbox: '-44.9,-20.7,-40.9,-23.4',
    targetUfs: ['RJ']
  },
  MG: {
    lat: -18.8,
    lng: -44.38,
    viewbox: '-51.1,-14.2,-39.8,-22.9',
    targetUfs: ['MG']
  },
  ES: {
    lat: -19.85,
    lng: -40.45,
    viewbox: '-41.9,-17.8,-39.6,-21.3',
    targetUfs: ['ES']
  },
  MG_ES: {
    lat: -19.2,
    lng: -42.8,
    viewbox: '-51.1,-14.2,-39.6,-22.9',
    targetUfs: ['MG', 'ES']
  },
  TODOS: {
    lat: -22.86,
    lng: -43.28,
    viewbox: '-51.1,-14.2,-39.6,-23.4',
    targetUfs: ['RJ', 'MG', 'ES']
  }
};

const STATE_NAME_TO_UF: Record<string, string> = {
  'rio de janeiro': 'RJ',
  'minas gerais': 'MG',
  'espirito santo': 'ES',
  'sao paulo': 'SP'
};

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeText(str: string): string {
  return stripAccents(str).toLowerCase().trim();
}

function extractUf(stateRaw?: string, isoRaw?: string): string {
  if (isoRaw && isoRaw.startsWith('BR-')) {
    return isoRaw.replace('BR-', '').toUpperCase();
  }
  if (!stateRaw) return '';
  const trimmed = stateRaw.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const norm = normalizeText(trimmed);
  return STATE_NAME_TO_UF[norm] || trimmed;
}

function expandPtBrAbbreviations(q: string): string {
  return q
    .replace(/\b(r\.?|rua)\s+/gi, 'Rua ')
    .replace(/\b(av\.?|avd\.?|avenida)\s+/gi, 'Avenida ')
    .replace(/\b(est\.?|estr\.?|estrada)\s+/gi, 'Estrada ')
    .replace(/\b(rod\.?|rodovia)\s+/gi, 'Rodovia ')
    .replace(/\b(tv\.?|trav\.?|travessa)\s+/gi, 'Travessa ')
    .replace(/\b(pca\.?|pç\.?|praca|praça)\s+/gi, 'Praça ')
    .replace(/\b(al\.?|alameda)\s+/gi, 'Alameda ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHouseNumber(q: string): { withoutNumber: string; houseNumber: string | null } {
  // Remove padrões comuns de número no final ou antes de vírgula (ex: "rua x 992", "rua x, nº 992", "rua x, 992 - bairro")
  const matchEnd = q.match(/^(.*?)[\s,]+(?:n[º°o.]?\s*)?(\d{1,5}[a-zA-Z]?)\s*$/);
  if (matchEnd && matchEnd[1].trim().length >= 4) {
    return { withoutNumber: matchEnd[1].trim(), houseNumber: matchEnd[2] };
  }
  const matchMid = q.replace(/,?\s*(?:n[º°o.]?\s*)?\b(\d{1,5})\b(?=\s*,)/, '');
  if (matchMid !== q) {
    const numMatch = q.match(/,?\s*(?:n[º°o.]?\s*)?\b(\d{1,5})\b(?=\s*,)/);
    return { withoutNumber: matchMid.replace(/\s+/g, ' ').trim(), houseNumber: numMatch?.[1] || null };
  }
  return { withoutNumber: q, houseNumber: null };
}

const ORTHOGRAPHIC_SWAPS: Array<[RegExp, string]> = [
  [/\bmoraes\b/gi, 'Morais'],
  [/\bmorais\b/gi, 'Moraes'],
  [/\bsousa\b/gi, 'Souza'],
  [/\bsouza\b/gi, 'Sousa'],
  [/\bmattos\b/gi, 'Matos'],
  [/\bmatos\b/gi, 'Mattos'],
  [/\bresende\b/gi, 'Rezende'],
  [/\brezende\b/gi, 'Resende'],
  [/\bluiz\b/gi, 'Luis'],
  [/\bluis\b/gi, 'Luiz'],
  [/\bthereza\b/gi, 'Teresa'],
  [/\bteresa\b/gi, 'Thereza'],
  [/\bthiago\b/gi, 'Tiago'],
  [/\braphael\b/gi, 'Rafael'],
  [/\bcesario\b/gi, 'Cezario'],
  [/\bmariz\b/gi, 'Maris']
];

function applyOrthographicVariants(q: string): string[] {
  const variants = new Set<string>();
  for (const [regex, replacement] of ORTHOGRAPHIC_SWAPS) {
    if (regex.test(q)) {
      variants.add(q.replace(regex, replacement));
    }
  }
  return Array.from(variants);
}

function buildRelaxedStreetQueries(streetQuery: string): string[] {
  const candidates = new Set<string>();
  const base = expandPtBrAbbreviations(streetQuery);
  candidates.add(base);

  const [streetPart, ...restParts] = base.split(',').map(s => s.trim()).filter(Boolean);
  const cityHint = restParts.join(', ');
  const words = streetPart.split(/\s+/).filter(Boolean);

  // 1. Redução progressiva com variantes ortográficas (prioridade máxima quando o nome completo tem sobrenomes extras)
  if (words.length >= 4) {
    const firstThree = words.slice(0, 3).join(' ').replace(/\s+(de|da|do|das|dos|e)$/i, '').trim();
    const prefixVariants = [firstThree, ...applyOrthographicVariants(firstThree)];
    for (const pv of prefixVariants) {
      if (pv.split(/\s+/).length >= 2) {
        candidates.add(cityHint ? `${pv}, ${cityHint}` : pv);
        if (cityHint) candidates.add(pv);
      }
    }
  }

  // 2. Variantes ortográficas do logradouro completo
  for (const v of applyOrthographicVariants(base)) {
    candidates.add(v);
  }

  // 3. Prefixo de 4 palavras (quando há 5+ palavras)
  if (words.length >= 5) {
    const firstFour = words.slice(0, 4).join(' ').replace(/\s+(de|da|do|das|dos|e)$/i, '').trim();
    for (const pv of [firstFour, ...applyOrthographicVariants(firstFour)]) {
      candidates.add(cityHint ? `${pv}, ${cityHint}` : pv);
    }
  }

  return Array.from(candidates).filter(c => c.length >= 4);
}

async function queryNominatim(
  q: string,
  viewbox: string,
  signal?: AbortSignal
): Promise<AddressSearchResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=br&limit=8&accept-language=pt-BR&viewbox=${encodeURIComponent(
      viewbox
    )}&bounded=0&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((item: any, idx: number) => {
        const addr = item.address || {};
        const road = addr.road || addr.pedestrian || addr.footway || addr.suburb || '';
        const house = addr.house_number ? `, ${addr.house_number}` : '';
        const neighbourhood = addr.suburb || addr.neighbourhood || addr.quarter || '';
        const city = addr.city || addr.town || addr.municipality || addr.village || '';
        const uf = extractUf(addr.state_code || addr.state, addr['ISO3166-2-lvl4']);

        const shortTitle = road
          ? `${road}${house}`
          : item.name || item.display_name?.split(',')[0] || q;
        const subParts = [neighbourhood, city, uf].filter(Boolean);
        const subtitle =
          subParts.length > 0 ? subParts.join(' · ') : item.display_name || '';

        return {
          id: `nom-${item.place_id || idx}`,
          displayName: item.display_name || shortTitle,
          shortTitle,
          subtitle,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          category: item.type || item.category,
          uf
        };
      })
      .filter(r => !Number.isNaN(r.lat) && !Number.isNaN(r.lng));
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    return [];
  }
}

async function queryPhoton(
  q: string,
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<AddressSearchResult[]> {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      q
    )}&limit=10&lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}&location_bias_scale=0.35`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    return features
      .filter((f: any) => !f?.properties?.countrycode || f.properties.countrycode === 'BR')
      .map((f: any, idx: number) => {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [0, 0];
        const street = p.street || p.name || '';
        const house = p.housenumber ? `, ${p.housenumber}` : '';
        const shortTitle = street ? `${street}${house}` : p.city || q;
        const uf = extractUf(p.state);
        const subtitle = [p.district || p.locality, p.city || p.county, uf || p.state, p.postcode]
          .filter(Boolean)
          .join(' · ');

        return {
          id: `pho-${p.osm_id || idx}-${Math.round(Number(coords[1]) * 1000)}`,
          displayName: [shortTitle, subtitle].filter(Boolean).join(', '),
          shortTitle,
          subtitle: subtitle || 'Brasil · OpenStreetMap',
          lat: Number(coords[1]),
          lng: Number(coords[0]),
          category: p.osm_value,
          uf
        };
      })
      .filter((r: AddressSearchResult) => !Number.isNaN(r.lat) && !Number.isNaN(r.lng));
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    return [];
  }
}

async function lookupCepViaCep(
  digits: string,
  signal?: AbortSignal
): Promise<{ query: string; labelPrefix?: string } | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal,
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.erro) return null;
    const parts = [data.logradouro, data.bairro, data.localidade, data.uf].filter(Boolean);
    if (parts.length === 0) return null;
    return {
      query: [data.logradouro, data.localidade, data.uf].filter(Boolean).join(', '),
      labelPrefix: `CEP ${data.cep}`
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    return null;
  }
}

function normOrthographic(text: string): string {
  return normalizeText(text)
    .replace(/\bmoraes\b/g, 'morais')
    .replace(/\bsouza\b/g, 'sousa')
    .replace(/\bmattos\b/g, 'matos')
    .replace(/\brezende\b/g, 'resende');
}

function rankAndDedupe(
  results: AddressSearchResult[],
  rawQuery: string,
  targetUfs: string[],
  biasLat: number,
  biasLng: number
): AddressSearchResult[] {
  const seen = new Set<string>();
  const queryNormWords = normOrthographic(rawQuery)
    .split(/[\s,.-]+/)
    .filter(w => w.length >= 2);
  const queryPrefix3 = queryNormWords.slice(0, 3).join(' ');

  const scored: Array<{ item: AddressSearchResult; score: number }> = [];

  for (const item of results) {
    const key = `${item.lat.toFixed(4)}|${item.lng.toFixed(4)}|${normalizeText(item.shortTitle)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let score = 0;

    // 1. Prioridade absoluta para estados integrados e para o estado do escopo ativo
    if (item.uf && targetUfs.includes(item.uf)) {
      score += targetUfs[0] === item.uf ? 1200 : 900;
    } else if (item.uf === 'RJ' || item.uf === 'MG' || item.uf === 'ES') {
      score += 550;
    }

    // 2. Proximidade geográfica ao centro atual do mapa / centro do estado ativo
    const dLat = item.lat - biasLat;
    const dLng = item.lng - biasLng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    score += Math.max(0, 350 - dist * 55);

    // 3. Aderência no título do logradouro (prioriza correspondência exata/contígua no nome da rua)
    const titleNorm = normOrthographic(item.shortTitle);
    const titleWords = titleNorm.split(/[\s,.-]+/).filter(w => w.length >= 2);
    if (queryPrefix3 && titleNorm.startsWith(queryPrefix3)) {
      score += 420;
    }
    let titleHits = 0;
    for (const w of queryNormWords) {
      if (titleWords.includes(w)) {
        titleHits += 1;
        score += 110;
      }
    }
    // Penaliza levemente palavras extras não solicitadas no meio do nome da rua
    const extraTitleWords = Math.max(0, titleWords.length - titleHits);
    score -= extraTitleWords * 25;

    // 4. Aderência complementar no subtítulo (bairro / município / UF)
    const subNorm = normOrthographic(item.subtitle);
    for (const w of queryNormWords) {
      if (subNorm.includes(w)) score += 35;
    }

    scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map(s => s.item);
}

/**
 * Busca gratuita de endereços otimizada para o Brasil (RJ, MG e ES):
 * - Suporta busca direta por CEP (ViaCEP gratuito)
 * - Consulta em paralelo Nominatim (com viewbox regional) + Photon (com bias geográfico dinâmico)
 * - Aplica relaxamento de número predial, variações ortográficas PT-BR (ex: Moraes/Morais)
 *   e redução progressiva de sobrenomes quando o logradouro no OSM está cadastrado de forma abreviada.
 */
export async function searchAddressesFree(
  query: string,
  signal?: AbortSignal,
  options?: AddressSearchOptions
): Promise<AddressSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const scope = options?.scope || 'RJ';
  const cfg = SCOPE_CONFIG[scope] || SCOPE_CONFIG.RJ;

  // Se o centro atual do mapa estiver fora do Brasil, cai para o centro padrão do escopo
  const hasValidCenter =
    options?.centerLat != null &&
    options?.centerLng != null &&
    options.centerLat < -1 &&
    options.centerLat > -35 &&
    options.centerLng < -30 &&
    options.centerLng > -75;

  const biasLat = hasValidCenter ? (options!.centerLat as number) : cfg.lat;
  const biasLng = hasValidCenter ? (options!.centerLng as number) : cfg.lng;

  // 0. Detecção de CEP brasileiro (ex: 24740-110 ou 24740110)
  const cepDigits = trimmed.replace(/\D/g, '');
  if (/^\d{5}-?\d{3}$/.test(trimmed) && cepDigits.length === 8) {
    const cepInfo = await lookupCepViaCep(cepDigits, signal);
    if (cepInfo) {
      const [nomCep, phoCep] = await Promise.all([
        queryNominatim(cepInfo.query, cfg.viewbox, signal),
        queryPhoton(cepInfo.query, biasLat, biasLng, signal)
      ]);
      const combinedCep = rankAndDedupe(
        [...phoCep, ...nomCep],
        cepInfo.query,
        cfg.targetUfs,
        biasLat,
        biasLng
      );
      if (combinedCep.length > 0) {
        return combinedCep.map(r => ({
          ...r,
          subtitle: r.subtitle.includes(cepDigits.slice(0, 5))
            ? r.subtitle
            : `${cepInfo.labelPrefix} · ${r.subtitle}`
        }));
      }
    }
  }

  const expanded = expandPtBrAbbreviations(trimmed);
  const { withoutNumber, houseNumber } = extractHouseNumber(expanded);

  // 1. Primeira rodada paralela: Photon (rápido e tolerante) + Nominatim (com viewbox RJ/MG/ES)
  const round1Promises: Array<Promise<AddressSearchResult[]>> = [
    queryPhoton(expanded, biasLat, biasLng, signal),
    queryNominatim(expanded, cfg.viewbox, signal)
  ];

  // Se o usuário digitou um número (ex: "992"), busca em paralelo sem o número (OSM muitas vezes não tem todos os números)
  if (houseNumber && withoutNumber !== expanded) {
    round1Promises.push(queryPhoton(withoutNumber, biasLat, biasLng, signal));
  }

  const round1Arrays = await Promise.all(round1Promises);
  let pool = round1Arrays.flat();

  const queryPrefix3 = normOrthographic(withoutNumber)
    .split(/[\s,.-]+/)
    .filter(w => w.length >= 2)
    .slice(0, 3)
    .join(' ');

  const hasStrongTargetMatch = pool.some(item => {
    if (!item.uf || !cfg.targetUfs.includes(item.uf)) return false;
    const t = normOrthographic(item.shortTitle);
    return queryPrefix3 ? t.startsWith(queryPrefix3) : true;
  });

  // 2. Rodada de relaxamento PT-BR se ainda não encontrou correspondência direta no estado-alvo
  if (!hasStrongTargetMatch || pool.length < 3) {
    const relaxedQueries = buildRelaxedStreetQueries(withoutNumber).filter(
      q => normalizeText(q) !== normalizeText(expanded) && normalizeText(q) !== normalizeText(withoutNumber)
    );

    // Também tenta consultar com o centro padrão do RJ quando escopo é TODOS e usuário está vendo longe do RJ
    const fallbackLat = scope === 'TODOS' ? -22.86 : biasLat;
    const fallbackLng = scope === 'TODOS' ? -43.28 : biasLng;

    const toQuery = relaxedQueries.slice(0, 4);
    if (toQuery.length > 0) {
      const round2Promises: Array<Promise<AddressSearchResult[]>> = [];
      for (const rq of toQuery) {
        round2Promises.push(queryPhoton(rq, fallbackLat, fallbackLng, signal));
      }
      // Se não há menção de cidade e o escopo é RJ, ajuda o Nominatim com ", Rio de Janeiro"
      if (scope === 'RJ' && !withoutNumber.includes(',')) {
        round2Promises.push(queryNominatim(`${toQuery[0]}, Rio de Janeiro`, cfg.viewbox, signal));
      }
      const round2Arrays = await Promise.all(round2Promises);
      pool = pool.concat(round2Arrays.flat());
    }
  }

  const ranked = rankAndDedupe(pool, withoutNumber, cfg.targetUfs, biasLat, biasLng);

  // Preserva o número informado pelo usuário no título exibido quando o OSM só trouxe o logradouro
  if (houseNumber) {
    return ranked.map(item => {
      const alreadyHasNumber = /\d/.test(item.shortTitle);
      if (alreadyHasNumber) return item;
      return {
        ...item,
        shortTitle: `${item.shortTitle}, ${houseNumber} (aprox.)`
      };
    });
  }

  return ranked;
}

/**
 * Geocodificação reversa gratuita (Nominatim OSM) para exibir o logradouro da localização em tempo real.
 */
export async function reverseGeocodeFree(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pt-BR`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address || {};
    const road = addr.road || addr.pedestrian || addr.suburb || '';
    const house = addr.house_number ? `, ${addr.house_number}` : '';
    const bairro = addr.suburb || addr.neighbourhood || '';
    const city = addr.city || addr.town || addr.municipality || '';
    const parts = [road ? `${road}${house}` : '', bairro, city].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : data?.display_name || null;
  } catch {
    return null;
  }
}
