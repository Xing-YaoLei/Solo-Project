import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import PipelinePage from '@/pages/Pipeline';
import SeatmapPage from '@/pages/Seatmap';
import SponsorshipPage from '@/pages/Sponsorship';
import VerificationPage from '@/pages/Verification';
import TicketRankPage from '@/pages/TicketRank';
import RefundPage from '@/pages/Refund';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="seatmap" element={<SeatmapPage />} />
          <Route path="sponsorship" element={<SponsorshipPage />} />
          <Route path="verification" element={<VerificationPage />} />
          <Route path="ticket-rank" element={<TicketRankPage />} />
          <Route path="refund" element={<RefundPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
