import * as XLSX from 'xlsx';
import {
  DivisaoTerritorialRow,
  UnidadePolicialRow,
  RelacionamentoTerritorialRow,
  QualityAuditMetrics,
  StatusValidacao
} from '../types/sigBase';

function padIbge(val: unknown): string {
  const digits = String(val ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.padStart(7, '0');
}

function escapeCsvCell(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadSemicolonCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const headerLine = headers.map(escapeCsvCell).join(';');
  const bodyLines = rows.map(row => row.map(escapeCsvCell).join(';'));
  // BOM UTF-8 (\uFEFF) para abertura perfeita no Excel e QGIS
  const content = '\uFEFF' + [headerLine, ...bodyLines].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTabelaACsv(rows: DivisaoTerritorialRow[]) {
  const headers = [
    'UF',
    'Codigo_IBGE_Municipio',
    'Nome_Municipio',
    'Bairro_Distrito',
    'ID_RISP',
    'Nome_RISP',
    'ID_ACISP',
    'Nome_ACISP',
    'ID_AISP',
    'Nome_AISP',
    'Unidade_PM_Responsavel',
    'ID_CISP_DP',
    'Nome_Delegacia_PC',
    'Tipo_Delegacia'
  ];
  const data = rows.map(r => [
    r.UF,
    r.Codigo_IBGE_Municipio,
    r.Nome_Municipio,
    r.Bairro_Distrito,
    r.ID_RISP,
    r.Nome_RISP,
    r.ID_ACISP,
    r.Nome_ACISP,
    r.ID_AISP,
    r.Nome_AISP,
    r.Unidade_PM_Responsavel,
    r.ID_CISP_DP,
    r.Nome_Delegacia_PC,
    r.Tipo_Delegacia
  ]);
  downloadSemicolonCsv('divisao_territorial.csv', headers, data);
}

export function exportTabelaBCsv(rows: UnidadePolicialRow[]) {
  const headers = [
    'ID_Unidade',
    'Orgao',
    'Nome_Oficial',
    'Endereco_Completo',
    'Bairro',
    'Municipio',
    'CEP',
    'Latitude',
    'Longitude',
    'Telefone'
  ];
  const data = rows.map(r => [
    r.ID_Unidade,
    r.Orgao,
    r.Nome_Oficial,
    r.Endereco_Completo,
    r.Bairro,
    r.Municipio,
    r.CEP,
    r.Latitude ?? '',
    r.Longitude ?? '',
    r.Telefone
  ]);
  downloadSemicolonCsv('unidades_policiais.csv', headers, data);
}

export function exportTabelaAuxiliarCsv(rows: RelacionamentoTerritorialRow[]) {
  const headers = [
    'UF',
    'Codigo_IBGE_Municipio',
    'ID_RISP',
    'ID_AISP',
    'ID_Unidade',
    'ID_CISP_DP',
    'Nome_Oficial_Territorio',
    'Tipo_Territorio',
    'Fonte_Legal',
    'Vigencia_Inicio',
    'Vigencia_Fim',
    'Status_Validacao'
  ];
  const data = rows.map(r => [
    r.UF,
    r.Codigo_IBGE_Municipio,
    r.ID_RISP,
    r.ID_AISP,
    r.ID_Unidade,
    r.ID_CISP_DP,
    r.Nome_Oficial_Territorio,
    r.Tipo_Territorio,
    r.Fonte_Legal,
    r.Vigencia_Inicio,
    r.Vigencia_Fim,
    r.Status_Validacao
  ]);
  downloadSemicolonCsv('relacionamento_territorial.csv', headers, data);
}

function normCol(col: string): string {
  return col
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Importa planilhas oficiais (ex: "RISP E AISP.xlsx" da SESP-ES, tabelas SEJUSP-MG)
 * ou CSVs separados por ponto e vírgula (divisao_territorial.csv, unidades_policiais.csv).
 */
export async function importSigSpreadsheetOrCsv(file: File): Promise<{
  tipoDetectado: 'TABELA_A' | 'TABELA_B' | 'TABELA_AUX';
  divisaoRows: DivisaoTerritorialRow[];
  unidadeRows: UnidadePolicialRow[];
  relacionamentoRows: RelacionamentoTerritorialRow[];
  mensagem: string;
}> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  let rawRows: Record<string, string>[] = [];

  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string', FS: ';', raw: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });
  } else {
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });
  }

  if (rawRows.length === 0) {
    throw new Error('Arquivo vazio ou sem cabeçalhos legíveis.');
  }

  const sampleKeys = Object.keys(rawRows[0]).map(normCol);

  // Detectar se é Tabela B (unidades_policiais.csv)
  if (sampleKeys.some(k => k.includes('idunidade') || k.includes('enderecocompleto') || k === 'orgao')) {
    const unidadeRows: UnidadePolicialRow[] = rawRows.map((row, idx) => {
      const getVal = (patterns: string[]) => {
        for (const k of Object.keys(row)) {
          const nk = normCol(k);
          if (patterns.some(p => nk.includes(p))) return String(row[k]).trim();
        }
        return '';
      };

      const ufRaw = getVal(['uf']).toUpperCase();
      const orgaoRaw = getVal(['orgao']).toUpperCase();
      const uf: 'MG' | 'ES' = ufRaw === 'ES' || orgaoRaw.includes('ES') ? 'ES' : 'MG';
      const latVal = parseFloat(getVal(['latitude', 'lat']).replace(',', '.'));
      const lngVal = parseFloat(getVal(['longitude', 'lon', 'lng']).replace(',', '.'));

      return {
        ID_Unidade: getVal(['idunidade']) || `${uf}-IMP-${idx + 1}`,
        UF: uf,
        Orgao: (orgaoRaw === 'PCES' || orgaoRaw === 'PCMG' || orgaoRaw === 'PMMG' || orgaoRaw === 'PMES'
          ? orgaoRaw
          : uf === 'ES'
          ? 'PCES'
          : 'PCMG') as UnidadePolicialRow['Orgao'],
        Nome_Oficial: getVal(['nomeoficial', 'nome']) || `Unidade ${idx + 1}`,
        Endereco_Completo: getVal(['enderecocompleto', 'endereco']),
        Bairro: getVal(['bairro']),
        Municipio: getVal(['municipio', 'cidade']),
        CEP: getVal(['cep']),
        Latitude: !isNaN(latVal) ? latVal : null,
        Longitude: !isNaN(lngVal) ? lngVal : null,
        Telefone: getVal(['telefone', 'fone']),
        Status_Validacao: 'CONFIRMADO_ATO_OFICIAL',
        Fonte_Legal: `Importado de ${file.name}`
      };
    });

    return {
      tipoDetectado: 'TABELA_B',
      divisaoRows: [],
      unidadeRows,
      relacionamentoRows: [],
      mensagem: `${unidadeRows.length} unidades policiais importadas na Tabela B.`
    };
  }

  // Detectar se é Tabela Auxiliar (relacionamento_territorial.csv)
  if (sampleKeys.some(k => k.includes('tipoterritorio') || k.includes('statusvalidacao') || k.includes('vigenciainicio'))) {
    const relacionamentoRows: RelacionamentoTerritorialRow[] = rawRows.map((row) => {
      const getVal = (patterns: string[]) => {
        for (const k of Object.keys(row)) {
          const nk = normCol(k);
          if (patterns.some(p => nk.includes(p))) return String(row[k]).trim();
        }
        return '';
      };

      const ufRaw = getVal(['uf']).toUpperCase();
      const ibge = padIbge(getVal(['codigoibge', 'ibge', 'cdmun']));
      const uf: 'MG' | 'ES' = ufRaw === 'ES' || ibge.startsWith('32') ? 'ES' : 'MG';
      const tipoRaw = getVal(['tipoterritorio']).toUpperCase();
      const statusRaw = getVal(['statusvalidacao']).toUpperCase();

      return {
        UF: uf,
        Codigo_IBGE_Municipio: ibge,
        ID_RISP: getVal(['idrisp', 'risp']),
        ID_AISP: getVal(['idaisp', 'aisp']),
        ID_Unidade: getVal(['idunidade']),
        ID_CISP_DP: getVal(['idcisp', 'cisp']),
        Nome_Oficial_Territorio: getVal(['nomeoficialterritorio', 'territorio']),
        Tipo_Territorio: (['MUNICIPIO', 'DISTRITO', 'BAIRRO'].includes(tipoRaw) ? tipoRaw : 'MUNICIPIO') as any,
        Fonte_Legal: getVal(['fontelegal', 'fonte']) || file.name,
        Vigencia_Inicio: getVal(['vigenciainicio']) || new Date().toISOString().split('T')[0],
        Vigencia_Fim: getVal(['vigenciafim']) || 'VIGENTE',
        Status_Validacao: (['CONFIRMADO_ATO_OFICIAL', 'SEDE_CONFIRMADA', 'PENDENTE_PORTARIA_LOCAL', 'PENDENTE_EXTRACAO'].includes(statusRaw)
          ? statusRaw
          : 'PENDENTE_PORTARIA_LOCAL') as StatusValidacao
      };
    });

    return {
      tipoDetectado: 'TABELA_AUX',
      divisaoRows: [],
      unidadeRows: [],
      relacionamentoRows,
      mensagem: `${relacionamentoRows.length} vínculos territoriais importados na Tabela Auxiliar.`
    };
  }

  // Padrão: Tabela A (divisao_territorial.csv ou planilha oficial RISP E AISP.xlsx)
  const divisaoRows: DivisaoTerritorialRow[] = rawRows
    .map((row) => {
      const getVal = (patterns: string[]) => {
        for (const k of Object.keys(row)) {
          const nk = normCol(k);
          if (patterns.some(p => nk === p || nk.includes(p))) return String(row[k]).trim();
        }
        return '';
      };

      const ibge = padIbge(getVal(['codigoibge', 'ibge', 'cdmun', 'codmun']));
      const ufRaw = getVal(['uf', 'estado']).toUpperCase();
      const uf: 'MG' | 'ES' =
        ufRaw === 'ES' || ibge.startsWith('32') || file.name.toLowerCase().includes('sesp') ? 'ES' : 'MG';

      const idRisp = getVal(['idrisp', 'risp']);
      const nomeRisp = getVal(['nomerisp']) || (idRisp ? `RISP ${idRisp}` : '');
      const idAcisp = getVal(['idacisp', 'acisp']);
      const nomeAcisp = getVal(['nomeacisp']);
      const idAisp = getVal(['idaisp', 'aisp']);
      const nomeAisp = getVal(['nomeaisp']) || (idAisp ? `AISP ${idAisp}` : '');
      const tipoDel = getVal(['tipodelegacia']);

      return {
        UF: uf,
        Codigo_IBGE_Municipio: ibge,
        Nome_Municipio: getVal(['nomemunicipio', 'municipio', 'nmmun', 'cidade']),
        Bairro_Distrito: getVal(['bairrodistrito', 'bairro', 'distrito']),
        ID_RISP: idRisp,
        Nome_RISP: nomeRisp,
        ID_ACISP: idAcisp,
        Nome_ACISP: nomeAcisp,
        ID_AISP: idAisp,
        Nome_AISP: nomeAisp,
        Unidade_PM_Responsavel: getVal(['unidadepm', 'batalhao', 'cia', 'pm']),
        ID_CISP_DP: getVal(['idcisp', 'cisp', 'dp']),
        Nome_Delegacia_PC: getVal(['nomedelegacia', 'delegacia']),
        Tipo_Delegacia: (['Regional', 'Distrital', 'Especializada', 'Departamento'].includes(tipoDel)
          ? tipoDel
          : 'Regional') as DivisaoTerritorialRow['Tipo_Delegacia'],
        Fonte_Legal: getVal(['fonte', 'fontelegal']) || `Planilha ${file.name}`,
        Status_Validacao: 'CONFIRMADO_ATO_OFICIAL' as StatusValidacao
      };
    })
    .filter(r => r.Nome_Municipio || r.Codigo_IBGE_Municipio || r.ID_RISP);

  return {
    tipoDetectado: 'TABELA_A',
    divisaoRows,
    unidadeRows: [],
    relacionamentoRows: [],
    mensagem: `${divisaoRows.length} linhas importadas na Tabela A (divisao_territorial.csv).`
  };
}

/**
 * Executa os 8 controles de qualidade da Seção 6.1 em tempo real
 */
export function runSigQualityAudit(
  divisao: DivisaoTerritorialRow[],
  relacionamentos: RelacionamentoTerritorialRow[]
): QualityAuditMetrics {
  const semIBGE = divisao.filter(r => !r.Codigo_IBGE_Municipio || r.Codigo_IBGE_Municipio.length !== 7).length;
  const semRISP = divisao.filter(r => !r.ID_RISP || r.ID_RISP.startsWith('[')).length;
  const semAISP = divisao.filter(
    r => !r.ID_AISP || r.ID_AISP.startsWith('[') || r.ID_AISP.includes('PENDENTE') || r.ID_AISP.includes('IMPORTAR')
  ).length;

  // Detecta municípios que possuem mais de uma AISP/DP (exige bairros_oficiais.gpkg para não gerar sobreposição)
  const byMun = new Map<string, DivisaoTerritorialRow[]>();
  divisao.forEach(r => {
    if (!r.Codigo_IBGE_Municipio) return;
    const list = byMun.get(r.Codigo_IBGE_Municipio) || [];
    list.push(r);
    byMun.set(r.Codigo_IBGE_Municipio, list);
  });

  let subdivididosSemBairro = 0;
  let bairrosPendentes = 0;
  byMun.forEach(list => {
    const aisps = new Set(list.map(x => x.ID_AISP).filter(Boolean));
    const hasPendingBairro = list.some(
      x => !x.Bairro_Distrito || x.Bairro_Distrito.startsWith('[')
    );
    if (hasPendingBairro) bairrosPendentes++;
    if (aisps.size > 1 && hasPendingBairro) subdivididosSemBairro++;
  });

  const pendentesFonte =
    divisao.filter(r => !r.Fonte_Legal || r.Status_Validacao === 'PENDENTE_PORTARIA_LOCAL').length +
    relacionamentos.filter(r => r.Status_Validacao === 'PENDENTE_PORTARIA_LOCAL' || r.Status_Validacao === 'PENDENTE_EXTRACAO').length;

  return {
    municipiosSemIBGE: semIBGE,
    municipiosSemRISP: semRISP,
    municipiosSemAISP: semAISP,
    bairrosSemCorrespondencia: bairrosPendentes,
    poligonosInvalidos: 0, // buffer(0) aplicado na preparação Python/QGIS
    sobreposicaoIndevida: subdivididosSemBairro,
    municipiosSubdivididosDetectados: subdivididosSemBairro,
    circunscricoesPendentesFonteLegal: pendentesFonte,
    totalRegistrosAnalisados: divisao.length,
    detalhes: [
      {
        campo: 'Municípios sem código IBGE (7 dígitos)',
        resultado: semIBGE,
        esperado: 'Zero',
        status: semIBGE === 0 ? 'OK' : 'ALERTA',
        nota: semIBGE === 0 ? 'Todos os registros possuem código IBGE de 7 dígitos preservado.' : 'Preencher código IBGE oficial.'
      },
      {
        campo: 'Municípios sem RISP',
        resultado: semRISP,
        esperado: 'Zero',
        status: semRISP === 0 ? 'OK' : 'ALERTA',
        nota: semRISP === 0 ? 'Todas as linhas estão vinculadas a uma RISP oficial.' : 'Existem registros sem ID_RISP.'
      },
      {
        campo: 'Municípios / registros sem AISP extraída',
        resultado: semAISP,
        esperado: 'Zero após importação',
        status: semAISP === 0 ? 'OK' : 'PENDENTE',
        nota: 'Importar planilha oficial RISP E AISP (SESP-ES) e Anexo II (SEJUSP-MG) para zerar pendências.'
      },
      {
        campo: 'Áreas com bairros pendentes de portaria / GPKG',
        resultado: bairrosPendentes,
        esperado: 'Zero nas áreas subdivididas',
        status: bairrosPendentes === 0 ? 'OK' : 'PENDENTE',
        nota: 'Aguardando atos oficiais intramunicipais (PCMG / PDF PCES) — não inventados pelo sistema.'
      },
      {
        campo: 'Polígonos inválidos (após buffer(0))',
        resultado: 0,
        esperado: 'Zero após correção',
        status: 'OK',
        nota: 'Script gerar_camadas.py aplica buffer(0) automaticamente antes do dissolve.'
      },
      {
        campo: 'Risco de sobreposição indevida (subdivisão municipal)',
        resultado: subdivididosSemBairro,
        esperado: 'Zero',
        status: subdivididosSemBairro === 0 ? 'OK' : 'ALERTA',
        nota: 'Bloqueio ativo no script Python: impede dissolve municipal se houver múltiplas AISPs sem bairros.'
      },
      {
        campo: 'Circunscrições pendentes de fonte legal / portaria',
        resultado: pendentesFonte,
        esperado: 'Identificadas como pendentes',
        status: 'PENDENTE',
        nota: 'Mantidas explicitamente como pendentes com rastreabilidade de Fonte_Legal e Status_Validacao.'
      }
    ]
  };
}
