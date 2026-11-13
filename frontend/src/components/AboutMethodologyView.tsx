import React from 'react';
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

export const AboutMethodologyView: React.FC = () => {
  return (
    <div className="flex-1 h-[calc(100vh-4rem)] bg-slate-950 overflow-y-auto p-8 space-y-8">
      {/* Hero */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          Governança Cartográfica & Inteligência Policial
        </div>

        <h1 className="text-2xl font-bold text-slate-100">
          Painel de Monitoramento Territorial — Rio de Janeiro
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          O Painel de Monitoramento Territorial — Rio de Janeiro é uma plataforma interativa de Sistema de Inteligência Geográfica (GIS) e Governança Territorial desenvolvida em <strong>React</strong>, <strong>TypeScript</strong> e <strong>OpenLayers (v9.2.4)</strong> voltada para a consulta, cruzamento unívoco e análise cartográfica das divisões policiais, estatísticas criminais oficiais e registros públicos territoriais do Estado do Rio de Janeiro.
        </p>
      </div>

      {/* Grid of Solved Problems */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">
          Problemas Estruturais Resolvidos pela Plataforma
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <Database className="w-4 h-4" />
              1. Fragmentação de dados entre órgãos e arquivos
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consolida planilhas de delegacias (Excel), arquivos cartográficos (.kml/.rar) da PCERJ e PMERJ, relações de bairros em PDF e séries históricas do ISP-RJ em um único ambiente integrado por clique georreferenciado.
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              2. Clareza de competência: "Quem responde por qual território"
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Permite a qualquer analista, cidadão ou autoridade identificar instantaneamente qual delegacia (CISP), qual batalhão (AISP) e qual comando regional (RISP) respondem por cada logradouro ou município do RJ.
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              3. Integração entre território, estatística e dinâmicas armadas
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Supera os números isolados ao associar o polígono geográfico aos indicadores criminais (letalidade violenta, roubo de carga, rua e armas) e aos focos especiais de disputas de facções.
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-sm text-rose-400 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" />
              4. Rigor documental sem afirmações fictícias
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toda informação sobre facções armadas (CV, TCP, ADA, Milícia) possui fonte pública identificada (GENI-UFF, Fogo Cruzado, MP-RJ/GAECO, SEPM), período de apuração e grau de confiabilidade.
            </p>
          </div>
        </div>
      </div>

      {/* Structure Architecture */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">
          Estrutura Oficial de Segurança Pública Mapeada
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-2xl font-bold text-blue-400 font-mono">7</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">RISPs</div>
            <div className="text-[10px] text-slate-400">Comandos Regionais (CPAs)</div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-2xl font-bold text-amber-400 font-mono">41</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">AISPs</div>
            <div className="text-[10px] text-slate-400">Batalhões da PMERJ</div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-2xl font-bold text-emerald-400 font-mono">137</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">CISPs</div>
            <div className="text-[10px] text-slate-400">Delegacias da PCERJ</div>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-2xl font-bold text-purple-400 font-mono">92</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">Municípios</div>
            <div className="text-[10px] text-slate-400">Totalidade do Estado</div>
          </div>
        </div>
      </div>

      {/* Technical and Legal Disclaimer */}
      <div className="max-w-4xl mx-auto p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-2">
        <div className="font-bold text-slate-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          Aviso Metodológico & Marco Regulatório
        </div>
        <p className="leading-relaxed">
          As demarcações poligonais e descrições seguem as Portarias SESP nº 310/2000, Resolução SESEG nº 151/2008 e memoriais descritivos do Diário Oficial do Estado do Rio de Janeiro. As estatísticas criminais espelham a metodologia oficial do Instituto de Segurança Pública (ISP-RJ).
        </p>
      </div>
    </div>
  );
};

