import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import HomePage from "@/pages/HomePage";
import GamePage from "@/pages/GamePage";
import SettlementPage from "@/pages/SettlementPage";
import StatsPage from "@/pages/StatsPage";
import ReviewPage from "@/pages/ReviewPage";
import AdminPage from "@/pages/AdminPage";
import { useConfigStore } from "@/stores/useConfigStore";

export default function App() {
  const loadConfigs = useConfigStore((s) => s.loadConfigs);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:levelId" element={<GamePage />} />
        <Route path="/settlement/:levelId" element={<SettlementPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}
