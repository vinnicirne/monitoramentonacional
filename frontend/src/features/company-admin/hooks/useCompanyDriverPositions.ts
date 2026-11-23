import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { driveOrigin, requestDrive, type DriverPosition } from '../services/driveCompanyApi';

const empty: DriverPosition[] = [];

export function useCompanyDriverPositions(user: User | undefined, domain: string) {
  const scope = user && domain && driveOrigin ? `${user.uid}:${domain}` : '';
  const [snapshot, setSnapshot] = useState<{ scope: string; positions: DriverPosition[]; unavailable?: boolean }>();

  useEffect(() => {
    if (!scope || !user) return;
    let running: AbortController | undefined;
    async function poll() {
      if (document.hidden || running) return;
      const controller = running = new AbortController();
      try {
        const positions = await requestDrive<DriverPosition[]>(user!, domain, 'localizacoes', undefined, controller.signal);
        if (!controller.signal.aborted) setSnapshot({ scope, positions });
      } catch {
        if (!controller.signal.aborted) setSnapshot({ scope, positions: empty, unavailable: true });
      } finally {
        running = undefined;
      }
    }
    const timer = window.setInterval(poll, 10000);
    document.addEventListener('visibilitychange', poll);
    void poll();
    return () => {
      running?.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [scope, domain, user]);

  return snapshot?.scope === scope ? snapshot : { positions: empty, unavailable: false };
}
