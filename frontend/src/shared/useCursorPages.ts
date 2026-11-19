import { useEffect, useState } from 'react';

export interface CursorPage<Item, Cursor> {
  rows: Item[];
  nextCursor: Cursor | null;
}

export function useCursorPages<Item, Cursor>(
  key: string,
  enabled: boolean,
  load: (cursor: Cursor | null, signal: AbortSignal) => Promise<CursorPage<Item, Cursor>>,
  refreshVersion = 0
) {
  const [position, setPosition] = useState<{ key: string; cursors: (Cursor | null)[] }>({ key, cursors: [null] });
  const cursors = position.key === key ? position.cursors : [null];
  const cursor = cursors.at(-1);
  const page = cursors.length;
  const [loaded, setLoaded] = useState<{
    key: string; page: number; refreshVersion: number; result?: CursorPage<Item, Cursor>; error?: unknown;
  } | null>(null);
  const active = enabled && loaded?.key === key && loaded.page === page && loaded.refreshVersion === refreshVersion ? loaded : null;

  useEffect(() => {
    if (!enabled) return;
    const request = new AbortController();
    load(cursor, request.signal).then(
      result => {
        if (!request.signal.aborted) setLoaded({ key, page, refreshVersion, result });
      },
      error => {
        if (!request.signal.aborted) setLoaded({ key, page, refreshVersion, error });
      }
    );
    return () => request.abort();
  }, [key, enabled, cursor, page, load, refreshVersion]);

  const nextCursor = active?.result?.nextCursor;
  return {
    rows: active?.result?.rows ?? [],
    error: active?.error,
    loading: enabled && !active,
    page,
    hasNext: nextCursor != null,
    previous: () => setPosition({ key, cursors: page > 1 ? cursors.slice(0, -1) : cursors }),
    next: () => {
      if (nextCursor != null) setPosition({ key, cursors: [...cursors, nextCursor] });
    }
  };
}
