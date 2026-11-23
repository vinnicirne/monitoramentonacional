import type { User } from 'firebase/auth';

export type DriverPosition = {
  uid: string;
  name: string;
  phone?: string;
  companyName?: string;
  companyDomain?: string;
  position: [number, number];
  route: number[];
  accuracy?: number;
  updatedAt: number;
};

export const driveOrigin = (() => {
  try {
    const url = new URL(import.meta.env.VITE_MAPSBRASIL_DRIVE_URL || '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
})();

export async function requestDrive<T>(user: User, domain: string, action: string, payload?: object, signal?: AbortSignal): Promise<T> {
  const token = await user.getIdToken();
  const timeout = AbortSignal.timeout(action === 'cadastro' ? 25000 : 12000);
  const response = await fetch(`${driveOrigin}/api/empresa/${encodeURIComponent(domain)}/${action}`, {
    method: payload ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: signal ? AbortSignal.any([timeout, signal]) : timeout
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw Object.assign(new Error(result?.error || 'Não foi possível acessar a gestão do MapsBrasil Drive.'), { status: response.status });
  return result;
}
