import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import MedicationDict from './pages/admin/MedicationDict';
import VisitRules from './pages/admin/VisitRules';
import ActivityThresholds from './pages/admin/ActivityThresholds';
import ElderlyProfiles from './pages/business/ElderlyProfiles';
import RiskEvents from './pages/business/RiskEvents';
import MedicationSchedules from './pages/business/MedicationSchedules';
import CombinedQuery from './pages/query/CombinedQuery';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/medication-dict" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/admin/medication-dict" element={<MedicationDict />} />
          <Route path="/admin/visit-rules" element={<VisitRules />} />
          <Route path="/admin/activity-thresholds" element={<ActivityThresholds />} />
          <Route path="/business/elderly" element={<ElderlyProfiles />} />
          <Route path="/business/risk-events" element={<RiskEvents />} />
          <Route path="/business/medication-schedules" element={<MedicationSchedules />} />
          <Route path="/query/combined" element={<CombinedQuery />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
