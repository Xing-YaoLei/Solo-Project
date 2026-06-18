import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Vehicles from "@/pages/Vehicles"
import DiffCenter from "@/pages/DiffCenter"
import Turnover from "@/pages/Turnover"
import { useAppStore } from "@/store"

export default function App() {
  const fetchAll = useAppStore((s) => s.fetchAll)
  const apiConnected = useAppStore((s) => s.apiConnected)

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  return (
    <Router>
      {apiConnected && (
        <div
          className="fixed bottom-3 right-3 z-50 rounded-full px-3 py-1 text-[10px] font-medium"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "var(--accent-green)" }}
        >
          API 已连接
        </div>
      )}
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
