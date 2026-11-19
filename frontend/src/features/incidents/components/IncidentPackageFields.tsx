import React from 'react';
import { PackageIncidentType } from '../../../types/admin';
import { INCIDENT_TYPE_META } from '../../../utils/corporateIncidentMetadata';

interface IncidentPackageFieldsProps {
  incidentType: PackageIncidentType;
  onIncidentTypeChange: (type: PackageIncidentType) => void;
  trackingCode: string;
  onTrackingCodeChange: (value: string) => void;
  boNumber: string;
  onBoNumberChange: (value: string) => void;
  carrierName: string;
  onCarrierNameChange: (value: string) => void;
  registeredCarrierOptions: string[];
  packageQuantity: string;
  onPackageQuantityChange: (value: string) => void;
  packagesDelivered: string;
  onPackagesDeliveredChange: (value: string) => void;
  packagesRecovered: string;
  onPackagesRecoveredChange: (value: string) => void;
  packagesStolen: string;
  onPackagesStolenChange: (value: string) => void;
}

export const IncidentPackageFields: React.FC<IncidentPackageFieldsProps> = ({
  incidentType,
  onIncidentTypeChange,
  trackingCode,
  onTrackingCodeChange,
  boNumber,
  onBoNumberChange,
  carrierName,
  onCarrierNameChange,
  registeredCarrierOptions,
  packageQuantity,
  onPackageQuantityChange,
  packagesDelivered,
  onPackagesDeliveredChange,
  packagesRecovered,
  onPackagesRecoveredChange,
  packagesStolen,
  onPackagesStolenChange
}) => (
  <>
    <div>
      <label className="block font-bold text-slate-700 mb-1.5">Tipo de Ocorrência *</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {(Object.keys(INCIDENT_TYPE_META) as PackageIncidentType[]).map(typeKey => {
          const meta = INCIDENT_TYPE_META[typeKey];
          const isSelected = incidentType === typeKey;
          return (
            <button type="button" key={typeKey} onClick={() => onIncidentTypeChange(typeKey)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected ? 'border-[#2D3277] bg-[#2D3277]/5 ring-1 ring-[#2D3277]' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`font-bold text-[11px] ${isSelected ? 'text-[#2D3277]' : 'text-slate-800'}`}>
                  {meta.label}
                </span>
                {meta.isRoubo && <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" title="Roubo (Peso Alto no Mapa de Calor)" />}
              </div>
              <span className="text-[10px] text-slate-500 line-clamp-2">{meta.description}</span>
            </button>
          );
        })}
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div>
        <label className="block font-bold text-slate-700 mb-1">Código de Rastreio / Pacote / Placa / NF *</label>
        <input type="text" value={trackingCode} onChange={event => onTrackingCodeChange(event.target.value)}
          placeholder="Ex: BR99281726BR ou Placa: XYZ-9090" required
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800" />
      </div>
      <div>
        <label className="block font-bold text-slate-700 mb-1">Número do Boletim de Ocorrência (B.O.)</label>
        <input type="text" value={boNumber} onChange={event => onBoNumberChange(event.target.value)}
          placeholder="Ex: 021-04982/2026"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800" />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div>
        <label className="block font-bold text-slate-700 mb-1">Transportadora</label>
        <input type="text" value={carrierName} onChange={event => onCarrierNameChange(event.target.value)}
          list="corporate-carrier-options" maxLength={120} placeholder="Digite ou cadastre o nome da transportadora"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none text-slate-800" />
        <datalist id="corporate-carrier-options">
          {registeredCarrierOptions.map(carrier => <option key={carrier} value={carrier} />)}
        </datalist>
      </div>
      <div>
        <label className="block font-bold text-slate-700 mb-1">Quantidade de pacotes envolvidos</label>
        <input type="number" min="1" max="100000" step="1" required value={packageQuantity}
          onChange={event => onPackageQuantityChange(event.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800" />
        <p className="mt-1 text-[10px] text-slate-500">Os totais de pacotes e valores são calculados automaticamente conforme a quantidade informada.</p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {([
        ['Pacotes Entregues', packagesDelivered, onPackagesDeliveredChange],
        ['Pacotes Recuperados', packagesRecovered, onPackagesRecoveredChange],
        ['Pacotes Roubados', packagesStolen, onPackagesStolenChange]
      ] as const).map(([label, value, onChange]) => (
        <div key={label}>
          <label className="block font-bold text-slate-700 mb-1">{label}</label>
          <input type="number" min="0" max={packageQuantity} step="1" value={value}
            onChange={event => onChange(event.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800" />
        </div>
      ))}
    </div>
  </>
);
