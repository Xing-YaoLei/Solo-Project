import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MainMenu } from "@/pages/MainMenu";
import { GameScene } from "@/pages/GameScene";
import { Review } from "@/pages/Review";
import { Settings } from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/game" element={<GameScene />} />
        <Route path="/review/:id" element={<Review />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<MainMenu />} />
      </Routes>
    </Router>
  );
}
