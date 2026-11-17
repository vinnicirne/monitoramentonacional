import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Share2,
  Globe,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Clock,
  Plus,
  Trash2,
  Search,
  Layers,
  Copy,
  Check,
  Crown,
  Activity,
  Building2,
  KeyRound,
  BadgeCheck,
  Pencil
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import {
  AccessLog,
  CompanyRole,
  CorporateCompany,
  FreeDomain,
  OperationType,
  PlanBillingModel,
  PlanConfig,
  ReferralCode,
  ReferralRecord,
  UserProfile,
  UserStatus
} from '../types/admin';
import { emailToLicenseId, generateCorporateLicenseKey, useAuth } from '../contexts/AuthContext';

type AdminSubTab = 'overview' | 'users' | 'companies' | 'plans' | 'domains' | 'referrals';

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

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [companies, setCompanies] = useState<CorporateCompany[]>([]);
  const [domains, setDomains] = useState<FreeDomain[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  // Filters & Forms
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserStatus>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Add Free Domain Form
  const [newDomain, setNewDomain] = useState('');
  const [newDomainLabel, setNewDomainLabel] = useState('');
  const [newDomainAutoRef, setNewDomainAutoRef] = useState(true);

  // Add / Edit Corporate Company Form
  const [editingCompanyDomain, setEditingCompanyDomain] = useState<string | null>(null);
  const [compDomain, setCompDomain] = useState('');
  const [compName, setCompName] = useState('');
  const [compPlanId, setCompPlanId] = useState('corp_licenca');
  const [compPricePerLicense, setCompPricePerLicense] = useState('49');
  const [compLicensedSeats, setCompLicensedSeats] = useState('10');
  const [compAutoApprove, setCompAutoApprove] = useState(true);

  // Add / Save Plan Form
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planBillingModel, setPlanBillingModel] = useState<PlanBillingModel>('per_user');
  const [planPrice, setPlanPrice] = useState('49');
  const [planQueries, setPlanQueries] = useState('999999');
  const [planFeaturesText, setPlanFeaturesText] = useState(
    'Licença individual @empresa.com, Acesso completo RJ/MG/ES, Auditoria & Dossiê PDF'
  );

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        collection(db, 'users'),
        snap => {
          setUsers(snap.docs.map(d => d.data() as UserProfile));
        },
        err => handleFirestoreError(err, OperationType.LIST, 'users')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'plans'),
        snap => {
          setPlans(snap.docs.map(d => d.data() as PlanConfig));
        },
        err => handleFirestoreError(err, OperationType.LIST, 'plans')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'corporate_companies'),
        snap => {
          setCompanies(snap.docs.map(d => d.data() as CorporateCompany));
        },
        err => handleFirestoreError(err, OperationType.LIST, 'corporate_companies')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'free_domains'),
        snap => {
          setDomains(snap.docs.map(d => d.data() as FreeDomain));
        },
        err => handleFirestoreError(err, OperationType.LIST, 'free_domains')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'referrals'),
        snap => {
          setReferrals(snap.docs.map(d => d.data() as ReferralRecord));
        },
        err => handleFirestoreError(err, OperationType.LIST, 'referrals')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'referral_codes'),
        snap => {
          setReferralCodes(snap.docs.map(d => d.data() as ReferralCode));
        },
        err => handleFirestoreError(err, OperationType.LIST, 'referral_codes')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'access_logs'), orderBy('createdAt', 'desc'), limit(120)),
        snap => {
          setAccessLogs(snap.docs.map(d => d.data() as AccessLog));
        },
        err => handleFirestoreError(err, OperationType.LIST, 'access_logs')
      )
    );

    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const approvedUsers = users.filter(u => u.status === 'approved').length;
    const pendingUsers = users.filter(u => u.status === 'pending').length;
    const blockedUsers = users.filter(u => u.status === 'blocked').length;
    const activeLicensedUsers = users.filter(u => u.licenseStatus === 'active').length;

    const totalReferrals = referrals.length;
    const directMeliReferrals = referrals.filter(r => r.autoApproved).length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

    const activeDomains = domains.filter(d => d.active).length;
    const activeCompanies = companies.filter(c => c.active).length;
    const uniqueUserDomains = new Set(users.map(u => u.domain)).size;

    const monthlyCorporateRevenue = companies
      .filter(c => c.active)
      .reduce((sum, comp) => {
        const compLicensedCount = users.filter(
          u =>
            u.licenseStatus === 'active' &&
            (u.companyDomain || u.domain).toLowerCase() === comp.domain.toLowerCase()
        ).length;
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
      pendingReferrals,
      activeDomains,
      activeCompanies,
      monthlyCorporateRevenue,
      uniqueUserDomains,
      totalAccesses,
      topLocations
    };
  }, [users, referrals, domains, companies, accessLogs]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users
      .filter(u => {
        if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;
        if (!q) return true;
        return (
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.domain.toLowerCase().includes(q) ||
          u.referralCode.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return (b.accessCount || 0) - (a.accessCount || 0);
      });
  }, [users, userSearch, userStatusFilter]);

  const handleSetUserStatus = async (user: UserProfile, status: UserStatus) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status,
        autoApprovedBy: status === 'approved' ? 'manual_admin' : user.autoApprovedBy,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSetUserPlan = async (user: UserProfile, planId: string) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        planId,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleToggleUserAdmin = async (user: UserProfile) => {
    if (user.uid === currentAdmin?.uid) return;
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: nextRole,
        updatedAt: serverTimestamp()
      });
      if (nextRole === 'admin') {
        await setDoc(doc(db, 'admins', user.uid), {
          uid: user.uid,
          email: user.email,
          createdAt: serverTimestamp()
        });
      } else {
        await deleteDoc(doc(db, 'admins', user.uid));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddFreeDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = newDomain
      .trim()
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/[^a-z0-9.-]/g, '');
    if (!cleanDomain || cleanDomain.length < 3 || !cleanDomain.includes('.')) return;
    try {
      await setDoc(doc(db, 'free_domains', cleanDomain), {
        domain: cleanDomain,
        label: (newDomainLabel.trim() || `Domínio @${cleanDomain}`).slice(0, 100),
        active: true,
        autoApproveReferrals: newDomainAutoRef,
        defaultPlanId: plans[0]?.id || 'free_corp',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewDomain('');
      setNewDomainLabel('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `free_domains/${cleanDomain}`);
    }
  };

  const handleToggleDomain = async (dom: FreeDomain, field: 'active' | 'autoApproveReferrals') => {
    try {
      await updateDoc(doc(db, 'free_domains', dom.domain), {
        [field]: !dom[field],
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `free_domains/${dom.domain}`);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      await deleteDoc(doc(db, 'free_domains', domainId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `free_domains/${domainId}`);
    }
  };

  const handleAssignUserLicense = async (
    user: UserProfile,
    targetDomain?: string,
    targetPlanId?: string
  ) => {
    const compDom = (targetDomain || user.companyDomain || user.domain || '').toLowerCase();
    const matchedComp = companies.find(c => c.domain.toLowerCase() === compDom);
    const planToApply = targetPlanId || matchedComp?.planId || 'corp_licenca';
    const nextKey =
      user.licenseKey && user.licenseKey.length >= 4
        ? user.licenseKey
        : generateCorporateLicenseKey(compDom, user.uid);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: 'approved',
        autoApprovedBy: 'corporate_license',
        planId: planToApply,
        companyDomain: compDom,
        licenseStatus: 'active',
        licenseKey: nextKey,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSuspendUserLicense = async (user: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        licenseStatus: 'suspended',
        status: user.role === 'admin' ? user.status : 'blocked',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleToggleCompanyAdminRole = async (user: UserProfile, comp: CorporateCompany) => {
    if (!currentAdmin || user.uid === currentAdmin.uid) return;
    const nextRole: CompanyRole =
      user.companyRole === 'company_admin' ? 'member' : 'company_admin';
    const licId = emailToLicenseId(user.email);
    const licRef = doc(db, 'corporate_companies', comp.domain, 'licenses', licId);
    const nextKey =
      user.licenseKey && user.licenseKey.length >= 4
        ? user.licenseKey
        : generateCorporateLicenseKey(comp.domain, user.uid);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        companyRole: nextRole,
        companyDomain: comp.domain,
        status: 'approved',
        licenseStatus: user.licenseStatus === 'suspended' ? 'suspended' : 'active',
        licenseKey: nextKey,
        updatedAt: serverTimestamp()
      });

      const licSnap = await getDoc(licRef);
      if (licSnap.exists()) {
        await updateDoc(licRef, {
          companyRole: nextRole,
          assignedUid: user.uid,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(licRef, {
          id: licId,
          email: user.email.toLowerCase(),
          displayName: user.displayName,
          companyDomain: comp.domain,
          planId: comp.planId || user.planId || 'corp_licenca',
          licenseKey: nextKey,
          status: user.licenseStatus === 'suspended' ? 'suspended' : 'active',
          companyRole: nextRole,
          assignedUid: user.uid,
          invitedByUid: currentAdmin.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const resetCompanyForm = () => {
    setEditingCompanyDomain(null);
    setCompDomain('');
    setCompName('');
    setCompPlanId('corp_licenca');
    const corpPlan = plans.find(p => p.id === 'corp_licenca' || p.billingModel === 'per_user');
    setCompPricePerLicense(String(corpPlan?.pricePerLicense ?? corpPlan?.priceMonthly ?? 49));
    setCompLicensedSeats('10');
    setCompAutoApprove(true);
  };

  const handleEditCompany = (comp: CorporateCompany) => {
    setEditingCompanyDomain(comp.domain);
    setCompDomain(comp.domain);
    setCompName(comp.companyName);
    setCompPlanId(comp.planId);
    setCompPricePerLicense(String(comp.pricePerLicense));
    setCompLicensedSeats(String(comp.licensedSeats));
    setCompAutoApprove(comp.autoApprove);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = (editingCompanyDomain || compDomain)
      .trim()
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/[^a-z0-9.-]/g, '');
    if (!cleanDomain || cleanDomain.length < 3 || !cleanDomain.includes('.')) return;

    const cleanName = (compName.trim() || `Empresa @${cleanDomain}`).slice(0, 120);
    const price = Math.max(0, Number(compPricePerLicense) || 0);
    const seats = Math.max(0, Math.floor(Number(compLicensedSeats) || 0));

    try {
      if (editingCompanyDomain) {
        await updateDoc(doc(db, 'corporate_companies', cleanDomain), {
          companyName: cleanName,
          planId: compPlanId || 'corp_licenca',
          pricePerLicense: price,
          licensedSeats: seats,
          autoApprove: compAutoApprove,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(doc(db, 'corporate_companies', cleanDomain), {
          domain: cleanDomain,
          companyName: cleanName,
          planId: compPlanId || 'corp_licenca',
          pricePerLicense: price,
          licensedSeats: seats,
          autoApprove: compAutoApprove,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      resetCompanyForm();
    } catch (err) {
      handleFirestoreError(
        err,
        editingCompanyDomain ? OperationType.UPDATE : OperationType.CREATE,
        `corporate_companies/${cleanDomain}`
      );
    }
  };

  const handleToggleCompany = async (
    comp: CorporateCompany,
    field: 'active' | 'autoApprove'
  ) => {
    try {
      await updateDoc(doc(db, 'corporate_companies', comp.domain), {
        [field]: !comp[field],
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `corporate_companies/${comp.domain}`);
    }
  };

  const handleDeleteCompany = async (domainId: string) => {
    try {
      await deleteDoc(doc(db, 'corporate_companies', domainId));
      if (editingCompanyDomain === domainId) resetCompanyForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `corporate_companies/${domainId}`);
    }
  };

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanDesc('');
    setPlanBillingModel('per_user');
    setPlanPrice('49');
    setPlanQueries('999999');
    setPlanFeaturesText(
      'Licença individual @empresa.com, Acesso completo RJ/MG/ES, Auditoria & Dossiê PDF'
    );
  };

  const handleEditPlan = (plan: PlanConfig) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDesc(plan.description);
    setPlanBillingModel(plan.billingModel || 'fixed');
    setPlanPrice(String(plan.pricePerLicense ?? plan.priceMonthly ?? 0));
    setPlanQueries(String(plan.maxQueriesPerMonth ?? 1000));
    setPlanFeaturesText((plan.features || []).join(', '));
  };

  const handleCreateOrUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = planName.trim().slice(0, 80);
    if (!cleanName) return;
    const planId =
      editingPlanId ||
      cleanName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48) ||
      `plan_${Date.now()}`;
    const features = planFeaturesText
      .split(',')
      .map(s => s.trim().slice(0, 100))
      .filter(Boolean)
      .slice(0, 10);
    const numericPrice = Math.max(0, Number(planPrice) || 0);

    try {
      if (editingPlanId) {
        await updateDoc(doc(db, 'plans', planId), {
          name: cleanName,
          description: (planDesc.trim() || 'Plano operacional personalizado').slice(0, 300),
          priceMonthly: numericPrice,
          billingModel: planBillingModel,
          pricePerLicense: numericPrice,
          maxQueriesPerMonth: Math.max(0, Number(planQueries) || 500),
          features,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(doc(db, 'plans', planId), {
          id: planId,
          name: cleanName,
          description: (planDesc.trim() || 'Plano operacional personalizado').slice(0, 300),
          priceMonthly: numericPrice,
          billingModel: planBillingModel,
          pricePerLicense: numericPrice,
          maxQueriesPerMonth: Math.max(0, Number(planQueries) || 500),
          features,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      resetPlanForm();
    } catch (err) {
      handleFirestoreError(
        err,
        editingPlanId ? OperationType.UPDATE : OperationType.CREATE,
        `plans/${planId}`
      );
    }
  };

  const handleTogglePlanActive = async (plan: PlanConfig) => {
    try {
      await updateDoc(doc(db, 'plans', plan.id), {
        active: !plan.active,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `plans/${plan.id}`);
    }
  };

  const handleSetReferralStatus = async (
    refRec: ReferralRecord,
    nextStatus: 'approved' | 'pending' | 'revoked'
  ) => {
    try {
      await updateDoc(doc(db, 'referrals', refRec.id), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      const targetUser = users.find(u => u.uid === refRec.referredUid);
      if (targetUser && targetUser.role !== 'admin') {
        await updateDoc(doc(db, 'users', targetUser.uid), {
          status: nextStatus === 'approved' ? 'approved' : nextStatus === 'revoked' ? 'blocked' : 'pending',
          autoApprovedBy: nextStatus === 'approved' ? 'manual_admin' : targetUser.autoApprovedBy,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `referrals/${refRec.id}`);
    }
  };

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

  const handleCopyRef = (code: string) => {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="flex-1 h-full bg-[#F5F5F5] overflow-y-auto p-3.5 md:p-6 space-y-5">
      {/* Header Banner */}
      <div className="p-4 md:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#FFE600] text-[#2D3277] border border-[#E6CF00] shadow-xs shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#2D3277]">
              Painel Administrativo — Usuários, Planos, Domínios & Indicações
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Gerencie liberações de acesso externo, domínios free (<code className="font-mono font-bold text-[#2D3277]">@mercadolivre.com</code>), planos, afiliados sem comissão e histórico de localizações acessadas.
            </p>
          </div>
        </div>

        {/* Subtabs + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            {(
              [
                { id: 'overview', label: 'Resumo & Acessos' },
                {
                  id: 'users',
                  label: stats.pendingUsers > 0 ? `Usuários (${stats.pendingUsers} pendentes)` : 'Usuários'
                },
                {
                  id: 'companies',
                  label:
                    stats.activeCompanies > 0
                      ? `Empresas & Licenças (${stats.activeCompanies})`
                      : 'Empresas & Licenças'
                },
                { id: 'plans', label: 'Planos' },
                { id: 'domains', label: 'Domínios Free' },
                { id: 'referrals', label: 'Indicações' }
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  subTab === tab.id
                    ? 'bg-[#FFE600] text-[#2D3277] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-[#2D3277] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {onOpenCompanyRegister && (
            <button
              type="button"
              onClick={onOpenCompanyRegister}
              className="px-3.5 py-2 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors border border-[#1E2258]"
            >
              <Building2 className="w-4 h-4 text-[#FFE600]" />
              <span>+ Criar Conta Corporativa</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 EXECUTIVE CARDS: USUÁRIOS, INDICAÇÕES, DOMÍNIOS, LOCALIZAÇÕES ACESSADAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Usuários */}
        <div
          onClick={() => setSubTab('users')}
          className="p-4 bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Usuários
            </span>
            <div className="p-2 rounded-lg bg-[#3483FA]/10 text-[#2968C8]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D3277] font-mono">
            {stats.totalUsers}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[#00A650]/10 text-[#008744] font-bold">
              {stats.approvedUsers} liberados
            </span>
            {stats.pendingUsers > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                {stats.pendingUsers} pendentes
              </span>
            )}
            {stats.blockedUsers > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                {stats.blockedUsers} bloqueados
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Indicações */}
        <div
          onClick={() => setSubTab('referrals')}
          className="p-4 bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Indicações (Afiliados)
            </span>
            <div className="p-2 rounded-lg bg-[#FFE600] text-[#2D3277]">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D3277] font-mono">
            {stats.totalReferrals}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-[#00A650]/10 text-[#008744] font-bold">
              {stats.directMeliReferrals} diretos MELI
            </span>
            <span className="text-slate-500 font-medium">Sem comissão</span>
          </div>
        </div>

        {/* Card 3: Empresas & Domínios */}
        <div
          onClick={() => setSubTab('companies')}
          className="p-4 bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Licenças Corporativas
            </span>
            <div className="p-2 rounded-lg bg-[#00A650]/10 text-[#008744]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D3277] font-mono">
            {stats.activeLicensedUsers}
            <span className="text-xs font-sans font-semibold text-slate-500 ml-1.5">
              licenças ativas
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            <strong className="text-[#008744]">
              R$ {stats.monthlyCorporateRevenue.toFixed(2).replace('.', ',')}
            </strong>
            /mês · {stats.activeCompanies} empresa(s) · {stats.activeDomains} domínio(s) free
          </div>
        </div>

        {/* Card 4: Localizações Acessadas */}
        <div
          onClick={() => setSubTab('overview')}
          className="p-4 bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Localizações Acessadas
            </span>
            <div className="p-2 rounded-lg bg-[#2D3277]/10 text-[#2D3277]">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#2D3277] font-mono">
            {stats.totalAccesses}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 truncate">
            {stats.topLocations[0]
              ? `Mais acessada: ${stats.topLocations[0][0]} (${stats.topLocations[0][1]}x)`
              : 'Nenhuma consulta registrada ainda'}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SUBTAB 1: VISÃO GERAL & LOCALIZAÇÕES ACESSADAS                    */}
      {/* ================================================================= */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Top Accessed Locations */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#3483FA]" />
                <span>DPs & Locais Mais Acessados</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Top 6</span>
            </div>

            {stats.topLocations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Clique em qualquer DP, comunidade ou endereço no mapa para registrar acessos aqui.
              </div>
            ) : (
              <div className="space-y-2">
                {stats.topLocations.map(([name, count], idx) => (
                  <div
                    key={name}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                          idx === 0
                            ? 'bg-[#FFE600] text-[#2D3277] border border-[#E6CF00]'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900 truncate">{name}</span>
                    </div>
                    <span className="font-mono font-bold text-[#2968C8] shrink-0">{count}x</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pending approvals quick alert */}
            {stats.pendingUsers > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{stats.pendingUsers} usuário(s) aguardando liberação</span>
                </div>
                <button
                  onClick={() => {
                    setUserStatusFilter('pending');
                    setSubTab('users');
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#2D3277] hover:bg-[#1E2258] text-white font-bold text-xs cursor-pointer"
                >
                  Revisar Pendentes Agora
                </button>
              </div>
            )}
          </div>

          {/* Recent Access Logs Table */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#008744]" />
                <span>Histórico Recente de Localizações Acessadas</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Últimos {accessLogs.length} registros
              </span>
            </div>
            <div className="overflow-x-auto max-h-[440px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-3">Usuário / Domínio</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Local / DP Acessada</th>
                    <th className="p-3">Município / UF</th>
                    <th className="p-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {accessLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        Nenhum acesso registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    accessLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{log.userName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{log.userEmail}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#3483FA]/10 text-[#2968C8] font-mono font-bold text-[10px]">
                            {log.targetType}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {log.targetName}
                          {log.cisp > 0 && (
                            <span className="ml-1.5 text-[10px] font-mono text-slate-500">
                              (CISP {log.cisp})
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {log.municipio ? `${log.municipio} · ` : ''}
                          <span className="font-mono font-bold text-[#2D3277]">{log.uf}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                          {formatTimestamp(log.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 2: GERENCIAMENTO DE USUÁRIOS                               */}
      {/* ================================================================= */}
      {subTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail, domínio ou código..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'pending', label: `Pendentes (${stats.pendingUsers})` },
                  { id: 'approved', label: 'Liberados' },
                  { id: 'blocked', label: 'Bloqueados' }
                ] as const
              ).map(f => (
                <button
                  key={f.id}
                  onClick={() => setUserStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    userStatusFilter === f.id
                      ? 'bg-[#2D3277] text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Usuário</th>
                  <th className="p-3">Domínio / Origem</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Plano</th>
                  <th className="p-3">Acessos</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{u.displayName}</span>
                        {u.role === 'admin' && (
                          <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] text-[9px] font-bold">
                            ADM
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{u.email}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Código: {u.referralCode}
                        {u.referredByCode ? ` · Indicado por ${u.referredByCode}` : ''}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="font-mono font-bold text-[#2D3277]">@{u.domain}</span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {u.autoApprovedBy === 'free_domain' && 'Domínio Free'}
                        {u.autoApprovedBy === 'corporate_license' && 'Licença Corporativa'}
                        {u.autoApprovedBy === 'meli_referral' && 'Indicação Direta MELI'}
                        {u.autoApprovedBy === 'admin_bootstrap' && 'Admin Principal'}
                        {u.autoApprovedBy === 'manual_admin' && 'Liberado pelo ADM'}
                        {u.autoApprovedBy === 'pending_approval' && 'Externo · Aguardando'}
                      </div>
                      {u.licenseStatus === 'active' && u.licenseKey && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#2D3277]/10 text-[#2D3277] font-mono font-bold text-[10px]">
                          <KeyRound className="w-2.5 h-2.5" />
                          <span>{u.licenseKey}</span>
                        </div>
                      )}
                      {u.licenseStatus === 'suspended' && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono font-bold text-[10px]">
                          Licença Suspensa
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      {u.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00A650]/15 text-[#008744] font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Liberado
                        </span>
                      )}
                      {u.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                      {u.status === 'blocked' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                          <Ban className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <select
                        value={u.planId}
                        onChange={e => handleSetUserPlan(u, e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#3483FA]"
                      >
                        {plans.length > 0 ? (
                          plans.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="free_corp">Free Corporativo</option>
                            <option value="corp_licenca">Corporativo Por Licença</option>
                            <option value="pro_mensal">Operacional Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </>
                        )}
                      </select>
                    </td>

                    <td className="p-3 font-mono font-bold text-slate-800">
                      {u.accessCount || 0}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {u.licenseStatus === 'active' ? (
                          <button
                            onClick={() => handleSuspendUserLicense(u)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-[11px] cursor-pointer"
                          >
                            Suspender Licença
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignUserLicense(u)}
                            className="px-2.5 py-1 rounded-lg bg-[#2D3277]/10 hover:bg-[#2D3277] hover:text-[#FFE600] text-[#2D3277] font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            Atribuir Licença
                          </button>
                        )}
                        {u.status !== 'approved' && (
                          <button
                            onClick={() => handleSetUserStatus(u, 'approved')}
                            className="px-2.5 py-1 rounded-lg bg-[#00A650] hover:bg-[#008744] text-white font-bold text-[11px] cursor-pointer"
                          >
                            Liberar
                          </button>
                        )}
                        {u.status !== 'blocked' && u.uid !== currentAdmin?.uid && (
                          <button
                            onClick={() => handleSetUserStatus(u, 'blocked')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] cursor-pointer"
                          >
                            Bloquear
                          </button>
                        )}
                        {u.uid !== currentAdmin?.uid && (
                          <button
                            onClick={() => handleToggleUserAdmin(u)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#FFE600] text-[#2D3277] font-semibold text-[11px] cursor-pointer"
                          >
                            {u.role === 'admin' ? 'Remover ADM' : 'Tornar ADM'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 2.5: EMPRESAS & LICENÇAS POR USUÁRIO (@empresa.com)        */}
      {/* ================================================================= */}
      {subTab === 'companies' && (
        <div className="space-y-5">
          {/* Corporate Billing Summary Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Empresas Ativas</div>
              <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">
                {stats.activeCompanies}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Domínios corporativos contratantes
              </div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase">
                Licenças Atribuídas a Usuários
              </div>
              <div className="text-2xl font-extrabold text-[#3483FA] font-mono mt-1">
                {stats.activeLicensedUsers}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Cada usuário recebe licença nominal @empresa.com
              </div>
            </div>
            <div className="p-4 bg-[#2D3277] text-white rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-[#FFE600] uppercase">
                Faturamento Mensal por Licenças
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1">
                R$ {stats.monthlyCorporateRevenue.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-[11px] text-white/80 mt-0.5">
                Soma de usuários com licença ativa × valor unitário
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Form: Register/Edit Corporate Company */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#3483FA]" />
                  <span>
                    {editingCompanyDomain ? `Editar @${editingCompanyDomain}` : 'Cadastrar Empresa (@empresa.com)'}
                  </span>
                </h3>
                {editingCompanyDomain && (
                  <button
                    type="button"
                    onClick={resetCompanyForm}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cada usuário autenticado com <code>@empresa.com</code> recebe uma licença nominal vinculada à sua empresa e contabilizada no plano por usuário.
              </p>

              <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Domínio da Empresa (ex: empresa.com)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingCompanyDomain)}
                    value={compDomain}
                    onChange={e => setCompDomain(e.target.value)}
                    placeholder="empresa.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono text-slate-900 disabled:opacity-60 focus:outline-none focus:border-[#3483FA]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Razão / Nome da Empresa</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={e => setCompName(e.target.value)}
                    placeholder="Empresa Logística S.A."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plano Vinculado</label>
                  <select
                    value={compPlanId}
                    onChange={e => {
                      const nextId = e.target.value;
                      setCompPlanId(nextId);
                      const chosen = plans.find(p => p.id === nextId);
                      if (chosen && !editingCompanyDomain) {
                        setCompPricePerLicense(String(chosen.pricePerLicense ?? chosen.priceMonthly ?? 49));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  >
                    {plans.length > 0 ? (
                      plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (R$ {p.pricePerLicense ?? p.priceMonthly}
                          {p.billingModel === 'per_user' ? '/usuário' : '/mês'})
                        </option>
                      ))
                    ) : (
                      <option value="corp_licenca">Corporativo Por Licença</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      R$ / Licença (Usuário)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={compPricePerLicense}
                      onChange={e => setCompPricePerLicense(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Assentos Contratados
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={compLicensedSeats}
                      onChange={e => setCompLicensedSeats(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compAutoApprove}
                    onChange={e => setCompAutoApprove(e.target.checked)}
                    className="rounded border-slate-300 text-[#3483FA]"
                  />
                  <span className="text-[11px] font-semibold text-slate-800">
                    Gerar licença e liberar acesso direto para usuários verificados @{compDomain || 'empresa.com'}
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingCompanyDomain ? 'Atualizar Empresa' : 'Cadastrar Empresa & Licenças'}</span>
                </button>
              </form>
            </div>

            {/* Right List: Corporate Companies & Per-User Licenses */}
            <div className="lg:col-span-8 space-y-4">
              {companies.length === 0 ? (
                <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-extrabold text-[#2D3277]">
                    Nenhuma empresa corporativa cadastrada ainda
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Cadastre ao lado um domínio como <code className="font-mono font-bold">empresa.com</code> definindo o valor da licença por usuário. Quando colaboradores entrarem com <code className="font-mono">@empresa.com</code>, receberão sua licença individual automaticamente.
                  </p>
                </div>
              ) : (
                companies.map(comp => {
                  const companyUsers = users.filter(
                    u => (u.companyDomain || u.domain).toLowerCase() === comp.domain.toLowerCase()
                  );
                  const activeCompanyLicenses = companyUsers.filter(
                    u => u.licenseStatus === 'active'
                  );
                  const monthlyDue = activeCompanyLicenses.length * (comp.pricePerLicense || 0);
                  const contractedTotal =
                    comp.licensedSeats > 0 ? comp.licensedSeats * (comp.pricePerLicense || 0) : 0;
                  const seatsExceeded =
                    comp.licensedSeats > 0 && activeCompanyLicenses.length > comp.licensedSeats;

                  return (
                    <div
                      key={comp.domain}
                      className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${
                        comp.active ? 'border-slate-200' : 'border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-[#2D3277]">
                              {comp.companyName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#2D3277] text-[#FFE600] font-mono font-bold text-[11px]">
                              @{comp.domain}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                comp.active
                                  ? 'bg-[#00A650]/15 text-[#008744]'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {comp.active ? 'ATIVA' : 'PAUSADA'}
                            </span>
                            {comp.autoApprove && (
                              <span className="px-2 py-0.5 rounded bg-[#3483FA]/15 text-[#2968C8] text-[10px] font-bold">
                                Auto-Licença ON
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                            <span>
                              Plano: <strong className="font-mono text-slate-800">{comp.planId}</strong>
                            </span>
                            <span>
                              Licença: <strong className="text-[#008744]">R$ {(comp.pricePerLicense || 0).toFixed(2).replace('.', ',')}/usuário</strong>
                            </span>
                            <span>
                              Uso:{' '}
                              <strong className={seatsExceeded ? 'text-rose-700' : 'text-[#2D3277]'}>
                                {activeCompanyLicenses.length} / {comp.licensedSeats > 0 ? comp.licensedSeats : '∞'} assentos
                              </strong>
                            </span>
                            <span>
                              Fatura Mensal:{' '}
                              <strong className="text-[#2D3277] font-mono">
                                R$ {monthlyDue.toFixed(2).replace('.', ',')}
                              </strong>
                              {contractedTotal > 0 && (
                                <span className="text-slate-400 ml-1">
                                  (teto R$ {contractedTotal.toFixed(2).replace('.', ',')})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          {onOpenCompanyPanel && (
                            <button
                              onClick={() => onOpenCompanyPanel(comp.domain)}
                              className="px-2.5 py-1 rounded-lg bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Building2 className="w-3 h-3" />
                              <span>Abrir Painel Corporativo</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleEditCompany(comp)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleToggleCompany(comp, 'active')}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
                          >
                            {comp.active ? 'Pausar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleToggleCompany(comp, 'autoApprove')}
                            className="px-2.5 py-1 rounded-lg bg-[#FFE600] hover:bg-[#E6CF00] text-[#2D3277] text-xs font-bold cursor-pointer"
                          >
                            {comp.autoApprove ? 'Auto OFF' : 'Auto ON'}
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(comp.domain)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Remover Empresa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Users under this @empresa.com */}
                      <div className="p-3.5">
                        {companyUsers.length === 0 ? (
                          <div className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                            <div>
                              Nenhum usuário cadastrado com <code className="font-mono">@{comp.domain}</code> ainda.
                            </div>
                            {onOpenCompanyPanel && (
                              <button
                                type="button"
                                onClick={() => onOpenCompanyPanel(comp.domain)}
                                className="px-3 py-1.5 rounded-lg bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-[11px] cursor-pointer"
                              >
                                Adicionar Colaboradores & Ocorrências no Painel Corporativo
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {companyUsers.map(cu => (
                              <div
                                key={cu.uid}
                                className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900">{cu.displayName}</span>
                                    {cu.companyRole === 'company_admin' && (
                                      <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] font-bold text-[9px]">
                                        ADM EMPRESA
                                      </span>
                                    )}
                                    {cu.licenseStatus === 'active' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00A650]/15 text-[#008744] font-mono font-bold text-[10px]">
                                        <BadgeCheck className="w-3 h-3" />
                                        {cu.licenseKey || 'LIC-ATIVA'}
                                      </span>
                                    ) : cu.licenseStatus === 'suspended' ? (
                                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                                        Licença Suspensa
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                        Sem Licença Ativa
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-500">{cu.email}</div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                  <span className="text-[11px] font-mono text-slate-600 mr-1">
                                    {cu.licenseStatus === 'active'
                                      ? `R$ ${(comp.pricePerLicense || 0).toFixed(2).replace('.', ',')}/mês`
                                      : 'R$ 0,00'}
                                  </span>
                                  {cu.uid !== currentAdmin?.uid && (
                                    <button
                                      onClick={() => handleToggleCompanyAdminRole(cu, comp)}
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-[#FFE600] text-[#2D3277] font-semibold text-[11px] cursor-pointer"
                                    >
                                      {cu.companyRole === 'company_admin'
                                        ? 'Remover ADM Empresa'
                                        : 'Tornar ADM Empresa'}
                                    </button>
                                  )}
                                  {cu.licenseStatus === 'active' ? (
                                    <button
                                      onClick={() => handleSuspendUserLicense(cu)}
                                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] cursor-pointer"
                                    >
                                      Suspender Licença
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAssignUserLicense(cu, comp.domain, comp.planId)}
                                      className="px-2.5 py-1 rounded-lg bg-[#00A650] hover:bg-[#008744] text-white font-bold text-[11px] cursor-pointer"
                                    >
                                      Atribuir Licença
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 3: CONTROLE DE PLANOS                                      */}
      {/* ================================================================= */}
      {subTab === 'plans' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 h-fit">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3483FA]" />
                <span>{editingPlanId ? 'Editar Plano' : 'Criar / Atualizar Plano'}</span>
              </h3>
              {editingPlanId && (
                <button
                  type="button"
                  onClick={resetPlanForm}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
            <form onSubmit={handleCreateOrUpdatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Plano</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  placeholder="Ex: Corporativo Por Licença"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Modelo de Cobrança</label>
                <select
                  value={planBillingModel}
                  onChange={e => setPlanBillingModel(e.target.value as PlanBillingModel)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                >
                  <option value="per_user">Licença por Usuário (@empresa.com)</option>
                  <option value="fixed">Valor Fixo Mensal</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={planDesc}
                  onChange={e => setPlanDesc(e.target.value)}
                  placeholder="Escopo e público-alvo do plano"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {planBillingModel === 'per_user' ? 'R$ / licença / mês' : 'Valor R$/mês'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={planPrice}
                    onChange={e => setPlanPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consultas/mês</label>
                  <input
                    type="number"
                    min="0"
                    value={planQueries}
                    onChange={e => setPlanQueries(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Recursos (separados por vírgula)
                </label>
                <textarea
                  rows={2}
                  value={planFeaturesText}
                  onChange={e => setPlanFeaturesText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{editingPlanId ? 'Atualizar Plano' : 'Salvar Plano'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => {
              const userCount = users.filter(u => u.planId === plan.id).length;
              const isPerUser = plan.billingModel === 'per_user';
              const unitPrice = plan.pricePerLicense ?? plan.priceMonthly;
              return (
                <div
                  key={plan.id}
                  className={`p-5 bg-white border rounded-2xl shadow-sm flex flex-col justify-between gap-4 ${
                    plan.active ? 'border-slate-200' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-500">{plan.id}</span>
                          {isPerUser && (
                            <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] text-[9px] font-bold">
                              POR LICENÇA
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-extrabold text-[#2D3277]">{plan.name}</h4>
                      </div>
                      <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-[#FFE600] text-[#2D3277] shrink-0">
                        {unitPrice === 0
                          ? 'FREE'
                          : isPerUser
                          ? `R$ ${unitPrice}/usuário`
                          : `R$ ${unitPrice}/mês`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{plan.description}</p>
                    <div className="text-[11px] font-semibold text-[#2968C8]">
                      Limite: {plan.maxQueriesPerMonth >= 999999 ? 'Ilimitado' : `${plan.maxQueriesPerMonth} consultas/mês`} · {userCount} usuário(s)
                    </div>
                    <ul className="space-y-1 pt-1">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#008744] shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold ${
                        plan.active ? 'text-[#008744]' : 'text-slate-500'
                      }`}
                    >
                      {plan.active ? 'Plano Ativo' : 'Plano Inativo'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#2D3277] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleTogglePlanActive(plan)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        {plan.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 4: CONTROLE DE DOMÍNIOS LIBERADOS FREE                     */}
      {/* ================================================================= */}
      {subTab === 'domains' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#008744]" />
              <span>Liberar Novo Domínio Free</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Qualquer usuário que autenticar com um domínio ativo abaixo entra no sistema com acesso liberado automaticamente.
            </p>
            <form onSubmit={handleAddFreeDomain} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Domínio (ex: mercadolivre.com)
                </label>
                <input
                  type="text"
                  required
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  placeholder="mercadopago.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Identificação</label>
                <input
                  type="text"
                  value={newDomainLabel}
                  onChange={e => setNewDomainLabel(e.target.value)}
                  placeholder="Parceiro Logístico / Corporativo"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDomainAutoRef}
                  onChange={e => setNewDomainAutoRef(e.target.checked)}
                  className="rounded border-slate-300 text-[#3483FA]"
                />
                <span className="text-[11px] font-semibold text-slate-800">
                  Usuários indicados por este domínio acessam direto
                </span>
              </label>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#00A650] hover:bg-[#008744] text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Domínio Free</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#2D3277]">
                Domínios Corporativos Liberados
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {domains.length} domínio(s)
              </span>
            </div>
            <div className="divide-y divide-slate-200">
              {domains.map(dom => (
                <div
                  key={dom.domain}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-[#2D3277]">
                        @{dom.domain}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dom.active
                            ? 'bg-[#00A650]/15 text-[#008744]'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {dom.active ? 'FREE ATIVO' : 'DESATIVADO'}
                      </span>
                      {dom.autoApproveReferrals && (
                        <span className="px-2 py-0.5 rounded bg-[#FFE600] text-[#2D3277] text-[10px] font-bold">
                          Indicação Direta
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{dom.label}</div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleToggleDomain(dom, 'active')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      {dom.active ? 'Pausar Domínio' : 'Ativar Domínio'}
                    </button>
                    <button
                      onClick={() => handleToggleDomain(dom, 'autoApproveReferrals')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#FFE600] text-[#2D3277] text-xs font-semibold cursor-pointer"
                    >
                      {dom.autoApproveReferrals ? 'Desativar Indicação Direta' : 'Permitir Indicação Direta'}
                    </button>
                    {dom.domain !== 'mercadolivre.com' && (
                      <button
                        onClick={() => handleDeleteDomain(dom.domain)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Remover Domínio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUBTAB 5: INDICAÇÕES & AFILIADOS (SEM COMISSÃO POR HORA)          */}
      {/* ================================================================= */}
      {subTab === 'referrals' && (
        <div className="space-y-5">
          <div className="p-4 bg-[#FFE600]/30 border border-[#E6CF00] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#2D3277]">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Regra de Indicações: Indicados por <strong>@mercadolivre.com</strong> entram direto. Externos (<code>@gmail.com</code>, <code>@outlook.com</code>, etc.) passam por liberação.
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#2D3277] text-[#FFE600] font-bold text-[11px] shrink-0">
              Afiliados: Sem comissão por hora
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Affiliate Codes */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-extrabold text-sm text-[#2D3277]">
                Códigos de Afiliados / Indicadores ({referralCodes.length})
              </div>
              <div className="divide-y divide-slate-200 max-h-[420px] overflow-y-auto">
                {referralCodes.map(rc => (
                  <div key={rc.code} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-[#2D3277] text-[#FFE600]">
                          {rc.code}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">{rc.ownerName}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-1">
                        @{rc.ownerDomain} · {rc.totalReferrals} indicado(s)
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyRef(rc.code)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#3483FA] hover:text-white text-slate-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                    >
                      {copiedCode === rc.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === rc.code ? 'Copiado' : 'Link'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Referral Records */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-extrabold text-sm text-[#2D3277]">
                Histórico de Indicações ({referrals.length})
              </div>
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-3">Indicado</th>
                      <th className="p-3">Indicado por</th>
                      <th className="p-3">Regra</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Controle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {referrals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          Nenhuma indicação registrada ainda. Compartilhe um link <code>?ref=CODIGO</code>.
                        </td>
                      </tr>
                    ) : (
                      referrals.map(ref => (
                        <tr key={ref.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{ref.referredName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{ref.referredEmail}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{ref.referrerName}</div>
                            <div className="text-[10px] font-mono text-[#2968C8]">
                              {ref.code} (@{ref.referrerDomain})
                            </div>
                          </td>
                          <td className="p-3">
                            {ref.autoApproved ? (
                              <span className="px-2 py-0.5 rounded bg-[#00A650]/10 text-[#008744] font-bold text-[10px]">
                                Direto MELI
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                Externo
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ref.status === 'approved'
                                  ? 'bg-[#00A650]/15 text-[#008744]'
                                  : ref.status === 'revoked'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ref.status === 'approved'
                                ? 'Liberado'
                                : ref.status === 'revoked'
                                ? 'Revogado'
                                : 'Pendente'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1">
                            {ref.status !== 'approved' && (
                              <button
                                onClick={() => handleSetReferralStatus(ref, 'approved')}
                                className="px-2 py-1 rounded bg-[#00A650] text-white font-bold text-[10px] cursor-pointer"
                              >
                                Liberar
                              </button>
                            )}
                            {ref.status !== 'revoked' && (
                              <button
                                onClick={() => handleSetReferralStatus(ref, 'revoked')}
                                className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[10px] cursor-pointer"
                              >
                                Revogar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
