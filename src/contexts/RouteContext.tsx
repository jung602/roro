import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getRoutes } from '../services/routeQueryService';
import { SavedRoute } from '../types/route';
import { handleError } from '../utils/errorHandler';

interface RouteContextType {
  routes: SavedRoute[];
  loading: boolean;
  error: string | null;
  fetchRoutes: () => Promise<void>;
  getRouteById: (id: string) => SavedRoute | undefined;
  refreshRoutes: () => Promise<void>;
}

const RouteContext = createContext<RouteContextType>({
  routes: [],
  loading: false,
  error: null,
  fetchRoutes: async () => {},
  getRouteById: () => undefined,
  refreshRoutes: async () => {},
});

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedRoutes = await getRoutes();
      setRoutes(fetchedRoutes);
    } catch (err) {
      const errorDetails = handleError(err, 'route');
      setError(errorDetails.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로딩
  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  // ID로 경로 찾기
  const getRouteById = useCallback(
    (id: string) => routes.find(route => route.id === id),
    [routes]
  );

  // 데이터 갱신
  const refreshRoutes = useCallback(async () => {
    await fetchRoutes();
  }, [fetchRoutes]);

  return (
    <RouteContext.Provider
      value={{
        routes,
        loading,
        error,
        fetchRoutes,
        getRouteById,
        refreshRoutes,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRoutes = () => useContext(RouteContext); 