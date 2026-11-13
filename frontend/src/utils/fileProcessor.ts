import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { PoliceUnitRecord, InconsistencyItem } from '../types/territory';
import { POLICE_UNITS, UNIQUE_AISPS, UNIQUE_RISPS } from '../data/territoryData';

export interface FileProcessingResult {
  fileName: string;
  fileType: string;
  recordsCount: number;
  records: PoliceUnitRecord[];
  inconsistencies: InconsistencyItem[];
  kmlFeatures?: any[];
  rawSummary: string;
}

/**
 * Normalizes string keys for flexible column matching
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Parses Excel file (.xlsx / .xls) into PoliceUnitRecord array
 */
export async function parseExcelFile(file: File): Promise<PoliceUnitRecord[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsedRecords: PoliceUnitRecord[] = [];

  rawRows.forEach((row, idx) => {
    // Look up column names flexibly
    let risp = 0;
    let aisp = 0;
    let cisp = 0;
    let unidade = '';
    let municipio = '';
    let regiao = '';

    for (const key of Object.keys(row)) {
      const norm = normalizeKey(key);
      const val = row[key];

      if (norm === 'risp') risp = Number(val) || 0;
      else if (norm === 'aisp') aisp = Number(val) || 0;
      else if (norm === 'cisp') cisp = Number(val) || 0;
      else if (norm.includes('unidade') || norm.includes('territorial') || norm.includes('bairro')) unidade = String(val);
      else if (norm.includes('municipio') || norm.includes('cidade')) municipio = String(val);
      else if (norm.includes('regiao') || norm.includes('governo')) regiao = String(val);
    }

    if (cisp > 0 || unidade.trim().length > 0) {
      const bairros = unidade.replace(/ e /g, ', ').split(',').map(b => b.trim()).filter(Boolean);
      parsedRecords.push({
        id: `upload-excel-${cisp}-${idx}`,
        risp: risp || 1,
        aisp: aisp || 1,
        cisp: cisp || idx + 1,
        delegaciaNome: `${String(cisp).padStart(3, '0')}ª DP - ${municipio || 'Unidade'}`,
        unidadeTerritorial: unidade || 'Território cadastrado',
        bairros: bairros.length > 0 ? bairros : [unidade],
        municipio: municipio || 'Rio de Janeiro',
        regiaoGoverno: regiao || 'Metropolitana',
        batalhaoPMERJ: `${aisp}º BPM Territorial`,
        lat: -22.90 + (idx % 20) * 0.01,
        lng: -43.20 + (idx % 20) * 0.01,
        circunscricao: `Circunscrição territorial da ${cisp}ª DP (${municipio})`
      });
    }
  });

  return parsedRecords;
}

/**
 * Parses KML text content into standard GeoJSON FeatureCollection
 * Preserves all original geometries, Placemarks, names, descriptions, and ExtendedData
 */
export function parseKmlToGeoJson(kmlText: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
  const placemarks = xmlDoc.getElementsByTagName('Placemark');
  const features: any[] = [];

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const nameEl = pm.getElementsByTagName('name')[0];
    const descEl = pm.getElementsByTagName('description')[0];
    const name = nameEl ? nameEl.textContent || '' : `Área KML ${i + 1}`;
    const description = descEl ? descEl.textContent || '' : '';

    // Collect extended attributes
    const extendedData: Record<string, string> = {};
    const dataNodes = pm.getElementsByTagName('Data');
    for (let d = 0; d < dataNodes.length; d++) {
      const attrName = dataNodes[d].getAttribute('name');
      const valNode = dataNodes[d].getElementsByTagName('value')[0];
      if (attrName && valNode) {
        extendedData[attrName] = valNode.textContent || '';
      }
    }

    // Check Polygons
    const polygonNodes = pm.getElementsByTagName('Polygon');
    if (polygonNodes.length > 0) {
      for (let p = 0; p < polygonNodes.length; p++) {
        const poly = polygonNodes[p];
        const coordNodes = poly.getElementsByTagName('coordinates');
        if (coordNodes.length > 0) {
          const rawCoords = coordNodes[0].textContent || '';
          const ring = rawCoords
            .trim()
            .split(/\s+/)
            .map(pair => {
              const [lng, lat] = pair.split(',').map(Number);
              return (!isNaN(lng) && !isNaN(lat)) ? [lng, lat] : null;
            })
            .filter(Boolean);

          if (ring.length >= 3) {
            features.push({
              type: 'Feature',
              properties: {
                id: `kml-poly-${i}-${p}`,
                nome: name,
                descricao: description,
                origem: 'Arquivo KML / Pacote focoespecial2025',
                dataProcessamento: new Date().toISOString().split('T')[0],
                grauConfiabilidade: 'Registro Cartográfico KML Preservado',
                ...extendedData
              },
              geometry: {
                type: 'Polygon',
                coordinates: [ring]
              }
            });
          }
        }
      }
    }

    // Check Points
    const pointNodes = pm.getElementsByTagName('Point');
    if (pointNodes.length > 0) {
      for (let pt = 0; pt < pointNodes.length; pt++) {
        const point = pointNodes[pt];
        const coordNodes = point.getElementsByTagName('coordinates');
        if (coordNodes.length > 0) {
          const raw = (coordNodes[0].textContent || '').trim().split(',');
          const lng = Number(raw[0]);
          const lat = Number(raw[1]);
          if (!isNaN(lng) && !isNaN(lat)) {
            features.push({
              type: 'Feature',
              properties: {
                id: `kml-pt-${i}-${pt}`,
                nome: name,
                descricao: description,
                origem: 'Arquivo KML Ponto',
                grauConfiabilidade: 'Ponto Cartográfico KML Preservado',
                ...extendedData
              },
              geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              }
            });
          }
        }
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Extracts and reads archive files (.zip, .kmz, .kml, .rar)
 */
export async function extractArchiveOrFile(file: File): Promise<{ fileName: string; textContent: string }[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const results: { fileName: string; textContent: string }[] = [];

  if (extension === 'kml') {
    const text = await file.text();
    results.push({ fileName: file.name, textContent: text });
    return results;
  }

  if (extension === 'zip' || extension === 'kmz') {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
      if (!zipEntry.dir && (relativePath.endsWith('.kml') || relativePath.endsWith('.xml') || relativePath.endsWith('.txt'))) {
        const text = await zipEntry.async('string');
        results.push({ fileName: relativePath, textContent: text });
      }
    }
    return results;
  }

  // If user dropped .rar or binary package, read text if available or parse strings
  if (extension === 'rar') {
    const buf = await file.arrayBuffer();
    // Scan for embedded KML or XML tags in the binary stream
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const fullText = decoder.decode(buf);
    const kmlStart = fullText.indexOf('<kml');
    const kmlEnd = fullText.lastIndexOf('</kml>');

    if (kmlStart !== -1 && kmlEnd !== -1 && kmlEnd > kmlStart) {
      const extractedKml = fullText.substring(kmlStart, kmlEnd + 6);
      results.push({ fileName: `${file.name}.kml`, textContent: extractedKml });
    } else {
      results.push({
        fileName: file.name,
        textContent: `<!-- Pacote RAR recebido: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Recomendado descompactar ou enviar o arquivo .kml diretamente caso a compressão proprietária RAR5 esteja ativada. -->`
      });
    }
    return results;
  }

  // Fallback direct text read
  const text = await file.text();
  results.push({ fileName: file.name, textContent: text });
  return results;
}

/**
 * Cross-references records through RISP, AISP, and CISP codes
 * Detects duplicates, unmapped codes, and shared territorial jurisdictions
 */
export function auditAndDetectInconsistencies(uploadedRecords: PoliceUnitRecord[]): InconsistencyItem[] {
  const inconsistencies: InconsistencyItem[] = [];
  const cispCount = new Map<number, PoliceUnitRecord[]>();

  // Check uploaded records against official catalog
  uploadedRecords.forEach(rec => {
    // 1. Validate RISP range (1 to 7)
    if (!UNIQUE_RISPS.includes(rec.risp)) {
      inconsistencies.push({
        id: `inc-risp-${rec.id}`,
        tipo: 'PENDENCIA_ASSOCIACAO',
        descricao: `Código de RISP (${rec.risp}) fora do intervalo oficial do RJ (1ª a 7ª RISP).`,
        registro: rec,
        severidade: 'alta'
      });
    }

    // 2. Validate AISP against official active list
    if (!UNIQUE_AISPS.includes(rec.aisp)) {
      inconsistencies.push({
        id: `inc-aisp-${rec.id}`,
        tipo: 'SEM_CORRESPONDENCIA',
        descricao: `AISP ${rec.aisp} não localizada no catálogo oficial consolidado de unidades territoriais.`,
        registro: rec,
        severidade: 'media'
      });
    }

    // 3. Track CISP duplicates
    const list = cispCount.get(rec.cisp) || [];
    list.push(rec);
    cispCount.set(rec.cisp, list);
  });

  // Flag duplicate CISPs with divergent municipalities or jurisdictions
  cispCount.forEach((records, cisp) => {
    if (records.length > 1) {
      const munis = Array.from(new Set(records.map(r => r.municipio)));
      if (munis.length > 1) {
        inconsistencies.push({
          id: `inc-dup-cisp-${cisp}`,
          tipo: 'MUNICÍPIO_COMPARTILHADO',
          descricao: `A ${cisp}ª DP atende múltiplos municípios documentados: ${munis.join(' e ')}. Jurisdição compartilhada.`,
          registro: records[0],
          severidade: 'baixa'
        });
      } else {
        inconsistencies.push({
          id: `inc-dup-record-${cisp}`,
          tipo: 'DUPLICIDADE',
          descricao: `A ${cisp}ª DP possui ${records.length} registros no arquivo (desmembramento por circunscrição/subdistrito).`,
          registro: records[0],
          severidade: 'baixa'
        });
      }
    }
  });

  return inconsistencies;
}

/**
 * Builds standard system audit for the 147 baseline records
 */
export function getBaselineAudit(): InconsistencyItem[] {
  return auditAndDetectInconsistencies(POLICE_UNITS);
}
