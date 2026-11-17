import React, { useMemo, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Search,
  MapPin,
  ShieldCheck,
  FolderTree,
  Clock,
  Layers
} from 'lucide-react';
import {
  DivisaoTerritorialRow,
  UnidadePolicialRow,
  RelacionamentoTerritorialRow
} from '../types/sigBase';
import {
  MG_ES_DELIVERY_STATUS,
  MG_ES_OFFICIAL_SOURCES,
  QGIS_PYTHON_SCRIPT
} from '../data/mgEsData';
import {
  exportTabelaACsv,
  exportTabelaBCsv,
  exportTabelaAuxiliarCsv,
  importSigSpreadsheetOrCsv,
  runSigQualityAudit
} from '../utils/sigCsvEngine';

interface SigBaseMgEsPanelProps {
  divisaoRows: DivisaoTerritorialRow[];
  setDivisaoRows: React.Dispatch<React.SetStateAction<DivisaoTerritorialRow[]>>;
  unidadeRows: UnidadePolicialRow[];
  setUnidadeRows: React.Dispatch<React.SetStateAction<UnidadePolicialRow[]>>;
  relacionamentoRows: RelacionamentoTerritorialRow[];
  setRelacionamentoRows: React.Dispatch<React.SetStateAction<RelacionamentoTerritorialRow[]>>;
  onLocateOnMap: (uf: 'MG' | 'ES', lat?: number | null, lng?: number | null) => void;
}

export const SigBaseMgEsPanel: React.FC<SigBaseMgEsPanelProps> = ({
  divisaoRows,
  setDivisaoRows,
  unidadeRows,
  setUnidadeRows,
  relacionamentoRows,
  setRelacionamentoRows,
  onLocateOnMap
}) => {
  const [subTab, setSubTab] = useState<'tabelas' | 'qualidade' | 'qgis' | 'pendencias'>('tabelas');
  const [activeTable, setActiveTable] = useState<'A' | 'B' | 'AUX'>('A');
  const [ufFilter, setUfFilter] = useState<'ALL' | 'MG' | 'ES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Quality Audit live metrics
  const qualityMetrics = useMemo(
    () => runSigQualityAudit(divisaoRows, relacionamentoRows),
    [divisaoRows, relacionamentoRows]
  );

  // Filtered Tables
  const filteredTabelaA = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return divisaoRows.filter(r => {
      if (ufFilter !== 'ALL' && r.UF !== ufFilter) return false;
      if (!q) return true;
      return (
        r.Nome_Municipio.toLowerCase().includes(q) ||
        r.Codigo_IBGE_Municipio.includes(q) ||
        r.Nome_RISP.toLowerCase().includes(q) ||
        r.Nome_Delegacia_PC.toLowerCase().includes(q) ||
        r.ID_RISP.toLowerCase().includes(q)
      );
    });
  }, [divisaoRows, ufFilter, searchQuery]);

  const filteredTabelaB = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return unidadeRows.filter(r => {
      if (ufFilter !== 'ALL' && r.UF !== ufFilter) return false;
      if (!q) return true;
      return (
        r.Nome_Oficial.toLowerCase().includes(q) ||
        r.Municipio.toLowerCase().includes(q) ||
        r.Endereco_Completo.toLowerCase().includes(q) ||
        r.ID_Unidade.toLowerCase().includes(q)
      );
    });
  }, [unidadeRows, ufFilter, searchQuery]);

  const filteredTabelaAux = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return relacionamentoRows.filter(r => {
      if (ufFilter !== 'ALL' && r.UF !== ufFilter) return false;
      if (!q) return true;
      return (
        r.Nome_Oficial_Territorio.toLowerCase().includes(q) ||
        r.Codigo_IBGE_Municipio.includes(q) ||
        r.ID_Unidade.toLowerCase().includes(q) ||
        r.Fonte_Legal.toLowerCase().includes(q)
      );
    });
  }, [relacionamentoRows, ufFilter, searchQuery]);

  const handleFileUpload = async (file: File) => {
    setImportMessage(`Processando "${file.name}" com preservação de zeros IBGE/CEP...`);
    try {
      const res = await importSigSpreadsheetOrCsv(file);
      if (res.tipoDetectado === 'TABELA_A' && res.divisaoRows.length > 0) {
        setDivisaoRows(prev => [...res.divisaoRows, ...prev]);
        setActiveTable('A');
      } else if (res.tipoDetectado === 'TABELA_B' && res.unidadeRows.length > 0) {
        setUnidadeRows(prev => [...res.unidadeRows, ...prev]);
        setActiveTable('B');
      } else if (res.tipoDetectado === 'TABELA_AUX' && res.relacionamentoRows.length > 0) {
        setRelacionamentoRows(prev => [...res.relacionamentoRows, ...prev]);
        setActiveTable('AUX');
      }
      setImportMessage(res.mensagem);
    } catch (err: any) {
      setImportMessage(`Erro ao importar arquivo: ${err.message}`);
    }
  };

  const handleCopyPython = () => {
    navigator.clipboard.writeText(QGIS_PYTHON_SCRIPT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadPython = () => {
    const blob = new Blob([QGIS_PYTHON_SCRIPT], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gerar_camadas.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderValidationStatus = (status?: string) => {
    if (status === 'CONFIRMADO_ATO_OFICIAL') {
      return <span className="text-[#008744] font-mono text-[10px] font-bold">CONFIRMADO_ATO_OFICIAL</span>;
    }
    if (status === 'SEDE_CONFIRMADA') {
      return <span className="text-[#2968C8] font-mono text-[10px] font-bold">SEDE_CONFIRMADA</span>;
    }
    if (status === 'PENDENTE_PORTARIA_LOCAL') {
      return <span className="text-amber-700 font-mono text-[10px] font-bold">PENDENTE_PORTARIA_LOCAL</span>;
    }
    return <span className="text-slate-500 font-mono text-[10px]">{status || 'PENDENTE_EXTRACAO'}</span>;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5 text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#2D3277] flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FFE600] border border-[#E6CF00] text-[#2D3277]">
              <Database className="w-4 h-4" />
            </span>
            <span>Base Georreferenciada SIG Integrada — Minas Gerais & Espírito Santo</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Modelagem relacional em 3 tabelas (Tabela A Divisão Territorial com ACISP, Tabela B Unidades Policiais e Tabela Auxiliar de Relacionamento Territorial).
            Distinção rigorosa entre RISP, ACISP, AISP, circunscrição de delegacia e localização física das unidades.
          </p>
        </div>

        {/* Sub-navigation segmented buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setSubTab('tabelas')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              subTab === 'tabelas' ? 'bg-[#FFE600] text-[#2D3277] font-bold shadow-xs' : 'text-slate-600 hover:text-[#2D3277] hover:bg-white'
            }`}
          >
            Tabelas A / B / Auxiliar
          </button>
          <button
            onClick={() => setSubTab('qualidade')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              subTab === 'qualidade' ? 'bg-[#FFE600] text-[#2D3277] font-bold shadow-xs' : 'text-slate-600 hover:text-[#2D3277] hover:bg-white'
            }`}
          >
            Importar & Qualidade
          </button>
          <button
            onClick={() => setSubTab('qgis')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              subTab === 'qgis' ? 'bg-[#FFE600] text-[#2D3277] font-bold shadow-xs' : 'text-slate-600 hover:text-[#2D3277] hover:bg-white'
            }`}
          >
            Script Python QGIS
          </button>
          <button
            onClick={() => setSubTab('pendencias')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              subTab === 'pendencias' ? 'bg-[#FFE600] text-[#2D3277] font-bold shadow-xs' : 'text-slate-600 hover:text-[#2D3277] hover:bg-white'
            }`}
          >
            Status & Fontes Oficiais
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SUB-TAB 1: TABELAS MESTRAS & AUXILIAR (CSV UTF-8 ;)               */}
      {/* ================================================================= */}
      {subTab === 'tabelas' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
            {/* Table switcher */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTable('A')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTable === 'A'
                    ? 'bg-[#3483FA]/10 text-[#2968C8] border border-[#3483FA]/35'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-slate-900'
                }`}
              >
                Tabela A · divisao_territorial.csv ({divisaoRows.length})
              </button>
              <button
                onClick={() => setActiveTable('B')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTable === 'B'
                    ? 'bg-[#2D3277]/10 text-[#2D3277] border border-[#2D3277]/35'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-slate-900'
                }`}
              >
                Tabela B · unidades_policiais.csv ({unidadeRows.length})
              </button>
              <button
                onClick={() => setActiveTable('AUX')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTable === 'AUX'
                    ? 'bg-[#00A650]/10 text-[#008744] border border-[#00A650]/35'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-slate-900'
                }`}
              >
                Auxiliar · relacionamento_territorial.csv ({relacionamentoRows.length})
              </button>
            </div>

            {/* Filters + CSV Export */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
                {(['ALL', 'MG', 'ES'] as const).map(uf => (
                  <button
                    key={uf}
                    onClick={() => setUfFilter(uf)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      ufFilter === uf ? 'bg-[#2D3277] text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {uf === 'ALL' ? 'MG + ES' : uf}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filtrar IBGE, município, RISP..."
                  className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white w-56"
                />
              </div>

              <button
                onClick={() => {
                  if (activeTable === 'A') exportTabelaACsv(filteredTabelaA);
                  else if (activeTable === 'B') exportTabelaBCsv(filteredTabelaB);
                  else exportTabelaAuxiliarCsv(filteredTabelaAux);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV (UTF-8 ;)</span>
              </button>
            </div>
          </div>

          {/* TABLE A */}
          {activeTable === 'A' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span>
                  Campos incluídos conforme ajuste obrigatório: <strong className="text-[#2968C8] font-mono">ID_ACISP</strong> e{' '}
                  <strong className="text-[#2968C8] font-mono">Nome_ACISP</strong> para suportar a hierarquia de 3 níveis de MG.
                </span>
                <span className="font-mono text-slate-500">Separador: ; · UTF-8</span>
              </div>
              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200">UF</th>
                      <th className="p-2.5 border-b border-slate-200">IBGE (7 dig.)</th>
                      <th className="p-2.5 border-b border-slate-200">Município</th>
                      <th className="p-2.5 border-b border-slate-200">RISP</th>
                      <th className="p-2.5 border-b border-slate-200">ACISP (MG)</th>
                      <th className="p-2.5 border-b border-slate-200">AISP / PM</th>
                      <th className="p-2.5 border-b border-slate-200">Delegacia PC / Tipo</th>
                      <th className="p-2.5 border-b border-slate-200">Bairro / Distrito</th>
                      <th className="p-2.5 border-b border-slate-200">Validação</th>
                      <th className="p-2.5 border-b border-slate-200 text-right">Mapa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredTabelaA.map((row, idx) => (
                      <tr key={`${row.UF}-${row.Codigo_IBGE_Municipio}-${idx}`} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-[#2D3277]">{row.UF}</td>
                        <td className="p-2.5 font-mono text-[#2968C8] font-semibold">{row.Codigo_IBGE_Municipio || '—'}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{row.Nome_Municipio}</td>
                        <td className="p-2.5">
                          <span className="font-mono text-slate-800">{row.ID_RISP}</span>
                          <span className="text-slate-500"> · {row.Nome_RISP}</span>
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {row.ID_ACISP ? (
                            <span>
                              <span className="font-mono text-[#2D3277] font-semibold">{row.ID_ACISP}</span>
                              <span className="block text-[10px] text-slate-500 max-w-[170px] truncate">{row.Nome_ACISP}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">N/A (ES)</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span className="font-mono text-slate-800 text-[11px]">{row.ID_AISP}</span>
                          <span className="block text-[10px] text-slate-500 max-w-[180px] truncate">
                            {row.Unidade_PM_Responsavel}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="text-slate-900 font-medium block max-w-[200px] truncate">
                            {row.Nome_Delegacia_PC}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {row.ID_CISP_DP} · {row.Tipo_Delegacia}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-600 max-w-[180px] truncate" title={row.Bairro_Distrito}>
                          {row.Bairro_Distrito}
                        </td>
                        <td className="p-2.5">{renderValidationStatus(row.Status_Validacao)}</td>
                        <td className="p-2.5 text-right">
                          {row.Lat_Ref && row.Lng_Ref ? (
                            <button
                              onClick={() => onLocateOnMap(row.UF, row.Lat_Ref, row.Lng_Ref)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-[#FFE600] hover:text-[#2D3277] hover:border-[#E6CF00] text-[#2968C8] font-semibold border border-slate-200 rounded text-[11px] transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>Ver</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE B */}
          {activeTable === 'B' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span>
                  Chave composta única (<strong className="text-[#2D3277] font-mono">ID_Unidade</strong>) com preservação de zeros em CEP e coordenadas institucionais.
                </span>
                <span className="font-mono text-slate-500">PCMG / PCES</span>
              </div>
              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200">ID_Unidade</th>
                      <th className="p-2.5 border-b border-slate-200">Órgão</th>
                      <th className="p-2.5 border-b border-slate-200">Nome Oficial</th>
                      <th className="p-2.5 border-b border-slate-200">Endereço Completo</th>
                      <th className="p-2.5 border-b border-slate-200">Bairro / Município</th>
                      <th className="p-2.5 border-b border-slate-200">CEP</th>
                      <th className="p-2.5 border-b border-slate-200">Lat / Lng</th>
                      <th className="p-2.5 border-b border-slate-200 text-right">Mapa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredTabelaB.map(row => (
                      <tr key={row.ID_Unidade} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-[#2968C8] font-semibold text-[11px]">{row.ID_Unidade}</td>
                        <td className="p-2.5 font-mono font-bold text-[#2D3277]">{row.Orgao}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{row.Nome_Oficial}</td>
                        <td className="p-2.5 text-slate-700">{row.Endereco_Completo}</td>
                        <td className="p-2.5 text-slate-600">
                          {row.Bairro} · <span className="text-slate-900 font-medium">{row.Municipio}</span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-700">{row.CEP}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {row.Latitude != null && row.Longitude != null
                            ? `${row.Latitude.toFixed(4)}, ${row.Longitude.toFixed(4)}`
                            : 'Pendente'}
                        </td>
                        <td className="p-2.5 text-right">
                          {row.Latitude != null && row.Longitude != null && (
                            <button
                              onClick={() => onLocateOnMap(row.UF, row.Latitude, row.Longitude)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-[#FFE600] hover:text-[#2D3277] hover:border-[#E6CF00] text-[#2968C8] font-semibold border border-slate-200 rounded text-[11px] transition-colors cursor-pointer"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>Ver</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE AUXILIAR */}
          {activeTable === 'AUX' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span>
                  Regra fundamental: cada linha representa uma relação territorial legal (MUNICIPIO, DISTRITO ou BAIRRO); o polígono é produzido posteriormente no QGIS.
                </span>
                <span className="font-mono text-slate-500">relacionamento_territorial.csv</span>
              </div>
              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200">UF</th>
                      <th className="p-2.5 border-b border-slate-200">IBGE</th>
                      <th className="p-2.5 border-b border-slate-200">RISP / ID_Unidade</th>
                      <th className="p-2.5 border-b border-slate-200">Território Oficial</th>
                      <th className="p-2.5 border-b border-slate-200">Tipo</th>
                      <th className="p-2.5 border-b border-slate-200">Fonte Legal</th>
                      <th className="p-2.5 border-b border-slate-200">Vigência</th>
                      <th className="p-2.5 border-b border-slate-200">Status Validação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredTabelaAux.map((row, idx) => (
                      <tr key={`${row.ID_Unidade}-${idx}`} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-[#2D3277]">{row.UF}</td>
                        <td className="p-2.5 font-mono text-[#2968C8] font-semibold">{row.Codigo_IBGE_Municipio}</td>
                        <td className="p-2.5">
                          <span className="font-mono text-slate-800">RISP {row.ID_RISP}</span>
                          <span className="block text-[10px] font-mono text-[#2D3277]">{row.ID_Unidade}</span>
                        </td>
                        <td className="p-2.5 text-slate-900 font-semibold">{row.Nome_Oficial_Territorio}</td>
                        <td className="p-2.5 font-mono text-slate-700">{row.Tipo_Territorio}</td>
                        <td className="p-2.5 text-slate-600 text-[11px]">{row.Fonte_Legal}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {row.Vigencia_Inicio} → {row.Vigencia_Fim}
                        </td>
                        <td className="p-2.5">{renderValidationStatus(row.Status_Validacao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 2: IMPORTAÇÃO OFICIAL & CONTROLE DE QUALIDADE (SEÇÃO 6.1) */}
      {/* ================================================================= */}
      {subTab === 'qualidade' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Upload card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2D3277]">
              <Upload className="w-4 h-4 text-[#3483FA]" />
              <span>Importar Planilha Oficial (SESP-ES / SEJUSP-MG / CSV)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Envie a planilha oficial <strong className="text-slate-900 font-mono">RISP E AISP.xlsx</strong> do Observatório da SESP-ES,
              quadros do Anexo II da SEJUSP-MG, ou os arquivos CSV separados por <code className="text-[#2968C8] font-bold">;</code> (<code className="text-[#2968C8]">divisao_territorial.csv</code>, <code className="text-[#2968C8]">unidades_policiais.csv</code>).
              Os zeros à esquerda do Código IBGE (7 dígitos) e CEP são preservados automaticamente.
            </p>

            <label className="block border-2 border-dashed border-slate-300 hover:border-[#3483FA] rounded-lg p-6 text-center cursor-pointer bg-slate-50 transition-colors">
              <Upload className="w-7 h-7 text-[#3483FA] mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-900 block">
                Selecionar arquivo .xlsx, .xls ou .csv (UTF-8 ;)
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Detecção automática de Tabela A, Tabela B ou Tabela Auxiliar
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={e => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
                className="hidden"
              />
            </label>

            {importMessage && (
              <div className="p-3 bg-[#3483FA]/10 border border-[#3483FA]/30 rounded-lg text-xs text-[#2D3277] flex items-start gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#008744]" />
                <span>{importMessage}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
              <strong>Regra de Ouro Intramunicipal:</strong> A divisão territorial da PMES (ex: Cariacica, Serra, Vila Velha, Vitória)
              não é aplicada automaticamente como circunscrição das delegacias da PCES. Utilize a fonte distinta da Polícia Civil.
            </div>
          </div>

          {/* 8-Point Quality Control Matrix (Seção 6.1) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#2D3277]">
                <ShieldCheck className="w-4 h-4 text-[#008744]" />
                <span>Controle de Qualidade SIG (Auditoria Seção 6.1)</span>
              </div>
              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {qualityMetrics.totalRegistrosAnalisados} linhas auditadas
              </span>
            </div>

            <div className="space-y-2">
              {qualityMetrics.detalhes.map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.campo}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{item.nota}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-bold text-[#2D3277] tabular-nums">
                      {item.resultado}
                    </div>
                    <div
                      className={`text-[10px] font-mono font-bold ${
                        item.status === 'OK'
                          ? 'text-[#008744]'
                          : item.status === 'ALERTA'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      Esperado: {item.esperado}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 3: SCRIPT PYTHON QGIS (gerar_camadas.py)                  */}
      {/* ================================================================= */}
      {subTab === 'qgis' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2D3277] uppercase tracking-wider">
                <FolderTree className="w-4 h-4 text-[#3483FA]" />
                <span>Estrutura de Diretórios</span>
              </div>
              <pre className="text-[11px] font-mono text-slate-100 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
{`SEGURANCA_PUBLICA_SIG/
├── dados/
│   ├── divisao_territorial.csv
│   ├── unidades_policiais.csv
│   ├── municipios_ibge.shp
│   └── bairros_oficiais.gpkg
├── processamento/
│   └── gerar_camadas.py
└── resultado/
    ├── SHP/      (EPSG:4674)
    ├── KML/      (EPSG:4326)
    ├── GEOJSON/  (EPSG:4326)
    └── GPKG/     (EPSG:4674)`}
              </pre>
            </div>

            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#008744] uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Ajustes Obrigatórios Implementados & Precauções Espaciais</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">1. Nível ACISP preservado para MG</div>
                  <p className="text-[11px] text-slate-600">
                    Tabela A inclui <code className="text-[#2968C8] font-semibold">ID_ACISP</code> e <code className="text-[#2968C8] font-semibold">Nome_ACISP</code>,
                    exportando a camada dedicada <code className="text-[#2968C8] font-semibold">acisp_mg</code> além de RISP, AISP e CISP/DP.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">2. Chave CD_MUN antes do merge</div>
                  <p className="text-[11px] text-slate-600">
                    Em <code className="text-[#2968C8] font-semibold">preparar_nivel</code>, executa{' '}
                    <code className="text-[#008744] font-semibold">sub["CD_MUN"] = codigo</code> antes do join com{' '}
                    <code className="text-slate-800 font-semibold">bairros_oficiais.gpkg</code>.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">3. Bloqueio de sobreposição indevida</div>
                  <p className="text-[11px] text-slate-600">
                    Detecta municípios divididos em múltiplas AISPs/DPs e bloqueia o dissolve municipal caso faltem polígonos de bairros.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">4. Padrão Duplo de Coordenadas</div>
                  <p className="text-[11px] text-slate-600">
                    Preserva <strong className="text-slate-900">SIRGAS 2000 (EPSG:4674)</strong> para SHP/GPKG e reprojeta para <strong className="text-slate-900">WGS84 (EPSG:4326)</strong> em GeoJSON/KML.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2D3277]">
                <FileCode2 className="w-4 h-4 text-[#3483FA]" />
                <span>processamento/gerar_camadas.py</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPython}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-[#008744]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copiado' : 'Copiar Código'}</span>
                </button>
                <button
                  onClick={handleDownloadPython}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar gerar_camadas.py</span>
                </button>
              </div>
            </div>
            <pre className="p-4 text-[11px] font-mono text-slate-100 bg-slate-900 overflow-x-auto max-h-[460px] leading-relaxed">
              {QGIS_PYTHON_SCRIPT}
            </pre>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 4: STATUS DAS ENTREGAS (SEÇÃO 7) & FONTES OFICIAIS        */}
      {/* ================================================================= */}
      {subTab === 'pendencias' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-[#2D3277]">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Separação Documental: Confirmado vs. Pendente de Extração</span>
            </div>
            <div className="space-y-2">
              {MG_ES_DELIVERY_STATUS.map(item => {
                const isPending = item.situacao.startsWith('Pendente');
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border text-xs ${
                      isPending
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        <span className="font-mono text-[#2968C8] mr-1.5">{item.uf}</span>
                        {item.entrega}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold shrink-0 ${
                          isPending ? 'text-amber-700' : 'text-[#008744]'
                        }`}
                      >
                        {item.situacao}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">{item.observacao}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Fonte: {item.fonteReferencia}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-[#2D3277]">Fontes Oficiais Primárias (MG & ES)</h3>
              <div className="space-y-2.5">
                {MG_ES_OFFICIAL_SOURCES.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-slate-50 hover:bg-[#FFE600]/20 border border-slate-200 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#2968C8] group-hover:text-[#2D3277]">
                        {src.uf} · {src.titulo}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2D3277] shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{src.descricao}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 text-xs shadow-sm">
              <div className="font-bold text-[#2D3277] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Perguntas Respondidas por Ponto Geográfico</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4">
                <li>Qual município (Código IBGE 7 dígitos) e bairro/distrito?</li>
                <li>Qual RISP (5 no ES / 19 em MG)?</li>
                <li>Qual ACISP intermediária (quando aplicável em MG)?</li>
                <li>Qual AISP operacional (23 no ES)?</li>
                <li>Qual unidade da Polícia Militar (PMES / PMMG) responsável?</li>
                <li>Qual delegacia da Polícia Civil (PCES / PCMG) atende e sua circunscrição legal?</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
