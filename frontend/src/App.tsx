import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Vehicles from '@/pages/Vehicles';
import WorkOrders from '@/pages/WorkOrders';
import Diagnoses from '@/pages/Diagnoses';
import Parts from '@/pages/Parts';
import StockAlerts from '@/pages/StockAlerts';
import Quotes from '@/pages/Quotes';
import Analytics from '@/pages/Analytics';

const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children || <Outlet />}</>;
};

const ManagerRoute: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  if (!user?.roles.includes('Manager')) {
    return <Navigate to="/" replace />;
  }
  return <Analytics />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="workorders" element={<WorkOrders />} />
        <Route path="diagnoses" element={<Diagnoses />} />
        <Route path="parts" element={<Parts />} />
        <Route path="stock-alerts" element={<StockAlerts />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="analytics" element={<ManagerRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
