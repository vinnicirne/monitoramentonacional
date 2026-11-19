import React from 'react';
import { PackageCustodyStatus } from '../../../types/admin';

interface IncidentDispositionFieldsProps {
  estimatedTotal: string;
  onEstimatedTotalChange: (value: string) => void;
  formatCurrencyInput: (value: string) => string;
  custodyStatus: PackageCustodyStatus;
  onCustodyStatusChange: (value: PackageCustodyStatus) => void;
  packageAtStation: boolean;
  onPackageAtStationChange: (value: boolean) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}

export const IncidentDispositionFields: React.FC<IncidentDispositionFieldsProps> = ({
  estimatedTotal,
  onEstimatedTotalChange,
  formatCurrencyInput,
  custodyStatus,
  onCustodyStatusChange,
  packageAtStation,
  onPackageAtStationChange,
  notes,
  onNotesChange
}) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div>
        <label className="block font-bold text-slate-700 mb-1">VALOR TOTAL ESTIMADO (R$)</label>
        <input type="text" inputMode="numeric" value={estimatedTotal}
          onChange={event => onEstimatedTotalChange(formatCurrencyInput(event.target.value))}
          placeholder="Ex: 250,00"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none font-mono text-slate-800" />
      </div>

      <div>
        <label className="block font-bold text-slate-700 mb-1">Status de Custódia Inicial</label>
        <select value={custodyStatus} onChange={event => onCustodyStatusChange(event.target.value as PackageCustodyStatus)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none">
          <option value="em_ocorrencia_delegacia">Na delegacia — em ocorrência policial</option>
          <option value="aguardando_pericia">Na delegacia — aguardando perícia</option>
          <option value="liberado_retirada">Liberado pela delegacia para retirada</option>
          <option value="devolvido_empresa">Devolvido / recuperado pela empresa</option>
          <option value="extraviado_nao_localizado">Extraviado / não localizado</option>
        </select>
      </div>
    </div>

    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
      <input type="checkbox" checked={packageAtStation} onChange={event => onPackageAtStationChange(event.target.checked)}
        className="rounded border-slate-300 text-rose-600 focus:ring-0" />
      <span className="font-semibold text-slate-700">O pacote ou veículo físico está retido no pátio/sala de custódia da delegacia</span>
    </label>

    <div>
      <label className="block font-bold text-slate-700 mb-1">Relato dos Fatos / Descrição da Ocorrência</label>
      <textarea rows={3} value={notes} onChange={event => onNotesChange(event.target.value)}
        placeholder="Descreva detalhes da abordagem, horário aproximado, motorista envolvido, número do veículo ou informações da polícia..."
        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#3483FA] focus:outline-none text-slate-800" />
    </div>
  </>
);
