import { ShieldAlert } from 'lucide-react';
import type { LeftSidebarProps } from '../../../../components/LeftSidebar';
import { FAC_CATALOG, FAC_ORDER, FACCAO_COUNTS } from '../../../../data/faccoesPrecisas';

type Props = Pick<LeftSidebarProps, 'visiblePreciseFactions' | 'setVisiblePreciseFactions'>;

export function FactionLegend({
  visiblePreciseFactions, setVisiblePreciseFactions
}: Props) {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            Dados de Riscos (ago/2026)
          </span>
          <span className="font-mono text-[#2D3277] font-bold">1.695 áreas</span>
        </span>

        <div className="space-y-1.5 text-[11px]">
          {FAC_ORDER.map(code => {
            const meta = FAC_CATALOG[code];
            const isOn = visiblePreciseFactions[code];
            return (
              <label
                key={code}
                className={`flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 cursor-pointer transition-opacity ${
                  isOn ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={e =>
                      setVisiblePreciseFactions(prev => ({
                        ...prev,
                        [code]: e.target.checked
                      }))
                    }
                    className="rounded border-slate-300 text-[#3483FA] focus:ring-0"
                  />
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: meta.color }} />
                  <span className="text-slate-800 font-medium truncate">{meta.label}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-600 shrink-0">{FACCAO_COUNTS[code]}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-600 leading-relaxed">
        <strong className="text-slate-900">Fontes Públicas Consolidadas:</strong> Dados de Riscos (base ago/2026 — 1.695 polígonos por comunidade), Observatório GENI-UFF, Instituto Fogo Cruzado, MP-RJ (GAECO) e ISP-RJ.
      </div>
    </div>
  );
}
