import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Header } from '../../components/Header';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import type { SidebarSection } from '../../components/LeftSidebar';
import type { EstadoScope } from '../../types/sigBase';
import { usePwaLifecycle } from '../hooks/usePwaLifecycle';
import type { MainActiveTab } from '../routes';
import { AppFooter } from './AppFooter';
import { MobileBottomNavigation } from './MobileBottomNavigation';

interface AppLayoutProps {
  children: ReactNode;
  dialogs: ReactNode;
  activeTab: MainActiveTab;
  onNavigate: (tab: MainActiveTab) => void;
  estadoScope: EstadoScope;
  onChangeScope: (scope: EstadoScope) => void;
  sidebarSection: SidebarSection | null;
  setSidebarSection: Dispatch<SetStateAction<SidebarSection | null>>;
  isFactionPanelOpen: boolean;
  setIsFactionPanelOpen: Dispatch<SetStateAction<boolean>>;
  isNavigationOpen: boolean;
  setIsNavigationOpen: Dispatch<SetStateAction<boolean>>;
  onOpenLicense: () => void;
  onOpenCompanyRegister?: () => void;
  accessDeniedMessage: string | null;
  onDismissAccessDenied: () => void;
}

export function AppLayout({
  children,
  dialogs,
  activeTab,
  onNavigate,
  estadoScope,
  onChangeScope,
  sidebarSection,
  setSidebarSection,
  isFactionPanelOpen,
  setIsFactionPanelOpen,
  isNavigationOpen,
  setIsNavigationOpen,
  onOpenLicense,
  onOpenCompanyRegister,
  accessDeniedMessage,
  onDismissAccessDenied
}: AppLayoutProps) {
  const { isOnline, canInstall, handleInstallApp } = usePwaLifecycle();
  const closeNavigation = () => setIsNavigationOpen(false);

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-[#F5F5F5] text-slate-900 overflow-hidden font-sans">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-2 focus:left-2 focus:bg-white focus:text-[#2D3277] focus:px-4 focus:py-3 focus:rounded-lg">
        Pular para o conteúdo principal
      </a>
      {!isOnline && (
        <div role="status" className="fixed z-[60] bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] left-3 right-3 md:bottom-4 md:left-auto md:right-4 md:w-auto rounded-xl bg-slate-900 text-white px-4 py-3 text-xs shadow-xl">
          Sem conexão. O mapa base, busca e sincronização de ocorrências precisam de internet.
        </div>
      )}
      <Header
        activeTab={activeTab}
        setActiveTab={onNavigate}
        estadoScope={estadoScope}
        setEstadoScope={onChangeScope}
        onOpenLicense={onOpenLicense}
        onOpenCompanyRegister={onOpenCompanyRegister}
        onOpenNavigation={() => setIsNavigationOpen(true)}
        isFactionPanelOpen={isFactionPanelOpen}
        onToggleFactions={() => {
          setSidebarSection(null);
          closeNavigation();
          setIsFactionPanelOpen(previous => !previous);
        }}
      />

      <main id="main-content" className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        {accessDeniedMessage && (
          <div role="alert" className="mx-3 mt-3 md:mx-5 flex items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950 shadow-sm">
            <span>{accessDeniedMessage}</span>
            <button
              type="button"
              onClick={onDismissAccessDenied}
              aria-label="Fechar aviso de acesso"
              className="shrink-0 font-bold text-amber-800 hover:text-amber-950"
            >
              Fechar
            </button>
          </div>
        )}
        {children}
      </main>

      <MobileBottomNavigation
        activeTab={activeTab}
        sidebarSection={sidebarSection}
        isFactionPanelOpen={isFactionPanelOpen}
        isNavigationOpen={isNavigationOpen}
        onMap={() => {
          onNavigate('map');
          setSidebarSection(null);
          setIsFactionPanelOpen(false);
          closeNavigation();
        }}
        onLayers={() => {
          onNavigate('map');
          setIsFactionPanelOpen(false);
          closeNavigation();
          setSidebarSection(previous => previous ? null : 'layers');
        }}
        onSig={() => {
          setSidebarSection(null);
          setIsFactionPanelOpen(false);
          closeNavigation();
          onNavigate('sig_mges');
        }}
        onMenu={() => {
          setSidebarSection(null);
          setIsFactionPanelOpen(false);
          setIsNavigationOpen(previous => !previous);
        }}
      />
      <AppFooter onOpenLicense={onOpenLicense} />
      {dialogs}

      <NavigationDrawer
        isOpen={isNavigationOpen}
        onClose={closeNavigation}
        activeTab={activeTab}
        onSelectTab={onNavigate}
        estadoScope={estadoScope}
        setEstadoScope={onChangeScope}
        onOpenImport={() => onNavigate('import')}
        onOpenCompanyRegister={onOpenCompanyRegister}
        onOpenLicense={onOpenLicense}
        canInstall={canInstall}
        onInstall={handleInstallApp}
      />
    </div>
  );
}
