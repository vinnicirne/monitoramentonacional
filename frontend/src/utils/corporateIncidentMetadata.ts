import { PackageCustodyStatus, PackageIncidentType } from '../types/admin';

export const INCIDENT_TYPE_META: Record<
  PackageIncidentType,
  { label: string; badgeClass: string; isRoubo: boolean; description: string }
> = {
  roubo_carga: {
    label: 'Roubo de Carga',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    isRoubo: true,
    description: 'Subtração de veículo ou mercadoria mediante violência ou grave ameaça.'
  },
  roubo: {
    label: 'Roubo / Assalto',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    isRoubo: true,
    description: 'Assalto à mão armada, abordagem a entregador ou motorista.'
  },
  furto: {
    label: 'Furto',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    isRoubo: false,
    description: 'Subtração de carga ou pertence sem violência física direta.'
  },
  fraude: {
    label: 'Fraude / Golpe',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    isRoubo: false,
    description: 'Apropriação indébita, documento falso, entrega desviada ou estelionato.'
  },
  extravio: {
    label: 'Extravio de Carga/Pacote',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    isRoubo: false,
    description: 'Pacote não localizado no fluxo operacional de transporte ou transferência.'
  },
  apreensao: {
    label: 'Apreensão Policial',
    badgeClass: 'bg-[#2D3277]/10 text-[#2D3277] border-[#2D3277]/20',
    isRoubo: false,
    description: 'Carga ou veículo retido por autoridade policial para averiguação ou perícia.'
  },
  outros: {
    label: 'Outros Incidentes',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    isRoubo: false,
    description: 'Outras ocorrências operacionais relevantes para a empresa.'
  }
};

export const CUSTODY_LABELS: Record<PackageCustodyStatus, { label: string; short: string; badge: string }> = {
  em_ocorrencia_delegacia: {
    label: 'Na delegacia — em ocorrência policial',
    short: 'Em Ocorrência na DP',
    badge: 'bg-rose-100 text-rose-800'
  },
  aguardando_pericia: {
    label: 'Na delegacia — aguardando perícia',
    short: 'Aguardando Perícia',
    badge: 'bg-amber-100 text-amber-800'
  },
  liberado_retirada: {
    label: 'Liberado pela delegacia para retirada',
    short: 'Liberado p/ Retirada',
    badge: 'bg-[#3483FA]/15 text-[#2968C8]'
  },
  devolvido_empresa: {
    label: 'Devolvido / recuperado pela empresa',
    short: 'Devolvido à Empresa',
    badge: 'bg-[#00A650]/15 text-[#008744]'
  },
  extraviado_nao_localizado: {
    label: 'Extraviado / não localizado',
    short: 'Não Localizado',
    badge: 'bg-slate-200 text-slate-700'
  }
};
