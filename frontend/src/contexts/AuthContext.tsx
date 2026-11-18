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
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from '../firebase';
import {
  AutoApprovalSource,
  OperationType,
  UserProfile
} from '../types/admin';

const ADMIN_EMAILS = [
  'adm.desbloqueio@gmail.com',
  'viniciuscirne@gmail.com',
  'agenciaiconedigital@gmail.com',
  'vinnicirne@gmail.com'
];
const REF_STORAGE_KEY = 'pmt_pending_ref_code';

export interface AccessTargetInput {
  targetType: string;
  targetName: string;
  uf?: string;
  municipio?: string;
  cisp?: number;
}

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

function mapAuthErrorToPortuguese(err: any): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido. Verifique o endereço digitado.';
    case 'auth/user-disabled':
      return 'Esta conta foi desativada no Firebase Auth.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos. Se esta conta já foi usada com Google, clique em "Entrar com Google" ou use "Esqueci a senha" para definir uma senha.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui cadastro neste projeto Firebase. Use a aba "Acessar", entre com Google ou clique em "Esqueci a senha" para definir/redefinir sua senha.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'O provedor E-mail/Senha ainda não foi ativado no Console do Firebase (Authentication > Sign-in method > E-mail/senha). Use "Entrar com Google" ou ative o provedor no console.';
    case 'auth/unauthorized-domain': {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
      return `Domínio não autorizado para login Google (${currentHost}). O Firebase requer que o endereço "${currentHost}" seja cadastrado em: Firebase Console > Authentication > Configurações > Domínios autorizados. Use o formulário de E-mail e Senha acima para acessar imediatamente sem restrição de domínio!`;
    }
    case 'auth/popup-blocked':
      return 'O popup de login foi bloqueado pelo navegador. Libere popups para este site ou acesse por e-mail/senha.';
    case 'auth/network-request-failed':
      return 'Falha de rede ao conectar com o Firebase. Verifique sua internet ou desative extensões que bloqueiam requisições.';
    case 'auth/timeout':
      return 'Tempo limite excedido ao autenticar. Verifique sua conexão ou tente "Entrar com Google".';
    default:
      if (err?.message?.includes('unauthorized-domain') || err?.message?.includes('not authorized for OAuth operations')) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
        return `Domínio não autorizado no Firebase (${currentHost}). Adicione "${currentHost}" no Firebase Console > Authentication > Settings > Authorized domains. Enquanto isso, use o login com E-mail e Senha acima!`;
      }
      return err?.message || 'Erro ao autenticar. Tente novamente.';
  }
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

function sanitizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 32);
}

function sanitizeDomain(email: string): string {
  const part = (email.split('@')[1] || 'gmail.com').toLowerCase();
  return part.replace(/[^a-z0-9.-]/g, '').slice(0, 120) || 'gmail.com';
}

export function emailToLicenseId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `lic_${clean}`.slice(0, 128);
}

export function generateCorporateLicenseKey(domain: string, seed: string): string {
  const domPrefix = (domain.split('.')[0] || 'CORP')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10) || 'CORP';
  const seedTag = seed
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
    .padEnd(6, 'X');
  return `LIC-${domPrefix}-${seedTag}`.slice(0, 64);
}

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
      const fromUrl = sanitizeCode(params.get('ref') || '');
      if (fromUrl) {
        localStorage.setItem(REF_STORAGE_KEY, fromUrl);
        return fromUrl;
      }
      return sanitizeCode(localStorage.getItem(REF_STORAGE_KEY) || '');
    } catch {
      return '';
    }
  });

  const syncLockRef = useRef<Record<string, Promise<void> | undefined>>({});
  const seededAdminRef = useRef<boolean>(false);

  const setPendingReferralCode = (code: string) => {
    const clean = sanitizeCode(code);
    setPendingReferralCodeState(clean);
    try {
      if (clean) localStorage.setItem(REF_STORAGE_KEY, clean);
      else localStorage.removeItem(REF_STORAGE_KEY);
    } catch {
      // ignore storage failure
    }
  };

  const ensureAdminSeedData = async (uid: string, email: string) => {
    if (seededAdminRef.current) return;
    seededAdminRef.current = true;

    try {
      const adminDocRef = doc(db, 'admins', uid);
      const adminSnap = await getDoc(adminDocRef);
      if (!adminSnap.exists()) {
        await setDoc(adminDocRef, {
          uid,
          email,
          createdAt: serverTimestamp()
        });
      }

      const meliDomainRef = doc(db, 'free_domains', 'mercadolivre.com');
      const meliSnap = await getDoc(meliDomainRef);
      if (!meliSnap.exists()) {
        await setDoc(meliDomainRef, {
          domain: 'mercadolivre.com',
          label: 'Mercado Livre (Acesso Free & Indicação Direta)',
          active: true,
          autoApproveReferrals: true,
          defaultPlanId: 'free_corp',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      const plansSnap = await getDocs(collection(db, 'plans'));
      if (plansSnap.empty) {
        const defaultPlans = [
          {
            id: 'free_corp',
            name: 'Free Corporativo / Indicado',
            description: 'Acesso completo ao mapa, dossiês de DPs, áreas de facções e consulta de endereços.',
            priceMonthly: 0,
            billingModel: 'fixed',
            pricePerLicense: 0,
            maxQueriesPerMonth: 500,
            features: [
              'Dossiês das 137 CISPs e 41 AISPs',
              'Base de 1.695 áreas de risco',
              'Busca OSM + GPS em tempo real',
              'Liberação automática @mercadolivre.com'
            ],
            active: true
          },
          {
            id: 'pro_mensal',
            name: 'Operacional Pro',
            description: 'Para analistas externos e equipes de logística com relatórios e auditoria.',
            priceMonthly: 99,
            billingModel: 'fixed',
            pricePerLicense: 99,
            maxQueriesPerMonth: 5000,
            features: [
              'Todos os recursos do Free Corporativo',
              'Estatísticas ISP-RJ e Auditoria',
              'Impressão oficial de Dossiê PDF',
              'Suporte prioritário'
            ],
            active: true
          },
          {
            id: 'enterprise',
            name: 'Enterprise & Governança',
            description: 'Controle multiusuário ilimitado, base SIG MG·ES completa e gestão executiva.',
            priceMonthly: 299,
            billingModel: 'fixed',
            pricePerLicense: 299,
            maxQueriesPerMonth: 999999,
            features: [
              'Consultas ilimitadas em RJ, MG e ES',
              'Exportação CSV UTF-8 & Python QGIS',
              'Gestão de domínios e indicações',
              'Painel de rastreabilidade completo'
            ],
            active: true
          }
        ];

        for (const plan of defaultPlans) {
          await setDoc(doc(db, 'plans', plan.id), {
            ...plan,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }

      const corpPlanRef = doc(db, 'plans', 'corp_licenca');
      const corpPlanSnap = await getDoc(corpPlanRef);
      if (!corpPlanSnap.exists()) {
        await setDoc(corpPlanRef, {
          id: 'corp_licenca',
          name: 'Corporativo Por Licença',
          description: 'Plano empresarial com cobrança por licença individual vinculada ao domínio @empresa.com.',
          priceMonthly: 49,
          billingModel: 'per_user',
          pricePerLicense: 49,
          maxQueriesPerMonth: 999999,
          features: [
            'Licença nominal vinculada a @empresa.com',
            'Consultas ilimitadas RJ, MG e ES',
            'Estatísticas ISP-RJ, Auditoria & PDF',
            'Faturamento mensal por usuário ativo'
          ],
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('Seed admin defaults notice:', err);
    }
  };

  const ensureUserProfile = async (fbUser: FirebaseUser, explicitRefCode?: string) => {
    const uid = fbUser.uid;
    if (syncLockRef.current[uid]) {
      return syncLockRef.current[uid];
    }

    const job = (async () => {
      const userRef = doc(db, 'users', uid);
      let existingSnap;
      try {
        existingSnap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      }

      const email = fbUser.email || '';
      const emailLower = email.toLowerCase();
      const domain = sanitizeDomain(email);
      const displayName = (fbUser.displayName || email.split('@')[0] || 'Usuário').slice(0, 120);
      const photoURL = (fbUser.photoURL || '').slice(0, 500);
      const isVerified = fbUser.emailVerified === true;
      const isBootstrapAdmin = isVerified && ADMIN_EMAILS.includes(emailLower);

      if (!existingSnap.exists()) {
        if (isBootstrapAdmin) {
          try {
            await setDoc(doc(db, 'admins', uid), {
              uid,
              email,
              createdAt: serverTimestamp()
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `admins/${uid}`);
          }
        }

        // Check free domain rule
        let isDomainFree = domain === 'mercadolivre.com';
        let domainDefaultPlan = 'free_corp';
        try {
          const domSnap = await getDoc(doc(db, 'free_domains', domain));
          if (domSnap.exists()) {
            const dData = domSnap.data();
            isDomainFree = dData.active === true;
            if (dData.defaultPlanId) domainDefaultPlan = String(dData.defaultPlanId);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `free_domains/${domain}`);
        }

        // Check referral code rule
        let storedRef = '';
        try {
          storedRef = localStorage.getItem(REF_STORAGE_KEY) || '';
        } catch {
          storedRef = '';
        }
        const codeToUse = sanitizeCode(explicitRefCode || pendingReferralCode || storedRef || '');
        let validRefCode = '';
        let referrerUid = '';
        let referrerName = '';
        let referrerDomain = '';
        let referralAutoApproves = false;

        if (codeToUse) {
          try {
            const refCodeSnap = await getDoc(doc(db, 'referral_codes', codeToUse));
            if (refCodeSnap.exists()) {
              const rcData = refCodeSnap.data();
              if (rcData.active === true && rcData.ownerUid !== uid) {
                validRefCode = codeToUse;
                referrerUid = String(rcData.ownerUid || '');
                referrerName = String(rcData.ownerName || 'Indicador');
                referrerDomain = String(rcData.ownerDomain || '').toLowerCase();

                if (referrerDomain === 'mercadolivre.com') {
                  referralAutoApproves = true;
                } else if (referrerDomain) {
                  try {
                    const rDomSnap = await getDoc(doc(db, 'free_domains', referrerDomain));
                    if (rDomSnap.exists()) {
                      const rd = rDomSnap.data();
                      referralAutoApproves = rd.active === true && rd.autoApproveReferrals === true;
                    }
                  } catch (err) {
                    handleFirestoreError(err, OperationType.GET, `free_domains/${referrerDomain}`);
                  }
                }
              }
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `referral_codes/${codeToUse}`);
          }
        }

        // Check pre-provisioned corporate user license OR company-wide autoApprove (@empresa.com)
        let hasAssignedLicense = false;
        let assignedLicenseId = '';
        let assignedLicenseKey = '';
        let assignedCompanyRole: 'member' | 'company_admin' = 'member';
        let assignedIncidentAccess: 'read' | 'edit' = 'read';
        let hasCorporateLicense = false;
        let corporatePlanId = 'corp_licenca';
        try {
          const corpSnap = await getDoc(doc(db, 'corporate_companies', domain));
          if (corpSnap.exists() && corpSnap.data().active === true) {
            const cData = corpSnap.data();
            if (cData.planId) corporatePlanId = String(cData.planId);

            if (isVerified && emailLower.length <= 120) {
              const licId = emailToLicenseId(emailLower);
              const licSnap = await getDoc(
                doc(db, 'corporate_companies', domain, 'licenses', licId)
              );
              if (licSnap.exists()) {
                const lData = licSnap.data();
                if (lData.status === 'active') {
                  hasAssignedLicense = true;
                  assignedLicenseId = licId;
                  assignedLicenseKey = String(lData.licenseKey || '');
                  assignedCompanyRole =
                    lData.companyRole === 'company_admin' ? 'company_admin' : 'member';
                  assignedIncidentAccess = lData.incidentAccess === 'edit' ? 'edit' : 'read';
                  if (lData.planId) corporatePlanId = String(lData.planId);
                }
              }
            }

            if (!hasAssignedLicense && cData.autoApprove === true) {
              hasCorporateLicense = true;
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `corporate_companies/${domain}`);
        }

        let role: 'user' | 'admin' = 'user';
        let status: 'approved' | 'pending' = 'pending';
        let autoApprovedBy: AutoApprovalSource = 'pending_approval';
        let planId = domainDefaultPlan;
        let licenseKey = '';
        let companyDomain = '';
        let licenseStatus: 'active' | 'none' | 'suspended' = 'none';
        let companyRole: 'member' | 'company_admin' = 'member';
        let incidentAccess: 'read' | 'edit' = 'read';

        if (isBootstrapAdmin) {
          role = 'admin';
          status = 'approved';
          autoApprovedBy = 'admin_bootstrap';
          planId = 'enterprise';
        } else if (isVerified && isDomainFree) {
          status = 'approved';
          autoApprovedBy = 'free_domain';
        } else if (isVerified && hasAssignedLicense) {
          status = 'approved';
          autoApprovedBy = 'corporate_license';
          planId = corporatePlanId;
          companyDomain = domain;
          licenseStatus = 'active';
          licenseKey = assignedLicenseKey || generateCorporateLicenseKey(domain, uid);
          companyRole = assignedCompanyRole;
          incidentAccess = assignedIncidentAccess;
        } else if (isVerified && hasCorporateLicense) {
          status = 'approved';
          autoApprovedBy = 'corporate_license';
          planId = corporatePlanId;
          companyDomain = domain;
          licenseStatus = 'active';
          licenseKey = generateCorporateLicenseKey(domain, uid);
        } else if (validRefCode && referralAutoApproves) {
          status = 'approved';
          autoApprovedBy = 'meli_referral';
          planId = 'free_corp';
        }

        const prefix = domain === 'mercadolivre.com' ? 'MELI' : 'REF';
        const myRefCode = `${prefix}-${uid.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}`;

        try {
          await setDoc(userRef, {
            uid,
            email,
            domain,
            displayName,
            photoURL,
            role,
            status,
            planId,
            referralCode: myRefCode,
            referredByCode: validRefCode,
            referredByUid: referrerUid,
            referredByDomain: referrerDomain,
            autoApprovedBy,
            licenseKey,
            companyDomain,
            licenseStatus,
            companyRole,
            incidentAccess,
            accessCount: 0,
            notes: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          });
          if (hasAssignedLicense && assignedLicenseId) {
            await updateDoc(doc(db, 'corporate_companies', domain, 'licenses', assignedLicenseId), {
              assignedUid: uid,
              updatedAt: serverTimestamp()
            }).catch(() => {});
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
        }

        if (isVerified) {
          try {
            const myCodeRef = doc(db, 'referral_codes', myRefCode);
            const myCodeSnap = await getDoc(myCodeRef);
            if (!myCodeSnap.exists()) {
              await setDoc(myCodeRef, {
                code: myRefCode,
                ownerUid: uid,
                ownerName: displayName,
                ownerDomain: domain,
                active: true,
                totalReferrals: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `referral_codes/${myRefCode}`);
          }
        }

        if (validRefCode && referrerUid) {
          const refDocId = `${referrerUid}_${uid}`;
          try {
            await setDoc(doc(db, 'referrals', refDocId), {
              id: refDocId,
              code: validRefCode,
              referrerUid,
              referrerName,
              referrerDomain,
              referredUid: uid,
              referredName: displayName,
              referredEmail: email,
              referredDomain: domain,
              status: referralAutoApproves ? 'approved' : 'pending',
              autoApproved: referralAutoApproves,
              commissionEnabled: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `referrals/${refDocId}`);
          }

          try {
            await updateDoc(doc(db, 'referral_codes', validRefCode), {
              totalReferrals: increment(1),
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `referral_codes/${validRefCode}`);
          }
        }

        if (isBootstrapAdmin) {
          await ensureAdminSeedData(uid, email);
        }
      } else {
        const data = {
          uid: existingSnap.id,
          ...existingSnap.data()
        } as UserProfile;
        const needsAdminPromotion =
          isBootstrapAdmin && (data.role !== 'admin' || data.status !== 'approved');

        let isDomainFreeNow = false;
        let hasAssignedLicenseNow = false;
        let assignedLicIdNow = '';
        let assignedLicKeyNow = '';
        let assignedCompRoleNow: 'member' | 'company_admin' = 'member';
        let assignedIncidentAccessNow: 'read' | 'edit' = 'read';
        let hasCorporateLicenseNow = false;
        let corporatePlanIdNow = 'corp_licenca';
        if (isVerified && data.status === 'pending') {
          try {
            const domSnap = await getDoc(doc(db, 'free_domains', domain));
            if (domSnap.exists()) {
              isDomainFreeNow = domSnap.data().active === true;
            } else {
              isDomainFreeNow = domain === 'mercadolivre.com';
            }
          } catch {
            isDomainFreeNow = domain === 'mercadolivre.com';
          }

          if (!isDomainFreeNow) {
            try {
              const corpSnap = await getDoc(doc(db, 'corporate_companies', domain));
              if (corpSnap.exists() && corpSnap.data().active === true) {
                const cData = corpSnap.data();
                if (cData.planId) corporatePlanIdNow = String(cData.planId);

                if (emailLower.length <= 120) {
                  const licId = emailToLicenseId(emailLower);
                  const licSnap = await getDoc(
                    doc(db, 'corporate_companies', domain, 'licenses', licId)
                  );
                  if (licSnap.exists() && licSnap.data().status === 'active') {
                    const lData = licSnap.data();
                    hasAssignedLicenseNow = true;
                    assignedLicIdNow = licId;
                    assignedLicKeyNow = String(lData.licenseKey || '');
                    assignedCompRoleNow =
                      lData.companyRole === 'company_admin' ? 'company_admin' : 'member';
                    assignedIncidentAccessNow = lData.incidentAccess === 'edit' ? 'edit' : 'read';
                    if (lData.planId) corporatePlanIdNow = String(lData.planId);
                  }
                }

                if (!hasAssignedLicenseNow && cData.autoApprove === true) {
                  hasCorporateLicenseNow = true;
                }
              }
            } catch {
              hasCorporateLicenseNow = false;
            }
          }
        }

        if (isBootstrapAdmin || (isVerified && data.role === 'admin')) {
          await ensureAdminSeedData(uid, email);
        }

        if (isVerified && data.referralCode) {
          try {
            const myCodeRef = doc(db, 'referral_codes', data.referralCode);
            const myCodeSnap = await getDoc(myCodeRef);
            if (!myCodeSnap.exists()) {
              await setDoc(myCodeRef, {
                code: data.referralCode,
                ownerUid: uid,
                ownerName: displayName,
                ownerDomain: domain,
                active: true,
                totalReferrals: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          } catch (err) {
            console.warn('Referral code sync notice:', err);
          }
        }

        try {
          if (needsAdminPromotion) {
            await updateDoc(userRef, {
              role: 'admin',
              status: 'approved',
              autoApprovedBy: 'admin_bootstrap',
              planId: 'enterprise',
              displayName,
              photoURL,
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else if (isVerified && data.status === 'pending' && isDomainFreeNow) {
            await updateDoc(userRef, {
              status: 'approved',
              autoApprovedBy: 'free_domain',
              displayName,
              photoURL,
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else if (isVerified && data.status === 'pending' && hasAssignedLicenseNow) {
            await updateDoc(userRef, {
              status: 'approved',
              autoApprovedBy: 'corporate_license',
              planId: corporatePlanIdNow,
              companyDomain: domain,
              licenseStatus: 'active',
              licenseKey: assignedLicKeyNow,
              companyRole: assignedCompRoleNow,
              incidentAccess: assignedIncidentAccessNow,
              displayName,
              photoURL,
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            if (assignedLicIdNow) {
              await updateDoc(doc(db, 'corporate_companies', domain, 'licenses', assignedLicIdNow), {
                assignedUid: uid,
                updatedAt: serverTimestamp()
              }).catch(() => {});
            }
          } else if (isVerified && data.status === 'pending' && hasCorporateLicenseNow) {
            await updateDoc(userRef, {
              status: 'approved',
              autoApprovedBy: 'corporate_license',
              planId: corporatePlanIdNow,
              companyDomain: domain,
              licenseStatus: 'active',
              licenseKey:
                data.licenseKey && data.licenseKey.length >= 4
                  ? data.licenseKey
                  : generateCorporateLicenseKey(domain, uid),
              displayName,
              photoURL,
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else {
            await updateDoc(userRef, {
              displayName,
              photoURL,
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
        }
      }
    })();

    syncLockRef.current[uid] = job;
    try {
      await job;
    } finally {
      delete syncLockRef.current[uid];
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async fbUser => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      firebaseUserRef.current = fbUser;
      setFirebaseUser(fbUser);

      if (!fbUser) {
        userProfileRef.current = null;
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        await withTimeout(
          ensureUserProfile(fbUser),
          15000,
          'Tempo limite ao validar seu perfil no banco de dados. Tente novamente.'
        );
        const userRef = doc(db, 'users', fbUser.uid);
        unsubProfile = onSnapshot(
          userRef,
          snap => {
            if (snap.exists()) {
              const prof = {
                uid: snap.id,
                ...snap.data()
              } as UserProfile;
              userProfileRef.current = prof;
              setUserProfile(prof);
              setAuthError(null);
              if ((prof.status === 'approved' || (fbUser.emailVerified && ADMIN_EMAILS.includes(prof.email.toLowerCase()))) && pendingActionRef.current) {
                const cb = pendingActionRef.current;
                pendingActionRef.current = null;
                setIsAuthModalOpen(false);
                cb();
              }
            }
            setAuthLoading(false);
          },
          err => {
            console.error('Profile snapshot error:', err);
            setAuthError(
              err?.message || 'Erro ao sincronizar os dados do perfil no banco de dados.'
            );
            setAuthLoading(false);
          }
        );
      } catch (err: any) {
        console.error('Auth sync error:', err);
        setAuthError(err?.message || 'Não foi possível validar sua conta no banco.');
        setAuthLoading(false);
      }
    });

    return () => {
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

  const logLocationAccess = async (target: AccessTargetInput) => {
    const activeFbUser = firebaseUserRef.current || firebaseUser;
    const activeProfile = userProfileRef.current || userProfile;
    if (!activeFbUser || !activeProfile || activeProfile.status !== 'approved') return;
    const logId = `${activeFbUser.uid.slice(0, 10)}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'access_logs', logId), {
        id: logId,
        uid: activeFbUser.uid,
        userName: (activeProfile.displayName || 'Usuário').slice(0, 120),
        userEmail: activeFbUser.email || activeProfile.email,
        userDomain: activeProfile.domain,
        targetType: (target.targetType || 'LOCAL').slice(0, 40),
        targetName: (target.targetName || 'Localização').slice(0, 160),
        uf: (target.uf || 'RJ').slice(0, 16),
        municipio: (target.municipio || '').slice(0, 100),
        cisp: typeof target.cisp === 'number' && !Number.isNaN(target.cisp) ? target.cisp : 0,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', activeFbUser.uid), {
        accessCount: increment(1),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Access log write skipped:', err);
    }
  };

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
