import React from 'react';
import { Compass, LocateFixed, Navigation, ShieldAlert, X } from 'lucide-react';
import type { Map } from 'ol';
import type { TerritorialRegistry } from '../../../types';
import type { EstadoScope } from '../../../types/sigBase';
import type { CorporatePackageIncident } from '../../../types/admin';
import type { AddressSearchResult } from '../../../utils/geocoding';
import type { FaccaoSearchEntry } from '../../../data/faccoesPrecisas';
import type { DelegaciaTerritorialMgEs } from '../../../types/delegaciaTerritorial';
import { focusMapAt } from '../services/mapCamera';
import { MapSearchBar } from '../../../components/MapSearchBar';
import { LiveGpsHud, type LiveGpsInfo } from './LiveGpsHud';

interface MapFloatingControlsProps {
  mapRef: React.MutableRefObject<Map | null>;
  registry: TerritorialRegistry | null;
  estadoScope: EstadoScope;
  getMapCenter: () => { lat: number; lng: number } | null;
  searchQuery: string;
  setSearchQuery?: (query: string) => void;
  onSelectCISP?: (cispId: number) => void;
  onSelectCommunity?: (entry: FaccaoSearchEntry) => void;
  onSelectAddress?: (address: AddressSearchResult) => void;
  onSelectDelegaciaMgEs?: (delegacia: DelegaciaTerritorialMgEs) => void;
  isTrackingLocation: boolean;
  onToggleLiveLocation?: () => void;
  onResetView?: () => void;
  selectedAddress?: (AddressSearchResult & { ts: number }) | null;
  onClearAddress?: () => void;
  clearAddressPopup: () => void;
  liveGps: LiveGpsInfo | null;
  gpsError: string | null;
  followUser: boolean;
  setFollowUser: (follow: boolean) => void;
  companyDomain: string;
  companyIncidents: CorporatePackageIncident[];
  onRequestRegisterIncident?: (coords?: { lat: number; lng: number }) => void;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  mapRef,
  registry,
  estadoScope,
  getMapCenter,
  searchQuery,
  setSearchQuery,
  onSelectCISP,
  onSelectCommunity,
  onSelectAddress,
  onSelectDelegaciaMgEs,
  isTrackingLocation,
  onToggleLiveLocation,
  onResetView,
  selectedAddress,
  onClearAddress,
  clearAddressPopup,
  liveGps,
  gpsError,
  followUser,
  setFollowUser,
  companyDomain,
  companyIncidents,
  onRequestRegisterIncident
}) => (
  <>
    {onToggleLiveLocation && (
      <button
        onClick={onToggleLiveLocation}
        title={isTrackingLocation ? 'Desativar localização em tempo real' : 'Ativar minha localização em tempo real (GPS)'}
        className={`absolute top-[10.1rem] right-3 md:top-[6.25rem] md:right-4 z-20 w-10 h-10 md:w-9 md:h-9 rounded-xl md:rounded-lg border flex items-center justify-center shadow-md transition-all cursor-pointer ${isTrackingLocation ? 'bg-[#00A650] border-[#008744] text-white shadow-[#00A650]/30 ring-2 ring-[#00A650]/30' : 'bg-white/95 hover:bg-[#3483FA] border-slate-300 text-[#2D3277] hover:text-white hover:border-[#2968C8]'}`}
      >
        <LocateFixed className={`w-4 h-4 ${isTrackingLocation ? 'animate-pulse' : ''}`} />
      </button>
    )}

    {onResetView && (
      <button onClick={onResetView} title="Centralizar Escopo Atual" className="md:hidden absolute top-[13.1rem] right-3 z-20 w-10 h-10 rounded-xl bg-white/95 hover:bg-[#FFE600] border border-slate-300 text-[#2D3277] flex items-center justify-center shadow-md transition-all cursor-pointer">
        <Compass className="w-4 h-4" />
      </button>
    )}

    <div className="absolute top-2.5 left-2.5 right-2.5 md:top-3 md:left-3 md:right-auto z-20 flex flex-col gap-2 md:max-w-[420px]">
      {setSearchQuery && onSelectCISP && onSelectCommunity && onSelectAddress && onToggleLiveLocation && (
        <MapSearchBar
          registry={registry}
          estadoScope={estadoScope}
          getMapCenter={getMapCenter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectCISP={onSelectCISP}
          onSelectCommunity={onSelectCommunity}
          onSelectAddress={onSelectAddress}
          onSelectDelegaciaMgEs={onSelectDelegaciaMgEs}
          isTrackingLocation={isTrackingLocation}
          onToggleLiveLocation={onToggleLiveLocation}
        />
      )}

      {selectedAddress && !isTrackingLocation && (
        <div className="w-[calc(100%-3.5rem)] md:w-[420px] max-w-full bg-white/95 border border-[#3483FA]/40 rounded-xl px-3 py-2 shadow-lg backdrop-blur-md text-xs flex items-center gap-2.5">
          <Navigation className="w-4 h-4 text-[#3483FA] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-900 truncate">{selectedAddress.shortTitle}</div>
            <div className="text-[10px] text-slate-600 truncate">{selectedAddress.subtitle}</div>
          </div>
          {onClearAddress && (
            <button onClick={() => { onClearAddress(); clearAddressPopup(); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer shrink-0" title="Remover marcador do endereço">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <LiveGpsHud
        isTracking={Boolean(isTrackingLocation)}
        liveGps={liveGps}
        gpsError={gpsError}
        followUser={followUser}
        onFollowChange={setFollowUser}
        onStop={onToggleLiveLocation}
        onCenter={gps => { if (mapRef.current) focusMapAt(mapRef.current, gps.lng, gps.lat, 16.5, 500); }}
      />
    </div>

    {companyDomain && (
      <div className="absolute top-[16.5rem] md:top-3 md:right-16 z-20 flex items-center gap-2">
        {onRequestRegisterIncident && (
          <button onClick={() => onRequestRegisterIncident()} className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 border border-red-400/40 backdrop-blur-md cursor-pointer transition-all transform hover:scale-[1.02]" title={`Registrar Ocorrência Confidencial (@${companyDomain})`}>
            <ShieldAlert className="w-4 h-4 text-[#FFE600] shrink-0" />
            <span>Registrar Ocorrência</span>
            {companyIncidents.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white/20 font-mono text-[10px]">{companyIncidents.length}</span>}
          </button>
        )}
      </div>
    )}
  </>
);
