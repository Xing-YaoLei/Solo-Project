import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Game from './pages/Game.jsx'
import Review from './pages/Review.jsx'
import Statistics from './pages/Statistics.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game/:level" element={<Game />} />
      <Route path="/review" element={<Review />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
