import React from 'react';
import { Activity, Clock, MapPin } from 'lucide-react';
import type { AccessLog } from '../../../types/admin';

interface AdminOverviewTabProps {
  stats: { topLocations: [string, number][]; pendingUsers: number };
  accessLogs: AccessLog[];
  formatTimestamp: (timestamp: unknown) => string;
  onReviewPendingUsers: () => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  stats, accessLogs, formatTimestamp, onReviewPendingUsers
}) => (
<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Top Accessed Locations */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#3483FA]" />
                <span>DPs & Locais Mais Acessados</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Top 6</span>
            </div>

            {stats.topLocations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Clique em qualquer DP, comunidade ou endereço no mapa para registrar acessos aqui.
              </div>
            ) : (
              <div className="space-y-2">
                {stats.topLocations.map(([name, count], idx) => (
                  <div
                    key={name}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                          idx === 0
                            ? 'bg-[#FFE600] text-[#2D3277] border border-[#E6CF00]'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900 truncate">{name}</span>
                    </div>
                    <span className="font-mono font-bold text-[#2968C8] shrink-0">{count}x</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pending approvals quick alert */}
            {stats.pendingUsers > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{stats.pendingUsers} usuário(s) aguardando liberação</span>
                </div>
                <button
                  onClick={() => {
                    onReviewPendingUsers();
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#2D3277] hover:bg-[#1E2258] text-white font-bold text-xs cursor-pointer"
                >
                  Revisar Pendentes Agora
                </button>
              </div>
            )}
          </div>

          {/* Recent Access Logs Table */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#008744]" />
                <span>Histórico Recente de Localizações Acessadas</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Últimos {accessLogs.length} registros
              </span>
            </div>
            <div className="overflow-x-auto max-h-[440px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-3">Usuário / Domínio</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Local / DP Acessada</th>
                    <th className="p-3">Município / UF</th>
                    <th className="p-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {accessLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        Nenhum acesso registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    accessLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{log.userName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{log.userEmail}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#3483FA]/10 text-[#2968C8] font-mono font-bold text-[10px]">
                            {log.targetType}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {log.targetName}
                          {log.cisp > 0 && (
                            <span className="ml-1.5 text-[10px] font-mono text-slate-500">
                              (CISP {log.cisp})
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {log.municipio ? `${log.municipio} · ` : ''}
                          <span className="font-mono font-bold text-[#2D3277]">{log.uf}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                          {formatTimestamp(log.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
);
