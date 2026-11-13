import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle, Info, Download, ShieldAlert, Check } from 'lucide-react';
import { InconsistencyItem } from '../types/territory';

interface InconsistencyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  inconsistencies: InconsistencyItem[];
}

export const InconsistencyAuditModal: React.FC<InconsistencyAuditModalProps> = ({
  isOpen,
  onClose,
  inconsistencies
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'alta' | 'media' | 'baixa'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = inconsistencies.filter(item => {
    if (filterSeverity !== 'all' && item.severidade !== filterSeverity) return false;
    if (searchTerm) {
      const matchDesc = item.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMuni = item.registro.municipio?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCisp = String(item.registro.cisp).includes(searchTerm);
      return matchDesc || matchMuni || matchCisp;
    }
    return true;
  });

  const handleExportCsv = () => {
    const header = 'ID,Tipo,Severidade,CISP,AISP,RISP,Município,Descrição\n';
    const rows = inconsistencies.map(item => {
      return `"${item.id}","${item.tipo}","${item.severidade}","${item.registro.cisp || ''}","${item.registro.aisp || ''}","${item.registro.risp || ''}","${item.registro.municipio || ''}","${item.descricao.replace(/"/g, '""')}"`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_inconsistencias_territoriais_rj_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Relatório de Inconsistências & Auditoria Territorial
              </h3>
              <p className="text-[11px] text-slate-400">
                Detecção automática de duplicidades, cruzamento de códigos RISP/AISP/CISP e jurisdições compartilhadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filterSeverity === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({inconsistencies.length})
            </button>
            <button
              onClick={() => setFilterSeverity('alta')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filterSeverity === 'alta' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Alta ({inconsistencies.filter(i => i.severidade === 'alta').length})
            </button>
            <button
              onClick={() => setFilterSeverity('media')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filterSeverity === 'media' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Média ({inconsistencies.filter(i => i.severidade === 'media').length})
            </button>
            <button
              onClick={() => setFilterSeverity('baixa')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filterSeverity === 'baixa' ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'text-slate-400 hover:text-sky-400'
              }`}
            >
              Informativa ({inconsistencies.filter(i => i.severidade === 'baixa').length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Buscar por município ou delegacia..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-64 bg-slate-900 border border-slate-800 text-white rounded-md px-3 py-1 text-xs focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Inconsistencies List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.map(item => {
            const severityColor =
              item.severidade === 'alta'
                ? 'border-rose-900/60 bg-rose-950/20 text-rose-300'
                : item.severidade === 'media'
                ? 'border-amber-900/60 bg-amber-950/20 text-amber-300'
                : 'border-slate-800 bg-slate-900/40 text-slate-300';

            const badgeBg =
              item.severidade === 'alta'
                ? 'text-rose-400 bg-rose-950/80 border-rose-800'
                : item.severidade === 'media'
                ? 'text-amber-400 bg-amber-950/80 border-amber-800'
                : 'text-sky-400 bg-sky-950/80 border-sky-800';

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border flex items-start gap-3 text-xs ${severityColor}`}
              >
                <div className="shrink-0 mt-0.5">
                  {item.severidade === 'alta' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : item.severidade === 'media' ? (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Info className="w-4 h-4 text-sky-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeBg}`}>
                      {item.tipo}
                    </span>
                    {item.registro.cisp && (
                      <span className="font-mono text-slate-300 font-semibold">
                        {String(item.registro.cisp).padStart(3, '0')}ª DP
                      </span>
                    )}
                    {item.registro.municipio && (
                      <span className="text-slate-400">· {item.registro.municipio}</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{item.descricao}</p>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhuma inconsistência encontrada para os filtros selecionados.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            Regra do Sistema: não relacionar áreas apenas pelo nome quando códigos oficiais estão presentes.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
