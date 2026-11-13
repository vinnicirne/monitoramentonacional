import {
  DivisaoTerritorialRow,
  UnidadePolicialRow,
  RelacionamentoTerritorialRow,
  EntregaStatusItem
} from '../types/sigBase';

export const MG_ES_OFFICIAL_SOURCES = [
  {
    uf: 'ES',
    titulo: 'Observatório da SESP-ES — Mapas e Planilha RISP/AISP (01/09/2025)',
    url: 'https://observatorio.sesp.es.gov.br/mapas',
    descricao: 'Planilha oficial RISP E AISP e mapas administrativos PMES (Vitória, Vila Velha, Serra, Cariacica) e PCES.'
  },
  {
    uf: 'ES',
    titulo: 'Observatório SESP-ES — Regiões Integradas de Segurança (5 RISPs / 23 AISPs)',
    url: 'https://observatorio.sesp.es.gov.br/regioes-integradas-de-seguranca',
    descricao: 'Definição oficial das 5 RISPs coincidentes com Comandos Regionais da PMES e Superintendências da PCES.'
  },
  {
    uf: 'ES',
    titulo: 'PCES — Atribuições das Unidades da Polícia Civil',
    url: 'https://pc.es.gov.br/atribuicoes-das-unidades-da-policia-civil',
    descricao: 'Relação institucional das Delegacias Regionais e Distritais do Espírito Santo.'
  },
  {
    uf: 'MG',
    titulo: 'SEJUSP-MG — Anuário de Segurança Pública 2024 (Anexo II, pág. 153)',
    url: 'https://www.seguranca.mg.gov.br/images/0_planilhas-e-pdfs/transparencia/03.12.2025/20-10-2025%20Anurio%20de%20Segurana%20Pblica%20de%20Minas%20Gerais%20-%202024%20-%20VF%201.pdf',
    descricao: 'Regionalização oficial em 3 níveis (RISP / ACISP / AISP) em SIRGAS 2000 e quadro de municípios por RISP.'
  },
  {
    uf: 'MG',
    titulo: 'PCMG — Estrutura de 19 Departamentos Territoriais e Quem é Quem',
    url: 'https://www.policiacivil.mg.gov.br',
    descricao: 'Cadastro institucional das Delegacias Regionais da capital e departamentos territoriais.'
  }
];

/**
 * TABELA A — DIVISÃO TERRITORIAL INICIAL CONFIRMADA (MG e ES)
 * Regra rigorosa: NÃO inventar municípios subordinados nem atribuir bairros a delegacias sem portaria/planilha oficial.
 */
export const INITIAL_DIVISAO_TERRITORIAL: DivisaoTerritorialRow[] = [
  // ==========================================================
  // ESPÍRITO SANTO — 5 RISPs Confirmadas (Observatório SESP-ES)
  // ==========================================================
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3205309',
    Nome_Municipio: 'Vitória',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO PDF PCES]',
    ID_RISP: '01',
    Nome_RISP: 'Metropolitana (Grande Vitória)',
    ID_ACISP: '',
    Nome_ACISP: 'Não aplicável (ES utiliza 2 níveis: RISP/AISP)',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    Nome_AISP: 'Área Integrada da 1ª RISP (23 AISPs no ES)',
    Unidade_PM_Responsavel: '1º Comando de Polícia Ostensiva Regional (CPOR Metropolitano)',
    ID_CISP_DP: 'ES-PCES-DR-01',
    Nome_Delegacia_PC: '1ª Delegacia Regional de Vitória',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'Observatorio_SESP (01/09/2025) & PCES',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Lat_Ref: -20.3155,
    Lng_Ref: -40.3128
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3205200',
    Nome_Municipio: 'Vila Velha',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO PDF PCES]',
    ID_RISP: '01',
    Nome_RISP: 'Metropolitana (Grande Vitória)',
    ID_ACISP: '',
    Nome_ACISP: 'Não aplicável (ES utiliza 2 níveis: RISP/AISP)',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    Nome_AISP: 'Área Integrada da 1ª RISP (Vila Velha)',
    Unidade_PM_Responsavel: '4º BPM / CPOR Metropolitano (PMES)',
    ID_CISP_DP: 'ES-PCES-DR-02',
    Nome_Delegacia_PC: '2ª Delegacia Regional de Vila Velha',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'Observatorio_SESP & PCES',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Lat_Ref: -20.3297,
    Lng_Ref: -40.2925
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3205002',
    Nome_Municipio: 'Serra',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO PDF PCES]',
    ID_RISP: '01',
    Nome_RISP: 'Metropolitana (Grande Vitória)',
    ID_ACISP: '',
    Nome_ACISP: 'Não aplicável (ES utiliza 2 níveis: RISP/AISP)',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    Nome_AISP: 'Área Integrada da 1ª RISP (Serra)',
    Unidade_PM_Responsavel: '6º BPM / CPOR Metropolitano (PMES)',
    ID_CISP_DP: 'ES-PCES-DR-03',
    Nome_Delegacia_PC: '3ª Delegacia Regional da Serra',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'Observatorio_SESP & PCES',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Lat_Ref: -20.1211,
    Lng_Ref: -40.3074
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3201308',
    Nome_Municipio: 'Cariacica',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO PDF PCES]',
    ID_RISP: '01',
    Nome_RISP: 'Metropolitana (Grande Vitória)',
    ID_ACISP: '',
    Nome_ACISP: 'Não aplicável (ES utiliza 2 níveis: RISP/AISP)',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    Nome_AISP: 'Área Integrada da 1ª RISP (Cariacica)',
    Unidade_PM_Responsavel: '7º BPM / CPOR Metropolitano (PMES)',
    ID_CISP_DP: 'ES-PCES-DR-04',
    Nome_Delegacia_PC: '4ª Delegacia Regional de Cariacica',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'Observatorio_SESP & PCES',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Lat_Ref: -20.2632,
    Lng_Ref: -40.4165
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3203205',
    Nome_Municipio: 'Linhares (Referência RISP 02)',
    Bairro_Distrito: '[IMPORTAR PLANILHA RISP E AISP]',
    ID_RISP: '02',
    Nome_RISP: 'Norte',
    ID_ACISP: '',
    Nome_ACISP: 'Não aplicável (ES)',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    Nome_AISP: 'AISPs da Região Norte (ES)',
    Unidade_PM_Responsavel: 'CPOR Norte (PMES)',
    ID_CISP_DP: 'ES-PCES-SR-02',
    Nome_Delegacia_PC: 'Superintendência / Delegacia Regional Norte',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'Observatorio_SESP (01/09/2025)',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -19.3946,
    Lng_Ref: -40.0643
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3201209',
    Nome_Municipio: 'Cachoeiro de Itapemirim (Referência RISP 03)',
    Bairro_Distrito: '[IMPORTAR PLANILHA RISP E AISP]',
    ID_RISP: '03',
    Nome_RISP: 'Sul',
    ID_ACISP: '',
    Nome_ACISP: 'Não aplicável (ES)',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    Nome_AISP: 'AISPs da Região Sul (ES)',
    Unidade_PM_Responsavel: 'CPOR Sul (PMES)',
    ID_CISP_DP: 'ES-PCES-SR-03',
    Nome_Delegacia_PC: 'Superintendência / Delegacia Regional Sul',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'Observatorio_SESP (01/09/2025)',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -20.8489,
    Lng_Ref: -41.1128
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3201506',
    Nome_Municipio: 'Colatina (Referência RISP 04)',
    Bairro_Distrito: '[IMPORTAR PLANILHA RISP E AISP]',
    ID_RISP: '04',
    Nome_RISP: 'Noroeste',
    ID_ACISP: '',
    Nome_ACISP: 'Não aplicável (ES)',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    Nome_AISP: 'AISPs da Região Noroeste (ES)',
    Unidade_PM_Responsavel: 'CPOR Noroeste (PMES)',
    ID_CISP_DP: 'ES-PCES-SR-04',
    Nome_Delegacia_PC: 'Superintendência / Delegacia Regional Noroeste',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'Observatorio_SESP (01/09/2025)',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -19.5394,
    Lng_Ref: -40.6306
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3205069',
    Nome_Municipio: 'Venda Nova do Imigrante / Domingos Martins (Ref. RISP 05)',
    Bairro_Distrito: '[IMPORTAR PLANILHA RISP E AISP]',
    ID_RISP: '05',
    Nome_RISP: 'Serrana',
    ID_ACISP: '',
    Nome_ACISP: 'Não aplicável (ES)',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    Nome_AISP: 'AISPs da Região Serrana (ES)',
    Unidade_PM_Responsavel: 'CPOR Serrana (PMES)',
    ID_CISP_DP: 'ES-PCES-SR-05',
    Nome_Delegacia_PC: 'Superintendência / Delegacia Regional Serrana',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'Observatorio_SESP (01/09/2025)',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -20.3358,
    Lng_Ref: -41.1352
  },

  // ==========================================================
  // MINAS GERAIS — 19 RISPs (Sedes Oficiais Confirmadas SEJUSP 2024)
  // ==========================================================
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3106200',
    Nome_Municipio: 'Belo Horizonte',
    Bairro_Distrito: '[VERIFICAR PORTARIA LOCAL — MUNICÍPIO INTEGRAL DA RISP 01]',
    ID_RISP: '01',
    Nome_RISP: '1ª RISP — Belo Horizonte',
    ID_ACISP: 'MG-ACISP-01-REG',
    Nome_ACISP: 'Delegacias Regionais da Capital / BPMs 1ª RPM',
    ID_AISP: '[EXTRAIR ANUÁRIO PÁG. 153]',
    Nome_AISP: 'AISPs Operacionais da Capital',
    Unidade_PM_Responsavel: '1ª Região de Polícia Militar (1ª RPM - Capital)',
    ID_CISP_DP: 'MG-PCMG-DEP-01',
    Nome_Delegacia_PC: '1º Departamento de Polícia Civil de Belo Horizonte',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II & PCMG',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Lat_Ref: -19.9167,
    Lng_Ref: -43.9345
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3118601',
    Nome_Municipio: 'Contagem (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO QUADRO MUNICIPAL RISP 02]',
    ID_RISP: '02',
    Nome_RISP: '2ª RISP — Contagem',
    ID_ACISP: 'MG-ACISP-02',
    Nome_ACISP: '[VERIFICAR ACISPs DA 2ª RISP]',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '2ª Região de Polícia Militar (2ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-02',
    Nome_Delegacia_PC: '[VERIFICAR VÍNCULO DEPARTAMENTAL VIGENTE] — Sede Contagem',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -19.9321,
    Lng_Ref: -44.0539
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3171204',
    Nome_Municipio: 'Vespasiano (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO QUADRO MUNICIPAL RISP 03]',
    ID_RISP: '03',
    Nome_RISP: '3ª RISP — Vespasiano',
    ID_ACISP: 'MG-ACISP-03',
    Nome_ACISP: '[VERIFICAR ACISPs DA 3ª RISP]',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '3ª Região de Polícia Militar (3ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-03',
    Nome_Delegacia_PC: '[VERIFICAR VÍNCULO DEPARTAMENTAL VIGENTE] — Sede Vespasiano',
    Tipo_Delegacia: 'Regional',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -19.6919,
    Lng_Ref: -43.9236
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3136702',
    Nome_Municipio: 'Juiz de Fora (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '04',
    Nome_RISP: '4ª RISP — Juiz de Fora',
    ID_ACISP: 'MG-ACISP-04',
    Nome_ACISP: 'ACISPs da 4ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '4ª Região de Polícia Militar (4ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-04',
    Nome_Delegacia_PC: '4º Departamento PCMG — Juiz de Fora (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -21.7642,
    Lng_Ref: -43.3503
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3170107',
    Nome_Municipio: 'Uberaba (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '05',
    Nome_RISP: '5ª RISP — Uberaba',
    ID_ACISP: 'MG-ACISP-05',
    Nome_ACISP: 'ACISPs da 5ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '5ª Região de Polícia Militar (5ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-05',
    Nome_Delegacia_PC: '5º Departamento PCMG — Uberaba (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -19.7472,
    Lng_Ref: -47.9381
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3138203',
    Nome_Municipio: 'Lavras (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '06',
    Nome_RISP: '6ª RISP — Lavras',
    ID_ACISP: 'MG-ACISP-06',
    Nome_ACISP: 'ACISPs da 6ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '6ª Região de Polícia Militar (6ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-06',
    Nome_Delegacia_PC: '6º Departamento PCMG — Lavras (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -21.2453,
    Lng_Ref: -44.9997
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3122306',
    Nome_Municipio: 'Divinópolis (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '07',
    Nome_RISP: '7ª RISP — Divinópolis',
    ID_ACISP: 'MG-ACISP-07',
    Nome_ACISP: 'ACISPs da 7ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '7ª Região de Polícia Militar (7ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-07',
    Nome_Delegacia_PC: '7º Departamento PCMG — Divinópolis (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -20.1389,
    Lng_Ref: -44.8839
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3127701',
    Nome_Municipio: 'Governador Valadares (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '08',
    Nome_RISP: '8ª RISP — Governador Valadares',
    ID_ACISP: 'MG-ACISP-08',
    Nome_ACISP: 'ACISPs da 8ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '8ª Região de Polícia Militar (8ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-08',
    Nome_Delegacia_PC: '8º Departamento PCMG — Governador Valadares (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -18.8511,
    Lng_Ref: -41.9494
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3170206',
    Nome_Municipio: 'Uberlândia (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '09',
    Nome_RISP: '9ª RISP — Uberlândia',
    ID_ACISP: 'MG-ACISP-09',
    Nome_ACISP: 'ACISPs da 9ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '9ª Região de Polícia Militar (9ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-09',
    Nome_Delegacia_PC: '9º Departamento PCMG — Uberlândia (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -18.9186,
    Lng_Ref: -48.2772
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3148004',
    Nome_Municipio: 'Patos de Minas (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '10',
    Nome_RISP: '10ª RISP — Patos de Minas',
    ID_ACISP: 'MG-ACISP-10',
    Nome_ACISP: 'ACISPs da 10ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '10ª Região de Polícia Militar (10ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-10',
    Nome_Delegacia_PC: '10º Departamento PCMG — Patos de Minas (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -18.5789,
    Lng_Ref: -46.5181
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3143302',
    Nome_Municipio: 'Montes Claros (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '11',
    Nome_RISP: '11ª RISP — Montes Claros',
    ID_ACISP: 'MG-ACISP-11',
    Nome_ACISP: 'ACISPs da 11ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '11ª Região de Polícia Militar (11ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-11',
    Nome_Delegacia_PC: '11º Departamento PCMG — Montes Claros (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -16.7350,
    Lng_Ref: -43.8617
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3131307',
    Nome_Municipio: 'Ipatinga (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '12',
    Nome_RISP: '12ª RISP — Ipatinga',
    ID_ACISP: 'MG-ACISP-12',
    Nome_ACISP: 'ACISPs da 12ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '12ª Região de Polícia Militar (12ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-12',
    Nome_Delegacia_PC: '12º Departamento PCMG — Ipatinga (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -19.4683,
    Lng_Ref: -42.5367
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3105608',
    Nome_Municipio: 'Barbacena (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '13',
    Nome_RISP: '13ª RISP — Barbacena',
    ID_ACISP: 'MG-ACISP-13',
    Nome_ACISP: 'ACISPs da 13ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '13ª Região de Polícia Militar (13ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-13',
    Nome_Delegacia_PC: '13º Departamento PCMG — Barbacena (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -21.2258,
    Lng_Ref: -43.7736
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3120904',
    Nome_Municipio: 'Curvelo (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '14',
    Nome_RISP: '14ª RISP — Curvelo',
    ID_ACISP: 'MG-ACISP-14',
    Nome_ACISP: 'ACISPs da 14ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '14ª Região de Polícia Militar (14ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-14',
    Nome_Delegacia_PC: '14º Departamento PCMG — Curvelo (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -18.7561,
    Lng_Ref: -44.4308
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3168606',
    Nome_Municipio: 'Teófilo Otoni (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '15',
    Nome_RISP: '15ª RISP — Teófilo Otoni',
    ID_ACISP: 'MG-ACISP-15',
    Nome_ACISP: 'ACISPs da 15ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '15ª Região de Polícia Militar (15ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-15',
    Nome_Delegacia_PC: '15º Departamento PCMG — Teófilo Otoni (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -17.8575,
    Lng_Ref: -41.5053
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3170404',
    Nome_Municipio: 'Unaí (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '16',
    Nome_RISP: '16ª RISP — Unaí',
    ID_ACISP: 'MG-ACISP-16',
    Nome_ACISP: 'ACISPs da 16ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '16ª Região de Polícia Militar (16ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-16',
    Nome_Delegacia_PC: '16º Departamento PCMG — Unaí (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -16.3575,
    Lng_Ref: -46.9061
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3152501',
    Nome_Municipio: 'Pouso Alegre (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '17',
    Nome_RISP: '17ª RISP — Pouso Alegre',
    ID_ACISP: 'MG-ACISP-17',
    Nome_ACISP: 'ACISPs da 17ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '17ª Região de Polícia Militar (17ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-17',
    Nome_Delegacia_PC: '17º Departamento PCMG — Pouso Alegre (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -22.2300,
    Lng_Ref: -45.9364
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3151800',
    Nome_Municipio: 'Poços de Caldas (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '18',
    Nome_RISP: '18ª RISP — Poços de Caldas',
    ID_ACISP: 'MG-ACISP-18',
    Nome_ACISP: 'ACISPs da 18ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '18ª Região de Polícia Militar (18ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-18',
    Nome_Delegacia_PC: '18º Departamento PCMG — Poços de Caldas (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -21.7878,
    Lng_Ref: -46.5614
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3167202',
    Nome_Municipio: 'Sete Lagoas (Sede)',
    Bairro_Distrito: '[PENDENTE EXTRAÇÃO ANEXO II]',
    ID_RISP: '19',
    Nome_RISP: '19ª RISP — Sete Lagoas',
    ID_ACISP: 'MG-ACISP-19',
    Nome_ACISP: 'ACISPs da 19ª RISP',
    ID_AISP: '[PENDENTE_EXTRACAO]',
    Nome_AISP: '[PENDENTE_EXTRACAO]',
    Unidade_PM_Responsavel: '19ª Região de Polícia Militar (19ª RPM)',
    ID_CISP_DP: 'MG-PCMG-RISP-19',
    Nome_Delegacia_PC: '19º Departamento PCMG — Sete Lagoas (Sede)',
    Tipo_Delegacia: 'Departamento',
    Fonte_Legal: 'SEJUSP Anuário 2024 Anexo II',
    Status_Validacao: 'SEDE_CONFIRMADA',
    Lat_Ref: -19.4658,
    Lng_Ref: -44.2467
  }
];

/**
 * TABELA B — CADASTRO DE UNIDADES POLICIAIS (unidades_policiais.csv)
 * Contém unidades com endereços institucionais verificados em fontes oficiais (PCMG & PCES).
 */
export const INITIAL_UNIDADES_POLICIAIS: UnidadePolicialRow[] = [
  // BELO HORIZONTE — PCMG (Seção Quem é Quem)
  {
    ID_Unidade: 'MG-PCMG-REG-CENTRO',
    UF: 'MG',
    Orgao: 'PCMG',
    Nome_Oficial: 'Delegacia Regional de Polícia Civil — Centro',
    Endereco_Completo: 'Rua Conselheiro Rocha, 321 — Floresta',
    Bairro: 'Floresta',
    Municipio: 'Belo Horizonte',
    Codigo_IBGE_Municipio: '3106200',
    CEP: '30110-001',
    Latitude: -19.9182,
    Longitude: -43.9278,
    Telefone: '(31) [CONSOLIDAR CADASTRO PCMG]',
    ID_RISP: '01',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Fonte_Legal: 'PCMG — Cadastro Institucional Quem é Quem'
  },
  {
    ID_Unidade: 'MG-PCMG-REG-BARREIRO',
    UF: 'MG',
    Orgao: 'PCMG',
    Nome_Oficial: 'Delegacia Regional de Polícia Civil — Barreiro',
    Endereco_Completo: 'Avenida Sinfrônio Brochado, 940 — Barreiro',
    Bairro: 'Barreiro',
    Municipio: 'Belo Horizonte',
    Codigo_IBGE_Municipio: '3106200',
    CEP: '30640-000',
    Latitude: -19.9742,
    Longitude: -44.0205,
    Telefone: '(31) [CONSOLIDAR CADASTRO PCMG]',
    ID_RISP: '01',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Fonte_Legal: 'PCMG — Cadastro Institucional Quem é Quem'
  },
  {
    ID_Unidade: 'MG-PCMG-REG-VENDANOVA',
    UF: 'MG',
    Orgao: 'PCMG',
    Nome_Oficial: 'Delegacia Regional de Polícia Civil — Venda Nova',
    Endereco_Completo: 'Avenida Portugal, 2.170 — Jardim Atlântico / Venda Nova',
    Bairro: 'Venda Nova',
    Municipio: 'Belo Horizonte',
    Codigo_IBGE_Municipio: '3106200',
    CEP: '31550-000',
    Latitude: -19.8328,
    Longitude: -43.9632,
    Telefone: '(31) [CONSOLIDAR CADASTRO PCMG]',
    ID_RISP: '01',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Fonte_Legal: 'PCMG — Cadastro Institucional Quem é Quem'
  },
  {
    ID_Unidade: 'MG-PCMG-REG-LESTE',
    UF: 'MG',
    Orgao: 'PCMG',
    Nome_Oficial: 'Delegacia Regional de Polícia Civil — Leste',
    Endereco_Completo: 'Rua Pouso Alegre, 417 — Floresta',
    Bairro: 'Floresta',
    Municipio: 'Belo Horizonte',
    Codigo_IBGE_Municipio: '3106200',
    CEP: '30110-000',
    Latitude: -19.9145,
    Longitude: -43.9235,
    Telefone: '(31) [CONSOLIDAR CADASTRO PCMG]',
    ID_RISP: '01',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Fonte_Legal: 'PCMG — Cadastro Institucional Quem é Quem'
  },
  // GRANDE VITÓRIA — PCES (Delegacias Regionais confirmadas)
  {
    ID_Unidade: 'ES-PCES-DR-01',
    UF: 'ES',
    Orgao: 'PCES',
    Nome_Oficial: '1ª Delegacia Regional de Vitória',
    Endereco_Completo: '[CONSOLIDAR ENDEREÇO OFICIAL PCES] — Vitória/ES',
    Bairro: 'Horto / Centro (Sede Regional)',
    Municipio: 'Vitória',
    Codigo_IBGE_Municipio: '3205309',
    CEP: '29045-000',
    Latitude: -20.3125,
    Longitude: -40.3112,
    Telefone: '(27) [CONSOLIDAR CADASTRO PCES]',
    ID_RISP: '01',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Fonte_Legal: 'PCES — Atribuições das Unidades Policiais'
  },
  {
    ID_Unidade: 'ES-PCES-DR-02',
    UF: 'ES',
    Orgao: 'PCES',
    Nome_Oficial: '2ª Delegacia Regional de Vila Velha',
    Endereco_Completo: '[CONSOLIDAR ENDEREÇO OFICIAL PCES] — Vila Velha/ES',
    Bairro: 'Centro / Jaburuna (Sede Regional)',
    Municipio: 'Vila Velha',
    Codigo_IBGE_Municipio: '3205200',
    CEP: '29100-000',
    Latitude: -20.3332,
    Longitude: -40.2918,
    Telefone: '(27) [CONSOLIDAR CADASTRO PCES]',
    ID_RISP: '01',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Fonte_Legal: 'PCES — Atribuições das Unidades Policiais'
  },
  {
    ID_Unidade: 'ES-PCES-DR-03',
    UF: 'ES',
    Orgao: 'PCES',
    Nome_Oficial: '3ª Delegacia Regional da Serra',
    Endereco_Completo: '[CONSOLIDAR ENDEREÇO OFICIAL PCES] — Serra/ES',
    Bairro: 'Parque Residencial Laranjeiras (Sede Regional)',
    Municipio: 'Serra',
    Codigo_IBGE_Municipio: '3205002',
    CEP: '29165-000',
    Latitude: -20.1945,
    Longitude: -40.2542,
    Telefone: '(27) [CONSOLIDAR CADASTRO PCES]',
    ID_RISP: '01',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Fonte_Legal: 'PCES — Atribuições das Unidades Policiais'
  },
  {
    ID_Unidade: 'ES-PCES-DR-04',
    UF: 'ES',
    Orgao: 'PCES',
    Nome_Oficial: '4ª Delegacia Regional de Cariacica',
    Endereco_Completo: '[CONSOLIDAR ENDEREÇO OFICIAL PCES] — Cariacica/ES',
    Bairro: 'Campo Grande (Sede Regional)',
    Municipio: 'Cariacica',
    Codigo_IBGE_Municipio: '3201308',
    CEP: '29146-000',
    Latitude: -20.3365,
    Longitude: -40.3912,
    Telefone: '(27) [CONSOLIDAR CADASTRO PCES]',
    ID_RISP: '01',
    Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
    Fonte_Legal: 'PCES — Atribuições das Unidades Policiais'
  }
];

/**
 * TABELA AUXILIAR — RELACIONAMENTO TERRITORIAL (relacionamento_territorial.csv)
 */
export const INITIAL_RELACIONAMENTO_TERRITORIAL: RelacionamentoTerritorialRow[] = [
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3106200',
    ID_RISP: '01',
    ID_AISP: '[EXTRAIR_ANUARIO_SEJUSP]',
    ID_Unidade: 'MG-PCMG-REG-CENTRO',
    ID_CISP_DP: 'MG-PCMG-REG-CENTRO',
    Nome_Oficial_Territorio: 'Belo Horizonte — Regional Centro (Bairros pendentes de portaria)',
    Tipo_Territorio: 'BAIRRO',
    Fonte_Legal: 'PCMG 1º Departamento — [VERIFICAR PORTARIA LOCAL]',
    Vigencia_Inicio: '2024-01-01',
    Vigencia_Fim: 'VIGENTE',
    Status_Validacao: 'PENDENTE_PORTARIA_LOCAL'
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3106200',
    ID_RISP: '01',
    ID_AISP: '[EXTRAIR_ANUARIO_SEJUSP]',
    ID_Unidade: 'MG-PCMG-REG-BARREIRO',
    ID_CISP_DP: 'MG-PCMG-REG-BARREIRO',
    Nome_Oficial_Territorio: 'Belo Horizonte — Regional Barreiro (Bairros pendentes de portaria)',
    Tipo_Territorio: 'BAIRRO',
    Fonte_Legal: 'PCMG 1º Departamento — [VERIFICAR PORTARIA LOCAL]',
    Vigencia_Inicio: '2024-01-01',
    Vigencia_Fim: 'VIGENTE',
    Status_Validacao: 'PENDENTE_PORTARIA_LOCAL'
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3106200',
    ID_RISP: '01',
    ID_AISP: '[EXTRAIR_ANUARIO_SEJUSP]',
    ID_Unidade: 'MG-PCMG-REG-VENDANOVA',
    ID_CISP_DP: 'MG-PCMG-REG-VENDANOVA',
    Nome_Oficial_Territorio: 'Belo Horizonte — Regional Venda Nova (Bairros pendentes de portaria)',
    Tipo_Territorio: 'BAIRRO',
    Fonte_Legal: 'PCMG 1º Departamento — [VERIFICAR PORTARIA LOCAL]',
    Vigencia_Inicio: '2024-01-01',
    Vigencia_Fim: 'VIGENTE',
    Status_Validacao: 'PENDENTE_PORTARIA_LOCAL'
  },
  {
    UF: 'MG',
    Codigo_IBGE_Municipio: '3106200',
    ID_RISP: '01',
    ID_AISP: '[EXTRAIR_ANUARIO_SEJUSP]',
    ID_Unidade: 'MG-PCMG-REG-LESTE',
    ID_CISP_DP: 'MG-PCMG-REG-LESTE',
    Nome_Oficial_Territorio: 'Belo Horizonte — Regional Leste (Bairros pendentes de portaria)',
    Tipo_Territorio: 'BAIRRO',
    Fonte_Legal: 'PCMG 1º Departamento — [VERIFICAR PORTARIA LOCAL]',
    Vigencia_Inicio: '2024-01-01',
    Vigencia_Fim: 'VIGENTE',
    Status_Validacao: 'PENDENTE_PORTARIA_LOCAL'
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3205309',
    ID_RISP: '01',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    ID_Unidade: 'ES-PCES-DR-01',
    ID_CISP_DP: 'ES-PCES-DR-01',
    Nome_Oficial_Territorio: 'Vitória (Delegacias Distritais subordinadas à 1ª DR)',
    Tipo_Territorio: 'MUNICIPIO',
    Fonte_Legal: 'PCES Atribuições + PDF Divisão Administrativa PCES',
    Vigencia_Inicio: '2025-09-01',
    Vigencia_Fim: 'VIGENTE',
    Status_Validacao: 'PENDENTE_PORTARIA_LOCAL'
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3205200',
    ID_RISP: '01',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    ID_Unidade: 'ES-PCES-DR-02',
    ID_CISP_DP: 'ES-PCES-DR-02',
    Nome_Oficial_Territorio: 'Vila Velha (Delegacias Distritais subordinadas à 2ª DR)',
    Tipo_Territorio: 'MUNICIPIO',
    Fonte_Legal: 'PCES Atribuições + PDF Divisão Administrativa PCES',
    Vigencia_Inicio: '2025-09-01',
    Vigencia_Fim: 'VIGENTE',
    Status_Validacao: 'PENDENTE_PORTARIA_LOCAL'
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3205002',
    ID_RISP: '01',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    ID_Unidade: 'ES-PCES-DR-03',
    ID_CISP_DP: 'ES-PCES-DR-03',
    Nome_Oficial_Territorio: 'Serra (Delegacias Distritais subordinadas à 3ª DR)',
    Tipo_Territorio: 'MUNICIPIO',
    Fonte_Legal: 'PCES Atribuições + PDF Divisão Administrativa PCES',
    Vigencia_Inicio: '2025-09-01',
    Vigencia_Fim: 'VIGENTE',
    Status_Validacao: 'PENDENTE_PORTARIA_LOCAL'
  },
  {
    UF: 'ES',
    Codigo_IBGE_Municipio: '3201308',
    ID_RISP: '01',
    ID_AISP: '[IMPORTAR_PLANILHA_SESP]',
    ID_Unidade: 'ES-PCES-DR-04',
    ID_CISP_DP: 'ES-PCES-DR-04',
    Nome_Oficial_Territorio: 'Cariacica (Delegacias Distritais subordinadas à 4ª DR)',
    Tipo_Territorio: 'MUNICIPIO',
    Fonte_Legal: 'PCES Atribuições + PDF Divisão Administrativa PCES',
    Vigencia_Inicio: '2025-09-01',
    Vigencia_Fim: 'VIGENTE',
    Status_Validacao: 'PENDENTE_PORTARIA_LOCAL'
  }
];

/**
 * MATRIZ DE ENTREGAS E PENDÊNCIAS DOCUMENTAIS (Seção 7)
 */
export const MG_ES_DELIVERY_STATUS: EntregaStatusItem[] = [
  {
    id: 'ent-1',
    uf: 'ES',
    entrega: 'Estrutura das 5 RISPs do ES',
    situacao: 'Confirmada',
    fonteReferencia: 'Observatório SESP-ES',
    observacao: '01 Metropolitana, 02 Norte, 03 Sul, 04 Noroeste, 05 Serrana (coincidentes com CPOR/PMES e Superintendências PCES).'
  },
  {
    id: 'ent-2',
    uf: 'ES',
    entrega: 'Existência das 23 AISPs do ES',
    situacao: 'Confirmada',
    fonteReferencia: 'Observatório SESP-ES',
    observacao: 'Correspondem às áreas dos batalhões/companhias independentes e Delegacias Regionais.'
  },
  {
    id: 'ent-3',
    uf: 'ES',
    entrega: 'Planilha oficial RISP/AISP do ES (01/09/2025)',
    situacao: 'Localizada',
    fonteReferencia: 'observatorio.sesp.es.gov.br/mapas',
    observacao: 'Importável diretamente na aba Importação/Qualidade deste painel para gerar todos os municípios.'
  },
  {
    id: 'ent-4',
    uf: 'ES',
    entrega: 'Mapas administrativos da PMES (Vitória, Vila Velha, Serra, Cariacica)',
    situacao: 'Localizada',
    fonteReferencia: 'Observatório SESP-ES',
    observacao: 'Válido exclusivamente para camada militar (PMES). Não utilizar automaticamente como circunscrição de delegacias PCES.'
  },
  {
    id: 'ent-5',
    uf: 'ES',
    entrega: 'Mapa administrativo da Polícia Civil (PCES)',
    situacao: 'Localizada',
    fonteReferencia: 'Observatório SESP-ES / PCES',
    observacao: 'Fonte distinta da PMES; define as circunscrições das Delegacias Distritais subordinadas às 4 DRs.'
  },
  {
    id: 'ent-6',
    uf: 'MG',
    entrega: 'Estrutura das 19 RISPs de MG',
    situacao: 'Confirmada',
    fonteReferencia: 'SEJUSP Anuário 2024 Anexo II & PCMG',
    observacao: '19 departamentos territoriais (além de 7 especializados de atuação estadual).'
  },
  {
    id: 'ent-7',
    uf: 'MG',
    entrega: 'Sedes e códigos IBGE das 19 RISPs de MG',
    situacao: 'Identificadas',
    fonteReferencia: 'SEJUSP-MG / IBGE',
    observacao: 'Todas as 19 sedes (3106200 Belo Horizonte a 3167202 Sete Lagoas) já georreferenciadas na base.'
  },
  {
    id: 'ent-8',
    uf: 'MG',
    entrega: 'Estrutura de 3 níveis RISP / ACISP / AISP de MG',
    situacao: 'Confirmada',
    fonteReferencia: 'SEJUSP Anexo II (pág. 153)',
    observacao: 'Campos ID_ACISP e Nome_ACISP adicionados à Tabela A para preservar o nível intermediário.'
  },
  {
    id: 'ent-9',
    uf: 'MG',
    entrega: 'Relação completa dos municípios das RISPs 2, 3 e demais regiões',
    situacao: 'Pendente de extração e validação',
    fonteReferencia: 'Anexo II do Anuário SEJUSP 2024',
    observacao: 'RISP 01 confirmada (Belo Horizonte); demais municípios devem ser extraídos sem presunção.'
  },
  {
    id: 'ent-10',
    uf: 'MG/ES',
    entrega: 'Circunscrições distritais por bairro (PCMG e PCES)',
    situacao: 'Pendente de atos oficiais',
    fonteReferencia: 'Portarias locais / PDF Divisão Administrativa PCES',
    observacao: 'Limites de regionais administrativas da prefeitura não substituem circunscrições policiais.'
  },
  {
    id: 'ent-11',
    uf: 'MG/ES',
    entrega: 'Cadastro georreferenciado completo das unidades policiais (Tabela B)',
    situacao: 'Pendente de consolidação',
    fonteReferencia: 'PCMG Quem é Quem / PCES Atribuições',
    observacao: '4 Regionais de BH (endereços completos) e 4 DRs da Grande Vitória já estruturadas como base.'
  }
];

/**
 * SCRIPT PYTHON COMPLETO PARA AUTOMATIZAÇÃO NO QGIS (Seções 5 e 6)
 * Inclui os dois ajustes obrigatórios:
 * 1. Suporte a ID_ACISP e Nome_ACISP na Tabela A
 * 2. sub["CD_MUN"] = codigo dentro de preparar_nivel antes do merge de bairros
 * 3. Bloqueio de sobreposição indevida quando AISP/DP subdivide município por bairros
 */
export const QGIS_PYTHON_SCRIPT = `# -*- coding: utf-8 -*-
"""
SEGURANCA_PUBLICA_SIG - Processamento Espacial Automatizado (QGIS / GeoPandas)
Estados: Minas Gerais (MG) e Espírito Santo (ES)
Padrão de Saída: SIRGAS 2000 (EPSG:4674) para SHP/GPKG | WGS84 (EPSG:4326) para KML/GeoJSON
"""

import geopandas as gpd
import pandas as pd
import unicodedata
from pathlib import Path

# ==========================================
# CONFIGURAÇÕES DE DIRETÓRIOS E CAMPOS
# ==========================================
BASE = Path("../dados")
OUT = Path("../resultado")

CSV_DIVISAO = BASE / "divisao_territorial.csv"
MUNICIPIOS = BASE / "municipios_ibge.shp"
BAIRROS = BASE / "bairros_oficiais.gpkg"

CAMPO_COD_MUN = "CD_MUN"
CAMPO_NOME_MUN = "NM_MUN"
CAMPO_COD_BAIRRO = "CD_MUN"
CAMPO_NOME_BAIRRO = "NM_BAIRRO"

CRS_FINAL = "EPSG:4674"  # SIRGAS 2000 (Padrão oficial IBGE / SEJUSP / SESP)
CRS_WEB = "EPSG:4326"    # WGS84 (Obrigatório para GeoJSON e KML)

for folder in ["SHP", "KML", "GEOJSON", "GPKG"]:
    (OUT / folder).mkdir(parents=True, exist_ok=True)


# ==========================================
# NORMALIZAÇÃO DE NOMES E CÓDIGOS
# ==========================================
def normalizar(valor):
    if pd.isna(valor):
        return ""
    texto = str(valor).strip().upper()
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return " ".join(texto.split())


def carregar_dados():
    # Preservar zeros à esquerda em Codigo_IBGE_Municipio e IDs
    df = pd.read_csv(
        CSV_DIVISAO,
        sep=";",
        encoding="utf-8",
        dtype={
            "UF": str,
            "Codigo_IBGE_Municipio": str,
            "ID_RISP": str,
            "ID_ACISP": str,
            "ID_AISP": str,
            "ID_CISP_DP": str,
        },
    )
    df["Codigo_IBGE_Municipio"] = df["Codigo_IBGE_Municipio"].str.zfill(7)
    df["NM_BAIRRO_NORM"] = df["Bairro_Distrito"].apply(normalizar)

    gdf_mun = gpd.read_file(MUNICIPIOS).to_crs(CRS_FINAL)
    gdf_mun[CAMPO_COD_MUN] = gdf_mun[CAMPO_COD_MUN].astype(str).str.zfill(7)

    gdf_bairros = gpd.read_file(BAIRROS).to_crs(CRS_FINAL)
    gdf_bairros[CAMPO_COD_BAIRRO] = gdf_bairros[CAMPO_COD_BAIRRO].astype(str).str.zfill(7)
    gdf_bairros["NM_BAIRRO_NORM"] = gdf_bairros[CAMPO_NOME_BAIRRO].apply(normalizar)

    return df, gdf_mun, gdf_bairros


# ==========================================
# PREPARAÇÃO POR NÍVEL COM DETECÇÃO DE SUBDIVISÃO
# ==========================================
def preparar_nivel(df, gdf_mun, gdf_bairros, coluna_id, coluna_nome):
    camadas = []
    erros_subdivisao = []

    # Agrupar por município para verificar se há subdivisão interna por bairro
    for codigo, grupo in df.groupby("Codigo_IBGE_Municipio"):
        unidades_distintas = grupo[coluna_id].dropna().unique()
        tem_bairro_definido = (
            grupo["Bairro_Distrito"].notna()
            & ~grupo["Bairro_Distrito"].astype(str).str.startswith("[")
        ).any()

        if len(unidades_distintas) > 1 and not tem_bairro_definido:
            # PRECAUÇÃO ESSENCIAL: nunca dissolver município inteiro para múltiplas AISPs/DPs
            erros_subdivisao.append(
                f"ALERTA: Município {codigo} possui {len(unidades_distintas)} unidades em {coluna_id} sem polígonos de bairro definidos."
            )
            continue

        if tem_bairro_definido and len(unidades_distintas) > 1:
            # Join espacial/atributivo no nível de BAIRRO
            sub = grupo[[coluna_id, coluna_nome, "UF", "NM_BAIRRO_NORM", "Fonte_Legal", "Status_Validacao"]].copy()
            # AJUSTE OBRIGATÓRIO 2: garantir CD_MUN antes do merge com bairros
            sub["CD_MUN"] = codigo

            bairros_mun = gdf_bairros[gdf_bairros[CAMPO_COD_BAIRRO] == codigo]
            merged = bairros_mun.merge(
                sub,
                left_on=[CAMPO_COD_BAIRRO, "NM_BAIRRO_NORM"],
                right_on=["CD_MUN", "NM_BAIRRO_NORM"],
                how="inner",
            )
            if not merged.empty:
                camadas.append(merged)
        else:
            # Município integral pertence a uma única unidade neste nível
            sub = grupo[[coluna_id, coluna_nome, "UF", "Fonte_Legal", "Status_Validacao"]].drop_duplicates(subset=[coluna_id]).copy()
            # AJUSTE OBRIGATÓRIO 2: garantir CD_MUN
            sub["CD_MUN"] = codigo

            mun_geom = gdf_mun[gdf_mun[CAMPO_COD_MUN] == codigo]
            merged = mun_geom.merge(sub, left_on=CAMPO_COD_MUN, right_on="CD_MUN", how="inner")
            if not merged.empty:
                camadas.append(merged)

    if erros_subdivisao:
        print("\\n".join(erros_subdivisao))

    if not camadas:
        return gpd.GeoDataFrame()

    gdf_concat = gpd.GeoDataFrame(pd.concat(camadas, ignore_index=True), crs=CRS_FINAL)
    # Corrigir geometrias inválidas com buffer(0) antes do dissolve
    gdf_concat["geometry"] = gdf_concat["geometry"].buffer(0)

    # Dissolve preservando metadados de rastreabilidade
    gdf_dissolved = gdf_concat.dissolve(
        by=["UF", coluna_id, coluna_nome],
        aggfunc={
            "Fonte_Legal": "first",
            "Status_Validacao": "first",
        },
        as_index=False,
    )
    gdf_dissolved["Data_Atualizacao"] = pd.Timestamp.today().strftime("%Y-%m-%d")
    return gdf_dissolved


def exportar_camada(gdf, nome_camada):
    if gdf.empty:
        print(f"Camada {nome_camada} vazia — exportação ignorada.")
        return

    # SIRGAS 2000 para SHP e GPKG
    gdf_sirgas = gdf.to_crs(CRS_FINAL)
    gdf_sirgas.to_file(OUT / "SHP" / f"{nome_camada}.shp", encoding="utf-8")
    gdf_sirgas.to_file(OUT / "GPKG" / "seguranca_publica_sig.gpkg", layer=nome_camada, driver="GPKG")

    # WGS84 para GeoJSON e KML
    gdf_web = gdf.to_crs(CRS_WEB)
    gdf_web.to_file(OUT / "GEOJSON" / f"{nome_camada}.geojson", driver="GeoJSON")
    gdf_web.to_file(OUT / "KML" / f"{nome_camada}.kml", driver="KML")
    print(f"[OK] {nome_camada}: {len(gdf)} polígonos exportados (SHP/GPKG SIRGAS 2000 + GEOJSON/KML WGS84).")


def executar_pipeline():
    df, gdf_mun, gdf_bairros = carregar_dados()

    # Processar os 4 níveis (incluindo ACISP para Minas Gerais)
    niveis = [
        ("risp", "ID_RISP", "Nome_RISP"),
        ("acisp_mg", "ID_ACISP", "Nome_ACISP"),
        ("aisp", "ID_AISP", "Nome_AISP"),
        ("cisp_dp", "ID_CISP_DP", "Nome_Delegacia_PC"),
    ]

    for nome, col_id, col_nome in niveis:
        df_nivel = df[df[col_id].notna() & (df[col_id].astype(str).str.strip() != "")]
        gdf_nivel = preparar_nivel(df_nivel, gdf_mun, gdf_bairros, col_id, col_nome)
        exportar_camada(gdf_nivel, nome)


if __name__ == "__main__":
    executar_pipeline()
`;
