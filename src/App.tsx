import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Analysis from '@/pages/Analysis';
import ImportData from '@/pages/ImportData';
import CaliberManagement from '@/pages/CaliberManagement';
import Workbench from '@/pages/Workbench';

export default function App() {
  return (
    <Router>
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
          <Route index element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'teacher']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="analysis" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'teacher']}>
              <Analysis />
            </ProtectedRoute>
          } />
          <Route path="workbench" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Workbench />
            </ProtectedRoute>
          } />
          <Route path="import" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <ImportData />
            </ProtectedRoute>
          } />
          <Route path="caliber" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <CaliberManagement />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
