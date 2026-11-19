import React from 'react';
import { Building2, MapPin, Navigation, RefreshCw, Search } from 'lucide-react';
import type { AddressSearchResult } from '../../../utils/geocoding';

interface IncidentLocationFieldsProps {
  address: string;
  onAddressChange: (value: string) => void;
  isSearching: boolean;
  onSearch: () => void;
  searchResults: AddressSearchResult[];
  onSelectResult: (result: AddressSearchResult) => void;
  onUseCurrentLocation: () => void;
  onUseStationCoordinates: () => void;
  neighborhood: string;
  onNeighborhoodChange: (value: string) => void;
  latitude: string;
  onLatitudeChange: (value: string) => void;
  longitude: string;
  onLongitudeChange: (value: string) => void;
}

export const IncidentLocationFields: React.FC<IncidentLocationFieldsProps> = ({
  address,
  onAddressChange,
  isSearching,
  onSearch,
  searchResults,
  onSelectResult,
  onUseCurrentLocation,
  onUseStationCoordinates,
  neighborhood,
  onNeighborhoodChange,
  latitude,
  onLatitudeChange,
  longitude,
  onLongitudeChange
}) => (
  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
    <div className="flex items-center justify-between">
      <span className="font-bold text-slate-700 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-red-600" />
        <span>Localização Exata (Ponto no Mapa de Calor)</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onUseCurrentLocation}
          className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title="Capturar GPS Atual e Vincular DP">
          <Navigation className="w-3 h-3 text-[#3483FA]" /><span>GPS Atual</span>
        </button>
        <button type="button" onClick={onUseStationCoordinates}
          className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title="Copiar Coordenadas da Delegacia">
          <Building2 className="w-3 h-3 text-[#2D3277]" /><span>Coord. DP</span>
        </button>
      </div>
    </div>

    <div className="relative">
      <div className="flex items-center gap-2">
        <input type="text" value={address} onChange={event => onAddressChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSearch();
            }
          }}
          placeholder="Digite endereço ou localidade (ex: Rua Acacio Raposo, 415 ou Av. Brasil, Pavuna)"
          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-[#3483FA] focus:outline-none text-xs text-slate-800" />
        <button type="button" onClick={onSearch} disabled={isSearching}
          className="px-3.5 py-2 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 text-xs shadow-xs"
          title="Geocodificar endereço e puxar a delegacia responsável automaticamente">
          {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Geocodificar</span>
        </button>
      </div>

      {searchResults.length > 1 && (
        <div className="mt-1.5 max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-lg text-xs z-10 relative">
          {searchResults.map((result, index) => (
            <button key={result.id || index} type="button" onClick={() => onSelectResult(result)}
              className="w-full text-left p-2.5 hover:bg-blue-50 transition-colors flex items-start gap-2 cursor-pointer">
              <MapPin className="w-3.5 h-3.5 text-[#3483FA] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">{result.shortTitle || result.displayName}</div>
                <div className="text-[11px] text-slate-500 truncate">{result.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-slate-600 mb-0.5 text-[10px] font-bold">Bairro</label>
        <input type="text" value={neighborhood} onChange={event => onNeighborhoodChange(event.target.value)}
          placeholder="Ex: Pavuna, Bonsucesso, Tribobó"
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none text-xs text-slate-800" />
      </div>
      <div>
        <label className="block text-slate-600 mb-0.5 text-[10px] font-bold">Latitude (ex: -22.8123)</label>
        <input type="text" value={latitude} onChange={event => onLatitudeChange(event.target.value)} placeholder="-22.812300"
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono focus:outline-none text-xs text-slate-800" />
      </div>
      <div>
        <label className="block text-slate-600 mb-0.5 text-[10px] font-bold">Longitude (ex: -43.3456)</label>
        <input type="text" value={longitude} onChange={event => onLongitudeChange(event.target.value)} placeholder="-43.345600"
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono focus:outline-none text-xs text-slate-800" />
      </div>
    </div>
  </div>
);
