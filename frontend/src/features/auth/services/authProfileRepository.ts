import type { User as FirebaseUser } from 'firebase/auth';
import { getDoc, increment, onSnapshot, serverTimestamp, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { handleFirestoreError } from '../../../firebase';
import { readCompany, readFreeDomain, readLicense, readReferralCode, readUserProfile } from '../../../shared/firebase/adminDocuments';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import { AutoApprovalSource, OperationType, UserProfile } from '../../../types/admin';
import { emailToLicenseId, generateCorporateLicenseKey, sanitizeEmailDomain, sanitizeReferralCode } from '../authUtils';
import { ADMIN_EMAILS, REF_STORAGE_KEY } from '../authConstants';

export function subscribeToAuthProfile(
  uid: string,
  onProfile: (profile: UserProfile | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(firestoreRefs.user(uid), snapshot => {
    onProfile(snapshot.exists()
      ? readUserProfile(snapshot.id, snapshot.data())
      : null);
  }, onError);
}

export async function syncAuthUserProfile(fbUser: FirebaseUser, explicitRefCode: string | undefined, pendingReferralCode: string, syncLock: Record<string, Promise<void> | undefined>, ensureAdminSeedData: (uid: string, email: string) => Promise<void>) {
    const uid = fbUser.uid;
    if (syncLock[uid]) {
      return syncLock[uid];
    }

    const job = (async () => {
      const userRef = firestoreRefs.user(uid);
      let existingSnap;
      try {
        existingSnap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      }

      const email = fbUser.email || '';
      const emailLower = email.toLowerCase();
      const domain = sanitizeEmailDomain(email);
      const displayName = (fbUser.displayName || email.split('@')[0] || 'Usuário').slice(0, 120);
      const photoURL = (fbUser.photoURL || '').slice(0, 500);
      const isVerified = fbUser.emailVerified === true;
      const isBootstrapAdmin = isVerified && ADMIN_EMAILS.includes(emailLower);

      if (!existingSnap.exists()) {
        if (isBootstrapAdmin) {
          try {
            await setDoc(firestoreRefs.admin(uid), {
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
          const domSnap = await getDoc(firestoreRefs.freeDomain(domain));
          if (domSnap.exists()) {
            const dData = readFreeDomain(domSnap.id, domSnap.data());
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
        const codeToUse = sanitizeReferralCode(explicitRefCode || pendingReferralCode || storedRef || '');
        let validRefCode = '';
        let referrerUid = '';
        let referrerName = '';
        let referrerDomain = '';
        let referralAutoApproves = false;

        if (codeToUse) {
          try {
            const refCodeSnap = await getDoc(firestoreRefs.referralCode(codeToUse));
            if (refCodeSnap.exists()) {
              const rcData = readReferralCode(refCodeSnap.id, refCodeSnap.data());
              if (rcData.active === true && rcData.ownerUid !== uid) {
                validRefCode = codeToUse;
                referrerUid = String(rcData.ownerUid || '');
                referrerName = String(rcData.ownerName || 'Indicador');
                referrerDomain = String(rcData.ownerDomain || '').toLowerCase();

                if (referrerDomain === 'mercadolivre.com') {
                  referralAutoApproves = true;
                } else if (referrerDomain) {
                  try {
                    const rDomSnap = await getDoc(firestoreRefs.freeDomain(referrerDomain));
                    if (rDomSnap.exists()) {
                      const rd = readFreeDomain(rDomSnap.id, rDomSnap.data());
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
          const corpSnap = await getDoc(firestoreRefs.company(domain));
          if (corpSnap.exists() && corpSnap.data().active === true) {
            const cData = readCompany(corpSnap.id, corpSnap.data());
            if (cData.planId) corporatePlanId = String(cData.planId);

            if (isVerified && emailLower.length <= 120) {
              const licId = emailToLicenseId(emailLower);
              const licSnap = await getDoc(
                firestoreRefs.companyLicense(domain, licId)
              );
              if (licSnap.exists()) {
                const lData = readLicense(licSnap.id, licSnap.data());
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
            await updateDoc(firestoreRefs.companyLicense(domain, assignedLicenseId), {
              assignedUid: uid,
              updatedAt: serverTimestamp()
            }).catch(() => {});
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
        }

        if (isVerified) {
          try {
            const myCodeRef = firestoreRefs.referralCode(myRefCode);
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
            await setDoc(firestoreRefs.referral(refDocId), {
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
            await updateDoc(firestoreRefs.referralCode(validRefCode), {
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
        const data = readUserProfile(existingSnap.id, existingSnap.data());
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
            const domSnap = await getDoc(firestoreRefs.freeDomain(domain));
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
              const corpSnap = await getDoc(firestoreRefs.company(domain));
              if (corpSnap.exists() && corpSnap.data().active === true) {
                const cData = readCompany(corpSnap.id, corpSnap.data());
                if (cData.planId) corporatePlanIdNow = String(cData.planId);

                if (emailLower.length <= 120) {
                  const licId = emailToLicenseId(emailLower);
                  const licSnap = await getDoc(
                    firestoreRefs.companyLicense(domain, licId)
                  );
                  if (licSnap.exists() && licSnap.data().status === 'active') {
                    const lData = readLicense(licSnap.id, licSnap.data());
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
            const myCodeRef = firestoreRefs.referralCode(data.referralCode);
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
              await updateDoc(firestoreRefs.companyLicense(domain, assignedLicIdNow), {
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

    syncLock[uid] = job;
    try {
      await job;
    } finally {
      delete syncLock[uid];
    }
}
