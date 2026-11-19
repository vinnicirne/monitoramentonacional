import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { pathForTab, resolveAppRoute, type MainActiveTab } from './routes';

export function useAppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = useMemo(() => resolveAppRoute(location.pathname), [location.pathname]);
  const activeTab = route?.tab ?? 'map';

  const setActiveTab = useCallback((tab: MainActiveTab) => {
    const destination = pathForTab(tab);
    if (location.pathname !== destination || location.search) navigate(destination);
  }, [location.pathname, location.search, navigate]);

  return { activeTab, setActiveTab, location, navigate, route };
}
