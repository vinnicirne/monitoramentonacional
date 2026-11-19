import React from 'react';
import { Crosshair, Square } from 'lucide-react';

export interface LiveGpsInfo {
  lat: number;
  lng: number;
  accuracy: number;
  speedKmh: number | null;
  updatedAt: string;
  streetAddress: string | null;
  cispLabel: string | null;
  factionLabel: string | null;
  factionColor: string | null;
}

interface LiveGpsHudProps {
  isTracking: boolean;
  liveGps: LiveGpsInfo | null;
  gpsError: string | null;
  followUser: boolean;
  onFollowChange: (follow: boolean) => void;
  onStop?: () => void;
  onCenter: (gps: LiveGpsInfo) => void;
}

export const LiveGpsHud: React.FC<LiveGpsHudProps> = ({
  isTracking, liveGps, gpsError, followUser, onFollowChange, onStop, onCenter
}) => {
  if (!isTracking) return null;

  return (
    <div className="w-[calc(100%-3.5rem)] md:w-80 max-w-full bg-white/95 border border-[#00A650]/50 rounded-xl p-3 shadow-lg backdrop-blur-md text-xs space-y-2">
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00A650] animate-ping" />
          <span className="font-bold text-[#008744] uppercase tracking-wider text-[10px]">Localização em Tempo Real</span>
        </div>
        <div className="flex items-center gap-1">
          {liveGps && (
            <button
              onClick={() => {
                onFollowChange(true);
                onCenter(liveGps);
              }}
              title="Centralizar e seguir minha posição"
              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${followUser ? 'bg-[#00A650]/15 text-[#008744] border border-[#00A650]/35' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
            >
              <Crosshair className="w-3 h-3" />
              <span>{followUser ? 'Seguindo' : 'Centralizar'}</span>
            </button>
          )}
          {onStop && (
            <button onClick={onStop} title="Parar rastreamento GPS" className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer">
              <Square className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {gpsError ? (
        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">{gpsError}</div>
      ) : liveGps ? (
        <div className="space-y-1.5">
          {liveGps.streetAddress && <div className="text-slate-900 font-semibold leading-snug">{liveGps.streetAddress}</div>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-600">
            <span>{liveGps.lat.toFixed(5)}, {liveGps.lng.toFixed(5)}</span>
            <span>±{liveGps.accuracy}m</span>
            {liveGps.speedKmh !== null && <span>{liveGps.speedKmh} km/h</span>}
            <span>{liveGps.updatedAt}</span>
          </div>
          {(liveGps.cispLabel || liveGps.factionLabel) && (
            <div className="pt-1.5 border-t border-slate-200 space-y-1 text-[11px]">
              {liveGps.cispLabel && <div className="text-[#2D3277] font-medium">Jurisdição: <span className="font-bold">{liveGps.cispLabel}</span></div>}
              {liveGps.factionLabel && <div className="flex items-center gap-1.5 text-slate-800 font-medium"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: liveGps.factionColor || '#ef4444' }} /><span>Área mapeada: {liveGps.factionLabel}</span></div>}
            </div>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-slate-600">Obtendo sinal GPS em alta precisão...</div>
      )}
    </div>
  );
};
