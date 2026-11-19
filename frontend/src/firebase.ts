import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
  type Firestore
} from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';
import type { OperationType } from './types/admin';
import { errorCode, recordDiagnostic } from './shared/diagnostics';

// Load config from environment variables (Vercel deployment) with fallback to local applet json
export const firebaseConfig = {
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || defaultFirebaseConfig.projectId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || defaultFirebaseConfig.appId,
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || defaultFirebaseConfig.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || defaultFirebaseConfig.authDomain,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || defaultFirebaseConfig.firestoreDatabaseId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || defaultFirebaseConfig.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || defaultFirebaseConfig.messagingSenderId,
  oAuthClientId: (import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID as string) || defaultFirebaseConfig.oAuthClientId
};

const app = initializeApp(firebaseConfig);

let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    { experimentalAutoDetectLongPolling: true },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);
if (import.meta.env.DEV && firebaseConfig.projectId.startsWith('demo-')) {
  const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST as string | undefined;
  const authEmulator = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL as string | undefined;
  if (emulatorHost) {
    const [host, port] = emulatorHost.split(':');
    connectFirestoreEmulator(db, host, Number(port));
  }
  if (authEmulator) connectAuthEmulator(auth, authEmulator, { disableWarnings: true });
}
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function reportFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const segments = path?.split('/') ?? [];
  const target = segments.filter((_, index) => index % 2 === 0).join('/') || 'firestore';
  const code = errorCode(error);
  recordDiagnostic({ kind: 'firestore', target, operation: operationType, errorCode: code });
  console.error('Falha na operação do Firestore.', {
    path, operation: operationType, code, message: error instanceof Error ? error.message : String(error)
  });
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  reportFirestoreError(error, operationType, path);
  const code = errorCode(error);
  const message = code === 'permission-denied'
    ? 'O Firestore recusou o acesso aos dados da conta.'
    : 'Não foi possível sincronizar os dados da conta.';
  throw Object.assign(new Error(message, { cause: error }), { code });
}
