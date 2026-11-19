import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertCircle, FileText, Plus, RefreshCw, History, Lock } from 'lucide-react';
import { CorporateCompany, CorporatePackageIncident } from '../types/admin';
import { TerritorialRegistry } from '../types';
import { formatBrlInput } from '../utils/currency';
import { IncidentHistoryPanel } from '../features/incidents/components/IncidentHistoryPanel';
import { IncidentPackageFields } from '../features/incidents/components/IncidentPackageFields';
import { IncidentStationSelector } from '../features/incidents/components/IncidentStationSelector';
import { IncidentLocationFields } from '../features/incidents/components/IncidentLocationFields';
import { IncidentDispositionFields } from '../features/incidents/components/IncidentDispositionFields';
import { useCorporateIncidentForm } from '../features/incidents/hooks/useCorporateIncidentForm';

interface CorporateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyDomain: string;
  availableCompanies?: CorporateCompany[];
  registeredCarrierOptions?: string[];
  onSelectCompanyDomain?: (domain: string) => void;
  incidentToEdit?: CorporatePackageIncident | null;
  existingIncident?: CorporatePackageIncident | null;
  initialCoords?: { lat: number; lng: number } | null;
  registry?: TerritorialRegistry | null;
  onIncidentSaved?: (incidentId: string) => void;
  onSaved?: (incidentId: string) => void;
}

export const CorporateIncidentModal: React.FC<CorporateIncidentModalProps> = ({
  isOpen,
  onClose,
  companyDomain,
  availableCompanies = [],
  registeredCarrierOptions = [],
  onSelectCompanyDomain,
  incidentToEdit = null,
  existingIncident = null,
  initialCoords = null,
  registry = null,
  onIncidentSaved,
  onSaved
}) => {
  const activeIncident = incidentToEdit || existingIncident;
  const notifySaved = onIncidentSaved || onSaved;
  const {
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
    delegaciaUfFilter,
    setDelegaciaUfFilter,
    delegaciaSearch,
    setDelegaciaSearch,
    selectedDelegaciaId,
    setSelectedDelegaciaId,
    autoMatchInfo,
    isManuallyOverridden,
    setIsManuallyOverridden,
    addressInput,
    setAddressInput,
    bairroInput,
    setBairroInput,
    latInput,
    setLatInput,
    lngInput,
    setLngInput,
    isSearchingAddress,
    addressSearchResults,
    filteredDelegacias,
    handleSearchAddress,
    handleSelectAddressItem,
    handleUseCurrentLocation,
    handleUseDelegaciaCoords
  } = useCorporateIncidentForm({ isOpen, onClose, companyDomain, availableCompanies, onSelectCompanyDomain, activeIncident, initialCoords, registry, notifySaved });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[96dvh] md:max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-r from-[#2D3277] to-[#1E2355] text-white flex items-start md:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-[#FFE600] shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {activeIncident ? 'Editar Ocorrência Corporativa' : 'Registrar Ocorrência da Empresa'}
                </h3>
                {availableCompanies && availableCompanies.length > 1 && isAdmin ? (
                  <select
                    value={targetDomain}
                    onChange={e => {
                      setTargetDomain(e.target.value);
                      onSelectCompanyDomain?.(e.target.value);
                    }}
                    className="max-w-[60vw] md:max-w-none px-2 py-1 rounded bg-[#FFE600] text-[#2D3277] font-mono font-bold text-[11px] outline-none cursor-pointer border border-[#2D3277]/20"
                    title="Selecione a empresa da ocorrência"
                  >
                    {availableCompanies.map(c => (
                      <option key={c.domain} value={c.domain} className="bg-white text-slate-800">
                        {c.companyName || c.domain} (@{c.domain})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-[#FFE600] text-[#2D3277] font-mono font-bold text-[11px]">
                    @{targetDomain || companyDomain}
                  </span>
                )}
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
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário de ocorrência"
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
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
              <IncidentPackageFields
                incidentType={incidentType}
                onIncidentTypeChange={setIncidentType}
                trackingCode={trackingCode}
                onTrackingCodeChange={setTrackingCode}
                boNumber={boNumber}
                onBoNumberChange={setBoNumber}
                carrierName={carrierName}
                onCarrierNameChange={setCarrierName}
                registeredCarrierOptions={registeredCarrierOptions}
                packageQuantity={packageQuantity}
                onPackageQuantityChange={setPackageQuantity}
                packagesDelivered={packagesDelivered}
                onPackagesDeliveredChange={setPackagesDelivered}
                packagesRecovered={packagesRecovered}
                onPackagesRecoveredChange={setPackagesRecovered}
                packagesStolen={packagesStolen}
                onPackagesStolenChange={setPackagesStolen}
              />

              <IncidentLocationFields
                address={addressInput}
                onAddressChange={setAddressInput}
                isSearching={isSearchingAddress}
                onSearch={handleSearchAddress}
                searchResults={addressSearchResults}
                onSelectResult={handleSelectAddressItem}
                onUseCurrentLocation={handleUseCurrentLocation}
                onUseStationCoordinates={handleUseDelegaciaCoords}
                neighborhood={bairroInput}
                onNeighborhoodChange={setBairroInput}
                latitude={latInput}
                onLatitudeChange={setLatInput}
                longitude={lngInput}
                onLongitudeChange={setLngInput}
              />

              <IncidentStationSelector
                delegacias={filteredDelegacias}
                selectedId={selectedDelegaciaId}
                onSelect={id => {
                  setSelectedDelegaciaId(id);
                  setIsManuallyOverridden(true);
                }}
                ufFilter={delegaciaUfFilter}
                onUfFilterChange={setDelegaciaUfFilter}
                search={delegaciaSearch}
                onSearchChange={setDelegaciaSearch}
                autoMatchInfo={autoMatchInfo}
                manuallyOverridden={isManuallyOverridden}
                onRestoreAutoMatch={() => {
                  if (!autoMatchInfo) return;
                  setSelectedDelegaciaId(autoMatchInfo.delegaciaId);
                  setIsManuallyOverridden(false);
                  if (delegaciaUfFilter !== 'TODAS' && delegaciaUfFilter !== autoMatchInfo.uf) {
                    setDelegaciaUfFilter(autoMatchInfo.uf);
                  }
                }}
              />

              <IncidentDispositionFields
                estimatedTotal={estimatedUnitValue}
                onEstimatedTotalChange={setEstimatedUnitValue}
                formatCurrencyInput={formatBrlInput}
                custodyStatus={custodyStatus}
                onCustodyStatusChange={setCustodyStatus}
                packageAtStation={packageAtStation}
                onPackageAtStationChange={setPackageAtStation}
                notes={notes}
                onNotesChange={setNotes}
              />

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
            <IncidentHistoryPanel
              historyEntries={historyEntries}
              title={newHistoryTitle}
              status={newHistoryStatus}
              description={newHistoryDesc}
              isAdding={isAddingHistory}
              onTitleChange={setNewHistoryTitle}
              onStatusChange={setNewHistoryStatus}
              onDescriptionChange={setNewHistoryDesc}
              onSubmit={handleAddHistoryEvent}
            />
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
