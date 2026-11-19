import React from 'react';
import type { CorporateCompany, CorporatePackageIncident } from '../../types/admin';
import type { SelectedFeatureData, TerritorialRegistry } from '../../types';
import { AuthGateModal } from '../../components/AuthGateModal';
import { CompanyRegisterModal } from '../../components/CompanyRegisterModal';
import { LicenseModal } from '../../components/LicenseModal';

const DataImporterModal = React.lazy(() => import('../../components/DataImporterModal').then(module => ({ default: module.DataImporterModal })));
const PrintableDossierModal = React.lazy(() => import('../../components/PrintableDossierModal').then(module => ({ default: module.PrintableDossierModal })));
const CorporateIncidentModal = React.lazy(() => import('../../components/CorporateIncidentModal').then(module => ({ default: module.CorporateIncidentModal })));

interface AppGlobalDialogsProps {
  registry: TerritorialRegistry | null;
  showImporter: boolean;
  showPrintModal: boolean;
  showLicenseModal: boolean;
  showCompanyRegisterModal: boolean;
  showIncidentModal: boolean;
  printableData: SelectedFeatureData | null;
  selectedIncident: CorporatePackageIncident | null;
  incidentInitialCoords?: { lat: number; lng: number };
  companyDomain: string;
  availableCompanies: CorporateCompany[];
  registeredCarrierOptions: string[];
  isAdmin: boolean;
  onCloseImporter: () => void;
  onClosePrint: () => void;
  onCloseLicense: () => void;
  onCloseCompanyRegister: () => void;
  onCompanyCreated: (domain: string) => void;
  onCloseIncident: () => void;
  onSelectCompanyDomain: (domain: string) => void;
  onOpenAdmin: () => void;
  onOpenCompanyAdmin: () => void;
  onOpenCompanyRegister: (() => void) | undefined;
}

export const AppGlobalDialogs: React.FC<AppGlobalDialogsProps> = ({
  registry,
  showImporter,
  showPrintModal,
  showLicenseModal,
  showCompanyRegisterModal,
  showIncidentModal,
  printableData,
  selectedIncident,
  incidentInitialCoords,
  companyDomain,
  availableCompanies,
  registeredCarrierOptions,
  isAdmin,
  onCloseImporter,
  onClosePrint,
  onCloseLicense,
  onCloseCompanyRegister,
  onCompanyCreated,
  onCloseIncident,
  onSelectCompanyDomain,
  onOpenAdmin,
  onOpenCompanyAdmin,
  onOpenCompanyRegister
}) => (
  <>
    <React.Suspense fallback={null}>
      {showImporter && <DataImporterModal registry={registry} onClose={onCloseImporter} />}
      {showPrintModal && <PrintableDossierModal data={printableData} onClose={onClosePrint} />}
      {showLicenseModal && <LicenseModal isOpen onClose={onCloseLicense} />}
      <CompanyRegisterModal
        isOpen={showCompanyRegisterModal}
        onClose={onCloseCompanyRegister}
        onCompanyCreated={onCompanyCreated}
      />
      {showIncidentModal && (
        <CorporateIncidentModal
          isOpen
          onClose={onCloseIncident}
          companyDomain={companyDomain}
          availableCompanies={availableCompanies}
          registeredCarrierOptions={registeredCarrierOptions}
          onSelectCompanyDomain={onSelectCompanyDomain}
          existingIncident={selectedIncident}
          initialCoords={incidentInitialCoords}
          registry={registry}
        />
      )}
    </React.Suspense>
    <AuthGateModal
      onOpenAdmin={onOpenAdmin}
      onOpenCompanyAdmin={onOpenCompanyAdmin}
      onOpenCompanyRegister={isAdmin ? onOpenCompanyRegister : undefined}
    />
  </>
);
