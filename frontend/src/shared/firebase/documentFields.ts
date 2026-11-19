export type DocumentFields = Record<string, unknown>;

export const stringField = (value: unknown) => typeof value === 'string' ? value : '';
export const numberField = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
export const optionalNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export function enumField<const Value extends string>(
  value: unknown,
  allowed: readonly Value[]
): Value | undefined {
  return allowed.find(option => option === value);
}

export function documentFields(value: unknown): DocumentFields | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as DocumentFields
    : null;
}

export function timestampFields(data: DocumentFields) {
  return { createdAt: timestampField(data.createdAt), updatedAt: timestampField(data.updatedAt) };
}

export function timestampField(value: unknown) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : undefined;
  if (typeof value === 'string' || typeof value === 'number') {
    return Number.isFinite(new Date(value).getTime()) ? value : undefined;
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value;
  }
  return undefined;
}

export function timestampMillis(value: unknown): number {
  if (value instanceof Date) return value.getTime() || 0;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).getTime() || 0;
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return numberField(value.toMillis());
  }
  return 0;
}
