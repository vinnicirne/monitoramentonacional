import { deleteField, runTransaction, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { CorporatePackageIncident, IncidentAuditAction, IncidentHistoryEntry, PackageCustodyStatus } from '../../../types/admin';
import { addIncidentAuditLog } from './incidentAuditRepository';
import { mapCorporateIncidentDocument } from './incidentMapper';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';

export type IncidentDeletionStage = 'marker' | 'incident';

export interface IncidentActor {
  uid?: string;
  name?: string;
  email?: string;
}

function auditDetails(domain: string, incident: CorporatePackageIncident, actor: IncidentActor) {
  return {
    companyDomain: domain,
    incidentId: incident.id,
    trackingCode: incident.trackingCode,
    boNumber: incident.boNumber,
    delegaciaName: incident.delegaciaName,
    actorUid: actor.uid,
    actorName: actor.name,
    actorEmail: actor.email
  };
}

async function changeIncident<Fields extends Record<string, unknown>>(
  domain: string,
  id: string,
  actor: IncidentActor,
  action: IncidentAuditAction,
  summary: string | ((fields: Fields) => string),
  getFields: (previous: CorporatePackageIncident) => Fields
) {
  const reference = firestoreRefs.companyIncident(domain, id);
  return runTransaction(db, async transaction => {
    const document = await transaction.get(reference);
    if (!document.exists()) throw new Error('A ocorrência não existe mais.');
    const previous = mapCorporateIncidentDocument(document.id, document.data(), domain);
    const fields = getFields(previous);
    const updated = { ...previous, ...fields };
    transaction.update(reference, { ...fields, id, companyDomain: domain, updatedAt: serverTimestamp() });
    addIncidentAuditLog(transaction, {
      ...auditDetails(domain, updated, actor),
      action,
      summary: typeof summary === 'string' ? summary : summary(fields),
      previousStatus: previous.custodyStatus,
      newStatus: updated.custodyStatus,
      previousAtStation: previous.packageAtStation,
      newAtStation: updated.packageAtStation
    });
    return fields;
  });
}

export async function saveCorporateIncident(
  domain: string,
  incident: CorporatePackageIncident,
  isEditing: boolean,
  actor: IncidentActor
) {
  const incidentRef = firestoreRefs.companyIncident(domain, incident.id);
  const recordFields = {
    trackingCode: incident.trackingCode,
    carrierName: incident.carrierName || '',
    packageQuantity: incident.packageQuantity || 1,
    packagesDelivered: incident.packagesDelivered || 0,
    packagesRecovered: incident.packagesRecovered || 0,
    packagesStolen: incident.packagesStolen || 0,
    incidentType: incident.incidentType,
    boNumber: incident.boNumber,
    delegaciaId: incident.delegaciaId,
    delegaciaName: incident.delegaciaName,
    delegaciaUf: incident.delegaciaUf,
    delegaciaMunicipio: incident.delegaciaMunicipio,
    ...(incident.lat !== undefined ? { lat: incident.lat } : {}),
    ...(incident.lng !== undefined ? { lng: incident.lng } : {}),
    packageAtStation: incident.packageAtStation,
    custodyStatus: incident.custodyStatus,
    estimatedValue: incident.estimatedValue,
    notes: incident.notes,
    ...(incident.address !== undefined ? { address: incident.address } : {}),
    ...(incident.bairro !== undefined ? { bairro: incident.bairro } : {})
  };


  if (isEditing) {
    await changeIncident(domain, incident.id, actor, 'updated', 'Dados da ocorrência atualizados.', () => ({
      ...recordFields,
      estimatedUnitValue: deleteField()
    }));
    return;
  }

  const batch = writeBatch(db);
  batch.set(incidentRef, {
    id: incident.id,
    companyDomain: domain,
    ...recordFields,
    history: incident.history || [],
    createdByUid: incident.createdByUid,
    createdByName: incident.createdByName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  addIncidentAuditLog(batch, {
    ...auditDetails(domain, incident, actor),
    action: 'created',
    newStatus: incident.custodyStatus,
    newAtStation: incident.packageAtStation,
    summary: 'Ocorrência registrada.'
  });
  await batch.commit();
}

export function updateCorporateIncidentCustody(
  domain: string,
  incident: CorporatePackageIncident,
  nextStatus: PackageCustodyStatus,
  actor: IncidentActor
) {
  return changeIncident(domain, incident.id, actor, 'status_changed', `Status alterado para ${nextStatus}.`, () => ({
    custodyStatus: nextStatus,
    packageAtStation: nextStatus === 'em_ocorrencia_delegacia' ||
      nextStatus === 'aguardando_pericia' || nextStatus === 'liberado_retirada'
  }));
}

export function toggleCorporateIncidentStation(domain: string, incident: CorporatePackageIncident, actor: IncidentActor) {
  return changeIncident(
    domain, incident.id, actor, 'station_toggled',
    fields => `Posse na delegacia ${fields.packageAtStation ? 'confirmada' : 'removida'}.`,
    previous => ({ packageAtStation: !previous.packageAtStation })
  );
}

export async function updateCorporateIncidentHistory(
  domain: string,
  incident: CorporatePackageIncident,
  entry: IncidentHistoryEntry,
  actor: IncidentActor
) {
  const updated = await changeIncident(
    domain, incident.id, actor, 'history_added', `Andamento adicionado: ${entry.title}`,
    previous => ({ custodyStatus: entry.status, history: [entry, ...previous.history] })
  );
  return updated.history;
}

function addDeletionStage(error: unknown, stage: IncidentDeletionStage): Error & { code?: string; deletionStage: IncidentDeletionStage } {
  if (error && typeof error === 'object') {
    return Object.assign(error, { deletionStage: stage }) as Error & { code?: string; deletionStage: IncidentDeletionStage };
  }
  return Object.assign(new Error(String(error)), { deletionStage: stage });
}

export async function deleteCorporateIncident(domain: string, incidentId: string, actor: IncidentActor) {
  const incidentRef = firestoreRefs.companyIncident(domain, incidentId);
  const markerRef = firestoreRefs.companyDeletedIncident(domain, incidentId);
  try {
    await setDoc(markerRef, {
      id: incidentId,
      companyDomain: domain,
      deletedByUid: actor.uid || '',
      deletedAt: serverTimestamp()
    });
  } catch (error) {
    throw addDeletionStage(error, 'marker');
  }

  try {
    await runTransaction(db, async transaction => {
      const document = await transaction.get(incidentRef);
      if (!document.exists()) return;
      const incident = mapCorporateIncidentDocument(document.id, document.data(), domain);
      transaction.delete(incidentRef);
      addIncidentAuditLog(transaction, {
        ...auditDetails(domain, incident, actor),
        action: 'deleted',
        previousStatus: incident.custodyStatus,
        previousAtStation: incident.packageAtStation,
        summary: 'Ocorrência removida.'
      });
    });
  } catch (error) {
    throw addDeletionStage(error, 'incident');
  }
}

export function restoreLegacyCorporateIncident(domain: string, incident: CorporatePackageIncident) {
  const packageQuantity = Number(incident.packageQuantity) || 1;
  const cloudRecord = {
    id: incident.id,
    companyDomain: domain,
    trackingCode: incident.trackingCode,
    carrierName: incident.carrierName || '',
    packageQuantity,
    estimatedUnitValue: Number(incident.estimatedUnitValue) || (Number(incident.estimatedValue) || 0) / packageQuantity,
    incidentType: incident.incidentType,
    boNumber: incident.boNumber || '',
    delegaciaId: incident.delegaciaId,
    delegaciaName: incident.delegaciaName,
    delegaciaUf: incident.delegaciaUf,
    delegaciaMunicipio: incident.delegaciaMunicipio || '',
    packageAtStation: Boolean(incident.packageAtStation),
    custodyStatus: incident.custodyStatus,
    estimatedValue: Number(incident.estimatedValue) || 0,
    notes: incident.notes || '',
    ...(typeof incident.lat === 'number' ? { lat: incident.lat } : {}),
    ...(typeof incident.lng === 'number' ? { lng: incident.lng } : {}),
    ...(incident.address ? { address: incident.address } : {}),
    ...(incident.bairro ? { bairro: incident.bairro } : {}),
    history: Array.isArray(incident.history) ? incident.history : [],
    createdByUid: incident.createdByUid,
    createdByName: incident.createdByName || 'Usuário',
    // Keep the original browser-only date for reference while satisfying server timestamp rules.
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    legacyCreatedAt: String(incident.createdAt || '').slice(0, 64)
  };

  return runTransaction(db, async transaction => {
    const marker = await transaction.get(firestoreRefs.companyDeletedIncident(domain, incident.id));
    if (marker.exists()) return 'deleted' as const;

    const reference = firestoreRefs.companyIncident(domain, incident.id);
    const existing = await transaction.get(reference);
    if (existing.exists()) return 'exists' as const;

    transaction.set(reference, cloudRecord);
    addIncidentAuditLog(transaction, {
      ...auditDetails(domain, incident, { uid: incident.createdByUid, name: incident.createdByName }),
      action: 'created',
      newStatus: incident.custodyStatus,
      newAtStation: incident.packageAtStation,
      summary: 'Ocorrência recuperada do armazenamento local.'
    });
    return 'restored' as const;
  });
}
