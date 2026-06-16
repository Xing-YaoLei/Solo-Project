import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import BillList from './pages/BillList';
import BillDetail from './pages/BillDetail';
import TreatmentCalendarPage from './pages/TreatmentCalendarPage';
import DevicesPage from './pages/DevicesPage';
import ExceptionsPage from './pages/ExceptionsPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout>
                <Navigate to="/dashboard" replace />
              </MainLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          />
          <Route
            path="/bills"
            element={
              <MainLayout>
                <BillList />
              </MainLayout>
            }
          />
          <Route
            path="/bills/:id"
            element={
              <MainLayout>
                <BillDetail />
              </MainLayout>
            }
          />
          <Route
            path="/calendar"
            element={
              <MainLayout>
                <TreatmentCalendarPage />
              </MainLayout>
            }
          />
          <Route
            path="/devices"
            element={
              <MainLayout>
                <DevicesPage />
              </MainLayout>
            }
          />
          <Route
            path="/exceptions"
            element={
              <MainLayout>
                <ExceptionsPage />
              </MainLayout>
            }
          />
          <Route
            path="/statistics"
            element={
              <MainLayout>
                <StatisticsPage />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
