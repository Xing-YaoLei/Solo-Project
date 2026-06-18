import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useUserStore } from '@/store/user';

import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import RiskMatrixPage from '@/pages/RiskMatrixPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import ManagementPage from '@/pages/ManagementPage';
import ReviewPage from '@/pages/ReviewPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useUserStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div className="font-display text-8xl font-bold bg-gradient-to-br from-brand-500 to-purple-500 bg-clip-text text-transparent mb-2">404</div>
      <h2 className="font-display text-2xl font-bold text-white mb-2">页面未找到</h2>
      <p className="text-sm text-slate-400 mb-6 max-w-sm">
        您访问的路径不存在或已被移除，请返回首页继续操作。
      </p>
      <button
        onClick={() => (window.location.href = '/dashboard')}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors shadow-glow-blue"
      >
        返回 Dashboard
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/risk-matrix" element={<RiskMatrixPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/management" element={<ManagementPage />} />
          <Route path="/review/:vin" element={<ReviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
