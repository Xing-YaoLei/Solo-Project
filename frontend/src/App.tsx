import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PatientArchive from './pages/PatientArchive';
import MedicalRecord from './pages/MedicalRecord';
import TreatmentPlan from './pages/TreatmentPlan';
import WarningThreshold from './pages/WarningThreshold';
import NoShowReview from './pages/NoShowReview';
import CaliberConflict from './pages/CaliberConflict';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<PatientArchive />} />
          <Route path="/medical-records" element={<MedicalRecord />} />
          <Route path="/treatment-plans" element={<TreatmentPlan />} />
          <Route path="/warnings" element={<WarningThreshold />} />
          <Route path="/no-show-reviews" element={<NoShowReview />} />
          <Route path="/conflicts" element={<CaliberConflict />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
