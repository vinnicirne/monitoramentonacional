# Firestore Security Specification (Phase 0)

## Data Invariants
1. **Strict Ownership & PII Isolation**: `users/{userId}` holds `email` (PII). Non-admin users can only read (`get`) their own document and cannot list other users. Only `isAdmin()` can list or manage users.
2. **No Self-Privilege Escalation**: A newly registering user cannot set `role: 'admin'` unless verified as `isAdmin()`.
3. **Domain & Referral Gate**: On `users/{userId}` create, `status` may only be `'approved'` if the caller is `isAdmin()`, their verified Google email belongs to an active free domain (`mercadolivre.com` or active doc in `free_domains`), OR their `referredByCode` points to an active `referral_codes/{code}` owned by an active free-domain user (`autoApproveReferrals == true`). Otherwise, `status` MUST be `'pending'`.
4. **Admin Control Planes**: Only `isAdmin()` (`adm.desbloqueio@gmail.com` verified or present in `/admins/{uid}`) may create/update/delete `free_domains`, `plans`, and `admins`, or approve/block other users and referrals.
5. **Immutable Audit & Creation Timestamps**: `createdAt == request.time` on creation; `updatedAt == request.time` on updates; `createdAt` and `uid` remain immutable.
6. **Referral Integrity & Non-Commission Flag**: `commissionEnabled` is locked to `false` on client creation (`Referrals` without commission for now).
7. **Location Access Log Ownership**: `access_logs` entries can only be created by authenticated users with `uid == request.auth.uid` and read only by the owner or `isAdmin()`.

## "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Self-Approved External User**: `@gmail.com` user attempts `create` on `/users/{uid}` with `status: 'approved'` and empty `referredByCode`.
2. **Self-Promoted Admin**: User attempts `create` or `update` on `/users/{uid}` with `role: 'admin'`.
3. **Shadow Ghost Field**: User includes an undeclared field `isSuperUser: true` on `/users/{uid}` or `/access_logs/{id}`.
4. **Domain Spoofing**: `@gmail.com` user sets `domain: 'mercadolivre.com'` in `/users/{uid}` to bypass the free-domain gate.
5. **Unverified Email Bypass**: Attacker with `email_verified: false` tries to write `/users/{uid}` or `/access_logs/{id}`.
6. **Blanket User List Scraping**: Non-admin authenticated user calls `getDocs(collection(db, 'users'))`.
7. **Cross-User PII Read**: Non-admin calls `getDoc(doc(db, 'users', 'otherUid'))`.
8. **Fake Free Domain Creation**: Non-admin tries to create `/free_domains/gmail.com` with `active: true`.
9. **Plan Tampering**: Non-admin tries to update `/plans/enterprise` price to `0`.
10. **Forged Access Log**: User `A` creates `/access_logs/{id}` with `uid: 'userB'`.
11. **Timestamp Forgery**: User submits backdated `createdAt` instead of `request.time`.
12. **Referral Commission Injection**: User creates `/referrals/{id}` with `commissionEnabled: true` or forged `status: 'approved'` from an unprivileged external referrer.
