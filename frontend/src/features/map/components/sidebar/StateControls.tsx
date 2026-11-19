import { MapPin } from 'lucide-react';
import type { LeftSidebarProps } from '../../../../components/LeftSidebar';
import type { UfMetadataInfo } from '../../../../data/brasilEstadosData';

type Props = Pick<LeftSidebarProps, 'estadoScope' | 'setEstadoScope' | 'onSelectUf'> & {
  filteredUfs: UfMetadataInfo[];
  ufSearch: string;
  setUfSearch: (search: string) => void;
  closeIfMobile: () => void;
};

export function StateControls({
  estadoScope, setEstadoScope, onSelectUf, filteredUfs, ufSearch, setUfSearch, closeIfMobile
}: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        {(
          [
            { id: 'TODOS', label: 'Todos (RJ+MG+ES)' },
            { id: 'RJ', label: 'Rio de Janeiro' },
            { id: 'MG', label: 'Minas Gerais' },
            { id: 'ES', label: 'Espírito Santo' },
            { id: 'MG_ES', label: 'MG + ES' }
          ] as const
        ).map(sc => (
          <button
            key={sc.id}
            onClick={() => setEstadoScope(sc.id)}
            className={`px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              estadoScope === sc.id
                ? 'bg-[#00A650]/10 border-[#00A650] text-[#008744]'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {sc.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={ufSearch}
        onChange={e => setUfSearch(e.target.value)}
        placeholder="Filtrar estado com dados (RJ, MG, ES)..."
        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA]"
      />

      <div className="space-y-1 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
        {filteredUfs.map(u => {
          const isIntegrado = u.statusSig !== 'MALHA_IBGE_DISPONIVEL';
          return (
            <button
              key={u.uf}
              onClick={() => {
                onSelectUf(u);
                closeIfMobile();
              }}
              className="w-full text-left p-2.5 md:p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-7 h-7 rounded font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ${
                    u.uf === 'RJ'
                      ? 'bg-[#3483FA]/15 text-[#2968C8] border border-[#3483FA]/30'
                      : isIntegrado
                      ? 'bg-[#00A650]/15 text-[#008744] border border-[#00A650]/30'
                      : 'bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  {u.uf}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{u.nome}</div>
                  <div className="text-[10px] text-slate-600 truncate">
                    {u.regiao} · {u.orgaoPC} / {u.orgaoPM}
                  </div>
                </div>
              </div>
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
