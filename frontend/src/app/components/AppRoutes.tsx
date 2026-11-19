import { lazy, Suspense, useEffect, useLayoutEffect, useRef, type ComponentProps, type ReactNode, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import { recordDiagnostic } from '../../shared/diagnostics';
import type { AppRouteMatch } from '../routes';
import { NotFoundPage } from './NotFoundPage';

const InconsistencyAuditView = lazy(() => import('../../components/InconsistencyAuditView').then(module => ({ default: module.InconsistencyAuditView })));
const StatisticsRankingView = lazy(() => import('../../components/StatisticsRankingView').then(module => ({ default: module.StatisticsRankingView })));
const AboutMethodologyView = lazy(() => import('../../components/AboutMethodologyView').then(module => ({ default: module.AboutMethodologyView })));
const SigBaseMgEsPanel = lazy(() => import('../../components/SigBaseMgEsPanel').then(module => ({ default: module.SigBaseMgEsPanel })));
const AdminDashboardView = lazy(() => import('../../components/AdminDashboardView').then(module => ({ default: module.AdminDashboardView })));
const CompanyAdminView = lazy(() => import('../../components/CompanyAdminView').then(module => ({ default: module.CompanyAdminView })));

interface AppRoutesProps {
  route: AppRouteMatch | null;
  canRenderRoute: boolean;
  map: ReactNode;
  onGoHome: () => void;
  onOpenLicense: () => void;
  territorialView: ComponentProps<typeof StatisticsRankingView>;
  sigPanel: ComponentProps<typeof SigBaseMgEsPanel>;
  adminPanel: ComponentProps<typeof AdminDashboardView>;
  companyPanel: ComponentProps<typeof CompanyAdminView>;
}

function RouteLoading() {
  return (
    <div className="flex-1 grid place-items-center text-sm text-slate-500" role="status">
      Carregando painel…
    </div>
  );
}

function RouteReady({ target, navigationKey, starts }: {
  target: string;
  navigationKey: string;
  starts: RefObject<{ key: string; time: number; reported: boolean } | null>;
}) {
  useEffect(() => {
    const timing = starts.current;
    if (!timing || timing.key !== navigationKey || timing.reported) return;
    timing.reported = true;
    recordDiagnostic({ kind: 'route', target, durationMs: performance.now() - timing.time });
  }, [navigationKey, target, starts]);
  return null;
}

export function AppRoutes({
  route,
  canRenderRoute,
  map,
  onGoHome,
  onOpenLicense,
  territorialView,
  sigPanel,
  adminPanel,
  companyPanel
}: AppRoutesProps) {
  const { key } = useLocation();
  const starts = useRef<{ key: string; time: number; reported: boolean } | null>(null);
  useLayoutEffect(() => {
    starts.current = { key, time: performance.now(), reported: false };
  }, [key]);
  if (!route) return <><NotFoundPage onGoHome={onGoHome} /><RouteReady target="not-found" navigationKey={key} starts={starts} /></>;
  if (!canRenderRoute) return <RouteLoading />;

  let page: ReactNode;
  switch (route.tab) {
    case 'map':
      page = map;
      break;
    case 'sig_mges':
      page = (
        <div className="flex-1 overflow-y-auto bg-[#F5F5F5]">
          <SigBaseMgEsPanel {...sigPanel} />
        </div>
      );
      break;
    case 'audit':
      page = <InconsistencyAuditView {...territorialView} />;
      break;
    case 'stats':
      page = <StatisticsRankingView {...territorialView} />;
      break;
    case 'about':
      page = <AboutMethodologyView onOpenLicense={onOpenLicense} />;
      break;
    case 'admin':
      page = <AdminDashboardView {...adminPanel} />;
      break;
    case 'company_admin':
      page = <CompanyAdminView {...companyPanel} />;
      break;
  }
  const target = route.incidentId ? 'incident-dossier' : route.importer ? 'import' : route.tab;
  return (
    <Suspense fallback={<RouteLoading />}>
      {page}
      <RouteReady target={target} navigationKey={key} starts={starts} />
    </Suspense>
  );
}
