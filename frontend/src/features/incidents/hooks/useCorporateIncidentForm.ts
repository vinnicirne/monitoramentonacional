import { useState, useEffect, useEffectEvent, useRef, type FormEvent } from 'react';
import { auth, reportFirestoreError } from '../../../firebase';
import { saveCorporateIncident, updateCorporateIncidentHistory } from '../services/incidentRepository';
import { OperationType, type CorporateCompany, type CorporatePackageIncident, type IncidentHistoryEntry, type PackageCustodyStatus, type PackageIncidentType } from '../../../types/admin';
import { TerritorialRegistry } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { INCIDENT_TYPE_META } from '../../../utils/corporateIncidentMetadata';
import { formatBrlAmount } from '../../../utils/currency';
import { useIncidentLocation } from './useIncidentLocation';
import { refreshIncidentCache } from '../services/incidentCache';
import { createIncidentId, incidentCoordinates, incidentStationFields, normalizeIncidentDraft } from '../services/incidentDraft';

export function useCorporateIncidentForm({ isOpen, onClose, companyDomain, availableCompanies, onSelectCompanyDomain, activeIncident, initialCoords, registry, notifySaved }: {
  isOpen: boolean;
  onClose: () => void;
  companyDomain: string;
  availableCompanies: CorporateCompany[];
  onSelectCompanyDomain?: (domain: string) => void;
  activeIncident: CorporatePackageIncident | null;
  initialCoords?: { lat: number; lng: number } | null;
  registry?: TerritorialRegistry | null;
  notifySaved?: (incidentId: string) => void;
}) {
  const { userProfile, firebaseUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const baseDomain = activeIncident?.companyDomain || companyDomain || availableCompanies[0]?.domain || '';
  const [domainChoice, setDomainChoice] = useState({ base: baseDomain, value: baseDomain });
  const targetDomain = domainChoice.base === baseDomain ? domainChoice.value : baseDomain;
  const setTargetDomain = (value: string) => setDomainChoice({ base: baseDomain, value });

  const lifecycle = useRef({ active: false, closeTimer: 0 });
  useEffect(() => {
    const session = { active: isOpen, closeTimer: 0 };
    lifecycle.current = session;
    return () => {
      session.active = false;
      window.clearTimeout(session.closeTimer);
    };
  }, [isOpen, activeIncident?.id]);

  // Form Fields
  const [trackingCode, setTrackingCode] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('1');
  const [packagesDelivered, setPackagesDelivered] = useState('0');
  const [packagesRecovered, setPackagesRecovered] = useState('0');
  const [packagesStolen, setPackagesStolen] = useState('0');
  const [incidentType, setIncidentType] = useState<PackageIncidentType>('roubo_carga');
  const [boNumber, setBoNumber] = useState('');
  const [packageAtStation, setPackageAtStation] = useState(true);
  const [custodyStatus, setCustodyStatus] = useState<PackageCustodyStatus>('em_ocorrencia_delegacia');
  const [estimatedUnitValue, setEstimatedUnitValue] = useState('');
  const [notes, setNotes] = useState('');

  // Timeline / History state
  const [historyEntries, setHistoryEntries] = useState<IncidentHistoryEntry[]>([]);
  const [newHistoryTitle, setNewHistoryTitle] = useState('');
  const [newHistoryStatus, setNewHistoryStatus] = useState<PackageCustodyStatus>('em_ocorrencia_delegacia');
  const [newHistoryDesc, setNewHistoryDesc] = useState('');
  const [isAddingHistory, setIsAddingHistory] = useState(false);

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const location = useIncidentLocation({ isOpen, activeIncident, registry, setErrorMessage, setSuccessMessage });
  const {
    selectedDelegaciaId,
    setSelectedDelegaciaId,
    setAutoMatchInfo,
    addressInput,
    setAddressInput,
    bairroInput,
    setBairroInput,
    latInput,
    setLatInput,
    lngInput,
    setLngInput,
    triggerAutoDelegaciaMatch,
    allDelegacias,
    filteredDelegacias
  } = location;

  // Initialize form state
  const initializeFields = useEffectEvent(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveTab('details');

    if (activeIncident) {
      setTrackingCode(activeIncident.trackingCode || '');
      setCarrierName(activeIncident.carrierName || '');
      setPackageQuantity(String(Math.max(1, Number(activeIncident.packageQuantity) || 1)));
      setPackagesDelivered(String(Math.max(0, Number(activeIncident.packagesDelivered) || 0)));
      setPackagesRecovered(String(Math.max(0, Number(activeIncident.packagesRecovered) || 0)));
      setPackagesStolen(String(Math.max(0, Number(activeIncident.packagesStolen) || 0)));
      setIncidentType(activeIncident.incidentType || 'roubo_carga');
      setBoNumber(activeIncident.boNumber || '');
      setSelectedDelegaciaId(activeIncident.delegaciaId || '');
      setPackageAtStation(activeIncident.packageAtStation ?? true);
      setCustodyStatus(activeIncident.custodyStatus || 'em_ocorrencia_delegacia');
      setEstimatedUnitValue(activeIncident.estimatedValue > 0 ? formatBrlAmount(activeIncident.estimatedValue) : activeIncident.estimatedUnitValue != null ? formatBrlAmount(activeIncident.estimatedUnitValue * Math.max(1, Number(activeIncident.packageQuantity) || 1)) : '');
      setNotes(activeIncident.notes || '');
      setAddressInput(activeIncident.address || '');
      setBairroInput(activeIncident.bairro || '');
      setLatInput(typeof activeIncident.lat === 'number' ? String(activeIncident.lat) : '');
      setLngInput(typeof activeIncident.lng === 'number' ? String(activeIncident.lng) : '');
      setHistoryEntries(activeIncident.history || []);
      setNewHistoryStatus(activeIncident.custodyStatus || 'em_ocorrencia_delegacia');
    } else {
      setTrackingCode('');
      setCarrierName('');
      setPackageQuantity('1');
      setPackagesDelivered('0');
      setPackagesRecovered('0');
      setPackagesStolen('0');
      setIncidentType('roubo_carga');
      setBoNumber('');
      setPackageAtStation(true);
      setCustodyStatus('em_ocorrencia_delegacia');
      setEstimatedUnitValue('');
      setNotes('');
      setAddressInput('');
      setBairroInput('');
      setHistoryEntries([]);
      setNewHistoryStatus('em_ocorrencia_delegacia');

      let matchedStation = false;
      if (initialCoords) {
        setLatInput(initialCoords.lat.toFixed(6));
        setLngInput(initialCoords.lng.toFixed(6));
        matchedStation = Boolean(triggerAutoDelegaciaMatch(initialCoords.lat, initialCoords.lng));
      } else {
        setLatInput('');
        setLngInput('');
        setAutoMatchInfo(null);
      }

      if (!matchedStation && filteredDelegacias.length > 0 && !selectedDelegaciaId) {
        setSelectedDelegaciaId(filteredDelegacias[0].id);
      }
    }
  });

  useEffect(() => {
    if (isOpen) initializeFields();
  }, [isOpen, activeIncident, initialCoords]);


  // Save Incident
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const session = lifecycle.current;
    const domainToUse = activeIncident?.companyDomain || targetDomain || companyDomain;
    if (!userProfile || !domainToUse) {
      setErrorMessage('Acesso não autenticado ou empresa corporativa não identificada.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);

    const fields = normalizeIncidentDraft({
      trackingCode, carrierName, packageQuantity, packagesDelivered, packagesRecovered, packagesStolen,
      incidentType, boNumber, estimatedUnitValue, packageAtStation, custodyStatus, notes
    });
    const cleanCode = fields.trackingCode;
    if (!cleanCode) {
      setErrorMessage('Informe o código do pacote, carga ou rastreio.');
      return;
    }

    const station = allDelegacias.find(item => item.id === selectedDelegaciaId);
    if (!station) {
      setErrorMessage('Selecione a delegacia responsável pela ocorrência.');
      return;
    }

    const enteredLat = parseFloat(latInput.replace(',', '.'));
    const enteredLng = parseFloat(lngInput.replace(',', '.'));
    const hasCoordinates = Number.isFinite(enteredLat) && Number.isFinite(enteredLng) &&
      Math.abs(enteredLat) <= 90 && Math.abs(enteredLng) <= 180;
    const coordinates = incidentCoordinates(
      station.uf, hasCoordinates ? enteredLat : station.lat, hasCoordinates ? enteredLng : station.lng
    );
    const incId = activeIncident?.id || createIncidentId();
    const creatorUid =
      auth.currentUser?.uid ||
      firebaseUser?.uid ||
      userProfile?.uid ||
      'user_unknown';

    const creatorName = (
      firebaseUser?.displayName ||
      userProfile?.displayName ||
      firebaseUser?.email ||
      userProfile?.email ||
      'Administrador'
    ).slice(0, 120);

    // Build initial history if brand new
    let updatedHistory = [...historyEntries];
    if (!activeIncident) {
      updatedHistory = [
        {
          id: `hist_${Date.now()}`,
          date: new Date().toISOString(),
          status: custodyStatus,
          title: `Registro de ${INCIDENT_TYPE_META[incidentType]?.label || 'Ocorrência'}`,
          description: fields.notes || 'Ocorrência cadastrada no Painel de Monitoramento Territorial.',
          authorName: creatorName,
          authorUid: creatorUid
        }
      ];
    }

    const localIncidentRecord: CorporatePackageIncident = {
      id: incId,
      companyDomain: domainToUse,
      ...fields,
      ...incidentStationFields(station),
      ...coordinates,
      address: addressInput.trim().slice(0, 250),
      bairro: bairroInput.trim().slice(0, 120),
      history: updatedHistory,
      createdByUid: creatorUid,
      createdByName: creatorName,
      createdAt: activeIncident?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSaving(true);
    try {
      await saveCorporateIncident(
        domainToUse,
        localIncidentRecord,
        Boolean(activeIncident),
        { uid: creatorUid, name: creatorName, email: firebaseUser?.email || userProfile.email }
      );
      if (activeIncident) {
        setSuccessMessage(`Ocorrência ${cleanCode} atualizada com sucesso! O mapa de calor foi recalculado.`);
      } else {
        setSuccessMessage(`Ocorrência ${cleanCode} registrada com sucesso e integrada ao Mapa de Calor de @${domainToUse}!`);
      }

      if (!activeIncident) refreshIncidentCache(domainToUse, incId, () => localIncidentRecord);
      if (!session.active) return;
      onSelectCompanyDomain?.(domainToUse);

      if (notifySaved) {
        notifySaved(incId);
      }

      session.closeTimer = window.setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      const incidentPath = `corporate_companies/${domainToUse}/incidents/${incId}`;
      reportFirestoreError(err, activeIncident ? OperationType.UPDATE : OperationType.CREATE, incidentPath);
      const errorCode = typeof err?.code === 'string' ? ` (${err.code})` : '';
      const hasEditAccess = isAdmin || userProfile?.companyRole === 'company_admin' || userProfile?.incidentAccess === 'edit';
      const permissionHint = err?.code === 'permission-denied' && !hasEditAccess
        ? ' Esta conta está sem permissão Editar; peça ao ADM da Empresa para habilitá-la.'
        : ` Operação: ${activeIncident ? 'editar' : 'criar'} em ${incidentPath}.`;
      setErrorMessage(`Não foi possível gravar a ocorrência no Firebase${errorCode}.${permissionHint}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Event to History Timeline
  const handleAddHistoryEvent = async (e: FormEvent) => {
    e.preventDefault();
    const domainToUse = activeIncident?.companyDomain || targetDomain || companyDomain;
    if (!activeIncident || !userProfile || !newHistoryTitle.trim() || !domainToUse) return;

    const creatorUid =
      firebaseUser?.uid ||
      userProfile?.uid ||
      (auth.currentUser?.uid as string) ||
      'user_unknown';

    const creatorName = (
      firebaseUser?.displayName ||
      userProfile?.displayName ||
      firebaseUser?.email ||
      userProfile?.email ||
      'Administrador'
    ).slice(0, 120);

    setIsAddingHistory(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const newEntry: IncidentHistoryEntry = {
      id: `hist_${Date.now()}`,
      date: new Date().toISOString(),
      status: newHistoryStatus,
      title: newHistoryTitle.trim().slice(0, 120),
      description: newHistoryDesc.trim().slice(0, 500) || 'Andamento registrado no histórico.',
      authorName: creatorName,
      authorUid: creatorUid
    };

    try {
      const nextHistory = await updateCorporateIncidentHistory(domainToUse, activeIncident, newEntry, {
        uid: creatorUid, name: creatorName, email: firebaseUser?.email || userProfile.email
      });
      refreshIncidentCache(domainToUse, activeIncident.id, previous => previous && ({
        ...previous,
        custodyStatus: newHistoryStatus,
        history: nextHistory,
        updatedAt: new Date().toISOString()
      }));
      setHistoryEntries(nextHistory);
      setCustodyStatus(newHistoryStatus);
      setNewHistoryTitle('');
      setNewHistoryDesc('');
      setSuccessMessage('Andamento adicionado ao histórico da ocorrência com sucesso!');
    } catch (err: any) {
      reportFirestoreError(err, OperationType.UPDATE, `corporate_companies/${domainToUse}/incidents/${activeIncident.id}`);
      const errorCode = typeof err?.code === 'string' ? ` (${err.code})` : '';
      setErrorMessage(`Não foi possível gravar o andamento no Firebase${errorCode}. O histórico não foi alterado.`);
    } finally {
      setIsAddingHistory(false);
    }
  };

  return {
    isAdmin,
    activeTab,
    setActiveTab,
    targetDomain,
    setTargetDomain,
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
    packageAtStation,
    setPackageAtStation,
    custodyStatus,
    setCustodyStatus,
    estimatedUnitValue,
    setEstimatedUnitValue,
    notes,
    setNotes,
    historyEntries,
    newHistoryTitle,
    setNewHistoryTitle,
    newHistoryStatus,
    setNewHistoryStatus,
    newHistoryDesc,
    setNewHistoryDesc,
    isAddingHistory,
    isSaving,
    errorMessage,
    successMessage,
    handleSubmit,
    handleAddHistoryEvent,
    ...location
  };
}
