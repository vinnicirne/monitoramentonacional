import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import type { CorporatePackageIncident } from '../../../types/admin';

export function createCorporateIncidentFeatures(incidents: CorporatePackageIncident[]): Feature[] {
  return incidents.flatMap(incident => {
    const latitude = typeof incident.lat === 'number'
      ? incident.lat
      : parseFloat(String(incident.lat || '').replace(',', '.'));
    const longitude = typeof incident.lng === 'number'
      ? incident.lng
      : parseFloat(String(incident.lng || '').replace(',', '.'));

    if (Number.isNaN(latitude) || Number.isNaN(longitude) || latitude === 0 || longitude === 0) return [];

    return [new Feature({
      geometry: new Point(fromLonLat([longitude, latitude])),
      incident,
      incidentType: incident.incidentType,
      trackingCode: incident.trackingCode,
      boNumber: incident.boNumber,
      type: 'CORPORATE_INCIDENT',
      tipo: 'CORPORATE_INCIDENT'
    })];
  });
}
