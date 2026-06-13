import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuthStore';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import Records from './pages/Records';
import MonthlyReview from './pages/MonthlyReview';
import Export from './pages/Export';
import Interruptions from './pages/Interruptions';

function App() {
  const { token } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/records" replace />} />
        <Route path="records" element={<Records />} />
        <Route path="monthly-review" element={<MonthlyReview />} />
        <Route path="export" element={<Export />} />
        <Route path="interruptions" element={<Interruptions />} />
      </Route>
      <Route path="*" element={<Navigate to="/records" replace />} />
    </Routes>
  );
}

export default App;
