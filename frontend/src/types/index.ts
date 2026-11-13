import { UfMetadataInfo } from '../data/brasilEstadosData';
import { DivisaoTerritorialRow, UnidadePolicialRow } from './sigBase';
import { CodigoFaccaoPrecisa } from '../data/faccoesPrecisas';

export type BasemapType = 'osm' | 'satellite' | 'streets' | 'voyager';

export type ChoroplethMetric =
  | 'none'
  | 'letalidade_violenta'
  | 'roubo_rua'
  | 'roubo_carga'
  | 'roubo_veiculo'
  | 'fuzis_apreendidos'
  | 'faccao';

export type LayerVisibility = {
  brasilEstados: boolean;
  risp: boolean;
  aisp: boolean;
  cisp: boolean;
  faccoesPrecisas: boolean;
  delegacias: boolean;
  batalhoes: boolean;
  focos: boolean;
  mgEs: boolean;
};

export interface ISPIndicatorsYear {
  letalidade_violenta: number;
  roubo_carga: number;
  roubo_veiculo: number;
  roubo_rua: number;
  armas_apreendidas: number;
  fuzis_apreendidos: number;
}

export interface FactionData {
  faccao: string;
  status: string;
  grau_risco: string;
  fonte: string;
  data: string;
  confiabilidade: string;
  descricao?: string;
  alerta_juridico?: string;
}

export interface CISPRecord {
  cisp: number;
  cisp_formatado: string;
  nome_oficial: string;
  aisp: number;
  batalhao: string;
  risp: number;
  comando_regional: string;
  municipio: string;
  bairros: string[];
  telefone: string;
  endereco: string;
  marcolegal: string;
  validacao: string;
  areakm2: number;
  centroide: [number, number];
  indicadores: {
    atual_2025: ISPIndicatorsYear;
    historico: Record<number, ISPIndicatorsYear>;
    taxa_letalidade_100k: number;
    taxa_roubo_100k: number;
  };
  dinamica_territorial: FactionData;
}

export interface AISPInfo {
  name: string;
  risp: number;
  municipio: string;
  bairro_sede: string;
  endereco: string;
}

export interface RISPInfo {
  name: string;
  cpa: string;
  sede: string;
  comandante: string;
  regiao: string;
  cor: string;
}

export interface InconsistencyItem {
  tipo: string;
  municipio: string;
  total_cisps: number;
  descricao: string;
  impacto: string;
  status: string;
}

export interface TerritorialRegistry {
  metadata: {
    titulo: string;
    versao: string;
    data_compilacao: string;
    total_risp: number;
    total_aisp: number;
    total_cisp: number;
    total_municipios: number;
    fontes_oficiais: string[];
  };
  risps: Record<number, RISPInfo>;
  aisps: Record<number, AISPInfo>;
  cisps: Record<number, CISPRecord>;
  inconsistencias: InconsistencyItem[];
}

export interface SelectedFeatureData {
  tipo: 'CISP' | 'AISP' | 'RISP' | 'FOCO_ESPECIAL' | 'FACCAO_COMUNIDADE' | 'DELEGACIA' | 'BATALHAO' | 'ESTADO_UF' | 'MGES_NODE';
  id: string | number;
  nome: string;
  cisp?: number;
  aisp?: number;
  risp?: number;
  municipio?: string;
  bairros?: string[];
  telefone?: string;
  endereco?: string;
  batalhao?: string;
  comando?: string;
  areakm2?: number;
  marcolegal?: string;
  indicadores?: CISPRecord['indicadores'];
  dinamica_territorial?: FactionData;
  // For special focus or precise Dados de Riscos community
  faccao?: string;
  faccaoCode?: CodigoFaccaoPrecisa;
  descricao?: string;
  fonte?: string;
  data_registro?: string;
  grau_confiabilidade?: string;
  alerta_juridico?: string;
  coordinates?: [number, number];
  // For 27 UFs & MG/ES SIG
  ufInfo?: UfMetadataInfo;
  mgEsInfo?: {
    uf: 'MG' | 'ES';
    titulo: string;
    subtitulo: string;
    divisao?: DivisaoTerritorialRow;
    unidade?: UnidadePolicialRow;
  };
}
