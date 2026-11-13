import React, { useState } from 'react';
import {
  Shield,
  MapPin,
  Phone,
  Printer,
  Flame,
  Search,
  Crosshair,
  Building,
  X,
  Globe
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { SelectedFeatureData } from '../types';
import { EstadoScope } from '../types/sigBase';
import { CISP_FACCAO_STATS, FAC_CATALOG, FAC_ORDER } from '../data/faccoesPrecisas';

interface RightDossierProps {
  data: SelectedFeatureData | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintDossier: () => void;
  onCenterOnMap: () => void;
  onSelectEstadoScope?: (scope: EstadoScope) => void;
  onOpenImport?: () => void;
}

export const RightDossier: React.FC<RightDossierProps> = ({
  data,
  isOpen,
  onClose,
  onPrintDossier,
  onCenterOnMap,
  onSelectEstadoScope,
  onOpenImport
}) => {
  const [bairroSearch, setBairroSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'estatisticas' | 'seguranca' | 'bairros'>('geral');

  const chartData = React.useMemo(() => {
    if (!data?.indicadores?.historico) return [];
    return Object.entries(data.indicadores.historico).map(([ano, stats]) => ({
      ano,
      'Letalidade Violenta': stats.letalidade_violenta,
      'Roubo de Veículo': stats.roubo_veiculo,
      'Roubo de Rua': stats.roubo_rua,
      'Armas Apreendidas': stats.armas_apreendidas
    }));
  }, [data]);

  const filteredBairros = React.useMemo(() => {
    if (!data?.bairros) return [];
    if (!bairroSearch.trim()) return data.bairros;
    return data.bairros.filter(b => b.toLowerCase().includes(bairroSearch.toLowerCase()));
  }, [data, bairroSearch]);

  if (!isOpen || !data) {
    return null;
  }

  // Specialized Dossier for ESTADO_UF (Integrated States: RJ, MG, ES)
  if (data.tipo === 'ESTADO_UF' && data.ufInfo) {
    const uf = data.ufInfo;
    const isRj = uf.uf === 'RJ';
    const isIntegrado = uf.statusSig !== 'MALHA_IBGE_DISPONIVEL';
    return (
      <>
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-30 md:hidden"
        />
        <aside className="fixed inset-x-0 bottom-14 z-40 max-h-[78dvh] rounded-t-3xl border-t border-slate-700 bg-slate-900 flex flex-col shadow-2xl md:static md:inset-auto md:max-h-none md:w-96 md:h-full md:rounded-none md:border-t-0 md:border-l md:border-slate-800 md:z-10 md:shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mt-2.5 mb-0.5 md:hidden shrink-0" />
          <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono uppercase tracking-wider">
                UF • {uf.uf} · IBGE {uf.codigoIbge}
              </span>
              <button
                onClick={onClose}
                className="p-2 md:p-1 rounded-lg md:rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{uf.nome}</span>
          </h2>
          <div className="text-[11px] text-slate-400 mt-1">
            Região {uf.regiao} · Capital: {uf.capital}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Polícia Civil</span>
                <span className="font-mono font-bold text-blue-400">{uf.orgaoPC}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Polícia Militar</span>
                <span className="font-mono font-bold text-emerald-400">{uf.orgaoPM}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Situação SIG</span>
              <span className={`font-mono font-bold text-[11px] ${isRj ? 'text-blue-400' : isIntegrado ? 'text-emerald-400' : 'text-amber-400'}`}>
                {uf.statusSig === 'INTEGRADO_COMPLETO'
                  ? 'INTEGRADO COMPLETO (CISP/AISP/RISP + FACÇÕES)'
                  : uf.statusSig === 'BASE_SIG_INTEGRADA'
                  ? 'BASE SIG INTEGRADA (TABELAS A/B + QGIS)'
                  : 'MALHA IBGE DISPONÍVEL · AGUARDANDO IMPORTAÇÃO'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Estrutura Territorial</span>
              <p className="text-slate-300 leading-relaxed mt-0.5">{uf.estruturaResumo}</p>
            </div>
          </div>

          {(uf.uf === 'RJ' || uf.uf === 'MG' || uf.uf === 'ES') && onSelectEstadoScope ? (
            <button
              onClick={() => onSelectEstadoScope(uf.uf as EstadoScope)}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Abrir Visão Detalhada de {uf.nome} ({uf.uf}) →
            </button>
          ) : (
            onOpenImport && (
              <button
                onClick={onOpenImport}
                className="w-full py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Importar Dados Territoriais (.xlsx / .csv / .geojson) para {uf.uf} →
              </button>
            )
          )}

          <div className="p-2.5 bg-slate-950/40 rounded border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong>Transparência Metodológica:</strong> Apenas estados com fontes oficiais importadas exibem circunscrições policiais internas. Para as demais UFs, a malha estadual oficial do IBGE é exibida sem criação de polígonos fictícios.
          </div>
        </div>
        </aside>
      </>
    );
  }

  // Specialized Dossier for MG/ES SIG Nodes
  if (data.tipo === 'MGES_NODE' && data.mgEsInfo) {
    const { divisao, unidade, uf, titulo, subtitulo } = data.mgEsInfo;
    return (
      <>
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-30 md:hidden"
        />
        <aside className="fixed inset-x-0 bottom-14 z-40 max-h-[78dvh] rounded-t-3xl border-t border-slate-700 bg-slate-900 flex flex-col shadow-2xl md:static md:inset-auto md:max-h-none md:w-96 md:h-full md:rounded-none md:border-t-0 md:border-l md:border-slate-800 md:z-10 md:shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mt-2.5 mb-0.5 md:hidden shrink-0" />
          <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono uppercase tracking-wider">
                SIG {uf} · {divisao ? `IBGE ${divisao.Codigo_IBGE_Municipio}` : unidade?.Orgao}
              </span>
              <button
                onClick={onClose}
                className="p-2 md:p-1 rounded-lg md:rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          <h2 className="font-bold text-sm text-slate-100">{titulo}</h2>
          <div className="text-[11px] text-slate-400 mt-1">{subtitulo}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {divisao && (
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">RISP / Município</span>
                <span className="text-slate-100 font-semibold">{divisao.ID_RISP} · {divisao.Nome_RISP} ({divisao.Nome_Municipio})</span>
              </div>
              {divisao.UF === 'MG' && (
                <div className="pt-1.5 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">ACISP (Nível Intermediário MG)</span>
                  <span className="text-blue-300">{divisao.ID_ACISP} · {divisao.Nome_ACISP}</span>
                </div>
              )}
              <div className="pt-1.5 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">AISP / Unidade PM</span>
                <span className="text-emerald-400">{divisao.Unidade_PM_Responsavel}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Delegacia PC / Fonte Legal</span>
                <span className="text-slate-200 block">{divisao.Nome_Delegacia_PC}</span>
                <span className="text-[10px] text-slate-400 font-mono">{divisao.Fonte_Legal} · {divisao.Status_Validacao}</span>
              </div>
            </div>
          )}

          {unidade && (
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
              <div className="text-[10px] text-blue-400 font-bold uppercase">Tabela B · Unidade Policial</div>
              <div className="text-slate-100 font-semibold">{unidade.Nome_Oficial}</div>
              <div className="text-slate-300">{unidade.Endereco_Completo}</div>
              <div className="text-slate-400">{unidade.Bairro} · {unidade.Municipio} · CEP {unidade.CEP}</div>
              <div className="text-[10px] font-mono text-amber-400">{unidade.Status_Validacao}</div>
            </div>
          )}
        </div>
        </aside>
      </>
    );
  }

  const ind2025 = data.indicadores?.atual_2025;
  const cispFaccaoSummary = data.cisp ? CISP_FACCAO_STATS[data.cisp] : undefined;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-30 md:hidden"
      />
      <aside className="fixed inset-x-0 bottom-14 z-40 max-h-[78dvh] rounded-t-3xl border-t border-slate-700 bg-slate-900 flex flex-col shadow-2xl md:static md:inset-auto md:max-h-none md:w-96 md:h-full md:rounded-none md:border-t-0 md:border-l md:border-slate-800 md:z-10 md:shrink-0">
        <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mt-2.5 mb-0.5 md:hidden shrink-0" />
        {/* Dossier Header */}
        <div className="p-3.5 md:p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono uppercase tracking-wider">
              {data.tipo === 'FACCAO_COMUNIDADE' ? 'COMUNIDADE' : data.tipo} •{' '}
              {data.cisp ? `CISP ${data.cisp}` : data.aisp ? `AISP ${data.aisp}` : data.risp ? `RISP ${data.risp}` : 'ÁREA'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onCenterOnMap}
                title="Centralizar no Mapa"
                className="p-2 md:p-1 rounded-lg md:rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <Crosshair className="w-4 h-4 md:w-3.5 md:h-3.5 text-blue-400" />
              </button>
              <button
                onClick={onPrintDossier}
                title="Imprimir / Exportar Dossiê Oficial em PDF"
                className="p-2 md:p-1 rounded-lg md:rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 text-[11px] px-2.5 md:px-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 md:w-3.5 md:h-3.5 text-emerald-400" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={onClose}
                title="Fechar Dossiê (Recolher)"
                className="p-2 md:p-1 rounded-lg md:rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          </div>

          <h2 className="font-bold text-sm text-slate-100 leading-snug">{data.nome}</h2>
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
        <div className="flex border-b border-slate-800 text-xs bg-slate-950/20 shrink-0">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex-1 py-2.5 md:py-2 font-medium border-b-2 text-center transition-all cursor-pointer ${
            activeTab === 'geral'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Estrutura
        </button>
        <button
          onClick={() => setActiveTab('bairros')}
          className={`flex-1 py-2.5 md:py-2 font-medium border-b-2 text-center transition-all cursor-pointer ${
            activeTab === 'bairros'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Bairros ({data.bairros?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('estatisticas')}
          className={`flex-1 py-2.5 md:py-2 font-medium border-b-2 text-center transition-all cursor-pointer ${
            activeTab === 'estatisticas'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          ISP 2020-25
        </button>
        <button
          onClick={() => setActiveTab('seguranca')}
          className={`flex-1 py-2.5 md:py-2 font-medium border-b-2 text-center transition-all cursor-pointer ${
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
            {/* Precise Dados de Riscos Community Card if selected */}
            {data.tipo === 'FACCAO_COMUNIDADE' && (
              <div className="p-3 bg-red-950/30 rounded-lg border border-red-500/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase">
                    <Flame className="w-4 h-4 shrink-0" />
                    <span>Área Mapeada · Dados de Riscos</span>
                  </div>
                  {data.faccaoCode && FAC_CATALOG[data.faccaoCode] && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: FAC_CATALOG[data.faccaoCode].color }}
                    >
                      {FAC_CATALOG[data.faccaoCode].shortLabel}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-200">
                  <span className="font-semibold text-red-300">Classificação: </span>
                  {data.faccao}
                </div>
                {data.descricao && <p className="text-[11px] text-slate-300 leading-relaxed">{data.descricao}</p>}
                <div className="border-t border-red-900/40 pt-2 text-[10px] text-slate-400 space-y-0.5">
                  <div>
                    <strong>Fonte:</strong> {data.fonte}
                  </div>
                  <div>
                    <strong>Base:</strong> {data.data_registro} · <strong>Precisão:</strong> {data.grau_confiabilidade}
                  </div>
                </div>
              </div>
            )}

            {/* Unidades Responsáveis */}
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Competência Territorial Oficial
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">CISP / Delegacia</span>
                  <span className="text-slate-100 font-semibold">{data.cisp ? `${data.cisp}ª DP` : '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">AISP / Batalhão</span>
                  <span className="text-amber-400 font-semibold">{data.aisp ? `AISP ${data.aisp}` : '—'}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-800/70">
                  <span className="text-[10px] text-slate-500 uppercase block">Unidade PMERJ Responsável</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3.5 h-3.5 shrink-0" />
                    {data.batalhao || 'Informação vinculada à AISP'}
                  </span>
                </div>
                {data.risp && (
                  <div className="col-span-2 pt-1 border-t border-slate-800/70">
                    <span className="text-[10px] text-slate-500 uppercase block">Região Integrada (RISP)</span>
                    <span className="text-blue-300 font-mono">
                      RISP {data.risp} {data.comando ? `• ${data.comando}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {(data.endereco || data.telefone) && (
                <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
                  {data.endereco && (
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{data.endereco}</span>
                    </div>
                  )}
                  {data.telefone && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-mono">{data.telefone}</span>
                    </div>
                  )}
                </div>
              )}

              {data.marcolegal && (
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  <strong>Marco Legal:</strong> {data.marcolegal}
                </div>
              )}
            </div>

            {/* Bairros preview */}
            {data.bairros && data.bairros.length > 0 && (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Bairros Atendidos ({data.bairros.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('bairros')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
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

            {/* Special Focus Details */}
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
                {data.descricao && <p className="text-[11px] text-slate-300 leading-relaxed">{data.descricao}</p>}
                <div className="border-t border-red-900/40 pt-2 text-[10px] text-slate-400 space-y-0.5">
                  <div>
                    <strong>Fonte Documental:</strong> {data.fonte}
                  </div>
                  <div>
                    <strong>Data do Registro:</strong> {data.data_registro}
                  </div>
                  <div>
                    <strong>Grau de Confiabilidade:</strong> {data.grau_confiabilidade}
                  </div>
                </div>
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
                onChange={e => setBairroSearch(e.target.value)}
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
            {ind2025 ? (
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
                      {ind2025.armas_apreendidas}{' '}
                      <span className="text-xs text-slate-400 font-normal">({ind2025.fuzis_apreendidos} fuzis)</span>
                    </span>
                    <span className="text-[9px] text-slate-500 block">Apreensões em flagrante</span>
                  </div>
                </div>

                {data.indicadores && (
                  <div className="p-2 bg-slate-950/40 rounded border border-slate-800 text-[10px] flex items-center justify-between text-slate-400">
                    <span>
                      Taxa Letalidade/100k: <strong className="text-slate-200">{data.indicadores.taxa_letalidade_100k}</strong>
                    </span>
                    <span>
                      Taxa Roubo/100k: <strong className="text-slate-200">{data.indicadores.taxa_roubo_100k}</strong>
                    </span>
                  </div>
                )}

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block mb-2">
                    Evolução Histórica Oficial (ISP-RJ 2020–2025)
                  </span>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorRR" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                Selecione uma circunscrição CISP para consultar as séries históricas ISP-RJ.
              </div>
            )}
          </div>
        )}

        {/* TAB: DINÂMICA DE FACÇÕES & INTELIGÊNCIA */}
        {activeTab === 'seguranca' && (
          <div className="space-y-3">
            {cispFaccaoSummary && cispFaccaoSummary.total > 0 && (
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-blue-400">
                  <span>Áreas Precisas na CISP {data.cisp} (ago/2026)</span>
                  <span className="font-mono text-white">{cispFaccaoSummary.total} polígonos</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FAC_ORDER.map(code => {
                    const qty = cispFaccaoSummary.counts[code];
                    if (!qty) return null;
                    const meta = FAC_CATALOG[code];
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-200"
                      >
                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: meta.color }} />
                        <span>{meta.shortLabel}:</span>
                        <strong className="font-mono text-white">{qty}</strong>
                      </span>
                    );
                  })}
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pt-1 border-t border-slate-800/80">
                  {cispFaccaoSummary.areas.slice(0, 30).map((area, idx) => {
                    const meta = FAC_CATALOG[area.f];
                    return (
                      <div key={`${area.nome}-${idx}`} className="flex items-center justify-between text-[11px] py-0.5">
                        <span className="text-slate-300 truncate pr-2">{area.nome}</span>
                        <span className="text-[10px] font-mono shrink-0" style={{ color: meta.color }}>
                          {meta.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.dinamica_territorial ? (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Resumo da Circunscrição
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      data.dinamica_territorial.grau_risco.includes('Crítico') ||
                      data.dinamica_territorial.grau_risco.includes('Alto')
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    Risco: {data.dinamica_territorial.grau_risco}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
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

                <div className="p-2.5 bg-blue-950/20 border border-blue-900/40 rounded text-[10px] text-blue-300/80 leading-relaxed">
                  <strong>Aviso Metodológico & Jurídico:</strong> Todas as informações territoriais sobre presença ou disputas de facções provêm exclusivamente de fontes públicas (Dados de Riscos ago/2026, GENI-UFF, Fogo Cruzado, MP-RJ / SEPM). Não constituem homologação estatal de domínio.
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
        <span className="text-[10px] text-slate-500">Base Atualizada • 2026</span>
        <button
          onClick={onPrintDossier}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Gerar Dossiê Técnico PDF
        </button>
      </div>
      </aside>
    </>
  );
};
