import React, { useEffect, useState } from 'react';
import {
  Shield,
  X,
  LogIn,
  UserPlus,
  CheckCircle2,
  Clock,
  Ban,
  Share2,
  Copy,
  Check,
  LogOut,
  Users,
  Globe,
  MessageCircle,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Crown,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot';

const GoogleIcon: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

interface AuthGateModalProps {
  onOpenAdmin?: () => void;
  onOpenCompanyAdmin?: () => void;
  onOpenCompanyRegister?: () => void;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  onOpenAdmin,
  onOpenCompanyAdmin,
  onOpenCompanyRegister
}) => {
  const {
    firebaseUser,
    userProfile,
    authError,
    clearAuthError,
    isAuthModalOpen,
    authModalReason,
    pendingReferralCode,
    setPendingReferralCode,
    closeAuthModal,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    resendVerificationEmail,
    refreshAuthUser,
    signOutUser,
    isAdmin,
    isCompanyAdmin
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [nameInput, setNameInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [refInput, setRefInput] = useState<string>(pendingReferralCode || '');
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (pendingReferralCode && !refInput) {
      setRefInput(pendingReferralCode);
    }
  }, [pendingReferralCode, refInput]);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setIsSubmitting(false);
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    setIsSubmitting(false);
  }, [firebaseUser]);

  if (!isAuthModalOpen) return null;

  const shareUrl = userProfile?.referralCode
    ? `${window.location.origin}/?ref=${userProfile.referralCode}`
    : '';

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setLocalError(null);
    setInfoMessage(null);
    clearAuthError();
  };

  const handleCopyShareLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    clearAuthError();
    try {
      await signInWithGoogle(refInput);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfoMessage(null);
    clearAuthError();

    if (!emailInput.trim() || !passwordInput) {
      setLocalError('Informe seu e-mail e sua senha para acessar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmail(emailInput, passwordInput);
    } catch {
      // handled in AuthContext authError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfoMessage(null);
    clearAuthError();

    if (!nameInput.trim()) {
      setLocalError('Informe seu nome completo.');
      return;
    }
    if (!emailInput.trim()) {
      setLocalError('Informe um endereço de e-mail válido.');
      return;
    }
    if (passwordInput.length < 6) {
      setLocalError('A senha deve possuir no mínimo 6 caracteres.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setLocalError('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWithEmail(nameInput, emailInput, passwordInput, refInput);
    } catch {
      // handled in AuthContext authError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfoMessage(null);
    clearAuthError();

    if (!emailInput.trim()) {
      setLocalError('Digite seu e-mail cadastrado para receber o link de recuperação.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordReset(emailInput);
      setInfoMessage(
        `Enviamos um link de redefinição de senha para ${emailInput.trim()}. Verifique sua caixa de entrada e spam.`
      );
    } catch {
      // handled in AuthContext authError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setLocalError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await resendVerificationEmail();
      setInfoMessage('E-mail de confirmação reenviado! Confira sua caixa de entrada.');
    } catch {
      // handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshStatus = async () => {
    setLocalError(null);
    setInfoMessage(null);
    setIsSubmitting(true);
    try {
      await refreshAuthUser();
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md max-h-[92dvh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* MELI Yellow Header */}
        <div className="px-5 py-3.5 bg-[#FFE600] border-b border-[#E6CF00] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2D3277] flex items-center justify-center text-[#FFE600] shadow-xs shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#2D3277]">
                {!firebaseUser
                  ? mode === 'login'
                    ? 'Acessar Sistema'
                    : mode === 'register'
                    ? 'Criar Nova Conta'
                    : 'Recuperar Senha'
                  : userProfile?.status === 'approved'
                  ? 'Minha Conta & Indicações'
                  : 'Status de Liberação'}
              </h2>
              <p className="text-[11px] text-[#2D3277]/80 font-medium">
                Painel de Monitoramento Territorial
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-[#2D3277] hover:bg-black/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs text-slate-700 overflow-y-auto flex-1">
          {displayError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-snug">{displayError}</span>
              </div>
              {!firebaseUser && mode !== 'forgot' && (
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  {mode === 'register' && (
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-[#2D3277] font-bold text-[11px] hover:bg-slate-50 cursor-pointer"
                    >
                      Ir para Acessar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-[#3483FA] font-bold text-[11px] hover:bg-slate-50 cursor-pointer"
                  >
                    Definir / Esqueci a senha
                  </button>
                </div>
              )}
            </div>
          )}

          {infoMessage && (
            <div className="p-3 rounded-xl bg-[#00A650]/10 border border-[#00A650]/30 text-[#008744] flex items-start gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{infoMessage}</span>
            </div>
          )}

          {/* CASE 1: NOT LOGGED IN -> CONVENTIONAL LOGIN / REGISTER / FORGOT */}
          {!firebaseUser && (
            <>
              {authModalReason && (
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                  <strong className="text-[#2D3277]">Acesso necessário:</strong> {authModalReason}
                </div>
              )}

              {/* Mode Switcher Tabs (Acessar / Criar Conta / Cadastrar Empresa) */}
              {mode !== 'forgot' ? (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        mode === 'login'
                          ? 'bg-white text-[#2D3277] shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-[#2D3277]'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Acessar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        mode === 'register'
                          ? 'bg-white text-[#2D3277] shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-[#2D3277]'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Criar Conta</span>
                    </button>
                  </div>

                  {onOpenCompanyRegister && (
                    <button
                      type="button"
                      onClick={() => {
                        closeAuthModal();
                        onOpenCompanyRegister();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border border-[#1E2258]"
                      title="Criar conta corporativa ou cadastrar empresa para gestão de equipe, licenças e ocorrências"
                    >
                      <Building2 className="w-4 h-4 text-[#FFE600]" />
                      <span>Criar Conta Corporativa (@empresa.com)</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3483FA] hover:text-[#2968C8] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o login</span>
                </button>
              )}

              {/* LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={handleEmailLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#2D3277] mb-1">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="seuemail@empresa.com"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-[#2D3277]">Senha</label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-[11px] font-semibold text-[#3483FA] hover:underline cursor-pointer"
                      >
                        Esqueci a senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        placeholder="Digite sua senha"
                        className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        title={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                        aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-[#2D3277] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Código de Indicação (Opcional)
                    </label>
                    <div className="relative">
                      <Share2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={refInput}
                        onChange={e => {
                          const v = e.target.value.toUpperCase();
                          setRefInput(v);
                          setPendingReferralCode(v);
                        }}
                        placeholder="Ex: MELI-A1B2C3"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isSubmitting ? 'Entrando...' : 'Acessar Conta'}</span>
                  </button>
                </form>
              )}

              {/* REGISTER FORM */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#2D3277] mb-1">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2D3277] mb-1">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="seuemail@mercadolivre.com ou pessoal"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#2D3277] mb-1">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={passwordInput}
                          onChange={e => setPasswordInput(e.target.value)}
                          placeholder="Mín. 6 dígitos"
                          className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          title={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                          aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-[#2D3277] cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#2D3277] mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={confirmPasswordInput}
                          onChange={e => setConfirmPasswordInput(e.target.value)}
                          placeholder="Repita a senha"
                          className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(prev => !prev)}
                          title={showConfirmPassword ? 'Ocultar senha' : 'Visualizar senha'}
                          aria-label={showConfirmPassword ? 'Ocultar senha' : 'Visualizar senha'}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-[#2D3277] cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2D3277] mb-1">
                      Código de Indicação (Opcional)
                    </label>
                    <div className="relative">
                      <Share2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={refInput}
                        onChange={e => {
                          const v = e.target.value.toUpperCase();
                          setRefInput(v);
                          setPendingReferralCode(v);
                        }}
                        placeholder="Ex: MELI-A1B2C3 (liberação direta se indicado MELI)"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Access Policy Notice */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 leading-relaxed space-y-1">
                    <div>
                      <strong className="text-[#008744]">Acesso Direto:</strong>{' '}
                      <code className="font-mono font-bold text-[#2D3277]">@mercadolivre.com</code>,
                      empresas conveniadas (<code className="font-mono font-bold text-[#2D3277]">@empresa.com</code>)
                      ou indicados MELI acessam imediatamente após validação.
                    </div>
                    <div>
                      <strong className="text-amber-800">Externos:</strong>{' '}
                      <code>@gmail.com</code>, <code>@outlook.com</code> sem indicação MELI aguardam
                      liberação do Administrador.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] disabled:opacity-60 text-[#FFE600] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer border border-[#1E2258]"
                  >
                    <UserPlus className="w-4 h-4 text-[#FFE600]" />
                    <span>{isSubmitting ? 'Criando conta...' : 'Criar Conta'}</span>
                  </button>

                  {onOpenCompanyRegister && (
                    <div className="pt-2 border-t border-slate-200 text-center space-y-1">
                      <span className="text-[11px] text-slate-500 block">
                        É gestor ou administrador de transportadora/empresa?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          closeAuthModal();
                          onOpenCompanyRegister();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border border-[#1E2258]"
                      >
                        <Building2 className="w-4 h-4 text-[#FFE600]" />
                        <span>Criar Conta Corporativa para Empresa</span>
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                    Informe o e-mail cadastrado na sua conta. Enviaremos um link seguro para você
                    definir uma nova senha.
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2D3277] mb-1">
                      E-mail cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="seuemail@empresa.com"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-[#FFE600]" />
                    <span>{isSubmitting ? 'Enviando...' : 'Enviar Link de Redefinição'}</span>
                  </button>
                </form>
              )}

              {/* Divider + Google OAuth Button */}
              {mode !== 'forgot' && (
                <>
                  <div className="relative flex items-center py-0.5">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="shrink-0 mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      ou
                    </span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <GoogleIcon />
                    <span>
                      {mode === 'register' ? 'Criar Conta com Google' : 'Entrar com Google'}
                    </span>
                  </button>
                </>
              )}
            </>
          )}

          {/* CASE 1.5: LOGGED IN BUT PROFILE SYNCING OR RETRYING */}
          {firebaseUser && !userProfile && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-center">
                <RefreshCw className={`w-7 h-7 text-[#3483FA] mx-auto ${!displayError ? 'animate-spin' : ''}`} />
                <h3 className="text-sm font-extrabold text-[#2D3277]">
                  {displayError ? 'Não foi possível carregar seu perfil' : 'Sincronizando sua conta...'}
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Conta autenticada: <strong className="font-mono">{firebaseUser.email}</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Atualizando...' : 'Tentar Novamente'}</span>
                </button>
                <button
                  type="button"
                  onClick={signOutUser}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: LOGGED IN - PENDING APPROVAL / EMAIL VERIFICATION */}
          {firebaseUser && userProfile && userProfile.status === 'pending' && (
            <div className="space-y-3.5">
              {!firebaseUser.emailVerified && (
                <div className="p-3.5 rounded-xl bg-[#3483FA]/10 border border-[#3483FA]/30 space-y-2">
                  <div className="font-bold text-[#2D3277] text-xs flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-[#3483FA]" />
                    <span>Confirme seu e-mail para concluir a validação</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Enviamos um link de confirmação para{' '}
                    <strong className="font-mono">{firebaseUser.email}</strong>. Se for conta{' '}
                    <code>@mercadolivre.com</code> ou administradora, a liberação automática ocorre
                    logo após confirmar.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRefreshStatus}
                      disabled={isSubmitting}
                      className="flex-1 py-2 px-3 rounded-lg bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Já confirmei</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isSubmitting}
                      className="py-2 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-[11px] cursor-pointer"
                    >
                      Reenviar e-mail
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-center">
                <Clock className="w-8 h-8 text-amber-600 mx-auto" />
                <h3 className="text-sm font-extrabold text-amber-900">
                  Cadastro Criado — Aguardando Liberação
                </h3>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Sua conta (<strong className="font-mono">{userProfile.email}</strong>) foi
                  registrada e aguarda liberação do Administrador no Painel ADM (exceto contas{' '}
                  <code>@mercadolivre.com</code> verificadas ou indicadas por elas).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Domínio identificado:</span>
                  <span className="font-mono font-bold text-[#2D3277]">@{userProfile.domain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Indicação vinculada:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {userProfile.referredByCode || 'Nenhuma'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status atual:</span>
                  <span className="font-bold text-amber-700">Pendente de Liberação</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/5521974976130?text=${encodeURIComponent(
                    `Olá! Acabei de me cadastrar no Painel de Monitoramento Territorial com o e-mail ${userProfile.email} e aguardo liberação de acesso.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#00A650] hover:bg-[#008744] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Solicitar Liberação</span>
                </a>
                <button
                  onClick={signOutUser}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}

          {/* CASE 3: LOGGED IN - BLOCKED */}
          {firebaseUser && userProfile && userProfile.status === 'blocked' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-center">
                <Ban className="w-8 h-8 text-rose-600 mx-auto" />
                <h3 className="text-sm font-extrabold text-rose-900">Acesso Bloqueado</h3>
                <p className="text-[11px] text-rose-800">
                  O acesso para <strong className="font-mono">{userProfile.email}</strong> foi
                  suspenso pelo administrador.
                </p>
              </div>
              <button
                onClick={signOutUser}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}

          {/* CASE 4: LOGGED IN - APPROVED (ACCOUNT & AFFILIATE/REFERRAL CARD) */}
          {firebaseUser && userProfile && userProfile.status === 'approved' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-11 h-11 rounded-full border-2 border-[#FFE600] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#2D3277] text-[#FFE600] font-bold flex items-center justify-center shrink-0">
                    {userProfile.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-slate-900 truncate">
                      {userProfile.displayName}
                    </span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] text-[9px] font-bold uppercase">
                        ADM
                      </span>
                    )}
                    {isCompanyAdmin && (
                      <span className="px-1.5 py-0.5 rounded bg-[#3483FA]/15 text-[#2968C8] text-[9px] font-bold uppercase">
                        ADM Empresa
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-[#00A650]/15 text-[#008744] text-[9px] font-bold uppercase">
                      Liberado
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono truncate">
                    {userProfile.email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Globe className="w-3.5 h-3.5 text-[#3483FA] mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500">Domínio</div>
                  <div className="text-[11px] font-bold text-[#2D3277] truncate">
                    @{userProfile.domain}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Shield className="w-3.5 h-3.5 text-[#008744] mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500">Plano</div>
                  <div className="text-[11px] font-bold text-slate-900 truncate">
                    {userProfile.planId}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Users className="w-3.5 h-3.5 text-amber-600 mx-auto mb-1" />
                  <div className="text-[10px] text-slate-500">Consultas</div>
                  <div className="text-[11px] font-bold text-slate-900 font-mono">
                    {userProfile.accessCount || 0}
                  </div>
                </div>
              </div>

              {userProfile.licenseStatus === 'active' && userProfile.licenseKey && (
                <div className="p-3 rounded-xl bg-[#2D3277]/5 border border-[#2D3277]/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-[#2D3277] text-[#FFE600] shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-[#2D3277] flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3 text-[#008744]" />
                        <span>Licença Corporativa Ativa</span>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-slate-700 truncate">
                        Empresa: @{userProfile.companyDomain || userProfile.domain}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-[#2D3277] text-[#FFE600] font-mono font-bold text-[10px] shrink-0">
                    {userProfile.licenseKey}
                  </span>
                </div>
              )}

              {/* Referral Link Card */}
              <div className="p-3.5 rounded-xl bg-[#FFE600]/25 border border-[#E6CF00] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#2D3277] flex items-center gap-1.5 text-xs">
                    <Share2 className="w-3.5 h-3.5" />
                    Seu Código de Indicação (Afiliado)
                  </span>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#2D3277] text-[#FFE600]">
                    {userProfile.referralCode}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {userProfile.domain === 'mercadolivre.com'
                    ? 'Por pertencer ao @mercadolivre.com, quem usar seu link acessa o sistema direto!'
                    : 'Compartilhe seu link de indicação (programa de afiliados sem comissão por hora).'}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[11px] font-mono text-slate-700"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-3 py-1.5 rounded-lg bg-[#2D3277] hover:bg-[#1E2258] text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-[#FFE600]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 flex-wrap">
                <button
                  onClick={signOutUser}
                  className="px-3 py-2 rounded-lg text-rose-700 hover:bg-rose-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  {(isCompanyAdmin || isAdmin) && onOpenCompanyAdmin && (
                    <button
                      onClick={() => {
                        closeAuthModal();
                        onOpenCompanyAdmin();
                      }}
                      className="px-3 py-2 rounded-lg bg-[#2D3277]/10 hover:bg-[#2D3277]/20 text-[#2D3277] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#3483FA]" />
                      <span>Painel Empresa</span>
                    </button>
                  )}
                  {isAdmin && onOpenAdmin && (
                    <button
                      onClick={() => {
                        closeAuthModal();
                        onOpenAdmin();
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Abrir Painel ADM</span>
                    </button>
                  )}
                  <button
                    onClick={closeAuthModal}
                    className="px-4 py-2 rounded-lg bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-xs cursor-pointer"
                  >
                    Continuar no Mapa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
