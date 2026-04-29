import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import AppLayout from '@/components/Layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import TrackingList from '@/pages/TrackingList';
import TrackingDetail from '@/pages/TrackingDetail';
import CostCalculator from '@/pages/CostCalculator';
import DocumentList from '@/pages/DocumentList';
import RiskAlerts from '@/pages/RiskAlerts';
import Settings from '@/pages/Settings';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <>{children}</>;
};

function App() {
  const { t } = useTranslation();
  const { checkAuth, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setLoading(false);
    };
    init();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip={t('app.loading')} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={
        isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Login />
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.DASHBOARD.slice(1)} element={<Dashboard />} />
        <Route path={ROUTES.TRACKING.slice(1)} element={<TrackingList />} />
        <Route path="tracking/:id" element={<TrackingDetail />} />
        <Route path={ROUTES.COST_CALCULATOR.slice(1)} element={<CostCalculator />} />
        <Route path={ROUTES.DOCUMENTS.slice(1)} element={<DocumentList />} />
        <Route path={ROUTES.RISK_ALERTS.slice(1)} element={<RiskAlerts />} />
        <Route path={ROUTES.SETTINGS.slice(1)} element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}

export default App;
