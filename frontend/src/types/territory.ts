export interface PoliceUnitRecord {
  id: string;
  risp: number;
  aisp: number;
  cisp: number;
  delegaciaNome: string;
  unidadeTerritorial: string;
  bairros: string[];
  municipio: string;
  regiaoGoverno: string;
  batalhaoPMERJ: string;
  lat: number;
  lng: number;
  circunscricao: string;
}

export interface SecurityIndicators {
  aisp: number;
  municipio: string;
  periodoReferencia: string;
  fonte: string;
  letalidadeViolenta: number;
  homicidioDoloso: number;
  morteIntervencaoPolicial: number;
  rouboCarga: number;
  rouboVeiculo: number;
  rouboRua: number;
  estelionato: number;
  apreensaoArmas: number;
  apreensaoFuzis: number;
  taxaLetalidade100k: number;
  serieHistorica: {
    ano: number;
    letalidadeViolenta: number;
    rouboVeiculo: number;
    rouboRua: number;
    rouboCarga: number;
  }[];
}

export type TipoGrupoArmado =
  | 'CV'
  | 'TCP'
  | 'MILICIA'
  | 'MIL'
  | 'LJ'
  | 'MNI'
  | 'ADA'
  | 'NEU'
  | 'EM_DISPUTA'
  | 'SEM_REGISTRO';

export interface RegistroFaccaoTerritorial {
  grupo: TipoGrupoArmado;
  nomeGrupo: string;
  situacao: 'Predomínio Documentado' | 'Área em Disputa' | 'Sob Monitoramento Integrado' | 'Área Neutra' | 'Sem Registro';
  fonte: string;
  dataReferencia: string;
  grauConfiabilidade: string;
  detalhes: string;
}

export interface FocoEspecialArea {
  id: string;
  nome: string;
  municipio: string;
  aisp: number;
  cisp: number;
  natureza: string;
  grupoArmado?: TipoGrupoArmado;
  faccaoInfo?: RegistroFaccaoTerritorial;
  dataRegistro: string;
  fonteOficial: string;
  grauConfiabilidade: 'Documentado em Base Oficial' | 'Relatório Integrado de Monitoramento' | 'Registro Operacional Verificado' | 'Registro Cartográfico KML Preservado';
  observacoes: string;
  coordinates: [number, number][][];
}

export interface FilterState {
  risp: number | 'all';
  aisp: number | 'all';
  cisp: number | 'all';
  municipio: string;
  bairroSearch: string;
  regiaoGoverno: string;
  camadaAtiva: 'all' | 'aisp' | 'cisp' | 'municipios' | 'focoEspecial' | 'faccoes';
  faccao: TipoGrupoArmado | 'all';
  anoEstatistica: number;
}

export interface InconsistencyItem {
  id: string;
  tipo: 'DUPLICIDADE' | 'SEM_CORRESPONDENCIA' | 'MUNICÍPIO_COMPARTILHADO' | 'PENDENCIA_ASSOCIACAO' | 'AVISO_GEOMETRIA';
  descricao: string;
  registro: Partial<PoliceUnitRecord>;
  severidade: 'baixa' | 'media' | 'alta';
}
