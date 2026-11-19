import { FileText, Flame, Landmark, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { useCompanyIncidentData } from '../hooks/useCompanyIncidentData';

export function CompanyIncidentSummary({ stats }: { stats: ReturnType<typeof useCompanyIncidentData>['incidentStats'] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase">
            Total de Ocorrências
          </span>
          <FileText className="w-4 h-4 text-[#3483FA]" />
        </div>
        <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">
          {stats.total}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Registros gerais da empresa
        </div>
      </div>

      <div className="p-4 bg-white border border-red-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-red-700 uppercase">
            Roubos & Furtos
          </span>
          <Flame className="w-4 h-4 text-red-600" />
        </div>
        <div className="text-2xl font-extrabold text-red-700 font-mono mt-1">
          {stats.totalRoubos}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Mancha no Mapa de Calor
        </div>
      </div>

      <div className="p-4 bg-white border border-rose-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-700 uppercase">
            Pacotes na Delegacia
          </span>
          <Landmark className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-2xl font-extrabold text-rose-700 font-mono mt-1">
          {stats.atStation}
        </div>
        <div className="text-[11px] text-slate-600 mt-1">
          Em ocorrência ou custódia na DP
        </div>
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase">
            Liberados / Devolvidos
          </span>
          <CheckCircle2 className="w-4 h-4 text-[#008744]" />
        </div>
        <div className="text-2xl font-extrabold text-[#008744] font-mono mt-1">
          {stats.resolved}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          Pacotes recuperados ou liberados
        </div>
      </div>

      <div className="p-4 bg-[#2D3277] text-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#FFE600] uppercase">
            Valor Envolvido
          </span>
          <ShieldAlert className="w-4 h-4 text-[#FFE600]" />
        </div>
        <div className="text-2xl font-extrabold font-mono mt-1">
          R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-[11px] text-white/80 mt-1">
          Soma dos pacotes em ocorrência
        </div>
      </div>

    </div>
  );
}
