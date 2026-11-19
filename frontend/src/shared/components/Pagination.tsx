interface PaginationProps {
  page: number;
  hasNext: boolean;
  loading?: boolean;
  previous: () => void;
  next: () => void;
}

export function Pagination({ page, hasNext, loading, previous, next }: PaginationProps) {
  if (page === 1 && !hasNext && !loading) return null;
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3 border-t border-slate-200 p-3 text-xs">
      <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
        disabled={page === 1 || loading} onClick={previous}>
        Anterior
      </button>
      <span role="status">{loading ? 'Carregando…' : `Página ${page}`}</span>
      <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
        disabled={!hasNext || loading} onClick={next}>
        Próxima
      </button>
    </nav>
  );
}
