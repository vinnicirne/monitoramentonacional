import { Pagination } from '../../../shared/components/Pagination';
import { useListPage } from '../../../shared/useListPage';
import { useAdminCompanyMembers } from '../hooks/useAdminCompanyMembers';
import React from 'react';
import { BadgeCheck, Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { CorporateCompany, PlanConfig, UserProfile } from '../../../types/admin';

interface AdminCompaniesTabProps {
  stats: { activeCompanies: number; activeLicensedUsers: number; monthlyCorporateRevenue: number };
  editingCompanyDomain: string | null;
  resetCompanyForm: () => void;
  compDomain: string;
  setCompDomain: (value: string) => void;
  compName: string;
  setCompName: (value: string) => void;
  compPlanId: string;
  setCompPlanId: (value: string) => void;
  compPricePerLicense: string;
  setCompPricePerLicense: (value: string) => void;
  compLicensedSeats: string;
  setCompLicensedSeats: (value: string) => void;
  compAutoApprove: boolean;
  setCompAutoApprove: (value: boolean) => void;
  plans: PlanConfig[];
  handleSaveCompany: (event: React.FormEvent<HTMLFormElement>) => void;
  companies: CorporateCompany[];
  onOpenCompanyPanel?: (domain: string) => void;
  handleEditCompany: (company: CorporateCompany) => void;
  handleToggleCompany: (company: CorporateCompany, field: 'active' | 'autoApprove') => void;
  handleDeleteCompany: (domain: string) => void;
  currentAdminUid?: string;
  handleToggleCompanyAdminRole: (user: UserProfile, company: CorporateCompany) => void;
  handleSuspendUserLicense: (user: UserProfile) => void;
  handleAssignUserLicense: (user: UserProfile, domain?: string, planId?: string) => void;
}

export const AdminCompaniesTab: React.FC<AdminCompaniesTabProps> = ({
  stats, editingCompanyDomain, resetCompanyForm, compDomain, setCompDomain, compName,
  setCompName, compPlanId, setCompPlanId, compPricePerLicense, setCompPricePerLicense,
  compLicensedSeats, setCompLicensedSeats, compAutoApprove, setCompAutoApprove, plans,
  handleSaveCompany, companies, onOpenCompanyPanel, handleEditCompany,
  handleToggleCompany, handleDeleteCompany, currentAdminUid, handleToggleCompanyAdminRole,
  handleSuspendUserLicense, handleAssignUserLicense
}) => {
  const companyPage = useListPage(companies, 'companies', 8);
  const members = useAdminCompanyMembers(companyPage.rows);
  return (
<div className="space-y-5">
          {/* Corporate Billing Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Empresas Ativas</div>
              <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">
                {stats.activeCompanies}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Domínios corporativos contratantes
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase">
                Licenças Atribuídas a Usuários
              </div>
              <div className="text-2xl font-extrabold text-[#3483FA] font-mono mt-1">
                {stats.activeLicensedUsers}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Cada usuário recebe licença nominal @empresa.com
              </div>
            </div>
            <div className="p-4 bg-[#2D3277] text-white rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-[#FFE600] uppercase">
                Faturamento Mensal por Licenças
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1">
                R$ {stats.monthlyCorporateRevenue.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-[11px] text-white/80 mt-0.5">
                Soma de usuários com licença ativa × valor unitário
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Form: Register/Edit Corporate Company */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#3483FA]" />
                  <span>
                    {editingCompanyDomain ? `Editar @${editingCompanyDomain}` : 'Cadastrar Empresa (@empresa.com)'}
                  </span>
                </h3>
                {editingCompanyDomain && (
                  <button
                    type="button"
                    onClick={resetCompanyForm}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cada usuário autenticado com <code>@empresa.com</code> recebe uma licença nominal vinculada à sua empresa e contabilizada no plano por usuário.
              </p>

              <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Domínio da Empresa (ex: empresa.com)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingCompanyDomain)}
                    value={compDomain}
                    onChange={e => setCompDomain(e.target.value)}
                    placeholder="empresa.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono text-slate-900 disabled:opacity-60 focus:outline-none focus:border-[#3483FA]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Razão / Nome da Empresa</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={e => setCompName(e.target.value)}
                    placeholder="Empresa Logística S.A."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plano Vinculado</label>
                  <select
                    value={compPlanId}
                    onChange={e => {
                      const nextId = e.target.value;
                      setCompPlanId(nextId);
                      const chosen = plans.find(p => p.id === nextId);
                      if (chosen && !editingCompanyDomain) {
                        setCompPricePerLicense(String(chosen.pricePerLicense ?? chosen.priceMonthly ?? 49));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  >
                    {plans.length > 0 ? (
                      plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (R$ {p.pricePerLicense ?? p.priceMonthly}
                          {p.billingModel === 'per_user' ? '/usuário' : '/mês'})
                        </option>
                      ))
                    ) : (
                      <option value="corp_licenca">Corporativo Por Licença</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      R$ / Licença (Usuário)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={compPricePerLicense}
                      onChange={e => setCompPricePerLicense(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Assentos Contratados
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={compLicensedSeats}
                      onChange={e => setCompLicensedSeats(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compAutoApprove}
                    onChange={e => setCompAutoApprove(e.target.checked)}
                    className="rounded border-slate-300 text-[#3483FA]"
                  />
                  <span className="text-[11px] font-semibold text-slate-800">
                    Gerar licença e liberar acesso direto para usuários verificados @{compDomain || 'empresa.com'}
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingCompanyDomain ? 'Atualizar Empresa' : 'Cadastrar Empresa & Licenças'}</span>
                </button>
              </form>
            </div>

            {/* Right List: Corporate Companies & Per-User Licenses */}
            <div className="lg:col-span-8 space-y-4">
              {companies.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-extrabold text-[#2D3277]">
                    Nenhuma empresa corporativa cadastrada ainda
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Cadastre ao lado um domínio como <code className="font-mono font-bold">empresa.com</code> definindo o valor da licença por usuário. Quando colaboradores entrarem com <code className="font-mono">@empresa.com</code>, receberão sua licença individual automaticamente.
                  </p>
                </div>
              ) : (
                companyPage.rows.map(comp => {
                  const companyUsers = members.byDomain[comp.domain] ?? [];
                  const activeCompanyLicenses = companyUsers.filter(
                    u => u.licenseStatus === 'active'
                  );
                  const monthlyDue = activeCompanyLicenses.length * (comp.pricePerLicense || 0);
                  const contractedTotal =
                    comp.licensedSeats > 0 ? comp.licensedSeats * (comp.pricePerLicense || 0) : 0;
                  const seatsExceeded =
                    comp.licensedSeats > 0 && activeCompanyLicenses.length > comp.licensedSeats;

                  return (
                    <div
                      key={comp.domain}
                      className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${
                        comp.active ? 'border-slate-200' : 'border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-[#2D3277]">
                              {comp.companyName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#2D3277] text-[#FFE600] font-mono font-bold text-[11px]">
                              @{comp.domain}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                comp.active
                                  ? 'bg-[#00A650]/15 text-[#008744]'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {comp.active ? 'ATIVA' : 'PAUSADA'}
                            </span>
                            {comp.autoApprove && (
                              <span className="px-2 py-0.5 rounded bg-[#3483FA]/15 text-[#2968C8] text-[10px] font-bold">
                                Auto-Licença ON
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                            <span>
                              Plano: <strong className="font-mono text-slate-800">{comp.planId}</strong>
                            </span>
                            <span>
                              Licença: <strong className="text-[#008744]">R$ {(comp.pricePerLicense || 0).toFixed(2).replace('.', ',')}/usuário</strong>
                            </span>
                            <span>
                              Uso:{' '}
                              <strong className={seatsExceeded ? 'text-rose-700' : 'text-[#2D3277]'}>
                                {activeCompanyLicenses.length} / {comp.licensedSeats > 0 ? comp.licensedSeats : '∞'} assentos
                              </strong>
                            </span>
                            <span>
                              Fatura Mensal:{' '}
                              <strong className="text-[#2D3277] font-mono">
                                R$ {monthlyDue.toFixed(2).replace('.', ',')}
                              </strong>
                              {contractedTotal > 0 && (
                                <span className="text-slate-400 ml-1">
                                  (teto R$ {contractedTotal.toFixed(2).replace('.', ',')})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          {onOpenCompanyPanel && (
                            <button
                              onClick={() => onOpenCompanyPanel(comp.domain)}
                              className="px-2.5 py-1 rounded-lg bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Building2 className="w-3 h-3" />
                              <span>Abrir Painel Corporativo</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleEditCompany(comp)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleToggleCompany(comp, 'active')}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
                          >
                            {comp.active ? 'Pausar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleToggleCompany(comp, 'autoApprove')}
                            className="px-2.5 py-1 rounded-lg bg-[#FFE600] hover:bg-[#E6CF00] text-[#2D3277] text-xs font-bold cursor-pointer"
                          >
                            {comp.autoApprove ? 'Auto OFF' : 'Auto ON'}
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(comp.domain)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Remover Empresa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Users under this @empresa.com */}
                      <div className="p-3.5">
                        {members.loading ? <p role="status" className="py-3 text-xs text-slate-600">Carregando colaboradores…</p> : members.error ? <p role="alert" className="py-3 text-xs text-rose-700">Não foi possível carregar os colaboradores.</p> : companyUsers.length === 0 ? (
                          <div className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                            <div>
                              Nenhum usuário cadastrado com <code className="font-mono">@{comp.domain}</code> ainda.
                            </div>
                            {onOpenCompanyPanel && (
                              <button
                                type="button"
                                onClick={() => onOpenCompanyPanel(comp.domain)}
                                className="px-3 py-1.5 rounded-lg bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-[11px] cursor-pointer"
                              >
                                Adicionar Colaboradores & Ocorrências no Painel Corporativo
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {companyUsers.map(cu => (
                              <div
                                key={cu.uid}
                                className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900">{cu.displayName}</span>
                                    {cu.companyRole === 'company_admin' && (
                                      <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] font-bold text-[9px]">
                                        ADM EMPRESA
                                      </span>
                                    )}
                                    {cu.licenseStatus === 'active' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00A650]/15 text-[#008744] font-mono font-bold text-[10px]">
                                        <BadgeCheck className="w-3 h-3" />
                                        {cu.licenseKey || 'LIC-ATIVA'}
                                      </span>
                                    ) : cu.licenseStatus === 'suspended' ? (
                                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                                        Licença Suspensa
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                        Sem Licença Ativa
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-500">{cu.email}</div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                  <span className="text-[11px] font-mono text-slate-600 mr-1">
                                    {cu.licenseStatus === 'active'
                                      ? `R$ ${(comp.pricePerLicense || 0).toFixed(2).replace('.', ',')}/mês`
                                      : 'R$ 0,00'}
                                  </span>
                                  {cu.uid !== currentAdminUid && (
                                    <button
                                      onClick={() => handleToggleCompanyAdminRole(cu, comp)}
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#FFE600] text-[#2D3277] font-semibold text-[11px] cursor-pointer"
                                    >
                                      {cu.companyRole === 'company_admin'
                                        ? 'Remover ADM Empresa'
                                        : 'Tornar ADM Empresa'}
                                    </button>
                                  )}
                                  {cu.licenseStatus === 'active' ? (
                                    <button
                                      onClick={() => handleSuspendUserLicense(cu)}
                                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] cursor-pointer"
                                    >
                                      Suspender Licença
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAssignUserLicense(cu, comp.domain, comp.planId)}
                                      className="px-2.5 py-1 rounded-lg bg-[#00A650] hover:bg-[#008744] text-white font-bold text-[11px] cursor-pointer"
                                    >
                                      Atribuir Licença
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <Pagination {...companyPage} />
            </div>
          </div>
        </div>
  );
};
