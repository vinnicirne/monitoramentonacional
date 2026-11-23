import type { User } from 'firebase/auth';
import { driveOrigin } from './driveCompanyApi';

export type SosAlert = {
  id: string;
  createdAt: number;
  driverName: string;
  driverPhone: string;
  companyDomain: string;
  companyName: string;
  location: { position: [number, number]; observedAt: number } | null;
};

type SosFrame = { domains: string[] } | { domain: string; alerts: SosAlert[] } | { reconnect: true };

export async function watchCompanySos(user: User, domain: string, includeBranches: boolean, signal: AbortSignal,
  onFrame: (frame: SosFrame) => void) {
  const connection = new AbortController();
  let inactivity: ReturnType<typeof setTimeout> | undefined;
  function renewTimeout() {
    clearTimeout(inactivity);
    inactivity = setTimeout(() => connection.abort(), 15000);
  }
  renewTimeout();

  try {
    const token = await user.getIdToken();
    const endpoint = '/api/empresa/' + encodeURIComponent(domain) + '/sos-stream';
    const response = await fetch(driveOrigin + endpoint + (includeBranches ? '?tree=1' : ''), {
      headers: { Authorization: 'Bearer ' + token, Accept: 'text/event-stream' },
      signal: AbortSignal.any([signal, connection.signal])
    });
    if (!response.ok || !response.body || !response.headers.get('content-type')?.startsWith('text/event-stream')) {
      throw Object.assign(new Error('Canal de SOS indisponível.'), { status: response.status });
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    try {
      let pending = '';
      for (;;) {
        const event = await reader.read();
        if (event.done) break;
        renewTimeout();
        pending += event.value;
        let end = pending.indexOf('\n');
        while (end !== -1) {
          const line = pending.slice(0, end);
          pending = pending.slice(end + 1);
          if (line.startsWith('data: ')) onFrame(JSON.parse(line.slice(6)) as SosFrame);
          end = pending.indexOf('\n');
        }
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  } finally {
    clearTimeout(inactivity);
    connection.abort();
  }
}
