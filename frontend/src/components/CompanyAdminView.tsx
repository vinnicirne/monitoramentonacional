import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  UserPlus,
  KeyRound,
  BadgeCheck,
  Ban,
  Search,
  Copy,
  Check,
  Users,
  ShieldCheck,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  PackageX,
  FileText,
  MapPin,
  Pencil,
  ShieldAlert,
  Landmark,
  Plus,
  Briefcase,
  DollarSign,
  Sparkles,
  Save,
  Globe,
  History,
  Flame,
  Crown,
  BarChart3
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../firebase';
import {
  CompanyRole,
  CorporateCompany,
  CorporatePackageIncident,
  CorporateUserLicense,
  IncidentAccess,
  IncidentHistoryEntry,
  IncidentAuditLog,
  OperationType,
  PackageCustodyStatus,
  PackageIncidentType,
  PlanConfig,
  UserProfile
} from '../types/admin';
import { TerritorialRegistry } from '../types';
import { DELEGACIAS_MG_ES_DATA } from '../data/delegaciasMgEsData';
import { emailToLicenseId, generateCorporateLicenseKey, useAuth } from '../contexts/AuthContext';
import { recordIncidentAuditLog } from '../utils/incidentAuditLogger';
import { formatBrlAmount, formatBrlInput, parseBrlInput } from '../utils/currency';

type CompanyPanelSubTab = 'users' | 'incidents' | 'carriers' | 'audit' | 'company_info';
type IncidentFilterMode = 'all' | 'at_station' | 'roubos' | 'fraude' | 'extravio' | 'roubo_carga' | 'ameaca' | 'resolved';

interface CompanyAdminViewProps {
  registry?: TerritorialRegistry | null;
  overrideDomain?: string;
  onSelectOverrideDomain?: (domain: string) => void;
  onGoToAdminCompanies?: () => void;
  onOpenCompanyRegister?: () => void;
  onOpenIncidentModal?: (incident?: CorporatePackageIncident | null) => void;
  onViewIncidentDossier?: (incident: CorporatePackageIncident) => void;
  onLocateOnMap?: (lat: number, lng: number) => void;
}

interface UnifiedCompanyMember {
  key: string;
  email: string;
  displayName: string;
  license?: CorporateUserLicense;
  user?: UserProfile;
  licenseKey: string;
  licenseStatus: 'active' | 'suspended' | 'none';
  companyRole: CompanyRole;
  incidentAccess: IncidentAccess;
  accessCount: number;
  isConnected: boolean;
}

interface DelegaciaOption {
  id: string;
  uf: 'RJ' | 'MG' | 'ES';
  name: string;
  municipio: string;
  label: string;
}

const INCIDENT_TYPE_LABELS: Record<PackageIncidentType, { label: string; badgeClass: string }> = {
  ameaca: { label: 'Ameaça', badgeClass: 'bg-orange-100 text-orange-900 border-orange-300' },
  extravio: { label: 'Extravio', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  fraude: { label: 'Fraude', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
  roubo_carga: { label: 'Roubo de Carga', badgeClass: 'bg-red-100 text-red-900 border-red-300 font-bold' },
  roubo: { label: 'Roubo / Assalto', badgeClass: 'bg-red-200 text-red-950 border-red-400 font-extrabold' },
  furto: { label: 'Furto', badgeClass: 'bg-orange-100 text-orange-900 border-orange-300' },
  apreensao: { label: 'Apreensão Policial', badgeClass: 'bg-[#2D3277]/10 text-[#2D3277] border-[#2D3277]/20' },
  outros: { label: 'Outros', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' }
};

const CUSTODY_STATUS_LABELS: Record<PackageCustodyStatus, { label: string; shortLabel: string; badgeClass: string }> = {
  em_ocorrencia_delegacia: {
    label: 'Na delegacia — em ocorrência policial',
    shortLabel: 'Em Ocorrência na DP',
    badgeClass: 'bg-rose-100 text-rose-800'
  },
  aguardando_pericia: {
    label: 'Na delegacia — aguardando perícia',
    shortLabel: 'Aguardando Perícia',
    badgeClass: 'bg-amber-100 text-amber-800'
  },
  liberado_retirada: {
    label: 'Liberado pela delegacia para retirada',
    shortLabel: 'Liberado p/ Retirada',
    badgeClass: 'bg-[#3483FA]/15 text-[#2968C8]'
  },
  devolvido_empresa: {
    label: 'Devolvido / recuperado pela empresa',
    shortLabel: 'Devolvido à Empresa',
    badgeClass: 'bg-[#00A650]/15 text-[#008744]'
  },
  extraviado_nao_localizado: {
    label: 'Extraviado / não localizado',
    shortLabel: 'Não Localizado',
    badgeClass: 'bg-slate-200 text-slate-700'
  }
};

export const CompanyAdminView: React.FC<CompanyAdminViewProps> = ({
  registry,
  overrideDomain,
  onSelectOverrideDomain,
  onGoToAdminCompanies,
  onOpenCompanyRegister,
  onOpenIncidentModal,
  onViewIncidentDossier,
  onLocateOnMap
}) => {
  const { userProfile: currentAdmin, firebaseUser, isAdmin, isCompanyAdmin } = useAuth();
  const [subTab, setSubTab] = useState<CompanyPanelSubTab>('users');

  // Available companies (for System Admin switcher)
  const [allCompanies, setAllCompanies] = useState<CorporateCompany[]>([]);
  const ownCompanyDomain = (currentAdmin?.companyDomain || currentAdmin?.domain || '').toLowerCase();

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(
      collection(db, 'corporate_companies'),
      snap => {
        setAllCompanies(snap.docs.map(d => d.data() as CorporateCompany));
      },
      err => handleFirestoreError(err, OperationType.LIST, 'corporate_companies')
    );
    return () => unsub();
  }, [isAdmin]);

  const activeDomain = useMemo(() => {
    if (isAdmin) {
      if (overrideDomain && allCompanies.some(c => c.domain === overrideDomain)) {
        return overrideDomain;
      }
      if (overrideDomain) return overrideDomain;
      if (allCompanies.length > 0) {
        const activeFirst = allCompanies.find(c => c.active) || allCompanies[0];
        return activeFirst.domain;
      }
      return '';
    }
    return ownCompanyDomain;
  }, [isAdmin, overrideDomain, allCompanies, ownCompanyDomain]);

  useEffect(() => {
    if (activeDomain && activeDomain !== overrideDomain && onSelectOverrideDomain) {
      onSelectOverrideDomain(activeDomain);
    }
  }, [activeDomain, overrideDomain, onSelectOverrideDomain]);

  const [company, setCompany] = useState<CorporateCompany | null>(null);
  const [licenses, setLicenses] = useState<CorporateUserLicense[]>([]);
  const [companyUsers, setCompanyUsers] = useState<UserProfile[]>([]);
  const [incidents, setIncidents] = useState<CorporatePackageIncident[]>([]);
  const [incidentAuditLogs, setIncidentAuditLogs] = useState<IncidentAuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  // User/License Form state
  const [empName, setEmpName] = useState('');
  const [empEmailUser, setEmpEmailUser] = useState('');
  const [empRole, setEmpRole] = useState<CompanyRole>('member');
  const [empIncidentAccess, setEmpIncidentAccess] = useState<IncidentAccess>('read');
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Incident Form state
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('1');
  const [packagesDelivered, setPackagesDelivered] = useState('0');
  const [packagesRecovered, setPackagesRecovered] = useState('0');
  const [packagesStolen, setPackagesStolen] = useState('0');
  const [incidentType, setIncidentType] = useState<PackageIncidentType>('extravio');
  const [boNumber, setBoNumber] = useState('');
  const [delegaciaUfFilter, setDelegaciaUfFilter] = useState<'TODAS' | 'RJ' | 'MG' | 'ES'>('TODAS');
  const [delegaciaSearch, setDelegaciaSearch] = useState('');
  const [selectedDelegaciaId, setSelectedDelegaciaId] = useState('');
  const [packageAtStation, setPackageAtStation] = useState(true);
  const [custodyStatus, setCustodyStatus] = useState<PackageCustodyStatus>('em_ocorrencia_delegacia');
  const [estimatedUnitValue, setEstimatedUnitValue] = useState('');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [incidentSearch, setIncidentSearch] = useState('');
  const [incidentFilter, setIncidentFilter] = useState<IncidentFilterMode>('all');
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [incidentSuccess, setIncidentSuccess] = useState<string | null>(null);
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const canDeleteIncidents = Boolean(
    isAdmin ||
    isCompanyAdmin ||
    currentAdmin?.incidentAccess === 'edit' ||
    licenses.some(license =>
      license.status === 'active' &&
      license.incidentAccess === 'edit' &&
      license.email.toLowerCase() === currentAdmin?.email?.toLowerCase()
    )
  );

  // Company Registration & Management States (Sub-tab: 'company_info')
  const [availablePlans, setAvailablePlans] = useState<PlanConfig[]>([]);
  const [newCompDomain, setNewCompDomain] = useState('');
  const [newCompName, setNewCompName] = useState('');
  const [newCompPlanId, setNewCompPlanId] = useState('corp_licenca');
  const [newCompPrice, setNewCompPrice] = useState('49.00');
  const [newCompSeats, setNewCompSeats] = useState('10');
  const [newCompAutoApprove, setNewCompAutoApprove] = useState(true);
  const [isSavingNewComp, setIsSavingNewComp] = useState(false);
  const [newCompSuccess, setNewCompSuccess] = useState<string | null>(null);
  const [newCompError, setNewCompError] = useState<string | null>(null);

  // Edit Active Company States
  const [editCompName, setEditCompName] = useState('');
  const [editCompPlanId, setEditCompPlanId] = useState('corp_licenca');
  const [editCompPrice, setEditCompPrice] = useState('49.00');
  const [editCompSeats, setEditCompSeats] = useState('10');
  const [editCompAutoApprove, setEditCompAutoApprove] = useState(true);
  const [editCompActive, setEditCompActive] = useState(true);
  const [isSavingEditComp, setIsSavingEditComp] = useState(false);
  const [editCompSuccess, setEditCompSuccess] = useState<string | null>(null);
  const [editCompError, setEditCompError] = useState<string | null>(null);

  // Sync edit form with active company
  useEffect(() => {
    if (company) {
      setEditCompName(company.companyName || '');
      setEditCompPlanId(company.planId || 'corp_licenca');
      setEditCompPrice(String(company.pricePerLicense ?? 49));
      setEditCompSeats(String(company.licensedSeats ?? 10));
      setEditCompAutoApprove(company.autoApprove ?? true);
      setEditCompActive(company.active ?? true);
    }
  }, [company]);

  // Load available plans from Firestore
  useEffect(() => {
    getDocs(collection(db, 'plans'))
      .then(snap => {
        const list = snap.docs.map(d => d.data() as PlanConfig).filter(p => p.active);
        if (list.length > 0) {
          setAvailablePlans(list);
          const defaultPlan = list.find(p => p.billingModel === 'per_user') || list[0];
          setNewCompPlanId(defaultPlan.id);
          setNewCompPrice(String(defaultPlan.pricePerLicense ?? defaultPlan.priceMonthly ?? 49));
        }
      })
      .catch(err => {
        console.warn('Could not load plans for company management:', err);
      });
  }, []);

  useEffect(() => {
    if (!activeDomain) {
      setCompany(null);
      setLicenses([]);
      setCompanyUsers([]);
      setIncidents([]);
      setIncidentAuditLogs([]);
      return;
    }

    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'corporate_companies', activeDomain),
        snap => {
          setCompany(snap.exists() ? (snap.data() as CorporateCompany) : null);
        },
        err => handleFirestoreError(err, OperationType.GET, `corporate_companies/${activeDomain}`)
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'corporate_companies', activeDomain, 'licenses'),
        snap => {
          setLicenses(snap.docs.map(d => d.data() as CorporateUserLicense));
        },
        err =>
          handleFirestoreError(
            err,
            OperationType.LIST,
            `corporate_companies/${activeDomain}/licenses`
          )
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'users'), where('companyDomain', '==', activeDomain)),
        snap => {
          setCompanyUsers(snap.docs.map(d => d.data() as UserProfile));
        },
        err => handleFirestoreError(err, OperationType.LIST, 'users')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'corporate_companies', activeDomain, 'incidents'),
        snap => {
          const remoteList = snap.docs.map(d => ({
            ...d.data(),
            id: d.id
          } as CorporatePackageIncident));

          remoteList.sort((a, b) => {
            const tA = (a.createdAt as any)?.toMillis
              ? (a.createdAt as any).toMillis()
              : a.createdAt
              ? new Date(a.createdAt as any).getTime()
              : 0;
            const tB = (b.createdAt as any)?.toMillis
              ? (b.createdAt as any).toMillis()
              : b.createdAt
              ? new Date(b.createdAt as any).getTime()
              : 0;
            return tB - tA;
          });
          setIncidents(remoteList);
        },
        err => {
          console.error(`Falha ao carregar corporate_companies/${activeDomain}/incidents no Firebase:`, err);
          setIncidents([]);
        }
      )
    );

    const canReadAudit = isAdmin || (currentAdmin?.companyRole === 'company_admin' && ownCompanyDomain === activeDomain);
    if (canReadAudit) {
      unsubs.push(onSnapshot(
        query(collection(db, 'corporate_companies', activeDomain, 'incident_audit_logs'), orderBy('createdAt', 'desc')),
        snap => setIncidentAuditLogs(snap.docs.map(d => ({ ...d.data(), id: d.id } as IncidentAuditLog))),
        err => handleFirestoreError(err, OperationType.LIST, `corporate_companies/${activeDomain}/incident_audit_logs`)
      ));
    } else {
      setIncidentAuditLogs([]);
    }

    return () => {
      unsubs.forEach(u => u());
    };
  }, [activeDomain, isAdmin, currentAdmin?.companyRole, ownCompanyDomain]);

  // Unified Delegacias Catalog (RJ CISPs + MG/ES Delegacias)
  const allDelegacias = useMemo<DelegaciaOption[]>(() => {
    const list: DelegaciaOption[] = [];

    if (registry?.cisps) {
      Object.values(registry.cisps)
        .sort((a, b) => a.cisp - b.cisp)
        .forEach(c => {
          list.push({
            id: `RJ_CISP_${c.cisp}`,
            uf: 'RJ',
            name: c.nome_oficial,
            municipio: c.municipio,
            label: `[RJ] ${c.nome_oficial} — ${c.municipio}`
          });
        });
    }

    DELEGACIAS_MG_ES_DATA.slice()
      .sort((a, b) => a.uf.localeCompare(b.uf) || a.municipio.localeCompare(b.municipio) || a.nomeCurto.localeCompare(b.nomeCurto))
      .forEach(del => {
        list.push({
          id: del.id,
          uf: del.uf,
          name: `${del.nomeCurto} — ${del.nome}`,
          municipio: del.municipio,
          label: `[${del.uf}] ${del.nomeCurto} (${del.municipio}) — ${del.nome}`
        });
      });

    return list;
  }, [registry]);

  const filteredDelegacias = useMemo(() => {
    const q = delegaciaSearch.trim().toLowerCase();
    return allDelegacias.filter(d => {
      if (delegaciaUfFilter !== 'TODAS' && d.uf !== delegaciaUfFilter) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.municipio.toLowerCase().includes(q) ||
        d.uf.toLowerCase().includes(q)
      );
    });
  }, [allDelegacias, delegaciaUfFilter, delegaciaSearch]);

  useEffect(() => {
    if (!selectedDelegaciaId && filteredDelegacias.length > 0) {
      setSelectedDelegaciaId(filteredDelegacias[0].id);
    }
  }, [filteredDelegacias, selectedDelegaciaId]);

  // Unified Members List
  const members = useMemo<UnifiedCompanyMember[]>(() => {
    const map = new Map<string, UnifiedCompanyMember>();

    licenses.forEach(lic => {
      const emailLower = lic.email.toLowerCase();
      map.set(emailLower, {
        key: emailLower,
        email: lic.email,
        displayName: lic.displayName,
        license: lic,
        licenseKey: lic.licenseKey,
        licenseStatus: lic.status,
        companyRole: lic.companyRole || 'member',
        incidentAccess: lic.incidentAccess || 'read',
        accessCount: 0,
        isConnected: Boolean(lic.assignedUid)
      });
    });

    companyUsers.forEach(u => {
      const emailLower = u.email.toLowerCase();
      const existing = map.get(emailLower);
      if (existing) {
        map.set(emailLower, {
          ...existing,
          displayName: u.displayName || existing.displayName,
          user: u,
          licenseKey: existing.licenseKey || u.licenseKey || '',
          licenseStatus:
            existing.license?.status ||
            (u.licenseStatus === 'active'
              ? 'active'
              : u.licenseStatus === 'suspended'
              ? 'suspended'
              : 'none'),
          companyRole: u.companyRole || existing.companyRole || 'member',
          incidentAccess: u.incidentAccess || existing.incidentAccess || 'read',
          accessCount: u.accessCount || 0,
          isConnected: true
        });
      } else {
        map.set(emailLower, {
          key: emailLower,
          email: u.email,
          displayName: u.displayName,
          user: u,
          licenseKey: u.licenseKey || '',
          licenseStatus:
            u.licenseStatus === 'active'
              ? 'active'
              : u.licenseStatus === 'suspended'
              ? 'suspended'
              : 'none',
          companyRole: u.companyRole || 'member',
          incidentAccess: u.incidentAccess || 'read',
          accessCount: u.accessCount || 0,
          isConnected: true
        });
      }
    });

    const q = searchTerm.trim().toLowerCase();
    return Array.from(map.values())
      .filter(m => {
        if (!q) return true;
        return (
          m.displayName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.licenseKey.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.companyRole === 'company_admin' && b.companyRole !== 'company_admin') return -1;
        if (b.companyRole === 'company_admin' && a.companyRole !== 'company_admin') return 1;
        if (a.licenseStatus === 'active' && b.licenseStatus !== 'active') return -1;
        if (b.licenseStatus === 'active' && a.licenseStatus !== 'active') return 1;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [licenses, companyUsers, searchTerm]);

  const activeCount = useMemo(
    () => members.filter(m => m.licenseStatus === 'active').length,
    [members]
  );

  const seatLimit = company?.licensedSeats || 0;
  const pricePerLicense = company?.pricePerLicense || 0;
  const monthlyEstimate = activeCount * pricePerLicense;
  const seatsFull = seatLimit > 0 && activeCount >= seatLimit;

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    const q = incidentSearch.trim().toLowerCase();
    return incidents.filter(inc => {
      if (incidentFilter === 'at_station' && !inc.packageAtStation) return false;
      if (incidentFilter === 'roubos' && inc.incidentType !== 'roubo_carga' && inc.incidentType !== 'roubo' && inc.incidentType !== 'furto') return false;
      if (incidentFilter === 'fraude' && inc.incidentType !== 'fraude') return false;
      if (incidentFilter === 'extravio' && inc.incidentType !== 'extravio') return false;
      if (incidentFilter === 'roubo_carga' && inc.incidentType !== 'roubo_carga') return false;
      if (incidentFilter === 'ameaca' && inc.incidentType !== 'ameaca') return false;
      if (
        incidentFilter === 'resolved' &&
        inc.custodyStatus !== 'liberado_retirada' &&
        inc.custodyStatus !== 'devolvido_empresa'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        (inc.trackingCode || '').toLowerCase().includes(q) ||
        (inc.boNumber || '').toLowerCase().includes(q) ||
        (inc.delegaciaName || '').toLowerCase().includes(q) ||
        (inc.carrierName || '').toLowerCase().includes(q) ||
        (inc.delegaciaMunicipio || '').toLowerCase().includes(q) ||
        (inc.notes || '').toLowerCase().includes(q)
      );
    });
  }, [incidents, incidentSearch, incidentFilter]);

  const incidentStats = useMemo(() => {
    const total = incidents.length;
    const atStation = incidents.filter(i => i.packageAtStation).length;
    const totalRoubos = incidents.filter(
      i => i.incidentType === 'roubo_carga' || i.incidentType === 'roubo' || i.incidentType === 'furto'
    ).length;
    const resolved = incidents.filter(
      i => i.custodyStatus === 'liberado_retirada' || i.custodyStatus === 'devolvido_empresa'
    ).length;
    const totalValue = incidents.reduce((sum, i) => sum + (i.estimatedValue || 0), 0);
    const packageTotals = incidents.reduce((totals, incident) => {
      const quantity = Math.max(1, Math.floor(Number(incident.packageQuantity) || 1));
      totals.involved += quantity;
      totals.delivered += Number(incident.packagesDelivered) || 0;
      totals.recovered += incident.packagesRecovered ?? (incident.custodyStatus === 'devolvido_empresa' ? quantity : 0);
      totals.lost += incident.packagesStolen ?? (incident.custodyStatus !== 'devolvido_empresa' && (incident.custodyStatus === 'extraviado_nao_localizado' || ['roubo_carga', 'roubo', 'furto'].includes(incident.incidentType)) ? quantity : 0);
      return totals;
    }, { involved: 0, delivered: 0, recovered: 0, lost: 0 });
    return { total, atStation, totalRoubos, resolved, totalValue, ...packageTotals };
  }, [incidents]);

  const carrierAnalytics = useMemo(() => {
    const byCarrier = new Map<string, { carrier: string; occurrences: number; packages: number; delivered: number; recovered: number; lost: number; inProgress: number }>();
    incidents.forEach(incident => {
      const carrier = incident.carrierName?.trim() || 'Não informada';
      const current = byCarrier.get(carrier) || { carrier, occurrences: 0, packages: 0, delivered: 0, recovered: 0, lost: 0, inProgress: 0 };
      const quantity = Math.max(1, Math.floor(Number(incident.packageQuantity) || 1));
      current.occurrences += 1;
      current.packages += quantity;
      const delivered = Number(incident.packagesDelivered) || 0;
      const recovered = incident.packagesRecovered ?? (incident.custodyStatus === 'devolvido_empresa' ? quantity : 0);
      const lost = incident.packagesStolen ?? (incident.custodyStatus !== 'devolvido_empresa' && (incident.custodyStatus === 'extraviado_nao_localizado' || ['roubo_carga', 'roubo', 'furto'].includes(incident.incidentType)) ? quantity : 0);
      current.delivered += delivered;
      current.recovered += recovered;
      current.lost += lost;
      current.inProgress += Math.max(0, quantity - delivered - recovered - lost);
      byCarrier.set(carrier, current);
    });
    return Array.from(byCarrier.values()).sort((a, b) => b.occurrences - a.occurrences || b.packages - a.packages);
  }, [incidents]);

  const carrierMonthlyTrend = useMemo(() => {
    const topCarriers = carrierAnalytics.slice(0, 5).map(item => item.carrier);
    const byMonth = new Map<string, Record<string, string | number>>();
    incidents.forEach(incident => {
      const carrier = incident.carrierName?.trim() || 'Não informada';
      if (!topCarriers.includes(carrier)) return;
      const timestamp = incident.createdAt;
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp || '');
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const entry = byMonth.get(key) || { month: key, label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) };
      entry[carrier] = Number(entry[carrier] || 0) + 1;
      byMonth.set(key, entry);
    });
    return { carriers: topCarriers, months: Array.from(byMonth.values()).sort((a, b) => String(a.month).localeCompare(String(b.month))) };
  }, [incidents, carrierAnalytics]);

  const registeredCarriers = useMemo(
    () => Array.from(new Set(incidents.map(incident => incident.carrierName?.trim()).filter((value): value is string => Boolean(value)))),
    [incidents]
  );

  const handleAddAndLinkUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !activeDomain) return;
    setFormError(null);
    setFormSuccess(null);

    const cleanName = empName.trim().slice(0, 120);
    if (!cleanName) {
      setFormError('Informe o nome completo do colaborador.');
      return;
    }

    const rawInput = empEmailUser.trim().toLowerCase();
    const localPart = rawInput.includes('@') ? rawInput.split('@')[0] : rawInput;
    const cleanLocal = localPart.replace(/[^a-z0-9._+-]/g, '');
    if (!cleanLocal) {
      setFormError('Informe o prefixo do e-mail corporativo antes do @.');
      return;
    }

    if (rawInput.includes('@') && rawInput.split('@')[1] !== activeDomain) {
      setFormError(`Use um e-mail do domínio corporativo @${activeDomain}.`);
      return;
    }

    const fullEmail = `${cleanLocal}@${activeDomain}`;
    if (fullEmail.length > 120) {
      setFormError('O endereço de e-mail é muito longo (máx. 120 caracteres).');
      return;
    }

    const alreadyActive = members.find(
      m => m.email.toLowerCase() === fullEmail && m.licenseStatus === 'active'
    );
    if (seatsFull && !alreadyActive) {
      setFormError(
        `Limite de ${seatLimit} licença(s) contratada(s) atingido. Suspenda outra licença ou solicite ampliação ao administrador do sistema.`
      );
      return;
    }

    const licId = emailToLicenseId(fullEmail);
    const matchedUser = companyUsers.find(u => u.email.toLowerCase() === fullEmail);
    const existingLicense = licenses.find(l => l.id === licId);
    const licenseKey =
      existingLicense?.licenseKey ||
      matchedUser?.licenseKey ||
      generateCorporateLicenseKey(activeDomain, `${cleanLocal}${Date.now().toString(36).slice(-3)}`);
    const planId = company?.planId || 'corp_licenca';
    const incidentAccess: IncidentAccess = empRole === 'company_admin' ? 'edit' : empIncidentAccess;

    setIsSaving(true);
    try {
      if (existingLicense) {
        await updateDoc(doc(db, 'corporate_companies', activeDomain, 'licenses', licId), {
          displayName: cleanName,
          planId,
          licenseKey,
          status: 'active',
          companyRole: empRole,
          incidentAccess,
          assignedUid: matchedUser?.uid || existingLicense.assignedUid || '',
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(doc(db, 'corporate_companies', activeDomain, 'licenses', licId), {
          id: licId,
          email: fullEmail,
          displayName: cleanName,
          companyDomain: activeDomain,
          planId,
          licenseKey,
          status: 'active',
          companyRole: empRole,
          incidentAccess,
          assignedUid: matchedUser?.uid || '',
          invitedByUid: currentAdmin.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      if (matchedUser && matchedUser.uid !== currentAdmin.uid && matchedUser.role !== 'admin') {
        await updateDoc(doc(db, 'users', matchedUser.uid), {
          status: 'approved',
          autoApprovedBy: 'corporate_license',
          planId,
          companyDomain: activeDomain,
          licenseStatus: 'active',
          licenseKey,
          companyRole: empRole,
          incidentAccess,
          updatedAt: serverTimestamp()
        });
      }

      setEmpName('');
      setEmpEmailUser('');
      setEmpRole('member');
      setEmpIncidentAccess('read');
      setFormSuccess(
        `Usuário ${fullEmail} adicionado com a licença ${licenseKey}. ${
          matchedUser
            ? 'Acesso liberado imediatamente!'
            : 'Ao acessar o sistema com este e-mail, a licença será ativada automaticamente.'
        }`
      );
    } catch (err: any) {
      setFormError(err?.message || 'Não foi possível vincular a licença.');
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `corporate_companies/${activeDomain}/licenses/${licId}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMemberLicense = async (member: UnifiedCompanyMember) => {
    if (!currentAdmin || !activeDomain) return;
    if (member.user?.uid === currentAdmin.uid) return;
    setFormError(null);
    setFormSuccess(null);

    const nextActive = member.licenseStatus !== 'active';
    if (nextActive && seatsFull) {
      setFormError(
        `Limite de ${seatLimit} licença(s) contratada(s) atingido. Suspenda outra licença antes de reativar.`
      );
      return;
    }

    const licId = member.license?.id || emailToLicenseId(member.email);
    const planId = company?.planId || 'corp_licenca';
    const nextKey =
      member.licenseKey ||
      generateCorporateLicenseKey(activeDomain, member.user?.uid || member.email);

    try {
      if (member.license) {
        await updateDoc(doc(db, 'corporate_companies', activeDomain, 'licenses', licId), {
          status: nextActive ? 'active' : 'suspended',
          licenseKey: nextKey,
          assignedUid: member.user?.uid || member.license.assignedUid || '',
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(doc(db, 'corporate_companies', activeDomain, 'licenses', licId), {
          id: licId,
          email: member.email.toLowerCase(),
          displayName: member.displayName,
          companyDomain: activeDomain,
          planId,
          licenseKey: nextKey,
          status: nextActive ? 'active' : 'suspended',
          companyRole: member.companyRole || 'member',
          assignedUid: member.user?.uid || '',
          invitedByUid: currentAdmin.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      if (member.user && member.user.uid !== currentAdmin.uid && member.user.role !== 'admin') {
        await updateDoc(doc(db, 'users', member.user.uid), {
          status: nextActive ? 'approved' : 'blocked',
          autoApprovedBy: 'corporate_license',
          planId,
          companyDomain: activeDomain,
          licenseStatus: nextActive ? 'active' : 'suspended',
          licenseKey: nextKey,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `corporate_companies/${activeDomain}/licenses/${licId}`
      );
    }
  };

  const handleToggleCompanyRole = async (member: UnifiedCompanyMember) => {
    if (!currentAdmin || !activeDomain) return;
    if (member.user?.uid === currentAdmin.uid) return;

    const nextRole: CompanyRole =
      member.companyRole === 'company_admin' ? 'member' : 'company_admin';
    const licId = member.license?.id || emailToLicenseId(member.email);
    const planId = company?.planId || 'corp_licenca';
    const nextKey =
      member.licenseKey ||
      generateCorporateLicenseKey(activeDomain, member.user?.uid || member.email);

    try {
      const batch = writeBatch(db);
      if (member.license) {
        batch.update(doc(db, 'corporate_companies', activeDomain, 'licenses', licId), {
          companyRole: nextRole,
          updatedAt: serverTimestamp()
        });
      } else {
        batch.set(doc(db, 'corporate_companies', activeDomain, 'licenses', licId), {
          id: licId,
          email: member.email.toLowerCase(),
          displayName: member.displayName,
          companyDomain: activeDomain,
          planId,
          licenseKey: nextKey,
          status: member.licenseStatus === 'suspended' ? 'suspended' : 'active',
          companyRole: nextRole,
          assignedUid: member.user?.uid || '',
          invitedByUid: currentAdmin.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      if (member.user && member.user.uid !== currentAdmin.uid && member.user.role !== 'admin') {
        batch.update(doc(db, 'users', member.user.uid), {
          companyRole: nextRole,
          companyDomain: activeDomain,
          updatedAt: serverTimestamp()
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `corporate_companies/${activeDomain}/licenses/${licId}`
      );
    }
  };

  const handleIncidentAccessChange = async (member: UnifiedCompanyMember, incidentAccess: IncidentAccess) => {
    if (!activeDomain || member.user?.uid === currentAdmin?.uid || member.companyRole === 'company_admin') return;
    const licId = member.license?.id || emailToLicenseId(member.email);
    try {
      const batch = writeBatch(db);
      if (member.license) {
        batch.update(doc(db, 'corporate_companies', activeDomain, 'licenses', licId), {
          incidentAccess,
          updatedAt: serverTimestamp()
        });
      }
      if (member.user) {
        batch.update(doc(db, 'users', member.user.uid), {
          incidentAccess,
          updatedAt: serverTimestamp()
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        member.user ? `users/${member.user.uid}` : `corporate_companies/${activeDomain}/licenses/${licId}`
      );
    }
  };

  const handleRemoveLicense = async (member: UnifiedCompanyMember) => {
    if (!activeDomain || (!member.license && !member.user)) return;
    if (member.user?.uid === currentAdmin?.uid || member.user?.role === 'admin') return;
    const confirmed = window.confirm(
      `Remover ${member.displayName} (${member.email}) definitivamente desta empresa? A licença será excluída. A conta global do usuário permanecerá, mas perderá o acesso corporativo.`
    );
    if (!confirmed) return;

    try {
      const batch = writeBatch(db);
      if (member.license) {
        batch.delete(doc(db, 'corporate_companies', activeDomain, 'licenses', member.license.id));
      }
      if (member.user) {
        batch.update(doc(db, 'users', member.user.uid), {
          companyDomain: '',
          licenseStatus: 'suspended',
          companyRole: 'member',
          incidentAccess: 'read',
          licenseKey: '',
          updatedAt: serverTimestamp()
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        member.user
          ? `users/${member.user.uid}`
          : `corporate_companies/${activeDomain}/licenses/${member.license?.id}`
      );
    }
  };

  const resetIncidentForm = () => {
    setEditingIncidentId(null);
    setTrackingCode('');
    setCarrierName('');
    setPackageQuantity('1');
    setPackagesDelivered('0');
    setPackagesRecovered('0');
    setPackagesStolen('0');
    setIncidentType('extravio');
    setBoNumber('');
    setPackageAtStation(true);
    setCustodyStatus('em_ocorrencia_delegacia');
    setEstimatedUnitValue('');
    setIncidentNotes('');
    setIncidentError(null);
  };

  const handleEditIncident = (inc: CorporatePackageIncident) => {
    setEditingIncidentId(inc.id);
    setTrackingCode(inc.trackingCode);
    setCarrierName(inc.carrierName || '');
    setPackageQuantity(String(Math.max(1, Number(inc.packageQuantity) || 1)));
    setPackagesDelivered(String(Math.max(0, Number(inc.packagesDelivered) || 0)));
    setPackagesRecovered(String(Math.max(0, Number(inc.packagesRecovered) || 0)));
    setPackagesStolen(String(Math.max(0, Number(inc.packagesStolen) || 0)));
    setIncidentType(inc.incidentType);
    setBoNumber(inc.boNumber);
    if (inc.delegaciaUf === 'RJ' || inc.delegaciaUf === 'MG' || inc.delegaciaUf === 'ES') {
      setDelegaciaUfFilter(inc.delegaciaUf);
    } else {
      setDelegaciaUfFilter('TODAS');
    }
    setDelegaciaSearch('');
    setSelectedDelegaciaId(inc.delegaciaId);
    setPackageAtStation(inc.packageAtStation);
    setCustodyStatus(inc.custodyStatus);
    setEstimatedUnitValue(inc.estimatedValue > 0 ? formatBrlAmount(inc.estimatedValue) : inc.estimatedUnitValue != null ? formatBrlAmount(inc.estimatedUnitValue * Math.max(1, Number(inc.packageQuantity) || 1)) : '');
    setIncidentNotes(inc.notes);
    setIncidentError(null);
    setIncidentSuccess(null);
  };

  const handleSaveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !activeDomain) return;
    setIncidentError(null);
    setIncidentSuccess(null);

    const cleanCode = trackingCode.trim().slice(0, 80);
    if (!cleanCode) {
      setIncidentError('Informe o código do pacote / rastreio.');
      return;
    }

    const chosenDelegacia = allDelegacias.find(d => d.id === selectedDelegaciaId);
    if (!chosenDelegacia) {
      setIncidentError('Selecione a delegacia responsável pela ocorrência.');
      return;
    }

    const cleanBo = boNumber.trim().slice(0, 64);
    const cleanCarrier = carrierName.trim().slice(0, 120);
    const quantity = Math.min(100000, Math.max(1, Math.floor(Number(packageQuantity) || 1)));
    const deliveredCount = Math.min(quantity, Math.max(0, Math.floor(Number(packagesDelivered) || 0)));
    const recoveredCount = Math.min(quantity, Math.max(0, Math.floor(Number(packagesRecovered) || 0)));
    const stolenCount = Math.min(quantity, Math.max(0, Math.floor(Number(packagesStolen) || 0)));
    if (deliveredCount + recoveredCount + stolenCount > quantity) {
      setIncidentError('A soma de pacotes entregues, recuperados e roubados não pode ultrapassar a quantidade envolvida.');
      return;
    }
    const numValue = parseBrlInput(estimatedUnitValue);
    const cleanNotes = incidentNotes.trim().slice(0, 500);
    const incId =
      editingIncidentId ||
      `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    let autoLat: number | undefined;
    let autoLng: number | undefined;
    if (chosenDelegacia.id.startsWith('RJ_CISP_') && registry?.cisps) {
      const cispNum = parseInt(chosenDelegacia.id.replace('RJ_CISP_', ''), 10);
      const found = Object.values(registry.cisps).find(c => c.cisp === cispNum);
      if (found && found.centroide && found.centroide.length >= 2) {
        autoLng = found.centroide[0];
        autoLat = found.centroide[1];
      }
    } else {
      const found = DELEGACIAS_MG_ES_DATA.find(d => d.id === chosenDelegacia.id);
      if (found && found.latitude && found.longitude) {
        autoLat = found.latitude;
        autoLng = found.longitude;
      }
    }

    if (autoLat === undefined || autoLng === undefined) {
      if (chosenDelegacia.uf === 'RJ') {
        autoLat = -22.9068;
        autoLng = -43.1729;
      } else if (chosenDelegacia.uf === 'MG') {
        autoLat = -19.9167;
        autoLng = -43.9345;
      } else if (chosenDelegacia.uf === 'ES') {
        autoLat = -20.3155;
        autoLng = -40.3128;
      } else {
        autoLat = -22.9068;
        autoLng = -43.1729;
      }
    }

    const adminUid = firebaseUser?.uid || currentAdmin?.uid || auth.currentUser?.uid || 'user_unknown';
    const adminName = (firebaseUser?.displayName || currentAdmin?.displayName || firebaseUser?.email || currentAdmin?.email || 'Administrador').slice(0, 120);

    const safeDelMunicipio = (chosenDelegacia.municipio || '').slice(0, 100);
    const safeDelUf = (chosenDelegacia.uf || 'RJ').slice(0, 8);
    const safeDelName = (chosenDelegacia.name || 'Delegacia Policial').slice(0, 160);
    const safeDelId = (chosenDelegacia.id || 'RJ_CISP_0').slice(0, 64);

    const initialHistory: IncidentHistoryEntry[] = [
      {
        id: `hist_${Date.now()}`,
        date: new Date().toISOString(),
        title: `Registro de ${INCIDENT_TYPE_LABELS[incidentType]?.label || incidentType}`,
        authorName: adminName,
        authorUid: adminUid,
        status: custodyStatus,
        description: `Ocorrência de ${INCIDENT_TYPE_LABELS[incidentType]?.label || incidentType} registrada.`
      }
    ];

    const localIncidentRecord: CorporatePackageIncident = {
      id: incId,
      companyDomain: activeDomain,
      trackingCode: cleanCode,
      carrierName: cleanCarrier,
      packageQuantity: quantity,
      packagesDelivered: deliveredCount,
      packagesRecovered: recoveredCount,
      packagesStolen: stolenCount,
      incidentType,
      boNumber: cleanBo,
      delegaciaId: safeDelId,
      delegaciaName: safeDelName,
      delegaciaUf: safeDelUf,
      delegaciaMunicipio: safeDelMunicipio,
      lat: autoLat,
      lng: autoLng,
      packageAtStation,
      custodyStatus,
      estimatedValue: numValue,
      notes: cleanNotes,
      history: initialHistory,
      createdByUid: adminUid,
      createdByName: adminName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSavingIncident(true);
    try {
      if (editingIncidentId) {
        await updateDoc(doc(db, 'corporate_companies', activeDomain, 'incidents', incId), {
          trackingCode: cleanCode,
          carrierName: cleanCarrier,
          packageQuantity: quantity,
          packagesDelivered: deliveredCount,
          packagesRecovered: recoveredCount,
          packagesStolen: stolenCount,
          estimatedUnitValue: deleteField(),
          incidentType,
          boNumber: cleanBo,
          delegaciaId: safeDelId,
          delegaciaName: safeDelName,
          delegaciaUf: safeDelUf,
          delegaciaMunicipio: safeDelMunicipio,
          lat: autoLat,
          lng: autoLng,
          packageAtStation,
          custodyStatus,
          estimatedValue: numValue,
          notes: cleanNotes,
          updatedAt: serverTimestamp()
        });
        await recordIncidentAuditLog({ companyDomain: activeDomain, incidentId: incId, trackingCode: cleanCode, boNumber: cleanBo, delegaciaName: safeDelName, action: 'updated', previousStatus: incidents.find(item => item.id === incId)?.custodyStatus, newStatus: custodyStatus, previousAtStation: incidents.find(item => item.id === incId)?.packageAtStation, newAtStation: packageAtStation, actorUid: adminUid, actorName: adminName, actorEmail: firebaseUser?.email || currentAdmin?.email || '', summary: 'Dados da ocorrência atualizados.' });
        setIncidentSuccess(`Ocorrência do pacote ${cleanCode} atualizada com sucesso.`);
      } else {
        await setDoc(doc(db, 'corporate_companies', activeDomain, 'incidents', incId), {
          id: incId,
          companyDomain: activeDomain,
          trackingCode: cleanCode,
          carrierName: cleanCarrier,
          packageQuantity: quantity,
          packagesDelivered: deliveredCount,
          packagesRecovered: recoveredCount,
          packagesStolen: stolenCount,
          incidentType,
          boNumber: cleanBo,
          delegaciaId: safeDelId,
          delegaciaName: safeDelName,
          delegaciaUf: safeDelUf,
          delegaciaMunicipio: safeDelMunicipio,
          lat: autoLat,
          lng: autoLng,
          packageAtStation,
          custodyStatus,
          estimatedValue: numValue,
          notes: cleanNotes,
          history: initialHistory,
          createdByUid: adminUid,
          createdByName: adminName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        await recordIncidentAuditLog({ companyDomain: activeDomain, incidentId: incId, trackingCode: cleanCode, boNumber: cleanBo, delegaciaName: safeDelName, action: 'created', newStatus: custodyStatus, newAtStation: packageAtStation, actorUid: adminUid, actorName: adminName, actorEmail: firebaseUser?.email || currentAdmin?.email || '', summary: 'Ocorrência registrada.' });
        setIncidentSuccess(
          `Pacote ${cleanCode} registrado na ${safeDelName} (${
            packageAtStation ? 'em ocorrência na delegacia' : 'fora da delegacia'
          }).`
        );
      }
      try {
        const storageKey = `PMT_CORP_INCIDENTS_${activeDomain}`;
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        const localList: CorporatePackageIncident[] = Array.isArray(parsed) ? parsed : [];
        const existingIdx = localList.findIndex(item => item.id === incId);
        if (existingIdx >= 0) localList[existingIdx] = localIncidentRecord;
        else localList.unshift(localIncidentRecord);
        localStorage.setItem(storageKey, JSON.stringify(localList));
        window.dispatchEvent(new CustomEvent('pmt_incidents_updated', {
          detail: { domain: activeDomain, incident: localIncidentRecord }
        }));
      } catch (cacheError) {
        console.warn('Não foi possível atualizar o cache local da ocorrência:', cacheError);
      }
      resetIncidentForm();
    } catch (err: any) {
      console.error('Falha ao gravar ocorrência no Firebase:', err);
      const errorCode = typeof err?.code === 'string' ? ` (${err.code})` : '';
      setIncidentError(`Não foi possível gravar a ocorrência no Firebase${errorCode}. Verifique sua conexão e suas permissões; o registro não foi confirmado.`);
    } finally {
      setIsSavingIncident(false);
    }
  };

  const handleQuickCustodyChange = async (
    inc: CorporatePackageIncident,
    nextStatus: PackageCustodyStatus
  ) => {
    if (!activeDomain) return;
    const autoAtStation =
      nextStatus === 'em_ocorrencia_delegacia' ||
      nextStatus === 'aguardando_pericia' ||
      nextStatus === 'liberado_retirada';
    try {
      await updateDoc(doc(db, 'corporate_companies', activeDomain, 'incidents', inc.id), {
        custodyStatus: nextStatus,
        packageAtStation: autoAtStation,
        updatedAt: serverTimestamp()
      });
      await recordIncidentAuditLog({ companyDomain: activeDomain, incidentId: inc.id, trackingCode: inc.trackingCode, boNumber: inc.boNumber, delegaciaName: inc.delegaciaName, action: 'status_changed', previousStatus: inc.custodyStatus, newStatus: nextStatus, previousAtStation: inc.packageAtStation, newAtStation: autoAtStation, actorUid: currentAdmin?.uid, actorName: currentAdmin?.displayName, actorEmail: firebaseUser?.email || currentAdmin?.email, summary: `Status alterado para ${nextStatus}.` });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `corporate_companies/${activeDomain}/incidents/${inc.id}`
      );
    }
  };

  const handleTogglePackageAtStation = async (inc: CorporatePackageIncident) => {
    if (!activeDomain) return;
    try {
      await updateDoc(doc(db, 'corporate_companies', activeDomain, 'incidents', inc.id), {
        packageAtStation: !inc.packageAtStation,
        updatedAt: serverTimestamp()
      });
      await recordIncidentAuditLog({ companyDomain: activeDomain, incidentId: inc.id, trackingCode: inc.trackingCode, boNumber: inc.boNumber, delegaciaName: inc.delegaciaName, action: 'station_toggled', previousStatus: inc.custodyStatus, newStatus: inc.custodyStatus, previousAtStation: inc.packageAtStation, newAtStation: !inc.packageAtStation, actorUid: currentAdmin?.uid, actorName: currentAdmin?.displayName, actorEmail: firebaseUser?.email || currentAdmin?.email, summary: `Posse na delegacia ${!inc.packageAtStation ? 'confirmada' : 'removida'}.` });
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `corporate_companies/${activeDomain}/incidents/${inc.id}`
      );
    }
  };

  const handleDeleteIncident = async (incId: string) => {
    if (!activeDomain) return;
    if (!canDeleteIncidents) {
      setIncidentError('Seu usuário não tem permissão para excluir ocorrências.');
      return;
    }
    const incident = incidents.find(item => item.id === incId);
    if (!window.confirm(`Excluir definitivamente a ocorrência ${incident?.trackingCode || incId}?`)) return;
    try {
      await deleteDoc(doc(db, 'corporate_companies', activeDomain, 'incidents', incId));
      if (incident) await recordIncidentAuditLog({ companyDomain: activeDomain, incidentId: incId, trackingCode: incident.trackingCode, boNumber: incident.boNumber, delegaciaName: incident.delegaciaName, action: 'deleted', previousStatus: incident.custodyStatus, previousAtStation: incident.packageAtStation, actorUid: currentAdmin?.uid, actorName: currentAdmin?.displayName, actorEmail: firebaseUser?.email || currentAdmin?.email, summary: 'Ocorrência removida.' });
      setIncidentError(null);
      setIncidentSuccess('Ocorrência excluída com sucesso.');
      if (editingIncidentId === incId) resetIncidentForm();
    } catch (err) {
      const errorCode = typeof (err as any)?.code === 'string' ? ` (${(err as any).code})` : '';
      setIncidentError(`Não foi possível excluir a ocorrência${errorCode}. Verifique sua conexão e a permissão de edição da empresa.`);
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `corporate_companies/${activeDomain}/incidents/${incId}`
      );
    }
  };

  const handleCopyAccessLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'agora';
    try {
      const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return '—';
    }
  };

  const handleCreateNewCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewCompError(null);
    setNewCompSuccess(null);

    let cleanDomain = newCompDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/^@+/, '')
      .replace(/\/+$/, '')
      .split('/')[0];

    if (cleanDomain.includes('@')) {
      cleanDomain = cleanDomain.split('@')[1];
    }

    if (!cleanDomain || cleanDomain.length < 3 || !cleanDomain.includes('.')) {
      setNewCompError('Informe um domínio corporativo válido (ex: empresa.com ou transportadora.com.br).');
      return;
    }

    const domainRegex = /^[a-z0-9.-]+$/;
    if (!domainRegex.test(cleanDomain)) {
      setNewCompError('Domínio inválido. Use apenas letras minúsculas, números, ponto e hífen.');
      return;
    }

    const cleanName = newCompName.trim().slice(0, 120);
    if (!cleanName) {
      setNewCompError('Informe a Razão Social ou Nome Fantasia da empresa.');
      return;
    }

    const numPrice = Math.max(0, Number(newCompPrice.replace(',', '.')) || 0);
    const numSeats = Math.max(0, Math.floor(Number(newCompSeats) || 0));

    setIsSavingNewComp(true);
    try {
      await setDoc(doc(db, 'corporate_companies', cleanDomain), {
        domain: cleanDomain,
        companyName: cleanName,
        planId: newCompPlanId || 'corp_licenca',
        pricePerLicense: numPrice,
        licensedSeats: numSeats,
        autoApprove: newCompAutoApprove,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setNewCompSuccess(`Empresa "${cleanName}" (@${cleanDomain}) cadastrada e ativada com sucesso!`);
      setNewCompDomain('');
      setNewCompName('');
      setNewCompSeats('10');
      setNewCompPrice('49.00');

      if (onSelectOverrideDomain) {
        onSelectOverrideDomain(cleanDomain);
      }
      setSubTab('company_info');
    } catch (err: any) {
      setNewCompError(err?.message || 'Falha ao cadastrar a empresa corporativa.');
      handleFirestoreError(err, OperationType.CREATE, `corporate_companies/${cleanDomain}`);
    } finally {
      setIsSavingNewComp(false);
    }
  };

  const handleUpdateActiveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDomain || !company) return;
    setEditCompError(null);
    setEditCompSuccess(null);

    const cleanName = editCompName.trim().slice(0, 120);
    if (!cleanName) {
      setEditCompError('Informe a Razão Social ou Nome Fantasia da empresa.');
      return;
    }

    const numPrice = Math.max(0, Number(editCompPrice.replace(',', '.')) || 0);
    const numSeats = Math.max(0, Math.floor(Number(editCompSeats) || 0));

    setIsSavingEditComp(true);
    try {
      await updateDoc(doc(db, 'corporate_companies', activeDomain), {
        companyName: cleanName,
        planId: editCompPlanId || company.planId || 'corp_licenca',
        pricePerLicense: numPrice,
        licensedSeats: numSeats,
        autoApprove: editCompAutoApprove,
        active: editCompActive,
        updatedAt: serverTimestamp()
      });

      setEditCompSuccess(`Dados da empresa "${cleanName}" (@${activeDomain}) atualizados com sucesso!`);
    } catch (err: any) {
      setEditCompError(err?.message || 'Falha ao salvar as alterações da empresa.');
      handleFirestoreError(err, OperationType.UPDATE, `corporate_companies/${activeDomain}`);
    } finally {
      setIsSavingEditComp(false);
    }
  };

  // Empty state if no company is registered yet or active
  if ((isAdmin && allCompanies.length === 0 && !activeDomain) || (!activeDomain && !company)) {
    return (
      <div className="flex-1 h-full bg-[#F5F5F5] overflow-y-auto p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2D3277] text-[#FFE600] flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-extrabold text-[#2D3277]">
                Cadastrar Empresa no Painel Corporativo
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre sua empresa corporativa para habilitar o controle de usuários, licenças e ocorrências em delegacias.
              </p>
            </div>
          </div>

          {newCompError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{newCompError}</span>
            </div>
          )}

          {newCompSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{newCompSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateNewCompany} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Razão Social ou Nome Fantasia *
              </label>
              <input
                type="text"
                value={newCompName}
                onChange={e => setNewCompName(e.target.value)}
                placeholder="Ex: Mercado Livre Brasil Logística Ltda"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Domínio Corporativo *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-mono font-bold text-slate-400">@</span>
                <input
                  type="text"
                  value={newCompDomain}
                  onChange={e => setNewCompDomain(e.target.value)}
                  placeholder="empresa.com ou suaempresa.com.br"
                  required
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Colaboradores com e-mail deste domínio serão vinculados automaticamente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assentos / Licenças</label>
                <input
                  type="number"
                  min="1"
                  value={newCompSeats}
                  onChange={e => setNewCompSeats(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Preço / Licença (R$)</label>
                <input
                  type="text"
                  value={newCompPrice}
                  onChange={e => setNewCompPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={newCompAutoApprove}
                onChange={e => setNewCompAutoApprove(e.target.checked)}
                className="rounded border-slate-300 text-[#00A650] focus:ring-0"
              />
              <span className="text-slate-700 font-semibold">
                Aprovar automaticamente colaboradores com o domínio cadastrado
              </span>
            </label>

            <button
              type="submit"
              disabled={isSavingNewComp}
              className="w-full py-2.5 rounded-xl bg-[#00A650] hover:bg-[#008744] text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSavingNewComp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cadastrando Empresa...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Empresa e Ativar Painel</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-400">
            <span>Agência Ícone Digital by Vinicius Cirne</span>
            <span>Licença AID-VC-GIS-2026-BR-RJ</span>
          </div>
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
                Gerencie usuários e licenças da empresa, configure parâmetros cadastrais e controle ocorrências em delegacias.
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

          <button
            type="button"
            onClick={() => setSubTab('company_info')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'company_info'
                ? 'bg-[#2D3277] text-[#FFE600] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Cadastro & Gestão da Empresa</span>
          </button>
          {(isAdmin || currentAdmin?.companyRole === 'company_admin') && (
            <button
              type="button"
              onClick={() => setSubTab('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${subTab === 'audit' ? 'bg-[#2D3277] text-[#FFE600] shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <History className="w-4 h-4" />
              <span>Auditoria de Ocorrências ({incidentAuditLogs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUBTAB 1: USUÁRIOS & LICENÇAS                                       */}
      {/* =================================================================== */}
      {subTab === 'users' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Licenças Ativas
                </span>
                <KeyRound className="w-4 h-4 text-[#3483FA]" />
              </div>
              <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">
                {activeCount}
                <span className="text-sm font-semibold text-slate-400 ml-1">
                  / {seatLimit > 0 ? seatLimit : '∞'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {seatLimit > 0
                  ? seatsFull
                    ? 'Todos os assentos contratados estão em uso'
                    : `${seatLimit - activeCount} assento(s) disponível(is)`
                  : 'Assentos sob demanda'}
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Usuários Cadastrados
                </span>
                <Users className="w-4 h-4 text-[#008744]" />
              </div>
              <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">
                {members.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {members.filter(m => m.isConnected).length} já acessaram ·{' '}
                {members.filter(m => !m.isConnected).length} aguardando 1º login
              </div>
            </div>

            <div className="p-4 bg-[#2D3277] text-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#FFE600] uppercase">
                  Plano Corporativo
                </span>
                <ShieldCheck className="w-4 h-4 text-[#FFE600]" />
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1">
                R$ {monthlyEstimate.toFixed(2).replace('.', ',')}
                <span className="text-xs font-sans font-normal text-white/75 ml-1">/mês</span>
              </div>
              <div className="text-[11px] text-white/80 mt-1">
                R$ {pricePerLicense.toFixed(2).replace('.', ',')} por licença ativa
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Add Corporate User & Bind License */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5 h-fit">
              <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#3483FA]" />
                <span>Adicionar Usuário e Vincular Licença</span>
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Informe o nome e o e-mail corporativo do colaborador. A licença será gerada na hora e vinculada automaticamente ao acesso dele.
              </p>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-[#00A650]/10 border border-[#00A650]/30 text-[#008744] text-xs flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddAndLinkUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Usuário</label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={e => setEmpName(e.target.value)}
                    placeholder="Ex: Maria Oliveira"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-mail Corporativo
                  </label>
                  <div className="flex items-stretch">
                    <input
                      type="text"
                      required
                      value={empEmailUser}
                      onChange={e => setEmpEmailUser(e.target.value)}
                      placeholder="maria.oliveira"
                      className="flex-1 min-w-0 px-3 py-2 rounded-l-xl bg-slate-50 border border-r-0 border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                    <span className="px-2.5 py-2 rounded-r-xl bg-slate-100 border border-slate-300 font-mono font-bold text-[#2D3277] text-[11px] flex items-center shrink-0">
                      @{activeDomain}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Perfil na Empresa</label>
                  <select
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value as CompanyRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  >
                    <option value="member">Colaborador (Acesso ao Mapa e Dossiês)</option>
                    <option value="company_admin">ADM da Empresa (Gerencia Usuários e Ocorrências)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Permissão de Ocorrências</label>
                  <select
                    value={empRole === 'company_admin' ? 'edit' : empIncidentAccess}
                    onChange={e => setEmpIncidentAccess(e.target.value as IncidentAccess)}
                    disabled={empRole === 'company_admin'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA] disabled:opacity-60"
                  >
                    <option value="read">Somente leitura</option>
                    <option value="edit">Ler, registrar e editar</option>
                  </select>
                  {empRole === 'company_admin' && <p className="text-[10px] text-slate-500 mt-1">Administradores da empresa mantêm acesso de edição.</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSaving || (company !== null && !company.active)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#00A650] hover:bg-[#008744] disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Vinculando...' : 'Adicionar Usuário & Vincular Licença'}</span>
                </button>
              </form>
            </div>

            {/* Right: Simple Users & Licenses Roster */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-[#2D3277]">
                  Controle de Usuários & Licenças ({members.length})
                </h3>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, e-mail ou licença..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Colaborador</th>
                      <th className="p-3">Chave da Licença</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Consultas</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          Nenhum usuário cadastrado para @{activeDomain} ainda. Adicione o primeiro colaborador ao lado.
                        </td>
                      </tr>
                    ) : (
                      members.map(m => {
                        const isSelf = m.user?.uid === currentAdmin?.uid;
                        return (
                          <tr key={m.key} className="hover:bg-slate-50">
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900">{m.displayName}</span>
                                {m.companyRole === 'company_admin' && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] text-[9px] font-bold">
                                    ADM EMPRESA
                                  </span>
                                )}
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                                    Você
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">{m.email}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {m.isConnected ? 'Conta ativa no sistema' : 'Aguardando 1º login'}
                              </div>
                            </td>

                            <td className="p-3">
                              {m.licenseKey ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2D3277]/10 text-[#2D3277] font-mono font-bold text-[11px]">
                                  <KeyRound className="w-3 h-3" />
                                  {m.licenseKey}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Não vinculada</span>
                              )}
                            </td>

                            <td className="p-3">
                              {m.licenseStatus === 'active' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00A650]/15 text-[#008744] font-bold text-[10px]">
                                  <BadgeCheck className="w-3 h-3" /> Ativa
                                </span>
                              ) : m.licenseStatus === 'suspended' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                                  <Ban className="w-3 h-3" /> Suspensa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  <Clock className="w-3 h-3" /> Sem Licença
                                </span>
                              )}
                            </td>

                            <td className="p-3 font-mono font-bold text-slate-800">
                              {m.accessCount}
                            </td>

                            <td className="p-3">
                              {!isSelf && (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => handleToggleMemberLicense(m)}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                                      m.licenseStatus === 'active'
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-[#00A650] hover:bg-[#008744] text-white'
                                    }`}
                                  >
                                    {m.licenseStatus === 'active'
                                      ? 'Suspender'
                                      : m.licenseKey
                                      ? 'Reativar'
                                      : 'Vincular Licença'}
                                  </button>

                                  <button
                                    onClick={() => handleToggleCompanyRole(m)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#FFE600] text-[#2D3277] font-semibold text-[11px] cursor-pointer"
                                  >
                                    {m.companyRole === 'company_admin' ? 'Remover ADM' : 'Tornar ADM'}
                                  </button>

                                  <label className="flex items-center gap-1 text-[10px] text-slate-600">
                                    Ocorrências
                                    <select
                                      value={m.companyRole === 'company_admin' ? 'edit' : m.incidentAccess}
                                      disabled={m.companyRole === 'company_admin'}
                                      onChange={e => handleIncidentAccessChange(m, e.target.value as IncidentAccess)}
                                      className="px-1.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:bg-slate-100"
                                      aria-label={`Permissão de ocorrências para ${m.displayName}`}
                                    >
                                      <option value="read">Ler</option>
                                      <option value="edit">Editar</option>
                                    </select>
                                  </label>

                                  {(m.license || m.user) && m.user?.role !== 'admin' && (
                                    <button
                                      onClick={() => handleRemoveLicense(m)}
                                      title="Remover definitivamente da empresa"
                                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span className="sr-only">Remover {m.displayName} da empresa</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {/* SUBTAB 2: PACOTES EXTRAVIADOS / FRAUDES & OCORRÊNCIAS EM DELEGACIAS */}
      {/* =================================================================== */}
      {subTab === 'carriers' && (
        <>
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2D3277] to-[#1E2258] text-white shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FFE600]" />
              <h3 className="font-extrabold text-sm text-[#FFE600]">Histórico e evolução mensal por transportadora</h3>
            </div>
            <p className="mt-1 text-xs text-white/80">Indicadores calculados a partir das ocorrências sincronizadas no Firestore de @{activeDomain}.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-blue-200 rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-blue-700 uppercase">Pacotes envolvidos</div>
              <div className="text-2xl font-extrabold text-blue-800 font-mono mt-1">{incidentStats.involved}</div>
              <div className="text-[11px] text-slate-500 mt-1">Quantidade informada nos registros</div>
            </div>
            <div className="p-4 bg-white border border-cyan-200 rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-cyan-700 uppercase">Pacotes entregues</div>
              <div className="text-2xl font-extrabold text-cyan-700 font-mono mt-1">{incidentStats.delivered}</div>
              <div className="text-[11px] text-slate-500 mt-1">Entregas registradas no formulário</div>
            </div>
            <div className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-emerald-700 uppercase">Pacotes recuperados</div>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">{incidentStats.recovered}</div>
              <div className="text-[11px] text-slate-500 mt-1">Informados no registro da ocorrência</div>
            </div>
            <div className="p-4 bg-white border border-rose-200 rounded-2xl shadow-sm">
              <div className="text-[11px] font-bold text-rose-700 uppercase">Roubados / não localizados</div>
              <div className="text-2xl font-extrabold text-rose-700 font-mono mt-1">{incidentStats.lost}</div>
              <div className="text-[11px] text-slate-500 mt-1">Informados como roubados</div>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#2D3277]"><BarChart3 className="h-4 w-4" /> Histórico por transportadora</h3>
              <p className="mt-1 text-xs text-slate-500">Dados calculados a partir das ocorrências sincronizadas no Firestore desta empresa.</p>
            </div>
            {carrierAnalytics.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">Cadastre a transportadora nos registros para começar a comparar ocorrências.</div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div>
                  <h4 className="mb-2 text-xs font-bold text-slate-700">Ocorrências registradas</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={carrierAnalytics.slice(0, 10)} margin={{ top: 8, right: 12, left: -18, bottom: 42 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="carrier" angle={-25} textAnchor="end" interval={0} height={56} tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="occurrences" name="Ocorrências" fill="#3483FA" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-bold text-slate-700">Pacotes por desfecho</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={carrierAnalytics.slice(0, 10)} margin={{ top: 8, right: 12, left: -18, bottom: 42 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="carrier" angle={-25} textAnchor="end" interval={0} height={56} tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="delivered" name="Entregues" stackId="packages" fill="#06B6D4" />
                        <Bar dataKey="recovered" name="Recuperados" stackId="packages" fill="#00A650" />
                        <Bar dataKey="lost" name="Roubados" stackId="packages" fill="#E11D48" />
                        <Bar dataKey="inProgress" name="Em andamento / custódia" stackId="packages" fill="#3483FA" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            {carrierMonthlyTrend.months.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="mb-2 text-xs font-bold text-slate-700">Evolução mensal — 5 transportadoras com mais ocorrências</h4>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={carrierMonthlyTrend.months} margin={{ top: 8, right: 18, left: -18, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      {carrierMonthlyTrend.carriers.map((carrier, index) => (
                        <Line key={carrier} type="monotone" dataKey={carrier} name={carrier} stroke={['#2D3277', '#3483FA', '#00A650', '#E11D48', '#D97706'][index]} strokeWidth={2} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-600"><tr><th className="p-2.5">Transportadora</th><th className="p-2.5">Ocorrências</th><th className="p-2.5">Pacotes</th><th className="p-2.5">Entregues</th><th className="p-2.5">Recuperados</th><th className="p-2.5">Roubados</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{carrierAnalytics.map(row => <tr key={row.carrier}><td className="p-2.5 font-semibold text-slate-800">{row.carrier}</td><td className="p-2.5">{row.occurrences}</td><td className="p-2.5">{row.packages}</td><td className="p-2.5 text-cyan-700">{row.delivered}</td><td className="p-2.5 text-emerald-700">{row.recovered}</td><td className="p-2.5 text-rose-700">{row.lost}</td></tr>)}</tbody>
              </table>
            </div>
          </section>        </>
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

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Total de Ocorrências
                </span>
                <FileText className="w-4 h-4 text-[#3483FA]" />
              </div>
              <div className="text-2xl font-extrabold text-[#2D3277] font-mono mt-1">
                {incidentStats.total}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Registros gerais da empresa
              </div>
            </div>

            <div className="p-4 bg-white border border-red-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-700 uppercase">
                  Roubos & Furtos
                </span>
                <Flame className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-extrabold text-red-700 font-mono mt-1">
                {incidentStats.totalRoubos}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Mancha no Mapa de Calor
              </div>
            </div>

            <div className="p-4 bg-white border border-rose-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-700 uppercase">
                  Pacotes na Delegacia
                </span>
                <Landmark className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-extrabold text-rose-700 font-mono mt-1">
                {incidentStats.atStation}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Em ocorrência ou custódia na DP
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Liberados / Devolvidos
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#008744]" />
              </div>
              <div className="text-2xl font-extrabold text-[#008744] font-mono mt-1">
                {incidentStats.resolved}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Pacotes recuperados ou liberados
              </div>
            </div>

            <div className="p-4 bg-[#2D3277] text-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#FFE600] uppercase">
                  Valor Envolvido
                </span>
                <ShieldAlert className="w-4 h-4 text-[#FFE600]" />
              </div>
              <div className="text-2xl font-extrabold font-mono mt-1">
                R$ {incidentStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-white/80 mt-1">
                Soma dos pacotes em ocorrência
              </div>
            </div>

          </div>



          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Register / Edit Lost or Fraud Package Incident */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5 h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#2D3277] flex items-center gap-2">
                  <PackageX className="w-4 h-4 text-rose-600" />
                  <span>
                    {editingIncidentId
                      ? 'Editar Ocorrência do Pacote'
                      : 'Cadastrar Pacote Extraviado / Fraude'}
                  </span>
                </h3>
                {editingIncidentId && (
                  <button
                    type="button"
                    onClick={resetIncidentForm}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {incidentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{incidentError}</span>
                </div>
              )}

              {incidentSuccess && (
                <div className="p-3 rounded-xl bg-[#00A650]/10 border border-[#00A650]/30 text-[#008744] text-xs flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{incidentSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveIncident} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Código do Pacote / Rastreio
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={trackingCode}
                      onChange={e => setTrackingCode(e.target.value)}
                      placeholder="Ex: MELI-BR94820129"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tipo de Ocorrência
                    </label>
                    <select
                      value={incidentType}
                      onChange={e => setIncidentType(e.target.value as PackageIncidentType)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                    >
                      <option value="extravio">Extravio</option>
                      <option value="ameaca">Ameaça</option>
                      <option value="fraude">Fraude</option>
                      <option value="roubo_carga">Roubo de Carga</option>
                      <option value="apreensao">Apreensão Policial</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                </div>





                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Transportadora</label>
                    <input
                      type="text"
                      list="company-carrier-options"
                      maxLength={120}
                      value={carrierName}
                      onChange={e => setCarrierName(e.target.value)}
                      placeholder="Digite ou cadastre a transportadora"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                    <datalist id="company-carrier-options">{registeredCarriers.map(carrier => <option key={carrier} value={carrier} />)}</datalist>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quantidade de pacotes envolvidos</label>
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      step="1"
                      required
                      value={packageQuantity}
                      onChange={e => setPackageQuantity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                    <span className="mt-1 block text-[10px] text-slate-500">Recuperados e perdidos são totalizados automaticamente pelo status salvo.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {([
                    ['Pacotes Entregues', packagesDelivered, setPackagesDelivered],
                    ['Pacotes Recuperados', packagesRecovered, setPackagesRecovered],
                    ['Pacotes Roubados', packagesStolen, setPackagesStolen]
                  ] as const).map(([label, value, setter]) => (
                    <div key={label}>
                      <label className="block font-semibold text-slate-700 mb-1">{label}</label>
                      <input type="number" min="0" max={packageQuantity} step="1" value={value} onChange={e => setter(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nº do B.O. / Registro Policial
                    </label>
                    <input
                      type="text"
                      maxLength={64}
                      value={boNumber}
                      onChange={e => setBoNumber(e.target.value)}
                      placeholder="Ex: 019-04512/2026"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      VALOR TOTAL ESTIMADO (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={estimatedUnitValue}
                      onChange={e => setEstimatedUnitValue(formatBrlInput(e.target.value))}
                      placeholder="0,00"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Police Station Picker */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="font-bold text-[#2D3277] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#3483FA]" />
                      <span>Selecionar Delegacia (RJ / MG / ES)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {(['TODAS', 'RJ', 'MG', 'ES'] as const).map(uf => (
                        <button
                          key={uf}
                          type="button"
                          onClick={() => setDelegaciaUfFilter(uf)}
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] cursor-pointer ${
                            delegaciaUfFilter === uf
                              ? 'bg-[#2D3277] text-[#FFE600]'
                              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {uf}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={delegaciaSearch}
                    onChange={e => setDelegaciaSearch(e.target.value)}
                    placeholder="Buscar DP, delegacia ou município..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  />

                  <select
                    required
                    value={selectedDelegaciaId}
                    onChange={e => setSelectedDelegaciaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#3483FA]"
                  >
                    {filteredDelegacias.length === 0 ? (
                      <option value="">Nenhuma delegacia encontrada para este filtro</option>
                    ) : (
                      filteredDelegacias.map(del => (
                        <option key={del.id} value={del.id}>
                          {del.label}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="text-[10px] text-slate-500">
                    {filteredDelegacias.length} delegacia(s) disponível(is) na base territorial
                  </div>
                </div>

                {/* Package Custody Toggle & Status */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={packageAtStation}
                      onChange={e => setPackageAtStation(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-rose-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">
                        O pacote está atualmente na delegacia em ocorrência policial
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Marque se o volume físico encontra-se apreendido, retido ou sob custódia da DP selecionada.
                      </div>
                    </div>
                  </label>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Situação / Custódia Atual
                    </label>
                    <select
                      value={custodyStatus}
                      onChange={e => {
                        const next = e.target.value as PackageCustodyStatus;
                        setCustodyStatus(next);
                        if (next === 'em_ocorrencia_delegacia' || next === 'aguardando_pericia') {
                          setPackageAtStation(true);
                        } else if (next === 'devolvido_empresa' || next === 'extraviado_nao_localizado') {
                          setPackageAtStation(false);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                    >
                      <option value="em_ocorrencia_delegacia">
                        Na delegacia — em ocorrência policial
                      </option>
                      <option value="aguardando_pericia">
                        Na delegacia — aguardando perícia
                      </option>
                      <option value="liberado_retirada">
                        Liberado pela delegacia para retirada
                      </option>
                      <option value="devolvido_empresa">
                        Devolvido / recuperado pela empresa
                      </option>
                      <option value="extraviado_nao_localizado">
                        Extraviado / não localizado
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Observações / Detalhes da Ocorrência
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={incidentNotes}
                    onChange={e => setIncidentNotes(e.target.value)}
                    placeholder="Ex: Motorista registrou B.O. presencial, pacote retido no setor de cargas da DP aguardando ofício de retirada..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#3483FA] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingIncident || (company !== null && !company.active)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] disabled:opacity-60 text-[#FFE600] font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  {isSavingIncident ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>
                    {isSavingIncident
                      ? 'Salvando...'
                      : editingIncidentId
                      ? 'Salvar Alterações da Ocorrência'
                      : 'Registrar Ocorrência na Delegacia'}
                  </span>
                </button>
              </form>
            </div>

            {/* Right: Incidents & Police Custody Roster */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-[#2D3277]">
                    Ocorrências Policiais & Pacotes ({filteredIncidents.length})
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={incidentSearch}
                      onChange={e => setIncidentSearch(e.target.value)}
                      placeholder="Buscar código, B.O. ou delegacia..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3483FA]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  {(
                    [
                      { id: 'all', label: `Todos (${incidents.length})` },
                      { id: 'roubos', label: `Roubos & Furtos (${incidentStats.totalRoubos})` },
                      { id: 'at_station', label: `Na Delegacia (${incidentStats.atStation})` },
                      { id: 'fraude', label: 'Fraudes' },
                      { id: 'extravio', label: 'Extravios' },
                      { id: 'ameaca', label: 'Ameaças' },
                      { id: 'resolved', label: 'Liberados / Devolvidos' }
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setIncidentFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                        incidentFilter === tab.id
                          ? 'bg-[#2D3277] text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {filteredIncidents.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-500 space-y-2">
                    <PackageX className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>
                      Nenhuma ocorrência encontrada para @{activeDomain}. Cadastre ao lado pacotes extraviados ou com fraude vinculados à delegacia.
                    </p>
                  </div>
                ) : (
                  filteredIncidents.map(inc => {
                    const typeMeta = INCIDENT_TYPE_LABELS[inc.incidentType] || INCIDENT_TYPE_LABELS.outros;
                    const custodyMeta =
                      CUSTODY_STATUS_LABELS[inc.custodyStatus] ||
                      CUSTODY_STATUS_LABELS.em_ocorrencia_delegacia;

                    return (
                      <div key={inc.id} className="p-4 hover:bg-slate-50 space-y-2.5 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-extrabold text-sm text-[#2D3277]">
                                {inc.trackingCode}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${typeMeta.badgeClass}`}
                              >
                                {typeMeta.label}
                              </span>
                              {inc.boNumber && (
                                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                                  B.O. {inc.boNumber}
                                </span>
                              )}
                              {inc.carrierName && <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800">{inc.carrierName}</span>}
                              {inc.estimatedValue > 0 && (
                                <span className="font-mono font-bold text-[11px] text-slate-800">
                                  R$ {inc.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-700 flex-wrap">
                              <span className="font-mono font-semibold text-slate-700">{Math.max(1, Number(inc.packageQuantity) || 1)} pacote(s)</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-[10px] font-semibold text-slate-600">{inc.custodyStatus === 'devolvido_empresa' ? 'Recuperados / entregues' : inc.custodyStatus === 'extraviado_nao_localizado' || ['roubo_carga', 'roubo', 'furto'].includes(inc.incidentType) ? 'Perdidos / roubados' : 'Em andamento / custódia'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-700 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-[#2D3277] text-[#FFE600] font-mono font-bold text-[10px]">
                                {inc.delegaciaUf}
                              </span>
                              <span className="font-bold">{inc.delegaciaName}</span>
                              {inc.delegaciaMunicipio && (
                                <span className="text-slate-500">· {inc.delegaciaMunicipio}</span>
                              )}
                            </div>

                            {inc.address && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate max-w-md">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate">{inc.address}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                            {inc.lat != null && inc.lng != null && onLocateOnMap && (
                              <button
                                type="button"
                                onClick={() => onLocateOnMap(Number(inc.lat), Number(inc.lng))}
                                title="Localizar no Mapa de Calor"
                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Flame className="w-3.5 h-3.5 text-red-600" />
                                <span>Ver no Mapa</span>
                              </button>
                            )}

                            {onViewIncidentDossier && (
                              <button
                                type="button"
                                onClick={() => onViewIncidentDossier(inc)}
                                title="Abrir dossiê da ocorrência"
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <History className="w-3.5 h-3.5 text-blue-600" />
                                <span>Ver detalhes</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleTogglePackageAtStation(inc)}
                              title="Alternar se o pacote físico está na delegacia"
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer border ${
                                inc.packageAtStation
                                  ? 'bg-rose-600 text-white border-rose-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {inc.packageAtStation ? 'PACOTE NA DELEGACIA' : 'Fora da DP'}
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenIncidentModal ? onOpenIncidentModal(inc) : handleEditIncident(inc)}
                              title="Editar ocorrência"
                              className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {canDeleteIncidents && <button
                              type="button"
                              onClick={() => handleDeleteIncident(inc.id)}
                              title="Excluir registro"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>}
                          </div>
                        </div>

                        {inc.notes && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                            {inc.notes}
                          </p>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${custodyMeta.badgeClass}`}>
                              {custodyMeta.shortLabel}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Por {inc.createdByName} em {formatTimestamp(inc.createdAt)}
                            </span>
                          </div>

                          <select
                            value={inc.custodyStatus}
                            onChange={e =>
                              handleQuickCustodyChange(inc, e.target.value as PackageCustodyStatus)
                            }
                            aria-label="Atualizar custódia"
                            className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-[#3483FA] cursor-pointer"
                          >
                            <option value="em_ocorrencia_delegacia">Em ocorrência na DP</option>
                            <option value="aguardando_pericia">Aguardando perícia</option>
                            <option value="liberado_retirada">Liberado p/ retirada</option>
                            <option value="devolvido_empresa">Devolvido à empresa</option>
                            <option value="extraviado_nao_localizado">Não localizado</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* =================================================================== */}
      {subTab === 'audit' && (isAdmin || currentAdmin?.companyRole === 'company_admin') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-[#2D3277]">Auditoria de Ocorrências</h3>
              <p className="text-sm text-slate-500">Histórico de ações da equipe, armazenado no Firestore.</p>
            </div>
            <div className="flex gap-2">
              <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Buscar pacote, usuário ou ação" className="min-w-0 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <button type="button" onClick={() => {
                const rows = [['Data','Ação','Pacote','B.O.','Delegacia','Usuário','E-mail','Resumo'], ...incidentAuditLogs.map(log => [formatTimestamp(log.createdAt), log.action, log.trackingCode, log.boNumber, log.delegaciaName, log.actorName, log.actorEmail, log.summary])];
                const csv = rows.map(row => row.map(value => `"${String(value || '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
                const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' })); link.download = `auditoria-ocorrencias-${activeDomain}.csv`; link.click(); URL.revokeObjectURL(link.href);
              }} className="rounded-xl bg-[#2D3277] px-3 py-2 text-xs font-bold text-white">Exportar CSV</button>
            </div>
          </div>
          <div className="space-y-2">
            {incidentAuditLogs.filter(log => `${log.trackingCode} ${log.actorName} ${log.actorEmail} ${log.summary} ${log.delegaciaName}`.toLowerCase().includes(auditSearch.toLowerCase())).map(log => {
              const incident = incidents.find(item => item.id === log.incidentId);
              return <article key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-800">{log.summary}</strong><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">{log.action.replaceAll('_', ' ')}</span></div><p className="mt-1 text-xs text-slate-500">{formatTimestamp(log.createdAt)} · {log.actorName} ({log.actorEmail})</p><p className="text-xs text-slate-500">Pacote {log.trackingCode}{log.boNumber ? ` · B.O. ${log.boNumber}` : ''} · {log.delegaciaName}</p></div>
                {incident && onViewIncidentDossier && <button type="button" onClick={() => onViewIncidentDossier(incident)} className="shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700">Abrir dossiê</button>}
              </article>;
            })}
            {incidentAuditLogs.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Ainda não há ações registradas para esta empresa.</div>}
          </div>
        </section>
      )}

      {/* SUBTAB 3: CADASTRO & GESTÃO DA EMPRESA                              */}
      {/* =================================================================== */}
      {subTab === 'company_info' && (
        <div className="space-y-6">
          {/* Top Banner / Corporate License Badge */}
          <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#2D3277] to-[#1E2355] text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <Building2 className="w-6 h-6 text-[#FFE600]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-white">
                    {company?.companyName || `Empresa @${activeDomain}`}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-[#FFE600] text-[#2D3277] font-mono font-bold text-xs">
                    @{activeDomain}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      company?.active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {company?.active ? 'Empresa Ativa' : 'Empresa Inativa'}
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-1">
                  Licença e Certificação: <strong className="text-white">Agência Ícone Digital by Vinicius Cirne</strong> · Registro Oficial: <code className="font-mono text-[#FFE600]">AID-VC-GIS-2026-BR-RJ</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://wa.me/5521974976130?text=Ol%C3%A1%2C%20gostaria%20de%20suporte%20sobre%20as%20licen%C3%A7as%20corporativas%20do%20Painel%20de%20Monitoramento%20Territorial"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Suporte WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form 1: Cadastrar Nova Empresa Corporativa (Apenas SuperAdmin) */}
            {isAdmin && (
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
                      <Crown className="w-4 h-4 text-purple-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#2D3277]">
                        Provisionar Nova Empresa (SuperAdmin)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Adicione outra organização corporativa no sistema e defina assentos.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 uppercase">
                    Ação Master ADM
                  </span>
                </div>

                {newCompError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{newCompError}</span>
                  </div>
                )}

                {newCompSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{newCompSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreateNewCompany} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Razão Social ou Nome Fantasia *
                    </label>
                    <input
                      type="text"
                      value={newCompName}
                      onChange={e => setNewCompName(e.target.value)}
                      placeholder="Ex: Transportadora Rio Express Ltda"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Domínio Corporativo *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 font-mono font-bold text-slate-400">@</span>
                      <input
                        type="text"
                        value={newCompDomain}
                        onChange={e => setNewCompDomain(e.target.value)}
                        placeholder="empresa.com ou filial.com.br"
                        required
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Colaboradores com e-mail deste domínio receberão as licenças da empresa.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Plano Corporativo
                    </label>
                    <select
                      value={newCompPlanId}
                      onChange={e => {
                        setNewCompPlanId(e.target.value);
                        const sel = availablePlans.find(p => p.id === e.target.value);
                        if (sel) {
                          setNewCompPrice(String(sel.pricePerLicense ?? sel.priceMonthly ?? 49));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none text-slate-800 bg-white"
                    >
                      {availablePlans.length > 0 ? (
                        availablePlans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.billingModel === 'per_user' ? 'Por Usuário' : 'Fixo'} · R$ {p.pricePerLicense ?? p.priceMonthly})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="corp_licenca">Corporativo Padrão (Por Licença)</option>
                          <option value="corp_enterprise">Corporativo Enterprise Custom</option>
                          <option value="corp_basic">Corporativo Básico</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Assentos (Licenças)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newCompSeats}
                        onChange={e => setNewCompSeats(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Preço / Licença (R$)
                      </label>
                      <input
                        type="text"
                        value={newCompPrice}
                        onChange={e => setNewCompPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCompAutoApprove}
                      onChange={e => setNewCompAutoApprove(e.target.checked)}
                      className="rounded border-slate-300 text-[#00A650] focus:ring-0"
                    />
                    <span className="text-slate-700 font-semibold">
                      Aprovar colaboradores automaticamente no 1º login
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSavingNewComp}
                    className="w-full py-2.5 rounded-xl bg-[#2D3277] hover:bg-[#1E2258] text-[#FFE600] font-extrabold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 border border-[#1E2258]"
                  >
                    {isSavingNewComp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#FFE600]" />
                        <span>Salvando Cadastro...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#FFE600]" />
                        <span>Cadastrar Nova Empresa</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Form 2: Dados e Configurações da Empresa Ativa */}
            <div className={`${isAdmin ? 'lg:col-span-6' : 'lg:col-span-12 max-w-3xl mx-auto'} bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#3483FA]/10 text-[#3483FA]">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#2D3277]">
                      Configurações da Empresa Ativa
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Atualize a razão social, limite de licenças e parâmetros contratuais.
                    </p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-[#2D3277]">
                  @{activeDomain || 'empresa'}
                </span>
              </div>

              {editCompError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{editCompError}</span>
                </div>
              )}

              {editCompSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{editCompSuccess}</span>
                </div>
              )}

              {company ? (
                <form onSubmit={handleUpdateActiveCompany} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Razão Social / Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      value={editCompName}
                      onChange={e => setEditCompName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Domínio Corporativo (Chave Única)
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono text-slate-700 text-xs">
                      <span>@{activeDomain}</span>
                      <span className="text-[10px] text-slate-400 font-sans ml-auto">(Identificador corporativo)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Plano Corporativo
                    </label>
                    <select
                      value={editCompPlanId}
                      onChange={e => setEditCompPlanId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none text-slate-800 bg-white"
                    >
                      {availablePlans.length > 0 ? (
                        availablePlans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.billingModel === 'per_user' ? 'Por Licença' : 'Fixo'})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="corp_licenca">Corporativo Padrão (Por Licença)</option>
                          <option value="corp_enterprise">Corporativo Enterprise Custom</option>
                          <option value="corp_basic">Corporativo Básico</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Assentos Contratados
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editCompSeats}
                        onChange={e => setEditCompSeats(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                      />
                      <span className="text-[10px] text-slate-400">0 = sem limite estrito</span>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Preço por Licença (R$)
                      </label>
                      <input
                        type="text"
                        value={editCompPrice}
                        onChange={e => setEditCompPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                      />
                      <span className="text-[10px] text-slate-400">Cobrança mensal por usuário</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCompAutoApprove}
                        onChange={e => setEditCompAutoApprove(e.target.checked)}
                        className="rounded border-slate-300 text-[#3483FA] focus:ring-0"
                      />
                      <span className="text-slate-700 font-semibold">
                        Aprovação Automática
                      </span>
                    </label>

                    <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCompActive}
                        onChange={e => setEditCompActive(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                      />
                      <span className="text-slate-700 font-semibold">
                        Empresa Ativa no Sistema
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingEditComp}
                    className="w-full py-2.5 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingEditComp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Atualizando Empresa...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Alterações da Empresa</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Selecione uma empresa ou utilize o formulário ao lado para cadastrar uma nova.</p>
                </div>
              )}
            </div>
          </div>

          {/* Table / List of Registered Companies */}
          {allCompanies.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#2D3277]/10 text-[#2D3277]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#2D3277]">
                      Empresas Corporativas Cadastradas ({allCompanies.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Organizações com domínio homologado no Painel de Monitoramento Territorial.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {allCompanies.map(comp => {
                  const isCurrent = comp.domain === activeDomain;
                  return (
                    <div
                      key={comp.domain}
                      className={`p-4 rounded-xl border transition-all space-y-2.5 text-xs ${
                        isCurrent
                          ? 'bg-[#2D3277]/5 border-[#2D3277] ring-1 ring-[#2D3277]'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-slate-900 line-clamp-1">
                            {comp.companyName}
                          </h5>
                          <span className="font-mono text-[#3483FA] font-bold text-[11px]">
                            @{comp.domain}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            comp.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {comp.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        <span>Assentos: <strong className="font-mono">{comp.licensedSeats || '∞'}</strong></span>
                        <span>R$ {comp.pricePerLicense?.toFixed(2).replace('.', ',') || '0,00'}/lic</span>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectOverrideDomain) {
                              onSelectOverrideDomain(comp.domain);
                            }
                          }}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-[#2D3277] text-[#FFE600]'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isCurrent ? 'Empresa Selecionada' : 'Gerenciar Esta Empresa'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
