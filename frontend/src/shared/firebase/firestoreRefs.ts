import { collection, doc } from 'firebase/firestore';
import { db } from '../../firebase';

/** Referências Firestore compartilhadas pelos repositórios e hooks de domínio. */
export const firestoreRefs = {
  users: () => collection(db, 'users'),
  user: (uid: string) => doc(db, 'users', uid),
  admins: () => collection(db, 'admins'),
  admin: (uid: string) => doc(db, 'admins', uid),
  plans: () => collection(db, 'plans'),
  plan: (planId: string) => doc(db, 'plans', planId),
  companies: () => collection(db, 'corporate_companies'),
  company: (domain: string) => doc(db, 'corporate_companies', domain),
  companyLicenses: (domain: string) => collection(db, 'corporate_companies', domain, 'licenses'),
  companyLicense: (domain: string, licenseId: string) => doc(db, 'corporate_companies', domain, 'licenses', licenseId),
  companyIncidents: (domain: string) => collection(db, 'corporate_companies', domain, 'incidents'),
  companyIncident: (domain: string, incidentId: string) => doc(db, 'corporate_companies', domain, 'incidents', incidentId),
  companyDeletedIncidents: (domain: string) => collection(db, 'corporate_companies', domain, 'deleted_incidents'),
  companyDeletedIncident: (domain: string, incidentId: string) => doc(db, 'corporate_companies', domain, 'deleted_incidents', incidentId),
  companyIncidentAuditLogs: (domain: string) => collection(db, 'corporate_companies', domain, 'incident_audit_logs'),
  companyIncidentAuditLog: (domain: string, logId: string) => doc(db, 'corporate_companies', domain, 'incident_audit_logs', logId),
  freeDomains: () => collection(db, 'free_domains'),
  freeDomain: (domain: string) => doc(db, 'free_domains', domain),
  referrals: () => collection(db, 'referrals'),
  referral: (referralId: string) => doc(db, 'referrals', referralId),
  referralCodes: () => collection(db, 'referral_codes'),
  referralCode: (code: string) => doc(db, 'referral_codes', code),
  accessLogs: () => collection(db, 'access_logs'),
  accessLog: (logId: string) => doc(db, 'access_logs', logId)
};
