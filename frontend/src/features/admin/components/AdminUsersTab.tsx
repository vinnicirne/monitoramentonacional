import { Pagination } from '../../../shared/components/Pagination';
import type { useAdminUsers } from '../hooks/useAdminUsers';
import React from 'react';
import { Ban, CheckCircle2, Clock, KeyRound, Search } from 'lucide-react';
import type { PlanConfig, UserProfile, UserStatus } from '../../../types/admin';

interface AdminUsersTabProps {
  userSearch: string;
  setUserSearch: (value: string) => void;
  userStatusFilter: 'all' | UserStatus;
  setUserStatusFilter: (value: 'all' | UserStatus) => void;
  stats: { pendingUsers: number };
  userPage: ReturnType<typeof useAdminUsers>;
  plans: PlanConfig[];
  currentAdminUid?: string;
  handleSetUserPlan: (user: UserProfile, planId: string) => void;
  handleSuspendUserLicense: (user: UserProfile) => void;
  handleAssignUserLicense: (user: UserProfile) => void;
  handleSetUserStatus: (user: UserProfile, status: UserStatus) => void;
  handleToggleUserAdmin: (user: UserProfile) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  userSearch, setUserSearch, userStatusFilter, setUserStatusFilter, stats, userPage,
  plans, currentAdminUid, handleSetUserPlan, handleSuspendUserLicense,
  handleAssignUserLicense, handleSetUserStatus, handleToggleUserAdmin
}) => (
<div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail, domínio ou código..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'pending', label: `Pendentes (${stats.pendingUsers})` },
                  { id: 'approved', label: 'Liberados' },
                  { id: 'blocked', label: 'Bloqueados' }
                ] as const
              ).map(f => (
                <button
                  key={f.id}
                  onClick={() => setUserStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    userStatusFilter === f.id
                      ? 'bg-[#2D3277] text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Usuário</th>
                  <th className="p-3">Domínio / Origem</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Plano</th>
                  <th className="p-3">Acessos</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {userPage.rows.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{u.displayName}</span>
                        {u.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] text-[9px] font-bold">
                            ADM
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{u.email}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Código: {u.referralCode}
                        {u.referredByCode ? ` · Indicado por ${u.referredByCode}` : ''}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="font-mono font-bold text-[#2D3277]">@{u.domain}</span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {u.autoApprovedBy === 'free_domain' && 'Domínio Free'}
                        {u.autoApprovedBy === 'corporate_license' && 'Licença Corporativa'}
                        {u.autoApprovedBy === 'meli_referral' && 'Indicação Direta MELI'}
                        {u.autoApprovedBy === 'admin_bootstrap' && 'Admin Principal'}
                        {u.autoApprovedBy === 'manual_admin' && 'Liberado pelo ADM'}
                        {u.autoApprovedBy === 'pending_approval' && 'Externo · Aguardando'}
                      </div>
                      {u.licenseStatus === 'active' && u.licenseKey && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2D3277]/10 text-[#2D3277] font-mono font-bold text-[10px]">
                          <KeyRound className="w-2.5 h-2.5" />
                          <span>{u.licenseKey}</span>
                        </div>
                      )}
                      {u.licenseStatus === 'suspended' && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono font-bold text-[10px]">
                          Licença Suspensa
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      {u.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00A650]/15 text-[#008744] font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Liberado
                        </span>
                      )}
                      {u.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                      {u.status === 'blocked' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          <Ban className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <select
                        value={u.planId}
                        onChange={e => handleSetUserPlan(u, e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3483FA]"
                      >
                        {plans.length > 0 ? (
                          plans.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="free_corp">Free Corporativo</option>
                            <option value="corp_licenca">Corporativo Por Licença</option>
                            <option value="pro_mensal">Operacional Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </>
                        )}
                      </select>
                    </td>

                    <td className="p-3 font-mono font-bold text-slate-800">
                      {u.accessCount || 0}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {u.licenseStatus === 'active' ? (
                          <button
                            onClick={() => handleSuspendUserLicense(u)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-[11px] cursor-pointer"
                          >
                            Suspender Licença
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignUserLicense(u)}
                            className="px-2.5 py-1 rounded-lg bg-[#2D3277]/10 hover:bg-[#2D3277] hover:text-[#FFE600] text-[#2D3277] font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            Atribuir Licença
                          </button>
                        )}
                        {u.status !== 'approved' && (
                          <button
                            onClick={() => handleSetUserStatus(u, 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-[#00A650] hover:bg-[#008744] text-white font-bold text-[11px] cursor-pointer"
                          >
                            Liberar
                          </button>
                        )}
                        {u.status !== 'blocked' && u.uid !== currentAdminUid && (
                          <button
                            onClick={() => handleSetUserStatus(u, 'blocked')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] cursor-pointer"
                          >
                            Bloquear
                          </button>
                        )}
                        {u.uid !== currentAdminUid && (
                          <button
                            onClick={() => handleToggleUserAdmin(u)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#FFE600] text-[#2D3277] font-semibold text-[11px] cursor-pointer"
                          >
                            {u.role === 'admin' ? 'Remover ADM' : 'Tornar ADM'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!userPage.loading && userPage.rows.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-600">
                    {userPage.error ? 'Não foi possível carregar os usuários.' : 'Nenhum usuário corresponde aos filtros.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination {...userPage} />
        </div>
);
