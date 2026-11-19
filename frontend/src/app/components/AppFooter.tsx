import React from 'react';
import { Award, MessageCircle, ShieldCheck } from 'lucide-react';

interface AppFooterProps {
  onOpenLicense: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onOpenLicense }) => (
  <footer className="hidden md:flex bg-white border-t border-slate-200 px-3 md:px-4 py-1.5 flex-wrap md:flex-nowrap items-center justify-between gap-2 text-[10px] md:text-[11px] text-slate-600 shrink-0 z-30 print:hidden shadow-xs select-none">
    <div className="flex items-center gap-2 truncate">
      <span className="hidden md:inline font-semibold text-[#2D3277]">Monitoramento Territorial</span>
      <span className="hidden md:inline text-slate-300">•</span>
      <span className="truncate">
        © 2026 <strong className="text-[#2D3277] font-bold">Agência Ícone Digital</strong> by <strong className="text-[#3483FA] font-bold">Vinicius Cirne</strong>
      </span>
      <span className="hidden lg:inline text-slate-300">•</span>
      <span className="hidden lg:inline text-slate-500">Todos os direitos reservados</span>
    </div>

    <div className="flex items-center justify-end gap-2 md:gap-3 shrink-0 ml-auto">
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00A650]/10 border border-[#00A650]/30 text-[#008744] text-[10px] font-bold">
        <ShieldCheck className="w-3 h-3" />
        <span className="hidden sm:inline">Licença Vinculada</span>
      </div>
      <button
        type="button"
        onClick={onOpenLicense}
        className="inline-flex items-center gap-1 text-[#2D3277] hover:text-[#3483FA] hover:underline font-semibold transition-colors cursor-pointer text-[10px] md:text-[11px]"
        title="Visualizar Certificado e Termos da Licença Oficial"
      >
        <Award className="w-3.5 h-3.5 text-[#3483FA]" />
        <span>Ver Licença</span>
      </button>
      <a
        href="https://wa.me/5521974976130"
        target="_blank"
        rel="noopener noreferrer"
        title="Conversar via WhatsApp"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00A650]/10 hover:bg-[#00A650]/20 text-[#008744] border border-[#00A650]/25 font-bold transition-colors shrink-0"
      >
        <MessageCircle className="w-3 h-3" />
        <span>WhatsApp</span>
      </a>
      <span className="hidden sm:inline text-slate-300">|</span>
      <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">v2.5.0</span>
    </div>
  </footer>
);
