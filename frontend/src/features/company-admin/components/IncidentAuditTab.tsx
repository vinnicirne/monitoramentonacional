import { useCallback, useEffect, useRef, useState } from 'react';
import { OperationType, type CorporatePackageIncident, type IncidentAuditLog } from '../../../types/admin';
import { reportFirestoreError } from '../../../firebase';
import { Pagination } from '../../../shared/components/Pagination';
import { useCursorPages } from '../../../shared/useCursorPages';
import { useListPage } from '../../../shared/useListPage';
import { readCompanyAuditPage, readCompanyIncident, searchCompanyAudit } from '../services/companyAuditQueries';

interface IncidentAuditTabProps {
  activeDomain: string;
  search: string;
  onSearchChange: (value: string) => void;
  formatTimestamp: (timestamp: unknown) => string;
  onViewIncidentDossier?: (incident: CorporatePackageIncident) => void;
}

export function IncidentAuditTab({
  activeDomain, search, onSearchChange, formatTimestamp, onViewIncidentDossier
}: IncidentAuditTabProps) {
  const term = search.trim().toLowerCase();
  const auditPath = `corporate_companies/${activeDomain}/incident_audit_logs`;
  const load = useCallback((cursor: Parameters<typeof readCompanyAuditPage>[1], signal: AbortSignal) =>
    readCompanyAuditPage(activeDomain, cursor, signal), [activeDomain]);
  const logs = useCursorPages(activeDomain, Boolean(activeDomain) && !term, load);
  const [searchResult, setSearchResult] = useState<{ term: string; rows: IncidentAuditLog[]; error?: unknown }>();
  const result = searchResult?.term === term ? searchResult : null;
  const matches = useListPage(result?.rows ?? [], term);
  const page = term ? { ...matches, loading: !result, error: result?.error } : logs;

  const [actionError, setActionError] = useState('');
  const [exporting, setExporting] = useState(false);
  const actionRequest = useRef<AbortController | null>(null);
  useEffect(() => () => actionRequest.current?.abort(), []);

  useEffect(() => {
    if (!term) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchCompanyAudit(activeDomain, term, controller.signal).then(
        rows => {
          if (!controller.signal.aborted) setSearchResult({ term, rows });
        },
        error => {
          if (controller.signal.aborted) return;
          reportFirestoreError(error, OperationType.LIST, auditPath);
          setSearchResult({ term, rows: [], error });
        }
      );
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activeDomain, term, auditPath]);

  useEffect(() => {
    if (logs.error) reportFirestoreError(logs.error, OperationType.LIST, auditPath);
  }, [logs.error, auditPath]);

  const exportCsv = async () => {
    if (exporting) return;
    actionRequest.current?.abort();
    const controller = new AbortController();
    actionRequest.current = controller;
    setActionError('');
    setExporting(true);
    try {
      const exportLogs = term && result && !result.error
        ? result.rows
        : await searchCompanyAudit(activeDomain, term, controller.signal);
      controller.signal.throwIfAborted();
      const rows = [
        ['Data', 'Ação', 'Pacote', 'B.O.', 'Delegacia', 'Usuário', 'E-mail', 'Resumo'],
        ...exportLogs.map(log => [formatTimestamp(log.createdAt), log.action, log.trackingCode, log.boNumber,
          log.delegaciaName, log.actorName, log.actorEmail, log.summary])
      ];
      const csv = rows.map(row => row.map(value => {
        const escaped = value.replaceAll('"', '""');
        return '"' + (/^[=+@\-\t\r\n]/.test(value) ? "'" : '') + escaped + '"';
      }).join(';')).join('\r\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
      link.download = `auditoria-ocorrencias-${activeDomain}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      if (controller.signal.aborted) return;
      reportFirestoreError(error, OperationType.LIST, auditPath);
      setActionError('Não foi possível exportar a auditoria.');
    } finally {
      if (!controller.signal.aborted) setExporting(false);
    }
  };

  const openDossier = async (incidentId: string) => {
    if (exporting) return;
    actionRequest.current?.abort();
    const controller = new AbortController();
    actionRequest.current = controller;
    setActionError('');
    try {
      const incident = await readCompanyIncident(activeDomain, incidentId);
      if (controller.signal.aborted) return;
      if (incident) onViewIncidentDossier?.(incident);
      else setActionError('A ocorrência já foi excluída ou não está disponível.');
    } catch (error) {
      if (controller.signal.aborted) return;
      reportFirestoreError(error, OperationType.GET, `corporate_companies/${activeDomain}/incidents/${incidentId}`);
      setActionError('Não foi possível abrir o dossiê da ocorrência.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-[#2D3277]">Auditoria de Ocorrências</h3>
          <p className="text-sm text-slate-500">Histórico de ações da equipe, armazenado no Firestore.</p>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={event => onSearchChange(event.target.value)} placeholder="Buscar pacote, usuário ou ação" className="min-w-0 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" onClick={exportCsv} disabled={exporting || page.loading} className="rounded-xl bg-[#2D3277] px-3 py-2 text-xs font-bold text-white">{exporting ? 'Exportando…' : 'Exportar CSV'}</button>
        </div>
      </div>
      {(page.error || actionError) && <p role="alert" className="text-sm text-rose-700">{actionError || 'Não foi possível carregar a auditoria.'}</p>}
      <div className="space-y-2">
        {page.rows.map(log => {
          return <article key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-800">{log.summary}</strong><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">{log.action.replaceAll('_', ' ')}</span></div><p className="mt-1 text-xs text-slate-500">{formatTimestamp(log.createdAt)} · {log.actorName} ({log.actorEmail})</p><p className="text-xs text-slate-500">Pacote {log.trackingCode}{log.boNumber ? ` · B.O. ${log.boNumber}` : ''} · {log.delegaciaName}</p></div>
            {log.action !== 'deleted' && log.incidentId && onViewIncidentDossier && <button type="button" onClick={() => void openDossier(log.incidentId)} className="shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">Abrir dossiê</button>}
          </article>;
        })}
        {!page.loading && !page.error && page.rows.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{term ? 'Nenhuma ação corresponde à busca.' : 'Ainda não há ações registradas para esta empresa.'}</div>}
      </div>
      <Pagination {...page} />
    </section>
  );
}
