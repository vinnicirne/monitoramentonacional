import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  Navigation,
  History,
  Send,
  Lock,
  Layers
} from 'lucide-react';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import {
  CorporatePackageIncident,
  IncidentHistoryEntry,
  OperationType,
  PackageCustodyStatus,
  PackageIncidentType
} from '../types/admin';
import { TerritorialRegistry } from '../types';
import { DELEGACIAS_MG_ES_DATA } from '../data/delegaciasMgEsData';
import { useAuth } from '../contexts/AuthContext';
import { searchAddressesFree } from '../utils/geocoding';

interface CorporateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyDomain: string;
  incidentToEdit?: CorporatePackageIncident | null;
  existingIncident?: CorporatePackageIncident | null;
  initialCoords?: { lat: number; lng: number } | null;
  registry?: TerritorialRegistry | null;
  onIncidentSaved?: (incidentId: string) => void;
  onSaved?: (incidentId: string) => void;
}

export const INCIDENT_TYPE_META: Record<
  PackageIncidentType,
  { label: string; badgeClass: string; isRoubo: boolean; description: string }
> = {
  roubo_carga: {
    label: 'Roubo de Carga',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    isRoubo: true,
    description: 'Subtração de veículo ou mercadoria mediante violência ou grave ameaça.'
  },
  roubo: {
    label: 'Roubo / Assalto',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    isRoubo: true,
    description: 'Assalto à mão armada, abordagem a entregador ou motorista.'
  },
  furto: {
    label: 'Furto',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    isRoubo: false,
    description: 'Subtração de carga ou pertence sem violência física direta.'
  },
  fraude: {
    label: 'Fraude / Golpe',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    isRoubo: false,
    description: 'Apropriação indébita, documento falso, entrega desviada ou estelionato.'
  },
  extravio: {
    label: 'Extravio de Carga/Pacote',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    isRoubo: false,
    description: 'Pacote não localizado no fluxo operacional de transporte ou transferência.'
  },
  apreensao: {
    label: 'Apreensão Policial',
    badgeClass: 'bg-[#2D3277]/10 text-[#2D3277] border-[#2D3277]/20',
    isRoubo: false,
    description: 'Carga ou veículo retido por autoridade policial para averiguação ou perícia.'
  },
  outros: {
    label: 'Outros Incidentes',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    isRoubo: false,
    description: 'Outras ocorrências operacionais relevantes para a empresa.'
  }
};

const CUSTODY_LABELS: Record<PackageCustodyStatus, { label: string; short: string; badge: string }> = {
  em_ocorrencia_delegacia: {
    label: 'Na delegacia — em ocorrência policial',
    short: 'Em Ocorrência na DP',
    badge: 'bg-rose-100 text-rose-800'
  },
  aguardando_pericia: {
    label: 'Na delegacia — aguardando perícia',
    short: 'Aguardando Perícia',
    badge: 'bg-amber-100 text-amber-800'
  },
  liberado_retirada: {
    label: 'Liberado pela delegacia para retirada',
    short: 'Liberado p/ Retirada',
    badge: 'bg-[#3483FA]/15 text-[#2968C8]'
  },
  devolvido_empresa: {
    label: 'Devolvido / recuperado pela empresa',
    short: 'Devolvido à Empresa',
    badge: 'bg-[#00A650]/15 text-[#008744]'
  },
  extraviado_nao_localizado: {
    label: 'Extraviado / não localizado',
    short: 'Não Localizado',
    badge: 'bg-slate-200 text-slate-700'
  }
};

export const CorporateIncidentModal: React.FC<CorporateIncidentModalProps> = ({
  isOpen,
  onClose,
  companyDomain,
  incidentToEdit = null,
  existingIncident = null,
  initialCoords = null,
  registry = null,
  onIncidentSaved,
  onSaved
}) => {
  const activeIncident = incidentToEdit || existingIncident;
  const notifySaved = onIncidentSaved || onSaved;
  const { userProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Form Fields
  const [trackingCode, setTrackingCode] = useState('');
  const [incidentType, setIncidentType] = useState<PackageIncidentType>('roubo_carga');
  const [boNumber, setBoNumber] = useState('');
  const [delegaciaUfFilter, setDelegaciaUfFilter] = useState<'TODAS' | 'RJ' | 'MG' | 'ES'>('TODAS');
  const [delegaciaSearch, setDelegaciaSearch] = useState('');
  const [selectedDelegaciaId, setSelectedDelegaciaId] = useState('');
  const [packageAtStation, setPackageAtStation] = useState(true);
  const [custodyStatus, setCustodyStatus] = useState<PackageCustodyStatus>('em_ocorrencia_delegacia');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [notes, setNotes] = useState('');

  // Geographic fields
  const [addressInput, setAddressInput] = useState('');
  const [bairroInput, setBairroInput] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSearchResults, setAddressSearchResults] = useState<any[]>([]);

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

  // Delegacias catalog
  const allDelegacias = useMemo(() => {
    const list: Array<{ id: string; uf: string; name: string; municipio: string; lat?: number; lng?: number }> = [];

    if (registry?.cisps) {
      Object.values(registry.cisps)
        .sort((a, b) => a.cisp - b.cisp)
        .forEach(c => {
          list.push({
            id: `RJ_CISP_${c.cisp}`,
            uf: 'RJ',
            name: `${c.cisp}ª DP — ${c.nome_oficial}`,
            municipio: c.municipio,
            lat: c.centroide ? c.centroide[1] : undefined,
            lng: c.centroide ? c.centroide[0] : undefined
          });
        });
    }

    DELEGACIAS_MG_ES_DATA.forEach(del => {
      list.push({
        id: del.id,
        uf: del.uf,
        name: `${del.nomeCurto} — ${del.nome}`,
        municipio: del.municipio,
        lat: del.latitude,
        lng: del.longitude
      });
    });

    return list;
  }, [registry]);

  const filteredDelegacias = useMemo(() => {
    const q = delegaciaSearch.trim().toLowerCase();
    return allDelegacias.filter(d => {
      if (delegaciaUfFilter !== 'TODAS' && d.uf !== delegaciaUfFilter) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.municipio.toLowerCase().includes(q);
    });
  }, [allDelegacias, delegaciaUfFilter, delegaciaSearch]);

  // Initialize form state
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveTab('details');

    if (activeIncident) {
      setTrackingCode(activeIncident.trackingCode || '');
      setIncidentType(activeIncident.incidentType || 'roubo_carga');
      setBoNumber(activeIncident.boNumber || '');
      setSelectedDelegaciaId(activeIncident.delegaciaId || '');
      setPackageAtStation(activeIncident.packageAtStation ?? true);
      setCustodyStatus(activeIncident.custodyStatus || 'em_ocorrencia_delegacia');
      setEstimatedValue(activeIncident.estimatedValue ? String(activeIncident.estimatedValue) : '');
      setNotes(activeIncident.notes || '');
      setAddressInput(activeIncident.address || '');
      setBairroInput(activeIncident.bairro || '');
      setLatInput(typeof activeIncident.lat === 'number' ? String(activeIncident.lat) : '');
      setLngInput(typeof activeIncident.lng === 'number' ? String(activeIncident.lng) : '');
      setHistoryEntries(activeIncident.history || []);
      setNewHistoryStatus(activeIncident.custodyStatus || 'em_ocorrencia_delegacia');
    } else {
      setTrackingCode('');
      setIncidentType('roubo_carga');
      setBoNumber('');
      setPackageAtStation(true);
      setCustodyStatus('em_ocorrencia_delegacia');
      setEstimatedValue('');
      setNotes('');
      setAddressInput('');
      setBairroInput('');
      setHistoryEntries([]);
      setNewHistoryStatus('em_ocorrencia_delegacia');

      if (initialCoords) {
        setLatInput(initialCoords.lat.toFixed(6));
        setLngInput(initialCoords.lng.toFixed(6));
      } else {
        setLatInput('');
        setLngInput('');
      }

      if (filteredDelegacias.length > 0 && !selectedDelegaciaId) {
        setSelectedDelegaciaId(filteredDelegacias[0].id);
      }
    }
  }, [isOpen, activeIncident, initialCoords]);

  if (!isOpen) return null;

  // Handle Geocoding Search
  const handleSearchAddress = async () => {
    if (!addressInput.trim()) return;
    setIsSearchingAddress(true);
    setErrorMessage(null);
    try {
      const results = await searchAddressesFree(addressInput.trim(), undefined, { scope: 'TODOS' });
      setAddressSearchResults(results);
      if (results.length > 0) {
        const first = results[0];
        setLatInput(first.lat.toFixed(6));
        setLngInput(first.lng.toFixed(6));
        if (first.subtitle) setBairroInput(first.subtitle.split('·')[0].trim());
      } else {
        setErrorMessage('Nenhum endereço encontrado para a busca informada.');
      }
    } catch {
      setErrorMessage('Falha na busca de endereço. Verifique sua conexão.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Handle Current GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocalização não suportada pelo seu navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatInput(pos.coords.latitude.toFixed(6));
        setLngInput(pos.coords.longitude.toFixed(6));
        setSuccessMessage('Coordenadas capturadas via GPS com sucesso!');
      },
      err => {
        setErrorMessage(`Não foi possível obter sua localização: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fallback: use Delegacia coordinates if lat/lng are empty
  const handleUseDelegaciaCoords = () => {
    const d = allDelegacias.find(del => del.id === selectedDelegaciaId);
    if (d?.lat != null && d?.lng != null) {
      setLatInput(d.lat.toFixed(6));
      setLngInput(d.lng.toFixed(6));
      setBairroInput(d.municipio);
      setSuccessMessage(`Coordenadas da delegacia "${d.name}" aplicadas.`);
    } else {
      setErrorMessage('A delegacia selecionada não possui coordenadas cadastradas.');
    }
  };

  // Save Incident
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !companyDomain) {
      setErrorMessage('Acesso não autenticado ou empresa não identificada.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = trackingCode.trim().slice(0, 80);
    if (!cleanCode) {
      setErrorMessage('Informe o código do pacote, carga ou rastreio.');
      return;
    }

    const chosenDelegacia = allDelegacias.find(d => d.id === selectedDelegaciaId);
    if (!chosenDelegacia) {
      setErrorMessage('Selecione a delegacia responsável pela ocorrência.');
      return;
    }

    // Latitude & Longitude resolution
    let finalLat = parseFloat(latInput.replace(',', '.'));
    let finalLng = parseFloat(lngInput.replace(',', '.'));

    if (Number.isNaN(finalLat) || Number.isNaN(finalLng)) {
      if (chosenDelegacia.lat != null && chosenDelegacia.lng != null) {
        finalLat = chosenDelegacia.lat;
        finalLng = chosenDelegacia.lng;
      } else {
        finalLat = -22.9068;
        finalLng = -43.1729;
      }
    }

    const cleanBo = boNumber.trim().slice(0, 64);
    const numValue = Math.max(0, Number(estimatedValue.replace(',', '.')) || 0);
    const cleanNotes = notes.trim().slice(0, 1000);
    const cleanAddress = addressInput.trim().slice(0, 250);
    const cleanBairro = bairroInput.trim().slice(0, 120);

    const incId =
      activeIncident?.id ||
      `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    // Build initial history if brand new
    let updatedHistory = [...historyEntries];
    if (!activeIncident) {
      updatedHistory = [
        {
          id: `hist_${Date.now()}`,
          date: new Date().toISOString(),
          status: custodyStatus,
          title: `Registro de ${INCIDENT_TYPE_META[incidentType]?.label || 'Ocorrência'}`,
          description: cleanNotes || 'Ocorrência cadastrada no Painel de Monitoramento Territorial.',
          authorName: userProfile.displayName || userProfile.email,
          authorUid: userProfile.uid
        }
      ];
    }

    setIsSaving(true);
    try {
      if (activeIncident) {
        await updateDoc(doc(db, 'corporate_companies', companyDomain, 'incidents', incId), {
          trackingCode: cleanCode,
          incidentType,
          boNumber: cleanBo,
          delegaciaId: chosenDelegacia.id.slice(0, 64),
          delegaciaName: chosenDelegacia.name.slice(0, 160),
          delegaciaUf: chosenDelegacia.uf.slice(0, 8),
          delegaciaMunicipio: chosenDelegacia.municipio.slice(0, 100),
          packageAtStation,
          custodyStatus,
          estimatedValue: numValue,
          notes: cleanNotes,
          lat: finalLat,
          lng: finalLng,
          address: cleanAddress,
          bairro: cleanBairro,
          history: updatedHistory,
          updatedAt: serverTimestamp()
        });
        setSuccessMessage(`Ocorrência ${cleanCode} atualizada com sucesso! O mapa de calor foi recalculado.`);
      } else {
        await setDoc(doc(db, 'corporate_companies', companyDomain, 'incidents', incId), {
          id: incId,
          companyDomain: companyDomain,
          trackingCode: cleanCode,
          incidentType,
          boNumber: cleanBo,
          delegaciaId: chosenDelegacia.id.slice(0, 64),
          delegaciaName: chosenDelegacia.name.slice(0, 160),
          delegaciaUf: chosenDelegacia.uf.slice(0, 8),
          delegaciaMunicipio: chosenDelegacia.municipio.slice(0, 100),
          packageAtStation,
          custodyStatus,
          estimatedValue: numValue,
          notes: cleanNotes,
          lat: finalLat,
          lng: finalLng,
          address: cleanAddress,
          bairro: cleanBairro,
          history: updatedHistory,
          createdByUid: userProfile.uid,
          createdByName: (userProfile.displayName || userProfile.email).slice(0, 120),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setSuccessMessage(`Ocorrência ${cleanCode} registrada com sucesso e integrada ao Mapa de Calor de @${companyDomain}!`);
      }

      if (notifySaved) {
        notifySaved(incId);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao registrar a ocorrência.');
      handleFirestoreError(
        err,
        activeIncident ? OperationType.UPDATE : OperationType.CREATE,
        `corporate_companies/${companyDomain}/incidents/${incId}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Add Event to History Timeline
  const handleAddHistoryEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident || !userProfile || !newHistoryTitle.trim()) return;

    setIsAddingHistory(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const newEntry: IncidentHistoryEntry = {
      id: `hist_${Date.now()}`,
      date: new Date().toISOString(),
      status: newHistoryStatus,
      title: newHistoryTitle.trim().slice(0, 120),
      description: newHistoryDesc.trim().slice(0, 500) || 'Andamento registrado no histórico.',
      authorName: userProfile.displayName || userProfile.email,
      authorUid: userProfile.uid
    };

    const nextHistory = [newEntry, ...historyEntries];

    try {
      await updateDoc(doc(db, 'corporate_companies', companyDomain, 'incidents', activeIncident.id), {
        custodyStatus: newHistoryStatus,
        history: nextHistory,
        updatedAt: serverTimestamp()
      });

      setHistoryEntries(nextHistory);
      setCustodyStatus(newHistoryStatus);
      setNewHistoryTitle('');
      setNewHistoryDesc('');
      setSuccessMessage('Andamento adicionado ao histórico da ocorrência com sucesso!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao salvar andamento.');
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `corporate_companies/${companyDomain}/incidents/${activeIncident.id}`
      );
    } finally {
      setIsAddingHistory(false);
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'agora';
    try {
      const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
      return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-[#2D3277] to-[#1E2355] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-[#FFE600] shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white">
                  {activeIncident ? 'Editar Ocorrência Corporativa' : 'Registrar Ocorrência da Empresa'}
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#FFE600] text-[#2D3277] font-mono font-bold text-[11px]">
                  @{companyDomain}
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/90 text-[10px] font-bold uppercase flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#FFE600]" />
                  Apenas Usuários da Empresa
                </span>
              </div>
              <p className="text-xs text-white/75 mt-0.5">
                Alimenta o mapa de calor e histórico confidencial da sua transportadora/empresa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs if editing */}
        {activeIncident && (
          <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'details'
                  ? 'border-[#2D3277] text-[#2D3277]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dados da Ocorrência</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-[#2D3277] text-[#2D3277]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Histórico & Andamentos ({historyEntries.length})</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Incident Type Select Grid */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tipo de Ocorrência *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {(Object.keys(INCIDENT_TYPE_META) as PackageIncidentType[]).map(typeKey => {
                    const meta = INCIDENT_TYPE_META[typeKey];
                    const isSelected = incidentType === typeKey;
                    return (
                      <button
                        type="button"
                        key={typeKey}
                        onClick={() => setIncidentType(typeKey)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#2D3277] bg-[#2D3277]/5 ring-1 ring-[#2D3277]'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`font-bold text-[11px] ${
                              isSelected ? 'text-[#2D3277]' : 'text-slate-800'
                            }`}
                          >
                            {meta.label}
                          </span>
                          {meta.isRoubo && (
                            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" title="Roubo (Peso Alto no Mapa de Calor)" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 line-clamp-2">
                          {meta.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Identifiers (Tracking Code / Vehicle / B.O.) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Código de Rastreio / Pacote / Placa / NF *
                  </label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={e => setTrackingCode(e.target.value)}
                    placeholder="Ex: BR99281726BR ou Placa: XYZ-9090"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Número do Boletim de Ocorrência (B.O.)
                  </label>
                  <input
                    type="text"
                    value={boNumber}
                    onChange={e => setBoNumber(e.target.value)}
                    placeholder="Ex: 021-04982/2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Delegacia Responsável Selection */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#2D3277]" />
                    <span>Delegacia de Polícia Responsável *</span>
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    {(['TODAS', 'RJ', 'MG', 'ES'] as const).map(uf => (
                      <button
                        key={uf}
                        type="button"
                        onClick={() => setDelegaciaUfFilter(uf)}
                        className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                          delegaciaUfFilter === uf
                            ? 'bg-[#2D3277] text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        {uf}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={delegaciaSearch}
                      onChange={e => setDelegaciaSearch(e.target.value)}
                      placeholder="Buscar por nome da DP ou município..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none"
                    />
                  </div>
                  <select
                    value={selectedDelegaciaId}
                    onChange={e => setSelectedDelegaciaId(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none"
                  >
                    {filteredDelegacias.map(del => (
                      <option key={del.id} value={del.id}>
                        [{del.uf}] {del.name} ({del.municipio})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Geographic Coordinates & Heatmap Placement */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>Localização Exata (Ponto no Mapa de Calor)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="Usar GPS Atual"
                    >
                      <Navigation className="w-3 h-3 text-[#3483FA]" />
                      <span>GPS Atual</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUseDelegaciaCoords}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="Copiar Coordenadas da Delegacia"
                    >
                      <Building2 className="w-3 h-3 text-[#2D3277]" />
                      <span>Coord. DP</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={e => setAddressInput(e.target.value)}
                    placeholder="Logradouro ou ponto de referência (ex: Av. Brasil, altura Pavuna)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-[#3483FA] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={isSearchingAddress}
                    className="px-3 py-2 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                  >
                    {isSearchingAddress ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Geocodificar</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[10px] font-bold">Bairro</label>
                    <input
                      type="text"
                      value={bairroInput}
                      onChange={e => setBairroInput(e.target.value)}
                      placeholder="Ex: Pavuna, Bonsucesso"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[10px] font-bold">Latitude (ex: -22.8123)</label>
                    <input
                      type="text"
                      value={latInput}
                      onChange={e => setLatInput(e.target.value)}
                      placeholder="-22.812300"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 text-[10px] font-bold">Longitude (ex: -43.3456)</label>
                    <input
                      type="text"
                      value={lngInput}
                      onChange={e => setLngInput(e.target.value)}
                      placeholder="-43.345600"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Financial value & Custody status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor Estimado da Carga / Prejuízo (R$)
                  </label>
                  <input
                    type="text"
                    value={estimatedValue}
                    onChange={e => setEstimatedValue(e.target.value)}
                    placeholder="Ex: 25000.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status de Custódia Inicial
                  </label>
                  <select
                    value={custodyStatus}
                    onChange={e => setCustodyStatus(e.target.value as PackageCustodyStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="em_ocorrencia_delegacia">Na delegacia — em ocorrência policial</option>
                    <option value="aguardando_pericia">Na delegacia — aguardando perícia</option>
                    <option value="liberado_retirada">Liberado pela delegacia para retirada</option>
                    <option value="devolvido_empresa">Devolvido / recuperado pela empresa</option>
                    <option value="extraviado_nao_localizado">Extraviado / não localizado</option>
                  </select>
                </div>
              </div>

              {/* Package at Station Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={packageAtStation}
                  onChange={e => setPackageAtStation(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-0"
                />
                <span className="font-semibold text-slate-700">
                  O pacote ou veículo físico está retido no pátio/sala de custódia da delegacia
                </span>
              </label>

              {/* Notes / Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Relato dos Fatos / Descrição da Ocorrência
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Descreva detalhes da abordagem, horário aproximado, motorista envolvido, número do veículo ou informações da polícia..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none text-slate-800"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-[#00A650] hover:bg-[#008744] text-white font-extrabold shadow-md transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando Ocorrência...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{activeIncident ? 'Salvar Alterações' : 'Registrar Ocorrência e Plotar no Mapa'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* History & Timeline Tab */
            <div className="space-y-5">
              {/* Add New History Entry Form */}
              <form onSubmit={handleAddHistoryEvent} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <span className="font-extrabold text-[#2D3277] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#00A650]" />
                  <span>Adicionar Novo Andamento ao Histórico</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-bold">Título do Andamento *</label>
                    <input
                      type="text"
                      value={newHistoryTitle}
                      onChange={e => setNewHistoryTitle(e.target.value)}
                      placeholder="Ex: Carga periciada e liberada"
                      required
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-bold">Atualizar Status de Custódia</label>
                    <select
                      value={newHistoryStatus}
                      onChange={e => setNewHistoryStatus(e.target.value as PackageCustodyStatus)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold focus:outline-none"
                    >
                      <option value="em_ocorrencia_delegacia">Em ocorrência na DP</option>
                      <option value="aguardando_pericia">Aguardando perícia</option>
                      <option value="liberado_retirada">Liberado p/ retirada</option>
                      <option value="devolvido_empresa">Devolvido à empresa</option>
                      <option value="extraviado_nao_localizado">Não localizado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-bold">Observações / Detalhes do Andamento</label>
                  <textarea
                    rows={2}
                    value={newHistoryDesc}
                    onChange={e => setNewHistoryDesc(e.target.value)}
                    placeholder="Informe despacho policial, contato com a delegacia, laudo ou procedimento..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingHistory || !newHistoryTitle.trim()}
                    className="px-4 py-2 rounded-xl bg-[#2D3277] hover:bg-[#1E2355] text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isAddingHistory ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Registrar Andamento</span>
                  </button>
                </div>
              </form>

              {/* Timeline list */}
              <div className="space-y-3">
                <span className="font-extrabold text-[#2D3277] text-xs block">
                  Linha do Tempo de Ocorrência ({historyEntries.length})
                </span>

                {historyEntries.length === 0 ? (
                  <p className="text-xs text-slate-400 p-6 text-center">Nenhum andamento registrado até o momento.</p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {historyEntries.map((hist, idx) => {
                      const custodyMeta = CUSTODY_LABELS[hist.status] || CUSTODY_LABELS.em_ocorrencia_delegacia;
                      return (
                        <div key={hist.id || idx} className="relative space-y-1 text-xs">
                          <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#3483FA] border-2 border-white shadow-xs" />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[#2D3277]">{hist.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${custodyMeta.badge}`}>
                              {custodyMeta.short}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatTimestamp(hist.date)} por {hist.authorName}
                            </span>
                          </div>
                          {hist.description && (
                            <p className="text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 leading-relaxed">
                              {hist.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Dados isolados confidencialmente para <strong>@{companyDomain}</strong></span>
          </span>
          <span>Agência Ícone Digital by Vinicius Cirne</span>
        </div>
      </div>
    </div>
  );
};
