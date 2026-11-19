import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ensureAdminSeedData as seedAdminDefaults } from '../features/auth/services/authBootstrapRepository';
import { subscribeToAuthProfile, syncAuthUserProfile } from '../features/auth/services/authProfileRepository';
import { logApprovedUserLocationAccess } from '../features/auth/services/authAccessRepository';
import { ADMIN_EMAILS, REF_STORAGE_KEY } from '../features/auth/authConstants';
import type { AccessTargetInput } from '../features/auth/authUtils';
import {
  emailToLicenseId,
  generateCorporateLicenseKey,
  mapAuthErrorToPortuguese,
  sanitizeEmailDomain,
  sanitizeReferralCode
} from '../features/auth/authUtils';
import type { UserProfile } from '../types/admin';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  hasFullAccess: boolean;
  isAdmin: boolean;
  isCompanyAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalReason: string | null;
  pendingReferralCode: string;
  setPendingReferralCode: (code: string) => void;
  openAuthModal: (reason?: string, onApprovedCallback?: () => void) => void;
  closeAuthModal: () => void;
  signInWithGoogle: (referralOverride?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
    referralOverride?: string
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
  signOutUser: () => Promise<void>;
  logLocationAccess: (target: AccessTargetInput) => Promise<void>;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err: any = new Error(message);
      err.code = 'auth/timeout';
      reject(err);
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);
  const userProfileRef = useRef<UserProfile | null>(null);

  const [pendingReferralCode, setPendingReferralCodeState] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = sanitizeReferralCode(params.get('ref') || '');
      if (fromUrl) {
        localStorage.setItem(REF_STORAGE_KEY, fromUrl);
        return fromUrl;
      }
      return sanitizeReferralCode(localStorage.getItem(REF_STORAGE_KEY) || '');
    } catch {
      return '';
    }
  });

  const syncLockRef = useRef<Record<string, Promise<void> | undefined>>({});
  const seededAdminRef = useRef<boolean>(false);

  const ensureAdminSeedData = async (uid: string, email: string) => {
    if (seededAdminRef.current) return;
    seededAdminRef.current = true;
    await seedAdminDefaults(uid, email);
  };

  const setPendingReferralCode = (code: string) => {
    const clean = sanitizeReferralCode(code);
    setPendingReferralCodeState(clean);
    try {
      if (clean) localStorage.setItem(REF_STORAGE_KEY, clean);
      else localStorage.removeItem(REF_STORAGE_KEY);
    } catch {
      // ignore storage failure
    }
  };

  const ensureUserProfile = (fbUser: FirebaseUser, explicitRefCode?: string) =>
    syncAuthUserProfile(fbUser, explicitRefCode, pendingReferralCode, syncLockRef.current, ensureAdminSeedData);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let session = 0;

    const unsubAuth = onAuthStateChanged(auth, async fbUser => {
      const currentSession = ++session;
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      firebaseUserRef.current = fbUser;
      setFirebaseUser(fbUser);
      userProfileRef.current = null;
      setUserProfile(null);
      setAuthLoading(Boolean(fbUser));

      if (!fbUser) return;

      try {
        await withTimeout(
          ensureUserProfile(fbUser),
          15000,
          'Tempo limite ao validar seu perfil no banco de dados. Tente novamente.'
        );
        if (currentSession !== session) return;
        unsubProfile = subscribeToAuthProfile(
          fbUser.uid,
          prof => {
            if (currentSession !== session) return;
            if (prof) {
              userProfileRef.current = prof;
              setUserProfile(prof);
              setAuthError(null);
              const hasApprovedAccess = prof.status === 'approved' ||
                (fbUser.emailVerified && (prof.role === 'admin' || ADMIN_EMAILS.includes(prof.email.toLowerCase())));
              if (hasApprovedAccess && pendingActionRef.current) {
                const cb = pendingActionRef.current;
                pendingActionRef.current = null;
                setIsAuthModalOpen(false);
                cb();
              }
            }
            setAuthLoading(false);
          },
          err => {
            if (currentSession !== session) return;
            console.error('Profile snapshot error:', err);
            setAuthError(
              err?.message || 'Erro ao sincronizar os dados do perfil no banco de dados.'
            );
            setAuthLoading(false);
          }
        );
      } catch (err: any) {
        if (currentSession !== session) return;
        console.error('Auth sync error:', err);
        setAuthError(err?.message || 'Não foi possível validar sua conta no banco.');
        setAuthLoading(false);
      }
    });

    return () => {
      session += 1;
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const signInWithGoogle = async (referralOverride?: string) => {
    setAuthError(null);
    if (referralOverride !== undefined) {
      setPendingReferralCode(referralOverride);
    }
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await withTimeout(
          ensureUserProfile(res.user, referralOverride),
          15000,
          'Tempo limite ao carregar seu perfil após login Google.'
        );
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') return;
      console.error('Google Sign-In error:', err);
      setAuthError(mapAuthErrorToPortuguese(err));
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const res: any = await withTimeout(
        signInWithEmailAndPassword(auth, email.trim(), password),
        15000,
        'Tempo limite ao autenticar. Verifique sua conexão, desative bloqueadores/extensões de requisição ou use "Entrar com Google".'
      );
      if (res.user) {
        await withTimeout(
          ensureUserProfile(res.user),
          15000,
          'Login efetuado, mas o banco de dados demorou para responder. Clique em "Tentar Novamente".'
        );
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (!['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) {
        console.warn('Email Sign-In notice:', code || err?.message);
      }
      setAuthError(mapAuthErrorToPortuguese(err));
      throw err;
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
    referralOverride?: string
  ) => {
    setAuthError(null);
    if (referralOverride !== undefined) {
      setPendingReferralCode(referralOverride);
    }
    try {
      const cleanName = name.trim().slice(0, 120);
      const res: any = await withTimeout(
        createUserWithEmailAndPassword(auth, email.trim(), password),
        15000,
        'Tempo limite ao criar sua conta. Verifique sua conexão ou use "Criar Conta com Google".'
      );
      if (res.user) {
        if (cleanName) {
          await updateProfile(res.user, { displayName: cleanName }).catch(() => {});
        }
        try {
          await sendEmailVerification(res.user);
        } catch (verErr) {
          console.warn('Email verification send skipped:', verErr);
        }
        await withTimeout(
          ensureUserProfile(res.user, referralOverride),
          15000,
          'Conta criada, mas houve atraso ao salvar perfil no banco.'
        );
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (!['auth/email-already-in-use', 'auth/weak-password', 'auth/invalid-email'].includes(code)) {
        console.warn('Email Register notice:', code || err?.message);
      }
      setAuthError(mapAuthErrorToPortuguese(err));
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    setAuthError(null);
    try {
      await withTimeout(
        sendPasswordResetEmail(auth, email.trim()),
        15000,
        'Tempo limite ao enviar e-mail de redefinição. Tente novamente.'
      );
    } catch (err: any) {
      console.warn('Password Reset notice:', err?.code || err?.message);
      setAuthError(mapAuthErrorToPortuguese(err));
      throw err;
    }
  };

  const resendVerificationEmail = async () => {
    setAuthError(null);
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err: any) {
      console.error('Resend Verification error:', err);
      setAuthError(mapAuthErrorToPortuguese(err));
      throw err;
    }
  };

  const refreshAuthUser = async () => {
    setAuthError(null);
    if (!auth.currentUser) return;
    try {
      await reload(auth.currentUser);
      setFirebaseUser({ ...auth.currentUser } as FirebaseUser);
      await ensureUserProfile(auth.currentUser);
    } catch (err: any) {
      console.error('Refresh Auth error:', err);
      setAuthError(mapAuthErrorToPortuguese(err));
    }
  };

  const signOutUser = async () => {
    pendingActionRef.current = null;
    setIsAuthModalOpen(false);
    await signOut(auth);
  };

  const openAuthModal = (reason?: string, onApprovedCallback?: () => void) => {
    setAuthModalReason(reason || null);
    pendingActionRef.current = onApprovedCallback || null;
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    pendingActionRef.current = null;
    setIsAuthModalOpen(false);
  };

  const isAdmin = Boolean(
    userProfile &&
      firebaseUser?.emailVerified &&
      (userProfile.role === 'admin' ||
        ADMIN_EMAILS.includes(userProfile.email.toLowerCase()))
  );

  const isCompanyAdmin = Boolean(
    userProfile &&
      firebaseUser?.emailVerified &&
      userProfile.status === 'approved' &&
      userProfile.licenseStatus !== 'suspended' &&
      userProfile.companyRole === 'company_admin' &&
      (userProfile.companyDomain || userProfile.domain)
  );

  const hasFullAccess = Boolean(userProfile && (userProfile.status === 'approved' || isAdmin));

  const logLocationAccess = (target: AccessTargetInput) =>
    logApprovedUserLocationAccess(
      firebaseUserRef.current || firebaseUser,
      userProfileRef.current || userProfile,
      target
    );

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        authLoading,
        authError,
        clearAuthError: () => setAuthError(null),
        hasFullAccess,
        isAdmin,
        isCompanyAdmin,
        isAuthModalOpen,
        authModalReason,
        pendingReferralCode,
        setPendingReferralCode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        resendVerificationEmail,
        refreshAuthUser,
        signOutUser,
        logLocationAccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
