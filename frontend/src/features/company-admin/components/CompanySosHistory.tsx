import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { AlertTriangle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { driveOrigin, requestDrive } from '../services/driveCompanyApi';

type HistoryRow = {
  id: string;
  driverName: string;
  companyDomain: string;
  companyName: string;
  createdAt: number;
  acknowledgedAt: number | null;
};

const formatDate = (value: number) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function CompanySosHistory({ user, domain, includeBranches, revision }: {
  user: User; domain: string; includeBranches: boolean; revision: number;
}) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  });
  const [result, setResult] = useState<{ month: string; rows?: HistoryRow[] }>();

  useEffect(() => {
    if (!driveOrigin) return;
    const [year, value] = month.split('-').map(Number);
    const since = new Date(year, value - 1, 1).getTime();
    const until = new Date(year, value, 1).getTime();
    const params = new URLSearchParams({ desde: String(since), ate: String(until), tree: includeBranches ? '1' : '0' });
    const controller = new AbortController();
    requestDrive<HistoryRow[]>(user, domain, 'sos-historico?' + params, undefined, controller.signal)
      .then(rows => { if (!controller.signal.aborted) setResult({ month, rows }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ month }); });
    return () => controller.abort();
  }, [user, domain, month, includeBranches, revision]);

  if (!driveOrigin) return null;
  const current = result?.month === month ? result : undefined;
  const rows = current?.rows ?? [];
  const totals = new Map<string, { name: string; pending: number; resolved: number }>();
  for (const row of rows) {
    const data = totals.get(row.companyDomain) ?? { name: row.companyName, pending: 0, resolved: 0 };
    if (row.acknowledgedAt) data.resolved++;
    else data.pending++;
    totals.set(row.companyDomain, data);
  }
  const chart = [...totals.values()].sort((a, b) => (b.pending + b.resolved) - (a.pending + a.resolved));

  return <section aria-labelledby="sos-history" className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 id="sos-history" className="flex items-center gap-2 text-sm font-extrabold text-rose-900">
        <AlertTriangle size={17} aria-hidden="true" /> SOS por transportadora
      </h3>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">Mês
        <input type="month" className="rounded-lg border border-slate-300 bg-white px-2 py-1" value={month}
          onChange={event => { if (event.target.value) setMonth(event.target.value); }} />
      </label>
    </div>
    {!current && <p role="status" className="text-sm text-slate-600">Carregando histórico de SOS…</p>}
    {current && !current.rows && <p role="alert" className="text-sm text-rose-800">Não foi possível carregar o histórico de SOS.</p>}
    {current?.rows?.length === 0 && <p className="text-sm text-slate-600">Nenhum SOS neste mês.</p>}
    {rows.length > 0 && <>
      <div className="max-h-80 overflow-y-auto" aria-label="Gráfico de SOS pendentes e atendidos">
        <div style={{ height: Math.max(160, chart.length * 34 + 66) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chart} margin={{ right: 15 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="pending" name="Pendentes" stackId="sos" fill="#be123c" />
              <Bar dataKey="resolved" name="Atendidos" stackId="sos" fill="#08785f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[530px] text-left text-xs">
          <caption className="sr-only">Histórico de SOS</caption>
          <thead className="sticky top-0 bg-slate-50 text-slate-700"><tr>
            <th scope="col" className="p-2.5">Transportadora</th><th scope="col" className="p-2.5">Motorista</th>
            <th scope="col" className="p-2.5">Recebido em</th><th scope="col" className="p-2.5">Atendimento</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(row => <tr key={row.companyDomain + '/' + row.id}>
              <td className="p-2.5 font-semibold">{row.companyName}</td><td className="p-2.5">{row.driverName}</td>
              <td className="p-2.5">{formatDate(row.createdAt)}</td>
              <td className={row.acknowledgedAt ? 'p-2.5 text-emerald-800' : 'p-2.5 font-bold text-rose-800'}>
                {row.acknowledgedAt ? 'Atendido em ' + formatDate(row.acknowledgedAt) : 'Pendente'}
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </>}
  </section>;
}
