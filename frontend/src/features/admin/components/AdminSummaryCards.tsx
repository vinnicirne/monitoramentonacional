import { Users, Share2, Building2, MapPin } from 'lucide-react';

interface SummaryCardsProps {
  stats: { totalUsers: number; approvedUsers: number; pendingUsers: number; blockedUsers: number; totalReferrals: number; directMeliReferrals: number; activeLicensedUsers: number; monthlyCorporateRevenue: number; activeCompanies: number; activeDomains: number; totalAccesses: number; topLocations: [string, number][] };
  onUsers: () => void;
  onReferrals: () => void;
  onCompanies: () => void;
}

export function AdminSummaryCards({ stats, onUsers, onReferrals, onCompanies }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Usuários */}
        <div
          onClick={() => onUsers()}
          className="p-4 bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Usuários
            </span>
            <div className="p-2 rounded-lg bg-[#3483FA]/10 text-[#2968C8]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D3277] font-mono">
            {stats.totalUsers}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[#00A650]/10 text-[#008744] font-bold">
              {stats.approvedUsers} liberados
            </span>
            {stats.pendingUsers > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                {stats.pendingUsers} pendentes
              </span>
            )}
            {stats.blockedUsers > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                {stats.blockedUsers} bloqueados
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Indicações */}
        <div
          onClick={() => onReferrals()}
          className="p-4 bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Indicações (Afiliados)
            </span>
            <div className="p-2 rounded-lg bg-[#FFE600] text-[#2D3277]">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D3277] font-mono">
            {stats.totalReferrals}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[#00A650]/10 text-[#008744] font-bold">
              {stats.directMeliReferrals} diretos MELI
            </span>
            <span className="text-slate-500 font-medium">Sem comissão</span>
          </div>
        </div>

        {/* Card 3: Empresas & Domínios */}
        <div
          onClick={onCompanies}
          className="p-4 bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Licenças Corporativas
            </span>
            <div className="p-2 rounded-lg bg-[#00A650]/10 text-[#008744]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D3277] font-mono">
            {stats.activeLicensedUsers}
            <span className="text-xs font-sans font-semibold text-slate-500 ml-1.5">
              licenças ativas
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            <strong className="text-[#008744]">
              R$ {stats.monthlyCorporateRevenue.toFixed(2).replace('.', ',')}
            </strong>
            /mês · {stats.activeCompanies} empresa(s) · {stats.activeDomains} domínio(s) free
          </div>
        </div>

        {/* Card 4: Localizações Acessadas */}
        <div
          className="p-4 bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Localizações Acessadas
            </span>
            <div className="p-2 rounded-lg bg-[#2D3277]/10 text-[#2D3277]">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D3277] font-mono">
            {stats.totalAccesses}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 truncate">
            {stats.topLocations[0]
              ? `Mais acessada: ${stats.topLocations[0][0]} (${stats.topLocations[0][1]}x)`
              : 'Nenhuma consulta registrada ainda'}
          </div>
        </div>
      </div>
  );
}
