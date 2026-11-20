import Feature from 'ol/Feature';
import MultiPolygon from 'ol/geom/MultiPolygon';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import type VectorSource from 'ol/source/Vector';
import type { CorporatePackageIncident } from '../../../types/admin';

export interface CorporateIncidentGroup {
  areaName: string;
  incidents: CorporatePackageIncident[];
}

export function createCorporateIncidentFeatures(incidents: CorporatePackageIncident[]): Feature[] {
  return incidents.flatMap(incident => {
    const latitude = typeof incident.lat === 'number'
      ? incident.lat
      : parseFloat(String(incident.lat || '').replace(',', '.'));
    const longitude = typeof incident.lng === 'number'
      ? incident.lng
      : parseFloat(String(incident.lng || '').replace(',', '.'));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || latitude === 0 || longitude === 0) return [];

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

export function createCorporateIncidentCountMarkers(
  points: Feature[],
  cispSource: VectorSource,
  mgEsSource: VectorSource
): Feature[] {
  const markers: Feature[] = [];
  const groups = new Map<string, CorporateIncidentGroup>();

  for (const point of points) {
    const coordinate = (point.getGeometry() as Point).getCoordinates();
    const incident = point.get('incident') as CorporatePackageIncident;
    const districts = [
      ...cispSource.getFeaturesAtCoordinate(coordinate).map(feature => ({
        id: `RJ_CISP_${feature.get('cisp')}`,
        name: String(feature.get('cisp_formatado') || `${feature.get('cisp')}ª DP`),
        geometry: feature.getGeometry()
      })),
      ...mgEsSource.getFeaturesAtCoordinate(coordinate)
        .filter(feature => feature.get('type') === 'DELEGACIA_MG_ES_POLYGON')
        .map(feature => ({
          id: String(feature.get('id')),
          name: String(feature.get('delegacia').nomeCurto),
          geometry: feature.getGeometry()
        }))
    ];
    const district = districts.find(candidate => candidate.id === incident.delegaciaId)
      ?? districts.sort((first, second) => first.id.localeCompare(second.id))[0];
    if (!district) continue;

    const existing = groups.get(district.id);
    if (existing) {
      existing.incidents.push(incident);
      continue;
    }

    const group = { areaName: district.name, incidents: [incident] };
    groups.set(district.id, group);
    const geometry = district.geometry;
    const polygon = geometry instanceof MultiPolygon
      ? geometry.getPolygons().find(part => part.intersectsCoordinate(coordinate))
      : geometry instanceof Polygon ? geometry : undefined;
    const interior = polygon?.getInteriorPoint().getCoordinates().slice(0, 2);
    markers.push(new Feature({
      geometry: new Point(interior ?? coordinate),
      tipo: 'CORPORATE_INCIDENT_GROUP',
      group
    }));
  }

  return markers;
}
