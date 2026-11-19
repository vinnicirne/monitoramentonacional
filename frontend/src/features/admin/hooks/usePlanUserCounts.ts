import { useEffect, useState } from 'react';
import { reportFirestoreError } from '../../../firebase';
import { OperationType, type PlanConfig } from '../../../types/admin';
import { countUsersByPlan } from '../services/adminUserQueries';

export function usePlanUserCounts(plans: PlanConfig[], refreshVersion: number) {
  const key = JSON.stringify(plans.map(plan => plan.id).sort());
  const [result, setResult] = useState<{ key: string; counts: Record<string, number> }>();
  useEffect(() => {
    const ids: string[] = JSON.parse(key);
    if (!ids.length) return;
    let active = true;
    countUsersByPlan(ids).then(counts => {
      if (active) setResult({ key, counts });
    }).catch(error => {
      if (active) reportFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => { active = false; };
  }, [key, refreshVersion]);
  return result?.key === key ? result.counts : {};
}
