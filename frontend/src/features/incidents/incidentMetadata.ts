import type { PackageCustodyStatus, PackageIncidentType } from '../../types/admin';

export const INCIDENT_TYPE_LABELS: Record<PackageIncidentType, { label: string; badgeClass: string }> = {
  ameaca: { label: 'Ameaça', badgeClass: 'bg-orange-100 text-orange-900 border-orange-300' },
  extravio: { label: 'Extravio', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  fraude: { label: 'Fraude', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
  roubo_carga: { label: 'Roubo de Carga', badgeClass: 'bg-red-100 text-red-900 border-red-300 font-bold' },
  roubo: { label: 'Roubo / Assalto', badgeClass: 'bg-red-200 text-red-950 border-red-400 font-extrabold' },
  furto: { label: 'Furto', badgeClass: 'bg-orange-100 text-orange-900 border-orange-300' },
  apreensao: { label: 'Apreensão Policial', badgeClass: 'bg-[#2D3277]/10 text-[#2D3277] border-[#2D3277]/20' },
  outros: { label: 'Outros', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' }
};

export const CUSTODY_STATUS_LABELS: Record<PackageCustodyStatus, { label: string; shortLabel: string; badgeClass: string }> = {
  em_ocorrencia_delegacia: {
    label: 'Na delegacia — em ocorrência policial',
    shortLabel: 'Em Ocorrência na DP',
    badgeClass: 'bg-rose-100 text-rose-800'
  },
  aguardando_pericia: {
    label: 'Na delegacia — aguardando perícia',
    shortLabel: 'Aguardando Perícia',
    badgeClass: 'bg-amber-100 text-amber-800'
  },
  liberado_retirada: {
    label: 'Liberado pela delegacia para retirada',
    shortLabel: 'Liberado p/ Retirada',
    badgeClass: 'bg-[#3483FA]/15 text-[#2968C8]'
  },
  devolvido_empresa: {
    label: 'Devolvido / recuperado pela empresa',
    shortLabel: 'Devolvido à Empresa',
    badgeClass: 'bg-[#00A650]/15 text-[#008744]'
  },
  extraviado_nao_localizado: {
    label: 'Extraviado / não localizado',
    shortLabel: 'Não Localizado',
    badgeClass: 'bg-slate-200 text-slate-700'
  }
};
