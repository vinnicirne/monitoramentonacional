import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { AlertTriangle, MapPin, Phone, Volume2, VolumeX } from 'lucide-react';
import { driveOrigin, requestDrive } from '../services/driveCompanyApi';

import { useSosSound } from '../hooks/useSosSound';
import { watchCompanySos, type SosAlert } from '../services/companySosStream';

export default function CompanySosAlerts({ user, domain, includeBranches, onLocate, mode, onAlertsChanged }: {
  user: User;
  domain: string;
  includeBranches: boolean;
  mode: 'map' | 'panel';
  onAlertsChanged?: () => void;
  onLocate?: (lat: number, lng: number) => void;
}) {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string>();
  const acknowledged = useRef(new Set<string>());
  const pendingKeys = alerts.map(alert => alert.companyDomain + '/' + alert.id);
  const pendingSignature = pendingKeys.join('\n');
  const sound = useSosSound(pendingKeys);
  useEffect(() => { onAlertsChanged?.(); }, [pendingSignature, onAlertsChanged]);

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

  const canEnable = sound.supported && !sound.enabled;
  if (!driveOrigin || (!alerts.length && !unavailable && !canEnable)) return null;

  return <section aria-label="Alertas SOS" className={mode === 'map'
    ? 'absolute bottom-14 right-3 z-40 w-[min(27rem,calc(100%-1.5rem))] space-y-2'
    : 'z-10 shrink-0 space-y-2 px-3 pt-2 md:px-5'}>
    {unavailable && <p role="status" className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-800">Monitor de SOS sem atualização. Tentando reconectar.</p>}
    {alerts.length > 0 && <div className="sos-priority max-h-[min(42dvh,28rem)] space-y-3 overflow-y-auto rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 text-rose-950 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 role="alert" className="flex items-center gap-2 text-base font-extrabold">
          <AlertTriangle size={20} aria-hidden="true" /> SOS prioritário ({alerts.length})
        </h3>
        {sound.enabled && sound.ringing && <button type="button" onClick={sound.silence}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2 py-1.5 text-xs font-bold">
          <VolumeX size={15} aria-hidden="true" /> Silenciar alertas atuais
        </button>}
      </div>
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
    {canEnable && <div className="flex justify-end">
      <button type="button" data-sos-audio-enable onClick={sound.enable}
        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-900 shadow-sm">
        <Volume2 size={15} aria-hidden="true" /> Ativar som SOS
      </button>
    </div>}
  </section>;
}
