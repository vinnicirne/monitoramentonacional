import React, { useMemo, useState } from 'react';
import { reportFirestoreError } from '../../../firebase';
import type { UnifiedCompanyMember } from '../types';
import { removeCompanyMember, updateCompanyMemberIncidentAccess, updateCompanyMemberLicense } from '../services/companyRepository';
import { CompanyRole, CorporateCompany, CorporateUserLicense, IncidentAccess, OperationType, UserProfile } from '../../../types/admin';
import { emailToLicenseId, generateCorporateLicenseKey } from '../../auth/authUtils';

export function useCompanyMembers({ activeDomain, currentAdmin, company, licenses, companyUsers }: { activeDomain: string; currentAdmin: UserProfile | null; company: CorporateCompany | null; licenses: CorporateUserLicense[]; companyUsers: UserProfile[] }) {
  // User/License Form state
  const [empName, setEmpName] = useState('');
  const [empEmailUser, setEmpEmailUser] = useState('');
  const [empRole, setEmpRole] = useState<CompanyRole>('member');
  const [empIncidentAccess, setEmpIncidentAccess] = useState<IncidentAccess>('read');
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Unified Members List
  const allMembers = useMemo<UnifiedCompanyMember[]>(() => {
    const map = new Map<string, UnifiedCompanyMember>();

    licenses.forEach(lic => {
      const emailLower = lic.email.toLowerCase();
      map.set(emailLower, {
        key: emailLower,
        email: lic.email,
        displayName: lic.displayName,
        license: lic,
        licenseKey: lic.licenseKey,
        licenseStatus: lic.status,
        companyRole: lic.companyRole || 'member',
        incidentAccess: lic.incidentAccess || 'read',
        accessCount: 0,
        isConnected: Boolean(lic.assignedUid)
      });
    });

    companyUsers.forEach(u => {
      const emailLower = u.email.toLowerCase();
      const existing = map.get(emailLower);
      if (existing) {
        map.set(emailLower, {
          ...existing,
          displayName: u.displayName || existing.displayName,
          user: u,
          licenseKey: existing.licenseKey || u.licenseKey || '',
          licenseStatus:
            existing.license?.status ||
            (u.licenseStatus === 'active'
              ? 'active'
              : u.licenseStatus === 'suspended'
              ? 'suspended'
              : 'none'),
          companyRole: u.companyRole || existing.companyRole || 'member',
          incidentAccess: u.incidentAccess || existing.incidentAccess || 'read',
          accessCount: u.accessCount || 0,
          isConnected: true
        });
      } else {
        map.set(emailLower, {
          key: emailLower,
          email: u.email,
          displayName: u.displayName,
          user: u,
          licenseKey: u.licenseKey || '',
          licenseStatus:
            u.licenseStatus === 'active'
              ? 'active'
              : u.licenseStatus === 'suspended'
              ? 'suspended'
              : 'none',
          companyRole: u.companyRole || 'member',
          incidentAccess: u.incidentAccess || 'read',
          accessCount: u.accessCount || 0,
          isConnected: true
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => {
        if (a.companyRole === 'company_admin' && b.companyRole !== 'company_admin') return -1;
        if (b.companyRole === 'company_admin' && a.companyRole !== 'company_admin') return 1;
        if (a.licenseStatus === 'active' && b.licenseStatus !== 'active') return -1;
        if (b.licenseStatus === 'active' && a.licenseStatus !== 'active') return 1;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [licenses, companyUsers]);

  const q = searchTerm.trim().toLowerCase();
  const members = allMembers
      .filter(m => {
        if (!q) return true;
        return (
          m.displayName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.licenseKey.toLowerCase().includes(q)
        );
      });

  const activeCount = useMemo(
    () => allMembers.filter(m => m.licenseStatus === 'active').length,
    [allMembers]
  );

  const seatLimit = company?.licensedSeats || 0;
  const pricePerLicense = company?.pricePerLicense || 0;
  const monthlyEstimate = activeCount * pricePerLicense;
  const seatsFull = seatLimit > 0 && activeCount >= seatLimit;

  const handleAddAndLinkUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !activeDomain) return;
    setFormError(null);
    setFormSuccess(null);

    const cleanName = empName.trim().slice(0, 120);
    if (!cleanName) {
      setFormError('Informe o nome completo do colaborador.');
      return;
    }

    const rawInput = empEmailUser.trim().toLowerCase();
    const localPart = rawInput.includes('@') ? rawInput.split('@')[0] : rawInput;
    const cleanLocal = localPart.replace(/[^a-z0-9._+-]/g, '');
    if (!cleanLocal) {
      setFormError('Informe o prefixo do e-mail corporativo antes do @.');
      return;
    }

    if (rawInput.includes('@') && rawInput.split('@')[1] !== activeDomain) {
      setFormError(`Use um e-mail do domínio corporativo @${activeDomain}.`);
      return;
    }

    const fullEmail = `${cleanLocal}@${activeDomain}`;
    if (fullEmail.length > 120) {
      setFormError('O endereço de e-mail é muito longo (máx. 120 caracteres).');
      return;
    }

    const alreadyActive = allMembers.find(
      m => m.email.toLowerCase() === fullEmail && m.licenseStatus === 'active'
    );
    if (seatsFull && !alreadyActive) {
      setFormError(
        `Limite de ${seatLimit} licença(s) contratada(s) atingido. Suspenda outra licença ou solicite ampliação ao administrador do sistema.`
      );
      return;
    }

    const licId = emailToLicenseId(fullEmail);
    const matchedUser = companyUsers.find(u => u.email.toLowerCase() === fullEmail);
    const existingLicense = licenses.find(l => l.id === licId);
    const licenseKey =
      existingLicense?.licenseKey ||
      matchedUser?.licenseKey ||
      generateCorporateLicenseKey(activeDomain, `${cleanLocal}${Date.now().toString(36).slice(-3)}`);
    const planId = company?.planId || 'corp_licenca';
    const incidentAccess: IncidentAccess = empRole === 'company_admin' ? 'edit' : empIncidentAccess;

    setIsSaving(true);
    try {
      const licenseFields = {
        displayName: cleanName,
        planId,
        licenseKey,
        status: 'active',
        companyRole: empRole,
        incidentAccess,
        assignedUid: matchedUser?.uid || existingLicense?.assignedUid || '',
        ...(!existingLicense ? { email: fullEmail, companyDomain: activeDomain, invitedByUid: currentAdmin.uid } : {})
      };
      const user = matchedUser && matchedUser.uid !== currentAdmin.uid && matchedUser.role !== 'admin'
        ? {
            uid: matchedUser.uid,
            fields: {
              status: 'approved', autoApprovedBy: 'corporate_license', planId, companyDomain: activeDomain,
              licenseStatus: 'active', licenseKey, companyRole: empRole, incidentAccess
            }
          }
        : undefined;
      await updateCompanyMemberLicense({ domain: activeDomain, licenseId: licId, licenseExists: Boolean(existingLicense), licenseFields, user });

      setEmpName('');
      setEmpEmailUser('');
      setEmpRole('member');
      setEmpIncidentAccess('read');
      setFormSuccess(
        `Usuário ${fullEmail} adicionado com a licença ${licenseKey}. ${
          matchedUser
            ? 'Acesso liberado imediatamente!'
            : 'Ao acessar o sistema com este e-mail, a licença será ativada automaticamente.'
        }`
      );
    } catch (err: any) {
      setFormError(err?.message || 'Não foi possível vincular a licença.');
      reportFirestoreError(
        err,
        OperationType.WRITE,
        `corporate_companies/${activeDomain}/licenses/${licId}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMemberLicense = async (member: UnifiedCompanyMember) => {
    if (!currentAdmin || !activeDomain) return;
    if (member.user?.uid === currentAdmin.uid) return;
    setFormError(null);
    setFormSuccess(null);

    const nextActive = member.licenseStatus !== 'active';
    if (nextActive && seatsFull) {
      setFormError(
        `Limite de ${seatLimit} licença(s) contratada(s) atingido. Suspenda outra licença antes de reativar.`
      );
      return;
    }

    const licId = member.license?.id || emailToLicenseId(member.email);
    const planId = company?.planId || 'corp_licenca';
    const nextKey =
      member.licenseKey ||
      generateCorporateLicenseKey(activeDomain, member.user?.uid || member.email);

    try {
      const licenseFields = member.license
        ? {
          status: nextActive ? 'active' : 'suspended',
          licenseKey: nextKey,
          assignedUid: member.user?.uid || member.license.assignedUid || ''
        }
        : {
          email: member.email.toLowerCase(),
          displayName: member.displayName,
          companyDomain: activeDomain,
          planId,
          licenseKey: nextKey,
          status: nextActive ? 'active' : 'suspended',
          companyRole: member.companyRole || 'member',
          assignedUid: member.user?.uid || '',
          invitedByUid: currentAdmin.uid
        };
      const user = member.user && member.user.uid !== currentAdmin.uid && member.user.role !== 'admin'
        ? {
            uid: member.user.uid,
            fields: {
          status: nextActive ? 'approved' : 'blocked',
          autoApprovedBy: 'corporate_license',
          planId,
          companyDomain: activeDomain,
          licenseStatus: nextActive ? 'active' : 'suspended',
          licenseKey: nextKey
            }
          }
        : undefined;
      await updateCompanyMemberLicense({
        domain: activeDomain,
        licenseId: licId,
        licenseExists: Boolean(member.license),
        licenseFields,
        user
      });
    } catch (err) {
      setFormError('Não foi possível atualizar a licença ou o vínculo do colaborador.');
      reportFirestoreError(
        err,
        OperationType.UPDATE,
        `corporate_companies/${activeDomain}/licenses/${licId}`
      );
    }
  };

  const handleToggleCompanyRole = async (member: UnifiedCompanyMember) => {
    if (!currentAdmin || !activeDomain) return;
    if (member.user?.uid === currentAdmin.uid) return;

    const nextRole: CompanyRole =
      member.companyRole === 'company_admin' ? 'member' : 'company_admin';
    const licId = member.license?.id || emailToLicenseId(member.email);
    const planId = company?.planId || 'corp_licenca';
    const nextKey =
      member.licenseKey ||
      generateCorporateLicenseKey(activeDomain, member.user?.uid || member.email);

    try {
      const licenseFields = member.license
        ? { companyRole: nextRole }
        : {
          email: member.email.toLowerCase(),
          displayName: member.displayName,
          companyDomain: activeDomain,
          planId,
          licenseKey: nextKey,
          status: member.licenseStatus === 'suspended' ? 'suspended' : 'active',
          companyRole: nextRole,
          assignedUid: member.user?.uid || '',
          invitedByUid: currentAdmin.uid
        };
      const user = member.user && member.user.uid !== currentAdmin.uid && member.user.role !== 'admin'
        ? { uid: member.user.uid, fields: { companyRole: nextRole, companyDomain: activeDomain } }
        : undefined;
      await updateCompanyMemberLicense({
        domain: activeDomain,
        licenseId: licId,
        licenseExists: Boolean(member.license),
        licenseFields,
        user
      });
    } catch (err) {
      setFormError('Não foi possível atualizar a licença ou o vínculo do colaborador.');
      reportFirestoreError(
        err,
        OperationType.UPDATE,
        `corporate_companies/${activeDomain}/licenses/${licId}`
      );
    }
  };

  const handleIncidentAccessChange = async (member: UnifiedCompanyMember, incidentAccess: IncidentAccess) => {
    if (!activeDomain || member.user?.uid === currentAdmin?.uid || member.companyRole === 'company_admin') return;
    const licId = member.license?.id || emailToLicenseId(member.email);
    try {
      await updateCompanyMemberIncidentAccess({
        domain: activeDomain,
        licenseId: licId,
        licenseFields: member.license ? { incidentAccess } : undefined,
        user: member.user ? { uid: member.user.uid, fields: { incidentAccess } } : undefined
      });
    } catch (err) {
      setFormError('Não foi possível atualizar a licença ou o vínculo do colaborador.');
      reportFirestoreError(
        err,
        OperationType.UPDATE,
        member.user ? `users/${member.user.uid}` : `corporate_companies/${activeDomain}/licenses/${licId}`
      );
    }
  };

  const handleRemoveLicense = async (member: UnifiedCompanyMember) => {
    if (!activeDomain || (!member.license && !member.user)) return;
    if (member.user?.uid === currentAdmin?.uid || member.user?.role === 'admin') return;
    const confirmed = window.confirm(
      `Remover ${member.displayName} (${member.email}) definitivamente desta empresa? A licença será excluída. A conta global do usuário permanecerá, mas perderá o acesso corporativo.`
    );
    if (!confirmed) return;

    try {
      await removeCompanyMember({
        domain: activeDomain,
        licenseId: member.license?.id,
        userUid: member.user?.uid
      });
    } catch (err) {
      setFormError('Não foi possível atualizar a licença ou o vínculo do colaborador.');
      reportFirestoreError(
        err,
        OperationType.WRITE,
        member.user
          ? `users/${member.user.uid}`
          : `corporate_companies/${activeDomain}/licenses/${member.license?.id}`
      );
    }
  };

  const handleCopyAccessLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return {
    empName,
    setEmpName,
    empEmailUser,
    setEmpEmailUser,
    empRole,
    setEmpRole,
    empIncidentAccess,
    setEmpIncidentAccess,
    searchTerm,
    setSearchTerm,
    formError,
    formSuccess,
    isSaving,
    copiedInvite,
    members,
    memberCount: allMembers.length,
    connectedCount: allMembers.filter(member => member.isConnected).length,
    activeCount,
    seatLimit,
    pricePerLicense,
    monthlyEstimate,
    seatsFull,
    handleAddAndLinkUser,
    handleToggleMemberLicense,
    handleToggleCompanyRole,
    handleIncidentAccessChange,
    handleRemoveLicense,
    handleCopyAccessLink
  };
}
