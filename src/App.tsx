import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ShareAccess from './pages/ShareAccess';
import Dashboard from './pages/Dashboard';
import PaymentFlow from './pages/PaymentFlow';
import RiskMonitoring from './pages/RiskMonitoring';
import DataExport from './pages/DataExport';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/share/:token" element={<ShareAccess />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="payment" element={<PaymentFlow />} />
          <Route path="risk" element={<RiskMonitoring />} />
          <Route path="export" element={<DataExport />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
