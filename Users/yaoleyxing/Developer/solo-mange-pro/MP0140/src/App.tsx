import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import LevelSelect from "@/pages/LevelSelect";
import Game from "@/pages/Game";
import Settings from "@/pages/Settings";
import Review from "@/pages/Review";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/levels/:mode" element={<LevelSelect />} />
        <Route path="/game/:levelId" element={<Game />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/review" element={<Review />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
