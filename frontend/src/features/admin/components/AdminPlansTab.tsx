import { Pagination } from '../../../shared/components/Pagination';
import { useListPage } from '../../../shared/useListPage';
import { usePlanUserCounts } from '../hooks/usePlanUserCounts';
import React from 'react';
import { CheckCircle2, Layers, Pencil, Plus } from 'lucide-react';
import type { PlanBillingModel, PlanConfig } from '../../../types/admin';

interface AdminPlansTabProps {
  editingPlanId: string | null;
  resetPlanForm: () => void;
  handleCreateOrUpdatePlan: (event: React.FormEvent<HTMLFormElement>) => void;
  planName: string;
  setPlanName: (value: string) => void;
  planBillingModel: PlanBillingModel;
  setPlanBillingModel: (value: PlanBillingModel) => void;
  planDesc: string;
  setPlanDesc: (value: string) => void;
  planPrice: string;
  setPlanPrice: (value: string) => void;
  planQueries: string;
  setPlanQueries: (value: string) => void;
  planFeaturesText: string;
  setPlanFeaturesText: (value: string) => void;
  plans: PlanConfig[];
  refreshVersion: number;
  handleEditPlan: (plan: PlanConfig) => void;
  handleTogglePlanActive: (plan: PlanConfig) => void;
}

export const AdminPlansTab: React.FC<AdminPlansTabProps> = ({
  editingPlanId, resetPlanForm, handleCreateOrUpdatePlan, planName, setPlanName,
  planBillingModel, setPlanBillingModel, planDesc, setPlanDesc, planPrice, setPlanPrice,
  planQueries, setPlanQueries, planFeaturesText, setPlanFeaturesText, plans, refreshVersion,
  handleEditPlan, handleTogglePlanActive
}) => {
  const page = useListPage(plans, 'plans', 12);
  const userCounts = usePlanUserCounts(page.rows, refreshVersion);
  return (
<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3483FA]" />
                <span>{editingPlanId ? 'Editar Plano' : 'Criar / Atualizar Plano'}</span>
              </h3>
              {editingPlanId && (
                <button
                  type="button"
                  onClick={resetPlanForm}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
            <form onSubmit={handleCreateOrUpdatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Plano</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  placeholder="Ex: Corporativo Por Licença"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modelo de Cobrança</label>
                <select
                  value={planBillingModel}
                  onChange={e => setPlanBillingModel(e.target.value as PlanBillingModel)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                >
                  <option value="per_user">Licença por Usuário (@empresa.com)</option>
                  <option value="fixed">Valor Fixo Mensal</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={planDesc}
                  onChange={e => setPlanDesc(e.target.value)}
                  placeholder="Escopo e público-alvo do plano"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {planBillingModel === 'per_user' ? 'R$ / licença / mês' : 'Valor R$/mês'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={planPrice}
                    onChange={e => setPlanPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consultas/mês</label>
                  <input
                    type="number"
                    min="0"
                    value={planQueries}
                    onChange={e => setPlanQueries(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recursos (separados por vírgula)
                </label>
                <textarea
                  rows={2}
                  value={planFeaturesText}
                  onChange={e => setPlanFeaturesText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingPlanId ? 'Atualizar Plano' : 'Salvar Plano'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {page.rows.map(plan => {
              const userCount = userCounts[plan.id] ?? '—';
              const isPerUser = plan.billingModel === 'per_user';
              const unitPrice = plan.pricePerLicense ?? plan.priceMonthly;
              return (
                <div
                  key={plan.id}
                  className={`p-5 bg-white border rounded-2xl shadow-sm flex flex-col justify-between gap-4 ${
                    plan.active ? 'border-slate-200' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-500">{plan.id}</span>
                          {isPerUser && (
                            <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] text-[9px] font-bold">
                              POR LICENÇA
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-extrabold text-[#2D3277]">{plan.name}</h4>
                      </div>
                      <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-[#FFE600] text-[#2D3277] shrink-0">
                        {unitPrice === 0
                          ? 'FREE'
                          : isPerUser
                          ? `R$ ${unitPrice}/usuário`
                          : `R$ ${unitPrice}/mês`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{plan.description}</p>
                    <div className="text-[11px] font-semibold text-[#2968C8]">
                      Limite: {plan.maxQueriesPerMonth >= 999999 ? 'Ilimitado' : `${plan.maxQueriesPerMonth} consultas/mês`} · {userCount} usuário(s)
                    </div>
                    <ul className="space-y-1 pt-1">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#008744] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold ${
                        plan.active ? 'text-[#008744]' : 'text-slate-500'
                      }`}
                    >
                      {plan.active ? 'Plano Ativo' : 'Plano Inativo'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#2D3277] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleTogglePlanActive(plan)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        {plan.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <Pagination {...page} />
          </div>
        </div>
  );
};
