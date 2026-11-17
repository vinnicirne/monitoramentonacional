import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Navigation,
  MapPin,
  Flame,
  Loader2,
  LocateFixed,
  X
} from 'lucide-react';
import { TerritorialRegistry } from '../types';
import { EstadoScope } from '../types/sigBase';
import { FAC_CATALOG, FACCAO_SEARCH_INDEX, FaccaoSearchEntry } from '../data/faccoesPrecisas';
import { AddressSearchResult, searchAddressesFree } from '../utils/geocoding';
import { DELEGACIAS_MG_ES_DATA } from '../data/delegaciasMgEsData';
import { DelegaciaTerritorialMgEs } from '../types/delegaciaTerritorial';

interface MapSearchBarProps {
  registry: TerritorialRegistry | null;
  estadoScope?: EstadoScope;
  getMapCenter?: () => { lat: number; lng: number } | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectCISP: (cispId: number) => void;
  onSelectCommunity: (entry: FaccaoSearchEntry) => void;
  onSelectAddress: (address: AddressSearchResult) => void;
  onSelectDelegaciaMgEs?: (delegacia: DelegaciaTerritorialMgEs) => void;
  isTrackingLocation: boolean;
  onToggleLiveLocation: () => void;
}

export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  registry,
  estadoScope = 'RJ',
  getMapCenter,
  searchQuery,
  setSearchQuery,
  onSelectCISP,
  onSelectCommunity,
  onSelectAddress,
  onSelectDelegaciaMgEs,
  isTrackingLocation,
  onToggleLiveLocation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);
  const [addressResults, setAddressResults] = useState<AddressSearchResult[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Close dropdown cleanly when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  // Debounced free OpenStreetMap + ViaCEP address search (Nominatim + Photon parallel)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      setAddressResults([]);
      setIsSearchingAddress(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchingAddress(true);
    const timer = setTimeout(() => {
      const center = getMapCenter?.() || null;
      searchAddressesFree(trimmed, controller.signal, {
        scope: estadoScope,
        centerLat: center?.lat,
        centerLng: center?.lng
      })
        .then(res => {
          setAddressResults(res);
          setIsSearchingAddress(false);
        })
        .catch(err => {
          if (err?.name !== 'AbortError') {
            setAddressResults([]);
            setIsSearchingAddress(false);
          }
        });
    }, 360);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, estadoScope, getMapCenter]);

  const localResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    const results: Array<{
      id: string | number;
      label: string;
      sub: string;
      type: 'CISP' | 'MUNICIPIO' | 'BAIRRO' | 'FACCAO' | 'COMUNIDADE' | 'DELEGACIA';
      cispId?: number;
      community?: FaccaoSearchEntry;
      delegaciaMgEs?: DelegaciaTerritorialMgEs;
      color?: string;
    }> = [];

    // Delegacias de MG e ES + Bairros da jurisdição
    DELEGACIAS_MG_ES_DATA.forEach(del => {
      if (results.length >= 16) return;
      const normNome = del.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normCurto = del.nomeCurto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normMuni = del.municipio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchingBairro = del.bairros.find(b =>
        b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
      );

      if (normNome.includes(q) || normCurto.includes(q)) {
        results.push({
          id: `del-${del.id}`,
          label: `${del.nomeCurto} (${del.orgao} - ${del.uf})`,
          sub: `${del.municipio} • ${del.jurisdicao}`,
          type: 'DELEGACIA',
          delegaciaMgEs: del,
          color: del.cor
        });
      } else if (matchingBairro) {
        results.push({
          id: `del-bairro-${del.id}-${matchingBairro}`,
          label: `Bairro: ${matchingBairro} (${del.uf})`,
          sub: `Jurisdição: ${del.nomeCurto} (${del.orgao})`,
          type: 'BAIRRO',
          delegaciaMgEs: del,
          color: del.cor
        });
      } else if (normMuni.includes(q)) {
        if (!results.some(r => r.delegaciaMgEs?.id === del.id)) {
          results.push({
            id: `del-muni-${del.id}`,
            label: `${del.municipio} - ${del.uf} (${del.nomeCurto})`,
            sub: `${del.regional} • ${del.totalBairros} Bairros`,
            type: 'MUNICIPIO',
            delegaciaMgEs: del,
            color: del.cor
          });
        }
      }
    });

    for (const item of FACCAO_SEARCH_INDEX) {
      if (item.normNome.includes(q)) {
        const meta = FAC_CATALOG[item.f];
        results.push({
          id: `com-${item.nome}-${results.length}`,
          label: item.nome,
          sub: `${meta.label} · Base Dados de Riscos (ago/2026)`,
          type: 'COMUNIDADE',
          community: item,
          color: meta.color
        });
        if (results.length >= 6) break;
      }
    }

    if (registry) {
      Object.values(registry.cisps).forEach(cisp => {
        if (results.length >= 12) return;
        const normNome = cisp.nome_oficial.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normMuni = cisp.municipio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normFmt = cisp.cisp_formatado.toLowerCase();

        if (normNome.includes(q) || normFmt.includes(q) || cisp.cisp.toString() === q) {
          results.push({
            id: `cisp-${cisp.cisp}`,
            cispId: cisp.cisp,
            label: `${cisp.cisp_formatado} - ${cisp.nome_oficial}`,
            sub: `${cisp.municipio} • AISP ${cisp.aisp} (${cisp.batalhao})`,
            type: 'CISP'
          });
        } else if (normMuni.includes(q)) {
          if (!results.some(r => r.cispId === cisp.cisp)) {
            results.push({
              id: `muni-${cisp.cisp}`,
              cispId: cisp.cisp,
              label: `${cisp.municipio} (${cisp.cisp_formatado})`,
              sub: `${cisp.batalhao} • RISP ${cisp.risp}`,
              type: 'MUNICIPIO'
            });
          }
        } else if (cisp.bairros.some(b => b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q))) {
          const matchingBairro = cisp.bairros.find(b =>
            b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
          );
          results.push({
            id: `bairro-${cisp.cisp}-${matchingBairro}`,
            cispId: cisp.cisp,
            label: `Bairro: ${matchingBairro}`,
            sub: `Atendido pela ${cisp.cisp_formatado} • ${cisp.batalhao}`,
            type: 'BAIRRO'
          });
        } else if (cisp.dinamica_territorial?.faccao.toLowerCase().includes(q)) {
          results.push({
            id: `fac-${cisp.cisp}`,
            cispId: cisp.cisp,
            label: `${cisp.cisp_formatado} - ${cisp.dinamica_territorial.faccao}`,
            sub: `Risco: ${cisp.dinamica_territorial.grau_risco} • ${cisp.municipio}`,
            type: 'FACCAO'
          });
        }
      });
    }

    return results.slice(0, 12);
  }, [registry, searchQuery]);

  const handleSearchEnter = async () => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) return;
    setShowResults(true);
    setIsSearchingAddress(true);
    try {
      const center = getMapCenter?.() || null;
      const res = await searchAddressesFree(trimmed, undefined, {
        scope: estadoScope,
        centerLat: center?.lat,
        centerLng: center?.lng
      });
      setAddressResults(res);
      if (res.length === 1 && localResults.length === 0) {
        onSelectAddress(res[0]);
        setShowResults(false);
      }
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const showEmptyNotice =
    showResults &&
    !isSearchingAddress &&
    searchQuery.trim().length >= 3 &&
    localResults.length === 0 &&
    addressResults.length === 0;

  return (
    <div ref={containerRef} className="relative w-full md:w-[420px] max-w-full">
      <div className="flex items-center gap-1.5 bg-white/95 border border-slate-200 rounded-xl p-1.5 shadow-lg backdrop-blur-md">
        <div className="relative flex-1 flex items-center min-w-0">
          <Search className="w-4 h-4 text-[#2D3277]/70 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchEnter();
              }
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Buscar rua, CEP, CISP ou comunidade..."
            className="w-full min-w-0 bg-transparent pl-2.5 pr-7 py-2 md:py-1.5 text-sm md:text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none"
          />
          {isSearchingAddress && (
            <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 animate-spin text-[#3483FA] mr-1.5 shrink-0" />
          )}
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setAddressResults([]);
                setShowResults(false);
              }}
              className="p-2 md:p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
              title="Limpar busca"
            >
              <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
          )}
        </div>

        <div className="h-6 md:h-5 w-px bg-slate-200 shrink-0" />

        <button
          onClick={onToggleLiveLocation}
          title={
            isTrackingLocation
              ? 'Localização em tempo real ativa (clique para parar)'
              : 'Mostrar minha localização em tempo real (GPS)'
          }
          className={`px-3 py-2 md:px-2.5 md:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            isTrackingLocation
              ? 'bg-[#00A650] text-white shadow-sm'
              : 'bg-slate-100 hover:bg-[#FFE600] text-[#2D3277] border border-slate-200 hover:border-[#E6CF00]'
          }`}
        >
          <LocateFixed className={`w-4 h-4 md:w-3.5 md:h-3.5 ${isTrackingLocation ? 'animate-pulse' : 'text-[#3483FA]'}`} />
          <span className="text-[11px]">{isTrackingLocation ? 'Ao Vivo' : 'GPS'}</span>
        </button>
      </div>

      {showResults && (localResults.length > 0 || addressResults.length > 0 || isSearchingAddress || showEmptyNotice) && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 z-50 max-h-[55dvh] md:max-h-96 overflow-y-auto">
          {showEmptyNotice && (
            <div className="px-3.5 py-3 text-xs text-slate-700 space-y-1">
              <div className="font-semibold text-amber-700">Nenhum endereço exato encontrado</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tente buscar sem complemento, incluir o bairro/município (ex:{' '}
                <span className="text-slate-900 font-medium">Rua Maria Morais, São Gonçalo</span>) ou digitar o{' '}
                <span className="text-[#3483FA] font-semibold">CEP</span> (ex: 24740-110).
              </p>
            </div>
          )}
          {(addressResults.length > 0 || isSearchingAddress) && (
            <div>
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-[#2D3277] bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span>Endereços · OpenStreetMap (Free)</span>
                {isSearchingAddress && <span className="text-[9px] text-slate-500 font-normal">Buscando...</span>}
              </div>
              {addressResults.map(addr => (
                <button
                  key={addr.id}
                  onClick={() => {
                    onSelectAddress(addr);
                    setShowResults(false);
                  }}
                  className="w-full text-left px-3 py-2.5 md:py-2 hover:bg-[#3483FA]/10 border-b border-slate-100 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-[#3483FA] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">{addr.shortTitle}</div>
                    <div className="text-[11px] text-slate-600 truncate">{addr.subtitle}</div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3483FA]/10 text-[#2968C8] border border-[#3483FA]/25 font-mono font-bold uppercase shrink-0">
                    ENDEREÇO
                  </span>
                </button>
              ))}
            </div>
          )}

          {localResults.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-600 bg-slate-50 border-b border-slate-200">
                Base Territorial & Facções ({localResults.length})
              </div>
              {localResults.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.delegaciaMgEs && onSelectDelegaciaMgEs) {
                      onSelectDelegaciaMgEs(item.delegaciaMgEs);
                    } else if (item.community) {
                      onSelectCommunity(item.community);
                    } else if (item.cispId) {
                      onSelectCISP(item.cispId);
                    }
                    setShowResults(false);
                  }}
                  className="w-full text-left px-3 py-2.5 md:py-2 hover:bg-[#3483FA]/10 border-b border-slate-100 last:border-b-0 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  {item.type === 'COMUNIDADE' ? (
                    <Flame className="w-4 h-4 mt-0.5 shrink-0" style={{ color: item.color || '#ef4444' }} />
                  ) : (
                    <MapPin className="w-4 h-4 text-[#2D3277] mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-600 truncate">{item.sub}</div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono font-semibold uppercase shrink-0">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
