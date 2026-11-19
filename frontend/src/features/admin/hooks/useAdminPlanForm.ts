import React, { useState } from 'react';
import type { AdminActionError } from './useAdminOperationFeedback';
import { createPlan, updatePlan } from '../services/adminRepository';
import { OperationType, PlanBillingModel, PlanConfig } from '../../../types/admin';

export function useAdminPlanForm({ onError }: { onError: AdminActionError }) {
  // Add / Save Plan Form
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planBillingModel, setPlanBillingModel] = useState<PlanBillingModel>('per_user');
  const [planPrice, setPlanPrice] = useState('49');
  const [planQueries, setPlanQueries] = useState('999999');
  const [planFeaturesText, setPlanFeaturesText] = useState(
    'Licença individual @empresa.com, Acesso completo RJ/MG/ES, Auditoria & Dossiê PDF'
  );

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanDesc('');
    setPlanBillingModel('per_user');
    setPlanPrice('49');
    setPlanQueries('999999');
    setPlanFeaturesText(
      'Licença individual @empresa.com, Acesso completo RJ/MG/ES, Auditoria & Dossiê PDF'
    );
  };

  const handleEditPlan = (plan: PlanConfig) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDesc(plan.description);
    setPlanBillingModel(plan.billingModel || 'fixed');
    setPlanPrice(String(plan.pricePerLicense ?? plan.priceMonthly ?? 0));
    setPlanQueries(String(plan.maxQueriesPerMonth ?? 1000));
    setPlanFeaturesText((plan.features || []).join(', '));
  };

  const handleCreateOrUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = planName.trim().slice(0, 80);
    if (!cleanName) return;
    const planId =
      editingPlanId ||
      cleanName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48) ||
      `plan_${Date.now()}`;
    const features = planFeaturesText
      .split(',')
      .map(s => s.trim().slice(0, 100))
      .filter(Boolean)
      .slice(0, 10);
    const numericPrice = Math.max(0, Number(planPrice) || 0);

    try {
      if (editingPlanId) {
        await updatePlan(planId, {
          name: cleanName,
          description: (planDesc.trim() || 'Plano operacional personalizado').slice(0, 300),
          priceMonthly: numericPrice,
          billingModel: planBillingModel,
          pricePerLicense: numericPrice,
          maxQueriesPerMonth: Math.max(0, Number(planQueries) || 500),
          features
        });
      } else {
        await createPlan(planId, {
          name: cleanName,
          description: (planDesc.trim() || 'Plano operacional personalizado').slice(0, 300),
          priceMonthly: numericPrice,
          billingModel: planBillingModel,
          pricePerLicense: numericPrice,
          maxQueriesPerMonth: Math.max(0, Number(planQueries) || 500),
          features,
          active: true
        });
      }
      resetPlanForm();
    } catch (err) {
      onError(
        err,
        editingPlanId ? OperationType.UPDATE : OperationType.CREATE,
        `plans/${planId}`
      );
    }
  };

  const handleTogglePlanActive = async (plan: PlanConfig) => {
    try {
      await updatePlan(plan.id, { active: !plan.active });
    } catch (err) {
      onError(err, OperationType.UPDATE, `plans/${plan.id}`);
    }
  };

  return {
    editingPlanId,
    planName,
    setPlanName,
    planDesc,
    setPlanDesc,
    planBillingModel,
    setPlanBillingModel,
    planPrice,
    setPlanPrice,
    planQueries,
    setPlanQueries,
    planFeaturesText,
    setPlanFeaturesText,
    resetPlanForm,
    handleEditPlan,
    handleCreateOrUpdatePlan,
    handleTogglePlanActive
  };
}
