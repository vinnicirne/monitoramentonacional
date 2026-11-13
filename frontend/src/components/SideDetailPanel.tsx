import React, { useState } from 'react';
import {
  X,
  Shield,
  MapPin,
  Building2,
  BarChart2,
  FileText,
  AlertCircle,
  Download,
  Copy,
  Check,
  TrendingDown,
  Info
} from 'lucide-react';
import { PoliceUnitRecord, FocoEspecialArea } from '../types/territory';
import { RISP_COMMANDS } from '../data/territoryData';
import { getIndicadoresByAisp } from '../data/ispIndicadores';
import { getFaccaoByCisp } from '../data/focoEspecialDefault';
import { CISP_FACCAO_STATS, FAC_CATALOG, FAC_ORDER, CodigoFaccaoPrecisa } from '../data/faccoesPrecisas';
import { UfMetadataInfo } from '../data/brasilEstadosData';
import { EstadoScope } from '../types/sigBase';
import { MgEsSelectedInfo } from './TerritorialMap';

interface SideDetailPanelProps {
  unit: PoliceUnitRecord | null;
  focoArea: FocoEspecialArea | null;
  selectedMgEs?: MgEsSelectedInfo | null;
  selectedUf?: UfMetadataInfo | null;
  onSelectEstadoScope?: (scope: EstadoScope) => void;
  onOpenImport?: () => void;
  onClose: () => void;
  onExportReport: () => void;
  anoEstatistica: number;
}

export const SideDetailPanel: React.FC<SideDetailPanelProps> = ({
  unit,
  focoArea,
  selectedMgEs,
  selectedUf,
  onSelectEstadoScope,
  onOpenImport,
  onClose,
  onExportReport,
  anoEstatistica
}) => {
  const [bairroSearch, setBairroSearch] = useState('');
  const [copied, setCopied] = useState(false);

  if (selectedMgEs) {
    const div = selectedMgEs.divisao;
    const unid = selectedMgEs.unidade;
    const statusVal = div?.Status_Validacao || unid?.Status_Validacao || 'PENDENTE_EXTRACAO';

    return (
      <aside className="w-full md:w-[440px] lg:w-[480px] bg-slate-950 border-l border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl z-20 shrink-0">
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-600/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{selectedMgEs.titulo}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {selectedMgEs.uf === 'MG' ? 'Minas Gerais (3 Níveis: RISP / ACISP / AISP)' : 'Espírito Santo (5 RISPs / 23 AISPs)'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-300 text-xs">
          {div && (
            <>
              <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Tabela A · Divisão Territorial SIG</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">UF / Código IBGE</span>
                    <span className="font-mono font-bold text-white">{div.UF} · {div.Codigo_IBGE_Municipio}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Município</span>
                    <span className="font-semibold text-white">{div.Nome_Municipio}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">RISP</span>
                    <span className="font-mono text-sky-300">{div.ID_RISP} · {div.Nome_RISP}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Tipo de Delegacia</span>
                    <span className="text-indigo-300 font-semibold">{div.Tipo_Delegacia}</span>
                  </div>
                  {div.UF === 'MG' && (
                    <div className="col-span-2 pt-1.5 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">ACISP (Nível Intermediário MG)</span>
                      <span className="text-white font-medium">{div.ID_ACISP} · {div.Nome_ACISP}</span>
                    </div>
                  )}
                  <div className="col-span-2 pt-1.5 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">AISP / Unidade PM Responsável</span>
                    <span className="text-emerald-400 font-medium">{div.Unidade_PM_Responsavel}</span>
                    <span className="block text-[11px] font-mono text-slate-400 mt-0.5">{div.ID_AISP} · {div.Nome_AISP}</span>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Delegacia PC / Circunscrição</span>
                    <span className="text-white font-semibold">{div.Nome_Delegacia_PC}</span>
                    <span className="block text-[11px] font-mono text-slate-400 mt-0.5">Chave: {div.ID_CISP_DP}</span>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Bairro / Distrito</span>
                    <span className="text-amber-300">{div.Bairro_Distrito}</span>
                  </div>
                </div>
              </section>

              <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Auditoria & Fonte Legal</span>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Status de Validação: </span>
                    <span className="font-mono font-bold text-emerald-400">{statusVal}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Fonte Legal: </span>
                    <span className="text-slate-200">{div.Fonte_Legal}</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {unid && (
            <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Tabela B · Cadastro da Unidade Policial</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">ID Único / Órgão</span>
                  <span className="font-mono text-sky-400 font-bold">{unid.ID_Unidade}</span> · <span className="text-white font-bold">{unid.Orgao}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Endereço Institucional</span>
                  <span className="text-white">{unid.Endereco_Completo}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Bairro / Município</span>
                    <span className="text-slate-200">{unid.Bairro} · {unid.Municipio}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">CEP</span>
                    <span className="font-mono text-slate-200">{unid.CEP}</span>
                  </div>
                </div>
                <div className="pt-1 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Fonte / Validação</span>
                  <span className="text-slate-300">{unid.Fonte_Legal}</span>
                  <span className="block font-mono text-[10px] text-amber-400 mt-0.5">{unid.Status_Validacao}</span>
                </div>
              </div>
            </section>
          )}

          <div className="p-2.5 bg-slate-900/40 rounded border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong>Regra Metodológica SIG:</strong> A localização física da unidade informa onde o prédio está instalado, não substituindo o polígono oficial de circunscrição distrital quando pendente de portaria local.
          </div>
        </div>
      </aside>
    );
  }

  if (selectedUf && !unit && !focoArea && !selectedMgEs) {
    const isRj = selectedUf.uf === 'RJ';
    const isMg = selectedUf.uf === 'MG';
    const isEs = selectedUf.uf === 'ES';
    const isIntegrado = selectedUf.statusSig !== 'MALHA_IBGE_DISPONIVEL';

    return (
      <aside className="w-full md:w-[440px] lg:w-[480px] bg-slate-950 border-l border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl z-20 shrink-0">
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                isRj
                  ? 'bg-sky-950 border-sky-500/50 text-sky-400'
                  : isMg || isEs
                  ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400'
                  : 'bg-indigo-950 border-indigo-500/50 text-indigo-300'
              }`}
            >
              {selectedUf.uf}
            </div>
            <div>
              <div className="text-sm font-bold text-white">{selectedUf.nome}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Região {selectedUf.regiao} · Código IBGE {selectedUf.codigoIbge}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-300 text-xs">
          <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
            <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Identificação Estadual (IBGE)</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">UF / Código IBGE</span>
                <span className="font-mono font-bold text-white">{selectedUf.uf} · {selectedUf.codigoIbge}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Capital</span>
                <span className="font-semibold text-white">{selectedUf.capital}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Polícia Civil</span>
                <span className="font-mono text-sky-300 font-semibold">{selectedUf.orgaoPC}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Polícia Militar</span>
                <span className="font-mono text-emerald-300 font-semibold">{selectedUf.orgaoPM}</span>
              </div>
              <div className="col-span-2 pt-1.5 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Situação da Base SIG</span>
                <span
                  className={`font-mono font-bold text-[11px] ${
                    isRj ? 'text-sky-400' : isIntegrado ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {selectedUf.statusSig === 'INTEGRADO_COMPLETO'
                    ? 'INTEGRADO COMPLETO (CISP/AISP/RISP + FACÇÕES)'
                    : selectedUf.statusSig === 'BASE_SIG_INTEGRADA'
                    ? 'BASE SIG INTEGRADA (TABELAS A/B + QGIS)'
                    : 'MALHA IBGE DISPONÍVEL · AGUARDANDO IMPORTAÇÃO'}
                </span>
              </div>
              <div className="col-span-2 pt-1.5 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Estrutura Territorial</span>
                <p className="text-slate-200 leading-relaxed mt-0.5">{selectedUf.estruturaResumo}</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Ações Territoriais para {selectedUf.uf}</span>
            </div>

            {(isRj || isMg || isEs) && onSelectEstadoScope ? (
              <button
                onClick={() => onSelectEstadoScope(selectedUf.uf as EstadoScope)}
                className="w-full py-2 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-md text-xs transition-colors cursor-pointer"
              >
                Abrir Visão Detalhada de {selectedUf.nome} ({selectedUf.uf}) →
              </button>
            ) : (
              onOpenImport && (
                <button
                  onClick={onOpenImport}
                  className="w-full py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold rounded-md text-xs transition-colors cursor-pointer"
                >
                  Importar Base Territorial (.xlsx / .csv / .kml) para {selectedUf.uf} →
                </button>
              )
            )}
          </section>

          <div className="p-2.5 bg-slate-900/40 rounded border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong>Transparência Metodológica:</strong> Apenas estados com fontes oficiais importadas exibem circunscrições policiais internas. Para as demais UFs, a malha estadual oficial do IBGE é exibida sem criação de polígonos fictícios de delegacias.
          </div>
        </div>
      </aside>
    );
  }

  if (!unit && !focoArea) return null;

  const aispNum = unit ? unit.aisp : focoArea ? focoArea.aisp : 2;
  const muniName = unit ? unit.municipio : focoArea ? focoArea.municipio : '';
  const cispNum = unit ? unit.cisp : focoArea ? focoArea.cisp : 82;
  const indicadores = getIndicadoresByAisp(aispNum, muniName);
  const rispInfo = unit ? RISP_COMMANDS[unit.risp] : null;

  // Retrieve documented armed groups / faction intelligence
  const faccaoRecord = focoArea?.faccaoInfo || getFaccaoByCisp(cispNum, muniName, aispNum);
  const cispFaccaoSummary = CISP_FACCAO_STATS[cispNum];

  const handleCopyDetails = () => {
    if (!unit) return;
    const text = `PAINEL TERRITORIAL RJ - DOSSIÊ DE UNIDADE
CISP: ${unit.delegaciaNome} (${unit.cisp}ª DP)
AISP: ${unit.aisp} - Batalhão: ${unit.batalhaoPMERJ}
RISP: ${unit.risp}ª RISP
Município: ${unit.municipio} (${unit.regiaoGoverno})
Bairros/Localidades Atendidas:
${unit.bairros.join(', ')}
Indicadores ISP-RJ (${anoEstatistica}):
- Letalidade Violenta: ${indicadores.letalidadeViolenta} (Taxa: ${indicadores.taxaLetalidade100k}/100k hab)
- Roubo de Veículos: ${indicadores.rouboVeiculo}
- Roubo de Rua: ${indicadores.rouboRua}
- Roubo de Carga: ${indicadores.rouboCarga}
Fonte Oficial: ${indicadores.fonte}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredBairros = unit?.bairros.filter(b =>
    b.toLowerCase().includes(bairroSearch.toLowerCase())
  ) || [];

  return (
    <aside className="w-full md:w-[440px] lg:w-[480px] bg-slate-950 border-l border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl z-20 shrink-0">
      {/* Panel Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-950 border border-sky-600/40 flex items-center justify-center text-sky-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {unit ? unit.delegaciaNome : focoArea?.nome}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{muniName}</span>
              <span>·</span>
              <span className="text-sky-400 font-mono">CISP {unit ? unit.cisp : focoArea?.cisp}</span>
              <span>·</span>
              <span className="text-indigo-400 font-mono">AISP {aispNum}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Strip */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between text-xs">
        <button
          onClick={handleCopyDetails}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copiado para área de transferência' : 'Copiar Dossiê'}</span>
        </button>

        <button
          onClick={onExportReport}
          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ficha Técnica PDF</span>
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-300 text-xs">
        {/* 1. IDENTIFICAÇÃO TERRITORIAL */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Identificação Territorial</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Município</span>
              <span className="font-medium text-white">{muniName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Região de Governo</span>
              <span className="font-medium text-white">{unit?.regiaoGoverno || 'Metropolitana'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">RISP</span>
              <span className="font-mono font-medium text-sky-300">
                {unit ? `${unit.risp}ª RISP` : '1ª RISP'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">AISP</span>
              <span className="font-mono font-medium text-indigo-300">
                AISP {String(aispNum).padStart(2, '0')}
              </span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-800/60">
              <span className="text-slate-500 block text-[10px] uppercase">Comando Regional PMERJ</span>
              <span className="font-medium text-slate-300">
                {rispInfo?.cpa || '1º Comando de Policiamento de Área'}
              </span>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {rispInfo?.abrangencia}
              </div>
            </div>
          </div>
        </section>

        {/* 2. RESPONSABILIDADE TERRITORIAL */}
        {unit && (
          <section className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Responsabilidade Territorial</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Delegacia Responsável (PCERJ)</span>
                <span className="font-semibold text-white text-sm">{unit.delegaciaNome}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{unit.circunscricao}</span>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-slate-500 block text-[10px] uppercase">Batalhão Territorial (PMERJ)</span>
                <span className="font-semibold text-emerald-400">{unit.batalhaoPMERJ}</span>
                <span className="text-[10px] text-slate-500 block">
                  Correspondência oficial confirmada por circunscrição de AISP.
                </span>
              </div>

              {/* Bairros e Localidades Atendidos */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 font-medium">
                    Bairros e Localidades Vinculadas ({unit.bairros.length})
                  </span>
                </div>

                {unit.bairros.length > 5 && (
                  <input
                    type="text"
                    placeholder="Filtrar bairro..."
                    value={bairroSearch}
                    onChange={e => setBairroSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white mb-2 focus:outline-none focus:border-indigo-500"
                  />
                )}

                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {filteredBairros.map((b, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 bg-slate-950/70 border border-slate-800/60 rounded text-slate-300 text-xs flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                  {filteredBairros.length === 0 && (
                    <div className="text-slate-500 text-center py-2">
                      Nenhum bairro localizado com este filtro
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. INDICADORES OFICIAIS DE SEGURANÇA (ISP-RJ) */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Indicadores de Segurança ISP-RJ</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              Ano {anoEstatistica}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Letalidade Violenta</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold font-mono text-rose-400 tabular-nums">
                  {indicadores.letalidadeViolenta}
                </span>
                <span className="text-[10px] text-slate-500">vítimas</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {indicadores.homicidioDoloso} homicídios · {indicadores.morteIntervencaoPolicial} MDIP
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Taxa / 100k hab.</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                  {indicadores.taxaLetalidade100k}
                </span>
                <span className="text-[10px] text-slate-500">tx letal.</span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />
                <span>Tendência de queda</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Roubo de Veículos</span>
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {indicadores.rouboVeiculo}
              </span>
              <span className="text-[10px] text-slate-500 ml-1">casos</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Roubo de Carga</span>
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {indicadores.rouboCarga}
              </span>
              <span className="text-[10px] text-slate-500 ml-1">ocorrências</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Roubo de Rua</span>
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {indicadores.rouboRua}
              </span>
              <span className="text-[10px] text-slate-500 ml-1">transeunte/cel.</span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block uppercase">Apreensão de Armas</span>
              <span className="text-sm font-bold font-mono text-sky-400 tabular-nums">
                {indicadores.apreensaoArmas}
              </span>
              <span className="text-[10px] text-slate-500 ml-1">
                ({indicadores.apreensaoFuzis} fuzis)
              </span>
            </div>
          </div>

          {/* Historical Series (2020 - 2025) */}
          <div className="bg-slate-950 p-3 rounded border border-slate-800/80 mb-2">
            <span className="text-[11px] font-semibold text-slate-300 block mb-2">
              Série Histórica (2020 - 2025) · Letalidade Violenta
            </span>
            <div className="flex items-end justify-between gap-1 h-20 pt-2">
              {indicadores.serieHistorica.map(item => {
                const maxVal = Math.max(...indicadores.serieHistorica.map(s => s.letalidadeViolenta));
                const heightPct = Math.max(15, Math.round((item.letalidadeViolenta / maxVal) * 100));
                const isCurrent = item.ano === anoEstatistica;
                return (
                  <div key={item.ano} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[9px] font-mono tabular-nums text-slate-400">
                      {item.letalidadeViolenta}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all ${
                        isCurrent ? 'bg-sky-400' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-slate-500">
                      {item.ano}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Official Source & Reference */}
          <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
            <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.2" />
            <div>
              <span>Fonte: {indicadores.fonte}</span>
              <br />
              <span>Período de referência: {indicadores.periodoReferencia}</span>
            </div>
          </div>
        </section>

        {/* 4. REGISTRO DOCUMENTADO DE GRUPOS ARMADOS & FACÇÕES NA REGIÃO */}
        {faccaoRecord && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Dinâmica Territorial / Facções Documentadas</span>
              </div>
              {(() => {
                const precMeta = FAC_CATALOG[faccaoRecord.grupo as CodigoFaccaoPrecisa];
                if (precMeta) {
                  return (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: `${precMeta.color}22`,
                        borderColor: `${precMeta.color}88`,
                        color: '#ffffff'
                      }}
                    >
                      {precMeta.shortLabel}
                    </span>
                  );
                }
                return (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                      faccaoRecord.grupo === 'MILICIA'
                        ? 'bg-sky-950/80 border-sky-500/70 text-sky-300'
                        : faccaoRecord.grupo === 'EM_DISPUTA'
                        ? 'bg-amber-950/80 border-amber-600/70 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    {faccaoRecord.grupo === 'MILICIA'
                      ? 'Milícia'
                      : faccaoRecord.grupo === 'EM_DISPUTA'
                      ? 'Disputa'
                      : 'Ordinário'}
                  </span>
                );
              })()}
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Grupo Documentado</span>
                <span className="font-bold text-white text-right">{faccaoRecord.nomeGrupo}</span>
              </div>

              <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-slate-900">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Situação Registrada</span>
                <span
                  className={`font-semibold text-right ${
                    faccaoRecord.situacao === 'Predomínio Documentado'
                      ? 'text-rose-400'
                      : faccaoRecord.situacao === 'Área em Disputa'
                      ? 'text-amber-400'
                      : faccaoRecord.situacao === 'Área Neutra'
                      ? 'text-slate-300'
                      : faccaoRecord.situacao === 'Sob Monitoramento Integrado'
                      ? 'text-sky-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {faccaoRecord.situacao}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-slate-900">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Fonte Pública / Confiabilidade</span>
                <span className="text-slate-300 text-right text-[11px] font-mono">{faccaoRecord.grauConfiabilidade}</span>
              </div>

              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                <span className="text-slate-500 font-semibold uppercase block">Fonte Pública:</span>
                <span className="text-slate-300">{faccaoRecord.fonte} ({faccaoRecord.dataReferencia})</span>
              </div>

              <div className="text-[11px] text-slate-300 pt-1.5 border-t border-slate-800/80 leading-relaxed bg-slate-900/40 p-2 rounded">
                <span className="text-[10px] font-bold text-sky-400 block mb-0.5 uppercase tracking-wider">
                  Dossiê Territorial & Dinâmica Local:
                </span>
                {faccaoRecord.detalhes}
              </div>
            </div>

            {cispFaccaoSummary && cispFaccaoSummary.total > 0 && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-sky-400">
                  <span>Comunidades Mapeadas na {cispNum}ª DP</span>
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
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 pt-1 border-t border-slate-900">
                  {cispFaccaoSummary.areas.slice(0, 25).map((area, idx) => {
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
                  {cispFaccaoSummary.areas.length > 25 && (
                    <div className="text-[10px] text-slate-500 text-center pt-1">
                      +{cispFaccaoSummary.areas.length - 25} outras áreas visíveis no mapa
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aviso Jurídico Obrigatório */}
            <div className="p-2 bg-rose-950/20 border border-rose-900/30 rounded text-[10px] text-rose-300/80 leading-tight">
              <strong>Nota Metodológica & Jurídica:</strong> Informações compiladas estritamente a partir de pesquisas públicas consolidadas (Dados de Riscos ago/2026, GENI-UFF / Fogo Cruzado), investigações do MP-RJ (GAECO) e estatísticas do ISP-RJ. Não constituem homologação de domínio pelo Estado.
            </div>
          </section>
        )}

        {/* 5. INFORMAÇÕES ADICIONAIS DE FOCO ESPECIAL (Se houver polígono demarcado selecionado) */}
        {focoArea && (
          <section className="bg-amber-950/20 border border-amber-800/50 rounded-lg p-3.5">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Polígono Especial KML: {focoArea.nome}</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div>
                <span className="text-slate-400">Natureza do Registro:</span>{' '}
                <span className="text-white font-medium">{focoArea.natureza}</span>
              </div>
              <div>
                <span className="text-slate-400">Fonte Oficial:</span>{' '}
                <span className="text-slate-200">{focoArea.fonteOficial}</span>
              </div>
              <div>
                <span className="text-slate-400">Data de Registro:</span>{' '}
                <span className="font-mono text-slate-300">{focoArea.dataRegistro}</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-slate-400">Grau de Confiabilidade:</span>
                <span className="text-emerald-400 font-semibold">{focoArea.grauConfiabilidade}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-amber-900/40">
                {focoArea.observacoes}
              </p>
            </div>
          </section>
        )}

        {/* Legal & Methodological Disclaimer */}
        <div className="p-2.5 bg-slate-900/30 rounded border border-slate-800/50 text-[10px] text-slate-500 leading-relaxed">
          <strong>Aviso Metodológico:</strong> Informações territoriais e limites circunscricionais são compilados 
          a partir das fontes oficiais das secretarias estaduais e do Instituto de Segurança Pública (ISP-RJ). 
          Não são apresentadas alegações não fundamentadas; registros territoriais possuem fonte, data e integridade preservada.
        </div>
      </div>
    </aside>
  );
};
