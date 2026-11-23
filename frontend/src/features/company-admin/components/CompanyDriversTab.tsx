import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { Copy, RefreshCw, Truck } from 'lucide-react';
import CompanyTrackingMap from './CompanyTrackingMap';
import { driveOrigin, requestDrive as request } from '../services/driveCompanyApi';

const labels = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Recusado', revoked: 'Revogado' };
type Status = keyof typeof labels;
type Decision = Exclude<Status, 'pending'>;
type Member = { uid: string; email: string; status: Status; driverName?: string; driverPhone?: string };
type Directory = { joinCode: string; members: Member[] };

const button = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#2D3277] hover:bg-slate-100 disabled:opacity-60';
const primary = 'rounded-xl bg-[#2D3277] px-3 py-2 text-xs font-bold text-[#FFE600] hover:bg-[#22265d] disabled:opacity-60';
const field = 'w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900';

export default function CompanyDriversTab({ domain, user }: { domain: string; user: User }) {
  const [directory, setDirectory] = useState<Directory>();
  const [email, setEmail] = useState('');
  const [driverName, setDriverName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState<Member>();
  const [mode, setMode] = useState<'invite' | 'register'>('invite');
  const [password, setPassword] = useState('');
  const [registration, setRegistration] = useState<{ email: string; password: string }>();
  const [inviteUrl, setInviteUrl] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [codeCopy, setCodeCopy] = useState('');
  const codeField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!driveOrigin) return;
    const controller = new AbortController();
    request<Directory>(user, domain, 'motoristas', undefined, controller.signal)
      .then(setDirectory)
      .catch((error: Error) => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [domain, refresh, user]);

  async function change(operation: () => Promise<void>) {
    if (busy) return;
    setError('');
    setStatus('');
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível concluir a operação.');
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void change(async () => {
      setInviteUrl('');
      setRegistration(undefined);
      if (mode === 'register') {
        const result = await request<{ email: string; verificationSent: boolean; linked: boolean }>(
          user, domain, 'cadastro', { email, password, name: driverName, phone }
        );
        setRegistration({ email: result.email, password });
        setPassword('');
        setDriverName('');
        setPhone('');
        setEmail('');
        if (result.linked) setRefresh(value => value + 1);
        setStatus(result.verificationSent
          ? 'Conta criada. O motorista recebeu o link para confirmar o e-mail.'
          : 'Conta criada. No Drive, o motorista pode solicitar um novo link de confirmação.');
        if (!result.linked) setError('A conta foi criada. Para completar o vínculo, gere um convite para esse e-mail.');
        return;
      }
      const { token } = await request<{ token: string }>(user, domain, 'convite', { email, name: driverName, phone });
      const link = new URL('/', driveOrigin!);
      link.searchParams.set('convite', token);
      setInviteUrl(link.href);
      setEmail('');
      setDriverName('');
      setPhone('');
      setStatus('Convite gerado. Compartilhe o link com o motorista.');
    });
  }

  function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    void change(async () => {
      const { uid, driverName: name, driverPhone: phone } = editing;
      setDirectory(await request<Directory>(user, domain, 'perfil', { uid, name, phone }));
      setEditing(undefined);
      setStatus('Dados do motorista atualizados.');
    });
  }

  function decide(uid: string, status: Decision) {
    void change(async () => {
      setDirectory(await request<Directory>(user, domain, 'decisao', { uid, status }));
      setStatus('Vínculo atualizado.');
    });
  }

  function copy(value: string) {
    void change(async () => {
      await navigator.clipboard.writeText(value);
      setStatus('Copiado.');
    });
  }

  async function copyCode() {
    const input = codeField.current;
    if (!input) return;
    try {
      if (!navigator.clipboard?.writeText) throw Error();
      await navigator.clipboard.writeText(input.value);
      setCodeCopy('Código copiado.');
    } catch {
      input.focus();
      input.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* leave the code selected */ }
      setCodeCopy(copied ? 'Código copiado.' : 'Código selecionado. Use Ctrl+C ou toque e segure para copiar.');
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5" aria-labelledby="drivers-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="drivers-title" className="flex items-center gap-2 text-base font-extrabold text-[#2D3277]">
          <Truck className="h-5 w-5" aria-hidden="true" /> Motoristas do MapsBrasil Drive
        </h3>
        {driveOrigin && <button type="button" className={button} disabled={busy} onClick={() => {
          setError('');
          setDirectory(undefined);
          setRefresh(value => value + 1);
        }}><RefreshCw className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Atualizar vínculos</button>}
      </div>
      {!driveOrigin && <p role="status" className="text-sm text-slate-700">A integração com o MapsBrasil Drive ainda não está configurada neste ambiente.</p>}
      {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
      {status && <p role="status" className="text-sm text-emerald-800">{status}</p>}
      {driveOrigin && !directory && !error && <p role="status" className="text-sm text-slate-600">Carregando motoristas…</p>}
      {directory && <>
        <CompanyTrackingMap user={user} domain={domain} drivers={directory.members} />
        <div className="grid gap-4 md:grid-cols-2">
          <form onSubmit={submit} className="space-y-2 rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Forma de cadastrar motorista">
              <button type="button" disabled={busy} aria-pressed={mode === 'invite'} className={mode === 'invite' ? primary : button}
                onClick={() => { setMode('invite'); setPassword(''); setRegistration(undefined); }}>Por convite</button>
              <button type="button" disabled={busy} aria-pressed={mode === 'register'} className={mode === 'register' ? primary : button}
                onClick={() => { setMode('register'); setInviteUrl(''); }}>Com e-mail e senha</button>
            </div>
            <label htmlFor="drive-driver-email" className="block text-sm font-bold">E-mail do motorista</label>
            <input id="drive-driver-email" type="email" placeholder="motorista@email.com" className={field}
              maxLength={254} value={email} onChange={event => setEmail(event.target.value)} required />
            <label htmlFor="drive-driver-name" className="block text-sm font-bold">Nome do motorista</label>
            <input id="drive-driver-name" className={field} maxLength={100} value={driverName}
              onChange={event => setDriverName(event.target.value)} required={mode === 'register'} />
            <label htmlFor="drive-driver-phone" className="block text-sm font-bold">Telefone do motorista</label>
            <input id="drive-driver-phone" type="tel" autoComplete="tel" placeholder="(21) 99999-9999"
              className={field} maxLength={25} value={phone} onChange={event => setPhone(event.target.value)} />
            {mode === 'register' && <>
              <label htmlFor="drive-driver-password" className="block text-sm font-bold">Senha inicial</label>
              <input id="drive-driver-password" type="password" autoComplete="new-password" className={field} minLength={8}
                maxLength={128} value={password} onChange={event => setPassword(event.target.value)} required />
            </>}
            <button type="submit" disabled={busy} className={primary}>{mode === 'register' ? 'Cadastrar motorista' : 'Gerar convite'}</button>
            {registration && <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={busy} className={button}
                onClick={() => copy(`MapsBrasil Drive: ${driveOrigin}\nE-mail: ${registration.email}\nSenha inicial: ${registration.password}`)}>
                <Copy className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Copiar dados de acesso
              </button>
              <button type="button" className={button} onClick={() => setRegistration(undefined)}>Concluir</button>
            </div>}
            {inviteUrl && <div className="space-y-2">
              <label htmlFor="drive-invite-link" className="block text-sm font-bold">Link do convite</label>
              <input id="drive-invite-link" value={inviteUrl} readOnly className={field} />
              <button type="button" disabled={busy} className={button} onClick={() => copy(inviteUrl)}>
                <Copy className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" /> Copiar convite
              </button>
            </div>}
          </form>
          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            <label htmlFor="drive-join-code" className="block text-sm font-bold">Código para autocadastro</label>
            <p className="text-xs text-slate-600">O motorista informa o código no Drive e aguarda a aprovação da empresa.</p>
            <input id="drive-join-code" ref={codeField} value={directory.joinCode} readOnly className={field} onFocus={event => event.currentTarget.select()} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} onClick={() => void copyCode()}>Copiar código</button>
              <a className={button} href={`${driveOrigin}/?codigo=${encodeURIComponent(directory.joinCode)}`} target="_blank" rel="noopener noreferrer">Abrir autocadastro no Drive</a>
            </div>
            <p role="status" className="text-xs text-slate-600">{codeCopy}</p>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-bold">Vínculos de motoristas</h4>
          {directory.members.length === 0 && <p className="text-sm text-slate-600">Nenhum vínculo nesta empresa.</p>}
          <ul className="divide-y divide-slate-200">
            {directory.members.map(member => <li key={member.uid} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                {member.driverName && <p className="break-words text-sm font-semibold">{member.driverName}</p>}
                <p className="break-all text-sm font-semibold">{member.email}</p>
                {member.driverPhone && <p className="text-xs text-slate-600">{member.driverPhone}</p>}
                <span className="text-xs text-slate-600">{labels[member.status]}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} className={button} onClick={() => setEditing(member)}>Editar contato</button>
                {member.status === 'pending' && <>
                  <button type="button" disabled={busy} className={primary} onClick={() => decide(member.uid, 'approved')}>Aprovar</button>
                  <button type="button" disabled={busy} className={button} onClick={() => decide(member.uid, 'rejected')}>Recusar</button>
                </>}
                {member.status === 'approved' && <button type="button" disabled={busy} className={button}
                  onClick={() => decide(member.uid, 'revoked')}>Revogar</button>}
                {(member.status === 'rejected' || member.status === 'revoked') && <button type="button" disabled={busy}
                  className={button} onClick={() => decide(member.uid, 'approved')}>Restaurar acesso</button>}
              </div>
              {editing?.uid === member.uid && <form onSubmit={saveContact} className="grid w-full gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-2">
                <label className="text-xs font-bold">Nome para exibição<input className={field} value={editing.driverName ?? ''}
                  maxLength={100} required onChange={event => setEditing({ ...editing, driverName: event.target.value })} /></label>
                <label className="text-xs font-bold">Telefone com DDD<input className={field} type="tel" value={editing.driverPhone ?? ''}
                  maxLength={25} onChange={event => setEditing({ ...editing, driverPhone: event.target.value })} /></label>
                <div className="flex gap-2">
                  <button type="submit" className={primary} disabled={busy}>Salvar contato</button>
                  <button type="button" className={button} disabled={busy} onClick={() => setEditing(undefined)}>Cancelar</button>
                </div>
              </form>}
            </li>)}
          </ul>
        </div>
      </>}
    </section>
  );
}
