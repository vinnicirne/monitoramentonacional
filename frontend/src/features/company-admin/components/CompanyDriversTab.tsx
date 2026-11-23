import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { Copy, RefreshCw, Truck } from 'lucide-react';

const labels = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Recusado', revoked: 'Revogado' };
type Status = keyof typeof labels;
type Decision = Exclude<Status, 'pending'>;
type Member = { uid: string; email: string; status: Status };
type Directory = { joinCode: string; members: Member[] };

const driveOrigin = (() => {
  try {
    const url = new URL(import.meta.env.VITE_MAPSBRASIL_DRIVE_URL || '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
})();

const button = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#2D3277] hover:bg-slate-100 disabled:opacity-60';
const primary = 'rounded-xl bg-[#2D3277] px-3 py-2 text-xs font-bold text-[#FFE600] hover:bg-[#22265d] disabled:opacity-60';
const field = 'w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900';

async function request<T>(user: User, domain: string, action: string, payload?: object, signal?: AbortSignal): Promise<T> {
  const token = await user.getIdToken();
  const timeout = AbortSignal.timeout(action === 'cadastro' ? 25000 : 12000);
  const response = await fetch(`${driveOrigin}/api/empresa/${encodeURIComponent(domain)}/${action}`, {
    method: payload ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
    signal: signal ? AbortSignal.any([timeout, signal]) : timeout
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.error || 'Não foi possível acessar a gestão do MapsBrasil Drive.');
  return result;
}

export default function CompanyDriversTab({ domain, user }: { domain: string; user: User }) {
  const [directory, setDirectory] = useState<Directory>();
  const [email, setEmail] = useState('');
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
        const result = await request<{ email: string; verificationSent: boolean; linked: boolean }>(user, domain, 'cadastro', { email, password });
        setRegistration({ email: result.email, password });
        setPassword('');
        setEmail('');
        if (result.linked) setRefresh(value => value + 1);
        setStatus(result.verificationSent
          ? 'Conta criada. O motorista recebeu o link para confirmar o e-mail.'
          : 'Conta criada. No Drive, o motorista pode solicitar um novo link de confirmação.');
        if (!result.linked) setError('A conta foi criada. Para completar o vínculo, gere um convite para esse e-mail.');
        return;
      }
      const { token } = await request<{ token: string }>(user, domain, 'convite', { email });
      const link = new URL('/', driveOrigin!);
      link.searchParams.set('convite', token);
      setInviteUrl(link.href);
      setEmail('');
      setStatus('Convite gerado. Compartilhe o link com o motorista.');
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
                <p className="break-all text-sm font-semibold">{member.email}</p>
                <span className="text-xs text-slate-600">{labels[member.status]}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {member.status === 'pending' && <>
                  <button type="button" disabled={busy} className={primary} onClick={() => decide(member.uid, 'approved')}>Aprovar</button>
                  <button type="button" disabled={busy} className={button} onClick={() => decide(member.uid, 'rejected')}>Recusar</button>
                </>}
                {member.status === 'approved' && <button type="button" disabled={busy} className={button}
                  onClick={() => decide(member.uid, 'revoked')}>Revogar</button>}
                {(member.status === 'rejected' || member.status === 'revoked') && <button type="button" disabled={busy}
                  className={button} onClick={() => decide(member.uid, 'approved')}>Restaurar acesso</button>}
              </div>
            </li>)}
          </ul>
        </div>
      </>}
    </section>
  );
}
