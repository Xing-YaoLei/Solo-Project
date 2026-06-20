import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { LevelSelectPage } from '@/pages/LevelSelectPage';
import { GamePlayPage } from '@/pages/GamePlayPage';
import { ReviewPage } from '@/pages/ReviewPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/levels" element={<LevelSelectPage />} />
        <Route path="/play/:levelId" element={<GamePlayPage />} />
        <Route path="/play/:levelId/review" element={<ReviewPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}
