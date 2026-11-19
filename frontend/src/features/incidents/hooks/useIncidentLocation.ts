import { useState, useEffect, useMemo } from 'react';
import { CorporatePackageIncident } from '../../../types/admin';
import { TerritorialRegistry } from '../../../types';
import { DELEGACIAS_MG_ES_DATA } from '../../../data/delegaciasMgEsData';
import { searchAddressesFree, AddressSearchResult } from '../../../utils/geocoding';
import { findResponsibleDelegacia, DelegaciaMatchResult } from '../../../utils/delegaciaMatcher';

export function useIncidentLocation({ isOpen, activeIncident, registry, setErrorMessage, setSuccessMessage }: {
  isOpen: boolean;
  activeIncident: CorporatePackageIncident | null;
  registry?: TerritorialRegistry | null;
  setErrorMessage: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}) {
  const [delegaciaUfFilter, setDelegaciaUfFilter] = useState<'TODAS' | 'RJ' | 'MG' | 'ES'>('TODAS');
  const [delegaciaSearch, setDelegaciaSearch] = useState('');
  const [selectedDelegaciaId, setSelectedDelegaciaId] = useState('');
  const [autoMatchInfo, setAutoMatchInfo] = useState<DelegaciaMatchResult | null>(null);
  const [isManuallyOverridden, setIsManuallyOverridden] = useState<boolean>(false);
  // Geographic fields
  const [addressInput, setAddressInput] = useState('');
  const [bairroInput, setBairroInput] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchResults, setAddressSearchResults] = useState<AddressSearchResult[]>([]);

  // Helper para disparar busca e vinculação automática da delegacia
  const triggerAutoDelegaciaMatch = (
    latVal?: string | number | null,
    lngVal?: string | number | null,
    bairroVal?: string | null,
    addrVal?: string | null
  ) => {
    const lat = latVal !== undefined ? latVal : latInput;
    const lng = lngVal !== undefined ? lngVal : lngInput;
    const bairro = bairroVal !== undefined ? bairroVal : bairroInput;
    const addr = addrVal !== undefined ? addrVal : addressInput;

    const match = findResponsibleDelegacia({
      lat,
      lng,
      bairro,
      addressText: addr,
      registry
    });

    if (match) {
      setSelectedDelegaciaId(match.delegaciaId);
      setAutoMatchInfo(match);
      setIsManuallyOverridden(false);

      if (delegaciaUfFilter !== 'TODAS' && delegaciaUfFilter !== match.uf) {
        setDelegaciaUfFilter(match.uf);
      }
      return match;
    }
    return null;
  };

  // Delegacias catalog
  const allDelegacias = useMemo(() => {
    const list: Array<{ id: string; uf: string; name: string; municipio: string; lat?: number; lng?: number }> = [];

    if (registry?.cisps) {
      Object.values(registry.cisps)
        .sort((a, b) => a.cisp - b.cisp)
        .forEach(c => {
          list.push({
            id: `RJ_CISP_${c.cisp}`,
            uf: 'RJ',
            name: `${c.cisp}ª DP — ${c.nome_oficial}`,
            municipio: c.municipio,
            lat: c.centroide ? c.centroide[1] : undefined,
            lng: c.centroide ? c.centroide[0] : undefined
          });
        });
    }

    DELEGACIAS_MG_ES_DATA.forEach(del => {
      list.push({
        id: del.id,
        uf: del.uf,
        name: `${del.nomeCurto} — ${del.nome}`,
        municipio: del.municipio,
        lat: del.latitude,
        lng: del.longitude
      });
    });

    return list;
  }, [registry]);

  const filteredDelegacias = useMemo(() => {
    const q = delegaciaSearch.trim().toLowerCase();
    return allDelegacias.filter(d => {
      if (delegaciaUfFilter !== 'TODAS' && d.uf !== delegaciaUfFilter) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.municipio.toLowerCase().includes(q);
    });
  }, [allDelegacias, delegaciaUfFilter, delegaciaSearch]);

  // Sincronização automática contínua quando o usuário digita/cola latitude, longitude ou bairro
  useEffect(() => {
    if (!isOpen || activeIncident || isManuallyOverridden) return;
    const lat = parseFloat(latInput.replace(',', '.'));
    const lng = parseFloat(lngInput.replace(',', '.'));
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;

    if (hasCoords || bairroInput.trim().length >= 3) {
      const timer = setTimeout(() => {
        const match = findResponsibleDelegacia({
          lat: hasCoords ? lat : null,
          lng: hasCoords ? lng : null,
          bairro: bairroInput.trim(),
          addressText: addressInput.trim(),
          registry
        });
        if (match && match.delegaciaId !== selectedDelegaciaId) {
          setSelectedDelegaciaId(match.delegaciaId);
          setAutoMatchInfo(match);
          if (delegaciaUfFilter !== 'TODAS' && delegaciaUfFilter !== match.uf) {
            setDelegaciaUfFilter(match.uf);
          }
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [latInput, lngInput, bairroInput, addressInput, registry, selectedDelegaciaId, delegaciaUfFilter, isOpen, activeIncident, isManuallyOverridden]);

  // Handle Geocoding Search
  const handleSearchAddress = async () => {
    if (!addressInput.trim()) return;
    setIsSearchingAddress(true);
    setErrorMessage(null);
    try {
      const results = await searchAddressesFree(addressInput.trim(), undefined, { scope: 'TODOS' });
      setAddressSearchResults(results);
      if (results.length > 0) {
        const first = results[0];
        setLatInput(first.lat.toFixed(6));
        setLngInput(first.lng.toFixed(6));
        const detectedBairro = first.subtitle ? first.subtitle.split('·')[0].trim() : '';
        if (detectedBairro) setBairroInput(detectedBairro);

        const match = triggerAutoDelegaciaMatch(first.lat, first.lng, detectedBairro, addressInput.trim());
        if (match) {
          setSuccessMessage(`Área localizada! Delegacia vinculada: ${match.delegaciaName}`);
        }
      } else {
        setErrorMessage('Nenhum endereço encontrado para a busca informada.');
      }
    } catch {
      setErrorMessage('Falha na busca de endereço. Verifique sua conexão.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectAddressItem = (item: AddressSearchResult) => {
    setLatInput(item.lat.toFixed(6));
    setLngInput(item.lng.toFixed(6));
    const detectedBairro = item.subtitle ? item.subtitle.split('·')[0].trim() : '';
    if (detectedBairro) setBairroInput(detectedBairro);
    setAddressInput(item.displayName || item.shortTitle);
    setAddressSearchResults([]);

    const match = triggerAutoDelegaciaMatch(item.lat, item.lng, detectedBairro, item.displayName || item.shortTitle);
    if (match) {
      setSuccessMessage(`Área selecionada! Delegacia vinculada: ${match.delegaciaName}`);
    }
  };

  // Handle Current GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocalização não suportada pelo seu navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatInput(lat.toFixed(6));
        setLngInput(lng.toFixed(6));
        const match = triggerAutoDelegaciaMatch(lat, lng, bairroInput, addressInput);
        if (match) {
          setSuccessMessage(`GPS capturado! Delegacia identificada: ${match.delegaciaName}`);
        } else {
          setSuccessMessage('Coordenadas capturadas via GPS com sucesso!');
        }
      },
      err => {
        setErrorMessage(`Não foi possível obter sua localização: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fallback: use Delegacia coordinates if lat/lng are empty
  const handleUseDelegaciaCoords = () => {
    const d = allDelegacias.find(del => del.id === selectedDelegaciaId);
    if (d?.lat != null && d?.lng != null) {
      setLatInput(d.lat.toFixed(6));
      setLngInput(d.lng.toFixed(6));
      setBairroInput(d.municipio);
      setSuccessMessage(`Coordenadas da delegacia "${d.name}" aplicadas.`);
    } else {
      setErrorMessage('A delegacia selecionada não possui coordenadas cadastradas.');
    }
  };

  return {
    delegaciaUfFilter,
    setDelegaciaUfFilter,
    delegaciaSearch,
    setDelegaciaSearch,
    selectedDelegaciaId,
    setSelectedDelegaciaId,
    autoMatchInfo,
    setAutoMatchInfo,
    isManuallyOverridden,
    setIsManuallyOverridden,
    addressInput,
    setAddressInput,
    bairroInput,
    setBairroInput,
    latInput,
    setLatInput,
    lngInput,
    setLngInput,
    isSearchingAddress,
    addressSearchResults,
    triggerAutoDelegaciaMatch,
    allDelegacias,
    filteredDelegacias,
    handleSearchAddress,
    handleSelectAddressItem,
    handleUseCurrentLocation,
    handleUseDelegaciaCoords
  };
}
