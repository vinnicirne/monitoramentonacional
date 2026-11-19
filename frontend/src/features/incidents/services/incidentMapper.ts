import type { CorporatePackageIncident, IncidentHistoryEntry } from '../../../types/admin';
import { documentFields, enumField, numberField, optionalNumber, stringField, timestampFields, type DocumentFields } from '../../../shared/firebase/documentFields';

const incidentTypes = ['ameaca', 'roubo_carga', 'roubo', 'furto', 'extravio', 'fraude', 'apreensao', 'outros'] as const;
const custodyStatuses = ['em_ocorrencia_delegacia', 'aguardando_pericia', 'liberado_retirada', 'devolvido_empresa', 'extraviado_nao_localizado'] as const;

function readHistory(value: unknown): IncidentHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    const data = documentFields(item);
    if (!data || typeof data.id !== 'string') return [];
    return [{
      id: data.id,
      date: stringField(data.date),
      status: enumField(data.status, custodyStatuses) ?? 'em_ocorrencia_delegacia',
      title: stringField(data.title),
      description: stringField(data.description),
      authorName: stringField(data.authorName),
      authorUid: stringField(data.authorUid),
      ...(data.createdAt !== undefined ? { createdAt: data.createdAt } : {})
    }];
  });
}

export function mapCorporateIncidentDocument(
  documentId: string,
  data: DocumentFields,
  companyDomain: string
): CorporatePackageIncident {
  const packageQuantity = Math.max(1, numberField(data.packageQuantity, 1));
  const estimatedUnitValue = optionalNumber(data.estimatedUnitValue);
  return {
    id: documentId,
    companyDomain,
    trackingCode: stringField(data.trackingCode),
    carrierName: stringField(data.carrierName),
    packageQuantity,
    packagesDelivered: numberField(data.packagesDelivered),
    packagesRecovered: numberField(data.packagesRecovered),
    packagesStolen: numberField(data.packagesStolen),
    estimatedUnitValue,
    incidentType: enumField(data.incidentType, incidentTypes) ?? 'outros',
    boNumber: stringField(data.boNumber),
    delegaciaId: stringField(data.delegaciaId),
    delegaciaName: stringField(data.delegaciaName),
    delegaciaUf: stringField(data.delegaciaUf),
    delegaciaMunicipio: stringField(data.delegaciaMunicipio),
    packageAtStation: data.packageAtStation === true,
    custodyStatus: enumField(data.custodyStatus, custodyStatuses) ?? 'em_ocorrencia_delegacia',
    estimatedValue: numberField(data.estimatedValue, (estimatedUnitValue ?? 0) * packageQuantity),
    notes: stringField(data.notes),
    lat: optionalNumber(data.lat),
    lng: optionalNumber(data.lng),
    address: typeof data.address === 'string' ? data.address : undefined,
    bairro: typeof data.bairro === 'string' ? data.bairro : undefined,
    history: readHistory(data.history),
    createdByUid: stringField(data.createdByUid),
    createdByName: stringField(data.createdByName),
    ...timestampFields(data),
    legacyCreatedAt: typeof data.legacyCreatedAt === 'string' ? data.legacyCreatedAt : undefined
  };
}
