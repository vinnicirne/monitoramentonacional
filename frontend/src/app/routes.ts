export type MainActiveTab = 'map' | 'sig_mges' | 'stats' | 'audit' | 'import' | 'about' | 'admin' | 'company_admin';

export interface AppRouteMatch {
  tab: Exclude<MainActiveTab, 'import'>;
  importer?: boolean;
  incidentId?: string;
  requiresApprovedAccess?: boolean;
  requiresSuperAdmin?: boolean;
  requiresCompanyAdmin?: boolean;
}

export const TAB_PATHS: Record<MainActiveTab, string> = {
  map: '/',
  sig_mges: '/base-mg-es',
  stats: '/estatisticas',
  audit: '/auditoria',
  import: '/importar',
  about: '/sobre',
  admin: '/admin',
  company_admin: '/empresa'
};

export const APP_ROUTE_LIST = [
  { path: '/', tab: 'map' },
  { path: '/base-mg-es', tab: 'sig_mges', requiresApprovedAccess: true },
  { path: '/estatisticas', tab: 'stats', requiresApprovedAccess: true },
  { path: '/auditoria', tab: 'audit', requiresApprovedAccess: true },
  { path: '/importar', tab: 'map', requiresApprovedAccess: true, importer: true },
  { path: '/sobre', tab: 'about' },
  { path: '/admin', tab: 'admin', requiresSuperAdmin: true },
  { path: '/empresa', tab: 'company_admin', requiresCompanyAdmin: true },
  { path: '/ocorrencias/:id', tab: 'map', requiresApprovedAccess: true }
] as const;

export function resolveAppRoute(pathname: string): AppRouteMatch | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const staticRoute = APP_ROUTE_LIST.find(route => route.path === normalizedPath && !route.path.includes(':'));
  if (staticRoute) return staticRoute;

  const incidentMatch = normalizedPath.match(/^\/ocorrencias\/([^/]+)$/);
  if (incidentMatch) {
    try {
      const incidentRoute = APP_ROUTE_LIST.find(route => route.path === '/ocorrencias/:id');
      return {
        ...incidentRoute,
        tab: 'map',
        requiresApprovedAccess: true,
        incidentId: decodeURIComponent(incidentMatch[1])
      };
    } catch {
      return null;
    }
  }

  return null;
}

export function pathForTab(tab: MainActiveTab): string {
  return TAB_PATHS[tab];
}
