import { useEffect, useState } from 'react';
import { or, query, where } from 'firebase/firestore';
import { reportFirestoreError } from '../../../firebase';
import { readUserProfile } from '../../../shared/firebase/adminDocuments';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import { listenToQuery } from '../../../shared/firebase/queryPages';
import { OperationType, type CorporateCompany, type UserProfile } from '../../../types/admin';

export function useAdminCompanyMembers(companies: CorporateCompany[]) {
  const key = JSON.stringify(companies.map(company => company.domain).sort());
  const [result, setResult] = useState<{ key: string; byDomain: Record<string, UserProfile[]>; error?: boolean }>();

  useEffect(() => {
    const domains: string[] = JSON.parse(key);
    if (!domains.length) return;
    const wantedDomains = new Set(domains);
    const source = query(firestoreRefs.users(), or(
      where('companyDomain', 'in', domains),
      where('domain', 'in', domains)
    ));
    return listenToQuery('users', source, snapshot => {
      const byDomain = Object.create(null) as Record<string, UserProfile[]>;
      snapshot.docs.forEach(document => {
        const user = readUserProfile(document.id, document.data());
        const domain = (user.companyDomain || user.domain).toLowerCase();
        if (wantedDomains.has(domain)) (byDomain[domain] ??= []).push(user);
      });
      setResult({ key, byDomain });
    }, error => {
      reportFirestoreError(error, OperationType.LIST, 'users');
      setResult({ key, byDomain: {}, error: true });
    });
  }, [key]);

  return {
    byDomain: result?.key === key ? result.byDomain : {},
    loading: companies.length > 0 && result?.key !== key,
    error: result?.key === key && result.error
  };
}
