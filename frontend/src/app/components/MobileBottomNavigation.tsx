import React from 'react';
import { Building2, Layers, Menu, Shield } from 'lucide-react';
import type { MainActiveTab } from '../routes';
import type { SidebarSection } from '../../components/LeftSidebar';

interface MobileBottomNavigationProps {
  activeTab: MainActiveTab;
  sidebarSection: SidebarSection | null;
  isFactionPanelOpen: boolean;
  isNavigationOpen: boolean;
  onMap: () => void;
  onLayers: () => void;
  onSig: () => void;
  onMenu: () => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab,
  sidebarSection,
  isFactionPanelOpen,
  isNavigationOpen,
  onMap,
  onLayers,
  onSig,
  onMenu
}) => (
  <nav aria-label="Navegação principal" className="md:hidden h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center z-40 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
    <button
      onClick={onMap}
      className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${activeTab === 'map' && !sidebarSection && !isFactionPanelOpen && !isNavigationOpen ? 'text-[#3483FA]' : 'text-slate-500 hover:text-[#2D3277]'}`}
    >
      <Layers className="w-5 h-5" />
      <span className="text-[10px] font-semibold tracking-tight">Mapa</span>
    </button>

    <button
      onClick={onLayers}
      className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${activeTab === 'map' && sidebarSection !== null ? 'text-[#2D3277]' : 'text-slate-500 hover:text-[#2D3277]'}`}
    >
      <Shield className="w-5 h-5" />
      <span className="text-[10px] font-semibold tracking-tight">Camadas</span>
    </button>

    <button
      onClick={onSig}
      className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${activeTab === 'sig_mges' ? 'text-[#00A650]' : 'text-slate-500 hover:text-[#2D3277]'}`}
    >
      <Building2 className="w-5 h-5" />
      <span className="text-[10px] font-semibold tracking-tight">SIG MG·ES</span>
    </button>

    <button
      onClick={onMenu}
      className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors ${isNavigationOpen || activeTab === 'stats' || activeTab === 'audit' || activeTab === 'about' || activeTab === 'admin' || activeTab === 'company_admin' ? 'text-[#3483FA]' : 'text-slate-500 hover:text-[#2D3277]'}`}
    >
      <Menu className="w-5 h-5" />
      <span className="text-[10px] font-semibold tracking-tight">Menu</span>
    </button>
  </nav>
);
