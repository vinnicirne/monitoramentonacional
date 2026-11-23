import { useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { deleteDoc, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Building2, Network, Truck } from 'lucide-react';
import { db } from '../../../firebase';
import { firestoreRefs } from '../../../shared/firebase/firestoreRefs';
import CompanyDriversTab from './CompanyDriversTab';

type Scope = 'drivers' | 'full';
type Branch = { domain: string; parentDomain: string; status: 'pending' | 'approved'; scope?: Scope; childName?: string };
const button = 'rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#2D3277] hover:bg-blue-50 disabled:opacity-50';
const primary = 'rounded-lg bg-[#2D3277] px-3 py-2 text-xs font-bold text-white disabled:opacity-50';

export default function CompanyNetwork({ domain, name, user, onOpenCompany }: {
  domain: string; name: string; user: User; onOpenCompany: (domain: string) => void;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [incoming, setIncoming] = useState<Branch>();
  const [selected, setSelected] = useState('');
  const [target, setTarget] = useState('');
  const [scope, setScope] = useState<Scope>('drivers');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const read = () => setError('Não foi possível consultar a rede de empresas.');
    const stopChildren = onSnapshot(query(firestoreRefs.fleetLinks(), where('parentDomain', '==', domain)), snapshot => {
      setBranches(snapshot.docs.map(row => ({ ...row.data(), domain: row.id } as Branch)));
    }, read);
    const stopParent = onSnapshot(firestoreRefs.fleetLink(domain), snapshot => {
      const next = snapshot.exists() ? { ...snapshot.data(), domain } as Branch : undefined;
      setIncoming(next);
      setScope(next?.scope ?? 'drivers');
    }, read);
    return () => { stopChildren(); stopParent(); };
  }, [domain]);

  async function change(operation: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await operation();
    } catch {
      setError('Não foi possível salvar o vínculo. Confira se as empresas estão ativas e se a transportadora já participa de outra rede.');
    } finally {
      setBusy(false);
    }
  }

  function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const child = target.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9.-]{1,118}[a-z0-9]$/.test(child) || child === domain) {
      setError('Informe o domínio cadastrado da transportadora.');
      return;
    }
    void change(async () => {
      await runTransaction(db, async transaction => {
        const root = firestoreRefs.fleetRoot(domain);
        if (!(await transaction.get(root)).exists()) transaction.set(root, { createdAt: serverTimestamp() });
        transaction.set(firestoreRefs.fleetLink(child), {
          parentDomain: domain, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
      });
      setTarget('');
    });
  }

  const branch = branches.find(item => item.domain === selected && item.status === 'approved');

  return <section className="space-y-4">
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="flex items-center gap-2 font-extrabold text-[#2D3277]"><Network size={18} aria-hidden="true" /> Rede de empresas</h3>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {incoming && <div className="space-y-2 rounded-xl bg-slate-50 p-3">
        <p className="text-sm"><strong>{incoming.parentDomain}</strong> {incoming.status === 'pending' ? 'solicitou um vínculo.' : 'é a empresa principal.'}</p>
        <label className="block text-sm font-semibold" htmlFor="fleet-scope">Permissão para a empresa principal</label>
        <select id="fleet-scope" value={scope} onChange={event => setScope(event.target.value as Scope)} disabled={busy}
          className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="drivers">Apenas motoristas, posições e rotas</option>
          <option value="full">Toda a gestão do Painel Empresa</option>
        </select>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primary} disabled={busy || (incoming.status === 'approved' && scope === incoming.scope)}
            onClick={() => void change(async () => {
              await updateDoc(firestoreRefs.fleetLink(domain), { status: 'approved', scope, childName: name, updatedAt: serverTimestamp() });
            })}>{incoming.status === 'pending' ? 'Aceitar vínculo' : 'Salvar permissão'}</button>
          <button type="button" className={button} disabled={busy} onClick={() => void change(() => deleteDoc(firestoreRefs.fleetLink(domain)))}>
            {incoming.status === 'pending' ? 'Recusar solicitação' : 'Encerrar vínculo'}
          </button>
        </div>
      </div>}
      {incoming?.status !== 'approved' && <form onSubmit={requestLink} className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-sm font-semibold" htmlFor="carrier-domain">Domínio da transportadora
          <input id="carrier-domain" placeholder="transportadora.com.br" value={target} required maxLength={120}
            onChange={event => setTarget(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className={primary} disabled={busy}>Solicitar vínculo</button>
      </form>}
      <strong className="flex items-center gap-2 text-sm"><Building2 size={16} aria-hidden="true" /> {name}</strong>
      <ul className="ml-2 space-y-2 border-l border-slate-200 pl-3">
        {branches.map(item => <li key={item.domain} className="space-y-2 rounded-lg bg-slate-50 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Truck size={16} aria-hidden="true" />
            <span className="text-sm font-semibold">{item.childName ?? item.domain}</span>
            <span className="text-xs text-slate-700">{item.status === 'pending' ? 'Aguardando aceite' : item.scope === 'full' ? 'Gestão total' : 'Apenas motoristas'}</span>
            {item.status === 'approved' && <>
              <button type="button" className={button} aria-pressed={branch?.domain === item.domain}
                onClick={() => setSelected(branch?.domain === item.domain ? '' : item.domain)}>Ver motoristas</button>
              {item.scope === 'full' && <button type="button" className={button} onClick={() => onOpenCompany(item.domain)}>Abrir painel</button>}
            </>}
            <button type="button" className={button} disabled={busy} onClick={() => void change(() => deleteDoc(firestoreRefs.fleetLink(item.domain)))}>
              {item.status === 'pending' ? 'Cancelar solicitação' : 'Desvincular'}
            </button>
          </div>
          {branch?.domain === item.domain && <CompanyDriversTab domain={branch.domain} user={user} />}
        </li>)}
        {branches.length === 0 && <li className="text-sm text-slate-600">Nenhuma transportadora vinculada.</li>}
      </ul>
    </div>
  </section>;
}
