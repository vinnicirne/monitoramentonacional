import React from 'react';
import { createPortal } from 'react-dom';
import { Database, ExternalLink, X } from 'lucide-react';

export interface MapFeaturePopupData {
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

interface MapFeaturePopupProps {
  container: HTMLElement | null;
  popup: MapFeaturePopupData | null;
  onClose: () => void;
}

export const MapFeaturePopup: React.FC<MapFeaturePopupProps> = ({ container, popup, onClose }) => {
  if (!container) return null;

  return createPortal(
    popup?.visible ? (
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
      </div>
    ) : null,
    container
  );
};
