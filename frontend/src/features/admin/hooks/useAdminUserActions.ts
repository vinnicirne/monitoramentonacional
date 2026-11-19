import type { AdminActionError } from './useAdminOperationFeedback';
import { setAdminCompanyMemberRole, setAdminRole, updateAdminUser } from '../services/adminRepository';
import { CompanyRole, CorporateCompany, OperationType, UserProfile, UserStatus } from '../../../types/admin';
import { emailToLicenseId, generateCorporateLicenseKey } from '../../auth/authUtils';

export function useAdminUserActions({ currentAdmin, companies, onChanged, onError }: { currentAdmin: UserProfile | null; companies: CorporateCompany[]; onChanged: () => void; onError: AdminActionError }) {
  const handleSetUserStatus = async (user: UserProfile, status: UserStatus) => {
    try {
      await updateAdminUser(user.uid, {
        status,
        autoApprovedBy: status === 'approved' ? 'manual_admin' : user.autoApprovedBy
      });
      onChanged();
    } catch (err) {
      onError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSetUserPlan = async (user: UserProfile, planId: string) => {
    try {
      await updateAdminUser(user.uid, { planId });
      onChanged();
    } catch (err) {
      onError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleToggleUserAdmin = async (user: UserProfile) => {
    if (user.uid === currentAdmin?.uid) return;
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await setAdminRole(user.uid, user.email, nextRole === 'admin');
      onChanged();
    } catch (err) {
      onError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAssignUserLicense = async (
    user: UserProfile,
    targetDomain?: string,
    targetPlanId?: string
  ) => {
    const compDom = (targetDomain || user.companyDomain || user.domain || '').toLowerCase();
    const matchedComp = companies.find(c => c.domain.toLowerCase() === compDom);
    const planToApply = targetPlanId || matchedComp?.planId || 'corp_licenca';
    const nextKey =
      user.licenseKey && user.licenseKey.length >= 4
        ? user.licenseKey
        : generateCorporateLicenseKey(compDom, user.uid);

    try {
      await updateAdminUser(user.uid, {
        status: 'approved',
        autoApprovedBy: 'corporate_license',
        planId: planToApply,
        companyDomain: compDom,
        licenseStatus: 'active',
        licenseKey: nextKey
      });
      onChanged();
    } catch (err) {
      onError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSuspendUserLicense = async (user: UserProfile) => {
    try {
      await updateAdminUser(user.uid, {
        licenseStatus: 'suspended',
        status: user.role === 'admin' ? user.status : 'blocked'
      });
      onChanged();
    } catch (err) {
      onError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleToggleCompanyAdminRole = async (user: UserProfile, comp: CorporateCompany) => {
    if (!currentAdmin || user.uid === currentAdmin.uid) return;
    const nextRole: CompanyRole =
      user.companyRole === 'company_admin' ? 'member' : 'company_admin';
    const licId = emailToLicenseId(user.email);
    const nextKey =
      user.licenseKey && user.licenseKey.length >= 4
        ? user.licenseKey
        : generateCorporateLicenseKey(comp.domain, user.uid);

    try {
      await setAdminCompanyMemberRole(user.uid, comp.domain, licId, {
        companyRole: nextRole,
        companyDomain: comp.domain,
        status: 'approved',
        licenseStatus: user.licenseStatus === 'suspended' ? 'suspended' : 'active',
        licenseKey: nextKey
      }, {
          email: user.email.toLowerCase(),
          displayName: user.displayName,
          companyDomain: comp.domain,
          planId: comp.planId || user.planId || 'corp_licenca',
          licenseKey: nextKey,
          status: user.licenseStatus === 'suspended' ? 'suspended' : 'active',
          companyRole: nextRole,
          assignedUid: user.uid,
          invitedByUid: currentAdmin.uid
      });
      onChanged();
    } catch (err) {
      onError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return {
    handleSetUserStatus,
    handleSetUserPlan,
    handleToggleUserAdmin,
    handleAssignUserLicense,
    handleSuspendUserLicense,
    handleToggleCompanyAdminRole
  };
}
