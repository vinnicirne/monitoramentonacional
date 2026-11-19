import React, { useEffect } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import { OperationType, type ReferralRecord } from '../../../types/admin';
import { reportFirestoreError } from '../../../firebase';
import { useCursorPages } from '../../../shared/useCursorPages';
import { Pagination } from '../../../shared/components/Pagination';
import { readReferralCodePage, readReferralPage } from '../services/adminReferralQueries';

interface AdminReferralsTabProps {
  totalReferrals?: number;
  totalCodes?: number | null;
  refreshVersion: number;
  copiedCode: string | null;
  handleCopyRef: (code: string) => void;
  handleSetReferralStatus: (referral: ReferralRecord, status: 'approved' | 'revoked') => void;
}

export const AdminReferralsTab: React.FC<AdminReferralsTabProps> = ({
  totalReferrals, totalCodes, refreshVersion, copiedCode, handleCopyRef, handleSetReferralStatus
}) => {
  const codes = useCursorPages('referral_codes', true, readReferralCodePage, refreshVersion);
  const referrals = useCursorPages('referrals', true, readReferralPage, refreshVersion);
  useEffect(() => {
    if (codes.error) reportFirestoreError(codes.error, OperationType.LIST, 'referral_codes');
    if (referrals.error) reportFirestoreError(referrals.error, OperationType.LIST, 'referrals');
  }, [codes.error, referrals.error]);
  return (
<div className="space-y-5">
          <div className="p-4 bg-[#FFE600]/30 border border-[#E6CF00] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#2D3277]">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Regra de Indicações: Indicados por <strong>@mercadolivre.com</strong> entram direto. Externos (<code>@gmail.com</code>, <code>@outlook.com</code>, etc.) passam por liberação.
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#2D3277] text-[#FFE600] font-bold text-[11px] shrink-0">
              Afiliados: Sem comissão por hora
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Affiliate Codes */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-extrabold text-sm text-[#2D3277]">
                Códigos de Afiliados / Indicadores{totalCodes != null && ` (${totalCodes})`}
              </div>
              <div className="divide-y divide-slate-200 max-h-[420px] overflow-y-auto">
                {codes.error && <p role="alert" className="p-3 text-xs text-rose-700">Não foi possível carregar os códigos.</p>}
                {codes.rows.map(rc => (
                  <div key={rc.code} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-[#2D3277] text-[#FFE600]">
                          {rc.code}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">{rc.ownerName}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-1">
                        @{rc.ownerDomain} · {rc.totalReferrals} indicado(s)
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyRef(rc.code)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#3483FA] hover:text-white text-slate-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      {copiedCode === rc.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === rc.code ? 'Copiado' : 'Link'}</span>
                    </button>
                  </div>
                ))}
              </div>
              <Pagination {...codes} />
            </div>

            {/* Individual Referral Records */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-extrabold text-sm text-[#2D3277]">
                Histórico de Indicações{totalReferrals != null && ` (${totalReferrals})`}
              </div>
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-3">Indicado</th>
                      <th className="p-3">Indicado por</th>
                      <th className="p-3">Regra</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Controle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {referrals.error ? <tr><td colSpan={5} className="p-3 text-rose-700">Não foi possível carregar as indicações.</td></tr> : referrals.loading ? null : referrals.rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          Nenhuma indicação registrada ainda. Compartilhe um link <code>?ref=CODIGO</code>.
                        </td>
                      </tr>
                    ) : (
                      referrals.rows.map(ref => (
                        <tr key={ref.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{ref.referredName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{ref.referredEmail}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{ref.referrerName}</div>
                            <div className="text-[10px] font-mono text-[#2968C8]">
                              {ref.code} (@{ref.referrerDomain})
                            </div>
                          </td>
                          <td className="p-3">
                            {ref.autoApproved ? (
                              <span className="px-2 py-0.5 rounded bg-[#00A650]/10 text-[#008744] font-bold text-[10px]">
                                Direto MELI
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                Externo
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ref.status === 'approved'
                                  ? 'bg-[#00A650]/15 text-[#008744]'
                                  : ref.status === 'revoked'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ref.status === 'approved'
                                ? 'Liberado'
                                : ref.status === 'revoked'
                                ? 'Revogado'
                                : 'Pendente'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1">
                            {ref.status !== 'approved' && (
                              <button
                                onClick={() => handleSetReferralStatus(ref, 'approved')}
                                className="px-2 py-1 rounded bg-[#00A650] text-white font-bold text-[10px] cursor-pointer"
                              >
                                Liberar
                              </button>
                            )}
                            {ref.status !== 'revoked' && (
                              <button
                                onClick={() => handleSetReferralStatus(ref, 'revoked')}
                                className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[10px] cursor-pointer"
                              >
                                Revogar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination {...referrals} />
            </div>
          </div>
        </div>
  );
};
