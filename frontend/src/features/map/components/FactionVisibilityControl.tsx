import React from 'react';
import { Flame } from 'lucide-react';
import { FAC_CATALOG, FAC_ORDER, FACCAO_COUNTS, type CodigoFaccaoPrecisa } from '../../../data/faccoesPrecisas';

interface FactionVisibilityControlProps {
  isOpen: boolean;
  onClose: () => void;
  visibleFactions: Record<CodigoFaccaoPrecisa, boolean>;
  setVisibleFactions: React.Dispatch<React.SetStateAction<Record<CodigoFaccaoPrecisa, boolean>>>;
}

const bulkActionClassName = 'min-h-10 rounded-lg border border-slate-300 px-2 py-1.5 font-semibold text-[#2D3277] enabled:cursor-pointer enabled:hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3483FA] disabled:opacity-45';

export const FactionVisibilityControl: React.FC<FactionVisibilityControlProps> = ({
  isOpen,
  onClose,
  visibleFactions,
  setVisibleFactions
}) => {
  const allSelected = FAC_ORDER.every(code => visibleFactions[code]);
  const anySelected = FAC_ORDER.some(code => visibleFactions[code]);

  const setAllFactions = (enabled: boolean) => {
    setVisibleFactions(previous => {
      const next = { ...previous };
      for (const code of FAC_ORDER) next[code] = enabled;
      return next;
    });
  };

  return (
    <div className="relative pointer-events-auto">
      {isOpen && (
        <>
          <div onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30 md:hidden" />
          <div className="fixed inset-x-0 bottom-14 z-40 rounded-t-3xl border-t border-slate-200 bg-white p-4 shadow-2xl space-y-2.5 text-xs md:absolute md:inset-x-auto md:bottom-full md:right-0 md:mb-2 md:w-80 md:rounded-2xl md:border md:border-slate-200 md:p-3.5">
            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-1 md:hidden" />
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-600" />
                <span>Dados de Riscos (ago/2026)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">1.695 polígonos</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={bulkActionClassName} disabled={allSelected} onClick={() => setAllFactions(true)}>
                Selecionar todos
              </button>
              <button type="button" className={bulkActionClassName} disabled={!anySelected} onClick={() => setAllFactions(false)}>
                Desmarcar todos
              </button>
            </div>

            <div className="space-y-1.5 max-h-[45dvh] overflow-y-auto">
              {FAC_ORDER.map(code => {
                const metadata = FAC_CATALOG[code];
                const enabled = visibleFactions[code];
                return (
                  <label key={code} className={`flex items-center justify-between p-2 md:p-1.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer transition-opacity ${enabled ? 'opacity-100' : 'opacity-45'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={event => setVisibleFactions(previous => ({ ...previous, [code]: event.target.checked }))}
                        className="rounded border-slate-300 text-[#3483FA] focus:ring-0"
                      />
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: metadata.color }} />
                      <span className="font-medium text-slate-800 truncate">{metadata.label}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-600 tabular-nums shrink-0">{FACCAO_COUNTS[code]}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500">
              <span>Fonte: Dados de Riscos · GENI-UFF</span>
              <button onClick={onClose} className="text-[#3483FA] hover:text-[#2968C8] font-semibold cursor-pointer py-1 px-2">
                Fechar ▼
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
