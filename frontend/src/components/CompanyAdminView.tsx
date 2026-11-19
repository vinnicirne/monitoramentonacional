import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Building2, Copy, Check, Users, ShieldCheck, PackageX, Plus, History, Crown, BarChart3 } from 'lucide-react';
import { CompanyIncidentSummary } from '../features/company-admin/components/CompanyIncidentSummary';
import { CompanyIncidentForm } from '../features/company-admin/components/CompanyIncidentForm';
import { IncidentRoster } from '../features/company-admin/components/IncidentRoster';
import { IncidentAuditTab } from '../features/company-admin/components/IncidentAuditTab';
import { CompanyMembersTab } from '../features/company-admin/components/CompanyMembersTab';
import { useCompanyAdminData } from '../features/company-admin/hooks/useCompanyAdminData';
import { CorporateCompany, CorporatePackageIncident } from '../types/admin';
import { TerritorialRegistry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCompanyMembers } from '../features/company-admin/hooks/useCompanyMembers';
import { useCompanyIncidentActions } from '../features/company-admin/hooks/useCompanyIncidentActions';

type CompanyPanelSubTab = 'users' | 'incidents' | 'carriers' | 'audit';
const CarrierAnalyticsTab = lazy(() => import('../features/company-admin/components/CarrierAnalyticsTab').then(module => ({ default: module.CarrierAnalyticsTab })));

interface CompanyAdminViewProps {
  registry?: TerritorialRegistry | null;
  availableCompanies?: CorporateCompany[];
  overrideDomain?: string;
  onSelectOverrideDomain?: (domain: string) => void;
  onGoToAdminCompanies?: () => void;
  onOpenIncidentModal?: (incident?: CorporatePackageIncident | null) => void;
  onViewIncidentDossier?: (incident: CorporatePackageIncident) => void;
  onLocateOnMap?: (lat: number, lng: number) => void;
}

export const CompanyAdminView: React.FC<CompanyAdminViewProps> = ({
  availableCompanies = [],
  overrideDomain,
  onSelectOverrideDomain,
  ...actions
}) => {
  const { userProfile: currentAdmin, isAdmin } = useAuth();
  const [subTab, setSubTab] = useState<CompanyPanelSubTab>('users');
  const activeDomain = isAdmin
    ? overrideDomain || availableCompanies.find(company => company.active)?.domain || availableCompanies[0]?.domain || ''
    : (currentAdmin?.companyDomain || currentAdmin?.domain || '').trim().toLowerCase();

  useEffect(() => {
    if (isAdmin && activeDomain && activeDomain !== overrideDomain && onSelectOverrideDomain) {
      onSelectOverrideDomain(activeDomain);
    }
  }, [isAdmin, activeDomain, overrideDomain, onSelectOverrideDomain]);

  return (
    <CompanyWorkspace
      key={activeDomain}
      {...actions}
      activeDomain={activeDomain}
      availableCompanies={availableCompanies}
      onSelectOverrideDomain={onSelectOverrideDomain}
      subTab={subTab}
      setSubTab={setSubTab}
    />
  );
};

function CompanyWorkspace({
  registry, activeDomain, availableCompanies: allCompanies, onSelectOverrideDomain,
  onGoToAdminCompanies, onOpenIncidentModal, onViewIncidentDossier, onLocateOnMap, subTab, setSubTab
}: CompanyAdminViewProps & {
  activeDomain: string;
  subTab: CompanyPanelSubTab;
  setSubTab: (next: CompanyPanelSubTab) => void;
}) {
  const { userProfile: currentAdmin, firebaseUser, isAdmin, isCompanyAdmin } = useAuth();
  const canReadAudit = isAdmin || isCompanyAdmin;
  const { company, licenses, companyUsers, incidents, auditCount, loadError, removeIncident } = useCompanyAdminData(activeDomain, canReadAudit, subTab);
  const [auditSearch, setAuditSearch] = useState('');

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'agora';
    try {
      const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return '—';
    }
  };

  const {
    empName,
    setEmpName,
    empEmailUser,
    setEmpEmailUser,
    empRole,
    setEmpRole,
    empIncidentAccess,
    setEmpIncidentAccess,
    searchTerm,
    setSearchTerm,
    formError,
    formSuccess,
    isSaving,
    copiedInvite,
    members,    memberCount,    connectedCount,
    activeCount,
    seatLimit,
    pricePerLicense,
    monthlyEstimate,
    seatsFull,
    handleAddAndLinkUser,
    handleToggleMemberLicense,
    handleToggleCompanyRole,
    handleIncidentAccessChange,
    handleRemoveLicense,
    handleCopyAccessLink
  } = useCompanyMembers({ activeDomain, currentAdmin, company, licenses, companyUsers });

  const {
    editingIncidentId,
    trackingCode,
    setTrackingCode,
    carrierName,
    setCarrierName,
    packageQuantity,
    setPackageQuantity,
    packagesDelivered,
    setPackagesDelivered,
    packagesRecovered,
    setPackagesRecovered,
    packagesStolen,
    setPackagesStolen,
    incidentType,
    setIncidentType,
    boNumber,
    setBoNumber,
    delegaciaUfFilter,
    setDelegaciaUfFilter,
    delegaciaSearch,
    setDelegaciaSearch,
    selectedDelegaciaId,
    setSelectedDelegaciaId,
    packageAtStation,
    setPackageAtStation,
    custodyStatus,
    setCustodyStatus,
    estimatedUnitValue,
    setEstimatedUnitValue,
    incidentNotes,
    setIncidentNotes,
    incidentSearch,
    setIncidentSearch,
    incidentFilter,
    setIncidentFilter,
    incidentError,
    incidentSuccess,
    isSavingIncident,
    canDeleteIncidents,
    filteredDelegacias,
    registeredCarriers,
    filteredIncidents,
    incidentStats,
    resetIncidentForm,
    handleEditIncident,
    handleSaveIncident,
    handleQuickCustodyChange,
    handleTogglePackageAtStation,
    handleDeleteIncident
  } = useCompanyIncidentActions({ activeDomain, currentAdmin, firebaseUser, isAdmin, isCompanyAdmin, licenses, incidents, removeIncident, registry });

  // Company records are managed in the global SuperAdmin panel, outside a company workspace.
  if ((isAdmin && allCompanies.length === 0 && !activeDomain) || (!activeDomain && !company)) {
    return (
      <div className="flex-1 h-full bg-[#F5F5F5] overflow-y-auto p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4 text-center">
          <Building2 className="w-10 h-10 text-[#2D3277] mx-auto" />
          <h2 className="text-base md:text-lg font-extrabold text-[#2D3277]">
            {isAdmin ? 'Selecione uma empresa para gerenciar' : 'Sua conta ainda não está vinculada a uma empresa'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAdmin
              ? 'O cadastro e a gestão ficam no Painel SuperAdmin, na seção Empresas & Licenças.'
              : 'Peça ao SuperAdmin da sua organização para vincular sua conta.'}
          </p>
          {isAdmin && onGoToAdminCompanies && (
            <button type="button" onClick={onGoToAdminCompanies} className="px-4 py-2 rounded-xl bg-[#2D3277] text-[#FFE600] text-xs font-extrabold">
              Ir ao Painel SuperAdmin
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1 h-full bg-[#F5F5F5] overflow-y-auto p-3.5 md:p-6 space-y-5">
      {/* Header Banner + Company Switcher (for System Admin) + Sub-Tabs */}
      <div className="p-4 md:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#2D3277] text-[#FFE600] shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-[#2D3277]">
                  {company?.companyName || `Empresa @${activeDomain}`}
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#FFE600] text-[#2D3277] font-mono font-bold text-xs">
                  @{activeDomain}
                </span>
                {isAdmin ? (
                  <span
                    className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-extrabold uppercase flex items-center gap-1 shadow-2xs"
                    title="Você está conectado como SuperAdmin do sistema inspecionando este painel corporativo"
                  >
                    <Crown className="w-3 h-3 text-purple-700 fill-purple-300" />
                    SuperAdmin no Painel
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-[#2D3277]/10 text-[#2D3277] text-[10px] font-bold uppercase">
                    ADM Corporativo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Gerencie usuários e licenças da empresa e controle ocorrências em delegacias.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isAdmin && allCompanies.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
                <span className="font-bold text-slate-500 text-[10px] uppercase">Empresa:</span>
                <select
                  value={activeDomain}
                  onChange={e => onSelectOverrideDomain?.(e.target.value)}
                  className="bg-transparent font-bold text-[#2D3277] focus:outline-none cursor-pointer"
                  title="Alternar visão corporativa (exclusivo SuperAdmin)"
                >
                  {allCompanies.map(c => (
                    <option key={c.domain} value={c.domain}>
                      {c.companyName} (@{c.domain})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyAccessLink}
              className="px-3.5 py-2 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedInvite ? 'Link Copiado!' : 'Copiar Link da Equipe'}</span>
            </button>
          </div>
        </div>

        {/* Corporate Admin Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setSubTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'users'
                ? 'bg-[#2D3277] text-[#FFE600] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários & Licenças ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('incidents')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'incidents'
                ? 'bg-[#2D3277] text-[#FFE600] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PackageX className="w-4 h-4" />
            <span>Extravios, Fraudes & Ocorrências em DPs</span>
            {incidentStats.atStation > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] ${
                  subTab === 'incidents'
                    ? 'bg-[#FFE600] text-[#2D3277]'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {incidentStats.atStation} na DP
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('carriers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'carriers'
                ? 'bg-[#2D3277] text-[#FFE600] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Transportadoras</span>
          </button>

          {(isAdmin || currentAdmin?.companyRole === 'company_admin') && (
            <button
              type="button"
              onClick={() => setSubTab('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${subTab === 'audit' ? 'bg-[#2D3277] text-[#FFE600] shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <History className="w-4 h-4" />
              <span>Auditoria de Ocorrências{auditCount !== null && ` (${auditCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUBTAB 1: USUÁRIOS & LICENÇAS                                       */}
      {/* =================================================================== */}
      {loadError && <p role="alert" className="text-sm text-rose-700">Parte dos dados da empresa não pôde ser carregada.</p>}
      {subTab === 'users' && (
        <CompanyMembersTab
          activeDomain={activeDomain}
          activeCount={activeCount}
          seatLimit={seatLimit}
          seatsFull={seatsFull}
          members={members}
          memberCount={memberCount}
          connectedCount={connectedCount}
          monthlyEstimate={monthlyEstimate}
          pricePerLicense={pricePerLicense}
          currentUserUid={currentAdmin?.uid}
          company={company}
          formError={formError}
          formSuccess={formSuccess}
          isSaving={isSaving}
          empName={empName}
          setEmpName={setEmpName}
          empEmailUser={empEmailUser}
          setEmpEmailUser={setEmpEmailUser}
          empRole={empRole}
          setEmpRole={setEmpRole}
          empIncidentAccess={empIncidentAccess}
          setEmpIncidentAccess={setEmpIncidentAccess}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddUser={handleAddAndLinkUser}
          onToggleMemberLicense={handleToggleMemberLicense}
          onToggleCompanyRole={handleToggleCompanyRole}
          onChangeIncidentAccess={handleIncidentAccessChange}
          onRemoveMember={handleRemoveLicense}
        />
      )}
      {/* =================================================================== */}
      {/* SUBTAB 2: PACOTES EXTRAVIADOS / FRAUDES & OCORRÊNCIAS EM DELEGACIAS */}
      {/* =================================================================== */}
      {subTab === 'carriers' && (
        <Suspense fallback={<p role="status" className="text-sm text-slate-600">Carregando indicadores…</p>}>
          <CarrierAnalyticsTab incidents={incidents} companyDomain={activeDomain} />
        </Suspense>
      )}
      {subTab === 'incidents' && (
        <>
          {/* Action & Privacy Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2D3277] to-[#1E2258] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FFE600]" />
                <span className="font-extrabold text-sm text-[#FFE600]">
                  Ocorrências & Mapa de Calor Confidencial
                </span>
              </div>
              <p className="text-xs text-white/80 max-w-2xl">
                Ocorrências cadastradas geram histórico cronológico e alimentam dinamicamente a mancha térmica exclusiva de <strong>@{activeDomain}</strong>. Apenas membros autorizados da sua empresa têm acesso a esses dados.
              </p>
            </div>
            {onOpenIncidentModal && (
              <button
                type="button"
                onClick={() => onOpenIncidentModal(null)}
                className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#FFE600]/90 text-[#2D3277] font-extrabold text-xs flex items-center gap-2 shadow cursor-pointer transition-transform hover:scale-105 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Nova Ocorrência</span>
              </button>
            )}
          </div>

          <CompanyIncidentSummary stats={incidentStats} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <CompanyIncidentForm
              values={{ editingIncidentId, incidentError, incidentSuccess, isSavingIncident, trackingCode, incidentType, carrierName, packageQuantity, packagesDelivered, packagesRecovered, packagesStolen, boNumber, estimatedUnitValue, delegaciaUfFilter, delegaciaSearch, selectedDelegaciaId, packageAtStation, custodyStatus, incidentNotes }}
              actions={{ onReset: resetIncidentForm, setTrackingCode, setIncidentType, setCarrierName, setPackageQuantity, setPackagesDelivered, setPackagesRecovered, setPackagesStolen, setBoNumber, setEstimatedUnitValue, setDelegaciaUfFilter, setDelegaciaSearch, setSelectedDelegaciaId, setPackageAtStation, setCustodyStatus, setIncidentNotes }}
              registeredCarriers={registeredCarriers}
              filteredDelegacias={filteredDelegacias}
              companyActive={company?.active ?? null}
              onSubmit={handleSaveIncident}
            />

            <IncidentRoster
              filteredIncidents={filteredIncidents}
              incidents={incidents}
              activeDomain={activeDomain}
              incidentStats={incidentStats}
              incidentSearch={incidentSearch}
              setIncidentSearch={setIncidentSearch}
              incidentFilter={incidentFilter}
              setIncidentFilter={setIncidentFilter}
              onLocateOnMap={onLocateOnMap}
              onViewIncidentDossier={onViewIncidentDossier}
              onOpenIncidentModal={onOpenIncidentModal}
              handleEditIncident={handleEditIncident}
              handleTogglePackageAtStation={handleTogglePackageAtStation}
              handleDeleteIncident={handleDeleteIncident}
              handleQuickCustodyChange={handleQuickCustodyChange}
              canDeleteIncidents={canDeleteIncidents}
              formatTimestamp={formatTimestamp}
            />
          </div>
        </>
      )}

      {/* =================================================================== */}
      {subTab === 'audit' && (isAdmin || currentAdmin?.companyRole === 'company_admin') && (
        <IncidentAuditTab
          key={activeDomain}
          activeDomain={activeDomain}
          search={auditSearch}
          onSearchChange={setAuditSearch}
          formatTimestamp={formatTimestamp}
          onViewIncidentDossier={onViewIncidentDossier}
        />
      )}

    </div>
  );
};
