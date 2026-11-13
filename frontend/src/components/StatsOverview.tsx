import React, { useState } from 'react';
import { BarChart3, TrendingDown, Shield, FileText, ArrowUpDown } from 'lucide-react';
import { POLICE_UNITS, UNIQUE_AISPS, UNIQUE_RISPS, RISP_COMMANDS } from '../data/territoryData';
import { getIndicadoresByAisp } from '../data/ispIndicadores';
import { PoliceUnitRecord } from '../types/territory';

interface StatsOverviewProps {
  onSelectUnit: (unit: PoliceUnitRecord) => void;
  onGoToMap: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  onSelectUnit,
  onGoToMap
}) => {
  const [selectedRisp, setSelectedRisp] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState<'letalidade' | 'veiculo' | 'carga' | 'rua'>('letalidade');
  const [sortAsc, setSortAsc] = useState(false);

  // Compile stats per AISP
  const aispData = UNIQUE_AISPS.map(aisp => {
    const matchingUnit = POLICE_UNITS.find(u => u.aisp === aisp);
    const ind = getIndicadoresByAisp(aisp, matchingUnit?.municipio);
    return {
      aisp,
      risp: matchingUnit?.risp || 1,
      municipio: matchingUnit?.municipio || 'RJ',
      batalhao: matchingUnit?.batalhaoPMERJ || `${aisp}º BPM`,
      unit: matchingUnit,
      letalidade: ind.letalidadeViolenta,
      taxa100k: ind.taxaLetalidade100k,
      veiculo: ind.rouboVeiculo,
      carga: ind.rouboCarga,
      rua: ind.rouboRua,
      armas: ind.apreensaoArmas,
      fuzis: ind.apreensaoFuzis
    };
  });

  const filtered = aispData.filter(d => selectedRisp === 'all' || d.risp === selectedRisp);

  filtered.sort((a, b) => {
    let diff = 0;
    if (sortField === 'letalidade') diff = a.letalidade - b.letalidade;
    else if (sortField === 'veiculo') diff = a.veiculo - b.veiculo;
    else if (sortField === 'carga') diff = a.carga - b.carga;
    else if (sortField === 'rua') diff = a.rua - b.rua;
    return sortAsc ? diff : -diff;
  });

  const toggleSort = (field: 'letalidade' | 'veiculo' | 'carga' | 'rua') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <span>Indicadores Oficiais de Segurança Pública · ISP-RJ</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Estatísticas consolidadas por Área Integrada de Segurança Pública (AISP) e Região Integrada (RISP).
            Fonte oficial: Instituto de Segurança Pública do Estado do Rio de Janeiro (ispDados).
          </p>
        </div>

        <button
          onClick={onGoToMap}
          className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <span>Visualizar no Mapa</span>
        </button>
      </div>

      {/* Filter by RISP */}
      <div className="flex items-center gap-1.5 flex-wrap bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-xs">
        <span className="text-slate-400 font-semibold px-2">Comandos RISP:</span>
        <button
          onClick={() => setSelectedRisp('all')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            selectedRisp === 'all'
              ? 'bg-sky-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white bg-slate-900'
          }`}
        >
          Todo o Estado ({aispData.length} AISPs)
        </button>
        {UNIQUE_RISPS.map(r => (
          <button
            key={r}
            onClick={() => setSelectedRisp(r)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedRisp === r
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            {r}ª RISP ({RISP_COMMANDS[r]?.sede.split('/')[0]})
          </button>
        ))}
      </div>

      {/* Table of AISPs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">AISP / Batalhão</th>
                <th className="p-3">RISP</th>
                <th className="p-3">Município</th>
                <th
                  onClick={() => toggleSort('letalidade')}
                  className="p-3 cursor-pointer hover:text-white select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Letalidade Violenta</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-400" />
                  </div>
                </th>
                <th className="p-3 text-right">Taxa / 100k</th>
                <th
                  onClick={() => toggleSort('veiculo')}
                  className="p-3 cursor-pointer hover:text-white select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Roubo Veículo</span>
                    <ArrowUpDown className="w-3 h-3 text-sky-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('carga')}
                  className="p-3 cursor-pointer hover:text-white select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Roubo Carga</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('rua')}
                  className="p-3 cursor-pointer hover:text-white select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Roubo de Rua</span>
                    <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                  </div>
                </th>
                <th className="p-3 text-right">Armas (Fuzis)</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(row => (
                <tr
                  key={row.aisp}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="p-3">
                    <span className="font-bold text-white block">AISP {String(row.aisp).padStart(2, '0')}</span>
                    <span className="text-[11px] text-slate-400">{row.batalhao}</span>
                  </td>
                  <td className="p-3 text-sky-400 font-semibold">{row.risp}ª RISP</td>
                  <td className="p-3 text-slate-200">{row.municipio}</td>
                  <td className="p-3 text-right font-bold text-rose-400 tabular-nums">
                    {row.letalidade}
                  </td>
                  <td className="p-3 text-right text-amber-400 tabular-nums">
                    {row.taxa100k}
                  </td>
                  <td className="p-3 text-right tabular-nums">{row.veiculo}</td>
                  <td className="p-3 text-right tabular-nums">{row.carga}</td>
                  <td className="p-3 text-right tabular-nums">{row.rua}</td>
                  <td className="p-3 text-right tabular-nums text-sky-300">
                    {row.armas} ({row.fuzis})
                  </td>
                  <td className="p-3 text-center">
                    {row.unit && (
                      <button
                        onClick={() => {
                          onSelectUnit(row.unit!);
                          onGoToMap();
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded text-[11px] font-sans font-medium transition-colors"
                      >
                        Ver Dossiê
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
