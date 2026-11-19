import { useCallback, useEffect, useState } from 'react';
import { reportFirestoreError } from '../../../firebase';
import { useCursorPages } from '../../../shared/useCursorPages';
import { useListPage } from '../../../shared/useListPage';
import { OperationType, type UserProfile } from '../../../types/admin';
import { readAdminUserPage, searchAdminUsers, type AdminUserFilter } from '../services/adminUserQueries';

export function useAdminUsers(enabled: boolean, filter: AdminUserFilter, search: string, refreshVersion: number) {
  const term = search.trim().toLowerCase();
  const load = useCallback((cursor: Parameters<typeof readAdminUserPage>[1], signal: AbortSignal) =>
    readAdminUserPage(filter, cursor, signal), [filter]);
  const normal = useCursorPages(filter, enabled && !term, load, refreshVersion);
  const key = JSON.stringify([filter, term, refreshVersion]);
  const [searchResult, setSearchResult] = useState<{ key: string; rows: UserProfile[]; error?: unknown }>();
  const currentSearch = searchResult?.key === key ? searchResult : null;
  const matches = useListPage(currentSearch?.rows ?? [], key);

  useEffect(() => {
    if (!enabled || !term) return;
    const request = new AbortController();
    const timer = window.setTimeout(() => {
      searchAdminUsers(filter, term, request.signal).then(
        rows => {
          if (!request.signal.aborted) setSearchResult({ key, rows });
        },
        error => {
          if (request.signal.aborted) return;
          reportFirestoreError(error, OperationType.LIST, 'users');
          setSearchResult({ key, rows: [], error });
        }
      );
    }, 350);
    return () => {
      window.clearTimeout(timer);
      request.abort();
    };
  }, [enabled, term, filter, key]);

  useEffect(() => {
    if (normal.error) reportFirestoreError(normal.error, OperationType.LIST, 'users');
  }, [normal.error]);

  return term ? { ...matches, loading: !currentSearch, error: currentSearch?.error } : normal;
}
