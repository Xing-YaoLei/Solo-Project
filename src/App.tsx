import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Vehicles from "@/pages/Vehicles"
import DiffCenter from "@/pages/DiffCenter"
import Turnover from "@/pages/Turnover"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/diff" element={<DiffCenter />} />
          <Route path="/turnover" element={<Turnover />} />
        </Route>
      </Routes>
    </Router>
  )
}
