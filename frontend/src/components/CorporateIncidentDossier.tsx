import React from 'react';
import { Building2, Clock3, Crosshair, FileText, History, MapPin, Package, ShieldAlert, UserRound, X } from 'lucide-react';
import { CorporatePackageIncident, IncidentHistoryEntry, PackageCustodyStatus } from '../types/admin';
import { CUSTODY_LABELS, INCIDENT_TYPE_META } from '../utils/corporateIncidentMetadata';

interface CorporateIncidentDossierProps {
  incident: CorporatePackageIncident;
  onClose: () => void;
  onCenterOnMap: () => void;
  onEdit?: () => void;
}

const formatTimestamp = (value: unknown): string => {
  if (!value) return '—';
  const dateValue = value as { toDate?: () => Date };
  const date = typeof dateValue.toDate === 'function'
    ? dateValue.toDate()
    : value instanceof Date
      ? value
      : new Date(value as string | number);

  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

const DetailField: React.FC<{ label: string; value?: React.ReactNode; wide?: boolean }> = ({ label, value, wide }) => (
  <div className={wide ? 'col-span-2 min-w-0' : 'min-w-0'}>
    <span className="block text-[10px] text-slate-500 uppercase font-semibold">{label}</span>
    <span className="block text-slate-900 font-medium leading-relaxed break-words">{value || '—'}</span>
  </div>
);

const IncidentSection: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <section className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
    <div className="flex items-center gap-1.5 text-[#2D3277] font-bold text-[11px] uppercase tracking-wide">
      <Icon className="w-3.5 h-3.5 text-[#3483FA] shrink-0" />
      <span>{title}</span>
    </div>
    {children}
  </section>
);

export const CorporateIncidentDossier: React.FC<CorporateIncidentDossierProps> = ({
  incident,
  onClose,
  onCenterOnMap,
  onEdit
}) => {
  const typeMeta = INCIDENT_TYPE_META[incident.incidentType] || INCIDENT_TYPE_META.outros;
  const custodyMeta = CUSTODY_LABELS[incident.custodyStatus as PackageCustodyStatus] || CUSTODY_LABELS.em_ocorrencia_delegacia;
  const history = incident.history || [];
  const estimatedValue = Number(incident.estimatedValue);
  const coordinatesAvailable = Number.isFinite(incident.lat) && Number.isFinite(incident.lng);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 md:hidden" />
      <aside className="fixed inset-x-0 bottom-14 z-40 max-h-[82dvh] rounded-t-3xl border-t border-slate-200 bg-white flex flex-col shadow-2xl md:static md:inset-auto md:max-h-none md:w-96 md:h-full md:rounded-none md:border-t-0 md:border-l md:border-slate-200 md:z-10 md:shrink-0">
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 mb-0.5 md:hidden shrink-0" />

        <header className="p-3.5 md:p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeMeta.badgeClass}`}>
                {typeMeta.label}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFE600] text-[#2D3277]">
                @{incident.companyDomain}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <button
                  onClick={onEdit}
                  aria-label="Editar ocorrência"
                  title="Editar ocorrência"
                  className="px-2 py-1.5 rounded-lg bg-[#2D3277] hover:bg-[#1E2355] text-white text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Editar
                </button>
              )}
              {coordinatesAvailable && (
                <button
                  onClick={onCenterOnMap}
                  aria-label="Centralizar ocorrência no mapa"
                  title="Centralizar no mapa"
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#2D3277] border border-slate-200 transition-colors cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Fechar detalhes da ocorrência"
                title="Fechar detalhes"
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <h2 className="font-bold text-sm md:text-base text-[#2D3277] leading-snug flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{incident.trackingCode || 'Ocorrência sem código de rastreio'}</span>
          </h2>
          <div className="text-[11px] text-slate-600 mt-1">
            Registro {incident.id} · B.O. {incident.boNumber || 'não informado'}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3.5 md:p-4 space-y-3.5 text-xs">
          <section className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Status de custódia</span>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${custodyMeta.badge}`}>
                {custodyMeta.short}
              </span>
            </div>
            <p className="text-slate-800 font-medium">{custodyMeta.label}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <Package className="w-3.5 h-3.5 text-[#3483FA]" />
              <span>Pacote/veículo retido na delegacia:</span>
              <strong className={incident.packageAtStation ? 'text-[#008744]' : 'text-slate-700'}>
                {incident.packageAtStation ? 'Sim' : 'Não'}
              </strong>
            </div>
          </section>

          <IncidentSection icon={FileText} title="Dados do registro">
            <div className="grid grid-cols-2 gap-2.5">
              <DetailField label="Tipo de ocorrência" value={typeMeta.label} />
              <DetailField label="Transportadora" value={incident.carrierName || 'Não informada'} />
              <DetailField label="Pacotes envolvidos" value={String(Math.max(1, Number(incident.packageQuantity) || 1))} />
              <DetailField label="Pacotes entregues" value={String(incident.packagesDelivered ?? 0)} />
              <DetailField label="Pacotes recuperados" value={String(incident.packagesRecovered ?? (incident.custodyStatus === 'devolvido_empresa' ? incident.packageQuantity ?? 1 : 0))} />
              <DetailField label="Pacotes roubados / não localizados" value={String(incident.packagesStolen ?? (incident.custodyStatus !== 'devolvido_empresa' && (incident.custodyStatus === 'extraviado_nao_localizado' || ['roubo_carga', 'roubo', 'furto'].includes(incident.incidentType)) ? incident.packageQuantity ?? 1 : 0))} />
              <DetailField label="Valor por pacote" value={(incident.estimatedUnitValue ?? incident.estimatedValue / Math.max(1, Number(incident.packageQuantity) || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
              <DetailField label="Número do B.O." value={incident.boNumber} />
              <DetailField label="Valor estimado" value={estimatedValue > 0 ? estimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não informado'} />
              <DetailField label="Empresa" value={`@${incident.companyDomain}`} />
              <DetailField label="Relato / observações" value={incident.notes} wide />
            </div>
          </IncidentSection>

          <IncidentSection icon={MapPin} title="Localização e delegacia">
            <div className="grid grid-cols-2 gap-2.5">
              <DetailField label="Endereço" value={incident.address} wide />
              <DetailField label="Bairro / localidade" value={incident.bairro} />
              <DetailField label="Município / UF" value={[incident.delegaciaMunicipio, incident.delegaciaUf].filter(Boolean).join(' / ')} />
              <DetailField label="Delegacia responsável" value={incident.delegaciaName} wide />
              <DetailField label="ID da delegacia" value={incident.delegaciaId} />
              <DetailField label="Coordenadas" value={coordinatesAvailable ? `${Number(incident.lat).toFixed(6)}, ${Number(incident.lng).toFixed(6)}` : undefined} />
            </div>
          </IncidentSection>

          <IncidentSection icon={UserRound} title="Registro e responsáveis">
            <div className="grid grid-cols-2 gap-2.5">
              <DetailField label="Registrado por" value={incident.createdByName} />
              <DetailField label="UID do responsável" value={incident.createdByUid} />
              <DetailField label="Criado em" value={formatTimestamp(incident.createdAt)} />
              <DetailField label="Atualizado em" value={formatTimestamp(incident.updatedAt)} />
            </div>
          </IncidentSection>

          <IncidentSection icon={History} title={`Histórico da ocorrência (${history.length})`}>
            {history.length === 0 ? (
              <p className="text-slate-500">Nenhum andamento adicional registrado.</p>
            ) : (
              <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-200">
                {history.map((entry: IncidentHistoryEntry, index) => {
                  const status = CUSTODY_LABELS[entry.status] || CUSTODY_LABELS.em_ocorrencia_delegacia;
                  return (
                    <article key={entry.id || `${entry.date}-${index}`} className="relative space-y-1">
                      <span className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-[#3483FA] border-2 border-white shadow-sm" />
                      <div className="flex flex-wrap items-center gap-1.5">
                        <strong className="text-[#2D3277]">{entry.title || 'Atualização'}</strong>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${status.badge}`}>{status.short}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {formatTimestamp(entry.date)} · {entry.authorName || 'Responsável não informado'}
                      </div>
                      {entry.description && (
                        <p className="text-slate-700 bg-white border border-slate-200 rounded-lg p-2 leading-relaxed">
                          {entry.description}
                        </p>
                      )}
                      {entry.authorUid && <div className="text-[9px] text-slate-400">UID: {entry.authorUid}</div>}
                    </article>
                  );
                })}
              </div>
            )}
          </IncidentSection>

          <div className="p-2.5 bg-[#2D3277]/5 border border-[#2D3277]/15 rounded-lg text-[10px] text-slate-600 leading-relaxed">
            <Building2 className="w-3 h-3 inline mr-1 text-[#2D3277]" />
            Dados confidenciais da empresa <strong>@{incident.companyDomain}</strong>.
          </div>
        </div>
      </aside>
    </>
  );
};
