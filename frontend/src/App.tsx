import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Repair from './pages/Repair';
import DataImport from './pages/DataImport';
import CaliberVersion from './pages/CaliberVersion';
import { useStore } from './store';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { loading, checkAuth } = useStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    init();
  }, [checkAuth]);

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="repair" element={<Repair />} />
        <Route path="data-import" element={<DataImport />} />
        <Route path="caliber-version" element={<CaliberVersion />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
