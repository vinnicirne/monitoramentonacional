import { useMemo } from 'react';
import type { User } from 'firebase/auth';
import CompanySosHistory from './CompanySosHistory';
import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CorporatePackageIncident } from '../../../types/admin';

interface CarrierAnalyticsTabProps {
  incidents: CorporatePackageIncident[];
  companyDomain: string;
  sosUser?: User;
  includeBranches?: boolean;
  sosRevision?: number;
}

type CarrierSummary = {
  carrier: string;
  occurrences: number;
  packages: number;
  delivered: number;
  recovered: number;
  lost: number;
  inProgress: number;
};

const LOSS_INCIDENT_TYPES = ['roubo_carga', 'roubo', 'furto'];

function summarizePackages(incident: CorporatePackageIncident, quantity: number) {
  const delivered = Number(incident.packagesDelivered) || 0;
  const recovered = incident.packagesRecovered ?? (incident.custodyStatus === 'devolvido_empresa' ? quantity : 0);
  const lost = incident.packagesStolen ?? (
    incident.custodyStatus !== 'devolvido_empresa' &&
    (incident.custodyStatus === 'extraviado_nao_localizado' || LOSS_INCIDENT_TYPES.includes(incident.incidentType))
      ? quantity
      : 0
  );

  return { delivered, recovered, lost };
}

export function CarrierAnalyticsTab({ incidents, companyDomain, sosUser, includeBranches = false, sosRevision = 0 }: CarrierAnalyticsTabProps) {
  const analytics = useMemo(() => {
    const byCarrier = new Map<string, CarrierSummary>();
    incidents.forEach(incident => {
      const carrier = incident.carrierName?.trim() || 'Não informada';
      const current = byCarrier.get(carrier) || {
        carrier,
        occurrences: 0,
        packages: 0,
        delivered: 0,
        recovered: 0,
        lost: 0,
        inProgress: 0
      };
      const quantity = Math.max(1, Math.floor(Number(incident.packageQuantity) || 1));
      const outcomes = summarizePackages(incident, quantity);

      current.occurrences += 1;
      current.packages += quantity;
      current.delivered += outcomes.delivered;
      current.recovered += outcomes.recovered;
      current.lost += outcomes.lost;
      current.inProgress += Math.max(0, quantity - outcomes.delivered - outcomes.recovered - outcomes.lost);
      byCarrier.set(carrier, current);
    });

    return Array.from(byCarrier.values()).sort((a, b) =>
      b.occurrences - a.occurrences || b.packages - a.packages
    );
  }, [incidents]);

  const packageTotals = useMemo(() => incidents.reduce((totals, incident) => {
    const quantity = Math.max(1, Math.floor(Number(incident.packageQuantity) || 1));
    const outcomes = summarizePackages(incident, quantity);
    totals.involved += quantity;
    totals.delivered += outcomes.delivered;
    totals.recovered += outcomes.recovered;
    totals.lost += outcomes.lost;
    return totals;
  }, { involved: 0, delivered: 0, recovered: 0, lost: 0 }), [incidents]);

  const monthlyTrend = useMemo(() => {
    const topCarriers = analytics.slice(0, 5).map(item => item.carrier);
    const byMonth = new Map<string, Record<string, string | number>>();
    incidents.forEach(incident => {
      const carrier = incident.carrierName?.trim() || 'Não informada';
      if (!topCarriers.includes(carrier)) return;
      const timestamp = incident.createdAt;
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp || '');
      if (Number.isNaN(date.getTime())) return;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const entry = byMonth.get(month) || {
        month,
        label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      };
      entry[carrier] = Number(entry[carrier] || 0) + 1;
      byMonth.set(month, entry);
    });

    return {
      carriers: topCarriers,
      months: Array.from(byMonth.values()).sort((a, b) => String(a.month).localeCompare(String(b.month)))
    };
  }, [incidents, analytics]);

  return (
    <>
      {sosUser && <CompanySosHistory key={sosUser.uid + ':' + companyDomain} user={sosUser} domain={companyDomain}
        includeBranches={includeBranches} revision={sosRevision} />}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2D3277] to-[#1E2258] text-white shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#FFE600]" />
          <h3 className="font-extrabold text-sm text-[#FFE600]">Histórico e evolução mensal por transportadora</h3>
        </div>
        <p className="mt-1 text-xs text-white/80">Indicadores calculados a partir das ocorrências sincronizadas no Firestore de @{companyDomain}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Pacotes envolvidos" value={packageTotals.involved} tone="blue" detail="Quantidade informada nos registros" />
        <MetricCard label="Pacotes entregues" value={packageTotals.delivered} tone="cyan" detail="Entregas registradas no formulário" />
        <MetricCard label="Pacotes recuperados" value={packageTotals.recovered} tone="emerald" detail="Informados no registro da ocorrência" />
        <MetricCard label="Roubados / não localizados" value={packageTotals.lost} tone="rose" detail="Informados como roubados" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#2D3277]"><BarChart3 className="h-4 w-4" /> Histórico por transportadora</h3>
          <p className="mt-1 text-xs text-slate-500">Dados calculados a partir das ocorrências sincronizadas no Firestore desta empresa.</p>
        </div>
        {analytics.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">Cadastre a transportadora nos registros para começar a comparar ocorrências.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div>
              <h4 className="mb-2 text-xs font-bold text-slate-700">Ocorrências registradas</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.slice(0, 10)} margin={{ top: 8, right: 12, left: -18, bottom: 42 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="carrier" angle={-25} textAnchor="end" interval={0} height={56} tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="occurrences" name="Ocorrências" fill="#3483FA" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-bold text-slate-700">Pacotes por desfecho</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.slice(0, 10)} margin={{ top: 8, right: 12, left: -18, bottom: 42 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="carrier" angle={-25} textAnchor="end" interval={0} height={56} tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="delivered" name="Entregues" stackId="packages" fill="#06B6D4" />
                    <Bar dataKey="recovered" name="Recuperados" stackId="packages" fill="#00A650" />
                    <Bar dataKey="lost" name="Roubados" stackId="packages" fill="#E11D48" />
                    <Bar dataKey="inProgress" name="Em andamento / custódia" stackId="packages" fill="#3483FA" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {monthlyTrend.months.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <h4 className="mb-2 text-xs font-bold text-slate-700">Evolução mensal — 5 transportadoras com mais ocorrências</h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend.months} margin={{ top: 8, right: 18, left: -18, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  {monthlyTrend.carriers.map((carrier, index) => (
                    <Line key={carrier} type="monotone" dataKey={carrier} name={carrier} stroke={['#2D3277', '#3483FA', '#00A650', '#E11D48', '#D97706'][index]} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-600"><tr><th className="p-2.5">Transportadora</th><th className="p-2.5">Ocorrências</th><th className="p-2.5">Pacotes</th><th className="p-2.5">Entregues</th><th className="p-2.5">Recuperados</th><th className="p-2.5">Roubados</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{analytics.map(row => <tr key={row.carrier}><td className="p-2.5 font-semibold text-slate-800">{row.carrier}</td><td className="p-2.5">{row.occurrences}</td><td className="p-2.5">{row.packages}</td><td className="p-2.5 text-cyan-700">{row.delivered}</td><td className="p-2.5 text-emerald-700">{row.recovered}</td><td className="p-2.5 text-rose-700">{row.lost}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function MetricCard({ label, value, tone, detail }: { label: string; value: number; tone: 'blue' | 'cyan' | 'emerald' | 'rose'; detail: string }) {
  const styles = {
    blue: 'border-blue-200 text-blue-700 text-blue-800',
    cyan: 'border-cyan-200 text-cyan-700 text-cyan-700',
    emerald: 'border-emerald-200 text-emerald-700 text-emerald-700',
    rose: 'border-rose-200 text-rose-700 text-rose-700'
  }[tone].split(' ');

  return (
    <div className={`p-4 bg-white border ${styles[0]} rounded-2xl shadow-sm`}>
      <div className={`text-[11px] font-bold ${styles[1]} uppercase`}>{label}</div>
      <div className={`text-2xl font-extrabold ${styles[2]} font-mono mt-1`}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{detail}</div>
    </div>
  );
}
