import React from 'react';
import {
  Shield,
  Layers,
  Flame,
  Building2,
  LogIn,
  Crown,
  UserCheck,
  Clock
} from 'lucide-react';
import { EstadoScope } from '../types/sigBase';
import { useAuth } from '../contexts/AuthContext';

export type MainActiveTab = 'map' | 'sig_mges' | 'stats' | 'audit' | 'import' | 'about' | 'admin' | 'company_admin';

interface HeaderProps {
  activeTab: MainActiveTab;
  setActiveTab: (tab: MainActiveTab) => void;
  estadoScope: EstadoScope;
  setEstadoScope: (scope: EstadoScope) => void;
  onOpenLicense?: () => void;
  onOpenCompanyRegister?: () => void;
  onOpenNavigation?: () => void;
  isFactionPanelOpen?: boolean;
  onToggleFactions?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  estadoScope,
  setEstadoScope,
  onOpenLicense,
  onOpenCompanyRegister,
  onOpenNavigation,
  isFactionPanelOpen = false,
  onToggleFactions
}) => {
  const { firebaseUser, userProfile, isAdmin, isCompanyAdmin, openAuthModal } = useAuth();

  return (
    <header className="h-[52px] md:h-16 bg-[#FFE600] border-b border-[#E6CF00] px-2.5 sm:px-4 lg:px-5 flex items-center justify-between gap-2 md:gap-3 z-30 shrink-0 shadow-sm">
      {/* 1. Brand Identity — Monitoramento em cima e Territorial embaixo */}
      <div
        className="flex items-center gap-2 shrink-0 cursor-pointer select-none"
        onClick={onOpenLicense}
        title="Monitoramento Territorial (Agência Ícone Digital by Vinicius Cirne)"
      >
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#2D3277] border border-[#1E2258] flex items-center justify-center text-[#FFE600] shadow-sm shrink-0">
          <Shield className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="flex flex-col justify-center leading-none">
          <span className="font-bold text-[10px] sm:text-[11px] text-[#2D3277] uppercase tracking-wider">
            Monitoramento
          </span>
          <span className="font-extrabold text-xs sm:text-sm text-[#2D3277] tracking-tight mt-0.5">
            Territorial
          </span>
        </div>
      </div>

      {/* 2. State Scope Segmented Control — Fits cleanly on 375px+ mobile */}
      <div className="flex items-center gap-0.5 bg-[#F2DA00] p-1 rounded-xl border border-[#DFC700] min-w-0 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'TODOS', label: 'Todos' },
            { id: 'RJ', label: 'RJ' },
            { id: 'MG', label: 'MG' },
            { id: 'ES', label: 'ES' },
            { id: 'MG_ES', label: 'MG+ES' }
          ] as const
        ).map(uf => (
          <button
            key={uf.id}
            onClick={() => {
              setEstadoScope(uf.id);
              if (activeTab === 'sig_mges' && (uf.id === 'RJ' || uf.id === 'TODOS')) {
                setActiveTab('map');
              }
            }}
            className={`px-2.5 py-1.5 md:py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              estadoScope === uf.id
                ? 'bg-[#2D3277] text-white shadow-sm'
                : 'text-[#2D3277]/80 hover:text-[#1A1D4D] hover:bg-black/5'
            }`}
          >
            {uf.label}
          </button>
        ))}
      </div>

      {/* 3. Direct Quick Actions & Account Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {activeTab === 'map' && onToggleFactions && (
          <button
            onClick={onToggleFactions}
            aria-label={isFactionPanelOpen ? 'Fechar painel de Facções' : 'Abrir painel de Facções'}
            aria-pressed={isFactionPanelOpen}
            title={isFactionPanelOpen ? 'Fechar painel de Facções' : 'Abrir painel de Facções'}
            className={`flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap border shrink-0 shadow-xs ${
              isFactionPanelOpen
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-white/95 text-[#2D3277] border-[#2D3277]/25 hover:bg-white'
            }`}
          >
            <Flame className={`w-4 h-4 shrink-0 ${isFactionPanelOpen ? 'text-white' : 'text-red-600'}`} />
            <span className="hidden sm:inline">Facções</span>
          </button>
        )}

        {/* Botão Rápido de Retorno ao Mapa (visível quando em outras abas) */}
        {activeTab !== 'map' && (
          <button
            onClick={() => setActiveTab('map')}
            title="Voltar ao Mapa Geral Interativo"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap border shrink-0 shadow-xs bg-white/95 text-[#2D3277] border-[#2D3277]/25 hover:bg-white"
          >
            <Layers className="w-3.5 h-3.5 shrink-0 text-[#3483FA]" />
            <span className="hidden sm:inline">Voltar ao Mapa</span>
            <span className="sm:hidden">Mapa</span>
          </button>
        )}

        {/* Botão de Criar Conta Corporativa visível apenas para visitantes anônimos (sem conta) */}
        {onOpenCompanyRegister && !firebaseUser && (
          <button
            onClick={onOpenCompanyRegister}
            title="Criar Conta Corporativa (Acesso Corporativo & Gestão de Equipe)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors cursor-pointer whitespace-nowrap border shrink-0 shadow-xs bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] border-[#1E2258]"
          >
            <Building2 className="w-3.5 h-3.5 shrink-0 text-[#FFE600]" />
            <span className="hidden sm:inline">Criar Conta Corporativa</span>
            <span className="sm:hidden">+ Corporativo</span>
          </button>
        )}

        {/* Acesso Rápido ao Painel da Empresa */}
        {(isCompanyAdmin || isAdmin) && (
          <button
            onClick={() => setActiveTab('company_admin')}
            title="Abrir Painel da Empresa (Usuários, Licenças & Ocorrências)"
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors cursor-pointer whitespace-nowrap border shrink-0 shadow-xs ${
              activeTab === 'company_admin'
                ? 'bg-[#2D3277] text-[#FFE600] border-[#1E2258]'
                : 'bg-white/95 text-[#2D3277] border-[#2D3277]/25 hover:bg-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0 text-[#3483FA]" />
            <span className="hidden lg:inline">Painel Empresa</span>
            <span className="lg:hidden">Empresa</span>
          </button>
        )}

        {/* Acesso Rápido ao ADM Geral */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            title="Abrir Painel Administrativo (ADM)"
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors cursor-pointer whitespace-nowrap border shrink-0 shadow-xs ${
              activeTab === 'admin'
                ? 'bg-[#2D3277] text-[#FFE600] border-[#1E2258]'
                : 'bg-white/95 text-[#2D3277] border-[#2D3277]/25 hover:bg-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0 text-[#2D3277] fill-[#FFE600]" />
            <span>ADM</span>
          </button>
        )}

        {/* Auth Account Pill */}
        {!firebaseUser ? (
          <button
            onClick={() => openAuthModal()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Entrar</span>
          </button>
        ) : (
          <button
            onClick={() => openAuthModal()}
            title={userProfile?.email || 'Minha Conta'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0 ${
              userProfile?.status === 'approved'
                ? 'bg-white/95 hover:bg-white text-[#2D3277] border-[#2D3277]/20'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            {userProfile?.status === 'approved' ? (
              <UserCheck className="w-3.5 h-3.5 text-[#008744] shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            )}
            <span className="hidden sm:inline max-w-[100px] truncate">
              {userProfile?.displayName?.split(' ')[0] || 'Conta'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
