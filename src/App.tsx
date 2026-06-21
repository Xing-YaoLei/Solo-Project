import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import LevelSelect from "@/pages/LevelSelect";
import PracticeSetup from "@/pages/PracticeSetup";
import GamePage from "@/pages/GamePage";
import RecordsPage from "@/pages/RecordsPage";
import ConfigPage from "@/pages/ConfigPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/levels" element={<LevelSelect />} />
        <Route path="/practice" element={<PracticeSetup />} />
        <Route path="/game/:mode/:levelId?" element={<GamePage />} />
        <Route path="/game/:mode" element={<GamePage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
