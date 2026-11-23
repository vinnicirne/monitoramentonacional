import { CarFront, Phone, X } from 'lucide-react';
import type { DriverPosition } from '../services/driveCompanyApi';

export default function DriverDetails({ driver, onClose }: { driver: DriverPosition; onClose: () => void }) {
  return <aside aria-label="Ficha do motorista" className="w-full shrink-0 border-slate-200 bg-white p-4 shadow-lg md:w-72 md:border-l">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><CarFront className="h-4 w-4" aria-hidden="true" /> Motorista</p>
        <h3 className="mt-1 break-words text-lg font-extrabold text-[#2D3277]">{driver.name}</h3>
      </div>
      <button type="button" aria-label="Fechar ficha do motorista" className="rounded-xl p-2 text-slate-700 hover:bg-slate-100" onClick={onClose}>
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
    <dl className="mt-4 space-y-2 text-sm">
      <div><dt className="font-semibold">Telefone</dt><dd>{driver.phone
        ? <a className="inline-flex items-center gap-1 text-blue-800 underline" href={'tel:' + driver.phone}><Phone className="h-3.5 w-3.5" aria-hidden="true" />{driver.phone}</a>
        : 'Não informado'}</dd></div>
      <div><dt className="font-semibold">Última posição</dt><dd>{new Date(driver.updatedAt).toLocaleTimeString('pt-BR')}</dd></div>
      <div><dt className="font-semibold">Rota</dt><dd>{driver.route.length >= 4 ? 'Em andamento' : 'Sem rota em andamento'}</dd></div>
    </dl>
  </aside>;
}
