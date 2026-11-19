import React, { useState } from 'react';
import type { AdminActionError } from './useAdminOperationFeedback';
import { createAdminCompany, deleteAdminCompany, updateAdminCompany } from '../services/adminRepository';
import { CorporateCompany, OperationType, PlanConfig } from '../../../types/admin';

export function useAdminCompanyForm({ plans, onError }: { plans: PlanConfig[]; onError: AdminActionError }) {
  // Add / Edit Corporate Company Form
  const [editingCompanyDomain, setEditingCompanyDomain] = useState<string | null>(null);
  const [compDomain, setCompDomain] = useState('');
  const [compName, setCompName] = useState('');
  const [compPlanId, setCompPlanId] = useState('corp_licenca');
  const [compPricePerLicense, setCompPricePerLicense] = useState('49');
  const [compLicensedSeats, setCompLicensedSeats] = useState('10');
  const [compAutoApprove, setCompAutoApprove] = useState(true);

  const resetCompanyForm = () => {
    setEditingCompanyDomain(null);
    setCompDomain('');
    setCompName('');
    setCompPlanId('corp_licenca');
    const corpPlan = plans.find(p => p.id === 'corp_licenca' || p.billingModel === 'per_user');
    setCompPricePerLicense(String(corpPlan?.pricePerLicense ?? corpPlan?.priceMonthly ?? 49));
    setCompLicensedSeats('10');
    setCompAutoApprove(true);
  };

  const handleEditCompany = (comp: CorporateCompany) => {
    setEditingCompanyDomain(comp.domain);
    setCompDomain(comp.domain);
    setCompName(comp.companyName);
    setCompPlanId(comp.planId);
    setCompPricePerLicense(String(comp.pricePerLicense));
    setCompLicensedSeats(String(comp.licensedSeats));
    setCompAutoApprove(comp.autoApprove);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = (editingCompanyDomain || compDomain)
      .trim()
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/[^a-z0-9.-]/g, '');
    if (!cleanDomain || cleanDomain.length < 3 || !cleanDomain.includes('.')) return;

    const cleanName = (compName.trim() || `Empresa @${cleanDomain}`).slice(0, 120);
    const price = Math.max(0, Number(compPricePerLicense) || 0);
    const seats = Math.max(0, Math.floor(Number(compLicensedSeats) || 0));

    try {
      if (editingCompanyDomain) {
        await updateAdminCompany(cleanDomain, {
          companyName: cleanName,
          planId: compPlanId || 'corp_licenca',
          pricePerLicense: price,
          licensedSeats: seats,
          autoApprove: compAutoApprove
        });
      } else {
        await createAdminCompany(cleanDomain, {
          companyName: cleanName,
          planId: compPlanId || 'corp_licenca',
          pricePerLicense: price,
          licensedSeats: seats,
          autoApprove: compAutoApprove,
          active: true
        });
      }
      resetCompanyForm();
    } catch (err) {
      onError(
        err,
        editingCompanyDomain ? OperationType.UPDATE : OperationType.CREATE,
        `corporate_companies/${cleanDomain}`
      );
    }
  };

  const handleToggleCompany = async (
    comp: CorporateCompany,
    field: 'active' | 'autoApprove'
  ) => {
    try {
      await updateAdminCompany(comp.domain, { [field]: !comp[field] });
    } catch (err) {
      onError(err, OperationType.UPDATE, `corporate_companies/${comp.domain}`);
    }
  };

  const handleDeleteCompany = async (domainId: string) => {
    try {
      await deleteAdminCompany(domainId);
      if (editingCompanyDomain === domainId) resetCompanyForm();
    } catch (err) {
      onError(err, OperationType.DELETE, `corporate_companies/${domainId}`);
    }
  };

  return {
    editingCompanyDomain,
    compDomain,
    setCompDomain,
    compName,
    setCompName,
    compPlanId,
    setCompPlanId,
    compPricePerLicense,
    setCompPricePerLicense,
    compLicensedSeats,
    setCompLicensedSeats,
    compAutoApprove,
    setCompAutoApprove,
    resetCompanyForm,
    handleEditCompany,
    handleSaveCompany,
    handleToggleCompany,
    handleDeleteCompany
  };
}
