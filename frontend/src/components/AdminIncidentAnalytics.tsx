import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  BarChart3,
  Building2,
  Filter,
  Landmark,
  PackageCheck,
  PieChart as PieChartIcon,
  RotateCcw,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import {
  CorporateCompany,
  CorporatePackageIncident,
  PackageCustodyStatus,
  PackageIncidentType
} from '../types/admin';
import { CUSTODY_LABELS, INCIDENT_TYPE_META } from '../utils/corporateIncidentMetadata';

interface AdminIncidentAnalyticsProps {
  incidents: CorporatePackageIncident[];
  companies: CorporateCompany[];
  onOpenCompanyPanel?: (domain: string) => void;
}

const TYPE_COLORS: Record<PackageIncidentType, string> = {
  ameaca: '#EA580C',
  roubo_carga: '#DC2626',
  roubo: '#EA580C',
  furto: '#D97706',
  fraude: '#E11D48',
  extravio: '#F59E0B',
  apreensao: '#2D3277',
  outros: '#64748B'
};

const CUSTODY_COLORS: Record<PackageCustodyStatus, string> = {
  em_ocorrencia_delegacia: '#E11D48',
  aguardando_pericia: '#D97706',
  liberado_retirada: '#3483FA',
  devolvido_empresa: '#00A650',
  extraviado_nao_localizado: '#64748B'
};

const formatCurrencyBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  }).format(value || 0);

const truncateLabel = (text: string, max = 24) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

export const AdminIncidentAnalytics: React.FC<AdminIncidentAnalyticsProps> = ({
  incidents,
  companies,
  onOpenCompanyPanel
}) => {
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedUf, setSelectedUf] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<'all' | 'at_station' | 'outside'>('all');
  const [statusChartMode, setStatusChartMode] = useState<'pie' | 'bar'>('pie');

  const companyNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    companies.forEach(c => {
      map[c.domain.toLowerCase()] = c.companyName;
    });
    return map;
  }, [companies]);

  const availableUfs = useMemo(() => {
    const set = new Set<string>();
    incidents.forEach(inc => {
      const uf = (inc.delegaciaUf || '').trim().toUpperCase();
      if (uf) set.add(uf);
    });
    return Array.from(set).sort();
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      if (
        selectedCompany !== 'all' &&
        (inc.companyDomain || '').toLowerCase() !== selectedCompany.toLowerCase()
      ) {
        return false;
      }
      if (selectedUf !== 'all' && (inc.delegaciaUf || '').toUpperCase() !== selectedUf) {
        return false;
      }
      if (stationFilter === 'at_station' && !inc.packageAtStation) return false;
      if (stationFilter === 'outside' && inc.packageAtStation) return false;
      return true;
    });
  }, [incidents, selectedCompany, selectedUf, stationFilter]);

  const kpis = useMemo(() => {
    const total = filteredIncidents.length;
    const atStation = filteredIncidents.filter(i => i.packageAtStation).length;
    const totalValue = filteredIncidents.reduce((acc, i) => acc + (Number(i.estimatedValue) || 0), 0);
    const activeCompanyDomains = new Set(
      filteredIncidents.map(i => (i.companyDomain || '').toLowerCase()).filter(Boolean)
    );
    const uniqueDelegacias = new Set(
      filteredIncidents.map(i => (i.delegaciaName || 'Sem delegacia').trim()).filter(Boolean)
    );
    const recoveredCount = filteredIncidents.filter(
      i => i.custodyStatus === 'devolvido_empresa'
    ).length;

    return {
      total,
      atStation,
      atStationPct: total > 0 ? Math.round((atStation / total) * 100) : 0,
      totalValue,
      companiesCount: activeCompanyDomains.size,
      delegaciasCount: uniqueDelegacias.size,
      recoveredCount
    };
  }, [filteredIncidents]);

  // 1. Por Tipo (PieChart)
  const typeDistribution = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredIncidents.forEach(inc => {
      const key = inc.incidentType || 'outros';
      if (!counts[key]) counts[key] = { count: 0, value: 0 };
      counts[key].count += 1;
      counts[key].value += Number(inc.estimatedValue) || 0;
    });

    return Object.entries(counts)
      .map(([type, data]) => {
        const meta = INCIDENT_TYPE_META[type as PackageIncidentType];
        return {
          key: type,
          name: meta ? meta.label : type,
          value: data.count,
          estimatedValue: data.value,
          color: TYPE_COLORS[type as PackageIncidentType] || '#64748B',
          pct: filteredIncidents.length > 0 ? Math.round((data.count / filteredIncidents.length) * 100) : 0
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredIncidents]);

  // 2. Por Status de Custódia (PieChart / BarChart)
  const statusDistribution = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredIncidents.forEach(inc => {
      const key = inc.custodyStatus || 'em_ocorrencia_delegacia';
      if (!counts[key]) counts[key] = { count: 0, value: 0 };
      counts[key].count += 1;
      counts[key].value += Number(inc.estimatedValue) || 0;
    });

    return Object.entries(counts)
      .map(([status, data]) => {
        const meta = CUSTODY_LABELS[status as PackageCustodyStatus];
        return {
          key: status,
          name: meta ? meta.short : status,
          fullName: meta ? meta.label : status,
          value: data.count,
          estimatedValue: data.value,
          color: CUSTODY_COLORS[status as PackageCustodyStatus] || '#64748B',
          pct: filteredIncidents.length > 0 ? Math.round((data.count / filteredIncidents.length) * 100) : 0
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredIncidents]);

  // 3. Por Delegacia (BarChart — Top 10)
  const delegaciaDistribution = useMemo(() => {
    const map: Record<
      string,
      {
        fullName: string;
        uf: string;
        municipio: string;
        total: number;
        naDp: number;
        foraDp: number;
        estimatedValue: number;
        companies: Set<string>;
      }
    > = {};

    filteredIncidents.forEach(inc => {
      const rawName = (inc.delegaciaName || 'Delegacia Não Informada').trim();
      const uf = (inc.delegaciaUf || '').trim().toUpperCase();
      const key = `${rawName}__${uf}`;
      if (!map[key]) {
        map[key] = {
          fullName: uf ? `${rawName} (${uf})` : rawName,
          uf: uf || '—',
          municipio: inc.delegaciaMunicipio || '—',
          total: 0,
          naDp: 0,
          foraDp: 0,
          estimatedValue: 0,
          companies: new Set()
        };
      }
      map[key].total += 1;
      if (inc.packageAtStation) {
        map[key].naDp += 1;
      } else {
        map[key].foraDp += 1;
      }
      map[key].estimatedValue += Number(inc.estimatedValue) || 0;
      if (inc.companyDomain) map[key].companies.add(inc.companyDomain);
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total || b.estimatedValue - a.estimatedValue)
      .slice(0, 10)
      .map(d => ({
        ...d,
        shortName: truncateLabel(d.fullName, 22),
        companyCount: d.companies.size
      }));
  }, [filteredIncidents]);

  // 4. Por Empresa (BarChart agregado)
  const companyDistribution = useMemo(() => {
    const map: Record<
      string,
      {
        domain: string;
        name: string;
        shortName: string;
        total: number;
        naDp: number;
        devolvido: number;
        estimatedValue: number;
      }
    > = {};

    filteredIncidents.forEach(inc => {
      const domain = (inc.companyDomain || 'sem_empresa').toLowerCase();
      const label = companyNameMap[domain] || `@${domain}`;
      if (!map[domain]) {
        map[domain] = {
          domain,
          name: label,
          shortName: truncateLabel(label, 18),
          total: 0,
          naDp: 0,
          devolvido: 0,
          estimatedValue: 0
        };
      }
      map[domain].total += 1;
      if (inc.packageAtStation) map[domain].naDp += 1;
      if (inc.custodyStatus === 'devolvido_empresa') map[domain].devolvido += 1;
      map[domain].estimatedValue += Number(inc.estimatedValue) || 0;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredIncidents, companyNameMap]);

  const hasActiveFilters =
    selectedCompany !== 'all' || selectedUf !== 'all' || stationFilter !== 'all';

  const handleResetFilters = () => {
    setSelectedCompany('all');
    setSelectedUf('all');
    setStationFilter('all');
  };

  return (
    <section className="space-y-4">
      {/* Section Header & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-[#2D3277] text-[#FFE600] shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-[#2D3277]">
                Dashboard Analítico de Ocorrências (Agregado Multi-Empresas)
              </h3>
              <p className="text-xs text-slate-600">
                Visualização consolidada de todas as empresas por <strong>tipo de ocorrência</strong>,{' '}
                <strong>delegacia</strong> e <strong>status de custódia</strong>.
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                aria-label="Filtrar por empresa"
                className="bg-transparent font-semibold text-[#2D3277] focus:outline-none cursor-pointer"
              >
                <option value="all">Todas as Empresas ({companies.length})</option>
                {companies.map(c => (
                  <option key={c.domain} value={c.domain}>
                    {c.companyName} (@{c.domain})
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedUf}
              onChange={e => setSelectedUf(e.target.value)}
              aria-label="Filtrar por estado"
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as UFs</option>
              {availableUfs.map(uf => (
                <option key={uf} value={uf}>
                  UF: {uf}
                </option>
              ))}
            </select>

            <select
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value as 'all' | 'at_station' | 'outside')}
              aria-label="Filtrar por posse na delegacia"
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Posse: Todas</option>
              <option value="at_station">Apenas na Delegacia</option>
              <option value="outside">Fora da Delegacia</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
              <span>Total de Ocorrências</span>
              <ShieldAlert className="w-4 h-4 text-[#2D3277]" />
            </div>
            <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">
              {kpis.total}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {kpis.companiesCount} empresa(s) com registros
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-700 uppercase">
              <span>Pacotes na Delegacia</span>
              <Landmark className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-rose-800 font-mono mt-1">
              {kpis.atStation}
            </div>
            <div className="text-[11px] text-rose-700 mt-0.5">
              {kpis.atStationPct}% sob custódia policial
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#00A650]/5 border border-[#00A650]/25">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#008744] uppercase">
              <span>Valor Estimado Total</span>
              <Wallet className="w-4 h-4 text-[#008744]" />
            </div>
            <div className="text-lg md:text-xl font-extrabold text-[#008744] font-mono mt-1 truncate">
              {formatCurrencyBRL(kpis.totalValue)}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              {kpis.recoveredCount} devolvido(s) à empresa
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#3483FA]/5 border border-[#3483FA]/25">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#2968C8] uppercase">
              <span>Delegacias Distintas</span>
              <PackageCheck className="w-4 h-4 text-[#3483FA]" />
            </div>
            <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">
              {kpis.delegaciasCount}
            </div>
            <div className="text-[11px] text-slate-600 truncate mt-0.5">
              {delegaciaDistribution[0]
                ? `Maior vol.: ${truncateLabel(delegaciaDistribution[0].fullName, 24)}`
                : 'Sem delegacias registradas'}
            </div>
          </div>
        </div>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2 shadow-sm">
          <BarChart3 className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-[#2D3277]">
            Nenhuma ocorrência encontrada para os filtros selecionados
          </p>
          <p className="text-xs text-slate-500">
            Quando as empresas corporativas registrarem ocorrências de pacotes ou cargas, os gráficos agregados aparecerão automaticamente aqui.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-3 py-1.5 rounded-lg bg-[#2D3277] text-white text-xs font-bold cursor-pointer"
            >
              Redefinir filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ROW 1: PIE CHARTS (TIPO & STATUS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PieChart 1: Por Tipo */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-[#DC2626]" />
                    <span>Distribuição por Tipo de Ocorrência</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Proporção de incidentes por natureza ({filteredIncidents.length} total)
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                  Pizza
                </span>
              </div>

              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height={260} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {typeDistribution.map(entry => (
                        <Cell key={entry.key} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: unknown, _name: unknown, item: { payload?: { pct?: number; estimatedValue?: number } }) => [
                        `${val} ocorrências (${item?.payload?.pct ?? 0}%) · ${formatCurrencyBRL(
                          item?.payload?.estimatedValue ?? 0
                        )}`,
                        'Volume'
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '10px',
                        fontSize: '12px',
                        boxShadow: '0 6px 16px rgba(15,23,42,0.12)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                {typeDistribution.map(item => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-[#2D3277] shrink-0">
                      {item.value} ({item.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Por Status de Custódia (PieChart + BarChart toggle) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-[#3483FA]" />
                    <span>Distribuição por Status de Custódia</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Situação atual dos pacotes e cargas registradas
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setStatusChartMode('pie')}
                    className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                      statusChartMode === 'pie'
                        ? 'bg-[#2D3277] text-[#FFE600]'
                        : 'text-slate-600 hover:text-[#2D3277]'
                    }`}
                  >
                    Pizza
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusChartMode('bar')}
                    className={`px-2 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                      statusChartMode === 'bar'
                        ? 'bg-[#2D3277] text-[#FFE600]'
                        : 'text-slate-600 hover:text-[#2D3277]'
                    }`}
                  >
                    Barras
                  </button>
                </div>
              </div>

              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height={260} minWidth={0}>
                  {statusChartMode === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={92}
                        paddingAngle={3}
                      >
                        {statusDistribution.map(entry => (
                          <Cell key={entry.key} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown, _name: unknown, item: { payload?: { pct?: number; estimatedValue?: number } }) => [
                          `${val} ocorrências (${item?.payload?.pct ?? 0}%) · ${formatCurrencyBRL(
                            item?.payload?.estimatedValue ?? 0
                          )}`,
                          'Status'
                        ]}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#cbd5e1',
                          borderRadius: '10px',
                          fontSize: '12px',
                          boxShadow: '0 6px 16px rgba(15,23,42,0.12)'
                        }}
                      />
                    </PieChart>
                  ) : (
                    <BarChart
                      data={statusDistribution}
                      margin={{ top: 10, right: 16, left: -12, bottom: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#475569' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={46}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip
                        formatter={(val: unknown, _name: unknown, item: { payload?: { fullName?: string; estimatedValue?: number } }) => [
                          `${val} ocorrências · ${formatCurrencyBRL(item?.payload?.estimatedValue ?? 0)}`,
                          item?.payload?.fullName || 'Status'
                        ]}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#cbd5e1',
                          borderRadius: '10px',
                          fontSize: '12px',
                          boxShadow: '0 6px 16px rgba(15,23,42,0.12)'
                        }}
                      />
                      <Bar dataKey="value" name="Ocorrências" radius={[6, 6, 0, 0]}>
                        {statusDistribution.map(entry => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
                {statusDistribution.map(item => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-[#2D3277] shrink-0">
                      {item.value} ({item.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 2: BAR CHARTS (DELEGACIA + EMPRESAS AGREGADAS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* BarChart 1: Por Delegacia (Top 10) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#2D3277]" />
                    <span>Ocorrências por Delegacia (Top {delegaciaDistribution.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Comparativo entre volumes retidos na DP e demais ocorrências
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                  Barras Empilhadas
                </span>
              </div>

              <div className="w-full h-[310px]">
                <ResponsiveContainer width="100%" height={310} minWidth={0}>
                  <BarChart
                    data={delegaciaDistribution}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      width={155}
                      tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                    />
                    <Tooltip
                      labelFormatter={(_label, payload) => {
                        const row = payload?.[0]?.payload as
                          | { fullName?: string; municipio?: string; estimatedValue?: number }
                          | undefined;
                        if (!row) return '';
                        return `${row.fullName} · ${row.municipio} (${formatCurrencyBRL(
                          row.estimatedValue ?? 0
                        )})`;
                      }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '10px',
                        fontSize: '12px',
                        boxShadow: '0 6px 16px rgba(15,23,42,0.12)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar
                      dataKey="naDp"
                      name="Na Delegacia"
                      stackId="dp"
                      fill="#E11D48"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="foraDp"
                      name="Fora da DP / Recuperado"
                      stackId="dp"
                      fill="#3483FA"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* BarChart 2: Consolidado por Empresa */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#008744]" />
                    <span>Volume Agregado por Empresa</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Total de registros, pacotes na DP e devoluções por conta corporativa
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                  Empresas
                </span>
              </div>

              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height={250} minWidth={0}>
                  <BarChart
                    data={companyDistribution}
                    margin={{ top: 10, right: 12, left: -16, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={44}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip
                      labelFormatter={(_label, payload) => {
                        const row = payload?.[0]?.payload as
                          | { name?: string; domain?: string; estimatedValue?: number }
                          | undefined;
                        if (!row) return '';
                        return `${row.name} (@${row.domain}) · ${formatCurrencyBRL(
                          row.estimatedValue ?? 0
                        )}`;
                      }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '10px',
                        fontSize: '12px',
                        boxShadow: '0 6px 16px rgba(15,23,42,0.12)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="total" name="Total" fill="#2D3277" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="naDp" name="Na DP" fill="#E11D48" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="devolvido" name="Devolvidos" fill="#00A650" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Compact Company Quick Links */}
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 max-h-[115px] overflow-y-auto">
                {companyDistribution.map(comp => (
                  <div
                    key={comp.domain}
                    className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 truncate block">{comp.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        @{comp.domain} · {formatCurrencyBRL(comp.estimatedValue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-[#2D3277]/10 text-[#2D3277] font-mono font-bold text-[10px]">
                        {comp.total}
                      </span>
                      {onOpenCompanyPanel && (
                        <button
                          type="button"
                          onClick={() => onOpenCompanyPanel(comp.domain)}
                          className="px-2 py-0.5 rounded bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] font-bold text-[10px] cursor-pointer"
                        >
                          Painel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 3: TOP DELEGACIAS BREAKDOWN TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs md:text-sm font-extrabold text-[#2D3277]">
                Detalhamento Consolidado por Delegacia
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Top {delegaciaDistribution.length} unidades policiais
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Delegacia</th>
                    <th className="p-3">Município / UF</th>
                    <th className="p-3 text-center">Empresas</th>
                    <th className="p-3 text-center">Total</th>
                    <th className="p-3 text-center">Na DP</th>
                    <th className="p-3 text-right">Valor Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {delegaciaDistribution.map(del => (
                    <tr key={`${del.fullName}-${del.municipio}`} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#2D3277]">{del.fullName}</td>
                      <td className="p-3 text-slate-600">
                        {del.municipio} · <span className="font-mono font-bold">{del.uf}</span>
                      </td>
                      <td className="p-3 text-center font-mono">{del.companyCount}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">
                        {del.total}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[10px]">
                          {del.naDp}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#008744]">
                        {formatCurrencyBRL(del.estimatedValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
