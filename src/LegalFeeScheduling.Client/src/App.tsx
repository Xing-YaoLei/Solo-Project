import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import QuoteEntry from './pages/QuoteEntry'
import QuoteReview from './pages/QuoteReview'
import QuoteProcessing from './pages/QuoteProcessing'
import QuoteReviewDetail from './pages/QuoteReviewDetail'
import HistoryQuery from './pages/HistoryQuery'
import Statistics from './pages/Statistics'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="quotes" element={<QuoteEntry />} />
        <Route path="review" element={<QuoteReview />} />
        <Route path="processing" element={<QuoteProcessing />} />
        <Route path="review-detail/:id" element={<QuoteReviewDetail />} />
        <Route path="history" element={<HistoryQuery />} />
        <Route path="statistics" element={<Statistics />} />
      </Route>
    </Routes>
  )
}

export default App
