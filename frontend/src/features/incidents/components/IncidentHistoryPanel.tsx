import React from 'react';
import { Plus, RefreshCw, Send } from 'lucide-react';
import { IncidentHistoryEntry, PackageCustodyStatus } from '../../../types/admin';
import { CUSTODY_LABELS } from '../../../utils/corporateIncidentMetadata';

interface IncidentHistoryPanelProps {
  historyEntries: IncidentHistoryEntry[];
  title: string;
  status: PackageCustodyStatus;
  description: string;
  isAdding: boolean;
  onTitleChange: (value: string) => void;
  onStatusChange: (value: PackageCustodyStatus) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const formatTimestamp = (timestamp: unknown) => {
  if (!timestamp) return 'agora';
  try {
    const value = timestamp as { toDate?: () => Date };
    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(timestamp as string | number | Date);
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
};

export const IncidentHistoryPanel: React.FC<IncidentHistoryPanelProps> = ({
  historyEntries,
  title,
  status,
  description,
  isAdding,
  onTitleChange,
  onStatusChange,
  onDescriptionChange,
  onSubmit
}) => (
  <div className="space-y-5">
    <form onSubmit={onSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
      <span className="font-extrabold text-[#2D3277] flex items-center gap-1.5">
        <Plus className="w-4 h-4 text-[#00A650]" />
        <span>Adicionar Novo Andamento ao Histórico</span>
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 mb-1 font-bold">Título do Andamento *</label>
          <input type="text" value={title} onChange={event => onTitleChange(event.target.value)}
            placeholder="Ex: Carga periciada e liberada" required
            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none" />
        </div>
        <div>
          <label className="block text-slate-600 mb-1 font-bold">Atualizar Status de Custódia</label>
          <select value={status} onChange={event => onStatusChange(event.target.value as PackageCustodyStatus)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-none">
            <option value="em_ocorrencia_delegacia">Em ocorrência na DP</option>
            <option value="aguardando_pericia">Aguardando perícia</option>
            <option value="liberado_retirada">Liberado p/ retirada</option>
            <option value="devolvido_empresa">Devolvido à empresa</option>
            <option value="extraviado_nao_localizado">Não localizado</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-slate-600 mb-1 font-bold">Observações / Detalhes do Andamento</label>
        <textarea rows={2} value={description} onChange={event => onDescriptionChange(event.target.value)}
          placeholder="Informe despacho policial, contato com a delegacia, laudo ou procedimento..."
          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none" />
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isAdding || !title.trim()}
          className="px-4 py-2 rounded-xl bg-[#2D3277] hover:bg-[#1E2355] text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
          {isAdding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Registrar Andamento</span>
        </button>
      </div>
    </form>

    <div className="space-y-3">
      <span className="font-extrabold text-[#2D3277] text-xs block">
        Linha do Tempo de Ocorrência ({historyEntries.length})
      </span>
      {historyEntries.length === 0 ? (
        <p className="text-xs text-slate-400 p-6 text-center">Nenhum andamento registrado até o momento.</p>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {historyEntries.map((entry, index) => {
            const custodyMeta = CUSTODY_LABELS[entry.status] || CUSTODY_LABELS.em_ocorrencia_delegacia;
            return (
              <div key={entry.id || index} className="relative space-y-1 text-xs">
                <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#3483FA] border-2 border-white shadow-xs" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-[#2D3277]">{entry.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${custodyMeta.badge}`}>{custodyMeta.short}</span>
                  <span className="text-[10px] text-slate-400">{formatTimestamp(entry.date)} por {entry.authorName}</span>
                </div>
                {entry.description && (
                  <p className="text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 leading-relaxed">
                    {entry.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);
