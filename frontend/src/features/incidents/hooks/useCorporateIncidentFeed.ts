import { useEffect, useRef, useState } from 'react';
import type { CorporatePackageIncident } from '../../../types/admin';
import { subscribeCorporateIncidents } from '../services/incidentSync';

const EMPTY_INCIDENTS: CorporatePackageIncident[] = [];

export function useCorporateIncidentFeed(domain: string, enabled: boolean, userId?: string) {
  const [result, setResult] = useState<{
    domain: string;
    userId?: string;
    incidents: CorporatePackageIncident[];
  } | null>(null);
  const migratingIdsRef = useRef(new Set<string>());

  useEffect(() => {
    setResult(null);
    if (!enabled || !domain) return;

    return subscribeCorporateIncidents({
      domain,
      userId,
      migratingIds: migratingIdsRef.current,
      onIncidents: incidents => setResult({ domain, userId, incidents }),
      onError: error => {
        console.error('Não foi possível carregar ocorrências do Firebase:', error);
        setResult({ domain, userId, incidents: EMPTY_INCIDENTS });
      }
    });
  }, [domain, enabled, userId]);

  const currentResult = enabled && result?.domain === domain && result.userId === userId ? result : null;
  return { incidents: currentResult?.incidents ?? EMPTY_INCIDENTS, loaded: currentResult !== null };
}
