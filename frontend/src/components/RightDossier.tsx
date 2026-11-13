import React, { useState } from 'react';
import { 
  Shield, 
  MapPin, 
  Phone, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Printer, 
  ExternalLink,
  ChevronRight,
  Flame,
  Search,
  Crosshair,
  Building,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { X } from 'lucide-react';
import { SelectedFeatureData } from '../types';

interface RightDossierProps {
  data: SelectedFeatureData | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintDossier: () => void;
  onCenterOnMap: () => void;
}

export const RightDossier: React.FC<RightDossierProps> = ({
  data,
  isOpen,
  onClose,
  onPrintDossier,
  onCenterOnMap
}) => {
  const [bairroSearch, setBairroSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'estatisticas' | 'seguranca' | 'bairros'>('geral');

  // Historical data for chart - MUST be called at top level before any early return
  const chartData = React.useMemo(() => {
    if (!data?.indicadores?.historico) return [];
    return Object.entries(data.indicadores.historico).map(([ano, stats]) => ({
      ano: ano,
      'Letalidade Violenta': stats.letalidade_violenta,
      'Roubo de Veículo': stats.roubo_veiculo,
      'Roubo de Rua': stats.roubo_rua,
      'Armas Apreendidas': stats.armas_apreendidas
    }));
  }, [data]);

  // Filtered bairros - MUST be called at top level before any early return
  const filteredBairros = React.useMemo(() => {
    if (!data?.bairros) return [];
    if (!bairroSearch.trim()) return data.bairros;
    return data.bairros.filter(b => b.toLowerCase().includes(bairroSearch.toLowerCase()));
  }, [data, bairroSearch]);

  // Only open when a section/territory is clicked and isOpen is true
  if (!isOpen || !data) {
    return null;
  }

  const ind2025 = data.indicadores?.atual_2025;

  return (
    <aside className="w-96 h-[calc(100vh-4rem)] bg-slate-900 border-l border-slate-800 flex flex-col z-10 shrink-0">
      {/* Dossier Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono uppercase tracking-wider">
            {data.tipo} • {data.cisp ? `CISP ${data.cisp}` : (data.aisp ? `AISP ${data.aisp}` : (data.risp ? `RISP ${data.risp}` : 'ÁREA'))}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCenterOnMap}
              title="Centralizar no Mapa"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            </button>
            <button
              onClick={onPrintDossier}
              title="Imprimir / Exportar Dossiê Oficial em PDF"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 text-[11px] px-2"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              title="Fechar Dossiê (Recolher)"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h2 className="font-bold text-sm text-slate-100 leading-snug">
          {data.nome}
        </h2>
        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
          {data.municipio && <span>{data.municipio}</span>}
          {data.areakm2 && (
            <>
              <span>•</span>
              <span className="font-mono">{data.areakm2.toFixed(1)} km²</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs bg-slate-950/20">
        <button
          onClick={() => setActiveTab('geral')}
          className={`flex-1 py-2 font-medium border-b-2 text-center transition-all ${
            activeTab === 'geral'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Estrutura
        </button>
        <button
          onClick={() => setActiveTab('bairros')}
          className={`flex-1 py-2 font-medium border-b-2 text-center transition-all ${
            activeTab === 'bairros'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Bairros ({data.bairros?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('estatisticas')}
          className={`flex-1 py-2 font-medium border-b-2 text-center transition-all ${
            activeTab === 'estatisticas'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ISP 2020-25
        </button>
        <button
          onClick={() => setActiveTab('seguranca')}
          className={`flex-1 py-2 font-medium border-b-2 text-center transition-all ${
            activeTab === 'seguranca'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Dinâmica
        </button>
      </div>

      {/* Dossier Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB: ESTRUTURA POLICIAL & RESPONSABILIDADE */}
        {activeTab === 'geral' && (
          <div className="space-y-3">
            {/* Unidades Responsáveis */}
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Competência Territorial Oficial
              </span>

              <div className="space-y-2 pt-1">
                <div>
                  <div className="text-[10px] text-slate-400">Polícia Civil (PCERJ):</div>
                  <div className="text-xs font-semibold text-slate-200">
                    {data.cisp ? `${data.cisp.toString().padStart(3, '0')}ª Delegacia Policial` : (data.nome || 'Sede da Unidade')}
                  </div>
                  {data.endereco && (
                    <div className="text-[11px] text-slate-400 flex items-start gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                      <span>{data.endereco}</span>
                    </div>
                  )}
                  {data.telefone && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{data.telefone}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-2">
                  <div className="text-[10px] text-slate-400">Polícia Militar (PMERJ):</div>
                  <div className="text-xs font-semibold text-slate-200">
                    {data.batalhao || (data.aisp ? `${data.aisp}º BPM` : 'Batalhão de Área')}
                  </div>
                  {data.risp && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Subordinação: RISP {data.risp} • Comando Regional de Policiamento
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Marco Legal */}
            {data.marcolegal && (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Marco Regulamentador & Legislação
                </span>
                <div className="text-xs text-slate-300 font-mono">
                  {data.marcolegal}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Demarcação homologada no Diário Oficial do Estado do RJ.
                </div>
              </div>
            )}

            {/* Bairros Atendidos (Acesso Rápido) */}
            {data.bairros && data.bairros.length > 0 && (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    Bairros Atendidos ({data.bairros.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('bairros')}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Ver lista completa →
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.bairros.slice(0, 6).map((b, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px]"
                    >
                      {b}
                    </span>
                  ))}
                  {data.bairros.length > 6 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                      +{data.bairros.length - 6} bairros
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Special Focus Details (if selected) */}
            {data.tipo === 'FOCO_ESPECIAL' && (
              <div className="p-3 bg-red-950/30 rounded-lg border border-red-500/40 space-y-2">
                <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase">
                  <Flame className="w-4 h-4" />
                  Foco Especial / Dinâmica Armada
                </div>
                <div className="text-xs text-slate-200">
                  <span className="font-semibold text-red-300">Facção Predominante: </span>
                  {data.faccao}
                </div>
                {data.descricao && (
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {data.descricao}
                  </p>
                )}
                <div className="border-t border-red-900/40 pt-2 text-[10px] text-slate-400 space-y-0.5">
                  <div><strong>Fonte Documental:</strong> {data.fonte}</div>
                  <div><strong>Data do Registro:</strong> {data.data_registro}</div>
                  <div><strong>Grau de Confiabilidade:</strong> {data.grau_confiabilidade}</div>
                </div>
                {data.alerta_juridico && (
                  <div className="p-2 bg-slate-900/90 rounded border border-slate-700 text-[10px] text-amber-300/90">
                    ⚠ {data.alerta_juridico}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: BAIRROS ATENDIDOS */}
        {activeTab === 'bairros' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={bairroSearch}
                onChange={(e) => setBairroSearch(e.target.value)}
                placeholder="Filtrar bairro ou localidade..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>{filteredBairros.length} localidade(s) cadastrada(s)</span>
              {data.cisp && <span className="text-blue-400">CISP {data.cisp}</span>}
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {filteredBairros.length > 0 ? (
                filteredBairros.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-950/40 border border-slate-800 rounded flex items-center justify-between text-xs text-slate-300 hover:bg-slate-800/40 transition-colors"
                  >
                    <span>{b}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">Oficial</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Nenhum bairro encontrado com o filtro atual.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: ESTATÍSTICAS ISP-RJ (2020 a 2025) */}
        {activeTab === 'estatisticas' && (
          <div className="space-y-3">
            {ind2025 && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Letalidade Violenta (2025)</span>
                    <span className="text-lg font-bold text-red-400">{ind2025.letalidade_violenta}</span>
                    <span className="text-[9px] text-slate-500 block">Homicídios + OAV + Latrocínios</span>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Roubos de Rua (2025)</span>
                    <span className="text-lg font-bold text-amber-400">{ind2025.roubo_rua}</span>
                    <span className="text-[9px] text-slate-500 block">Transeunte, Coletivo e Celular</span>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Roubos de Veículo (2025)</span>
                    <span className="text-lg font-bold text-blue-400">{ind2025.roubo_veiculo}</span>
                    <span className="text-[9px] text-slate-500 block">Autos recuperados e registros</span>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Armas e Fuzis Apreendidos</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {ind2025.armas_apreendidas} <span className="text-xs text-slate-400 font-normal">({ind2025.fuzis_apreendidos} fuzis)</span>
                    </span>
                    <span className="text-[9px] text-slate-500 block">Apreensões em flagrante</span>
                  </div>
                </div>

                {/* Taxas por 100k */}
                {data.indicadores && (
                  <div className="p-2 bg-slate-950/40 rounded border border-slate-800 text-[10px] flex items-center justify-between text-slate-400">
                    <span>Taxa Letalidade/100k: <strong className="text-slate-200">{data.indicadores.taxa_letalidade_100k}</strong></span>
                    <span>Taxa Roubo/100k: <strong className="text-slate-200">{data.indicadores.taxa_roubo_100k}</strong></span>
                  </div>
                )}

                {/* Benchmark Comparativo contra a Média Estadual */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Benchmark Comparativo Territorial</span>
                    <span className="text-blue-400 font-mono text-[9px]">ISP • BASE ESTADUAL</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Letalidade Violenta:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ind2025.letalidade_violenta > 18 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {ind2025.letalidade_violenta > 18 
                          ? `+${Math.round(((ind2025.letalidade_violenta - 18) / 18) * 100)}% acima` 
                          : `${Math.round(((ind2025.letalidade_violenta - 18) / 18) * 100)}% abaixo`} da média estadual
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Roubos de Rua:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ind2025.roubo_rua > 220 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {ind2025.roubo_rua > 220 
                          ? `+${Math.round(((ind2025.roubo_rua - 220) / 220) * 100)}% acima` 
                          : `${Math.round(((ind2025.roubo_rua - 220) / 220) * 100)}% abaixo`} da média estadual
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evolution Chart */}
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block mb-2">
                    Evolução Histórica Oficial (ISP-RJ 2020–2025)
                  </span>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRR" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="ano" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                        <Area type="monotone" dataKey="Letalidade Violenta" stroke="#ef4444" fillOpacity={1} fill="url(#colorLV)" />
                        <Area type="monotone" dataKey="Roubo de Rua" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRR)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: DINÂMICA DE FACÇÕES & INTELIGÊNCIA */}
        {activeTab === 'seguranca' && (
          <div className="space-y-3">
            {data.dinamica_territorial ? (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Grupo Armado / Situação
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    data.dinamica_territorial.grau_risco.includes('Crítico') || data.dinamica_territorial.grau_risco.includes('Alto')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    Risco: {data.dinamica_territorial.grau_risco}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  {data.dinamica_territorial.faccao}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                  {data.dinamica_territorial.status}
                </p>

                <div className="border-t border-slate-800 pt-2 text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Fonte Documental:</span>
                    <strong className="text-slate-300">{data.dinamica_territorial.fonte}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Período de Referência:</span>
                    <strong className="text-slate-300">{data.dinamica_territorial.data}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Confiabilidade do Registro:</span>
                    <strong className="text-emerald-400">{data.dinamica_territorial.confiabilidade}</strong>
                  </div>
                </div>

                {/* Legal and methodological notice */}
                <div className="p-2.5 bg-blue-950/20 border border-blue-900/40 rounded text-[10px] text-blue-300/80 leading-relaxed">
                  <strong>Aviso Metodológico & Jurídico:</strong> Todas as informações territoriais sobre presença ou disputas de facções provêm exclusivamente de publicações acadêmicas (GENI-UFF), registros de monitoramento (Fogo Cruzado) e dados ministeriais/policiais (MP-RJ / SEPM). O sistema preserva a neutralidade analítica e evita afirmações informais sem lastro.
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nenhum registro específico de conflito para esta unidade.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dossier Footer Action */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          Base Atualizada • 2026
        </span>
        <button
          onClick={onPrintDossier}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Gerar Dossiê Técnico PDF
        </button>
      </div>
    </aside>
  );
};

