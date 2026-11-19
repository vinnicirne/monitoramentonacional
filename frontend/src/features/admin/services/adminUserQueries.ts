import { documentId, orderBy, query, where } from 'firebase/firestore';
import type { UserProfile, UserStatus } from '../../../types/admin';
import { readUserProfile } from '../../../shared/firebase/adminDocuments';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import { readPage, readQueryCount, scanQuery, type FirestoreCursor } from '../../../shared/firebase/queryPages';

export type AdminUserFilter = UserStatus | 'all';
type UserGroup = UserStatus | 'other';
type UserCursor = { group: UserGroup; document: FirestoreCursor };
const PAGE_SIZE = 30;

function usersInGroup(group: UserGroup) {
  const condition = group === 'other' ? where('status', 'in', ['approved', 'blocked']) : where('status', '==', group);
  return query(firestoreRefs.users(), condition, orderBy(documentId()));
}

export async function readAdminUserPage(filter: AdminUserFilter, cursor: UserCursor | null, signal: AbortSignal) {
  const groups: UserGroup[] = filter === 'all' ? ['pending', 'other'] : [filter];
  const rows: UserProfile[] = [];
  let nextCursor: UserCursor | null = null;

  for (const group of groups.slice(cursor ? groups.indexOf(cursor.group) : 0)) {
    signal.throwIfAborted();
    const remaining = PAGE_SIZE - rows.length;
    const documents = await readPage('users', usersInGroup(group), cursor?.group === group ? cursor.document : null, remaining + 1);
    signal.throwIfAborted();
    for (const document of documents.slice(0, remaining)) {
      rows.push(readUserProfile(document.id, document.data()));
      nextCursor = { group, document };
    }
    if (documents.length > remaining) return { rows, nextCursor };
  }
  return { rows, nextCursor: null };
}

export async function countAdminUsers() {
  const users = firestoreRefs.users();
  const [totalUsers, approvedUsers, blockedUsers] = await Promise.all([
    readQueryCount('users', users),
    readQueryCount('users', query(users, where('status', '==', 'approved'))),
    readQueryCount('users', query(users, where('status', '==', 'blocked')))
  ]);
  return { totalUsers, approvedUsers, blockedUsers };
}

export function readActiveLicensesForSummary(signal: AbortSignal) {
  return scanQuery('users', query(firestoreRefs.users(), where('licenseStatus', '==', 'active'), orderBy(documentId())), document =>
    readUserProfile(document.id, document.data()), signal
  );
}

export function searchAdminUsers(filter: AdminUserFilter, term: string, signal: AbortSignal) {
  const users = firestoreRefs.users();
  const source = filter === 'all' ? query(users, orderBy(documentId())) : query(users, where('status', '==', filter), orderBy(documentId()));
  return scanQuery('users', source, document => {
    const user = readUserProfile(document.id, document.data());
    return [user.displayName, user.email, user.domain, user.referralCode].some(value => value.toLowerCase().includes(term)) ? user : null;
  }, signal).then(matches => matches.sort((a, b) =>
    Number(b.status === 'pending') - Number(a.status === 'pending') || b.accessCount - a.accessCount
  ));
}

export function countPendingAdminUsers() {
  return readQueryCount('users', query(firestoreRefs.users(), where('status', '==', 'pending')));
}

export async function countUsersByPlan(planIds: string[]) {
  const results = await Promise.all(planIds.map(async id => [
    id, await readQueryCount('users', query(firestoreRefs.users(), where('planId', '==', id)))
  ] as const));
  return Object.fromEntries(results);
}
