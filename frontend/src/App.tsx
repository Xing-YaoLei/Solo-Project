import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Activity from "@/pages/Activity";
import RiskEvents from "@/pages/RiskEvents";
import Residents from "@/pages/Residents";
import ThresholdSettings from "@/pages/ThresholdSettings";
import FallReview from "@/pages/FallReview";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="activity" element={<Activity />} />
          <Route path="risk" element={<RiskEvents />} />
          <Route path="residents" element={<Residents />} />
          <Route path="settings/thresholds" element={<ThresholdSettings />} />
          <Route path="review/fall/:id" element={<FallReview />} />
        </Route>
      </Routes>
    </Router>
  );
}
