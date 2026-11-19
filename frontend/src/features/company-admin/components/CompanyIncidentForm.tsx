import React from 'react';
import { AlertCircle, CheckCircle2, MapPin, PackageX, Plus, RefreshCw } from 'lucide-react';
import type { PackageCustodyStatus, PackageIncidentType } from '../../../types/admin';
import type { DelegaciaOption } from '../types';
import { formatBrlInput } from '../../../utils/currency';

interface CompanyIncidentFormValues {
  editingIncidentId: string | null;
  incidentError: string | null;
  incidentSuccess: string | null;
  isSavingIncident: boolean;
  trackingCode: string;
  incidentType: PackageIncidentType;
  carrierName: string;
  packageQuantity: string;
  packagesDelivered: string;
  packagesRecovered: string;
  packagesStolen: string;
  boNumber: string;
  estimatedUnitValue: string;
  delegaciaUfFilter: 'TODAS' | 'RJ' | 'MG' | 'ES';
  delegaciaSearch: string;
  selectedDelegaciaId: string;
  packageAtStation: boolean;
  custodyStatus: PackageCustodyStatus;
  incidentNotes: string;
}

interface CompanyIncidentFormActions {
  onReset: () => void;
  setTrackingCode: (value: string) => void;
  setIncidentType: (value: PackageIncidentType) => void;
  setCarrierName: (value: string) => void;
  setPackageQuantity: (value: string) => void;
  setPackagesDelivered: (value: string) => void;
  setPackagesRecovered: (value: string) => void;
  setPackagesStolen: (value: string) => void;
  setBoNumber: (value: string) => void;
  setEstimatedUnitValue: (value: string) => void;
  setDelegaciaUfFilter: (value: 'TODAS' | 'RJ' | 'MG' | 'ES') => void;
  setDelegaciaSearch: (value: string) => void;
  setSelectedDelegaciaId: (value: string) => void;
  setPackageAtStation: (value: boolean) => void;
  setCustodyStatus: (value: PackageCustodyStatus) => void;
  setIncidentNotes: (value: string) => void;
}

interface CompanyIncidentFormProps {
  values: CompanyIncidentFormValues;
  actions: CompanyIncidentFormActions;
  registeredCarriers: string[];
  filteredDelegacias: DelegaciaOption[];
  companyActive: boolean | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const CompanyIncidentForm: React.FC<CompanyIncidentFormProps> = ({
  values,
  actions,
  registeredCarriers,
  filteredDelegacias,
  companyActive,
  onSubmit
}) => (
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5 h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                  <PackageX className="w-4 h-4 text-rose-600" />
                  <span>
                    {values.editingIncidentId
                      ? 'Editar Ocorrência do Pacote'
                      : 'Cadastrar Pacote Extraviado / Fraude'}
                  </span>
                </h3>
                {values.editingIncidentId && (
                  <button
                    type="button"
                    onClick={actions.onReset}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {values.incidentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{values.incidentError}</span>
                </div>
              )}

              {values.incidentSuccess && (
                <div className="p-3 rounded-xl bg-[#00A650]/10 border border-[#00A650]/30 text-[#008744] text-xs flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{values.incidentSuccess}</span>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Código do Pacote / Rastreio
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={values.trackingCode}
                      onChange={e => actions.setTrackingCode(e.target.value)}
                      placeholder="Ex: MELI-BR94820129"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tipo de Ocorrência
                    </label>
                    <select
                      value={values.incidentType}
                      onChange={e => actions.setIncidentType(e.target.value as PackageIncidentType)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                    >
                      <option value="extravio">Extravio</option>
                      <option value="ameaca">Ameaça</option>
                      <option value="fraude">Fraude</option>
                      <option value="roubo_carga">Roubo de Carga</option>
                      <option value="apreensao">Apreensão Policial</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                </div>





                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Transportadora</label>
                    <input
                      type="text"
                      list="company-carrier-options"
                      maxLength={120}
                      value={values.carrierName}
                      onChange={e => actions.setCarrierName(e.target.value)}
                      placeholder="Digite ou cadastre a transportadora"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                    <datalist id="company-carrier-options">{registeredCarriers.map(carrier => <option key={carrier} value={carrier} />)}</datalist>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quantidade de pacotes envolvidos</label>
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      step="1"
                      required
                      value={values.packageQuantity}
                      onChange={e => actions.setPackageQuantity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                    <span className="mt-1 block text-[10px] text-slate-500">Recuperados e perdidos são totalizados automaticamente pelo status salvo.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {([
                    ['Pacotes Entregues', values.packagesDelivered, actions.setPackagesDelivered],
                    ['Pacotes Recuperados', values.packagesRecovered, actions.setPackagesRecovered],
                    ['Pacotes Roubados', values.packagesStolen, actions.setPackagesStolen]
                  ] as const).map(([label, value, setter]) => (
                    <div key={label}>
                      <label className="block font-semibold text-slate-700 mb-1">{label}</label>
                      <input type="number" min="0" max={values.packageQuantity} step="1" value={value} onChange={e => setter(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nº do B.O. / Registro Policial
                    </label>
                    <input
                      type="text"
                      maxLength={64}
                      value={values.boNumber}
                      onChange={e => actions.setBoNumber(e.target.value)}
                      placeholder="Ex: 019-04512/2026"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      VALOR TOTAL ESTIMADO (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={values.estimatedUnitValue}
                      onChange={e => actions.setEstimatedUnitValue(formatBrlInput(e.target.value))}
                      placeholder="0,00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Police Station Picker */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="font-bold text-[#2D3277] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#3483FA]" />
                      <span>Selecionar Delegacia (RJ / MG / ES)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {(['TODAS', 'RJ', 'MG', 'ES'] as const).map(uf => (
                        <button
                          key={uf}
                          type="button"
                          onClick={() => actions.setDelegaciaUfFilter(uf)}
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] cursor-pointer ${
                            values.delegaciaUfFilter === uf
                              ? 'bg-[#2D3277] text-[#FFE600]'
                              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {uf}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={values.delegaciaSearch}
                    onChange={e => actions.setDelegaciaSearch(e.target.value)}
                    placeholder="Buscar DP, delegacia ou município..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  />

                  <select
                    required
                    value={values.selectedDelegaciaId}
                    onChange={e => actions.setSelectedDelegaciaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  >
                    {filteredDelegacias.length === 0 ? (
                      <option value="">Nenhuma delegacia encontrada para este filtro</option>
                    ) : (
                      filteredDelegacias.map(del => (
                        <option key={del.id} value={del.id}>
                          {del.label}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="text-[10px] text-slate-500">
                    {filteredDelegacias.length} delegacia(s) disponível(is) na base territorial
                  </div>
                </div>

                {/* Package Custody Toggle & Status */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values.packageAtStation}
                      onChange={e => actions.setPackageAtStation(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-rose-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">
                        O pacote está atualmente na delegacia em ocorrência policial
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Marque se o volume físico encontra-se apreendido, retido ou sob custódia da DP selecionada.
                      </div>
                    </div>
                  </label>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Situação / Custódia Atual
                    </label>
                    <select
                      value={values.custodyStatus}
                      onChange={e => {
                        const next = e.target.value as PackageCustodyStatus;
                        actions.setCustodyStatus(next);
                        if (next === 'em_ocorrencia_delegacia' || next === 'aguardando_pericia') {
                          actions.setPackageAtStation(true);
                        } else if (next === 'devolvido_empresa' || next === 'extraviado_nao_localizado') {
                          actions.setPackageAtStation(false);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                    >
                      <option value="em_ocorrencia_delegacia">
                        Na delegacia — em ocorrência policial
                      </option>
                      <option value="aguardando_pericia">
                        Na delegacia — aguardando perícia
                      </option>
                      <option value="liberado_retirada">
                        Liberado pela delegacia para retirada
                      </option>
                      <option value="devolvido_empresa">
                        Devolvido / recuperado pela empresa
                      </option>
                      <option value="extraviado_nao_localizado">
                        Extraviado / não localizado
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Observações / Detalhes da Ocorrência
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={values.incidentNotes}
                    onChange={e => actions.setIncidentNotes(e.target.value)}
                    placeholder="Ex: Motorista registrou B.O. presencial, pacote retido no setor de cargas da DP aguardando ofício de retirada..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={values.isSavingIncident || (companyActive === false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] disabled:opacity-60 text-[#FFE600] font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {values.isSavingIncident ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>
                    {values.isSavingIncident
                      ? 'Salvando...'
                      : values.editingIncidentId
                      ? 'Salvar Alterações da Ocorrência'
                      : 'Registrar Ocorrência na Delegacia'}
                  </span>
                </button>
              </form>
            </div>
);
