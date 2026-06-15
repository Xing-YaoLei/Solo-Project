import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from '@/pages/MainMenu';
import GameLevel from '@/pages/GameLevel';
import LoadingScreen from '@/pages/LoadingScreen';
import ReviewPage from '@/pages/ReviewPage';
import ReplayPage from '@/pages/ReplayPage';
import ReplayPlayer from '@/pages/ReplayPlayer';
import SettingsPage from '@/pages/SettingsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/game/:levelId" element={<GameLevel />} />
        <Route path="/loading" element={<LoadingScreen />} />
        <Route path="/review/:levelId" element={<ReviewPage />} />
        <Route path="/replay" element={<ReplayPage />} />
        <Route path="/replay/:replayId" element={<ReplayPlayer />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}
