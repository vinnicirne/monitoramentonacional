import { useEffect, useState } from 'react';
import type { CorporateCompany } from '../../../types/admin';
import { subscribeCorporateCompanies } from '../services/companyRepository';

const EMPTY_COMPANIES: CorporateCompany[] = [];

export function useCorporateCompanyDirectory(enabled: boolean) {
  const [companies, setCompanies] = useState<CorporateCompany[] | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCompanies(null);
      return;
    }

    return subscribeCorporateCompanies(
      setCompanies,
      error => {
        console.warn('Não foi possível carregar corporate_companies:', error);
        setCompanies(EMPTY_COMPANIES);
      }
    );
  }, [enabled]);

  return { companies: enabled ? companies ?? EMPTY_COMPANIES : EMPTY_COMPANIES, loaded: enabled && companies !== null };
}
