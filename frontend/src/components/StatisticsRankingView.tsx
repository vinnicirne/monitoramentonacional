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
    letalidade_violenta: { label: 'Letalidade Violenta', sub: 'Homicídio doloso, latrocínio, lesão corporal seguida de morte e OAV', color: '#ef4444' },
    roubo_rua: { label: 'Roubo de Rua', sub: 'Transeunte, celular e coletivo', color: '#f59e0b' },
    roubo_carga: { label: 'Roubo de Carga', sub: 'Transporte rodoviário de mercadorias', color: '#8b5cf6' },
    roubo_veiculo: { label: 'Roubo de Veículo', sub: 'Automóveis e motocicletas', color: '#3b82f6' },
    fuzis_apreendidos: { label: 'Fuzis Apreendidos', sub: 'Armamento bélico de calibre restrito', color: '#10b981' }
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
    <div className="flex-1 h-full bg-slate-950 overflow-y-auto p-3.5 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="p-4 md:p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Rankings e Estatísticas Comparativas — ISP-RJ
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Consolidação dos indicadores oficiais de criminalidade do Instituto de Segurança Pública (série 2020 a 2025) cruzados por circunscrição policial e área integrada.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(metricLabels).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setMetric(key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                metric === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por delegacia, município ou batalhão..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <span className="text-slate-400">Filtrar RISP:</span>
          <select
            value={selectedRisp}
            onChange={(e) => setSelectedRisp(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Ranking Geral — {metricLabels[metric].label} (Ano Corrente 2025)
            </h3>
            <span className="text-xs text-slate-400">{metricLabels[metric].sub}</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {rankedCisps.length} unidades listadas
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[550px] overflow-y-auto">
          {rankedCisps.map((item, index) => {
            const percent = Math.min(100, Math.round((item.value / (maxValue || 1)) * 100));
            return (
              <div
                key={item.cisp}
                onClick={() => {
                  onSelectCISP(item.cisp);
                  onSwitchToMap();
                }}
                className="p-3.5 hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center gap-4 group"
              >
                {/* Ranking Position */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                  index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  index === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40' :
                  index === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  #{index + 1}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-blue-400 font-mono">{item.formatado}</span>
                      <span className="font-semibold text-xs text-slate-100 truncate">{item.nome}</span>
                      <span className="text-[10px] text-slate-400">({item.municipio} • {item.batalhao})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-100 font-mono">{item.value}</span>
                      <span className="text-[10px] text-slate-400">Taxa: {item.taxa}</span>
                    </div>
                  </div>

                  {/* Visual Bar Indicator */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: metricLabels[metric].color
                      }}
                    />
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

