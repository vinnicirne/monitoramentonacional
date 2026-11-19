import React, { useMemo, useState } from 'react';
import { auth, reportFirestoreError } from '../../../firebase';
import { refreshIncidentCache } from '../../incidents/services/incidentCache';
import { deleteCorporateIncident, saveCorporateIncident, toggleCorporateIncidentStation, updateCorporateIncidentCustody } from '../../incidents/services/incidentRepository';
import type { DelegaciaOption } from '../types';
import { IncidentFilterMode, useCompanyIncidentData } from './useCompanyIncidentData';
import { buildCompanyIncidentRecord } from '../services/companyIncidentFactory';
import { CorporatePackageIncident, CorporateUserLicense, OperationType, PackageCustodyStatus, PackageIncidentType, UserProfile } from '../../../types/admin';
import { TerritorialRegistry } from '../../../types';
import { DELEGACIAS_MG_ES_DATA } from '../../../data/delegaciasMgEsData';
import { useAuth } from '../../../contexts/AuthContext';
import { formatBrlAmount } from '../../../utils/currency';

export function useCompanyIncidentActions({ activeDomain, currentAdmin, firebaseUser, isAdmin, isCompanyAdmin, licenses, incidents, removeIncident, registry }: Pick<ReturnType<typeof useAuth>, 'firebaseUser' | 'isAdmin' | 'isCompanyAdmin'> & { activeDomain: string; currentAdmin: UserProfile | null; licenses: CorporateUserLicense[]; incidents: CorporatePackageIncident[]; removeIncident: (incidentId: string) => void; registry?: TerritorialRegistry | null }) {
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
  const [pickedDelegaciaId, setSelectedDelegaciaId] = useState('');
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

  const selectedDelegaciaId = pickedDelegaciaId || filteredDelegacias[0]?.id || '';

  const { filteredIncidents, incidentStats } = useCompanyIncidentData(incidents, incidentSearch, incidentFilter);

  const registeredCarriers = useMemo(
    () => Array.from(new Set(incidents.map(incident => incident.carrierName?.trim()).filter((value): value is string => Boolean(value)))),
    [incidents]
  );

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

    const adminUid = auth.currentUser?.uid || firebaseUser?.uid || currentAdmin?.uid || 'user_unknown';
    const adminName = (firebaseUser?.displayName || currentAdmin?.displayName || firebaseUser?.email || currentAdmin?.email || 'Administrador').slice(0, 120);
    const result = buildCompanyIncidentRecord({
      draft: {
        id: editingIncidentId,
        trackingCode,
        carrierName,
        packageQuantity,
        packagesDelivered,
        packagesRecovered,
        packagesStolen,
        incidentType,
        boNumber,
        estimatedUnitValue,
        packageAtStation,
        custodyStatus,
        notes: incidentNotes
      },
      delegation: allDelegacias.find(item => item.id === selectedDelegaciaId),
      registry,
      companyDomain: activeDomain,
      actorUid: adminUid,
      actorName: adminName
    });
    if ('error' in result) {
      setIncidentError(result.error);
      return;
    }
    const { incident: localIncidentRecord, trackingCode: cleanCode, delegationName: safeDelName } = result;
    const incId = localIncidentRecord.id;
    setIsSavingIncident(true);
    try {
      await saveCorporateIncident(activeDomain, localIncidentRecord, Boolean(editingIncidentId), {
        uid: adminUid, name: adminName, email: firebaseUser?.email || currentAdmin.email
      });
      if (editingIncidentId) {
        setIncidentSuccess(`Ocorrência do pacote ${cleanCode} atualizada com sucesso.`);
      } else {
        setIncidentSuccess(`Pacote ${cleanCode} registrado na ${safeDelName} (${packageAtStation ? 'em ocorrência na delegacia' : 'fora da delegacia'}).`);
      }
      if (!editingIncidentId) refreshIncidentCache(activeDomain, incId, () => localIncidentRecord);
      resetIncidentForm();
    } catch (err: any) {
      const incidentPath = `corporate_companies/${activeDomain}/incidents/${incId}`;
      const matchingLicense = licenses.find(license =>
        license.email.toLowerCase() === (auth.currentUser?.email || '').toLowerCase()
      );
      console.error('Falha ao gravar ocorrência no Firebase:', {
        error: err,
        path: incidentPath,
        operation: editingIncidentId ? 'update' : 'create',
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        profileUid: currentAdmin?.uid,
        companyRole: currentAdmin?.companyRole,
        profileIncidentAccess: currentAdmin?.incidentAccess || 'read',
        licenseStatus: matchingLicense?.status || 'not-found',
        licenseIncidentAccess: matchingLicense?.incidentAccess || 'read'
      });
      const errorCode = typeof err?.code === 'string' ? ` (${err.code})` : '';
      const hasEditAccess = isAdmin || (
        currentAdmin?.licenseStatus !== 'suspended' && (
          isCompanyAdmin ||
          currentAdmin?.incidentAccess === 'edit' ||
          (matchingLicense?.status === 'active' && (matchingLicense.incidentAccess === 'edit' || matchingLicense.companyRole === 'company_admin'))
        )
      );
      const permissionHint = err?.code === 'permission-denied' && !hasEditAccess
        ? ' Esta conta está sem permissão Editar; o ADM da Empresa deve habilitá-la em Usuários & Licenças.'
        : ` Operação: ${editingIncidentId ? 'editar' : 'criar'} em ${incidentPath}.`;
      setIncidentError(`Não foi possível gravar a ocorrência no Firebase${errorCode}.${permissionHint}`);
    } finally {
      setIsSavingIncident(false);
    }
  };

  const handleQuickCustodyChange = async (
    inc: CorporatePackageIncident,
    nextStatus: PackageCustodyStatus
  ) => {
    if (!activeDomain) return;
    try {
      await updateCorporateIncidentCustody(activeDomain, inc, nextStatus, {
        uid: currentAdmin?.uid,
        name: currentAdmin?.displayName,
        email: firebaseUser?.email || currentAdmin?.email
      });
    } catch (err) {
      setIncidentError('Não foi possível atualizar a ocorrência. Tente novamente.');
      reportFirestoreError(
        err,
        OperationType.UPDATE,
        `corporate_companies/${activeDomain}/incidents/${inc.id}`
      );
    }
  };

  const handleTogglePackageAtStation = async (inc: CorporatePackageIncident) => {
    if (!activeDomain) return;
    try {
      await toggleCorporateIncidentStation(activeDomain, inc, {
        uid: currentAdmin?.uid,
        name: currentAdmin?.displayName,
        email: firebaseUser?.email || currentAdmin?.email
      });
    } catch (err) {
      setIncidentError('Não foi possível atualizar a ocorrência. Tente novamente.');
      reportFirestoreError(
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
    let deleteStage: 'marker' | 'incident' = 'marker';
    try {
      await deleteCorporateIncident(activeDomain, incId, {
        uid: firebaseUser?.uid || currentAdmin?.uid || '',
        name: firebaseUser?.displayName || currentAdmin?.displayName || '',
        email: firebaseUser?.email || currentAdmin?.email || ''
      });
      refreshIncidentCache(activeDomain, incId, () => undefined);
      removeIncident(incId);
      setIncidentError(null);
      setIncidentSuccess('Ocorrência excluída com sucesso.');
      if (editingIncidentId === incId) resetIncidentForm();
    } catch (err) {
      const errorCode = typeof (err as any)?.code === 'string' ? (err as any).code : '';
      deleteStage = (err as any)?.deletionStage || deleteStage;
      setIncidentError(errorCode === 'permission-denied'
        ? deleteStage === 'marker'
          ? 'O Firebase recusou gravar a proteção de sincronização desta ocorrência. Atualize o app e confira as regras de segurança.'
          : 'O Firebase recusou excluir este registro. Atualize o app e confira se a conta tem permissão SuperAdmin ou Editar.'
        : `Não foi possível excluir a ocorrência${errorCode ? ` (${errorCode})` : ''}. Verifique sua conexão e tente novamente.`);
      reportFirestoreError(
        err,
        OperationType.DELETE,
        `corporate_companies/${activeDomain}/incidents/${incId}`
      );
    }
  };

  return {
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
  };
}
