import { useCallback, useEffect, useState } from 'react';
import { documentId, limit, orderBy, query } from 'firebase/firestore';
import { reportFirestoreError } from '../../../firebase';
import { readAccessLog, readCompany, readFreeDomain, readPlan } from '../../../shared/firebase/adminDocuments';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import { listenToQuery } from '../../../shared/firebase/queryPages';
import {
  OperationType, type AccessLog, type CorporateCompany, type CorporatePackageIncident,
  type FreeDomain, type PlanConfig, type UserProfile
} from '../../../types/admin';
import { mapCorporateIncidentDocument } from '../../incidents/services/incidentMapper';
import { countReferrals } from '../services/adminReferralQueries';
import { countAdminUsers, countPendingAdminUsers, readActiveLicensesForSummary } from '../services/adminUserQueries';

export type AdminSubTab = 'overview' | 'analytics' | 'users' | 'companies' | 'plans' | 'domains' | 'referrals';

export function useAdminDashboardData(subTab: AdminSubTab, refreshVersion: number) {
  const overview = subTab === 'overview';
  const needsReferralData = overview || subTab === 'referrals';
  const needsReferralCodes = subTab === 'referrals';
  const needsPlans = subTab === 'users' || subTab === 'companies' || subTab === 'plans' || subTab === 'domains';
  const needsDomains = overview || subTab === 'domains';
  const needsLicenseSummary = overview || subTab === 'companies';
  const [activeLicenseUsers, setActiveLicenseUsers] = useState<UserProfile[]>([]);
  const [userCounts, setUserCounts] = useState<Awaited<ReturnType<typeof countAdminUsers>>>();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [companies, setCompanies] = useState<CorporateCompany[]>([]);
  const [incidentsByCompany, setIncidentsByCompany] = useState<Record<string, CorporatePackageIncident[]>>({});
  const [domains, setDomains] = useState<FreeDomain[]>([]);
  const [referralStats, setReferralStats] = useState<Awaited<ReturnType<typeof countReferrals>>>();
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const onError = useCallback((path: string) => (error: unknown) => {
    reportFirestoreError(error, OperationType.LIST, path);
    setLoadError('Parte dos dados administrativos não pôde ser carregada.');
  }, []);

  useEffect(() => listenToQuery('corporate_companies', firestoreRefs.companies(), snapshot => {
    setCompanies(snapshot.docs.map(document => readCompany(document.id, document.data())));
  }, onError('corporate_companies')), [onError]);

  useEffect(() => {
    if (!needsPlans) return;
    return listenToQuery('plans', firestoreRefs.plans(), snapshot => {
      setPlans(snapshot.docs.map(document => readPlan(document.id, document.data())));
    }, onError('plans'));
  }, [needsPlans, onError]);

  useEffect(() => {
    if (!needsDomains) return;
    return listenToQuery('free_domains', firestoreRefs.freeDomains(), snapshot => {
      setDomains(snapshot.docs.map(document => readFreeDomain(document.id, document.data())));
    }, onError('free_domains'));
  }, [needsDomains, onError]);

  useEffect(() => {
    if (!needsReferralData) return;
    let active = true;
    countReferrals(needsReferralCodes).then(
      stats => { if (active) setReferralStats(stats); },
      error => { if (active) onError('referrals')(error); }
    );
    return () => { active = false; };
  }, [needsReferralData, needsReferralCodes, refreshVersion, onError]);

  useEffect(() => {
    if (!overview) return;
    return listenToQuery('access_logs', query(firestoreRefs.accessLogs(), orderBy('createdAt', 'desc'), orderBy(documentId(), 'desc'), limit(120)), snapshot => {
      setAccessLogs(snapshot.docs.map(document => readAccessLog(document.id, document.data())));
    }, onError('access_logs'));
  }, [overview, onError]);

  useEffect(() => {
    if (!needsLicenseSummary) return;
    const request = new AbortController();
    readActiveLicensesForSummary(request.signal).then(
      users => { if (!request.signal.aborted) setActiveLicenseUsers(users); },
      error => { if (!request.signal.aborted) onError('users')(error); }
    );
    return () => request.abort();
  }, [needsLicenseSummary, refreshVersion, onError]);

  useEffect(() => {
    if (!overview) return;
    let active = true;
    countAdminUsers().then(
      counts => { if (active) setUserCounts(counts); },
      error => { if (active) onError('users')(error); }
    );
    return () => { active = false; };
  }, [overview, refreshVersion, onError]);

  useEffect(() => {
    let active = true;
    countPendingAdminUsers().then(
      count => { if (active) setPendingCount(count); },
      error => { if (active) onError('users')(error); }
    );
    return () => { active = false; };
  }, [subTab, refreshVersion, onError]);

  const analyticsDomains = JSON.stringify(subTab === 'analytics'
    ? companies.filter(company => company.active).map(company => company.domain).sort()
    : []);
  useEffect(() => {
    const activeDomains: string[] = JSON.parse(analyticsDomains);
    const stop = activeDomains.map(domain => listenToQuery(
      'corporate_companies/incidents',
      firestoreRefs.companyIncidents(domain),
      snapshot => setIncidentsByCompany(previous => ({
        ...previous,
        [domain]: snapshot.docs.map(document => mapCorporateIncidentDocument(document.id, document.data(), domain))
      })),
      onError(`corporate_companies/${domain}/incidents`)
    ));
    return () => stop.forEach(unsubscribe => unsubscribe());
  }, [analyticsDomains, onError]);

  return {
    activeLicenseUsers,
    userCounts,
    pendingCount,
    plans,
    companies,
    incidentsByCompany: Object.fromEntries(
      Object.entries(incidentsByCompany).filter(([domain]) => subTab === 'analytics' && companies.some(c => c.active && c.domain === domain))
    ),
    domains,
    referralStats,
    accessLogs,
    loadError
  };
}
