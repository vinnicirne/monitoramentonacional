import React, { lazy, Suspense, useMemo, useState } from 'react';
import { Crown, Building2 } from 'lucide-react';
import { UserStatus } from '../types/admin';
import { useAuth } from '../contexts/AuthContext';
import { AdminPlansTab } from '../features/admin/components/AdminPlansTab';
import { AdminCompaniesTab } from '../features/admin/components/AdminCompaniesTab';
import { AdminDomainsTab } from '../features/admin/components/AdminDomainsTab';
import { AdminReferralsTab } from '../features/admin/components/AdminReferralsTab';
import { AdminUsersTab } from '../features/admin/components/AdminUsersTab';
import { AdminSummaryCards } from '../features/admin/components/AdminSummaryCards';
import { AdminOverviewTab } from '../features/admin/components/AdminOverviewTab';
import { useAdminDashboardData, type AdminSubTab } from '../features/admin/hooks/useAdminDashboardData';
import { useAdminUserActions } from '../features/admin/hooks/useAdminUserActions';
import { useAdminDomainForm } from '../features/admin/hooks/useAdminDomainForm';
import { useAdminCompanyForm } from '../features/admin/hooks/useAdminCompanyForm';
import { useAdminPlanForm } from '../features/admin/hooks/useAdminPlanForm';
import { useAdminReferrals } from '../features/admin/hooks/useAdminReferrals';

import { useAdminUsers } from '../features/admin/hooks/useAdminUsers';
import { useAdminOperationFeedback } from '../features/admin/hooks/useAdminOperationFeedback';

const AdminIncidentAnalytics = lazy(() => import('./AdminIncidentAnalytics').then(module => ({ default: module.AdminIncidentAnalytics })));

interface AdminDashboardViewProps {
  onOpenCompanyPanel?: (domain: string) => void;
  onOpenCompanyRegister?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onOpenCompanyPanel,
  onOpenCompanyRegister
}) => {
  const { userProfile: currentAdmin } = useAuth();
  const [subTab, setSubTab] = useState<AdminSubTab>('overview');

  const { operationError, dismissError, refreshVersion, onChanged, onError } = useAdminOperationFeedback();
  const { activeLicenseUsers, userCounts, pendingCount, plans, companies, incidentsByCompany, domains, referralStats, accessLogs, loadError } = useAdminDashboardData(subTab, refreshVersion);
  const allCorporateIncidents = useMemo(() => Object.values(incidentsByCompany).flat(), [incidentsByCompany]);

  // Filters & Forms
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserStatus>('all');
  const stats = useMemo(() => {
    const { totalUsers = 0, approvedUsers = 0, blockedUsers = 0 } = userCounts ?? {};
    const pendingUsers = pendingCount ?? 0;
    const activeLicensedUsers = activeLicenseUsers.length;

    const totalReferrals = referralStats?.totalReferrals ?? 0;
    const directMeliReferrals = referralStats?.directMeliReferrals ?? 0;

    const activeDomains = domains.filter(d => d.active).length;
    const activeCompanies = companies.filter(c => c.active).length;
    const licensesByDomain = new Map<string, number>();
    activeLicenseUsers.forEach(user => {
      const domain = (user.companyDomain || user.domain).toLowerCase();
      licensesByDomain.set(domain, (licensesByDomain.get(domain) ?? 0) + 1);
    });

    const monthlyCorporateRevenue = companies
      .filter(c => c.active)
      .reduce((sum, comp) => {
        const compLicensedCount = licensesByDomain.get(comp.domain.toLowerCase()) ?? 0;
        return sum + compLicensedCount * (comp.pricePerLicense || 0);
      }, 0);

    const totalAccesses = accessLogs.length;
    const locationCounts: Record<string, number> = {};
    accessLogs.forEach(l => {
      const key = l.targetName || 'Localização';
      locationCounts[key] = (locationCounts[key] || 0) + 1;
    });
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      totalUsers,
      approvedUsers,
      pendingUsers,
      blockedUsers,
      activeLicensedUsers,
      totalReferrals,
      directMeliReferrals,
      activeDomains,
      activeCompanies,
      monthlyCorporateRevenue,
      totalAccesses,
      topLocations
    };
  }, [activeLicenseUsers, userCounts, pendingCount, referralStats, domains, companies, accessLogs]);

  const userPage = useAdminUsers(subTab === 'users', userStatusFilter, userSearch, refreshVersion);

  const {
    handleSetUserStatus,
    handleSetUserPlan,
    handleToggleUserAdmin,
    handleAssignUserLicense,
    handleSuspendUserLicense,
    handleToggleCompanyAdminRole
  } = useAdminUserActions({ currentAdmin, companies, onChanged, onError });

  const {
    newDomain,
    setNewDomain,
    newDomainLabel,
    setNewDomainLabel,
    newDomainAutoRef,
    setNewDomainAutoRef,
    handleAddFreeDomain,
    handleToggleDomain,
    handleDeleteDomain
  } = useAdminDomainForm({ plans, onError });

  const {
    editingCompanyDomain,
    compDomain,
    setCompDomain,
    compName,
    setCompName,
    compPlanId,
    setCompPlanId,
    compPricePerLicense,
    setCompPricePerLicense,
    compLicensedSeats,
    setCompLicensedSeats,
    compAutoApprove,
    setCompAutoApprove,
    resetCompanyForm,
    handleEditCompany,
    handleSaveCompany,
    handleToggleCompany,
    handleDeleteCompany
  } = useAdminCompanyForm({ plans, onError });

  const {
    editingPlanId,
    planName,
    setPlanName,
    planDesc,
    setPlanDesc,
    planBillingModel,
    setPlanBillingModel,
    planPrice,
    setPlanPrice,
    planQueries,
    setPlanQueries,
    planFeaturesText,
    setPlanFeaturesText,
    resetPlanForm,
    handleEditPlan,
    handleCreateOrUpdatePlan,
    handleTogglePlanActive
  } = useAdminPlanForm({ onError });

  const {
    copiedCode,
    handleSetReferralStatus,
    handleCopyRef
  } = useAdminReferrals({ onChanged, onError });

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'agora';
    try {
      const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  const tabs: { id: AdminSubTab; label: string }[] = [
    { id: 'overview', label: 'Resumo & Acessos' },
    { id: 'analytics', label: 'Análise de Ocorrências' },
    { id: 'users', label: stats.pendingUsers > 0 ? `Usuários (${stats.pendingUsers} pendentes)` : 'Usuários' },
    { id: 'companies', label: stats.activeCompanies > 0 ? `Empresas & Licenças (${stats.activeCompanies})` : 'Empresas & Licenças' },
    { id: 'plans', label: 'Planos' },
    { id: 'domains', label: 'Domínios Free' },
    { id: 'referrals', label: 'Indicações' }
  ];

  return (
    <div className="flex-1 h-full min-w-0 bg-[#F5F5F5] overflow-y-auto p-3.5 md:p-6 space-y-5">
      {/* Header Banner */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 rounded-xl border border-[#E6CF00] bg-[#FFE600] p-2.5 text-[#2D3277] shadow-xs">
              <Crown aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-[#2D3277]">Painel Administrativo</h1>
              <p className="mt-0.5 max-w-2xl text-xs text-slate-600">
                Gerencie liberações de acesso externo, domínios free (<code className="font-mono font-bold text-[#2D3277]">@mercadolivre.com</code>), planos, afiliados sem comissão e histórico de localizações acessadas.
              </p>
            </div>
          </div>
          {onOpenCompanyRegister && (
            <button
              type="button"
              onClick={onOpenCompanyRegister}
              className="flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#1E2258] bg-[#2D3277] px-3.5 py-2 text-xs font-extrabold text-[#FFE600] shadow-xs transition-colors hover:bg-[#1E2258] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3483FA] sm:self-start"
            >
              <Building2 aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>Criar conta corporativa</span>
            </button>
          )}
        </div>

        <nav aria-label="Seções do Painel Administrativo" className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1.5 sm:flex sm:flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={subTab === tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`min-h-11 min-w-0 cursor-pointer rounded-lg px-2 py-2 text-xs font-semibold leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3483FA] sm:px-3 ${
                subTab === tab.id
                  ? 'bg-[#FFE600] text-[#2D3277] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-[#2D3277] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {loadError && <p role="alert" className="text-sm text-rose-700">{loadError}</p>}
      {operationError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {operationError}
          <button type="button" onClick={dismissError} className="font-bold">Fechar</button>
        </div>
      )}

      {/* 4 EXECUTIVE CARDS: USUÁRIOS, INDICAÇÕES, DOMÍNIOS, LOCALIZAÇÕES ACESSADAS */}
      {subTab === 'overview' && (
        <AdminSummaryCards
          stats={stats}
          onUsers={() => setSubTab('users')}
          onReferrals={() => setSubTab('referrals')}
          onCompanies={() => setSubTab('companies')}
        />
      )}

      {/* ================================================================= */}
      {/* SUBTAB 1: VISÃO GERAL & LOCALIZAÇÕES ACESSADAS                    */}
      {/* ================================================================= */}
      {subTab === 'overview' && (
        <AdminOverviewTab
          stats={stats}
          accessLogs={accessLogs}
          formatTimestamp={formatTimestamp}
          onReviewPendingUsers={() => {
            setUserStatusFilter('pending');
            setSubTab('users');
          }}
        />
      )}

      {subTab === 'analytics' && (
        <Suspense fallback={<p role="status" className="text-sm text-slate-600">Carregando análises…</p>}>
          <AdminIncidentAnalytics
          incidents={allCorporateIncidents}
          companies={companies}
          onOpenCompanyPanel={onOpenCompanyPanel}
          />
        </Suspense>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 2: GERENCIAMENTO DE USUÁRIOS                               */}
      {/* ================================================================= */}
      {subTab === 'users' && (
        <AdminUsersTab
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          userStatusFilter={userStatusFilter}
          setUserStatusFilter={setUserStatusFilter}
          stats={stats}
          userPage={userPage}
          plans={plans}
          currentAdminUid={currentAdmin?.uid}
          handleSetUserPlan={handleSetUserPlan}
          handleSuspendUserLicense={handleSuspendUserLicense}
          handleAssignUserLicense={handleAssignUserLicense}
          handleSetUserStatus={handleSetUserStatus}
          handleToggleUserAdmin={handleToggleUserAdmin}
        />
      )}

      {/* ================================================================= */}
      {/* SUBTAB 2.5: EMPRESAS & LICENÇAS POR USUÁRIO (@empresa.com)        */}
      {/* ================================================================= */}
      {subTab === 'companies' && (
        <AdminCompaniesTab
          stats={stats}
          editingCompanyDomain={editingCompanyDomain}
          resetCompanyForm={resetCompanyForm}
          compDomain={compDomain}
          setCompDomain={setCompDomain}
          compName={compName}
          setCompName={setCompName}
          compPlanId={compPlanId}
          setCompPlanId={setCompPlanId}
          compPricePerLicense={compPricePerLicense}
          setCompPricePerLicense={setCompPricePerLicense}
          compLicensedSeats={compLicensedSeats}
          setCompLicensedSeats={setCompLicensedSeats}
          compAutoApprove={compAutoApprove}
          setCompAutoApprove={setCompAutoApprove}
          plans={plans}
          handleSaveCompany={handleSaveCompany}
          companies={companies}
          onOpenCompanyPanel={onOpenCompanyPanel}
          handleEditCompany={handleEditCompany}
          handleToggleCompany={handleToggleCompany}
          handleDeleteCompany={handleDeleteCompany}
          currentAdminUid={currentAdmin?.uid}
          handleToggleCompanyAdminRole={handleToggleCompanyAdminRole}
          handleSuspendUserLicense={handleSuspendUserLicense}
          handleAssignUserLicense={handleAssignUserLicense}
        />
      )}

      {/* ================================================================= */}
      {/* SUBTAB 3: CONTROLE DE PLANOS                                      */}
      {/* ================================================================= */}
      {subTab === 'plans' && (
        <AdminPlansTab
          editingPlanId={editingPlanId}
          resetPlanForm={resetPlanForm}
          handleCreateOrUpdatePlan={handleCreateOrUpdatePlan}
          planName={planName}
          setPlanName={setPlanName}
          planBillingModel={planBillingModel}
          setPlanBillingModel={setPlanBillingModel}
          planDesc={planDesc}
          setPlanDesc={setPlanDesc}
          planPrice={planPrice}
          setPlanPrice={setPlanPrice}
          planQueries={planQueries}
          setPlanQueries={setPlanQueries}
          planFeaturesText={planFeaturesText}
          setPlanFeaturesText={setPlanFeaturesText}
          plans={plans}
          refreshVersion={refreshVersion}
          handleEditPlan={handleEditPlan}
          handleTogglePlanActive={handleTogglePlanActive}
        />
      )}

      {/* ================================================================= */}
      {/* SUBTAB 4: CONTROLE DE DOMÍNIOS LIBERADOS FREE                     */}
      {/* ================================================================= */}
      {subTab === 'domains' && (
        <AdminDomainsTab
          newDomain={newDomain}
          setNewDomain={setNewDomain}
          newDomainLabel={newDomainLabel}
          setNewDomainLabel={setNewDomainLabel}
          newDomainAutoRef={newDomainAutoRef}
          setNewDomainAutoRef={setNewDomainAutoRef}
          handleAddFreeDomain={handleAddFreeDomain}
          domains={domains}
          handleToggleDomain={handleToggleDomain}
          handleDeleteDomain={handleDeleteDomain}
        />
      )}

      {/* ================================================================= */}
      {/* SUBTAB 5: INDICAÇÕES & AFILIADOS (SEM COMISSÃO POR HORA)          */}
      {/* ================================================================= */}
      {subTab === 'referrals' && (
        <AdminReferralsTab
          totalReferrals={referralStats?.totalReferrals}
          totalCodes={referralStats?.totalCodes}
          refreshVersion={refreshVersion}
          copiedCode={copiedCode}
          handleCopyRef={handleCopyRef}
          handleSetReferralStatus={handleSetReferralStatus}
        />
      )}
    </div>
  );
};
