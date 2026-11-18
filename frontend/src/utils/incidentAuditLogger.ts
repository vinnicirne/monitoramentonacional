import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../firebase';
import { IncidentAuditAction, OperationType } from '../types/admin';

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

export async function recordIncidentAuditLog(params: RecordIncidentAuditParams): Promise<void> {
  const domain = (params.companyDomain || '').trim().toLowerCase();
  if (!domain) return;

  const fbUser = auth.currentUser;
  const actorUid = (fbUser?.uid || params.actorUid || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const actorEmail = (fbUser?.email || params.actorEmail || '').trim().toLowerCase().slice(0, 160);
  if (!actorUid || !actorEmail) return;

  const logId = `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const safeIncidentId = (params.incidentId || 'inc_unknown').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const safeTracking = (params.trackingCode || 'SEM-CODIGO').trim().slice(0, 80);
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
    incidentId: safeIncidentId,
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

  try {
    await setDoc(doc(db, 'corporate_companies', domain, 'incident_audit_logs', logId), payload);
  } catch (err) {
    try {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `corporate_companies/${domain}/incident_audit_logs/${logId}`
      );
    } catch (formattedError) {
      console.error('Não foi possível gravar log de auditoria da ocorrência:', formattedError);
    }
  }
}
