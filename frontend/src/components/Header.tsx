import React from 'react';
import { 
  Shield, 
  MapPin, 
  Search, 
  Database, 
  AlertTriangle, 
  BarChart3, 
  Download,
  Info,
  Layers
} from 'lucide-react';
import { TerritorialRegistry } from '../types';

interface HeaderProps {
  registry: TerritorialRegistry | null;
  activeTab: 'map' | 'import' | 'audit' | 'stats' | 'about';
  setActiveTab: (tab: 'map' | 'import' | 'audit' | 'stats' | 'about') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectCISP: (cispId: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  registry,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onSelectCISP,
}) => {
  const [showSearchResults, setShowSearchResults] = React.useState(false);

  // Search filter
  const searchResults = React.useMemo(() => {
    if (!registry || !searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const results: Array<{
      id: number;
      label: string;
      sub: string;
      type: 'CISP' | 'AISP' | 'MUNICIPIO' | 'BAIRRO' | 'FACCAO';
    }> = [];

    // Search CISPs
    Object.values(registry.cisps).forEach((cisp) => {
      if (
        cisp.nome_oficial.toLowerCase().includes(q) ||
        cisp.cisp_formatado.toLowerCase().includes(q) ||
        cisp.cisp.toString() === q
      ) {
        results.push({
          id: cisp.cisp,
          label: `${cisp.cisp_formatado} - ${cisp.nome_oficial}`,
          sub: `${cisp.municipio} • AISP ${cisp.aisp} (${cisp.batalhao})`,
          type: 'CISP'
        });
      } else if (cisp.municipio.toLowerCase().includes(q)) {
        if (!results.some(r => r.id === cisp.cisp)) {
          results.push({
            id: cisp.cisp,
            label: `${cisp.municipio} (${cisp.cisp_formatado})`,
            sub: `${cisp.batalhao} • RISP ${cisp.risp}`,
            type: 'MUNICIPIO'
          });
        }
      } else if (cisp.bairros.some(b => b.toLowerCase().includes(q))) {
        const matchingBairro = cisp.bairros.find(b => b.toLowerCase().includes(q));
        results.push({
          id: cisp.cisp,
          label: `Bairro: ${matchingBairro}`,
          sub: `Atendido pela ${cisp.cisp_formatado} • ${cisp.batalhao}`,
          type: 'BAIRRO'
        });
      } else if (cisp.dinamica_territorial?.faccao.toLowerCase().includes(q)) {
        results.push({
          id: cisp.cisp,
          label: `${cisp.cisp_formatado} - ${cisp.dinamica_territorial.faccao}`,
          sub: `Risco: ${cisp.dinamica_territorial.grau_risco} • ${cisp.municipio}`,
          type: 'FACCAO'
        });
      }
    });

    return results.slice(0, 8);
  }, [registry, searchQuery]);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-20 shrink-0">
      {/* Brand & Territorial identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base text-slate-100 tracking-wide flex items-center gap-2">
              Painel de Monitoramento Territorial
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                RJ • GIS
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>Governança & Inteligência Policial</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono text-[11px]">7 RISPs | 41 AISPs | 137 CISPs | ISP-RJ</span>
          </p>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="relative w-80 lg:w-96">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Buscar CISP (ex: 5ª DP), AISP, Bairro, Município..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/90 text-slate-100 rounded-lg border border-slate-700/80 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown search results */}
        {showSearchResults && searchResults.length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 max-h-80 overflow-y-auto"
            onMouseLeave={() => setShowSearchResults(false)}
          >
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
              Resultados Encontrados ({searchResults.length})
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={`${item.id}-${idx}`}
                onClick={() => {
                  onSelectCISP(item.id);
                  setShowSearchResults(false);
                  setActiveTab('map');
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-600/15 border-b border-slate-800/50 last:border-b-0 flex items-start gap-2.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate">{item.label}</div>
                  <div className="text-[11px] text-slate-400 truncate">{item.sub}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                  {item.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav Tabs */}
      <nav className="flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'map'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Mapa & Dossiê</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'stats'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Estatísticas ISP</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'audit'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
          <span>Auditoria</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'import'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Importar Dados</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'about'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Metodologia</span>
        </button>
      </nav>
    </header>
  );
};

