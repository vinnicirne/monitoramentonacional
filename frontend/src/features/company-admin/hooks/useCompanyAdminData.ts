import { useEffect, useState } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { reportFirestoreError } from '../../../firebase';
import { readCompany, readLicense, readUserProfile } from '../../../shared/firebase/adminDocuments';
import { timestampMillis } from '../../../shared/firebase/documentFields';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import { listenToQuery } from '../../../shared/firebase/queryPages';
import { OperationType, type CorporateCompany, type CorporatePackageIncident, type CorporateUserLicense, type UserProfile } from '../../../types/admin';
import { mapCorporateIncidentDocument } from '../../incidents/services/incidentMapper';
import { countCompanyAudit } from '../services/companyAuditQueries';

interface CompanyDirectory {
  company: CorporateCompany | null;
  licenses: CorporateUserLicense[];
  companyUsers: UserProfile[];
}

const emptyDirectory: CompanyDirectory = { company: null, licenses: [], companyUsers: [] };
const emptyIncidents: CorporatePackageIncident[] = [];
type CompanyPanelSubTab = 'users' | 'incidents' | 'carriers' | 'audit' | 'drivers' | 'network' | 'sos_history';

export function useCompanyAdminData(activeDomain: string, canReadAudit: boolean, subTab: CompanyPanelSubTab) {
  const needsIncidents = subTab === 'incidents' || subTab === 'carriers';
  const needsAudit = canReadAudit && subTab === 'audit';
  const [directory, setDirectory] = useState<{ domain: string; data: CompanyDirectory; error?: boolean }>();
  const [incidentFeed, setIncidentFeed] = useState<{ domain: string; rows: CorporatePackageIncident[]; error?: boolean }>();
  const [auditCount, setAuditCount] = useState<{ domain: string; count: number }>();

  useEffect(() => {
    if (!activeDomain) return;
    let subscribed = true;
    const companyPath = `corporate_companies/${activeDomain}`;
    const update = (fields: Partial<CompanyDirectory>, error = false) => {
      if (!subscribed) return;
      setDirectory(previous => {
        const current = previous?.domain === activeDomain ? previous : null;
        return { domain: activeDomain, data: { ...(current?.data ?? emptyDirectory), ...fields }, error: error || current?.error };
      });
    };
    const failure = (path: string, operation: OperationType) => (error: Error) => {
      reportFirestoreError(error, operation, path);
      update({}, true);
    };
    const stop = [
      onSnapshot(firestoreRefs.company(activeDomain), document => update({
        company: document.exists() ? readCompany(document.id, document.data()) : null
      }), failure(companyPath, OperationType.GET)),
      listenToQuery('corporate_companies/licenses', firestoreRefs.companyLicenses(activeDomain), snapshot => update({
        licenses: snapshot.docs.map(document => readLicense(document.id, document.data()))
      }), failure(`${companyPath}/licenses`, OperationType.LIST)),
      listenToQuery('users', query(firestoreRefs.users(), where('companyDomain', '==', activeDomain)), snapshot => update({
        companyUsers: snapshot.docs.map(document => readUserProfile(document.id, document.data()))
      }), failure('users', OperationType.LIST))
    ];
    return () => {
      subscribed = false;
      stop.forEach(unsubscribe => unsubscribe());
    };
  }, [activeDomain]);

  useEffect(() => {
    if (!activeDomain || !needsIncidents) return;
    return listenToQuery('corporate_companies/incidents', firestoreRefs.companyIncidents(activeDomain), snapshot => {
      const rows = snapshot.docs
        .map(document => mapCorporateIncidentDocument(document.id, document.data(), activeDomain))
        .sort((left, right) => timestampMillis(right.createdAt) - timestampMillis(left.createdAt));
      setIncidentFeed({ domain: activeDomain, rows });
    }, error => {
      reportFirestoreError(error, OperationType.LIST, `corporate_companies/${activeDomain}/incidents`);
      setIncidentFeed({ domain: activeDomain, rows: emptyIncidents, error: true });
    });
  }, [activeDomain, needsIncidents]);

  useEffect(() => {
    if (!activeDomain || !needsAudit) return;
    let subscribed = true;
    countCompanyAudit(activeDomain).then(count => {
      if (subscribed) setAuditCount({ domain: activeDomain, count });
    }).catch(error => reportFirestoreError(error, OperationType.LIST, `corporate_companies/${activeDomain}/incident_audit_logs`));
    return () => { subscribed = false; };
  }, [activeDomain, needsAudit]);

  const currentDirectory = directory?.domain === activeDomain ? directory : null;
  const currentIncidents = needsIncidents && incidentFeed?.domain === activeDomain ? incidentFeed : null;
  return {
    ...(currentDirectory?.data ?? emptyDirectory),
    incidents: currentIncidents?.rows ?? emptyIncidents,
    auditCount: needsAudit && auditCount?.domain === activeDomain ? auditCount.count : null,
    loadError: Boolean(currentDirectory?.error || currentIncidents?.error),
    removeIncident: (incidentId: string) => setIncidentFeed(current => current?.domain === activeDomain
      ? { ...current, rows: current.rows.filter(incident => incident.id !== incidentId) }
      : current)
  };
}
