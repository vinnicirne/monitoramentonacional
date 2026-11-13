import React from 'react';
import { TERRITORY_METRICS } from '../data/territoryData';
import { EstadoScope } from '../types/sigBase';

interface MetricsBarProps {
  estadoScope: EstadoScope;
  totalFocosEspeciais: number;
  totalCustomRecords?: number;
  mgEsDivisaoCount?: number;
  mgEsUnidadesCount?: number;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  estadoScope,
  totalFocosEspeciais,
  totalCustomRecords = 0,
  mgEsDivisaoCount = 0,
  mgEsUnidadesCount = 0
}) => {
  if (estadoScope === 'RJ') {
    return (
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-6 py-2 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[760px] gap-6 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">Municípios Atendidos:</span>
              <span className="font-mono font-bold text-white tabular-nums text-sm">
                {TERRITORY_METRICS.municipiosCadastrados}
              </span>
              <span className="text-[10px] text-slate-500">/ 92 RJ</span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">CISP (Delegacias):</span>
              <span className="font-mono font-bold text-sky-400 tabular-nums text-sm">
                {TERRITORY_METRICS.totalCISP}
              </span>
              <span className="text-[10px] text-slate-500">circunscrições</span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">AISP (Batalhões):</span>
              <span className="font-mono font-bold text-indigo-400 tabular-nums text-sm">
                {TERRITORY_METRICS.totalAISP}
              </span>
              <span className="text-[10px] text-slate-500">áreas integradas</span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">RISP (Comandos):</span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums text-sm">
                {TERRITORY_METRICS.totalRISP}
              </span>
              <span className="text-[10px] text-slate-500">regiões</span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">Áreas Mapeadas (Facções):</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums text-sm">
                {totalFocosEspeciais.toLocaleString('pt-BR')}
              </span>
              <span className="text-[10px] text-slate-500">Dados de Riscos · ago/2026</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            {totalCustomRecords > 0 && (
              <span className="font-mono text-emerald-400">
                +{totalCustomRecords} registros importados
              </span>
            )}
            <span className="hidden xl:inline text-slate-500">
              Base Cartográfica: ISP-RJ & Geoprocessamento Oficial
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (estadoScope === 'TODOS') {
    return (
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-6 py-2 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[780px] gap-6 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">Escopo:</span>
              <span className="font-mono font-bold text-sky-400 text-sm">
                Todos Integrados (RJ + MG + ES)
              </span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">RISPs Oficiais:</span>
              <span className="font-mono font-bold text-emerald-400 tabular-nums text-sm">31</span>
              <span className="text-[10px] text-slate-500">(7 RJ · 19 MG · 5 ES)</span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">CISPs RJ:</span>
              <span className="font-mono font-bold text-white tabular-nums text-sm">
                {TERRITORY_METRICS.totalCISP}
              </span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">SIG MG+ES (Tab. A/B):</span>
              <span className="font-mono font-bold text-indigo-400 tabular-nums text-sm">
                {mgEsDivisaoCount} / {mgEsUnidadesCount}
              </span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-baseline gap-2">
              <span className="text-slate-400">Áreas Facções (RJ):</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums text-sm">
                {totalFocosEspeciais.toLocaleString('pt-BR')}
              </span>
              <span className="text-[10px] text-slate-500">ago/2026</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span className="hidden xl:inline">
              Visão Unificada: RJ (ISP/Dados de Riscos) + MG (SEJUSP) + ES (SESP)
            </span>
          </div>
        </div>
      </div>
    );
  }

  // MG, ES ou MG+ES
  const rispLabel = estadoScope === 'MG' ? '19' : estadoScope === 'ES' ? '5' : '24 (19 MG + 5 ES)';
  const nivelLabel =
    estadoScope === 'MG'
      ? '3 Níveis: RISP · ACISP · AISP'
      : estadoScope === 'ES'
      ? '2 Níveis: 5 RISPs · 23 AISPs'
      : 'MG (RISP/ACISP/AISP) · ES (5 RISP / 23 AISP)';

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 lg:px-6 py-2 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[760px] gap-6 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-slate-400">Escopo SIG:</span>
            <span className="font-mono font-bold text-sky-400 text-sm">
              {estadoScope === 'MG_ES' ? 'MG + ES' : estadoScope}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-baseline gap-2">
            <span className="text-slate-400">RISPs Oficiais:</span>
            <span className="font-mono font-bold text-white tabular-nums text-sm">{rispLabel}</span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-baseline gap-2">
            <span className="text-slate-400">Hierarquia:</span>
            <span className="font-mono font-semibold text-indigo-400">{nivelLabel}</span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-baseline gap-2">
            <span className="text-slate-400">Tabela A (Divisão):</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums text-sm">
              {mgEsDivisaoCount}
            </span>
            <span className="text-[10px] text-slate-500">linhas</span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-baseline gap-2">
            <span className="text-slate-400">Tabela B (Unidades PC):</span>
            <span className="font-mono font-bold text-amber-400 tabular-nums text-sm">
              {mgEsUnidadesCount}
            </span>
            <span className="text-[10px] text-slate-500">cadastradas</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
          <span className="hidden xl:inline">
            Fontes: Observatório SESP-ES · PCES · SEJUSP-MG (SIRGAS 2000) · PCMG
          </span>
        </div>
      </div>
    </div>
  );
};
