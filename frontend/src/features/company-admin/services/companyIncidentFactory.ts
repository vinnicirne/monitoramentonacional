import type { CorporatePackageIncident, IncidentHistoryEntry } from '../../../types/admin';
import type { TerritorialRegistry } from '../../../types';
import { DELEGACIAS_MG_ES_DATA } from '../../../data/delegaciasMgEsData';
import { INCIDENT_TYPE_LABELS } from '../../incidents/incidentMetadata';
import { createIncidentId, incidentCoordinates, incidentStationFields, normalizeIncidentDraft, type IncidentDraft } from '../../incidents/services/incidentDraft';
import type { DelegaciaOption } from '../types';

type CompanyIncidentDraft = IncidentDraft & { id: string | null };

type CompanyIncidentBuildResult =
  | { incident: CorporatePackageIncident; trackingCode: string; delegationName: string }
  | { error: string };

interface BuildCompanyIncidentInput {
  draft: CompanyIncidentDraft;
  delegation?: DelegaciaOption;
  registry: TerritorialRegistry | null;
  companyDomain: string;
  actorUid: string;
  actorName: string;
}

export function buildCompanyIncidentRecord({
  draft,
  delegation,
  registry,
  companyDomain,
  actorUid,
  actorName
}: BuildCompanyIncidentInput): CompanyIncidentBuildResult {
  const fields = normalizeIncidentDraft(draft);
  if (!fields.trackingCode) return { error: 'Informe o código do pacote / rastreio.' };
  if (!delegation) return { error: 'Selecione a delegacia responsável pela ocorrência.' };
  const incidentId = draft.id || createIncidentId();

  let lat: number | undefined;
  let lng: number | undefined;
  if (delegation.id.startsWith('RJ_CISP_') && registry?.cisps) {
    const cispNumber = parseInt(delegation.id.replace('RJ_CISP_', ''), 10);
    const cisp = Object.values(registry.cisps).find(item => item.cisp === cispNumber);
    if (cisp?.centroide && cisp.centroide.length >= 2) {
      lng = cisp.centroide[0];
      lat = cisp.centroide[1];
    }
  } else {
    const station = DELEGACIAS_MG_ES_DATA.find(item => item.id === delegation.id);
    if (station?.latitude && station.longitude) {
      lat = station.latitude;
      lng = station.longitude;
    }
  }

  const station = incidentStationFields(delegation);
  const incidentTypeLabel = INCIDENT_TYPE_LABELS[draft.incidentType]?.label || draft.incidentType;
  const initialHistory: IncidentHistoryEntry[] = [{
    id: `hist_${Date.now()}`,
    date: new Date().toISOString(),
    title: `Registro de ${incidentTypeLabel}`,
    authorName: actorName,
    authorUid: actorUid,
    status: draft.custodyStatus,
    description: `Ocorrência de ${incidentTypeLabel} registrada.`
  }];

  return {
    trackingCode: fields.trackingCode,
    delegationName: station.delegaciaName,
    incident: {
      id: incidentId,
      companyDomain,
      ...fields,
      ...station,
      ...incidentCoordinates(delegation.uf, lat, lng),
      history: initialHistory,
      createdByUid: actorUid,
      createdByName: actorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
}
