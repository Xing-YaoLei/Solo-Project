import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import DrilldownPage from '@/pages/DrilldownPage'
import RejectionPage from '@/pages/RejectionPage'
import ViewsPage from '@/pages/ViewsPage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/drilldown" element={<DrilldownPage />} />
          <Route path="/rejection" element={<RejectionPage />} />
          <Route path="/views" element={<ViewsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}
