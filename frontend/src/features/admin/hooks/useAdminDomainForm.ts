import React, { useState } from 'react';
import type { AdminActionError } from './useAdminOperationFeedback';
import { createFreeDomain, deleteFreeDomain, updateFreeDomain } from '../services/adminRepository';
import { FreeDomain, OperationType, PlanConfig } from '../../../types/admin';

export function useAdminDomainForm({ plans, onError }: { plans: PlanConfig[]; onError: AdminActionError }) {
  // Add Free Domain Form
  const [newDomain, setNewDomain] = useState('');
  const [newDomainLabel, setNewDomainLabel] = useState('');
  const [newDomainAutoRef, setNewDomainAutoRef] = useState(true);

  const handleAddFreeDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = newDomain
      .trim()
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/[^a-z0-9.-]/g, '');
    if (!cleanDomain || cleanDomain.length < 3 || !cleanDomain.includes('.')) return;
    try {
      await createFreeDomain(cleanDomain, {
        label: (newDomainLabel.trim() || `Domínio @${cleanDomain}`).slice(0, 100),
        active: true,
        autoApproveReferrals: newDomainAutoRef,
        defaultPlanId: plans[0]?.id || 'free_corp'
      });
      setNewDomain('');
      setNewDomainLabel('');
    } catch (err) {
      onError(err, OperationType.CREATE, `free_domains/${cleanDomain}`);
    }
  };

  const handleToggleDomain = async (dom: FreeDomain, field: 'active' | 'autoApproveReferrals') => {
    try {
      await updateFreeDomain(dom.domain, { [field]: !dom[field] });
    } catch (err) {
      onError(err, OperationType.UPDATE, `free_domains/${dom.domain}`);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      await deleteFreeDomain(domainId);
    } catch (err) {
      onError(err, OperationType.DELETE, `free_domains/${domainId}`);
    }
  };

  return {
    newDomain,
    setNewDomain,
    newDomainLabel,
    setNewDomainLabel,
    newDomainAutoRef,
    setNewDomainAutoRef,
    handleAddFreeDomain,
    handleToggleDomain,
    handleDeleteDomain
  };
}
