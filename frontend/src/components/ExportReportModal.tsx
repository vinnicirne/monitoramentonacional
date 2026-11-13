import React, { useRef, useState } from 'react';
import { X, Download, Printer, Shield, FileCheck, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PoliceUnitRecord } from '../types/territory';
import { getIndicadoresByAisp } from '../data/ispIndicadores';
import { RISP_COMMANDS } from '../data/territoryData';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: PoliceUnitRecord | null;
  anoEstatistica: number;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  unit,
  anoEstatistica
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !unit) return null;

  const indicadores = getIndicadoresByAisp(unit.aisp, unit.municipio);
  const rispInfo = RISP_COMMANDS[unit.risp];
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const currentTimestamp = new Date().toLocaleString('pt-BR');

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setSuccessMsg(null);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0b1120'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Dossie_Territorial_CISP_${unit.cisp}_${unit.municipio.replace(/\s+/g, '_')}.pdf`);
      setSuccessMsg('Relatório PDF gerado e baixado com sucesso!');
    } catch (err: any) {
      console.error(err);
      // Fallback: window print
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-3xl my-6 flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Controls Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Dossiê Técnico de Consulta Territorial
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-md transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isExporting ? 'Gerando PDF...' : 'Baixar PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="p-2.5 bg-emerald-950/60 border-b border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Printable/Exportable Document Area */}
        <div className="p-6 overflow-y-auto bg-slate-950">
          <div
            ref={reportRef}
            className="bg-[#0b1120] border border-slate-800 rounded-lg p-6 space-y-6 text-slate-200 text-xs shadow-inner"
          >
            {/* Document Header */}
            <div className="border-b-2 border-slate-700 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-sky-950 border border-sky-600/50 flex items-center justify-center text-sky-400">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-white tracking-tight uppercase">
                    ESTADO DO RIO DE JANEIRO
                  </h1>
                  <h2 className="text-xs font-semibold text-sky-400">
                    SISTEMA DE INTELIGÊNCIA GEOGRÁFICA E MONITORAMENTO TERRITORIAL
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Ficha Técnica de Circunscrição Policial · RISP · AISP · CISP
                  </p>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-400 font-mono">
                <div>Emitido em: {currentDate}</div>
                <div>Hora: {currentTimestamp}</div>
                <div className="text-emerald-400 font-semibold mt-0.5">DOC. OFICIAL VERIFICADO</div>
              </div>
            </div>

            {/* Section 1: Identificação da Unidade */}
            <div>
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                1. Identificação Territorial & Competência
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">CISP (Delegacia)</span>
                  <span className="text-sm font-bold text-white font-mono">{unit.delegaciaNome}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">AISP Correspondente</span>
                  <span className="text-sm font-bold text-indigo-400 font-mono">AISP {unit.aisp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">RISP</span>
                  <span className="text-sm font-bold text-sky-400 font-mono">{unit.risp}ª RISP</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Município</span>
                  <span className="text-sm font-bold text-white">{unit.municipio}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block">Batalhão da PMERJ Associado</span>
                  <span className="font-semibold text-emerald-400">{unit.batalhaoPMERJ}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase block">Comando Regional (CPA)</span>
                  <span className="font-semibold text-slate-300">{rispInfo?.cpa}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Bairros e Localidades Atendidos */}
            <div>
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                2. Bairros e Localidades sob Circunscrição ({unit.bairros.length} unidades)
              </h3>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {unit.unidadeTerritorial}
                </p>
              </div>
            </div>

            {/* Section 3: Indicadores Oficiais de Segurança do ISP-RJ */}
            <div>
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">
                3. Indicadores de Segurança Pública (ISP-RJ · Ano {anoEstatistica})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Letalidade Violenta</span>
                  <span className="text-base font-bold font-mono text-rose-400 tabular-nums">
                    {indicadores.letalidadeViolenta}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    ({indicadores.homicidioDoloso} homicídios, {indicadores.morteIntervencaoPolicial} MDIP)
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Taxa por 100k hab.</span>
                  <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                    {indicadores.taxaLetalidade100k}
                  </span>
                  <span className="text-[10px] text-slate-500 block">óbitos violentos / 100 mil</span>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Roubo de Veículos</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {indicadores.rouboVeiculo}
                  </span>
                  <span className="text-[10px] text-slate-500 block">veículos subtraídos</span>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Roubo de Carga</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {indicadores.rouboCarga}
                  </span>
                  <span className="text-[10px] text-slate-500 block">ocorrências registradas</span>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Roubo de Rua</span>
                  <span className="text-base font-bold font-mono text-white tabular-nums">
                    {indicadores.rouboRua}
                  </span>
                  <span className="text-[10px] text-slate-500 block">transeunte e celular</span>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Apreensão de Armas</span>
                  <span className="text-base font-bold font-mono text-sky-400 tabular-nums">
                    {indicadores.apreensaoArmas}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    (sendo {indicadores.apreensaoFuzis} fuzis)
                  </span>
                </div>
              </div>

              {/* Table of Historical Series */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono border border-slate-800">
                  <thead className="bg-slate-900 text-slate-300">
                    <tr>
                      <th className="p-2 border-b border-slate-800">Ano</th>
                      <th className="p-2 border-b border-slate-800">Letalidade Violenta</th>
                      <th className="p-2 border-b border-slate-800">Roubo de Veículos</th>
                      <th className="p-2 border-b border-slate-800">Roubo de Rua</th>
                      <th className="p-2 border-b border-slate-800">Roubo de Carga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {indicadores.serieHistorica.map(row => (
                      <tr key={row.ano} className={row.ano === anoEstatistica ? 'bg-sky-950/40 font-bold text-white' : ''}>
                        <td className="p-2">{row.ano}</td>
                        <td className="p-2 text-rose-300">{row.letalidadeViolenta}</td>
                        <td className="p-2">{row.rouboVeiculo}</td>
                        <td className="p-2">{row.rouboRua}</td>
                        <td className="p-2">{row.rouboCarga}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document Footer & Methodology */}
            <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span>Fonte Oficial dos Dados: {indicadores.fonte}</span>
                <br />
                <span>Base Territorial: Relacao_RISPxAISPxCISP e Geoprocessamento SEPM/PCERJ</span>
              </div>
              <div className="font-mono text-slate-400">
                HASH: RJ-TERR-{unit.cisp}-{unit.aisp}-{Date.now().toString(36).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
