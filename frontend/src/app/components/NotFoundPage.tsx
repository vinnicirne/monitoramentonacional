import React from 'react';
import { Home, Map } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => (
  <section className="flex-1 grid place-items-center p-6" aria-labelledby="not-found-title">
    <div className="max-w-md text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#FFE600] text-[#2D3277]">
        <Map className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Erro 404</p>
      <h1 id="not-found-title" className="mt-2 text-2xl font-extrabold text-[#2D3277]">
        Esta página não existe
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        O endereço pode ter mudado ou estar digitado incorretamente.
      </p>
      <button
        type="button"
        onClick={onGoHome}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2D3277] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1E2258]"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        Ir para o mapa
      </button>
    </div>
  </section>
);
