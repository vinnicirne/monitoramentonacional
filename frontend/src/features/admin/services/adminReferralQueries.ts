import { documentId, orderBy, query, where } from 'firebase/firestore';
import { readReferral, readReferralCode } from '../../../shared/firebase/adminDocuments';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import { readPage, readQueryCount, type FirestoreCursor } from '../../../shared/firebase/queryPages';

export async function countReferrals(includeCodes: boolean) {
  const referrals = firestoreRefs.referrals();
  const [totalReferrals, directMeliReferrals, totalCodes] = await Promise.all([
    readQueryCount('referrals', referrals),
    readQueryCount('referrals', query(referrals, where('autoApproved', '==', true))),
    includeCodes ? readQueryCount('referral_codes', firestoreRefs.referralCodes()) : Promise.resolve(null)
  ]);
  return { totalReferrals, directMeliReferrals, totalCodes };
}

const size = 30;

export async function readReferralPage(cursor: FirestoreCursor | null, signal: AbortSignal) {
  const documents = await readPage('referrals', query(firestoreRefs.referrals(), orderBy(documentId())), cursor, size + 1);
  signal.throwIfAborted();
  return {
    rows: documents.slice(0, size).map(document => readReferral(document.id, document.data())),
    nextCursor: documents.length > size ? documents[size - 1] : null
  };
}

export async function readReferralCodePage(cursor: FirestoreCursor | null, signal: AbortSignal) {
  const documents = await readPage('referral_codes', query(firestoreRefs.referralCodes(), orderBy(documentId())), cursor, size + 1);
  signal.throwIfAborted();
  return {
    rows: documents.slice(0, size).map(document => readReferralCode(document.id, document.data())),
    nextCursor: documents.length > size ? documents[size - 1] : null
  };
}
