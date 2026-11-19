import { useEffect, useRef, type MutableRefObject } from 'react';
import type Map from 'ol/Map';
import type { TerritorialRegistry } from '../../../types';
import type { EstadoScope } from '../../../types/sigBase';
import { focusMapAt, focusMapOnCisp, frameMapForScope } from '../services/mapCamera';

interface FocusTarget {
  lat: number;
  lng: number;
  zoom?: number;
  ts: number;
}

interface MapCameraNavigationOptions {
  mapRef: MutableRefObject<Map | null>;
  estadoScope: EstadoScope;
  focusTarget?: FocusTarget | null;
  selectedCispId: number | null;
  registry: TerritorialRegistry | null;
}

export function useMapCameraNavigation({
  mapRef,
  estadoScope,
  focusTarget,
  selectedCispId,
  registry
}: MapCameraNavigationOptions) {
  const lastFocusTsRef = useRef<number>(0);

  useEffect(() => {
    if (!mapRef.current) return;
    frameMapForScope(mapRef.current, estadoScope);
  }, [mapRef, estadoScope]);

  useEffect(() => {
    if (!focusTarget || !mapRef.current) return;
    lastFocusTsRef.current = Date.now();
    focusMapAt(mapRef.current, focusTarget.lng, focusTarget.lat, focusTarget.zoom || 12.0);
  }, [mapRef, focusTarget]);

  useEffect(() => {
    if (Date.now() - lastFocusTsRef.current < 1200) return;
    if (selectedCispId && registry && mapRef.current) {
      focusMapOnCisp(mapRef.current, registry, selectedCispId);
    }
  }, [mapRef, selectedCispId, registry]);
}
