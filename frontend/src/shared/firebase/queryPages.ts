import {
  getCountFromServer, getDocsFromServer, limit, onSnapshot, query, startAfter,
  type DocumentData, type Query, type QueryDocumentSnapshot, type QuerySnapshot
} from 'firebase/firestore';
import { recordDiagnostic } from '../diagnostics';

export type FirestoreCursor = QueryDocumentSnapshot<DocumentData>;

export async function readQueryCount(target: string, source: Query<DocumentData>) {
  const start = performance.now();
  const snapshot = await getCountFromServer(source);
  recordDiagnostic({ kind: 'firestore', target, operation: 'count', durationMs: performance.now() - start });
  return snapshot.data().count;
}

export function listenToQuery(
  target: string,
  source: Query<DocumentData>,
  receive: (snapshot: QuerySnapshot<DocumentData>) => void,
  onError: (error: Error) => void
) {
  const start = performance.now();
  let firstSnapshot = true;
  return onSnapshot(source, snapshot => {
    recordDiagnostic({
      kind: 'firestore', target, operation: firstSnapshot ? 'listen-first' : 'listen-update',
      durationMs: firstSnapshot ? performance.now() - start : undefined,
      fromCache: snapshot.metadata.fromCache,
      documents: firstSnapshot ? snapshot.size : snapshot.docChanges().length
    });
    firstSnapshot = false;
    receive(snapshot);
  }, onError);
}

export async function readPage(
  target: string,
  source: Query<DocumentData>,
  cursor: FirestoreCursor | null,
  pageSize: number
) {
  const start = performance.now();
  const bounded = cursor ? query(source, startAfter(cursor), limit(pageSize)) : query(source, limit(pageSize));
  const snapshot = await getDocsFromServer(bounded);
  recordDiagnostic({
    kind: 'firestore', target, operation: 'page', documents: snapshot.size,
    fromCache: snapshot.metadata.fromCache, durationMs: performance.now() - start
  });
  return snapshot.docs;
}

export async function scanQuery<Item>(
  target: string,
  source: Query<DocumentData>,
  read: (document: FirestoreCursor) => Item | null,
  signal: AbortSignal
) {
  const results: Item[] = [];
  let cursor: FirestoreCursor | null = null;
  const size = 200;
  for (;;) {
    signal.throwIfAborted();
    const documents = await readPage(target, source, cursor, size);
    signal.throwIfAborted();
    for (const document of documents) {
      const item = read(document);
      if (item !== null) results.push(item);
    }
    if (documents.length < size) return results;
    cursor = documents.at(-1);
  }
}
