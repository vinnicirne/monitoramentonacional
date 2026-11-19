import { useMemo } from 'react';
import type { CorporatePackageIncident } from '../../../types/admin';

export type IncidentFilterMode = 'all' | 'at_station' | 'roubos' | 'fraude' | 'extravio' | 'roubo_carga' | 'ameaca' | 'resolved';

export function useCompanyIncidentData(
  incidents: CorporatePackageIncident[],
  incidentSearch: string,
  incidentFilter: IncidentFilterMode
) {
  const filteredIncidents = useMemo(() => {
    const q = incidentSearch.trim().toLowerCase();
    return incidents.filter(inc => {
      if (incidentFilter === 'at_station' && !inc.packageAtStation) return false;
      if (incidentFilter === 'roubos' && !['roubo_carga', 'roubo', 'furto'].includes(inc.incidentType)) return false;
      if (incidentFilter === 'fraude' && inc.incidentType !== 'fraude') return false;
      if (incidentFilter === 'extravio' && inc.incidentType !== 'extravio') return false;
      if (incidentFilter === 'roubo_carga' && inc.incidentType !== 'roubo_carga') return false;
      if (incidentFilter === 'ameaca' && inc.incidentType !== 'ameaca') return false;
      if (incidentFilter === 'resolved' && !['liberado_retirada', 'devolvido_empresa'].includes(inc.custodyStatus)) return false;
      if (!q) return true;
      return [inc.trackingCode, inc.boNumber, inc.delegaciaName, inc.carrierName, inc.delegaciaMunicipio, inc.notes]
        .some(value => (value || '').toLowerCase().includes(q));
    });
  }, [incidents, incidentSearch, incidentFilter]);

  const incidentStats = useMemo(() => {
    const total = incidents.length;
    const atStation = incidents.filter(incident => incident.packageAtStation).length;
    const totalRoubos = incidents.filter(incident => ['roubo_carga', 'roubo', 'furto'].includes(incident.incidentType)).length;
    const resolved = incidents.filter(incident => ['liberado_retirada', 'devolvido_empresa'].includes(incident.custodyStatus)).length;
    const totalValue = incidents.reduce((sum, incident) => sum + (incident.estimatedValue || 0), 0);
    const packageTotals = incidents.reduce((totals, incident) => {
      const quantity = Math.max(1, Math.floor(Number(incident.packageQuantity) || 1));
      totals.involved += quantity;
      totals.delivered += Number(incident.packagesDelivered) || 0;
      totals.recovered += incident.packagesRecovered ?? (incident.custodyStatus === 'devolvido_empresa' ? quantity : 0);
      totals.lost += incident.packagesStolen ?? (
        incident.custodyStatus !== 'devolvido_empresa' &&
        (incident.custodyStatus === 'extraviado_nao_localizado' || ['roubo_carga', 'roubo', 'furto'].includes(incident.incidentType))
          ? quantity
          : 0
      );
      return totals;
    }, { involved: 0, delivered: 0, recovered: 0, lost: 0 });
    return { total, atStation, totalRoubos, resolved, totalValue, ...packageTotals };
  }, [incidents]);

  return { filteredIncidents, incidentStats };
}
