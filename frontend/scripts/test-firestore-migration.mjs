import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  collection, connectFirestoreEmulator, doc, documentId, getCountFromServer, getDoc, getDocs,
  getFirestore, limit, orderBy, or, query, runTransaction, serverTimestamp, setDoc, startAfter,
  where, writeBatch
} from 'firebase/firestore';

const projectId = 'demo-pmt-migration';
const { firestore } = JSON.parse(await readFile(new URL('../../firebase.json', import.meta.url), 'utf8'));
const firestorePort = Number(process.env.PMT_TEST_FIRESTORE_PORT || 8185);
const authPort = Number(process.env.PMT_TEST_AUTH_PORT || 9195);
const authUrl = `http://127.0.0.1:${authPort}`;
const apiKey = 'demo-pmt-key';
const password = 'Migration-local-only-2026';
const apps = [];

function client(label, mockUserToken) {
  const app = initializeApp({ projectId, apiKey }, label);
  apps.push(app);
  const db = getFirestore(app, firestore.database);
  connectFirestoreEmulator(db, '127.0.0.1', firestorePort, mockUserToken ? { mockUserToken } : {});
  return db;
}

async function authPost(method, body) {
  const response = await fetch(`${authUrl}/identitytoolkit.googleapis.com/v1/accounts:${method}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function account(email) {
  const credentials = { email, password, returnSecureToken: true };
  let auth = await authPost('signUp', credentials);
  if (auth.error?.message === 'EMAIL_EXISTS') auth = await authPost('signInWithPassword', credentials);
  assert.ok(auth.localId, JSON.stringify(auth.error));
  if (!auth.emailVerified) {
    const sent = await authPost('sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: auth.idToken });
    assert.ok(!sent.error, JSON.stringify(sent.error));
    const { oobCodes } = await fetch(`${authUrl}/emulator/v1/projects/${projectId}/oobCodes`).then(response => response.json());
    const latest = oobCodes.findLast(code => code.email === email && code.requestType === 'VERIFY_EMAIL');
    assert.ok(latest, `Código de verificação ausente para ${email}`);
    const checked = await authPost('update', { oobCode: latest.oobCode });
    assert.ok(!checked.error, JSON.stringify(checked.error));
  }
  return { uid: auth.localId, email };
}

const denied = promise => assert.rejects(promise, { code: 'permission-denied' });
const session = (label, { uid, email }, verified = true) => client(label, { sub: uid, email, email_verified: verified });
const tenant = (db, companyDomain, list) => collection(db, 'corporate_companies', companyDomain, list);
const usersFor = (db, domain) => query(collection(db, 'users'), where('companyDomain', '==', domain));
const profile = ({ uid, email }, domain, extra = {}) => ({
  uid, email, domain: email.split('@')[1], displayName: email.split('@')[0], photoURL: '',
  role: 'user', status: 'approved', planId: 'corp_licenca', referralCode: 'TEST_CODE',
  referredByCode: '', referredByUid: '', referredByDomain: '',
  autoApprovedBy: 'corporate_license', licenseKey: 'TEST-LOCAL', companyDomain: domain,
  licenseStatus: 'active', companyRole: 'member', incidentAccess: 'read', accessCount: 0, notes: '',
  createdAt: serverTimestamp(), updatedAt: serverTimestamp(), lastLoginAt: serverTimestamp(),
  ...extra
});
const incident = (id, companyDomain, actor) => ({
  id, companyDomain, trackingCode: 'TESTE-' + companyDomain, incidentType: 'furto',
  boNumber: '', delegaciaId: 'RJ_CISP_1', delegaciaName: '1ª DP', delegaciaUf: 'RJ',
  delegaciaMunicipio: 'Rio de Janeiro', packageAtStation: true, custodyStatus: 'em_ocorrencia_delegacia',
  estimatedValue: 500, notes: '', createdByUid: actor.uid, createdByName: 'Teste Migration',
  createdAt: serverTimestamp(), updatedAt: serverTimestamp()
});
const audit = (id, companyDomain, incidentId, actor) => ({
  id, companyDomain, incidentId, trackingCode: 'TESTE', boNumber: '', delegaciaName: '1ª DP',
  action: 'created', previousStatus: '', newStatus: 'em_ocorrencia_delegacia',
  previousAtStation: false, newAtStation: true, actorUid: actor.uid, actorName: 'Teste Migration',
  actorEmail: actor.email, summary: 'Ocorrência registrada', createdAt: serverTimestamp()
});

try {
  const alfa = 'alfa.example';
  const beta = 'beta.example';
  const [superAdmin, companyAdmin, reader, editor, suspended, pending, other] = await Promise.all([
    account('super@qa.example'), account('admin@alfa.example'), account('leitor@alfa.example'),
    account('editor@alfa.example'), account('suspenso@alfa.example'), account('pendente@alfa.example'),
    account('admin@beta.example')
  ]);
  const seed = client('fixture-owner', 'owner');
  const fixture = writeBatch(seed);
  const testLicenseId = 'lic_leitor_alfa_example';
  fixture.delete(doc(tenant(seed, alfa, 'licenses'), testLicenseId));
  for (const domain of [alfa, beta]) {
    fixture.set(doc(seed, 'corporate_companies', domain), {
      domain, companyName: 'Empresa ' + domain, planId: 'corp_licenca',
      pricePerLicense: 49, licensedSeats: 60, autoApprove: false, active: true,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    fixture.set(doc(tenant(seed, domain, 'incidents'), 'caso.legado'), {
      ...incident('caso.legado', domain, superAdmin),
      id: 'id_legado_divergente'
    });
    for (let index = 0; index < 35; index += 1) {
      const auditId = `historico_${String(index).padStart(2, '0')}`;
      fixture.set(doc(tenant(seed, domain, 'incident_audit_logs'), auditId), audit(auditId, domain, 'caso.legado', superAdmin));
    }
  }
  fixture.set(doc(seed, 'plans', 'corp_licenca'), {
    id: 'corp_licenca', name: 'Plano corporativo', description: '', priceMonthly: 49,
    maxQueriesPerMonth: 1000, features: [], active: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  const profiles = [
    profile(superAdmin, '', { role: 'admin', licenseStatus: 'none', autoApprovedBy: 'manual_admin' }),
    profile(companyAdmin, alfa, { companyRole: 'company_admin' }),
    profile(reader, alfa),
    profile(editor, alfa, { incidentAccess: 'edit' }),
    profile(suspended, alfa, { licenseStatus: 'suspended' }),
    profile(pending, '', { status: 'pending', licenseStatus: 'none', autoApprovedBy: 'pending_approval' }),
    profile(other, beta, { companyRole: 'company_admin' })
  ];
  profiles.forEach(user => fixture.set(doc(seed, 'users', user.uid), user));
  fixture.set(doc(seed, 'admins', reader.uid), { uid: reader.uid, email: reader.email, createdAt: serverTimestamp() });
  for (let index = 0; index < 36; index += 1) {
    const id = `migracao_pendente_${String(index).padStart(2, '0')}`;
    fixture.set(doc(seed, 'users', id), profile({ uid: id, email: `${id}@qa.example` }, '', {
      status: 'pending', licenseStatus: 'none', autoApprovedBy: 'pending_approval'
    }));
  }
  await fixture.commit();

  const admin = session('super-admin', superAdmin);
  const company = session('company-admin', companyAdmin);
  const member = session('read-only', reader);
  const editorDb = session('editor', editor);
  const otherCompany = session('other-company-admin', other);
  const suspendedDb = session('suspended', suspended);
  const pendingDb = session('pending', pending);
  const unverified = session('unverified', editor, false);
  const signedOut = client('signed-out');

  await Promise.all([
    denied(getDocs(tenant(signedOut, alfa, 'incidents'))),
    denied(getDocs(tenant(pendingDb, alfa, 'incidents'))),
    denied(getDocs(tenant(unverified, alfa, 'incidents'))),
    denied(getDocs(tenant(suspendedDb, alfa, 'incidents'))),
    denied(getDocs(tenant(otherCompany, alfa, 'incidents'))),
    denied(getDocs(tenant(member, beta, 'incidents'))),
    denied(getDocs(tenant(member, alfa, 'incident_audit_logs'))),
    denied(getDocs(collection(member, 'corporate_companies'))),
    denied(getDocs(tenant(company, beta, 'incident_audit_logs'))),
    denied(getDocs(usersFor(company, beta))),
    denied(getDocs(collection(company, 'users'))),
    denied(getDoc(doc(company, 'users', other.uid))),
    denied(getDocs(usersFor(member, alfa))),
    denied(setDoc(doc(tenant(member, alfa, 'incidents'), 'recusado'), incident('recusado', alfa, reader)))
  ]);
  assert.equal((await getDocs(usersFor(company, alfa))).size, 4);
  assert.equal((await getDocs(usersFor(otherCompany, beta))).size, 1);
  assert.equal((await getDoc(doc(tenant(member, alfa, 'incidents'), 'caso.legado'))).data().companyDomain, alfa);
  assert.equal((await getDoc(doc(tenant(admin, beta, 'incidents'), 'caso.legado'))).data().companyDomain, beta);

  const userSource = query(collection(admin, 'users'), where('status', '==', 'pending'), orderBy(documentId()));
  const userPage = await getDocs(query(userSource, limit(30)));
  const nextUsers = await getDocs(query(userSource, startAfter(userPage.docs.at(-1)), limit(30)));
  assert.equal(userPage.size, 30);
  assert.equal(nextUsers.size, 7);
  assert.equal((await getCountFromServer(userSource)).data().count, 37);
  const scoped = query(collection(admin, 'users'), or(where('companyDomain', 'in', [alfa, beta]), where('domain', 'in', [alfa, beta])));
  assert.equal((await getDocs(scoped)).size, 6);

  const companyAudit = query(tenant(company, alfa, 'incident_audit_logs'), orderBy('createdAt', 'desc'), orderBy(documentId(), 'desc'));
  const auditPage = await getDocs(query(companyAudit, limit(30)));
  const nextAudit = await getDocs(query(companyAudit, startAfter(auditPage.docs.at(-1)), limit(30)));
  assert.equal(auditPage.size, 30);
  assert.ok(nextAudit.size >= 5);
  assert.equal(new Set([...auditPage.docs, ...nextAudit.docs].map(entry => entry.id)).size, auditPage.size + nextAudit.size);

  const id = `teste.${randomUUID()}`;
  const incidentRef = doc(tenant(editorDb, alfa, 'incidents'), id);
  const logRef = doc(tenant(editorDb, alfa, 'incident_audit_logs'), 'aud_' + id.replaceAll('.', '_'));
  const rejected = writeBatch(editorDb);
  rejected.set(incidentRef, incident(id, alfa, editor));
  rejected.set(logRef, { ...audit(logRef.id, alfa, id, editor), actorUid: reader.uid });
  await denied(rejected.commit());
  assert.equal((await getDoc(incidentRef)).exists(), false);

  const accepted = writeBatch(editorDb);
  accepted.set(incidentRef, incident(id, alfa, editor));
  accepted.set(logRef, audit(logRef.id, alfa, id, editor));
  await accepted.commit();
  assert.equal((await getDoc(doc(tenant(company, alfa, 'incident_audit_logs'), logRef.id))).data().incidentId, id);

  const fullEdit = writeBatch(company);
  const fullEditLogId = 'edit_' + logRef.id;
  const companyIncident = doc(tenant(company, alfa, 'incidents'), id);
  fullEdit.update(companyIncident, {
    trackingCode: 'EDITADO', carrierName: 'Transportadora de teste', packageQuantity: 3,
    packagesDelivered: 1, packagesRecovered: 0, packagesStolen: 2, incidentType: 'roubo_carga',
    boNumber: '012-3456/2026', delegaciaId: 'RJ_CISP_2', delegaciaName: '2ª DP', delegaciaUf: 'RJ',
    delegaciaMunicipio: 'Rio de Janeiro', lat: -22.9, lng: -43.2, packageAtStation: false,
    custodyStatus: 'aguardando_pericia', estimatedValue: 425, notes: 'Edição de todos os campos',
    address: 'Endereço de teste', bairro: 'Centro', updatedAt: serverTimestamp()
  });
  fullEdit.set(doc(tenant(company, alfa, 'incident_audit_logs'), fullEditLogId), {
    ...audit(fullEditLogId, alfa, id, companyAdmin), action: 'updated', newStatus: 'aguardando_pericia'
  });
  await fullEdit.commit();
  assert.equal((await getDoc(companyIncident)).data().boNumber, '012-3456/2026');
  await denied(setDoc(companyIncident, { packagesStolen: 4, updatedAt: serverTimestamp() }, { merge: true }));
  await denied(setDoc(companyIncident, { createdByUid: companyAdmin.uid, updatedAt: serverTimestamp() }, { merge: true }));

  const historyEntry = {
    id: 'hist_update', date: new Date().toISOString(), title: 'Andamento', description: '',
    status: 'aguardando_pericia', authorUid: editor.uid, authorName: 'Editor'
  };
  await runTransaction(editorDb, async transaction => {
    const before = await transaction.get(incidentRef);
    const newLog = doc(tenant(editorDb, alfa, 'incident_audit_logs'), 'history_' + logRef.id);
    transaction.update(incidentRef, {
      history: [historyEntry, ...(before.data().history ?? [])],
      custodyStatus: historyEntry.status,
      updatedAt: serverTimestamp()
    });
    transaction.set(newLog, { ...audit(newLog.id, alfa, id, editor), action: 'history_added', newStatus: historyEntry.status });
  });
  assert.equal((await getDoc(incidentRef)).data().history[0].title, 'Andamento');

  const oldIncident = doc(tenant(editorDb, alfa, 'incidents'), 'caso.legado');
  const metadataRepair = writeBatch(editorDb);
  metadataRepair.update(oldIncident, {
    id: 'caso.legado', companyDomain: alfa, updatedAt: serverTimestamp()
  });
  const repairId = 'repair_' + logRef.id;
  metadataRepair.set(doc(tenant(editorDb, alfa, 'incident_audit_logs'), repairId), {
    ...audit(repairId, alfa, 'caso.legado', editor), action: 'updated'
  });
  await metadataRepair.commit();
  assert.equal((await getDoc(oldIncident)).data().id, 'caso.legado');

  const marker = doc(tenant(admin, alfa, 'deleted_incidents'), id);
  await setDoc(marker, { id, companyDomain: alfa, deletedByUid: superAdmin.uid, deletedAt: serverTimestamp() });
  await runTransaction(admin, async transaction => {
    const target = doc(tenant(admin, alfa, 'incidents'), id);
    const before = await transaction.get(target);
    assert.ok(before.exists());
    transaction.delete(target);
    const deletedLog = doc(tenant(admin, alfa, 'incident_audit_logs'), 'delete_' + logRef.id);
    transaction.set(deletedLog, { ...audit(deletedLog.id, alfa, id, superAdmin), action: 'deleted' });
  });
  const restored = await runTransaction(editorDb, async transaction => {
    if ((await transaction.get(doc(tenant(editorDb, alfa, 'deleted_incidents'), id))).exists()) return false;
    transaction.set(incidentRef, incident(id, alfa, editor));
    return true;
  });
  assert.equal(restored, false);
  assert.equal((await getDoc(incidentRef)).exists(), false);
  await denied(setDoc(incidentRef, incident(id, alfa, editor)));

  const forged = { uid: 'forged_profile', email: 'forjado@mercadolivre.com' };
  const attacker = session('forged-profile', forged);
  await denied(setDoc(doc(attacker, 'users', forged.uid), profile(forged, beta, {
    autoApprovedBy: 'free_domain', licenseStatus: 'none', licenseKey: ''
  })));

  const license = doc(tenant(company, alfa, 'licenses'), testLicenseId);
  const memberChange = writeBatch(company);
  memberChange.set(license, {
    id: testLicenseId, email: reader.email, displayName: 'Leitor', companyDomain: alfa,
    planId: 'corp_licenca', licenseKey: 'TEST-LOCAL', status: 'active', companyRole: 'member',
    incidentAccess: 'read', assignedUid: reader.uid, invitedByUid: companyAdmin.uid,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  });
  memberChange.update(doc(company, 'users', reader.uid), { incidentAccess: 'read', updatedAt: serverTimestamp() });
  await memberChange.commit();
  assert.equal((await getDoc(license)).data().assignedUid, reader.uid);

  console.log('PASS Firestore Enterprise. Isolamento, cursores, contagem, licenças, auditoria atômica, registros legados e marcador de exclusão.');
} finally {
  await Promise.all(apps.map(app => deleteApp(app)));
}
