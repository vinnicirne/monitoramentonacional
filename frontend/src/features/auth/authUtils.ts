export interface AccessTargetInput {
  targetType: string;
  targetName: string;
  uf?: string;
  municipio?: string;
  cisp?: number;
}

export function sanitizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
}

export function sanitizeEmailDomain(email: string): string {
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
  const seedTag = seed.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).padEnd(6, 'X');
  return `LIC-${domPrefix}-${seedTag}`.slice(0, 64);
}

export function mapAuthErrorToPortuguese(error: any): string {
  const code = error?.code || '';
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
      if (error?.message?.includes('unauthorized-domain') || error?.message?.includes('not authorized for OAuth operations')) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
        return `Domínio não autorizado no Firebase (${currentHost}). Adicione "${currentHost}" no Firebase Console > Authentication > Settings > Authorized domains. Enquanto isso, use o login com E-mail e Senha acima!`;
      }
      return error?.message || 'Erro ao autenticar. Tente novamente.';
  }
}
