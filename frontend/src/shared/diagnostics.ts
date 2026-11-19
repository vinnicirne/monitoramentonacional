type Diagnostic =
  | { kind: 'route'; target: string; durationMs: number }
  | { kind: 'firestore'; target: string; operation: string; durationMs?: number; documents?: number; fromCache?: boolean; errorCode?: string };

export function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return 'unknown';
}

export function recordDiagnostic(event: Diagnostic) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pmt:diagnostic', { detail: event }));
  }
}
