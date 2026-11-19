import type { User as FirebaseUser } from 'firebase/auth';
import { increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import type { UserProfile } from '../../../types/admin';
import type { AccessTargetInput } from '../authUtils';

export async function logApprovedUserLocationAccess(
  firebaseUser: FirebaseUser | null,
  profile: UserProfile | null,
  target: AccessTargetInput
): Promise<void> {
  if (!firebaseUser || !profile || profile.status !== 'approved') return;

  const logId = `${firebaseUser.uid.slice(0, 10)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  try {
    await setDoc(firestoreRefs.accessLog(logId), {
      id: logId,
      uid: firebaseUser.uid,
      userName: (profile.displayName || 'Usuário').slice(0, 120),
      userEmail: firebaseUser.email || profile.email,
      userDomain: profile.domain,
      targetType: (target.targetType || 'LOCAL').slice(0, 40),
      targetName: (target.targetName || 'Localização').slice(0, 160),
      uf: (target.uf || 'RJ').slice(0, 16),
      municipio: (target.municipio || '').slice(0, 100),
      cisp: typeof target.cisp === 'number' && !Number.isNaN(target.cisp) ? target.cisp : 0,
      createdAt: serverTimestamp()
    });
    await updateDoc(firestoreRefs.user(firebaseUser.uid), {
      accessCount: increment(1),
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('Access log write skipped:', error);
  }
}
