export type UserRole = 'user' | 'admin';
export type UserStatus = 'approved' | 'pending' | 'blocked';
export type LicenseStatus = 'active' | 'none' | 'suspended';
export type CompanyRole = 'member' | 'company_admin';
export type IncidentAccess = 'read' | 'edit';
export type PlanBillingModel = 'fixed' | 'per_user';
export type AutoApprovalSource =
  | 'admin_bootstrap'
  | 'free_domain'
  | 'meli_referral'
  | 'manual_admin'
  | 'pending_approval'
  | 'corporate_license';

export interface UserProfile {
  uid: string;
  email: string;
  domain: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  status: UserStatus;
  planId: string;
  referralCode: string;
  referredByCode: string;
  referredByUid: string;
  referredByDomain: string;
  autoApprovedBy: AutoApprovalSource;
  licenseKey?: string;
  companyDomain?: string;
  licenseStatus?: LicenseStatus;
  companyRole?: CompanyRole;
  incidentAccess?: IncidentAccess;
  accessCount: number;
  notes: string;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
}

export interface ReferralCode {
  code: string;
  ownerUid: string;
  ownerName: string;
  ownerDomain: string;
  active: boolean;
  totalReferrals: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface ReferralRecord {
  id: string;
  code: string;
  referrerUid: string;
  referrerName: string;
  referrerDomain: string;
  referredUid: string;
  referredName: string;
  referredEmail: string;
  referredDomain: string;
  status: 'approved' | 'pending' | 'revoked';
  autoApproved: boolean;
  commissionEnabled: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface FreeDomain {
  domain: string;
  label: string;
  active: boolean;
  autoApproveReferrals: boolean;
  defaultPlanId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CorporateCompany {
  domain: string;
  companyName: string;
  planId: string;
  pricePerLicense: number;
  licensedSeats: number;
  autoApprove: boolean;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CorporateUserLicense {
  id: string;
  email: string;
  displayName: string;
  companyDomain: string;
  planId: string;
  licenseKey: string;
  status: 'active' | 'suspended';
  companyRole: CompanyRole;
  incidentAccess?: IncidentAccess;
  assignedUid: string;
  invitedByUid: string;
  createdAt?: any;
  updatedAt?: any;
}

export type PackageIncidentType =
  | 'ameaca'
  | 'roubo_carga'
  | 'roubo'
  | 'furto'
  | 'extravio'
  | 'fraude'
  | 'apreensao'
  | 'outros';

export type PackageCustodyStatus =
  | 'em_ocorrencia_delegacia'
  | 'aguardando_pericia'
  | 'liberado_retirada'
  | 'devolvido_empresa'
  | 'extraviado_nao_localizado';

export interface IncidentHistoryEntry {
  id: string;
  date: string;
  status: PackageCustodyStatus;
  title: string;
  description: string;
  authorName: string;
  authorUid: string;
  createdAt?: any;
}

export interface CorporatePackageIncident {
  id: string;
  companyDomain: string;
  trackingCode: string;
  incidentType: PackageIncidentType;
  boNumber: string;
  delegaciaId: string;
  delegaciaName: string;
  delegaciaUf: string;
  delegaciaMunicipio: string;
  packageAtStation: boolean;
  custodyStatus: PackageCustodyStatus;
  estimatedValue: number;
  notes: string;
  lat?: number;
  lng?: number;
  address?: string;
  bairro?: string;
  history?: IncidentHistoryEntry[];
  createdByUid: string;
  createdByName: string;
  createdAt?: any;
  updatedAt?: any;
  legacyCreatedAt?: string;
}

export type IncidentAuditAction = 'created' | 'status_changed' | 'station_toggled' | 'history_added' | 'updated' | 'deleted';

export interface IncidentAuditLog {
  id: string;
  companyDomain: string;
  incidentId: string;
  trackingCode: string;
  boNumber: string;
  delegaciaName: string;
  action: IncidentAuditAction;
  previousStatus: string;
  newStatus: string;
  previousAtStation: boolean;
  newAtStation: boolean;
  actorUid: string;
  actorName: string;
  actorEmail: string;
  summary: string;
  createdAt?: any;
}

export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  billingModel?: PlanBillingModel;
  pricePerLicense?: number;
  maxQueriesPerMonth: number;
  features: string[];
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface AccessLog {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  userDomain: string;
  targetType: string;
  targetName: string;
  uf: string;
  municipio: string;
  cisp: number;
  createdAt?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
