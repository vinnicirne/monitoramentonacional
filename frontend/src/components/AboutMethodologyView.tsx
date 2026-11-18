import React from 'react';
import { Award, Lock } from 'lucide-react';
import { 
  ShieldCheck, 
  Map, 
  Database, 
  BookOpen, 
  Layers, 
  FileCheck2, 
  AlertCircle,
  Building2,
  Users
} from 'lucide-react';

interface AboutMethodologyViewProps {
  onOpenLicense?: () => void;
}

export const AboutMethodologyView: React.FC<AboutMethodologyViewProps> = ({ onOpenLicense }) => {
  return (
    <div className="flex-1 h-full bg-[#F5F5F5] overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Hero */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE600] border border-[#E6CF00] text-[#2D3277] text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          Governança Cartográfica & Inteligência Policial · MELI
        </div>

        <h1 className="text-2xl font-extrabold text-[#2D3277]">
          Painel de Monitoramento Territorial — RJ · MG · ES
        </h1>
        <p className="text-sm text-slate-700 leading-relaxed">
          O Painel de Monitoramento Territorial é uma plataforma interativa de Sistema de Inteligência Geográfica (GIS) e Governança Territorial desenvolvida em <strong className="text-slate-900">React</strong>, <strong className="text-slate-900">TypeScript</strong> e <strong className="text-slate-900">OpenLayers (v9.2.4)</strong> voltada para a consulta, cruzamento unívoco e análise cartográfica das divisões policiais, estatísticas criminais oficiais e registros públicos territoriais.
        </p>
      </div>

      {/* Titularidade e Licença Vinculada (Agência Ícone Digital by Vinicius Cirne) */}
      <div className="max-w-4xl mx-auto p-5 bg-gradient-to-r from-[#2D3277]/5 via-white to-white border border-[#2D3277]/20 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#2D3277] shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-[#2D3277]">
                Titularidade, Desenvolvimento & Licença Tecnológica
              </h2>
              <p className="text-xs text-slate-500">
                Propriedade Intelectual Registrada & Licença Vinculada Homologada
              </p>
            </div>
          </div>

          {onOpenLicense && (
            <button
              onClick={onOpenLicense}
              className="px-3.5 py-1.5 rounded-lg bg-[#2D3277] hover:bg-[#1E2258] text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer self-start sm:self-auto"
            >
              <FileCheck2 className="w-4 h-4 text-[#FFE600]" />
              <span>Ver Certificado de Licença</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#2D3277] block tracking-wider">
              Entidade Mantenedora & Titular
            </span>
            <div className="text-sm font-bold text-slate-900">Agência Ícone Digital</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Titular dos direitos sobre o software e seus componentes originais. O painel reproduz dados públicos do ISP, do Fogo Cruzado e de outras fontes; o conteúdo original e suas atualizações cabem a esses portais, e os dados não são propriedade da agência.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#2D3277] block tracking-wider">
              Engenharia & Coordenação Técnica
            </span>
            <div className="text-sm font-bold text-slate-900">Vinicius Cirne</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Responsável técnico pela modelagem territorial, desenvolvimento de interfaces, orquestração de microsserviços e integração de dados.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#008744]" />
            Licença Registrada: <strong className="text-slate-900 font-mono">AID-VC-GIS-2026-BR-RJ</strong>
          </span>
          <span className="text-slate-500 hidden sm:inline">
            Protegido pelas Leis Federais 9.609/1998 e 9.610/1998
          </span>
        </div>
      </div>


      {/* Grid of Solved Problems */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-base font-bold text-[#2D3277] border-b border-slate-200 pb-2">
          Problemas Estruturais Resolvidos pela Plataforma
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <div className="font-bold text-sm text-[#2968C8] flex items-center gap-2">
              <Database className="w-4 h-4" />
              1. Fragmentação de dados entre órgãos e arquivos
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consolida planilhas de delegacias (Excel), arquivos cartográficos (.kml/.rar) da PCERJ e PMERJ, relações de bairros em PDF e séries históricas do ISP-RJ em um único ambiente integrado por clique georreferenciado.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <div className="font-bold text-sm text-[#008744] flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              2. Clareza de competência: "Quem responde por qual território"
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Permite a qualquer analista, operação ou autoridade identificar instantaneamente qual delegacia (CISP), qual batalhão (AISP) e qual comando regional (RISP) respondem por cada logradouro ou município.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <div className="font-bold text-sm text-amber-700 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              3. Integração entre território, estatística e dinâmicas armadas
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Supera os números isolados ao associar o polígono geográfico aos indicadores criminais (letalidade violenta, roubo de carga, rua e armas) e aos focos especiais de disputas de facções.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <div className="font-bold text-sm text-rose-700 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" />
              4. Rigor documental sem afirmações fictícias
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Toda informação sobre facções armadas (CV, TCP, ADA, Milícia) possui fonte pública identificada (GENI-UFF, Fogo Cruzado, MP-RJ/GAECO, SEPM), período de apuração e grau de confiabilidade.
            </p>
          </div>
        </div>
      </div>

      {/* Structure Architecture */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-base font-bold text-[#2D3277] border-b border-slate-200 pb-2">
          Estrutura Oficial de Segurança Pública Mapeada (RJ)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="text-2xl font-extrabold text-[#2D3277] font-mono">7</div>
            <div className="text-xs font-bold text-slate-900 mt-1">RISPs</div>
            <div className="text-[11px] text-slate-500">Comandos Regionais (CPAs)</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="text-2xl font-extrabold text-amber-600 font-mono">41</div>
            <div className="text-xs font-bold text-slate-900 mt-1">AISPs</div>
            <div className="text-[11px] text-slate-500">Batalhões da PMERJ</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="text-2xl font-extrabold text-[#008744] font-mono">137</div>
            <div className="text-xs font-bold text-slate-900 mt-1">CISPs</div>
            <div className="text-[11px] text-slate-500">Delegacias da PCERJ</div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="text-2xl font-extrabold text-[#3483FA] font-mono">92</div>
            <div className="text-xs font-bold text-slate-900 mt-1">Municípios</div>
            <div className="text-[11px] text-slate-500">Totalidade do Estado</div>
          </div>
        </div>
      </div>

      {/* Technical and Legal Disclaimer */}
      <div className="max-w-4xl mx-auto p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-xs text-slate-600 space-y-2">
        <div className="font-bold text-[#2D3277] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Aviso Metodológico & Marco Regulatório
        </div>
        <p className="leading-relaxed">
          As demarcações poligonais e descrições seguem as Portarias SESP nº 310/2000, Resolução SESEG nº 151/2008 e memoriais descritivos do Diário Oficial do Estado do Rio de Janeiro. As estatísticas criminais espelham a metodologia oficial do Instituto de Segurança Pública (ISP-RJ).
        </p>
      </div>

      {/* Titularidade e Licença Vinculada (Agência Ícone Digital by Vinicius Cirne) */}
      <div className="max-w-4xl mx-auto p-5 bg-gradient-to-r from-[#2D3277]/5 via-white to-white border border-[#2D3277]/20 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[#2D3277] shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-[#2D3277]">
                Titularidade, Desenvolvimento & Licença Tecnológica
              </h2>
              <p className="text-xs text-slate-500">
                Propriedade Intelectual Registrada & Licença Vinculada Homologada
              </p>
            </div>
          </div>

          {onOpenLicense && (
            <button
              onClick={onOpenLicense}
              className="px-3.5 py-1.5 rounded-lg bg-[#2D3277] hover:bg-[#1E2258] text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer self-start sm:self-auto"
            >
              <FileCheck2 className="w-4 h-4 text-[#FFE600]" />
              <span>Ver Certificado de Licença</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#2D3277] block tracking-wider">
              Entidade Mantenedora & Titular
            </span>
            <div className="text-sm font-bold text-slate-900">Agência Ícone Digital</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Titular dos direitos sobre o software e seus componentes originais. O painel reproduz dados públicos do ISP, do Fogo Cruzado e de outras fontes; o conteúdo original e suas atualizações cabem a esses portais, e os dados não são propriedade da agência.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#2D3277] block tracking-wider">
              Engenharia & Coordenação Técnica
            </span>
            <div className="text-sm font-bold text-slate-900">Vinicius Cirne</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Responsável técnico pela modelagem territorial, desenvolvimento de interfaces, orquestração de microsserviços e integração de dados.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#008744]" />
            Licença Registrada: <strong className="text-slate-900 font-mono">AID-VC-GIS-2026-BR-RJ</strong>
          </span>
          <span className="text-slate-500 hidden sm:inline">
            Protegido pelas Leis Federais 9.609/1998 e 9.610/1998
          </span>
        </div>
      </div>

    </div>
  );
};

