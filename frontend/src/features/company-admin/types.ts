import type { CompanyRole, CorporateUserLicense, IncidentAccess, UserProfile } from '../../types/admin';

export interface UnifiedCompanyMember {
  key: string;
  email: string;
  displayName: string;
  license?: CorporateUserLicense;
  user?: UserProfile;
  licenseKey: string;
  licenseStatus: 'active' | 'suspended' | 'none';
  companyRole: CompanyRole;
  incidentAccess: IncidentAccess;
  accessCount: number;
  isConnected: boolean;
}

export interface DelegaciaOption {
  id: string;
  uf: 'RJ' | 'MG' | 'ES';
  name: string;
  municipio: string;
  label: string;
}
