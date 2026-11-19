import { Pagination } from '../../../shared/components/Pagination';
import { useListPage } from '../../../shared/useListPage';
import React from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';
import type { FreeDomain } from '../../../types/admin';

interface AdminDomainsTabProps {
  newDomain: string;
  setNewDomain: (value: string) => void;
  newDomainLabel: string;
  setNewDomainLabel: (value: string) => void;
  newDomainAutoRef: boolean;
  setNewDomainAutoRef: (value: boolean) => void;
  handleAddFreeDomain: (event: React.FormEvent<HTMLFormElement>) => void;
  domains: FreeDomain[];
  handleToggleDomain: (domain: FreeDomain, field: 'active' | 'autoApproveReferrals') => void;
  handleDeleteDomain: (domain: string) => void;
}

export const AdminDomainsTab: React.FC<AdminDomainsTabProps> = ({
  newDomain, setNewDomain, newDomainLabel, setNewDomainLabel, newDomainAutoRef,
  setNewDomainAutoRef, handleAddFreeDomain, domains, handleToggleDomain, handleDeleteDomain
}) => {
  const page = useListPage(domains, 'domains', 20);
  return (
<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#008744]" />
              <span>Liberar Novo Domínio Free</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Qualquer usuário que autenticar com um domínio ativo abaixo entra no sistema com acesso liberado automaticamente.
            </p>
            <form onSubmit={handleAddFreeDomain} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Domínio (ex: mercadolivre.com)
                </label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  placeholder="mercadopago.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Identificação</label>
                <input
                  type="text"
                  value={newDomainLabel}
                  onChange={e => setNewDomainLabel(e.target.value)}
                  placeholder="Parceiro Logístico / Corporativo"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDomainAutoRef}
                  onChange={e => setNewDomainAutoRef(e.target.checked)}
                  className="rounded border-slate-300 text-[#3483FA]"
                />
                <span className="text-[11px] font-semibold text-slate-800">
                  Usuários indicados por este domínio acessam direto
                </span>
              </label>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#00A650] hover:bg-[#008744] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Domínio Free</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#2D3277]">
                Domínios Corporativos Liberados
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {domains.length} domínio(s)
              </span>
            </div>
            <div className="divide-y divide-slate-200">
              {page.rows.map(dom => (
                <div
                  key={dom.domain}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-[#2D3277]">
                        @{dom.domain}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dom.active
                            ? 'bg-[#00A650]/15 text-[#008744]'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {dom.active ? 'FREE ATIVO' : 'DESATIVADO'}
                      </span>
                      {dom.autoApproveReferrals && (
                        <span className="px-2 py-0.5 rounded bg-[#FFE600] text-[#2D3277] text-[10px] font-bold">
                          Indicação Direta
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{dom.label}</div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleToggleDomain(dom, 'active')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      {dom.active ? 'Pausar Domínio' : 'Ativar Domínio'}
                    </button>
                    <button
                      onClick={() => handleToggleDomain(dom, 'autoApproveReferrals')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#FFE600] text-[#2D3277] text-xs font-semibold cursor-pointer"
                    >
                      {dom.autoApproveReferrals ? 'Desativar Indicação Direta' : 'Permitir Indicação Direta'}
                    </button>
                    {dom.domain !== 'mercadolivre.com' && (
                      <button
                        onClick={() => handleDeleteDomain(dom.domain)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Remover Domínio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination {...page} />
          </div>
        </div>
  );
};
