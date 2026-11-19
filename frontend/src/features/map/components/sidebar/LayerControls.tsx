import { ShieldAlert, Plus, Sliders } from 'lucide-react';
import type { LeftSidebarProps } from '../../../../components/LeftSidebar';
import type { LayerVisibility } from '../../../../types';

type Props = Pick<LeftSidebarProps, 'layers' | 'setLayers' | 'basemap' | 'setBasemap' | 'layerOpacity' | 'setLayerOpacity' | 'companyDomain' | 'totalCompanyIncidents' | 'totalCompanyRoubos' | 'onOpenIncidentModal'> & {
  toggleLayer: (layer: keyof LayerVisibility) => void;
};

export function LayerControls({
  layers, setLayers, basemap, setBasemap, layerOpacity, setLayerOpacity, companyDomain, totalCompanyIncidents, totalCompanyRoubos, onOpenIncidentModal, toggleLayer
}: Props) {
  return (
    <>
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Mapa Base (OpenLayers v9.2.4)
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'osm', label: 'OSM Padrão' },
              { id: 'voyager', label: 'Voyager Color' },
              { id: 'satellite', label: 'Satélite HD' },
              { id: 'streets', label: 'Ruas & Vias' }
            ] as const
          ).map(bm => (
            <button
              key={bm.id}
              onClick={() => setBasemap(bm.id)}
              className={`px-2.5 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                basemap === bm.id
                  ? 'bg-[#3483FA]/10 border-[#3483FA] text-[#2968C8] font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {bm.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-200">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Camadas Vetoriais
        </span>
        {(
          [
            { key: 'faccoesPrecisas', label: 'Facções Precisas (1.695 áreas)', dot: '#E0342C' },
            { key: 'cisp', label: 'Circunscrições CISP (137 DPs)', dot: '#3483FA' },
            { key: 'aisp', label: 'Áreas Integradas AISP (41 BPMs)', dot: '#D97706' },
            { key: 'risp', label: 'Regiões RISP (7 CPAs)', dot: '#00A650' },
            { key: 'delegacias', label: 'Sedes das Delegacias (PCERJ)', dot: '#2D3277' },
            { key: 'batalhoes', label: 'Sedes dos Batalhões (PMERJ)', dot: '#0891b2' },
            { key: 'focos', label: 'Focos Especiais KML (8)', dot: '#ef4444' },
            { key: 'mgEs', label: 'Sedes RISP / Regionais (MG·ES)', dot: '#00A650' },
            { key: 'brasilEstados', label: 'Limites Estaduais (RJ · MG · ES)', dot: '#64748b' }
          ] as const
        ).map(item => (
          <label
            key={item.key}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={layers[item.key]}
                onChange={() => toggleLayer(item.key)}
                className="rounded border-slate-300 text-[#3483FA] focus:ring-0"
              />
              <span className="text-slate-800 font-medium">{item.label}</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.dot }} />
          </label>
        ))}

        {companyDomain && (
          <div className="p-3 rounded-2xl bg-[#2D3277]/5 border border-[#2D3277]/20 space-y-2 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] text-[#2D3277] flex items-center gap-1.5 uppercase">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Ocorrências (@{companyDomain})</span>
              </span>
              {totalCompanyRoubos > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-bold">
                  {totalCompanyRoubos} {totalCompanyRoubos === 1 ? 'roubo' : 'roubos'}
                </span>
              )}
            </div>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.corporateHeatmap !== false}
                  onChange={() =>
                    setLayers(prev => ({
                      ...prev,
                      corporateHeatmap: prev.corporateHeatmap === false ? true : false
                    }))
                  }
                  className="rounded border-slate-300 text-red-600 focus:ring-0"
                />
                <span className="text-slate-800 font-bold text-xs">Mapa de Calor da Empresa</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={layers.corporateIncidents !== false}
                  onChange={() =>
                    setLayers(prev => ({
                      ...prev,
                      corporateIncidents: prev.corporateIncidents === false ? true : false
                    }))
                  }
                  className="rounded border-slate-300 text-orange-600 focus:ring-0"
                />
                <span className="text-slate-800 font-bold text-xs">Pontos de Ocorrências ({totalCompanyIncidents})</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0" />
            </label>

            {onOpenIncidentModal && (
              <button
                type="button"
                onClick={onOpenIncidentModal}
                className="w-full py-2 rounded-xl bg-[#2D3277] hover:bg-[#1E2355] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#FFE600]" />
                <span>+ Registrar Ocorrência</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-1.5 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between text-slate-700">
          <span className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
            <Sliders className="w-3.5 h-3.5 text-[#3483FA]" />
            Opacidade Polígonos CISP
          </span>
          <span className="font-mono font-bold text-[#3483FA]">{Math.round(layerOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={0.85}
          step={0.05}
          value={layerOpacity}
          onChange={e => setLayerOpacity(parseFloat(e.target.value))}
          className="w-full accent-[#3483FA] cursor-pointer"
        />
      </div>
    </>
  );
}
