import React from 'react';
import { Database } from 'lucide-react';

export interface MapHoverTooltipData {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  sub: string;
  type: string;
  color?: string;
  source?: string;
  sourceDetail?: string;
}

export const MapHoverTooltip: React.FC<{ tooltip: MapHoverTooltipData }> = ({ tooltip }) => {
  if (!tooltip.visible) return null;
  return (
    <div className="absolute pointer-events-none z-30 px-3 py-2 bg-white/95 border border-[#3483FA]/40 rounded-xl shadow-xl text-slate-900 text-xs backdrop-blur-sm max-w-xs" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
      <div className="flex items-center gap-1.5 mb-0.5">
        {tooltip.color && <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: tooltip.color }} />}
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FFE600] text-[#2D3277] font-mono font-bold uppercase shrink-0">{tooltip.type}</span>
        <span className="font-bold text-slate-900 truncate">{tooltip.title}</span>
      </div>
      {tooltip.sub && <div className="text-[11px] text-slate-700 truncate">{tooltip.sub}</div>}
      {tooltip.source && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-200 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] text-[#2D3277] font-semibold">
            <Database className="w-3 h-3 shrink-0 text-[#3483FA]" />
            <span className="truncate">Origem: {tooltip.source}</span>
          </div>
          {tooltip.sourceDetail && <div className="text-[10px] text-slate-600 leading-snug">{tooltip.sourceDetail}</div>}
        </div>
      )}
    </div>
  );
};
