import { serverTimestamp, type DocumentData, type DocumentReference } from 'firebase/firestore';
import { auth } from '../../../firebase';
import type { IncidentAuditAction } from '../../../types/admin';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';

export interface RecordIncidentAuditParams {
  companyDomain: string;
  incidentId: string;
  trackingCode: string;
  boNumber?: string;
  delegaciaName?: string;
  action: IncidentAuditAction;
  previousStatus?: string;
  newStatus?: string;
  previousAtStation?: boolean;
  newAtStation?: boolean;
  actorUid?: string;
  actorName?: string;
  actorEmail?: string;
  summary: string;
}

export function addIncidentAuditLog(
  write: { set(reference: DocumentReference<DocumentData>, data: DocumentData): unknown },
  params: RecordIncidentAuditParams
) {
  const domain = params.companyDomain;
  const fbUser = auth.currentUser;
  const actorUid = (fbUser?.uid || params.actorUid || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const actorEmail = (fbUser?.email || params.actorEmail || '').trim().toLowerCase().slice(0, 160);
  if (!actorUid || !actorEmail) throw new Error('Sessão inválida para registrar a auditoria da ocorrência.');

  const logId = `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const safeTracking = params.trackingCode.trim().slice(0, 80) || 'SEM-CODIGO';
  const safeBo = (params.boNumber || '').trim().slice(0, 64);
  const safeDelegacia = (params.delegaciaName || '').trim().slice(0, 160);
  const safeActorName = (
    fbUser?.displayName ||
    params.actorName ||
    actorEmail.split('@')[0] ||
    'Usuário'
  )
    .trim()
    .slice(0, 120);

  const payload = {
    id: logId,
    companyDomain: domain,
    incidentId: params.incidentId,
    trackingCode: safeTracking,
    boNumber: safeBo,
    delegaciaName: safeDelegacia,
    action: params.action,
    previousStatus: (params.previousStatus || '').slice(0, 64),
    newStatus: (params.newStatus || '').slice(0, 64),
    previousAtStation: Boolean(params.previousAtStation),
    newAtStation: Boolean(params.newAtStation),
    actorUid,
    actorName: safeActorName,
    actorEmail,
    summary: (params.summary || 'Alteração registrada.').trim().slice(0, 500),
    createdAt: serverTimestamp()
  };

  write.set(firestoreRefs.companyIncidentAuditLog(domain, logId), payload);
}
