import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  Building2,
  BarChart3,
  AlertTriangle,
  Database,
  FileText,
  ChevronDown,
  ChevronRight,
  X,
  LogIn,
  LogOut,
  Crown,
  UserCheck,
  Clock,
  Sparkles,
  MapPin,
  Flame,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { MainActiveTab } from './Header';
import { EstadoScope } from '../types/sigBase';
import { useAuth } from '../contexts/AuthContext';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: MainActiveTab;
  onSelectTab: (tab: MainActiveTab) => void;
  estadoScope: EstadoScope;
  setEstadoScope: (scope: EstadoScope) => void;
  onOpenImport: () => void;
  onOpenCompanyRegister?: () => void;
  onOpenLicense?: () => void;
}

interface NavItem {
  id: MainActiveTab | 'company_register_action';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  isActionOnly?: boolean;
  requiresAdmin?: boolean;
  requiresCompanyAdmin?: boolean;
}

interface MenuGroup {
  id: string;
  title: string;
  categoryDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  items: NavItem[];
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  estadoScope,
  setEstadoScope,
  onOpenImport,
  onOpenCompanyRegister,
  onOpenLicense
}) => {
  const { firebaseUser, userProfile, isAdmin, isCompanyAdmin, openAuthModal, signOutUser } = useAuth();

  // Estados de grupos colapsáveis: todos iniciam fechados por padrão, abrindo apenas sob clique do usuário
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    cartografia: false,
    inteligencia: false,
    governanca: false,
    corporativo: false
  });

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevenir scroll do body quando o drawer estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Definição estrita e estruturada dos Menus e Submenus por Assuntos Relacionados
  const menuGroups: MenuGroup[] = [
    {
      id: 'cartografia',
      title: 'Cartografia & Território',
      categoryDesc: 'Bases geoespaciais, manchas criminais e limites estaduais',
      icon: Layers,
      accentColor: 'text-[#3483FA]',
      items: [
        {
          id: 'map',
          title: 'Mapa Geral Interativo',
          subtitle: 'Dossiês policiais, 1.695 áreas de risco, manchas e unidades operacionais',
          icon: Layers,
          badge: 'RJ · MG · ES',
          badgeColor: 'bg-[#2D3277]/10 text-[#2D3277] border-[#2D3277]/20'
        },
        {
          id: 'sig_mges',
          title: 'Base SIG MG e ES',
          subtitle: 'Divisão territorial integrada e 209 unidades policiais de MG e ES',
          icon: Building2,
          badge: 'Regional MG·ES',
          badgeColor: 'bg-[#00A650]/10 text-[#008744] border-[#00A650]/20'
        }
      ]
    },
    {
      id: 'inteligencia',
      title: 'Inteligência & Análise Criminal',
      categoryDesc: 'Indicadores estatísticos, auditoria territorial e séries históricas',
      icon: BarChart3,
      accentColor: 'text-[#2D3277]',
      items: [
        {
          id: 'stats',
          title: 'Estatísticas & Rankings ISP-RJ',
          subtitle: 'Séries temporais 2020–2025, roubos de carga, letalidade e rankings por DP',
          icon: BarChart3,
          badge: 'ISP Oficial',
          badgeColor: 'bg-[#3483FA]/10 text-[#2968C8] border-[#3483FA]/20'
        },
        {
          id: 'audit',
          title: 'Auditoria Territorial',
          subtitle: 'Diagnóstico de inconsistências cadastrais, sobreposições de limites e conformidade',
          icon: AlertTriangle,
          badge: 'Validação',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
        }
      ]
    },
    {
      id: 'governanca',
      title: 'Governança & Gestão de Dados',
      categoryDesc: 'Entrada de dados, exportações e fundamentação metodológica',
      icon: Database,
      accentColor: 'text-[#00A650]',
      items: [
        {
          id: 'import',
          title: 'Importar Planilhas & GeoJSON',
          subtitle: 'Upload de planilhas CSV, tabelas SIG e geometrias vetoriais georreferenciadas',
          icon: Database,
          badge: 'Upload / SIG',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          isActionOnly: true
        },
        {
          id: 'about',
          title: 'Metodologia Científica & Fontes',
          subtitle: 'Normas técnicas, fontes oficiais (ISP, PMERJ, PCERJ, IBGE) e critérios de cálculo',
          icon: FileText,
          badge: 'Documentação',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
        }
      ]
    },
    {
      id: 'corporativo',
      title: 'Segurança Corporativa & Gestão',
      categoryDesc: 'Monitoramento patrimonial privado, equipe e administração',
      icon: Shield,
      accentColor: 'text-[#2D3277]',
      items: [
        ...(!isCompanyAdmin
          ? [
              {
                id: 'company_register_action' as const,
                title: 'Criar Conta Corporativa',
                subtitle: 'Cadastro institucional para empresas de logística, transporte e segurança',
                icon: Building2,
                badge: 'Novo',
                badgeColor: 'bg-[#2D3277] text-[#FFE600] border-[#1E2258]',
                isActionOnly: true
              }
            ]
          : []),
        ...(isCompanyAdmin || isAdmin
          ? [
              {
                id: 'company_admin' as MainActiveTab,
                title: 'Painel da Empresa',
                subtitle: 'Histórico de ocorrências restritas, mapa de calor privado e equipe da empresa',
                icon: Flame,
                badge: 'Restrito',
                badgeColor: 'bg-[#FFE600] text-[#2D3277] border-[#E6CF00]',
                requiresCompanyAdmin: true
              }
            ]
          : []),
        ...(isAdmin
          ? [
              {
                id: 'admin' as MainActiveTab,
                title: 'Painel Administrativo Geral (ADM)',
                subtitle: 'Controle de licenças corporativas, aprovações de contas e logs de auditoria',
                icon: Crown,
                badge: 'Master ADM',
                badgeColor: 'bg-[#2D3277] text-[#FFE600] border-[#1E2258]',
                requiresAdmin: true
              }
            ]
          : [])
      ]
    }
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.id === 'import') {
      onOpenImport();
      onClose();
      return;
    }
    if (item.id === 'company_register_action') {
      if (onOpenCompanyRegister) onOpenCompanyRegister();
      onClose();
      return;
    }
    onSelectTab(item.id as MainActiveTab);
    onClose();
  };

  return (
    <>
      {/* Backdrop com blur suave */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Lateral Deslizante */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-full sm:w-[380px] md:w-[410px] max-w-[90vw] bg-white shadow-2xl flex flex-col border-r border-slate-200 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu Lateral de Navegação e Módulos"
      >
        {/* 1. Header do Menu Lateral */}
        <div className="p-4 bg-[#FFE600] border-b border-[#E6CF00] flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2D3277] border border-[#1E2258] flex items-center justify-center text-[#FFE600] shadow-sm shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-[#2D3277] tracking-tight">
                  Painel Territorial
                </span>
              </div>
              <p className="text-[11px] text-[#2D3277]/80 font-medium">
                Módulos do Sistema & Governança
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#2D3277] transition-colors cursor-pointer"
            title="Fechar menu lateral (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Seletor de Escopo Territorial Rápido */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#3483FA]" />
              Foco Territorial
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Filtro ativo: <b className="text-[#2D3277]">{estadoScope}</b>
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 bg-white p-1 rounded-xl border border-slate-200">
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
                    onSelectTab('map');
                  }
                }}
                className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                  estadoScope === uf.id
                    ? 'bg-[#2D3277] text-[#FFE600] shadow-xs'
                    : 'text-slate-600 hover:text-[#2D3277] hover:bg-slate-100'
                }`}
              >
                {uf.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Corpo Rolável com Menus e Submenus Organizados por Assuntos Relacionados */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-slate-800">
          {menuGroups.map(group => {
            const isExpanded = Boolean(openGroups[group.id]);
            const GroupIcon = group.icon;

            return (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-xs transition-all"
              >
                {/* Menu Header (Categoria / Assunto Relacionado) */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full px-3.5 py-2.5 bg-white flex items-center justify-between text-left hover:bg-slate-50/90 transition-colors cursor-pointer ${
                    isExpanded ? 'border-b border-slate-200/80' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg bg-slate-100 ${group.accentColor}`}>
                      <GroupIcon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 truncate">
                        {group.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 truncate">
                        {group.categoryDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {group.items.length}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Submenus Relacionados */}
                {isExpanded && (
                  <div className="p-1.5 space-y-1">
                    {group.items.map(item => {
                      const ItemIcon = item.icon;
                      const isActive = !item.isActionOnly && activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-all cursor-pointer relative group ${
                            isActive
                              ? 'bg-white border border-[#2D3277] shadow-sm ring-2 ring-[#2D3277]/10'
                              : 'hover:bg-white hover:border-slate-300 border border-transparent'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl shrink-0 transition-colors ${
                              isActive
                                ? 'bg-[#2D3277] text-[#FFE600]'
                                : item.id === 'company_register_action'
                                ? 'bg-[#2D3277] text-[#FFE600]'
                                : 'bg-white text-slate-700 border border-slate-200 group-hover:border-slate-300'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className={`text-xs font-bold truncate ${
                                  isActive ? 'text-[#2D3277]' : 'text-slate-800'
                                }`}
                              >
                                {item.title}
                              </span>

                              {item.badge && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border font-mono shrink-0 whitespace-nowrap ${
                                    item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                              {item.subtitle}
                            </p>

                            {isActive && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-[#008744]">
                                <CheckCircle2 className="w-3 h-3 text-[#00A650]" />
                                <span>Módulo Ativo</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 4. Rodapé do Menu Lateral: Perfil, Login e Licença */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2.5">
          {/* Card do Usuário Autenticado ou Botão de Login */}
          {!firebaseUser ? (
            <button
              onClick={() => {
                openAuthModal();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar / Acessar Minha Conta</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#2D3277] text-[#FFE600] flex items-center justify-center font-bold text-xs shrink-0">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {userProfile?.displayName || 'Usuário'}
                    </span>
                    {userProfile?.status === 'approved' ? (
                      <span title="Conta Aprovada" className="inline-flex items-center">
                        <UserCheck className="w-3 h-3 text-[#008744] shrink-0" />
                      </span>
                    ) : (
                      <span title="Aguardando Aprovação" className="inline-flex items-center">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{userProfile?.email}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  signOutUser();
                  onClose();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Licença e Titularidade — Agência Ícone Digital by Vinicius Cirne */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <button
              type="button"
              onClick={() => {
                if (onOpenLicense) onOpenLicense();
                onClose();
              }}
              className="text-left hover:text-[#2D3277] transition-colors cursor-pointer"
              title="Ver detalhes da licença"
            >
              <div className="font-semibold text-slate-700">Agência Ícone Digital</div>
              <div className="text-[9px] text-slate-500 font-mono">by Vinicius Cirne • AID-VC-GIS-2026-BR-RJ</div>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onOpenLicense) onOpenLicense();
                onClose();
              }}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer shrink-0"
            >
              Licença
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
