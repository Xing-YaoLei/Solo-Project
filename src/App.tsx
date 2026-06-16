import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Medication from '@/pages/Medication';
import Visits from '@/pages/Visits';
import Activities from '@/pages/Activities';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-[#0F1B2D]">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/medication" element={<Medication />} />
            <Route path="/visits" element={<Visits />} />
            <Route path="/activities" element={<Activities />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
