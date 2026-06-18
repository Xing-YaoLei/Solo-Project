import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import ScheduleDashboard from '@/pages/ScheduleDashboard';
import PartsShortage from '@/pages/PartsShortage';
import Statistics from '@/pages/Statistics';
import AppointmentForm from '@/pages/AppointmentForm';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<ScheduleDashboard />} />
        <Route path="/parts-shortage" element={<PartsShortage />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/appointment/new" element={<AppointmentForm />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
