import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuPage from '@/pages/Menu';
import GamePage from '@/pages/Game';
import SettlementPage from '@/pages/Settlement';
import StatsPage from '@/pages/Stats';
import ReplayPage from '@/pages/Replay';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/settlement" element={<SettlementPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/replay" element={<ReplayPage />} />
        <Route
          path="*"
          element={
            <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
              <div className="text-6xl font-bold text-gray-700 mb-4">404</div>
              <div className="text-gray-500 mb-6">页面不存在</div>
              <a
                href="/"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-all hover:scale-105"
              >
                返回首页
              </a>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
