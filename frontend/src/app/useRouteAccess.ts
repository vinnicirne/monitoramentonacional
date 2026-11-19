import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppRouteMatch } from './routes';

interface RouteAccessOptions {
  route: AppRouteMatch | null;
  authLoading: boolean;
  signedIn: boolean;
  hasFullAccess: boolean;
  isAdmin: boolean;
  isCompanyAdmin: boolean;
  setAccessDeniedMessage: (message: string | null) => void;
  openAuthModal: (reason?: string, onApprovedCallback?: () => void) => void;
}

export function useRouteAccess({
  route,
  authLoading,
  signedIn,
  hasFullAccess,
  isAdmin,
  isCompanyAdmin,
  setAccessDeniedMessage,
  openAuthModal
}: RouteAccessOptions) {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingAccessPath = useRef<string | null>(null);
  const requiresRole = route?.requiresSuperAdmin || route?.requiresCompanyAdmin;
  const isProtected = Boolean(requiresRole || route?.requiresApprovedAccess);
  const checkingAccess = isProtected && authLoading;
  const needsSignIn = Boolean((requiresRole && !signedIn) || (route?.requiresApprovedAccess && !hasFullAccess));
  const denialMessage = route?.requiresSuperAdmin && !isAdmin
    ? 'Esta área é exclusiva do SuperAdmin. Você foi redirecionado para a página inicial.'
    : route?.requiresCompanyAdmin && !isCompanyAdmin && !isAdmin
      ? 'Esta área é exclusiva dos administradores da empresa. Você foi redirecionado para a página inicial.'
      : null;
  const destination = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (checkingAccess) return;
    if (needsSignIn) {
      if (pendingAccessPath.current !== destination) {
        pendingAccessPath.current = destination;
        setAccessDeniedMessage(null);
        navigate('/', { replace: true });
        openAuthModal('Entre ou crie sua conta para acessar esta área.', () => navigate(destination));
      }
      return;
    }
    pendingAccessPath.current = null;
    if (denialMessage) {
      setAccessDeniedMessage(denialMessage);
      navigate('/', { replace: true });
    }
  }, [checkingAccess, needsSignIn, destination, denialMessage, navigate, setAccessDeniedMessage, openAuthModal]);

  const canRenderRoute = !checkingAccess && !needsSignIn && !denialMessage;
  return { canRenderRoute, showImporter: canRenderRoute && Boolean(route?.importer) };
}
