export type EstadoUF = 'RJ' | 'MG' | 'ES';
export type EstadoScope = 'TODOS' | 'RJ' | 'MG' | 'ES' | 'MG_ES';

export type TipoDelegacia = 'Regional' | 'Distrital' | 'Especializada' | 'Departamento';
export type TipoTerritorio = 'MUNICIPIO' | 'DISTRITO' | 'BAIRRO';
export type StatusValidacao =
  | 'CONFIRMADO_ATO_OFICIAL'
  | 'SEDE_CONFIRMADA'
  | 'PENDENTE_PORTARIA_LOCAL'
  | 'PENDENTE_EXTRACAO';

/**
 * Tabela A — Divisão Territorial (divisao_territorial.csv)
 * Separador: ; | Codificação: UTF-8
 * Inclui ID_ACISP e Nome_ACISP para suportar a hierarquia de 3 níveis de Minas Gerais.
 */
export interface DivisaoTerritorialRow {
  UF: 'MG' | 'ES';
  Codigo_IBGE_Municipio: string; // 7 dígitos preservando zeros à esquerda
  Nome_Municipio: string;
  Bairro_Distrito: string;
  ID_RISP: string;
  Nome_RISP: string;
  ID_ACISP: string; // Nível intermediário obrigatório em MG (Delegacia Regional / BPM)
  Nome_ACISP: string;
  ID_AISP: string;
  Nome_AISP: string;
  Unidade_PM_Responsavel: string;
  ID_CISP_DP: string;
  Nome_Delegacia_PC: string;
  Tipo_Delegacia: TipoDelegacia;
  // Metadados de rastreabilidade interna (opcionais na exportação padrão ou exportados em auditoria)
  Fonte_Legal?: string;
  Status_Validacao?: StatusValidacao;
  Lat_Ref?: number;
  Lng_Ref?: number;
}

/**
 * Tabela B — Cadastro de Unidades Policiais (unidades_policiais.csv)
 */
export interface UnidadePolicialRow {
  ID_Unidade: string; // Chave composta recomendada (ex: MG-PCMG-REG-CENTRO)
  UF: 'MG' | 'ES';
  Orgao: 'PCMG' | 'PCES' | 'PMMG' | 'PMES';
  Nome_Oficial: string;
  Endereco_Completo: string;
  Bairro: string;
  Municipio: string;
  Codigo_IBGE_Municipio?: string;
  CEP: string; // Preservar zeros
  Latitude: number | null;
  Longitude: number | null;
  Telefone: string;
  ID_RISP?: string;
  Status_Validacao?: StatusValidacao;
  Fonte_Legal?: string;
}

/**
 * Tabela Auxiliar — Relacionamento Territorial (relacionamento_territorial.csv)
 * Cada linha representa uma relação territorial oficial ou pendente (polígono gerado no QGIS).
 */
export interface RelacionamentoTerritorialRow {
  UF: 'MG' | 'ES';
  Codigo_IBGE_Municipio: string;
  ID_RISP: string;
  ID_AISP: string;
  ID_Unidade: string;
  ID_CISP_DP: string;
  Nome_Oficial_Territorio: string;
  Tipo_Territorio: TipoTerritorio;
  Fonte_Legal: string;
  Vigencia_Inicio: string;
  Vigencia_Fim: string;
  Status_Validacao: StatusValidacao;
}

export interface EntregaStatusItem {
  id: string;
  uf: 'MG' | 'ES' | 'MG/ES';
  entrega: string;
  situacao: 'Confirmada' | 'Localizada' | 'Identificadas' | 'Pendente de extração e validação' | 'Pendente de atos oficiais' | 'Pendente de consolidação';
  fonteReferencia: string;
  observacao: string;
}

export interface QualityAuditMetrics {
  municipiosSemIBGE: number;
  municipiosSemRISP: number;
  municipiosSemAISP: number;
  bairrosSemCorrespondencia: number;
  poligonosInvalidos: number;
  sobreposicaoIndevida: number;
  municipiosSubdivididosDetectados: number;
  circunscricoesPendentesFonteLegal: number;
  totalRegistrosAnalisados: number;
  detalhes: {
    campo: string;
    resultado: number;
    esperado: string;
    status: 'OK' | 'ALERTA' | 'PENDENTE';
    nota: string;
  }[];
}
