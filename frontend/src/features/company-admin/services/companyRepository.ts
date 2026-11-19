import {
  serverTimestamp,
  writeBatch,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import { readCompany } from '../../../shared/firebase/adminDocuments';
import { listenToQuery } from '../../../shared/firebase/queryPages';
import type { CorporateCompany } from '../../../types/admin';

type DocumentFields = Record<string, unknown>;

export async function updateCompanyMemberLicense(input: {
  domain: string;
  licenseId: string;
  licenseExists: boolean;
  licenseFields: DocumentFields;
  user?: { uid: string; fields: DocumentFields };
}) {
  const batch = writeBatch(db);
  const licenseRef = firestoreRefs.companyLicense(input.domain, input.licenseId);
  if (input.licenseExists) {
    batch.update(licenseRef, { ...input.licenseFields, updatedAt: serverTimestamp() });
  } else {
    batch.set(licenseRef, {
      ...input.licenseFields,
      id: input.licenseId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  if (input.user) {
    batch.update(firestoreRefs.user(input.user.uid), {
      ...input.user.fields,
      updatedAt: serverTimestamp()
    });
  }
  await batch.commit();
}

export async function updateCompanyMemberIncidentAccess(input: {
  domain: string;
  licenseId: string;
  licenseFields?: DocumentFields;
  user?: { uid: string; fields: DocumentFields };
}) {
  const batch = writeBatch(db);
  if (input.licenseFields) {
    batch.update(
      firestoreRefs.companyLicense(input.domain, input.licenseId),
      { ...input.licenseFields, updatedAt: serverTimestamp() }
    );
  }
  if (input.user) {
    batch.update(firestoreRefs.user(input.user.uid), {
      ...input.user.fields,
      updatedAt: serverTimestamp()
    });
  }
  await batch.commit();
}

export async function removeCompanyMember(input: {
  domain: string;
  licenseId?: string;
  userUid?: string;
}) {
  const batch = writeBatch(db);
  if (input.licenseId) {
    batch.delete(firestoreRefs.companyLicense(input.domain, input.licenseId));
  }
  if (input.userUid) {
    batch.update(firestoreRefs.user(input.userUid), {
      companyDomain: '',
      licenseStatus: 'suspended',
      companyRole: 'member',
      incidentAccess: 'read',
      licenseKey: '',
      updatedAt: serverTimestamp()
    });
  }
  await batch.commit();
}

export function subscribeCorporateCompanies(
  onCompanies: (companies: CorporateCompany[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return listenToQuery(
    'corporate_companies',
    firestoreRefs.companies(),
    snapshot => onCompanies(snapshot.docs.map(document => readCompany(document.id, document.data()))),
    error => onError(error)
  );
}
