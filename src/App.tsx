import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import GamePage from '@/pages/GamePage'
import ResultPage from '@/pages/ResultPage'
import ReviewPage from '@/pages/ReviewPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  return (
    <Router>
      <div className="dark min-h-screen bg-[#1a1a2e] text-[#f5f0e8]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:levelId" element={<GamePage />} />
          <Route path="/result/:levelId" element={<ResultPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  )
}
