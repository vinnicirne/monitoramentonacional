import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { AlertTriangle, MapPin, Phone } from 'lucide-react';
import { driveOrigin, requestDrive } from '../services/driveCompanyApi';

import { watchCompanySos, type SosAlert } from '../services/companySosStream';

export default function CompanySosAlerts({ user, domain, includeBranches, onLocate }: {
  user: User;
  domain: string;
  includeBranches: boolean;
  onLocate?: (lat: number, lng: number) => void;
}) {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string>();
  const acknowledged = useRef(new Set<string>());

  useEffect(() => {
    if (!driveOrigin) return;
    const controller = new AbortController();
    let running = false;
    let timer: number | undefined;

    function apply(rows: SosAlert[]) {
      return rows.filter(alert => !acknowledged.current.has(alert.companyDomain + '/' + alert.id))
        .sort((a, b) => b.createdAt - a.createdAt);
    }

    async function connect() {
      if (running || controller.signal.aborted) return;
      running = true;
      window.clearTimeout(timer);
      let rotating = false;
      let delay = 300;
      try {
        await watchCompanySos(user, domain, includeBranches, controller.signal, frame => {
          if (controller.signal.aborted) return;
          if ('reconnect' in frame) {
            rotating = true;
          } else if ('domains' in frame) {
            setAlerts(rows => rows.filter(alert => frame.domains.includes(alert.companyDomain)));
          } else {
            setAlerts(rows => apply([...rows.filter(alert => alert.companyDomain !== frame.domain), ...frame.alerts]));
            setUnavailable(false);
          }
        });
      } catch (failure) {
        if (!controller.signal.aborted && failure instanceof Error && 'status' in failure &&
          (failure.status === 401 || failure.status === 403)) setAlerts([]);
      }
      if (!controller.signal.aborted && !rotating) {
        delay = 6000;
        try {
          const rows = await requestDrive<SosAlert[]>(
            user, domain, includeBranches ? 'sos?tree=1' : 'sos', undefined, controller.signal
          );
          if (!controller.signal.aborted) {
            setAlerts(apply(rows));
            setUnavailable(false);
          }
        } catch (failure) {
          if (!controller.signal.aborted) {
            if (failure instanceof Error && 'status' in failure && (failure.status === 401 || failure.status === 403)) setAlerts([]);
            setUnavailable(true);
          }
        }
      }
      running = false;
      if (!controller.signal.aborted) timer = window.setTimeout(connect, delay);
    }

    window.addEventListener('online', connect);
    void connect();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      window.removeEventListener('online', connect);
    };
  }, [user, domain, includeBranches]);

  async function acknowledge(alert: SosAlert) {
    const key = alert.companyDomain + '/' + alert.id;
    setUpdating(key);
    setError('');
    try {
      await requestDrive(user, alert.companyDomain, 'sos-atendido', { id: alert.id });
      acknowledged.current.add(key);
      setAlerts(rows => rows.filter(row => row.companyDomain + '/' + row.id !== key));
    } catch {
      setError('Não foi possível marcar o SOS como atendido. Tente novamente.');
    } finally {
      setUpdating(undefined);
    }
  }

  return <section aria-label="Alertas SOS" aria-live="polite">
    {unavailable && <p className="mb-2 text-sm font-medium text-rose-800">Monitor de SOS sem atualização. Tentando reconectar.</p>}
    {alerts.length > 0 && <div className="space-y-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-950">
      <h3 className="flex items-center gap-2 text-base font-extrabold"><AlertTriangle size={20} aria-hidden="true" /> Alertas SOS ({alerts.length})</h3>
      {error && <p role="alert" className="text-sm">{error}</p>}
      <ul className="divide-y divide-rose-200">
        {alerts.map(alert => {
          const position = alert.location?.position;
          return <li key={alert.companyDomain + '/' + alert.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <strong className="block break-words">{alert.driverName}</strong>
              <span className="text-sm">{alert.companyName} · {new Date(alert.createdAt).toLocaleString('pt-BR')}</span>
              <div className="flex flex-wrap gap-x-3 text-sm">
                {alert.driverPhone && <a className="inline-flex items-center gap-1 underline" href={'tel:' + alert.driverPhone}>
                  <Phone size={14} aria-hidden="true" /> {alert.driverPhone}
                </a>}
                {position && onLocate ? <button type="button" className="inline-flex items-center gap-1 underline" onClick={() => onLocate(position[1], position[0])}>
                  <MapPin size={14} aria-hidden="true" /> Ver posição no mapa
                </button> : <span>{position ? position[1].toFixed(5) + ', ' + position[0].toFixed(5) : 'GPS indisponível no envio'}</span>}
              </div>
            </div>
            <button type="button" onClick={() => void acknowledge(alert)} disabled={updating !== undefined}
              className="rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold hover:bg-rose-100 disabled:opacity-60">
              Marcar como atendido
            </button>
          </li>;
        })}
      </ul>
    </div>}
  </section>;
}
