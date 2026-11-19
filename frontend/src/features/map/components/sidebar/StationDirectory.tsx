import { ChevronRight } from 'lucide-react';
import type { LeftSidebarProps } from '../../../../components/LeftSidebar';
import type { TerritorialRegistry } from '../../../../types';
import type { DelegaciaTerritorialMgEs } from '../../../../types/delegaciaTerritorial';

type Props = Pick<LeftSidebarProps, 'estadoScope' | 'onSelectDelegaciaMgEs' | 'selectedDelegaciaMgEsId' | 'onSelectCISP' | 'selectedCispId'> & {
  filteredCisps: TerritorialRegistry['cisps'][number][];
  filteredDelegaciasMgEs: DelegaciaTerritorialMgEs[];
  closeIfMobile: () => void;
};

export function StationDirectory({
  estadoScope, onSelectDelegaciaMgEs, selectedDelegaciaMgEsId, onSelectCISP, selectedCispId, filteredCisps, filteredDelegaciasMgEs, closeIfMobile
}: Props) {
  return (
    <div className="space-y-1.5">
      {(estadoScope === 'MG' || estadoScope === 'ES' || estadoScope === 'MG_ES') && (
        <div className="space-y-1.5">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
            <span>Delegacias {estadoScope === 'ES' ? 'PCES' : estadoScope === 'MG' ? 'PCMG' : 'MG & ES'}</span>
            <span className="font-mono text-[#008744] font-bold">{filteredDelegaciasMgEs.length} unidades</span>
          </div>

          {filteredDelegaciasMgEs.map(del => (
            <button
              key={del.id}
              onClick={() => {
                onSelectDelegaciaMgEs?.(del);
                closeIfMobile();
              }}
              className={`w-full text-left p-2.5 md:p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer group ${
                selectedDelegaciaMgEsId === del.id
                  ? 'bg-[#FFE600]/30 border-[#2D3277] text-slate-900 shadow-sm'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      del.uf === 'ES'
                        ? 'bg-[#00A650]/10 text-[#008744] border-[#00A650]/30'
                        : 'bg-[#3483FA]/10 text-[#2968C8] border-[#3483FA]/30'
                    }`}
                  >
                    {del.orgao}
                  </span>
                  <span className="font-bold text-xs text-slate-900 truncate group-hover:text-[#2D3277]">
                    {del.nomeCurto}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 truncate mt-0.5">
                  {del.municipio} - {del.uf} • {del.regional}
                </div>
                <div className="text-[9.5px] text-slate-500 truncate mt-0.5">
                  Jurisdição: {del.bairros.slice(0, 3).join(', ')}
                  {del.bairros.length > 3 ? ` (+${del.bairros.length - 3} bairros)` : ''}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-1 group-hover:text-[#2D3277]" />
            </button>
          ))}
        </div>
      )}

      {(estadoScope === 'RJ' || estadoScope === 'TODOS') && (
        <div className="space-y-1.5">
          {estadoScope === 'TODOS' && (
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-1 mt-3 mb-1">
              <span>Rio de Janeiro (PCERJ)</span>
              <span className="font-mono text-[#3483FA] font-bold">{filteredCisps.length} CISPs</span>
            </div>
          )}
          {filteredCisps.map(cisp => (
            <button
              key={cisp.cisp}
              onClick={() => {
                onSelectCISP(cisp.cisp);
                closeIfMobile();
              }}
              className={`w-full text-left p-2.5 md:p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                selectedCispId === cisp.cisp
                  ? 'bg-[#FFE600]/30 border-[#2D3277] text-slate-900 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#2D3277]">{cisp.cisp_formatado}</span>
                  <span className="text-[11px] text-slate-900 font-medium truncate">
                    {cisp.nome_oficial.replace(`${cisp.cisp_formatado} - `, '')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 truncate">
                  {cisp.municipio} • {cisp.batalhao}
                </div>
                {cisp.bairros && cisp.bairros.length > 0 && (
                  <div className="text-[9.5px] text-slate-500 truncate mt-0.5">
                    Atende: {cisp.bairros.slice(0, 3).join(', ')}
                    {cisp.bairros.length > 3 ? ` (+${cisp.bairros.length - 3})` : ''}
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
