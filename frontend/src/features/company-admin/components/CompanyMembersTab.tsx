import { Pagination } from '../../../shared/components/Pagination';
import { useListPage } from '../../../shared/useListPage';
import React from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users
} from 'lucide-react';
import type { CompanyRole, CorporateCompany, IncidentAccess } from '../../../types/admin';
import type { UnifiedCompanyMember } from '../types';

interface CompanyMembersTabProps {
  activeDomain: string;
  activeCount: number;
  seatLimit: number;
  seatsFull: boolean;
  members: UnifiedCompanyMember[];
  memberCount: number;
  connectedCount: number;
  monthlyEstimate: number;
  pricePerLicense: number;
  currentUserUid?: string;
  company: CorporateCompany | null;
  formError: string | null;
  formSuccess: string | null;
  isSaving: boolean;
  empName: string;
  setEmpName: React.Dispatch<React.SetStateAction<string>>;
  empEmailUser: string;
  setEmpEmailUser: React.Dispatch<React.SetStateAction<string>>;
  empRole: CompanyRole;
  setEmpRole: React.Dispatch<React.SetStateAction<CompanyRole>>;
  empIncidentAccess: IncidentAccess;
  setEmpIncidentAccess: React.Dispatch<React.SetStateAction<IncidentAccess>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  onAddUser: (event: React.FormEvent) => void;
  onToggleMemberLicense: (member: UnifiedCompanyMember) => void;
  onToggleCompanyRole: (member: UnifiedCompanyMember) => void;
  onChangeIncidentAccess: (member: UnifiedCompanyMember, access: IncidentAccess) => void;
  onRemoveMember: (member: UnifiedCompanyMember) => void;
}

export const CompanyMembersTab: React.FC<CompanyMembersTabProps> = ({
  activeDomain,
  activeCount,
  seatLimit,
  seatsFull,
  members,  memberCount,  connectedCount,
  monthlyEstimate,
  pricePerLicense,
  currentUserUid,
  company,
  formError,
  formSuccess,
  isSaving,
  empName,
  setEmpName,
  empEmailUser,
  setEmpEmailUser,
  empRole,
  setEmpRole,
  empIncidentAccess,
  setEmpIncidentAccess,
  searchTerm,
  setSearchTerm,
  onAddUser,
  onToggleMemberLicense,
  onToggleCompanyRole,
  onChangeIncidentAccess,
  onRemoveMember
}) => {
  const page = useListPage(members, activeDomain + '/' + searchTerm);
  return (
  <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-slate-500 uppercase">Licenças Ativas</span><KeyRound className="w-4 h-4 text-[#3483FA]" /></div>
        <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">{activeCount}<span className="text-sm font-semibold text-slate-400 ml-1">/ {seatLimit > 0 ? seatLimit : '∞'}</span></div>
        <div className="text-[11px] text-slate-500 mt-1">{seatLimit > 0 ? seatsFull ? 'Todos os assentos contratados estão em uso' : `${seatLimit - activeCount} assento(s) disponível(is)` : 'Assentos sob demanda'}</div>
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-slate-500 uppercase">Usuários Cadastrados</span><Users className="w-4 h-4 text-[#008744]" /></div>
        <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">{memberCount}</div>
        <div className="text-[11px] text-slate-500 mt-1">{connectedCount} já acessaram · {memberCount - connectedCount} aguardando 1º login</div>
      </div>

      <div className="p-4 bg-[#2D3277] text-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-[#FFE600] uppercase">Plano Corporativo</span><ShieldCheck className="w-4 h-4 text-[#FFE600]" /></div>
        <div className="text-2xl font-extrabold font-mono mt-1">R$ {monthlyEstimate.toFixed(2).replace('.', ',')}<span className="text-xs font-sans font-normal text-white/75 ml-1">/mês</span></div>
        <div className="text-[11px] text-white/80 mt-1">R$ {pricePerLicense.toFixed(2).replace('.', ',')} por licença ativa</div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5 h-fit">
        <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#3483FA]" /><span>Adicionar Usuário e Vincular Licença</span></h3>
        <p className="text-[11px] text-slate-600 leading-relaxed">Informe o nome e o e-mail corporativo do colaborador. A licença será gerada na hora e vinculada automaticamente ao acesso dele.</p>

        {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" /><span>{formError}</span></div>}
        {formSuccess && <div className="p-3 rounded-xl bg-[#00A650]/10 border border-[#00A650]/30 text-[#008744] text-xs flex items-start gap-2 font-medium"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><span>{formSuccess}</span></div>}

        <form onSubmit={onAddUser} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nome do Usuário</label>
            <input type="text" required value={empName} onChange={event => setEmpName(event.target.value)} placeholder="Ex: Maria Oliveira" className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">E-mail Corporativo</label>
            <div className="flex items-stretch">
              <input type="text" required value={empEmailUser} onChange={event => setEmpEmailUser(event.target.value)} placeholder="maria.oliveira" className="flex-1 min-w-0 px-3 py-2 rounded-l-xl bg-slate-50 border border-r-0 border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white" />
              <span className="px-2.5 py-2 rounded-r-xl bg-slate-100 border border-slate-300 font-mono font-bold text-[#2D3277] text-[11px] flex items-center shrink-0">@{activeDomain}</span>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Perfil na Empresa</label>
            <select value={empRole} onChange={event => setEmpRole(event.target.value as CompanyRole)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]">
              <option value="member">Colaborador (Acesso ao Mapa e Dossiês)</option>
              <option value="company_admin">ADM da Empresa (Gerencia Usuários e Ocorrências)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Permissão de Ocorrências</label>
            <select value={empRole === 'company_admin' ? 'edit' : empIncidentAccess} onChange={event => setEmpIncidentAccess(event.target.value as IncidentAccess)} disabled={empRole === 'company_admin'} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA] disabled:opacity-60">
              <option value="read">Somente leitura</option>
              <option value="edit">Ler, registrar e editar</option>
            </select>
            {empRole === 'company_admin' && <p className="text-[10px] text-slate-500 mt-1">Administradores da empresa mantêm acesso de edição.</p>}
          </div>
          <button type="submit" disabled={isSaving || (company !== null && !company.active)} className="w-full py-2.5 px-4 rounded-xl bg-[#00A650] hover:bg-[#008744] disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer">
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>{isSaving ? 'Vinculando...' : 'Adicionar Usuário & Vincular Licença'}</span>
          </button>
        </form>
      </div>

      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-[#2D3277]">Controle de Usuários & Licenças ({members.length})</h3>
          <div className="relative w-full sm:w-72"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Buscar por nome, e-mail ou licença..." className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA]" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider"><tr><th className="p-3">Colaborador</th><th className="p-3">Chave da Licença</th><th className="p-3">Status</th><th className="p-3">Consultas</th><th className="p-3 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {members.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum usuário cadastrado para @{activeDomain} ainda. Adicione o primeiro colaborador ao lado.</td></tr> : page.rows.map(member => {
                const isSelf = member.user?.uid === currentUserUid;
                return (
                  <tr key={member.key} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap"><span className="font-bold text-slate-900">{member.displayName}</span>{member.companyRole === 'company_admin' && <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] text-[9px] font-bold">ADM EMPRESA</span>}{isSelf && <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">Você</span>}</div>
                      <div className="text-[11px] font-mono text-slate-500">{member.email}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{member.isConnected ? 'Conta ativa no sistema' : 'Aguardando 1º login'}</div>
                    </td>
                    <td className="p-3">{member.licenseKey ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2D3277]/10 text-[#2D3277] font-mono font-bold text-[11px]"><KeyRound className="w-3 h-3" />{member.licenseKey}</span> : <span className="text-slate-400 text-[11px]">Não vinculada</span>}</td>
                    <td className="p-3">{member.licenseStatus === 'active' ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00A650]/15 text-[#008744] font-bold text-[10px]"><BadgeCheck className="w-3 h-3" /> Ativa</span> : member.licenseStatus === 'suspended' ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]"><Ban className="w-3 h-3" /> Suspensa</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]"><Clock className="w-3 h-3" /> Sem Licença</span>}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{member.accessCount}</td>
                    <td className="p-3">{isSelf ? <span className="text-[10px] text-slate-400" title="Para evitar autoelevação de permissões, outro administrador deve gerenciar esta conta.">Sua conta · gerencie com outro ADM</span> : <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button onClick={() => onToggleMemberLicense(member)} className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${member.licenseStatus === 'active' ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200' : 'bg-[#00A650] hover:bg-[#008744] text-white'}`}>{member.licenseStatus === 'active' ? 'Suspender' : member.licenseKey ? 'Reativar' : 'Vincular Licença'}</button>
                      <button onClick={() => onToggleCompanyRole(member)} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#FFE600] text-[#2D3277] font-semibold text-[11px] cursor-pointer">{member.companyRole === 'company_admin' ? 'Remover ADM' : 'Tornar ADM'}</button>
                      <label className="flex items-center gap-1 text-[10px] text-slate-600">Ocorrências<select value={member.companyRole === 'company_admin' ? 'edit' : member.incidentAccess} disabled={member.companyRole === 'company_admin'} onChange={event => onChangeIncidentAccess(member, event.target.value as IncidentAccess)} className="px-1.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:bg-slate-100" aria-label={`Permissão de ocorrências para ${member.displayName}`}><option value="read">Ler</option><option value="edit">Editar</option></select></label>
                      {(member.license || member.user) && member.user?.role !== 'admin' && <button onClick={() => onRemoveMember(member)} title="Remover definitivamente da empresa" className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /><span className="sr-only">Remover {member.displayName} da empresa</span></button>}
                    </div>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination {...page} />
      </div>
    </div>
  </>
  );
};
