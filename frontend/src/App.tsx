import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './stores/authStore';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import CalendarPage from './pages/CalendarPage';
import HearingListPage from './pages/HearingListPage';
import HearingDetailPage from './pages/HearingDetailPage';
import ConflictPage from './pages/ConflictPage';
import ReminderPage from './pages/ReminderPage';
import StatisticsPage from './pages/StatisticsPage';
import CapacityPage from './pages/CapacityPage';
import { useEffect } from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadUser, user } = useAuthStore();
  useEffect(() => { if (isAuthenticated && !user) loadUser(); }, [isAuthenticated, user, loadUser]);
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/calendar" />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="hearings" element={<HearingListPage />} />
          <Route path="hearings/:id" element={<HearingDetailPage />} />
          <Route path="conflicts" element={<ConflictPage />} />
          <Route path="reminders" element={<ReminderPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="capacity" element={<CapacityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
