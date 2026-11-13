import React from 'react';
import { Printer, X, Download, Shield } from 'lucide-react';
import { SelectedFeatureData } from '../types';

interface PrintableDossierProps {
  data: SelectedFeatureData | null;
  onClose: () => void;
}

export const PrintableDossierModal: React.FC<PrintableDossierProps> = ({ data, onClose }) => {
  if (!data) return null;

  const curDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col my-8 overflow-hidden print:m-0 print:w-full print:max-w-none print:shadow-none">
        {/* Screen Controls Header */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Printer className="w-4 h-4 text-emerald-400" />
            Visualização de Impressão Oficial do Dossiê Técnico
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <div className="p-8 space-y-6 text-xs text-slate-800 font-sans">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-widest font-bold uppercase text-slate-500">
                Governo do Estado do Rio de Janeiro
              </div>
              <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">
                Dossiê Técnico de Governança e Inteligência Territorial
              </h1>
              <div className="text-[11px] text-slate-600">
                Sistema Integrado de Monitoramento Cartográfico (GIS) • Base ISP / PCERJ / PMERJ
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-500 font-mono">
              <div>DOC Nº: {data.id}-{new Date().getFullYear()}</div>
              <div>EMISSÃO: {curDate}</div>
              <div>STATUS: HOMOLOGADO</div>
            </div>
          </div>

          {/* Section 1: Identification */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 border-l-4 border-blue-600">
              1. Identificação da Unidade e Jurisdição Policial
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Nome Oficial:</span>
                <span className="font-bold text-slate-900">{data.nome}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Classificação Cartográfica:</span>
                <span className="font-bold text-slate-900">{data.tipo} (Código {data.cisp || data.aisp || data.risp})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Município Vinculado:</span>
                <span className="font-semibold text-slate-900">{data.municipio || 'Não especificado'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Área Territorial Demarcada:</span>
                <span className="font-semibold text-slate-900 font-mono">{data.areakm2 ? `${data.areakm2.toFixed(2)} km²` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Batalhão da PMERJ (AISP):</span>
                <span className="font-semibold text-slate-900">{data.batalhao || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Comando Regional (RISP):</span>
                <span className="font-semibold text-slate-900">{data.risp ? `RISP ${data.risp}` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Contact and Address */}
          {(data.endereco || data.telefone) && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 border-l-4 border-blue-600">
                2. Localização da Sede e Contatos Operacionais
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Endereço da Sede:</span>
                  <span className="text-slate-900">{data.endereco || 'Sede Regional'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Telefone Oficial de Plantão:</span>
                  <span className="text-slate-900 font-mono">{data.telefone || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Legal Framework */}
          {data.marcolegal && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 border-l-4 border-blue-600">
                3. Marco Legal Regulamentador
              </h2>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800">
                {data.marcolegal}
              </div>
            </div>
          )}

          {/* Section 4: Indicators */}
          {data.indicadores && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 border-l-4 border-blue-600">
                4. Estatísticas Oficiais do ISP-RJ (Consolidado 2025)
              </h2>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 p-2 text-left">Indicador Estratégico</th>
                    <th className="border border-slate-300 p-2 text-center">Registros 2025</th>
                    <th className="border border-slate-300 p-2 text-center">Taxa/100k</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">Letalidade Violenta</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-red-600">
                      {data.indicadores.atual_2025.letalidade_violenta}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono">
                      {data.indicadores.taxa_letalidade_100k}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">Roubo de Rua (Transeunte/Celular/Coletivo)</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-amber-600">
                      {data.indicadores.atual_2025.roubo_rua}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono">
                      {data.indicadores.taxa_roubo_100k}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">Roubo de Veículo</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">
                      {data.indicadores.atual_2025.roubo_veiculo}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono">-</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-medium">Armas e Fuzis Apreendidos</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-emerald-700">
                      {data.indicadores.atual_2025.armas_apreendidas} ({data.indicadores.atual_2025.fuzis_apreendidos} fuzis)
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Section 5: Faction Dynamics & Intelligence */}
          {data.dinamica_territorial && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 border-l-4 border-red-600">
                5. Registro Documentado de Dinâmica Territorial & Grupos Armados
              </h2>
              <div className="p-3 bg-red-50/50 border border-red-200 rounded space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Grupo Predominante: </span>
                    <strong className="text-red-700">{data.dinamica_territorial.faccao}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Grau de Risco: </span>
                    <strong className="text-slate-900">{data.dinamica_territorial.grau_risco}</strong>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {data.dinamica_territorial.status}
                </p>
                <div className="text-[10px] text-slate-600 border-t border-red-200 pt-1 flex justify-between">
                  <span><strong>Fonte:</strong> {data.dinamica_territorial.fonte}</span>
                  <span><strong>Período:</strong> {data.dinamica_territorial.data}</span>
                  <span><strong>Confiabilidade:</strong> {data.dinamica_territorial.confiabilidade}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Covered Neighborhoods */}
          {data.bairros && data.bairros.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 border-l-4 border-blue-600">
                6. Bairros e Localidades Oficiais Atendidos ({data.bairros.length})
              </h2>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {data.bairros.map((b, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="pt-6 border-t border-slate-300 text-[9px] text-slate-500 flex justify-between items-center">
            <div>
              Documento emitido pelo Painel de Monitoramento Territorial — Rio de Janeiro.
            </div>
            <div>
              Chave de Autenticação: {Math.random().toString(36).substring(2, 10).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

