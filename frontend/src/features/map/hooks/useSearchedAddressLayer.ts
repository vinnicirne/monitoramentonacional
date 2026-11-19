import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { TerritorialRegistry } from '../../../types';
import { findCispForCoords, findFactionAtCoords } from '../../../data/faccoesPrecisas';
import type { AddressSearchResult } from '../../../utils/geocoding';
import type { MapFeaturePopupData } from '../components/MapFeaturePopup';
import { createAddressMarkerFeatures } from '../services/addressFeatures';

interface SearchedAddressLayerOptions {
  selectedAddress?: (AddressSearchResult & { ts: number }) | null;
  addressSource: VectorSource;
  cispLayerRef: MutableRefObject<VectorLayer<any> | null>;
  registryRef: MutableRefObject<TerritorialRegistry | null>;
  canViewDetailsRef: MutableRefObject<boolean>;
  popupOverlayRef: MutableRefObject<Overlay | null>;
  setMapPopup: Dispatch<SetStateAction<MapFeaturePopupData | null>>;
}

export function useSearchedAddressLayer({
  selectedAddress,
  addressSource,
  cispLayerRef,
  registryRef,
  canViewDetailsRef,
  popupOverlayRef,
  setMapPopup
}: SearchedAddressLayerOptions) {
  useEffect(() => {
    addressSource.clear();
    if (!selectedAddress) return;

    const coordinate = fromLonLat([selectedAddress.lng, selectedAddress.lat]);
    addressSource.addFeatures(createAddressMarkerFeatures(selectedAddress));

    const factionMatch = findFactionAtCoords(selectedAddress.lng, selectedAddress.lat);
    const cispFeature = cispLayerRef.current?.getSource()?.getFeaturesAtCoordinate(coordinate)?.[0];
    const cispNumber = (cispFeature?.get('cisp') as number | undefined)
      ?? findCispForCoords(selectedAddress.lng, selectedAddress.lat);
    const registryRecord = cispNumber ? registryRef.current?.cisps[cispNumber] : undefined;

    if (!canViewDetailsRef.current) return;

    setMapPopup({
      visible: true,
      title: selectedAddress.shortTitle,
      factionLabel: factionMatch
        ? `${factionMatch.label} (${factionMatch.nome})`
        : 'Sem polígono de facção mapeado neste ponto',
      factionShort: factionMatch ? factionMatch.shortLabel : 'ENDEREÇO',
      color: factionMatch ? factionMatch.color : '#0284c7',
      cispLabel: registryRecord?.nome_oficial || (cispNumber ? `${cispNumber}ª DP` : undefined),
      source: factionMatch
        ? 'OpenStreetMap (Nominatim) + Dados de Riscos'
        : 'OpenStreetMap Nominatim / Photon (Free)',
      sourceUrl: factionMatch ? 'https://dadosderiscos.com.br/mapa-rj-risco-faccoes.html' : undefined,
      period: selectedAddress.subtitle || 'Geocodificação em tempo real (OSM Free)',
      methodologyNote: selectedAddress.displayName
    });
    popupOverlayRef.current?.setPosition(coordinate);
  }, [selectedAddress, addressSource, cispLayerRef, registryRef, canViewDetailsRef, popupOverlayRef, setMapPopup]);
}
