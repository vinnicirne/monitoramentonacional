import { documentId, getDoc, orderBy, query } from 'firebase/firestore';
import { readIncidentAuditLog } from '../../../shared/firebase/adminDocuments';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import { readPage, readQueryCount, scanQuery, type FirestoreCursor } from '../../../shared/firebase/queryPages';
import { mapCorporateIncidentDocument } from '../../incidents/services/incidentMapper';

const target = 'corporate_companies/incident_audit_logs';
const pageSize = 30;

function auditQuery(domain: string) {
  return query(firestoreRefs.companyIncidentAuditLogs(domain), orderBy('createdAt', 'desc'), orderBy(documentId(), 'desc'));
}

export async function readCompanyAuditPage(domain: string, cursor: FirestoreCursor | null, signal: AbortSignal) {
  const documents = await readPage(target, auditQuery(domain), cursor, pageSize + 1);
  signal.throwIfAborted();
  return {
    rows: documents.slice(0, pageSize).map(doc => readIncidentAuditLog(doc.id, doc.data())),
    nextCursor: documents.length > pageSize ? documents[pageSize - 1] : null
  };
}

export function searchCompanyAudit(domain: string, term: string, signal: AbortSignal) {
  return scanQuery(target, auditQuery(domain), document => {
    const log = readIncidentAuditLog(document.id, document.data());
    const content = [log.trackingCode, log.actorName, log.actorEmail, log.summary, log.delegaciaName, log.action.replaceAll('_', ' ')];
    return content.join(' ').toLowerCase().includes(term) ? log : null;
  }, signal);
}

export function countCompanyAudit(domain: string) {
  return readQueryCount(target, auditQuery(domain));
}

export async function readCompanyIncident(domain: string, incidentId: string) {
  if (!incidentId || incidentId.includes('/')) return null;
  const document = await getDoc(firestoreRefs.companyIncident(domain, incidentId));
  return document.exists() ? mapCorporateIncidentDocument(document.id, document.data(), domain) : null;
}
