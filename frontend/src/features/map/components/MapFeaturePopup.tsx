import React from 'react';
import { createPortal } from 'react-dom';
import { Database, ExternalLink, X } from 'lucide-react';
import type { CorporatePackageIncident } from '../../../types/admin';
import type { CorporateIncidentGroup } from '../services/corporateIncidentFeatures';

interface TerritorialPopupData {
  visible: boolean;
  title: string;
  factionLabel: string;
  factionShort: string;
  color: string;
  cispLabel?: string;
  source: string;
  sourceUrl?: string;
  period: string;
  methodologyNote: string;
}

export type MapFeaturePopupData = TerritorialPopupData | { visible: true; incidentGroup: CorporateIncidentGroup };

interface MapFeaturePopupProps {
  container: HTMLElement | null;
  popup: MapFeaturePopupData | null;
  onClose: () => void;
  onSelectIncident?: (incident: CorporatePackageIncident) => void;
}

export const MapFeaturePopup: React.FC<MapFeaturePopupProps> = ({ container, popup, onClose, onSelectIncident }) => {
  if (!container || !popup?.visible) return null;

  if ('incidentGroup' in popup) {
    const { areaName, incidents } = popup.incidentGroup;
    return createPortal(
      <section aria-label={`Ocorrências na área da ${areaName}`} className="pointer-events-auto w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-sm font-bold text-[#2D3277]">{areaName}</h2>
            <p className="mt-0.5 text-slate-600">{incidents.length} ocorrências na área</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar ocorrências da área" className="rounded p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#3483FA]">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-2 max-h-[min(35dvh,14rem)] space-y-1 overflow-y-auto">
          {incidents.map(incident => (
            <li key={`${incident.companyDomain}/${incident.id}`}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectIncident?.(incident);
                }}
                className="min-h-11 w-full rounded-lg px-2 py-1.5 text-left hover:bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#3483FA]"
              >
                <span className="block break-words font-semibold">{incident.trackingCode || incident.id}</span>
                {incident.boNumber && <span className="text-slate-600">B.O. {incident.boNumber}</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>,
      container
    );
  }

  return createPortal(
    <div className="z-30 pointer-events-auto w-[min(18rem,calc(100vw-2rem))] bg-white border border-slate-200 rounded-xl shadow-2xl p-3 text-slate-900 text-xs">
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider shrink-0" style={{ backgroundColor: popup.color }}>
              {popup.factionShort}
            </span>
            {popup.cispLabel && <span className="text-[10px] font-mono text-[#3483FA] font-semibold truncate">{popup.cispLabel}</span>}
          </div>
          <div className="font-bold text-sm text-[#2D3277] leading-snug">{popup.title}</div>
          <div className="text-[11px] text-slate-700 mt-0.5">{popup.factionLabel}</div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 shrink-0 cursor-pointer" title="Fechar popup">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="pt-2 space-y-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2D3277]">
          <Database className="w-3 h-3 shrink-0 text-[#3483FA]" />
          <span>Origem dos Dados</span>
        </div>
        <div className="text-slate-900 font-semibold">{popup.source}</div>
        <div className="text-[10px] text-slate-600">{popup.period}</div>
        <p className="text-[10px] text-slate-600 leading-relaxed">{popup.methodologyNote}</p>
        {popup.sourceUrl && (
          <a href={popup.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#3483FA] hover:text-[#2968C8] font-medium underline underline-offset-2 pt-0.5">
            <span>dadosderiscos.com.br/mapa-rj-risco-faccoes.html</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        )}
      </div>
    </div>,
    container
  );
};
