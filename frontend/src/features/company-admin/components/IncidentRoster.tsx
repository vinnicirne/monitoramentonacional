import { Pagination } from '../../../shared/components/Pagination';
import { useListPage } from '../../../shared/useListPage';
import React from 'react';
import { Flame, History, MapPin, PackageX, Pencil, Search, Trash2 } from 'lucide-react';
import type { CorporatePackageIncident, PackageCustodyStatus } from '../../../types/admin';
import { CUSTODY_STATUS_LABELS, INCIDENT_TYPE_LABELS } from '../../incidents/incidentMetadata';
import type { IncidentFilterMode } from '../hooks/useCompanyIncidentData';

interface IncidentRosterProps {
  filteredIncidents: CorporatePackageIncident[];
  incidents: CorporatePackageIncident[];
  activeDomain: string;
  incidentStats: { totalRoubos: number; atStation: number };
  incidentSearch: string;
  setIncidentSearch: (value: string) => void;
  incidentFilter: IncidentFilterMode;
  setIncidentFilter: (value: IncidentFilterMode) => void;
  onLocateOnMap?: (lat: number, lng: number) => void;
  onViewIncidentDossier?: (incident: CorporatePackageIncident) => void;
  onOpenIncidentModal?: (incident?: CorporatePackageIncident | null) => void;
  handleEditIncident: (incident: CorporatePackageIncident) => void;
  handleTogglePackageAtStation: (incident: CorporatePackageIncident) => void;
  handleDeleteIncident: (incidentId: string) => void;
  handleQuickCustodyChange: (incident: CorporatePackageIncident, status: PackageCustodyStatus) => void;
  canDeleteIncidents: boolean;
  formatTimestamp: (timestamp: unknown) => string;
}

export const IncidentRoster: React.FC<IncidentRosterProps> = ({
  filteredIncidents, incidents, activeDomain, incidentStats, incidentSearch, setIncidentSearch,
  incidentFilter, setIncidentFilter, onLocateOnMap, onViewIncidentDossier, onOpenIncidentModal,
  handleEditIncident, handleTogglePackageAtStation, handleDeleteIncident, handleQuickCustodyChange,
  canDeleteIncidents, formatTimestamp
}) => {
  const page = useListPage(filteredIncidents, [activeDomain, incidentSearch, incidentFilter].join('/'));
  return (
<div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-[#2D3277]">
                    Ocorrências Policiais & Pacotes ({filteredIncidents.length})
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={incidentSearch}
                      onChange={e => setIncidentSearch(e.target.value)}
                      placeholder="Buscar código, B.O. ou delegacia..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  {(
                    [
                      { id: 'all', label: `Todos (${incidents.length})` },
                      { id: 'roubos', label: `Roubos & Furtos (${incidentStats.totalRoubos})` },
                      { id: 'at_station', label: `Na Delegacia (${incidentStats.atStation})` },
                      { id: 'fraude', label: 'Fraudes' },
                      { id: 'extravio', label: 'Extravios' },
                      { id: 'ameaca', label: 'Ameaças' },
                      { id: 'resolved', label: 'Liberados / Devolvidos' }
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setIncidentFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                        incidentFilter === tab.id
                          ? 'bg-[#2D3277] text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {filteredIncidents.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 space-y-2">
                    <PackageX className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>
                      Nenhuma ocorrência encontrada para @{activeDomain}. Cadastre ao lado pacotes extraviados ou com fraude vinculados à delegacia.
                    </p>
                  </div>
                ) : (
                  page.rows.map(inc => {
                    const typeMeta = INCIDENT_TYPE_LABELS[inc.incidentType] || INCIDENT_TYPE_LABELS.outros;
                    const custodyMeta =
                      CUSTODY_STATUS_LABELS[inc.custodyStatus] ||
                      CUSTODY_STATUS_LABELS.em_ocorrencia_delegacia;

                    return (
                      <div key={inc.id} className="p-4 hover:bg-slate-50 space-y-2.5 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-extrabold text-sm text-[#2D3277]">
                                {inc.trackingCode}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${typeMeta.badgeClass}`}
                              >
                                {typeMeta.label}
                              </span>
                              {inc.boNumber && (
                                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                                  B.O. {inc.boNumber}
                                </span>
                              )}
                              {inc.carrierName && <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800">{inc.carrierName}</span>}
                              {inc.estimatedValue > 0 && (
                                <span className="font-mono font-bold text-[11px] text-slate-800">
                                  R$ {inc.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-700 flex-wrap">
                              <span className="font-mono font-semibold text-slate-700">{Math.max(1, Number(inc.packageQuantity) || 1)} pacote(s)</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-[10px] font-semibold text-slate-600">{inc.custodyStatus === 'devolvido_empresa' ? 'Recuperados / entregues' : inc.custodyStatus === 'extraviado_nao_localizado' || ['roubo_carga', 'roubo', 'furto'].includes(inc.incidentType) ? 'Perdidos / roubados' : 'Em andamento / custódia'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] font-mono font-bold text-[10px]">
                                {inc.delegaciaUf}
                              </span>
                              <span className="font-bold">{inc.delegaciaName}</span>
                              {inc.delegaciaMunicipio && (
                                <span className="text-slate-500">· {inc.delegaciaMunicipio}</span>
                              )}
                            </div>

                            {inc.address && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-md">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate">{inc.address}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                            {inc.lat != null && inc.lng != null && onLocateOnMap && (
                              <button
                                type="button"
                                onClick={() => onLocateOnMap(Number(inc.lat), Number(inc.lng))}
                                title="Localizar no Mapa de Calor"
                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Flame className="w-3.5 h-3.5 text-red-600" />
                                <span>Ver no Mapa</span>
                              </button>
                            )}

                            {onViewIncidentDossier && (
                              <button
                                type="button"
                                onClick={() => onViewIncidentDossier(inc)}
                                title="Abrir dossiê da ocorrência"
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <History className="w-3.5 h-3.5 text-blue-600" />
                                <span>Ver detalhes</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleTogglePackageAtStation(inc)}
                              title="Alternar se o pacote físico está na delegacia"
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer border ${
                                inc.packageAtStation
                                  ? 'bg-rose-600 text-white border-rose-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {inc.packageAtStation ? 'PACOTE NA DELEGACIA' : 'Fora da DP'}
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenIncidentModal ? onOpenIncidentModal(inc) : handleEditIncident(inc)}
                              title="Editar ocorrência"
                              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {canDeleteIncidents && <button
                              type="button"
                              onClick={() => handleDeleteIncident(inc.id)}
                              title="Excluir registro"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>}
                          </div>
                        </div>

                        {inc.notes && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                            {inc.notes}
                          </p>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${custodyMeta.badgeClass}`}>
                              {custodyMeta.shortLabel}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Por {inc.createdByName} em {formatTimestamp(inc.createdAt)}
                            </span>
                          </div>

                          <select
                            value={inc.custodyStatus}
                            onChange={e =>
                              handleQuickCustodyChange(inc, e.target.value as PackageCustodyStatus)
                            }
                            aria-label="Atualizar custódia"
                            className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-[#3483FA] cursor-pointer"
                          >
                            <option value="em_ocorrencia_delegacia">Em ocorrência na DP</option>
                            <option value="aguardando_pericia">Aguardando perícia</option>
                            <option value="liberado_retirada">Liberado p/ retirada</option>
                            <option value="devolvido_empresa">Devolvido à empresa</option>
                            <option value="extraviado_nao_localizado">Não localizado</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <Pagination {...page} />
            </div>
  );
};
