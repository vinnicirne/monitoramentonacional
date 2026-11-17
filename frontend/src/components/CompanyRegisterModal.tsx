import React, { useState, useEffect } from 'react';
import {
  Building2,
  X,
  ShieldCheck,
  Check,
  AlertCircle,
  Users,
  DollarSign,
  Mail,
  User,
  Phone,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { CorporateCompany, OperationType, PlanConfig } from '../types/admin';
import { useAuth } from '../contexts/AuthContext';

interface CompanyRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated?: (domain: string) => void;
}

export const CompanyRegisterModal: React.FC<CompanyRegisterModalProps> = ({
  isOpen,
  onClose,
  onCompanyCreated
}) => {
  const { userProfile, isAdmin, firebaseUser } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [planId, setPlanId] = useState('corp_licenca');
  const [pricePerLicense, setPricePerLicense] = useState('49.00');
  const [licensedSeats, setLicensedSeats] = useState('10');
  const [autoApprove, setAutoApprove] = useState(true);

  // Contact / Manager info (for enterprise inquiries or quick admin setup)
  const [contactName, setContactName] = useState(userProfile?.displayName || '');
  const [contactEmail, setContactEmail] = useState(userProfile?.email || '');
  const [contactPhone, setContactPhone] = useState('');

  const [availablePlans, setAvailablePlans] = useState<PlanConfig[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdDomain, setCreatedDomain] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setCreatedDomain(null);

    // Fetch existing plans from Firestore
    getDocs(collection(db, 'plans'))
      .then(snap => {
        const list = snap.docs.map(d => d.data() as PlanConfig).filter(p => p.active);
        if (list.length > 0) {
          setAvailablePlans(list);
          const defaultPlan = list.find(p => p.billingModel === 'per_user') || list[0];
          setPlanId(defaultPlan.id);
          setPricePerLicense(String(defaultPlan.pricePerLicense ?? defaultPlan.priceMonthly ?? 49));
        }
      })
      .catch(err => {
        console.warn('Could not load plans for company modal:', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Domain normalization: remove http, https, www, @ and trailing slashes
    let cleanDomain = domainInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/^@+/, '')
      .replace(/\/+$/, '')
      .split('/')[0];

    // If an email was typed, extract domain
    if (cleanDomain.includes('@')) {
      cleanDomain = cleanDomain.split('@')[1];
    }

    if (!cleanDomain || cleanDomain.length < 3) {
      setErrorMessage('Informe um domínio válido da empresa (ex: empresa.com ou suaempresa.com.br).');
      return;
    }

    // Domain validation regex: matches ^[a-z0-9.\\-]+$
    const domainRegex = /^[a-z0-9.-]+$/;
    if (!domainRegex.test(cleanDomain) || !cleanDomain.includes('.')) {
      setErrorMessage('Formato de domínio inválido. Use letras, números, hífen e ponto (ex: logistica.com.br).');
      return;
    }

    const cleanName = companyName.trim().slice(0, 120);
    if (!cleanName) {
      setErrorMessage('Informe a Razão Social ou Nome Fantasia da empresa.');
      return;
    }

    const priceNum = Math.max(0, Number(pricePerLicense.replace(',', '.')) || 0);
    const seatsNum = Math.max(1, Math.floor(Number(licensedSeats) || 10));

    setIsSubmitting(true);

    try {
      if (isAdmin) {
        // Direct creation by Administrator strictly matching firestore.rules
        await setDoc(doc(db, 'corporate_companies', cleanDomain), {
          domain: cleanDomain,
          companyName: cleanName,
          planId: planId || 'corp_licenca',
          pricePerLicense: priceNum,
          licensedSeats: seatsNum,
          autoApprove: autoApprove,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        setCreatedDomain(cleanDomain);
        setSuccessMessage(`Empresa "${cleanName}" (@${cleanDomain}) cadastrada e homologada com sucesso!`);
        if (onCompanyCreated) {
          onCompanyCreated(cleanDomain);
        }
      } else {
        // For non-admin enterprise requests:
        // Record corporate intent or create self-serve company if rules allow
        const requestDoc = doc(db, 'corporate_companies', cleanDomain);
        try {
          await setDoc(requestDoc, {
            domain: cleanDomain,
            companyName: cleanName,
            planId: planId || 'corp_licenca',
            pricePerLicense: priceNum,
            licensedSeats: seatsNum,
            autoApprove: autoApprove,
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setCreatedDomain(cleanDomain);
          setSuccessMessage(`Empresa "${cleanName}" cadastrada com sucesso!`);
          if (onCompanyCreated) onCompanyCreated(cleanDomain);
        } catch {
          // If firestore rules prevent direct creation, display client instructions
          setSuccessMessage(
            `Solicitação de cadastro da empresa "${cleanName}" (@${cleanDomain}) registrada! Entre em contato via WhatsApp (+55 21 97497-6130) para liberação imediata do seu Painel Corporativo.`
          );
        }
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar empresa:', err);
      setErrorMessage(
        err?.message ||
          'Não foi possível concluir o cadastro da empresa. Verifique as permissões ou contate o administrador.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-xl shadow-2xl overflow-hidden my-6 flex flex-col text-slate-800">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#2D3277] to-[#1E2258] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE600] text-[#2D3277] flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">Cadastro de Empresa</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#FFE600] text-[#2D3277] text-[10px] font-extrabold uppercase">
                  Corporativo
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Monitoramento territorial, gestão de licenças e custódia em DPs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[78vh] space-y-4 text-xs">
          {successMessage ? (
            <div className="p-5 bg-[#00A650]/10 border border-[#00A650]/30 rounded-2xl space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#00A650] text-white flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-extrabold text-[#008744]">
                Cadastro Realizado com Sucesso!
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed max-w-md mx-auto">
                {successMessage}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                {createdDomain && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onCompanyCreated) onCompanyCreated(createdDomain);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] font-extrabold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Abrir Painel da Empresa</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Informational Pill */}
              <div className="p-3 bg-[#FFE600]/15 border border-[#E6CF00] rounded-xl flex items-center gap-2.5 text-slate-800">
                <Sparkles className="w-4 h-4 text-[#2D3277] shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  Colaboradores autenticados com o domínio corporativo recebem automaticamente licença individual vinculada ao plano da empresa.
                </span>
              </div>

              {/* Section 1: Company Info */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Razão Social ou Nome Fantasia <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Ex: Mercado Livre Logística Ltda"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#3483FA] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Domínio Corporativo <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">@</span>
                      <input
                        type="text"
                        required
                        value={domainInput}
                        onChange={e => setDomainInput(e.target.value)}
                        placeholder="empresa.com.br"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-semibold focus:bg-white focus:outline-none focus:border-[#3483FA] transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Sufixo fixo dos e-mails da equipe.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Assentos / Licenças Contratadas
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        required
                        value={licensedSeats}
                        onChange={e => setLicensedSeats(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#3483FA] transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Número máximo de colaboradores com acesso.
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Plan & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plano Vinculado</label>
                  <select
                    value={planId}
                    onChange={e => {
                      const nextId = e.target.value;
                      setPlanId(nextId);
                      const chosen = availablePlans.find(p => p.id === nextId);
                      if (chosen) {
                        setPricePerLicense(String(chosen.pricePerLicense ?? chosen.priceMonthly ?? 49));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:border-[#3483FA]"
                  >
                    {availablePlans.length > 0 ? (
                      availablePlans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    ) : (
                      <option value="corp_licenca">Corporativo Por Licença</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor por Usuário / Mês (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">R$</span>
                    <input
                      type="text"
                      value={pricePerLicense}
                      onChange={e => setPricePerLicense(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#3483FA]"
                    />
                  </div>
                </div>
              </div>

              {/* Auto Approve Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={e => setAutoApprove(e.target.checked)}
                  className="mt-0.5 rounded text-[#3483FA] focus:ring-0"
                />
                <div className="text-slate-700 leading-snug">
                  <span className="font-bold text-slate-900 block">
                    Liberação Automática de Colaboradores
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Aprovar e ativar licença automaticamente quando o usuário fizer login com o e-mail verificado do domínio.
                  </span>
                </div>
              </label>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 border border-[#1E2258]"
                >
                  <Building2 className="w-4 h-4 text-[#FFE600]" />
                  <span>{isSubmitting ? 'Salvando...' : 'Criar Conta Corporativa'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
          <span>Agência Ícone Digital by Vinicius Cirne</span>
          <span>Suporte Corporativo: (21) 97497-6130</span>
        </div>
      </div>
    </div>
  );
};
