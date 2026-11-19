import {
  deleteDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { readPlan, readUserProfile } from '../../../shared/firebase/adminDocuments';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import type { ReferralRecord } from '../../../types/admin';

type DocumentFields = Record<string, unknown>;

export async function getActiveAdminPlans() {
  const snapshot = await getDocs(firestoreRefs.plans());
  return snapshot.docs.map(document => readPlan(document.id, document.data())).filter(plan => plan.active);
}

export const updateAdminUser = (uid: string, fields: DocumentFields) =>
  updateDoc(firestoreRefs.user(uid), { ...fields, updatedAt: serverTimestamp() });

export const updateFreeDomain = (domain: string, fields: DocumentFields) =>
  updateDoc(firestoreRefs.freeDomain(domain), { ...fields, updatedAt: serverTimestamp() });

export const createFreeDomain = (domain: string, fields: DocumentFields) =>
  setDoc(firestoreRefs.freeDomain(domain), {
    ...fields,
    domain,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

export const deleteFreeDomain = (domain: string) => deleteDoc(firestoreRefs.freeDomain(domain));

export const updateAdminCompany = (domain: string, fields: DocumentFields) =>
  updateDoc(firestoreRefs.company(domain), { ...fields, updatedAt: serverTimestamp() });

export const createAdminCompany = (domain: string, fields: DocumentFields) =>
  setDoc(firestoreRefs.company(domain), {
    ...fields,
    domain,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

export const deleteAdminCompany = (domain: string) => deleteDoc(firestoreRefs.company(domain));

export const updatePlan = (planId: string, fields: DocumentFields) =>
  updateDoc(firestoreRefs.plan(planId), { ...fields, updatedAt: serverTimestamp() });

export const createPlan = (planId: string, fields: DocumentFields) =>
  setDoc(firestoreRefs.plan(planId), {
    ...fields,
    id: planId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

export function setReferralStatus(referral: ReferralRecord, status: ReferralRecord['status']) {
  return runTransaction(db, async transaction => {
    const referralRef = firestoreRefs.referral(referral.id);
    const snapshot = await transaction.get(referralRef);
    if (!snapshot.exists()) throw new Error('A indicação não existe mais.');
    const referredUid = snapshot.data().referredUid;
    const userRef = typeof referredUid === 'string' && /^[a-zA-Z0-9_-]+$/.test(referredUid)
      ? firestoreRefs.user(referredUid)
      : null;
    const document = userRef ? await transaction.get(userRef) : null;
    transaction.update(referralRef, { status, updatedAt: serverTimestamp() });
    if (!document?.exists()) return;
    const user = readUserProfile(document.id, document.data());
    if (user.role === 'admin') return;
    transaction.update(userRef, {
      status: status === 'approved' ? 'approved' : status === 'revoked' ? 'blocked' : 'pending',
      ...(status === 'approved' ? { autoApprovedBy: 'manual_admin' } : {}),
      updatedAt: serverTimestamp()
    });
  });
}

export function setAdminCompanyMemberRole(
  uid: string,
  domain: string,
  licenseId: string,
  userFields: DocumentFields,
  licenseFields: DocumentFields
) {
  const licenseRef = firestoreRefs.companyLicense(domain, licenseId);
  return runTransaction(db, async transaction => {
    const existing = await transaction.get(licenseRef);
    transaction.update(firestoreRefs.user(uid), { ...userFields, updatedAt: serverTimestamp() });
    if (existing.exists()) {
      transaction.update(licenseRef, { ...licenseFields, updatedAt: serverTimestamp() });
      return;
    }
    transaction.set(licenseRef, {
      ...licenseFields, id: licenseId, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
  });
}

export async function setAdminRole(uid: string, email: string, enabled: boolean) {
  const batch = writeBatch(db);
  batch.update(firestoreRefs.user(uid), { role: enabled ? 'admin' : 'user', updatedAt: serverTimestamp() });
  const adminRef = firestoreRefs.admin(uid);
  if (enabled) batch.set(adminRef, { uid, email, createdAt: serverTimestamp() });
  else batch.delete(adminRef);
  await batch.commit();
}
