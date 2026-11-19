import type { Unsubscribe } from 'firebase/firestore';
import type { CorporatePackageIncident } from '../../../types/admin';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import { timestampMillis } from '../../../shared/firebase/documentFields';
import { listenToQuery } from '../../../shared/firebase/queryPages';
import { restoreLegacyCorporateIncident } from './incidentRepository';
import { readLocalIncidents, refreshIncidentCache } from './incidentCache';
import { mapCorporateIncidentDocument } from './incidentMapper';

function sortIncidentsNewestFirst(incidents: CorporatePackageIncident[]) {
  return incidents.toSorted((left, right) => timestampMillis(right.createdAt) - timestampMillis(left.createdAt));
}

interface CorporateIncidentSubscriptionOptions {
  domain: string;
  userId?: string;
  migratingIds: Set<string>;
  onIncidents: (incidents: CorporatePackageIncident[]) => void;
  onError: (error: Error) => void;
}

export function subscribeCorporateIncidents({
  domain,
  userId,
  migratingIds,
  onIncidents,
  onError
}: CorporateIncidentSubscriptionOptions): Unsubscribe {
  return listenToQuery(
    'corporate_companies/incidents',
    firestoreRefs.companyIncidents(domain),
    snapshot => {
      const remoteIncidents = snapshot.docs.map(document =>
        mapCorporateIncidentDocument(document.id, document.data(), domain)
      );
      onIncidents(sortIncidentsNewestFirst(remoteIncidents));

      // Importa do navegador apenas registros criados pelo usuário atual e
      // ausentes no Firestore. O marcador de exclusão evita ressuscitar dados.
      if (!userId || typeof localStorage === 'undefined') return;
      const remoteIds = new Set(snapshot.docs.map(document => document.id));
      const localOnly = readLocalIncidents(domain).filter(incident =>
        incident.createdByUid === userId &&
        !remoteIds.has(incident.id) &&
        !migratingIds.has(`${domain}/${incident.id}`)
      );

      localOnly.forEach(incident => {
        const key = `${domain}/${incident.id}`;
        migratingIds.add(key);
        const migrate = async () => {
          const result = await restoreLegacyCorporateIncident(domain, incident);
          if (result === 'deleted') refreshIncidentCache(domain, incident.id, () => undefined);
        };

        migrate()
          .catch(error => console.error(`Falha ao migrar ocorrência local ${incident.id}:`, error))
          .finally(() => migratingIds.delete(key));
      });
    },
    onError
  );
}
