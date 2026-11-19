import type {
  AccessLog, CorporateCompany, CorporateUserLicense, FreeDomain, IncidentAuditLog,
  PlanConfig, ReferralCode, ReferralRecord, UserProfile
} from '../../types/admin';
import {
  enumField, numberField, optionalNumber, stringField, timestampField, timestampFields, type DocumentFields
} from './documentFields';

export function readUserProfile(uid: string, data: DocumentFields): UserProfile {
  return {
    uid,
    email: stringField(data.email),
    domain: stringField(data.domain),
    displayName: stringField(data.displayName),
    photoURL: stringField(data.photoURL),
    role: enumField(data.role, ['user', 'admin']) ?? 'user',
    status: enumField(data.status, ['approved', 'pending', 'blocked']) ?? 'pending',
    planId: stringField(data.planId),
    referralCode: stringField(data.referralCode),
    referredByCode: stringField(data.referredByCode),
    referredByUid: stringField(data.referredByUid),
    referredByDomain: stringField(data.referredByDomain),
    autoApprovedBy: enumField(data.autoApprovedBy, [
      'admin_bootstrap', 'free_domain', 'meli_referral', 'manual_admin',
      'pending_approval', 'corporate_license'
    ]) ?? 'pending_approval',
    licenseKey: stringField(data.licenseKey),
    companyDomain: stringField(data.companyDomain),
    licenseStatus: enumField(data.licenseStatus, ['active', 'none', 'suspended']),
    companyRole: enumField(data.companyRole, ['member', 'company_admin']),
    incidentAccess: enumField(data.incidentAccess, ['read', 'edit']),
    accessCount: numberField(data.accessCount),
    notes: stringField(data.notes),
    ...timestampFields(data),
    lastLoginAt: timestampField(data.lastLoginAt)
  };
}

export function readCompany(domain: string, data: DocumentFields): CorporateCompany {
  return {
    domain,
    companyName: stringField(data.companyName) || domain,
    planId: stringField(data.planId),
    pricePerLicense: numberField(data.pricePerLicense),
    licensedSeats: numberField(data.licensedSeats),
    autoApprove: data.autoApprove === true,
    active: data.active === true,
    ...timestampFields(data)
  };
}

export function readLicense(id: string, data: DocumentFields): CorporateUserLicense {
  return {
    id,
    email: stringField(data.email),
    displayName: stringField(data.displayName),
    companyDomain: stringField(data.companyDomain),
    planId: stringField(data.planId),
    licenseKey: stringField(data.licenseKey),
    status: enumField(data.status, ['active', 'suspended']) ?? 'suspended',
    companyRole: enumField(data.companyRole, ['member', 'company_admin']) ?? 'member',
    incidentAccess: enumField(data.incidentAccess, ['read', 'edit']),
    assignedUid: stringField(data.assignedUid),
    invitedByUid: stringField(data.invitedByUid),
    ...timestampFields(data)
  };
}

export function readPlan(id: string, data: DocumentFields): PlanConfig {
  return {
    id,
    name: stringField(data.name) || id,
    description: stringField(data.description),
    priceMonthly: numberField(data.priceMonthly),
    billingModel: enumField(data.billingModel, ['fixed', 'per_user']),
    pricePerLicense: optionalNumber(data.pricePerLicense),
    maxQueriesPerMonth: numberField(data.maxQueriesPerMonth),
    features: Array.isArray(data.features)
      ? data.features.filter((feature): feature is string => typeof feature === 'string')
      : [],
    active: data.active === true,
    ...timestampFields(data)
  };
}

export function readFreeDomain(domain: string, data: DocumentFields): FreeDomain {
  return {
    domain,
    label: stringField(data.label) || domain,
    active: data.active === true,
    autoApproveReferrals: data.autoApproveReferrals === true,
    defaultPlanId: stringField(data.defaultPlanId),
    ...timestampFields(data)
  };
}

export function readReferralCode(code: string, data: DocumentFields): ReferralCode {
  return {
    code,
    ownerUid: stringField(data.ownerUid),
    ownerName: stringField(data.ownerName),
    ownerDomain: stringField(data.ownerDomain),
    active: data.active === true,
    totalReferrals: numberField(data.totalReferrals),
    ...timestampFields(data)
  };
}

export function readReferral(id: string, data: DocumentFields): ReferralRecord {
  return {
    id,
    code: stringField(data.code),
    referrerUid: stringField(data.referrerUid),
    referrerName: stringField(data.referrerName),
    referrerDomain: stringField(data.referrerDomain),
    referredUid: stringField(data.referredUid),
    referredName: stringField(data.referredName),
    referredEmail: stringField(data.referredEmail),
    referredDomain: stringField(data.referredDomain),
    status: enumField(data.status, ['approved', 'pending', 'revoked']) ?? 'pending',
    autoApproved: data.autoApproved === true,
    commissionEnabled: data.commissionEnabled === true,
    ...timestampFields(data)
  };
}

export function readAccessLog(id: string, data: DocumentFields): AccessLog {
  return {
    id,
    uid: stringField(data.uid),
    userName: stringField(data.userName),
    userEmail: stringField(data.userEmail),
    userDomain: stringField(data.userDomain),
    targetType: stringField(data.targetType),
    targetName: stringField(data.targetName),
    uf: stringField(data.uf),
    municipio: stringField(data.municipio),
    cisp: numberField(data.cisp),
    createdAt: timestampField(data.createdAt)
  };
}

export function readIncidentAuditLog(id: string, data: DocumentFields): IncidentAuditLog {
  return {
    id,
    companyDomain: stringField(data.companyDomain),
    incidentId: stringField(data.incidentId),
    trackingCode: stringField(data.trackingCode),
    boNumber: stringField(data.boNumber),
    delegaciaName: stringField(data.delegaciaName),
    action: enumField(data.action, ['created', 'status_changed', 'station_toggled', 'history_added', 'updated', 'deleted']) ?? 'updated',
    previousStatus: stringField(data.previousStatus),
    newStatus: stringField(data.newStatus),
    previousAtStation: data.previousAtStation === true,
    newAtStation: data.newAtStation === true,
    actorUid: stringField(data.actorUid),
    actorName: stringField(data.actorName),
    actorEmail: stringField(data.actorEmail),
    summary: stringField(data.summary),
    createdAt: timestampField(data.createdAt)
  };
}
