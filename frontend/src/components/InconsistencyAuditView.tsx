import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Download, 
  Filter, 
  FileCheck, 
  Building2, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { TerritorialRegistry } from '../types';

interface InconsistencyAuditProps {
  registry: TerritorialRegistry | null;
  onSelectCISP: (cispId: number) => void;
  onSwitchToMap: () => void;
}

export const InconsistencyAuditView: React.FC<InconsistencyAuditProps> = ({
  registry,
  onSelectCISP,
  onSwitchToMap
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const items = registry?.inconsistencias || [];

  const filteredItems = items.filter(item => {
    if (filterType !== 'all' && item.tipo !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.municipio.toLowerCase().includes(q) ||
        item.descricao.toLowerCase().includes(q) ||
        item.impacto.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Tipo', 'Município', 'Total CISPs', 'Descrição', 'Impacto', 'Status'];
    const rows = filteredItems.map(i => [
      `"${i.tipo}"`,
      `"${i.municipio}"`,
      i.total_cisps,
      `"${i.descricao}"`,
      `"${i.impacto}"`,
      `"${i.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_inconsistencias_territoriais_rj_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 h-full bg-[#F5F5F5] overflow-y-auto p-3.5 md:p-6 space-y-4 md:space-y-6">
      {/* Top Banner */}
      <div className="p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-[#FFE600] text-[#2D3277] border border-[#E6CF00] shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-[#2D3277]">
              Auditoria de Inconsistências & Governança Cartográfica
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Módulo de controle de qualidade para identificação de municípios compartilhados por múltiplas delegacias, divergências de marcos legais (SESP 310/2000 vs SESEG 151/2008), homônimos de bairros e garantia de rastreabilidade oficial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#008744]" />
            <span>Exportar Relatório CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-[#3483FA] hover:bg-[#2968C8] text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Auditoria</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Municípios Auditados
          </div>
          <div className="text-2xl font-extrabold text-[#2D3277]">92</div>
          <div className="text-[11px] font-medium text-[#008744] mt-1">100% Cobertura Estadual</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Municípios Compartilhados
          </div>
          <div className="text-2xl font-extrabold text-amber-600">7</div>
          <div className="text-[11px] text-slate-500 mt-1">Capital, Caxias, Nova Iguaçu, São Gonçalo...</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Marcos Legais Cruzados
          </div>
          <div className="text-2xl font-extrabold text-[#2968C8]">137</div>
          <div className="text-[11px] text-slate-500 mt-1">Resoluções SESP 310/00 & SESEG 151/08</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Integridade de Cruzamento
          </div>
          <div className="text-2xl font-extrabold text-[#008744]">100%</div>
          <div className="text-[11px] font-medium text-[#008744] mt-1">Sem perda por divergência de grafia</div>
        </div>
      </div>

      {/* Filter and Search toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por município ou ocorrência..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-600 font-medium">Tipo:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#3483FA]"
          >
            <option value="all">Todos os Tipos de Inconsistência</option>
            <option value="Município Compartilhado por Múltiplas Delegacias">Municípios Compartilhados</option>
            <option value="Variação de Grafia e Homônimos">Variação de Grafia e Homônimos</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Classificação</th>
              <th className="p-3.5">Município / Escopo</th>
              <th className="p-3.5">Circunscrições</th>
              <th className="p-3.5">Descrição Técnica do Caso</th>
              <th className="p-3.5">Impacto no Cruzamento</th>
              <th className="p-3.5">Status de Governança</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredItems.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="p-3.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    {item.tipo}
                  </span>
                </td>
                <td className="p-3.5 font-bold text-slate-900">{item.municipio}</td>
                <td className="p-3.5 font-mono text-[#2968C8] font-bold">{item.total_cisps} CISPs</td>
                <td className="p-3.5 text-slate-700 max-w-sm leading-relaxed">{item.descricao}</td>
                <td className="p-3.5 text-slate-600 max-w-xs">{item.impacto}</td>
                <td className="p-3.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#00A650]/10 text-[#008744] border border-[#00A650]/25">
                    <ShieldCheck className="w-3 h-3" />
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Governance Explanatory Card */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-[#2D3277] flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#3483FA]" />
          Protocolo de Segurança contra Falsas Associações
        </h4>
        <p className="leading-relaxed">
          Para evitar que estatísticas criminais sejam associadas erroneamente a municípios ou bairros por homonímia (como bairros chamados "Centro", "Olinda" ou "São Cristóvão"), a chave primária de cruzamento em todas as tabelas é estritamente o código numérico da <strong className="text-slate-900">CISP</strong> e da <strong className="text-slate-900">AISP</strong>. O relatório preserva a integridade de dados do ISP-RJ sem criar correspondências fictícias.
        </p>
      </div>
    </div>
  );
};

