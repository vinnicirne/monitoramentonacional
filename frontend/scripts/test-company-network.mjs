import assert from 'node:assert/strict';
import { deleteApp, initializeApp } from 'firebase/app';
import { collection, connectFirestoreEmulator, deleteDoc, doc, getDocFromServer, getDocsFromServer, getFirestore,
  query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';

const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8765';
const [hostname, port] = host.split(':');
if (!['127.0.0.1', 'localhost'].includes(hostname) || !Number(port)) throw Error('Use um emulador local.');
const projectId = 'demo-company-network';
const fixture = Math.random().toString(36).slice(2, 10);
const domains = Object.fromEntries(['principal', 'carrier', 'unrelated'].map(role => [role, role + '.' + fixture + '.example']));
const apps = [];
async function seed(path, fields) {
  const response = await fetch('http://' + host + '/v1/projects/' + projectId + '/databases/(default)/documents/' + path, {
    method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
  });
  assert.ok(response.ok, await response.text());
}
const str = stringValue => ({ stringValue });
async function actor(role) {
  const uid = role + '-' + fixture;
  const domain = domains[role];
  const email = role + '@' + domain;
  await seed('corporate_companies/' + domain, { active: { booleanValue: true }, companyName: str(role) });
  await seed('users/' + uid, { uid: str(uid), domain: str(domain), companyDomain: str(domain), role: str('user'),
    companyRole: str('company_admin'), status: str('approved'), licenseStatus: str('active') });
  const app = initializeApp({ projectId }, uid);
  apps.push(app);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, hostname, Number(port), { mockUserToken: { sub: uid, email, email_verified: true } });
  return db;
}
const deny = operation => assert.rejects(operation, error => error.code === 'permission-denied');
function propose(db, parent, child) {
  return runTransaction(db, async tx => {
    const root = doc(db, 'corporate_fleet_roots', parent);
    if (!(await tx.get(root)).exists()) tx.set(root, { createdAt: serverTimestamp() });
    tx.set(doc(db, 'corporate_fleet_links', child), { parentDomain: parent, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
}
const approve = (db, scope) => updateDoc(doc(db, 'corporate_fleet_links', domains.carrier), {
  status: 'approved', scope, childName: 'carrier', updatedAt: serverTimestamp()
});

try {
  const [principal, carrier, unrelated] = await Promise.all(['principal', 'carrier', 'unrelated'].map(actor));
  const carrierLink = db => doc(db, 'corporate_fleet_links', domains.carrier);
  const carrierCompany = doc(principal, 'corporate_companies', domains.carrier);
  const carrierUsers = query(collection(principal, 'users'), where('companyDomain', '==', domains.carrier));
  const carrierIncidents = collection(principal, 'corporate_companies', domains.carrier, 'incidents');
  await deny(propose(principal, domains.carrier, domains.unrelated));
  await propose(principal, domains.principal, domains.carrier);
  assert.equal((await getDocFromServer(carrierLink(carrier))).data().status, 'pending');
  const outbound = query(collection(principal, 'corporate_fleet_links'), where('parentDomain', '==', domains.principal));
  assert.equal((await getDocsFromServer(outbound)).size, 1);
  await deny(getDocFromServer(carrierLink(unrelated)));
  await deny(approve(principal, 'full'));
  await deny(getDocFromServer(carrierCompany));
  await approve(carrier, 'drivers');
  assert.equal((await getDocFromServer(carrierLink(principal))).data().scope, 'drivers');
  await deny(getDocFromServer(carrierCompany));
  await deny(getDocsFromServer(carrierUsers));
  await deny(getDocsFromServer(carrierIncidents));
  await deny(propose(carrier, domains.carrier, domains.unrelated));
  await approve(carrier, 'full');
  assert.equal((await getDocFromServer(carrierCompany)).data().companyName, 'carrier');
  assert.equal((await getDocsFromServer(carrierUsers)).size, 1);
  await getDocsFromServer(carrierIncidents);
  await deny(getDocsFromServer(collection(principal, 'users')));
  await deny(getDocFromServer(doc(carrier, 'corporate_companies', domains.principal)));
  await approve(carrier, 'drivers');
  await deny(getDocsFromServer(carrierUsers));
  await deleteDoc(carrierLink(carrier));
  await deny(getDocFromServer(carrierCompany));
  console.log('Aprovação, escopo de motoristas, gestão total, bloqueio entre empresas e revogação verificados.');
} finally {
  await Promise.all(apps.map(deleteApp));
}
