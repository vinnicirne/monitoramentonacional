import type { LeftSidebarProps } from '../../../../components/LeftSidebar';
import type { ChoroplethMetric, TerritorialRegistry } from '../../../../types';

type Props = Pick<LeftSidebarProps, 'selectedRispFilter' | 'setSelectedRispFilter' | 'selectedMunicipioFilter' | 'setSelectedMunicipioFilter' | 'selectedFactionFilter' | 'setSelectedFactionFilter' | 'registry' | 'choroplethMetric' | 'setChoroplethMetric'> & {
  municipios: string[];
  filteredCisps: TerritorialRegistry['cisps'][number][];
};

export function TerritorialFilters({
  selectedRispFilter, setSelectedRispFilter, selectedMunicipioFilter, setSelectedMunicipioFilter, selectedFactionFilter, setSelectedFactionFilter, registry, choroplethMetric, setChoroplethMetric, municipios, filteredCisps
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Mapa Temático (Coroplético CISP)
        </label>
        <select
          value={choroplethMetric}
          onChange={e => setChoroplethMetric(e.target.value as ChoroplethMetric)}
          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#3483FA]"
        >
          <option value="none">Delimitação Padrão (CISP)</option>
          <option value="faccao">Dinâmica Territorial / Facção</option>
          <option value="letalidade_violenta">Letalidade Violenta (ISP-RJ)</option>
          <option value="roubo_rua">Roubo de Rua (ISP-RJ)</option>
          <option value="roubo_veiculo">Roubo de Veículo (ISP-RJ)</option>
          <option value="roubo_carga">Roubo de Carga (ISP-RJ)</option>
          <option value="fuzis_apreendidos">Fuzis Apreendidos (ISP-RJ)</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Região Integrada (RISP)
        </label>
        <select
          value={selectedRispFilter}
          onChange={e => setSelectedRispFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#3483FA]"
        >
          <option value="all">Todas as 7 RISPs</option>
          {[1, 2, 3, 4, 5, 6, 7].map(r => (
            <option key={r} value={r}>
              RISP {r} {registry?.risps[r] ? `· ${registry.risps[r].regiao}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Município (RJ)
        </label>
        <select
          value={selectedMunicipioFilter}
          onChange={e => setSelectedMunicipioFilter(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#3483FA]"
        >
          <option value="">Todos os 92 Municípios</option>
          {municipios.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Dinâmica Armada / Facção
        </label>
        <select
          value={selectedFactionFilter}
          onChange={e => setSelectedFactionFilter(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#3483FA]"
        >
          <option value="">Todas as Situações</option>
          <option value="CV">Comando Vermelho (CV)</option>
          <option value="TCP">Terceiro Comando Puro (TCP)</option>
          <option value="ADA">Amigos dos Amigos (ADA)</option>
          <option value="MIL">Milícia</option>
          <option value="LJ">Liga da Justiça (CL220)</option>
          <option value="MNI">Milícia de Nova Iguaçu</option>
          <option value="NEU">Área Neutra</option>
          <option value="Disputa">Área em Disputa Bélica</option>
          <option value="Controle">Controle Institucional</option>
        </select>
      </div>

      {(selectedRispFilter !== 'all' || selectedMunicipioFilter || selectedFactionFilter) && (
        <button
          onClick={() => {
            setSelectedRispFilter('all');
            setSelectedMunicipioFilter('');
            setSelectedFactionFilter('');
          }}
          className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          Limpar Todos os Filtros
        </button>
      )}

      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1 text-slate-600">
        <div className="font-semibold text-slate-900">Filtro Ativo:</div>
        <div>
          • {filteredCisps.length} de {registry ? Object.keys(registry.cisps).length : 137} circunscrições
        </div>
        <div>• {new Set(filteredCisps.map(c => c.aisp)).size} batalhões abrangidos</div>
      </div>
    </div>
  );
}
