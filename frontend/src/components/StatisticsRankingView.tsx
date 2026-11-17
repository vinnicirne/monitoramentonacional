import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Filter, 
  Search, 
  Download,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { TerritorialRegistry } from '../types';

interface StatisticsRankingProps {
  registry: TerritorialRegistry | null;
  onSelectCISP: (cispId: number) => void;
  onSwitchToMap: () => void;
}

export const StatisticsRankingView: React.FC<StatisticsRankingProps> = ({
  registry,
  onSelectCISP,
  onSwitchToMap
}) => {
  const [metric, setMetric] = useState<'letalidade_violenta' | 'roubo_rua' | 'roubo_carga' | 'roubo_veiculo' | 'fuzis_apreendidos'>('letalidade_violenta');
  const [selectedRisp, setSelectedRisp] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const metricLabels: Record<string, { label: string; sub: string; color: string }> = {
    letalidade_violenta: { label: 'Letalidade Violenta', sub: 'Homicídio doloso, latrocínio, lesão corporal seguida de morte e OAV', color: '#dc2626' },
    roubo_rua: { label: 'Roubo de Rua', sub: 'Transeunte, celular e coletivo', color: '#d97706' },
    roubo_carga: { label: 'Roubo de Carga', sub: 'Transporte rodoviário de mercadorias', color: '#7c3aed' },
    roubo_veiculo: { label: 'Roubo de Veículo', sub: 'Automóveis e motocicletas', color: '#3483FA' },
    fuzis_apreendidos: { label: 'Fuzis Apreendidos', sub: 'Armamento bélico de calibre restrito', color: '#00A650' }
  };

  const rankedCisps = React.useMemo(() => {
    if (!registry) return [];
    return Object.values(registry.cisps)
      .filter(c => {
        if (selectedRisp !== 'all' && c.risp !== selectedRisp) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            c.nome_oficial.toLowerCase().includes(q) ||
            c.cisp_formatado.toLowerCase().includes(q) ||
            c.municipio.toLowerCase().includes(q) ||
            c.batalhao.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map(c => ({
        cisp: c.cisp,
        formatado: c.cisp_formatado,
        nome: c.nome_oficial,
        municipio: c.municipio,
        batalhao: c.batalhao,
        risp: c.risp,
        value: c.indicadores.atual_2025[metric],
        taxa: metric === 'letalidade_violenta' ? c.indicadores.taxa_letalidade_100k : c.indicadores.taxa_roubo_100k,
        faccao: c.dinamica_territorial?.faccao,
        grau_risco: c.dinamica_territorial?.grau_risco
      }))
      .sort((a, b) => b.value - a.value);
  }, [registry, metric, selectedRisp, searchTerm]);

  const maxValue = rankedCisps.length > 0 ? rankedCisps[0].value : 1;

  return (
    <div className="flex-1 h-full bg-[#F5F5F5] overflow-y-auto p-3.5 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="p-4 md:p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-[#FFE600] text-[#2D3277] border border-[#E6CF00] shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-[#2D3277]">
              Rankings e Estatísticas Comparativas — ISP-RJ
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Consolidação dos indicadores oficiais de criminalidade do Instituto de Segurança Pública (série 2020 a 2025) cruzados por circunscrição policial e área integrada.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(metricLabels).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setMetric(key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metric === key
                  ? 'bg-[#3483FA] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-[#FFE600]/40 hover:text-[#2D3277]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por delegacia, município ou batalhão..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <span className="text-slate-600 font-medium">Filtrar RISP:</span>
          <select
            value={selectedRisp}
            onChange={(e) => setSelectedRisp(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-xs rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#3483FA]"
          >
            <option value="all">Todas as 7 RISPs</option>
            <option value="1">RISP 1 - Capital Centro & Zona Sul</option>
            <option value="2">RISP 2 - Capital Zona Norte & Oeste</option>
            <option value="3">RISP 3 - Baixada Fluminense</option>
            <option value="4">RISP 4 - Leste Fluminense</option>
            <option value="5">RISP 5 - Sul Fluminense</option>
            <option value="6">RISP 6 - Norte & Noroeste</option>
            <option value="7">RISP 7 - Região Serrana</option>
          </select>
        </div>
      </div>

      {/* Ranking List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#2D3277]">
              Ranking Geral — {metricLabels[metric].label} (Ano Corrente 2025)
            </h3>
            <span className="text-xs text-slate-600">{metricLabels[metric].sub}</span>
          </div>
          <span className="text-xs text-slate-600 font-mono font-semibold bg-white px-2.5 py-1 rounded border border-slate-200">
            {rankedCisps.length} unidades listadas
          </span>
        </div>

        <div className="divide-y divide-slate-200 max-h-[550px] overflow-y-auto">
          {rankedCisps.map((item, index) => {
            const percent = Math.min(100, Math.round((item.value / (maxValue || 1)) * 100));
            return (
              <div
                key={item.cisp}
                onClick={() => {
                  onSelectCISP(item.cisp);
                  onSwitchToMap();
                }}
                className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-4 group"
              >
                {/* Ranking Position */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                  index === 0 ? 'bg-[#FFE600] text-[#2D3277] border border-[#E6CF00]' :
                  index === 1 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                  index === 2 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  #{index + 1}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-xs text-[#2968C8] font-mono shrink-0">{item.formatado}</span>
                      <span className="font-semibold text-xs text-slate-900 truncate">{item.nome}</span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline truncate">({item.municipio} • {item.batalhao})</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-sm text-slate-900 font-mono">{item.value}</span>
                      <span className="text-[11px] text-slate-500">Taxa: {item.taxa}</span>
                    </div>
                  </div>

                  {/* Visual Bar Indicator */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: metricLabels[metric].color
                      }}
                    />
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#3483FA] transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

