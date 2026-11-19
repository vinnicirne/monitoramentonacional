import type Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import type { EstadoScope } from '../../../types/sigBase';
import type { TerritorialRegistry } from '../../../types';

const DEFAULT_SCOPE_VIEW: Record<EstadoScope, { center: [number, number]; zoom: number }> = {
  TODOS: { center: [-43.3, -20.4], zoom: 6.3 },
  RJ: { center: [-43.28, -22.86], zoom: 10.3 },
  MG: { center: [-44.38, -18.8], zoom: 6.4 },
  ES: { center: [-40.45, -19.85], zoom: 7.7 },
  MG_ES: { center: [-42.8, -19.2], zoom: 6.2 }
};

export function frameMapForScope(map: Map, scope: EstadoScope) {
  const view = DEFAULT_SCOPE_VIEW[scope];
  map.getView().animate({ center: fromLonLat(view.center), zoom: view.zoom, duration: 700 });
}

export function focusMapAt(map: Map, longitude: number, latitude: number, zoom: number, duration = 700) {
  map.getView().animate({ center: fromLonLat([longitude, latitude]), zoom, duration });
}

export function focusMapOnCisp(map: Map, registry: TerritorialRegistry, cispId: number) {
  const centroid = registry.cisps[cispId]?.centroide;
  if (!centroid) return false;
  map.getView().animate({ center: fromLonLat(centroid), zoom: 12.6, duration: 750 });
  return true;
}
