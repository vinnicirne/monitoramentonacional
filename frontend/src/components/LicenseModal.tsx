import React, { useState } from 'react';
import { ShieldCheck, X, Check, Copy, Award, Building, User, Lock, ExternalLink } from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const licenseHash = 'AID-VC-GIS-2026-BR-RJ';

  const handleCopyHash = () => {
    navigator.clipboard.writeText(licenseHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 flex flex-col text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Licença de Propriedade Intelectual & Uso Vinculado
              </h3>
              <p className="text-xs text-slate-400">
                Certificação de Titularidade Oficial e Governança Tecnológica
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs leading-relaxed">
          {/* Ownership Identity Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-1">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
                <Building className="w-4 h-4" />
                <span>Titular dos Direitos Patrimoniais</span>
              </div>
              <div className="text-sm font-bold text-white">Agência Ícone Digital</div>
              <div className="text-[11px] text-slate-400">
                Desenvolvimento de Soluções Inteligentes & GIS
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-1">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
                <User className="w-4 h-4" />
                <span>Autor & Engenheiro Responsável</span>
              </div>
              <div className="text-sm font-bold text-white">Vinicius Cirne</div>
              <div className="text-[11px] text-slate-400">
                Liderança Técnica & Governança Cartográfica
              </div>
            </div>
          </div>

          {/* License Status Badge */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-300 font-medium text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Status: <strong>Licença Vinculada e Homologada</strong> • Exercício 2026</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
              <span>{licenseHash}</span>
              <button
                onClick={handleCopyHash}
                title="Copiar Código"
                className="text-slate-400 hover:text-emerald-400 ml-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Clause Details */}
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              Cláusulas de Licenciamento & Propriedade
            </h4>

            <div className="space-y-2.5 text-slate-300 text-[11px]">
              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">1. Titularidade e Reserva de Direitos:</strong>
                Todo o software, interfaces visuais, estrutura de dados cartográficos (CISPs, AISPs, RISPs, SIG MG/ES), algoritmos de cruzamento espacial e relatórios técnicos constituem propriedade intelectual exclusiva da <strong>Agência Ícone Digital</strong>, sob autoria de <strong>Vinicius Cirne</strong>.
              </div>

              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">2. Licença Vinculada de Uso:</strong>
                A utilização desta plataforma é concedida sob modalidade vinculada e intransferível, destinada a operações de governança territorial, inteligência geográfica, visualização de dinâmicas de segurança e apoio à tomada de decisão.
              </div>

              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">3. Preservação de Atribuição e Rodapé:</strong>
                É obrigatória a manutenção perpétua da assinatura, rodapé e créditos vinculados à <strong>Agência Ícone Digital by Vinicius Cirne</strong> em todas as instâncias visuais, telas de consulta, impressões em PDF e materiais derivados.
              </div>

              <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                <strong className="text-slate-100 block mb-0.5">4. Marco Legal Vigente:</strong>
                Este software e sua propriedade industrial encontram-se respaldados pela legislação brasileira sobre proteção de propriedade intelectual de programa de computador (Lei Federal nº 9.609/1998) e pela Lei de Direitos Autorais (Lei Federal nº 9.610/1998).
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            © 2026 Agência Ícone Digital by Vinicius Cirne · Todos os direitos reservados.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
