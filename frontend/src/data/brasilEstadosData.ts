import brasilRaw from './brasilEstados.json';

export interface BrasilStateFeature {
  type: 'Feature';
  properties: {
    uf: string;
    nome: string;
    codigoIbge: string;
    regiao: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
}

export interface BrasilStateCollection {
  type: 'FeatureCollection';
  features: BrasilStateFeature[];
}

export const INTEGRATED_UF_CODES = ['RJ', 'MG', 'ES'] as const;

const rawCollection = brasilRaw as BrasilStateCollection;

export const BRASIL_STATES_GEOJSON: BrasilStateCollection = {
  type: 'FeatureCollection',
  features: rawCollection.features.filter(f =>
    INTEGRATED_UF_CODES.includes(f.properties.uf as (typeof INTEGRATED_UF_CODES)[number])
  )
};

export type StatusSigUF = 'INTEGRADO_COMPLETO' | 'BASE_SIG_INTEGRADA' | 'MALHA_IBGE_DISPONIVEL';

export interface UfMetadataInfo {
  uf: string;
  nome: string;
  capital: string;
  regiao: string;
  codigoIbge: string;
  lat: number;
  lng: number;
  zoom: number;
  orgaoPC: string;
  orgaoPM: string;
  statusSig: StatusSigUF;
  estruturaResumo: string;
}

export const BRASIL_UFS_INFO: Record<string, UfMetadataInfo> = {
  RJ: {
    uf: 'RJ', nome: 'Rio de Janeiro', capital: 'Rio de Janeiro', regiao: 'Sudeste', codigoIbge: '33',
    lat: -22.86, lng: -43.28, zoom: 10.3,
    orgaoPC: 'PCERJ', orgaoPM: 'PMERJ', statusSig: 'INTEGRADO_COMPLETO',
    estruturaResumo: 'Integrado Completo: 7 RISPs, 41 AISPs, 137 CISPs, indicadores ISP-RJ (2020–2025) e 1.695 áreas mapeadas (Dados de Riscos ago/2026).'
  },
  MG: {
    uf: 'MG', nome: 'Minas Gerais', capital: 'Belo Horizonte', regiao: 'Sudeste', codigoIbge: '31',
    lat: -18.80, lng: -44.38, zoom: 6.4,
    orgaoPC: 'PCMG', orgaoPM: 'PMMG', statusSig: 'BASE_SIG_INTEGRADA',
    estruturaResumo: 'Base SIG integrada em 3 níveis (RISP · ACISP · AISP): 19 RISPs e Departamentos Territoriais (SEJUSP-MG).'
  },
  ES: {
    uf: 'ES', nome: 'Espírito Santo', capital: 'Vitória', regiao: 'Sudeste', codigoIbge: '32',
    lat: -19.85, lng: -40.45, zoom: 7.7,
    orgaoPC: 'PCES', orgaoPM: 'PMES', statusSig: 'BASE_SIG_INTEGRADA',
    estruturaResumo: 'Base SIG integrada: 5 RISPs, 23 AISPs e Delegacias Regionais confirmadas (Observatório SESP-ES).'
  }
};

export const BRASIL_UFS_LIST: UfMetadataInfo[] = Object.values(BRASIL_UFS_INFO).sort((a, b) =>
  a.nome.localeCompare(b.nome, 'pt-BR')
);
