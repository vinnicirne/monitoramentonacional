import type { CorporatePackageIncident } from '../../../types/admin';
import { documentFields } from '../../../shared/firebase/documentFields';
import { mapCorporateIncidentDocument } from './incidentMapper';

function cacheKey(domain: string) {
  return `PMT_CORP_INCIDENTS_${domain}`;
}

export function readLocalIncidents(domain: string): CorporatePackageIncident[] {
  try {
    const raw = localStorage.getItem(cacheKey(domain));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap(value => {
      const data = documentFields(value);
      if (!data || typeof data.id !== 'string' || !data.id || data.id.includes('/')) return [];
      return [mapCorporateIncidentDocument(data.id, data, domain)];
    });
  } catch {
    return [];
  }
}

export function refreshIncidentCache(
  domain: string,
  incidentId: string,
  update: (previous: CorporatePackageIncident | undefined) => CorporatePackageIncident | undefined
) {
  try {
    const records = readLocalIncidents(domain);
    const previous = records.find(item => item.id === incidentId);
    const updated = update(previous);
    if (!previous && !updated) return;
    const remaining = records.filter(item => item.id !== incidentId);
    localStorage.setItem(cacheKey(domain), JSON.stringify(updated ? [updated, ...remaining] : remaining));
    window.dispatchEvent(new CustomEvent('pmt_incidents_updated', { detail: { domain, incident: updated } }));
  } catch (error) {
    console.warn('Não foi possível atualizar o cache local da ocorrência.', { domain, incidentId, error });
  }
}
