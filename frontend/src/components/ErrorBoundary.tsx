import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado na aplicação.'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMsg = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed && parsed.error) {
          friendlyMsg = `Erro de permissão/banco (${parsed.operationType} em ${parsed.path}): ${parsed.error}`;
        }
      } catch {
        // non-JSON message
        if (
          this.state.errorMessage.includes('insertBefore') ||
          this.state.errorMessage.includes('not a child of this node') ||
          this.state.errorMessage.includes('removeChild')
        ) {
          friendlyMsg =
            'Inconsistência de renderização do mapa ou tradução automática do navegador. O elemento do mapa foi recuperado. Clique em "Recarregar Sistema" abaixo.';
        } else if (this.state.errorMessage.includes('unauthorized-domain')) {
          friendlyMsg =
            'Domínio não autorizado no Firebase Console. Adicione o domínio atual em: Firebase Console > Authentication > Settings > Authorized domains.';
        }
      }

      return (
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFE600] border border-[#E6CF00] flex items-center justify-center text-[#2D3277] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#2D3277]">
                  Ocorreu uma falha de execução
                </h2>
                <p className="text-xs text-slate-500">
                  Painel de Monitoramento Territorial
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 break-words font-mono">
              {friendlyMsg}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#3483FA] hover:bg-[#2968C8] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recarregar Sistema</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
