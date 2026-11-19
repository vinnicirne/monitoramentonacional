import React, { Suspense, lazy } from 'react';
import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import { Shield } from 'lucide-react';
import type { SelectedFeatureData } from '../../../types';
import type { CodigoFaccaoPrecisa } from '../../../data/faccoesPrecisas';
import { LeftSidebar } from '../../../components/LeftSidebar';
import { RightDossier } from '../../../components/RightDossier';
import { FactionVisibilityControl } from '../components/FactionVisibilityControl';
import type { MapContainer as MapContainerComponent } from '../../../components/MapContainer';
import type { CorporatePackageIncident } from '../../../types/admin';

const MapContainer = lazy(() => import('../../../components/MapContainer').then(module => ({ default: module.MapContainer })));
const CorporateIncidentDossier = lazy(() => import('../../../components/CorporateIncidentDossier').then(module => ({ default: module.CorporateIncidentDossier })));

type SidebarProps = ComponentProps<typeof LeftSidebar>;
type MapProps = ComponentProps<typeof MapContainerComponent>;

interface MapWorkspaceProps {
  sidebarProps: SidebarProps;
  mapProps: MapProps;
  selectedData: SelectedFeatureData | null;
  isDossierOpen: boolean;
  setIsDossierOpen: (open: boolean) => void;
  isFactionPanelOpen: boolean;
  onCloseFactionPanel: () => void;
  visiblePreciseFactions: Record<CodigoFaccaoPrecisa, boolean>;
  setVisiblePreciseFactions: Dispatch<SetStateAction<Record<CodigoFaccaoPrecisa, boolean>>>;
  selectedCorporateIncident: CorporatePackageIncident | null;
  onCloseDossier: () => void;
  onCenterOnCorporateIncident: () => void;
  onEditCorporateIncident?: () => void;
  onPrintDossier: () => void;
  onCenterOnSelected: () => void;
  onSelectEstadoScope: (scope: SidebarProps['estadoScope']) => void;
  onOpenImport: () => void;
}

export const MapWorkspace: React.FC<MapWorkspaceProps> = ({
  sidebarProps,
  mapProps,
  selectedData,
  isDossierOpen,
  setIsDossierOpen,
  isFactionPanelOpen,
  onCloseFactionPanel,
  visiblePreciseFactions,
  setVisiblePreciseFactions,
  selectedCorporateIncident,
  onCloseDossier,
  onCenterOnCorporateIncident,
  onEditCorporateIncident,
  onPrintDossier,
  onCenterOnSelected,
  onSelectEstadoScope,
  onOpenImport
}) => (
  <div className="flex-1 flex w-full h-full overflow-hidden relative">
    <LeftSidebar {...sidebarProps} />

    <div className="flex-1 h-full relative overflow-hidden">
      <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-xs text-slate-500" role="status">Carregando mapa…</div>}>
        <MapContainer {...mapProps} />
      </Suspense>

      <div className="absolute bottom-2.5 left-2.5 right-2.5 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-20 flex items-center justify-center gap-2 pointer-events-none">
        <FactionVisibilityControl
          isOpen={isFactionPanelOpen}
          onClose={onCloseFactionPanel}
          visibleFactions={visiblePreciseFactions}
          setVisibleFactions={setVisiblePreciseFactions}
        />
      </div>

      {!isDossierOpen && selectedData && (
        <button type="button" onClick={() => setIsDossierOpen(true)}
          className="absolute bottom-14 right-3 md:bottom-auto md:top-4 md:right-14 z-20 max-w-[calc(100vw-1.5rem)] px-3.5 py-2 rounded-xl bg-white/95 hover:bg-[#FFE600] text-[#2D3277] border border-slate-200 hover:border-[#E6CF00] shadow-lg flex items-center gap-2 text-xs font-bold backdrop-blur-md transition-all cursor-pointer">
          <Shield className="w-4 h-4 text-[#3483FA] shrink-0" />
          <span className="truncate">Ver Dossiê: {selectedData.nome}</span>
        </button>
      )}
    </div>

    <Suspense fallback={null}>
      {selectedCorporateIncident ? (
        <CorporateIncidentDossier
          incident={selectedCorporateIncident}
          onClose={onCloseDossier}
          onCenterOnMap={onCenterOnCorporateIncident}
          onEdit={onEditCorporateIncident}
        />
      ) : (
        <RightDossier
          data={selectedData}
          isOpen={isDossierOpen}
          onClose={onCloseDossier}
          onPrintDossier={onPrintDossier}
          onCenterOnMap={onCenterOnSelected}
          onSelectEstadoScope={onSelectEstadoScope}
          onOpenImport={onOpenImport}
        />
      )}
    </Suspense>
  </div>
);
