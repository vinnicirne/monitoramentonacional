import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type Map from 'ol/Map';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type { TerritorialRegistry } from '../../../types';
import type { LiveGpsInfo } from '../components/LiveGpsHud';
import { findCispForCoords, findFactionAtCoords } from '../../../data/faccoesPrecisas';
import { reverseGeocodeFree } from '../../../utils/geocoding';
import { createLiveGpsFeatures, getGeolocationErrorMessage } from '../services/liveGpsFeatures';

interface UseLiveGpsTrackingOptions {
  isTracking: boolean;
  mapRef: MutableRefObject<Map | null>;
  source: VectorSource;
  cispLayerRef: MutableRefObject<VectorLayer<any> | null>;
  registryRef: MutableRefObject<TerritorialRegistry | null>;
  followUserRef: MutableRefObject<boolean>;
  setFollowUser: (follow: boolean) => void;
}

export function useLiveGpsTracking({
  isTracking,
  mapRef,
  source,
  cispLayerRef,
  registryRef,
  followUserRef,
  setFollowUser
}: UseLiveGpsTrackingOptions) {
  const [liveGps, setLiveGps] = useState<LiveGpsInfo | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const lastReverseGeocodeRef = useRef<{ ts: number; lat: number; lng: number }>({ ts: 0, lat: 0, lng: 0 });

  useEffect(() => {
    if (!isTracking) {
      source.clear();
      setLiveGps(null);
      setGpsError(null);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocalização não suportada neste navegador.');
      return;
    }

    setFollowUser(true);
    setGpsError(null);
    let isFirstFix = true;

    const watchId = navigator.geolocation.watchPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 0);
        const speedKmh = position.coords.speed != null && !Number.isNaN(position.coords.speed)
          ? Math.round(position.coords.speed * 3.6)
          : null;
        const { coordinate, features } = createLiveGpsFeatures(longitude, latitude, accuracy);
        source.clear();
        source.addFeatures(features);

        if (mapRef.current && (isFirstFix || followUserRef.current)) {
          const view = mapRef.current.getView();
          const currentZoom = view.getZoom() || 10;
          view.animate({
            center: coordinate,
            zoom: isFirstFix ? Math.max(currentZoom, 16.2) : currentZoom,
            duration: isFirstFix ? 750 : 350
          });
          isFirstFix = false;
        }

        const cispFeature = cispLayerRef.current?.getSource()?.getFeaturesAtCoordinate(coordinate)?.[0];
        const cispNumber = (cispFeature?.get('cisp') as number | undefined) ?? findCispForCoords(longitude, latitude);
        const record = cispNumber ? registryRef.current?.cisps[cispNumber] : undefined;
        const cispLabel = record ? `${record.cisp_formatado} · ${record.municipio}` : cispNumber ? `${cispNumber}ª DP` : null;
        const faction = findFactionAtCoords(longitude, latitude);
        const updatedAt = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setLiveGps(previous => ({
          lat: latitude,
          lng: longitude,
          accuracy,
          speedKmh,
          updatedAt,
          streetAddress: previous?.streetAddress || null,
          cispLabel,
          factionLabel: faction ? `${faction.nome} (${faction.shortLabel})` : null,
          factionColor: faction?.color || null
        }));
        setGpsError(null);

        const now = Date.now();
        const last = lastReverseGeocodeRef.current;
        const movedEnough = Math.abs(latitude - last.lat) > 0.0005 || Math.abs(longitude - last.lng) > 0.0005;
        if (now - last.ts > 15000 || last.ts === 0 || movedEnough) {
          lastReverseGeocodeRef.current = { ts: now, lat: latitude, lng: longitude };
          reverseGeocodeFree(latitude, longitude).then(street => {
            if (street) setLiveGps(previous => (previous ? { ...previous, streetAddress: street } : previous));
          });
        }
      },
      error => setGpsError(getGeolocationErrorMessage(error.code)),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      source.clear();
    };
  }, [isTracking, source, mapRef, cispLayerRef, registryRef, followUserRef, setFollowUser]);

  return { liveGps, gpsError };
}
