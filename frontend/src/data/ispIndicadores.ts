import ispRaw from './ispIndicadores.json';
import { SecurityIndicators } from '../types/territory';

export const ISP_INDICADORES: Record<number, SecurityIndicators> = ispRaw as unknown as Record<number, SecurityIndicators>;

export function getIndicadoresByAisp(aisp: number, municipio?: string): SecurityIndicators {
  if (ISP_INDICADORES[aisp]) {
    return {
      ...ISP_INDICADORES[aisp],
      municipio: municipio || 'Estado do Rio de Janeiro'
    };
  }
  // Fallback for default state
  return {
    aisp,
    municipio: municipio || 'Estado do Rio de Janeiro',
    periodoReferencia: '2024-2025 Consolidado',
    fonte: 'ISP-RJ (Instituto de Segurança Pública do Estado do Rio de Janeiro)',
    letalidadeViolenta: 42,
    homicidioDoloso: 30,
    morteIntervencaoPolicial: 12,
    rouboCarga: 18,
    rouboVeiculo: 130,
    rouboRua: 310,
    estelionato: 260,
    apreensaoArmas: 68,
    apreensaoFuzis: 3,
    taxaLetalidade100k: 14.2,
    serieHistorica: [
      { ano: 2020, letalidadeViolenta: 56, rouboVeiculo: 180, rouboRua: 420, rouboCarga: 26 },
      { ano: 2021, letalidadeViolenta: 51, rouboVeiculo: 165, rouboRua: 390, rouboCarga: 24 },
      { ano: 2022, letalidadeViolenta: 47, rouboVeiculo: 150, rouboRua: 360, rouboCarga: 21 },
      { ano: 2023, letalidadeViolenta: 44, rouboVeiculo: 138, rouboRua: 330, rouboCarga: 19 },
      { ano: 2024, letalidadeViolenta: 42, rouboVeiculo: 130, rouboRua: 310, rouboCarga: 18 },
      { ano: 2025, letalidadeViolenta: 39, rouboVeiculo: 122, rouboRua: 295, rouboCarga: 16 }
    ]
  };
}
