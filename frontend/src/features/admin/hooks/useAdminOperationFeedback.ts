import { useCallback, useState } from 'react';
import { reportFirestoreError } from '../../../firebase';
import { errorCode } from '../../../shared/diagnostics';
import type { OperationType } from '../../../types/admin';

export type AdminActionError = (error: unknown, operation: OperationType, path: string) => void;

export function useAdminOperationFeedback() {
  const [operationError, setOperationError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const onError: AdminActionError = useCallback((error, operation, path) => {
    reportFirestoreError(error, operation, path);
    const code = errorCode(error);
    setOperationError(code === 'permission-denied'
      ? 'O Firestore recusou a alteração. Confira as permissões da sua conta.'
      : `Não foi possível concluir a operação${code === 'unknown' ? '' : ` (${code})`}.`);
  }, []);
  const onChanged = useCallback(() => {
    setOperationError(null);
    setRefreshVersion(version => version + 1);
  }, []);
  return { operationError, dismissError: () => setOperationError(null), refreshVersion, onChanged, onError };
}
