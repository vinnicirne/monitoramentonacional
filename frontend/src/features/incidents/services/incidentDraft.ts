import type { PackageCustodyStatus, PackageIncidentType } from '../../../types/admin';
import { parseBrlInput } from '../../../utils/currency';

export interface IncidentDraft {
  trackingCode: string;
  carrierName: string;
  packageQuantity: string;
  packagesDelivered: string;
  packagesRecovered: string;
  packagesStolen: string;
  incidentType: PackageIncidentType;
  boNumber: string;
  estimatedUnitValue: string;
  packageAtStation: boolean;
  custodyStatus: PackageCustodyStatus;
  notes: string;
}

export interface IncidentStation {
  id: string;
  uf: string;
  name: string;
  municipio: string;
  lat?: number;
  lng?: number;
}

export function normalizeIncidentDraft(draft: IncidentDraft) {
  const packageQuantity = Math.min(100000, Math.max(1, Math.floor(Number(draft.packageQuantity) || 1)));
  const normalizeCount = (value: string) => Math.min(packageQuantity, Math.max(0, Math.floor(Number(value) || 0)));
  return {
    trackingCode: draft.trackingCode.trim().slice(0, 80),
    carrierName: draft.carrierName.trim().slice(0, 120),
    packageQuantity,
    packagesDelivered: normalizeCount(draft.packagesDelivered),
    packagesRecovered: normalizeCount(draft.packagesRecovered),
    packagesStolen: normalizeCount(draft.packagesStolen),
    incidentType: draft.incidentType,
    boNumber: draft.boNumber.trim().slice(0, 64),
    estimatedValue: parseBrlInput(draft.estimatedUnitValue),
    packageAtStation: draft.packageAtStation,
    custodyStatus: draft.custodyStatus,
    notes: draft.notes.trim().slice(0, 500)
  };
}

export function incidentStationFields(station: IncidentStation) {
  return {
    delegaciaMunicipio: station.municipio.slice(0, 100),
    delegaciaUf: (station.uf || 'RJ').slice(0, 8),
    delegaciaName: (station.name || 'Delegacia Policial').slice(0, 160),
    delegaciaId: (station.id || 'RJ_CISP_0').slice(0, 64)
  };
}

export function incidentCoordinates(uf: string, lat?: number, lng?: number) {
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lat, lng };
  }
  if (uf === 'MG') return { lat: -19.9167, lng: -43.9345 };
  if (uf === 'ES') return { lat: -20.3155, lng: -40.3128 };
  return { lat: -22.9068, lng: -43.1729 };
}

export function createIncidentId() {
  return `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
