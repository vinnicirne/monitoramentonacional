import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';

interface FooterProps {
  onOpenLicense: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLicense }) => {
  return (
    <footer className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 z-20 shrink-0">
      {/* Desktop & Tablet Bar (>= 768px) */}
      <div className="hidden md:flex h-8 px-4 items-center justify-between text-[11px] text-slate-400 select-none">
        {/* Left: Branding & Copyright */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">
            Painel de Monitoramento Territorial
          </span>
          <span className="text-slate-600">•</span>
          <span>
            © 2026 <strong className="text-slate-200 font-semibold">Agência Ícone Digital</strong> by <strong className="text-blue-400 font-semibold">Vinicius Cirne</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">Todos os direitos reservados</span>
        </div>

        {/* Right: License Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
            <ShieldCheck className="w-3 h-3" />
            <span>Licença Vinculada Homologada</span>
          </div>

          <button
            onClick={onOpenLicense}
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white hover:underline transition-colors cursor-pointer text-[11px]"
            title="Visualizar Termos da Licença Oficial"
          >
            <Award className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium">Termos da Licença</span>
          </button>

          <span className="text-slate-600">|</span>
          <span className="font-mono text-[10px] text-slate-500">v2.5.0 Pro</span>
        </div>
      </div>

      {/* Mobile Micro-Footer (< 768px) */}
      <div className="md:hidden px-3 py-1 bg-slate-950/95 flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/60 select-none">
        <div className="flex items-center gap-1.5 truncate">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-200">Agência Ícone Digital</strong> by <span className="text-blue-400 font-semibold">Vinicius Cirne</span>
          </span>
        </div>

        <button
          onClick={onOpenLicense}
          className="text-blue-400 font-semibold hover:underline shrink-0 ml-2 cursor-pointer"
        >
          Licença Vinculada
        </button>
      </div>
    </footer>
  );
};
